# Batch Resilience Analyzer

Batch analyze company resilience and optionality scores using Complexity Investing framework.

## Quick Start

1. Install dependencies: `npm install`
2. Set environment variables (see below)
3. Run development: `npm run dev`
4. Visit: `http://localhost:3000/batch`

## Features

- **Resilience Score (1-10)**: Company adaptability and durability
- **Optionality Score (1-10)**: Growth potential through adjacent markets  
- **Configurable Batch Processing**: Analyze up to your specified limit (default 500) companies at once
- **CSV File Upload**: Upload ticker symbols from CSV files for easy batch processing
- **Progress Tracking**: Real-time progress indicators for large batches
- **Smart Warnings**: Automatic time estimates and warnings for large batches
- **CSV Export**: Download results for further analysis
- **Dynamic Batch Limits**: Configurable via environment variables

## Usage

### Manual Input
Enter ticker symbols separated by commas: `AAPL, MSFT, GOOGL, AMZN`

### CSV Upload
Upload a CSV file containing ticker symbols. The app supports:
- CSV files with or without headers
- Multiple columns (automatically detects ticker columns)
- Common delimiters (comma, semicolon, tab)
- Download a sample CSV template from the interface

**Example CSV formats:**
```
Ticker,Company Name
AAPL,Apple Inc
MSFT,Microsoft Corporation
```

or simply:
```
AAPL
MSFT
GOOGL
```

### Combined Input
You can use both manual input and CSV upload together - duplicates are automatically removed.

**Batch Size Recommendations:**
- **1-50 companies**: ~30-60 seconds
- **51-100 companies**: ~1-2 minutes  
- **101-250 companies**: ~2-4 minutes
- **251+ companies**: ~4-8 minutes

## Environment Variables

Create a `.env.local` file in the root directory:

```env
# Required: Anthropic API key
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Optional: Maximum batch size limit (default: 500)
BATCH_SIZE_LIMIT=500

# Optional: Default AI model (default: claude-sonnet-4-20250514)
DEFAULT_MODEL=claude-sonnet-4-20250514
```

### Environment Variable Details

- **`ANTHROPIC_API_KEY`** (Required): Your Anthropic API key for Claude AI
- **`BATCH_SIZE_LIMIT`** (Optional): Maximum number of companies that can be analyzed in a single batch
  - Default: 500
  - Recommended range: 100-1000
  - Higher values may increase processing time and API costs
- **`DEFAULT_MODEL`** (Optional): Default AI model to use for analysis
  - Default: `claude-sonnet-4-20250514` (Claude Sonnet 4)
  - Available models:
    - `claude-sonnet-4-20250514` - Claude Sonnet 4 (Latest and most capable)
    - `claude-opus-4-20250514` - Claude Opus 4 (Most powerful for complex analysis)
    - `claude-3-5-sonnet-20241022` - Claude 3.5 Sonnet
    - `claude-3-opus-20240229` - Claude 3 Opus
    - `claude-3-sonnet-20240229` - Claude 3 Sonnet

## Performance Considerations

**Batch Size vs Processing Time:**
- Small batches (1-50): Fast processing, good for testing
- Medium batches (51-100): Balanced performance and coverage
- Large batches (101-500): Ideal for comprehensive analysis like S&P 500
- Very large batches (500+): Consider API rate limits and costs

**Cost Optimization:**
- Processing 500 S&P 500 companies costs approximately $0.68
- Cost scales roughly linearly with batch size
- Single large batch is more cost-effective than multiple small batches

## Deployment

This app is designed to deploy easily on Vercel:

1. Push to GitHub
2. Import in Vercel
3. Add environment variables:
   - `ANTHROPIC_API_KEY` (required)
   - `BATCH_SIZE_LIMIT` (optional, default: 500)
   - `DEFAULT_MODEL` (optional, default: claude-sonnet-4-20250514)
4. Deploy

## API Endpoints

### POST `/api/batch-scores`
Analyze a batch of company tickers.

**Request:**
```json
{
  "tickers": ["AAPL", "MSFT", "GOOGL"],
  "model": "claude-3-5-sonnet-20241022"
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "ticker": "AAPL",
      "company_name": "Apple Inc.",
      "resilience_score": 8.5,
      "optionality_score": 7.0,
      "notes": "Strong ecosystem and diversification"
    }
  ],
  "processed_count": 3,
  "requested_count": 3,
  "batch_size_limit": 500,
  "timestamp": "2025-01-08T..."
}
```

### GET `/api/batch-scores`
Get batch configuration.

**Response:**
```json
{
  "batch_size_limit": 500,
  "estimated_time_per_100_companies": "30-60 seconds"
}
```

## Tech Stack

- Next.js 14
- React 18
- Tailwind CSS
- Lucide React Icons
- Claude AI (Anthropic)

## New Features

### CSV File Upload
- Upload CSV files containing ticker symbols
- Smart detection of ticker columns
- Support for various CSV formats and delimiters
- Download sample CSV template
- Combine manual input with CSV uploads

### Progress Tracking
- Real-time progress indicators during analysis
- Stage-by-stage updates (Preparing → Processing → Finalizing)
- Visual progress bar with percentage completion

### Smart Warnings
- Automatic time estimates based on batch size
- Warning levels for large batches:
  - **Info** (51-100 companies): Medium batch notification
  - **Warning** (101-250 companies): Large batch warning
  - **High** (251+ companies): Very large batch advisory

### Enhanced User Experience
- Dynamic batch size limits from environment
- Improved error handling and validation
- Better mobile responsiveness
- Contextual help and guidance

Built with ❤️ using Complexity Investing framework.