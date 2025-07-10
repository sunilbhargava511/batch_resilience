import { NextResponse } from 'next/server';
import { Client } from '@upstash/qstash';

const qstash = new Client({
  token: process.env.QSTASH_TOKEN,
});

export async function POST(request) {
  try {
    const { tickers, model, email, tickerOnlyMode } = await request.json();

    if (!email || !tickers || tickers.length === 0) {
      return NextResponse.json(
        { error: 'Email and tickers are required' },
        { status: 400 }
      );
    }

    // Reduce batch size to 15 for better reliability
    const batchSize = 15;
    const batches = [];
    for (let i = 0; i < tickers.length; i += batchSize) {
      batches.push(tickers.slice(i, i + batchSize));
    }

    const jobId = `job_${Date.now()}`;
    
    // Use your production URL
    const baseUrl = 'https://batch-resilience.vercel.app';

    console.log(`Creating batch job ${jobId} for ${tickers.length} ${tickerOnlyMode ? 'tickers' : 'companies'} in ${batches.length} batches of ${batchSize}`);
    console.log(`Mode: ${tickerOnlyMode ? 'ticker-only' : 'any-company'}`);
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
        results: [],
        tickerOnlyMode
      },
    });

    const estimatedMinutes = Math.ceil(batches.length * 0.5); // ~30 seconds per batch

    return NextResponse.json({
      success: true,
      jobId,
      message: `Processing ${tickers.length} ${tickerOnlyMode ? 'tickers' : 'companies'} in ${batches.length} batches`,
      estimatedTime: `${estimatedMinutes}-${estimatedMinutes + 2} minutes`,
      batchSize: batchSize,
      mode: tickerOnlyMode ? 'ticker-only' : 'any-company'
    });

  } catch (error) {
    console.error('Error creating batch job:', error);
    return NextResponse.json(
      { error: 'Failed to create batch job: ' + error.message },
      { status: 500 }
    );
  }
}