// app/api/batch-scores/route.js - Updated to handle ticker-only mode
import { NextResponse } from 'next/server';

export async function POST(request) {
  const startTime = Date.now();
  
  try {
    const { tickers, model, tickerOnlyMode } = await request.json();

    if (!tickers || !Array.isArray(tickers) || tickers.length === 0) {
      return NextResponse.json(
        { 
          error: 'No tickers provided',
          details: 'Please provide an array of ticker symbols to analyze.',
          suggestion: 'Check that your CSV file or manual input contains valid ticker symbols.'
        },
        { status: 400 }
      );
    }

    // Get batch size limit from environment variable, default to 500
    const batchSizeLimit = parseInt(process.env.BATCH_SIZE_LIMIT) || 500;

    // Limit batch size to prevent timeouts
    if (tickers.length > batchSizeLimit) {
      return NextResponse.json(
        { 
          error: `Batch size exceeds limit`,
          details: `You provided ${tickers.length} tickers, but the maximum allowed is ${batchSizeLimit}.`,
          suggestion: `Please reduce your batch size or split into multiple requests.`,
          provided_count: tickers.length,
          max_allowed: batchSizeLimit
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY is not configured');
      return NextResponse.json(
        { 
          error: 'API configuration error',
          details: 'The server is not properly configured with an API key.',
          suggestion: 'Please contact the site administrator or check your .env.local file.'
        },
        { status: 500 }
      );
    }

    console.log(`Processing ${tickers.length} tickers with model ${model || process.env.DEFAULT_MODEL || 'claude-sonnet-4-20250514'} in ${tickerOnlyMode ? 'ticker-only' : 'any company'} mode`);

    // Create appropriate prompt based on mode
    const BATCH_SCORING_PROMPT = tickerOnlyMode
      ? `You are a financial analyst using Complexity Investing framework. 

IMPORTANT: You are analyzing ${tickers.length} public company ticker symbols.

For each ticker symbol provided, evaluate and return ONLY two scores:

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

**Ticker symbols to analyze (${tickers.length} total):** ${tickers.join(', ')}

Return the JSON only - no other text. Include all ${tickers.length} companies in your response.`
      : `You are a financial analyst using Complexity Investing framework. 

IMPORTANT: You are analyzing ${tickers.length} companies. The input may contain:
- Public company ticker symbols (e.g., AAPL, MSFT)
- Private company names (e.g., OpenAI, Stripe, SpaceX)
- Full company names (e.g., "Hugging Face", "23andMe", "Berkshire Hathaway")

For each company identifier provided, evaluate and return ONLY two scores:

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

Notes:
- For private companies, use the company name as both "ticker" and add the full name in "company_name"
- If you recognize a ticker symbol, use the proper company name
- If given a company name, try to identify it and provide scores
- Include all ${tickers.length} companies in your response

**Companies to analyze (${tickers.length} total):** ${tickers.join(', ')}

Return the JSON only - no other text.`;

    // Adjust max_tokens based on batch size
    const maxTokens = Math.min(4000, Math.max(2000, tickers.length * 60));

    console.log(`Sending request to Anthropic API with ${maxTokens} max tokens...`);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model || process.env.DEFAULT_MODEL || 'claude-sonnet-4-20250514',
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
    const apiResponseTime = Date.now() - startTime;
    console.log(`Anthropic API responded in ${apiResponseTime}ms`);

    if (!response.ok) {
      console.error('Anthropic API error:', data);
      
      // Handle specific error types
      if (response.status === 429) {
        return NextResponse.json(
          { 
            error: 'API rate limit exceeded',
            details: 'The AI service is currently overloaded. This usually happens during peak usage times.',
            suggestion: 'Please wait a few minutes and try again with a smaller batch size (try 10-20 tickers first).',
            retry_after: data.error?.retry_after || '60 seconds'
          },
          { status: 429 }
        );
      }

      if (response.status === 401) {
        return NextResponse.json(
          { 
            error: 'Invalid API key',
            details: 'The API key is invalid or has been revoked.',
            suggestion: 'Please check your ANTHROPIC_API_KEY in the .env.local file.'
          },
          { status: 401 }
        );
      }

      if (response.status === 500 || response.status === 502 || response.status === 503) {
        return NextResponse.json(
          { 
            error: 'AI service temporarily unavailable',
            details: `The AI service returned a ${response.status} error.`,
            suggestion: 'This is usually temporary. Please try again in a minute.',
            original_error: data.error?.message || 'Service error'
          },
          { status: response.status }
        );
      }

      // Generic error
      return NextResponse.json(
        { 
          error: 'AI service error',
          details: data.error?.message || `Received ${response.status} response from AI service`,
          suggestion: 'Try reducing the batch size or using a different model.',
          status_code: response.status
        },
        { status: response.status }
      );
    }

    // Parse the JSON response from Claude
    try {
      const aiResponse = data.content[0].text;
      console.log('Raw AI response length:', aiResponse.length);
      
      // Extract JSON from response (in case there's markdown formatting)
      const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) || aiResponse.match(/(\{[\s\S]*\})/);
      
      if (!jsonMatch) {
        console.error('No JSON found in AI response:', aiResponse.substring(0, 200));
        return NextResponse.json(
          { 
            error: 'Invalid AI response format',
            details: 'The AI did not return a properly formatted JSON response.',
            suggestion: 'This might be due to the batch being too large. Try with fewer tickers (10-20).',
            debug_info: aiResponse.substring(0, 200) + '...'
          },
          { status: 500 }
        );
      }

      const jsonText = jsonMatch[1];
      
      let scores;
      try {
        scores = JSON.parse(jsonText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Failed to parse:', jsonText.substring(0, 200));
        
        return NextResponse.json(
          { 
            error: 'Failed to parse AI response',
            details: `JSON parsing failed: ${parseError.message}`,
            suggestion: 'The AI response was malformed. Try with a smaller batch size.',
            parse_error: parseError.message,
            sample_response: jsonText.substring(0, 200) + '...'
          },
          { status: 500 }
        );
      }
      
      // Validate the response structure
      if (!scores.results || !Array.isArray(scores.results)) {
        console.error('Invalid response structure:', scores);
        return NextResponse.json(
          { 
            error: 'Invalid response structure',
            details: 'The AI response does not contain a "results" array.',
            suggestion: 'Try again with a smaller batch size.',
            received_structure: Object.keys(scores || {})
          },
          { status: 500 }
        );
      }

      // Check if we got results for all requested tickers
      const missingCount = tickers.length - scores.results.length;
      if (scores.results.length < tickers.length * 0.8) { // Allow for 20% missing due to unknown tickers
        console.warn(`Expected ${tickers.length} results, got ${scores.results.length}`);
        
        // Find which tickers are missing
        const returnedTickers = scores.results.map(r => r.ticker);
        const missingTickers = tickers.filter(t => !returnedTickers.includes(t));
        
        return NextResponse.json(
          { 
            error: 'Incomplete results',
            details: `Requested analysis for ${tickers.length} companies but only received ${scores.results.length} results.`,
            suggestion: tickerOnlyMode 
              ? 'Some tickers might be invalid. Please check that all entries are valid 1-5 letter ticker symbols.'
              : 'Some companies might be unrecognized. Try with well-known company names or tickers.',
            missing_tickers: missingTickers.slice(0, 10), // Show first 10 missing
            missing_count: missingCount
          },
          { status: 500 }
        );
      }

      // Validate individual scores
      const invalidScores = scores.results.filter(result => 
        !result.ticker ||
        !result.company_name ||
        typeof result.resilience_score !== 'number' ||
        typeof result.optionality_score !== 'number' ||
        result.resilience_score < 1 || result.resilience_score > 10 ||
        result.optionality_score < 1 || result.optionality_score > 10
      );

      if (invalidScores.length > 0) {
        console.error('Invalid scores found:', invalidScores);
        return NextResponse.json(
          { 
            error: 'Invalid score data',
            details: `${invalidScores.length} companies have invalid or missing scores.`,
            suggestion: 'Try again or use a different AI model.',
            invalid_entries: invalidScores.slice(0, 5).map(s => s.ticker || 'Unknown'),
            sample_invalid: invalidScores[0]
          },
          { status: 500 }
        );
      }

      const totalTime = Date.now() - startTime;
      console.log(`Successfully processed ${scores.results.length} companies in ${totalTime}ms`);

      return NextResponse.json({
        success: true,
        results: scores.results,
        processed_count: scores.results.length,
        requested_count: tickers.length,
        batch_size_limit: batchSizeLimit,
        processing_time_ms: totalTime,
        mode: tickerOnlyMode ? 'ticker-only' : 'any-company',
        timestamp: new Date().toISOString()
      });

    } catch (parseError) {
      console.error('Unexpected error in response processing:', parseError);
      return NextResponse.json(
        { 
          error: 'Unexpected processing error',
          details: parseError.message,
          suggestion: 'This is an unexpected error. Please try again with a smaller batch.',
          error_type: parseError.name
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Unexpected error in batch-scores API:', error);
    return NextResponse.json(
      { 
        error: 'Server error',
        details: error.message || 'An unexpected error occurred',
        suggestion: 'Please check your input and try again. If the problem persists, contact support.',
        error_type: error.name || 'Unknown'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to return batch configuration
export async function GET() {
  const batchSizeLimit = parseInt(process.env.BATCH_SIZE_LIMIT) || 500;
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
  const defaultModel = process.env.DEFAULT_MODEL || 'claude-sonnet-4-20250514';
  
  return NextResponse.json({
    batch_size_limit: batchSizeLimit,
    default_model: defaultModel,
    estimated_time_per_100_companies: "30-60 seconds",
    api_configured: hasApiKey,
    available_models: [
      'claude-sonnet-4-20250514',
      'claude-opus-4-20250514',
      'claude-3-5-sonnet-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229'
    ]
  });
}