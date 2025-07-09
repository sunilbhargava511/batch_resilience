import { NextResponse } from 'next/server';
import { Client } from '@upstash/qstash';

const qstash = new Client({
  token: process.env.QSTASH_TOKEN,
});

export async function POST(request) {
  try {
    const { tickers, model, email } = await request.json();

    if (!email || !tickers || tickers.length === 0) {
      return NextResponse.json(
        { error: 'Email and tickers are required' },
        { status: 400 }
      );
    }

    // Split tickers into batches of 25
    const batchSize = 25;
    const batches = [];
    for (let i = 0; i < tickers.length; i += batchSize) {
      batches.push(tickers.slice(i, i + batchSize));
    }

    const jobId = `job_${Date.now()}`;
    
    // Use your production URL
    const baseUrl = 'https://batch-resilience.vercel.app';

    console.log(`Creating batch job ${jobId} for ${tickers.length} tickers in ${batches.length} batches`);
    console.log(`Webhook URL: ${baseUrl}/api/batch-processor`);

    // Queue the job
    await qstash.publishJSON({
      url: `${baseUrl}/api/batch-processor`,
      body: {
        jobId,
        batches,
        model,
        email,
        currentBatch: 0,
        results: []
      },
    });

    const estimatedMinutes = Math.ceil(batches.length * 0.75); // ~45 seconds per batch

    return NextResponse.json({
      success: true,
      jobId,
      message: `Processing ${tickers.length} tickers in ${batches.length} batches`,
      estimatedTime: `${estimatedMinutes}-${estimatedMinutes + 2} minutes`
    });

  } catch (error) {
    console.error('Error creating batch job:', error);
    return NextResponse.json(
      { error: 'Failed to create batch job: ' + error.message },
      { status: 500 }
    );
  }
}