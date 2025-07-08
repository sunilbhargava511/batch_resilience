// app/api/batch-scores/route.js - Improved batch scoring endpoint
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { tickers, model } = await request.json();

    if (!tickers || !Array.isArray(tickers) || tickers.length === 0) {
      return NextResponse.json(
        { error: 'Tickers array is required' },
        { status: 400 }
      );
    }

    // Get batch size limit from environment variable, default to 500
    const batchSizeLimit = parseInt(process.env.BATCH_SIZE_LIMIT) || 500;

    // Limit batch size to prevent timeouts
    if (tickers.length > batchSizeLimit) {
      return NextResponse.json(
        { error: `Maximum ${batchSizeLimit} tickers per batch` },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API configuration error. Please contact support.' },
        { status: 500 }
      );
    }

    // Enhanced prompt with clearer instructions for large batches
    const BATCH_SCORING_PROMPT = `You are a financial analyst using Complexity Investing framework. 

IMPORTANT: You are analyzing ${tickers.length} companies. For each company ticker symbol provided, evaluate and return ONLY two scores:

1. **Resilience Score (1-10)**: Overall ability to adapt and thrive in changing conditions
   - Consider: adaptability, financial strength, competitive moats, diversification
   - 10 = Extremely resilient (Amazon, Microsoft level)
   - 1 = Highly fragile

2. **Optionality Score (1-10)**: Potential for growth through adjacent markets and new opportunities
   - Consider: platform extensibility, adjacent market opportunities, innovation pipeline, strategic options
   - 10 = Exceptional optionality (many high-value expansion paths)
   - 1 = Very limited growth options

**CRITICAL: Respond ONLY in this exact JSON format with ALL ${tickers.length} companies:**

\`\`\`json
{
  "results": [
    {
      "ticker": "AAPL",
      "company_name": "Apple Inc.",
      "resilience_score": 8.5,
      "optionality_score": 7.0,
      "notes": "Brief 1-2 sentence rationale"
    }
  ]
}
\`\`\`

**Tickers to analyze (${tickers.length} total):** ${tickers.join(', ')}

Return the JSON only - no other text. Include all ${tickers.length} companies in your response.`;

    // Adjust max_tokens based on batch size
    const maxTokens = Math.min(4000, Math.max(2000, tickers.length * 60));

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model || 'claude-3-5-sonnet-20241022',
        max_tokens: maxTokens,
        messages: [
          {
            role: 'user',
            content: BATCH_SCORING_PROMPT
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || 'Analysis service temporarily unavailable' },
        { status: response.status }
      );
    }

    // Parse the JSON response from Claude
    try {
      const aiResponse = data.content[0].text;
      
      // Extract JSON from response (in case there's markdown formatting)
      const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) || aiResponse.match(/(\{[\s\S]*\})/);
      const jsonText = jsonMatch ? jsonMatch[1] : aiResponse;
      
      const scores = JSON.parse(jsonText);
      
      // Validate the response structure
      if (!scores.results || !Array.isArray(scores.results)) {
        throw new Error('Invalid response format');
      }

      // Check if we got results for all requested tickers
      if (scores.results.length < tickers.length * 0.8) { // Allow for 20% missing due to unknown tickers
        console.warn(`Expected ${tickers.length} results, got ${scores.results.length}`);
      }

      // Ensure all scores are within valid range
      scores.results.forEach(result => {
        if (result.resilience_score < 1 || result.resilience_score > 10 ||
            result.optionality_score < 1 || result.optionality_score > 10) {
          throw new Error('Scores must be between 1 and 10');
        }
      });

      return NextResponse.json({
        success: true,
        results: scores.results,
        processed_count: scores.results.length,
        requested_count: tickers.length,
        batch_size_limit: batchSizeLimit,
        timestamp: new Date().toISOString()
      });

    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse AI response. Please try again.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in batch-scores API:', error);
    return NextResponse.json(
      { error: 'Analysis service temporarily unavailable. Please try again.' },
      { status: 500 }
    );
  }
}

// GET endpoint to return batch configuration
export async function GET() {
  const batchSizeLimit = parseInt(process.env.BATCH_SIZE_LIMIT) || 500;
  
  return NextResponse.json({
    batch_size_limit: batchSizeLimit,
    estimated_time_per_100_companies: "30-60 seconds"
  });
}