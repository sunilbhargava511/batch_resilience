import { NextResponse } from 'next/server';
import { verifySignature } from '@upstash/qstash/nextjs';
import { Client } from '@upstash/qstash';
import { Resend } from 'resend';

const qstash = new Client({
  token: process.env.QSTASH_TOKEN,
});

const resend = new Resend(process.env.RESEND_API_KEY);

async function handler(request) {
  // Parse body once at the beginning
  const body = await request.json();
  const { jobId, batches, model, email, currentBatch, results } = body;

  try {
    console.log(`Processing batch ${currentBatch + 1} of ${batches.length} for job ${jobId}`);

    // Use your production URL
    const baseUrl = 'https://batch-resilience.vercel.app';

    const response = await fetch(`${baseUrl}/api/batch-scores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        tickers: batches[currentBatch], 
        model 
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Batch processing failed');
    }

    // Accumulate results
    const allResults = [...results, ...data.results];

    // Check if there are more batches
    if (currentBatch + 1 < batches.length) {
      // Queue next batch with 30-second delay
      await qstash.publishJSON({
        url: `${baseUrl}/api/batch-processor`,
        body: {
          jobId,
          batches,
          model,
          email,
          currentBatch: currentBatch + 1,
          results: allResults
        },
        delay: 30 // 30-second delay
      });

      console.log(`Queued batch ${currentBatch + 2} of ${batches.length}`);
    } else {
      // All batches complete - send email
      console.log(`All batches complete for job ${jobId}. Sending email to ${email}`);
      await sendResultsEmail(email, allResults, jobId);
    }

    return NextResponse.json({
      success: true,
      message: `Processed batch ${currentBatch + 1} of ${batches.length}`,
      processedCount: data.results.length
    });

  } catch (error) {
    console.error('Batch processor error:', error);
    
    // Try to send error email (using already parsed variables)
    try {
      await sendErrorEmail(email, jobId, error.message, results, currentBatch, batches.length);
    } catch (emailError) {
      console.error('Failed to send error email:', emailError);
    }

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

async function sendResultsEmail(email, results, jobId) {
  // Generate CSV content
  const csv = [
    'Ticker,Company Name,Resilience Score,Optionality Score,Notes',
    ...results.map(r => 
      `${r.ticker},"${r.company_name}",${r.resilience_score},${r.optionality_score},"${r.notes.replace(/"/g, '""')}"`
    )
  ].join('\n');

  // Calculate statistics
  const avgResilience = (results.reduce((sum, r) => sum + r.resilience_score, 0) / results.length).toFixed(1);
  const avgOptionality = (results.reduce((sum, r) => sum + r.optionality_score, 0) / results.length).toFixed(1);
  const highResilience = results.filter(r => r.resilience_score >= 7).length;
  const highOptionality = results.filter(r => r.optionality_score >= 7).length;

  const html = `
    <h2>Your Batch Analysis is Complete! 🎉</h2>
    
    <p>Successfully analyzed <strong>${results.length} companies</strong> using the Complexity Investing framework.</p>
    
    <h3>Summary Statistics:</h3>
    <table style="border-collapse: collapse; margin: 20px 0;">
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Average Resilience Score:</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${avgResilience}/10</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Average Optionality Score:</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${avgOptionality}/10</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>High Resilience (≥7):</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${highResilience} companies</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>High Optionality (≥7):</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${highOptionality} companies</td>
      </tr>
    </table>
    
    <p>The complete results are attached as a CSV file that you can open in Excel or Google Sheets.</p>
    
    <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
    
    <p style="color: #666; font-size: 12px;">
      Job ID: ${jobId}<br>
      Powered by Complexity Investing Framework<br>
      <a href="https://batch-resilience.vercel.app/">Run another analysis</a>
    </p>
  `;

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'Batch Analyzer <onboarding@resend.dev>',
    to: email,
    subject: `Analysis Complete: ${results.length} Companies Evaluated`,
    html: html,
    attachments: [
      {
        filename: `resilience_analysis_${new Date().toISOString().split('T')[0]}.csv`,
        content: Buffer.from(csv).toString('base64'),
      }
    ],
  });

  if (error) {
    throw new Error(`Email send failed: ${error.message}`);
  }

  console.log(`Email sent successfully: ${data.id}`);
}

async function sendErrorEmail(email, jobId, errorMessage, partialResults, failedBatch, totalBatches) {
  const html = `
    <h2>Batch Analysis Partially Failed</h2>
    
    <p>Your batch job encountered an error while processing.</p>
    
    <h3>Details:</h3>
    <ul>
      <li><strong>Job ID:</strong> ${jobId}</li>
      <li><strong>Failed at batch:</strong> ${failedBatch + 1} of ${totalBatches}</li>
      <li><strong>Error:</strong> ${errorMessage}</li>
      <li><strong>Successfully processed:</strong> ${partialResults?.length || 0} companies</li>
    </ul>
    
    ${partialResults && partialResults.length > 0 ? `
      <p>We've attached the partial results that were successfully processed before the error occurred.</p>
    ` : ''}
    
    <p>Please try again with a smaller batch size or contact support if the issue persists.</p>
  `;

  let attachments = [];
  if (partialResults && partialResults.length > 0) {
    const csv = [
      'Ticker,Company Name,Resilience Score,Optionality Score,Notes',
      ...partialResults.map(r => 
        `${r.ticker},"${r.company_name}",${r.resilience_score},${r.optionality_score},"${r.notes.replace(/"/g, '""')}"`
      )
    ].join('\n');

    attachments = [{
      filename: `partial_results_${new Date().toISOString().split('T')[0]}.csv`,
      content: Buffer.from(csv).toString('base64'),
    }];
  }

  await resend.emails.send({
    from: process.env.EMAIL_FROM || 'Batch Analyzer <onboarding@resend.dev>',
    to: email,
    subject: `Batch Analysis Error - Job ${jobId}`,
    html: html,
    attachments: attachments,
  });
}

// Re-enable signature verification when ready
// export const POST = verifySignature(handler);

// For now, keeping it without verification since it's working
export const POST = handler;