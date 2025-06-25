# Batch Resilience Analyzer

Batch analyze company resilience and optionality scores using NZS Capital's Complexity Investing framework.

## Quick Start

1. Install dependencies: `npm install`
2. Set API key: `ANTHROPIC_API_KEY=your_key_here`
3. Run development: `npm run dev`
4. Visit: `http://localhost:3000/batch`

## Features

- **Resilience Score (1-10)**: Company adaptability and durability
- **Optionality Score (1-10)**: Growth potential through adjacent markets  
- **Batch Processing**: Analyze up to 20 companies at once
- **CSV Export**: Download results for further analysis

## Usage

Enter ticker symbols separated by commas: `AAPL, MSFT, GOOGL, AMZN`

## Environment Variables

Create a `.env.local` file in the root directory:

```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

## Deployment

This app is designed to deploy easily on Vercel:

1. Push to GitHub
2. Import in Vercel
3. Add `ANTHROPIC_API_KEY` environment variable
4. Deploy

## Tech Stack

- Next.js 14
- React 18
- Tailwind CSS
- Lucide React Icons
- Claude AI (Anthropic)

Built with ❤️ using NZS Capital's Complexity Investing framework.