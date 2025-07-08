'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  TrendingUp,
  Rocket,
  Building2,
  Loader2,
  Download,
  Copy,
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  Activity,
  Target,
  ArrowLeft,
  Home,
  Clock,
  AlertTriangle,
  Info
} from 'lucide-react';

export default function BatchScores() {
  const [tickerInput, setTickerInput] = useState('');
  const [model, setModel] = useState('claude-3-5-sonnet-20241022');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [batchSizeLimit, setBatchSizeLimit] = useState(500);
  const [analysisProgress, setAnalysisProgress] = useState({ stage: '', progress: 0 });

  const models = [
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: 'Best available - excellent intelligence and speed' },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'Highest intelligence for complex analysis' },
    { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', description: 'Good balance of performance and cost' }
  ];

  const exampleTickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX'];

  // Fetch batch configuration on component mount
  useEffect(() => {
    const fetchBatchConfig = async () => {
      try {
        const response = await fetch('/api/batch-scores');
        const config = await response.json();
        setBatchSizeLimit(config.batch_size_limit);
      } catch (err) {
        console.error('Failed to fetch batch config:', err);
        // Keep default of 500 if fetch fails
      }
    };
    
    fetchBatchConfig();
  }, []);

  const processTickerInput = (input) => {
    return input
      .toUpperCase()
      .split(/[,\s\n]+/)
      .filter(ticker => ticker.trim())
      .slice(0, batchSizeLimit);
  };

  const getEstimatedTime = (tickerCount) => {
    if (tickerCount <= 20) return '15-30 seconds';
    if (tickerCount <= 50) return '30-60 seconds';
    if (tickerCount <= 100) return '1-2 minutes';
    if (tickerCount <= 250) return '2-4 minutes';
    return '4-8 minutes';
  };

  const getWarningLevel = (tickerCount) => {
    if (tickerCount <= 50) return null;
    if (tickerCount <= 100) return 'info';
    if (tickerCount <= 250) return 'warning';
    return 'high';
  };

  const analyzeTickers = async () => {
    const tickers = processTickerInput(tickerInput);
    
    if (tickers.length === 0) {
      setError('Please enter at least one ticker symbol');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);
    
    // Progress tracking
    setAnalysisProgress({ stage: 'Preparing analysis...', progress: 10 });
    
    try {
      // Update progress
      setAnalysisProgress({ stage: 'Sending request to AI...', progress: 20 });
      
      const response = await fetch('/api/batch-scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tickers,
          model
        })
      });

      setAnalysisProgress({ stage: 'Processing response...', progress: 80 });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setAnalysisProgress({ stage: 'Finalizing results...', progress: 95 });
      
      // Small delay to show final progress
      setTimeout(() => {
        setResults(data.results);
        setAnalysisProgress({ stage: 'Complete!', progress: 100 });
      }, 500);

    } catch (err) {
      setError(err.message || 'An error occurred while analyzing tickers');
      setAnalysisProgress({ stage: '', progress: 0 });
    } finally {
      setTimeout(() => {
        setLoading(false);
        setAnalysisProgress({ stage: '', progress: 0 });
      }, 1000);
    }
  };

  const loadExampleTickers = () => {
    setTickerInput(exampleTickers.join(', '));
  };

  const clearInput = () => {
    setTickerInput('');
    setResults([]);
    setError('');
  };

  const downloadResults = () => {
    if (results.length === 0) return;
    
    const csv = [
      'Ticker,Company,Resilience Score,Optionality Score,Notes',
      ...results.map(r => 
        `${r.ticker},"${r.company_name}",${r.resilience_score},${r.optionality_score},"${r.notes}"`
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch_scores_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyResults = async () => {
    if (results.length === 0) return;
    
    const text = results.map(r => 
      `${r.ticker}: Resilience ${r.resilience_score}/10, Optionality ${r.optionality_score}/10`
    ).join('\n');
    
    try {
      await navigator.clipboard.writeText(text);
      alert('Results copied to clipboard!');
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400';
    if (score >= 6) return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
    if (score >= 4) return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400';
    return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
  };

  const getScoreLabel = (score) => {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Fair';
    return 'Poor';
  };

  const currentTickerCount = processTickerInput(tickerInput).length;
  const warningLevel = getWarningLevel(currentTickerCount);
  const estimatedTime = getEstimatedTime(currentTickerCount);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(120,119,198,0.3),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,119,198,0.2),transparent_50%)]"></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10">
        {/* Header with Navigation */}
        <header className="py-8 text-center">
          <div className="max-w-6xl mx-auto px-6 flex items-center justify-between mb-8">
            <Link 
              href="/"
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </Link>
            
            <a 
              href="https://company-resilience-analyzer.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <Home className="w-5 h-5" />
              <span>Full Analysis</span>
            </a>
          </div>
          
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-500 rounded-2xl mb-6 shadow-2xl shadow-emerald-500/30">
            <BarChart3 className="w-12 h-12 text-white" />
          </div>
          
          <h1 className="text-6xl font-black mb-4">
            <span className="bg-gradient-to-r from-white via-emerald-200 to-blue-200 bg-clip-text text-transparent">
              Batch Score
            </span>
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
              Analyzer
            </span>
          </h1>
          
          <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Get resilience and optionality scores for multiple companies instantly. 
            Perfect for portfolio screening and competitive analysis.
          </p>
        </header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-6 py-8">
          {/* Input Section */}
          <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl p-8 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Input */}
              <div className="space-y-6">
                <div>
                  <label className="block text-white font-semibold mb-3 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-emerald-400" />
                    Ticker Symbols
                  </label>
                  <div className="relative">
                    <textarea
                      value={tickerInput}
                      onChange={(e) => setTickerInput(e.target.value)}
                      placeholder="Enter ticker symbols separated by commas or spaces&#10;Example: AAPL, MSFT, GOOGL, AMZN"
                      className="w-full h-32 px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                    />
                    {tickerInput && (
                      <button
                        onClick={clearInput}
                        className="absolute top-3 right-3 p-1 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="flex gap-2 mt-2 items-center flex-wrap">
                    <button
                      onClick={loadExampleTickers}
                      className="text-sm px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition"
                    >
                      Load Examples
                    </button>
                    <div className="text-sm text-white/60 flex items-center">
                      {currentTickerCount}/{batchSizeLimit} tickers
                    </div>
                    {currentTickerCount > 0 && (
                      <div className="flex items-center gap-1 text-sm text-white/60">
                        <Clock className="w-3 h-3" />
                        <span>~{estimatedTime}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Batch Size Warning */}
                {warningLevel && (
                  <div className={`flex items-start gap-3 p-4 rounded-xl border ${
                    warningLevel === 'info' 
                      ? 'bg-blue-500/20 border-blue-400/50 text-blue-200'
                      : warningLevel === 'warning'
                      ? 'bg-amber-500/20 border-amber-400/50 text-amber-200'
                      : 'bg-red-500/20 border-red-400/50 text-red-200'
                  }`}>
                    {warningLevel === 'info' ? (
                      <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="text-sm">
                      <div className="font-medium mb-1">
                        {warningLevel === 'info' && 'Medium Batch Size'}
                        {warningLevel === 'warning' && 'Large Batch Warning'}
                        {warningLevel === 'high' && 'Very Large Batch'}
                      </div>
                      <div>
                        {currentTickerCount > 250 
                          ? `Analyzing ${currentTickerCount} companies will take ${estimatedTime}. Consider starting with a smaller batch to test.`
                          : currentTickerCount > 100
                          ? `This analysis will take approximately ${estimatedTime}. Please be patient.`
                          : `Analysis will take approximately ${estimatedTime}.`
                        }
                      </div>
                    </div>
                  </div>
                )}

                {/* Model Selection */}
                <div>
                  <label className="block text-white font-semibold mb-3">AI Model</label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                  >
                    {models.map((m) => (
                      <option key={m.id} value={m.id} className="bg-slate-800 text-white">
                        {m.name} - {m.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="flex items-center gap-3 p-4 bg-red-500/20 border border-red-400/50 text-red-200 rounded-xl">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              {/* Right Column - Info & Action */}
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 rounded-2xl p-6 border border-emerald-400/20">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-400" />
                    What You'll Get
                  </h3>
                  <div className="space-y-3 text-sm text-white/80">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                      <span><strong>Resilience Score:</strong> Adaptability & durability (1-10)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span><strong>Optionality Score:</strong> Growth potential & opportunities (1-10)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                      <span><strong>Brief Notes:</strong> Key rationale for scores</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <h3 className="text-white font-semibold mb-3">Quick Facts</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-400">~10s</div>
                      <div className="text-white/60">Per Ticker</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">{batchSizeLimit}</div>
                      <div className="text-white/60">Max Batch</div>
                    </div>
                  </div>
                </div>

                {/* Progress Indicator */}
                {loading && analysisProgress.stage && (
                  <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-6 border border-purple-400/20">
                    <div className="flex items-center gap-3 mb-3">
                      <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                      <span className="text-white font-medium">{analysisProgress.stage}</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${analysisProgress.progress}%` }}
                      ></div>
                    </div>
                    <div className="text-sm text-white/60 mt-2">
                      Analyzing {currentTickerCount} companies...
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={analyzeTickers}
                  disabled={currentTickerCount === 0 || loading}
                  className="w-full bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 hover:from-emerald-700 hover:via-blue-700 hover:to-purple-700 text-white px-6 py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] shadow-2xl"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Analyzing {currentTickerCount} tickers...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      <BarChart3 className="w-5 h-5" />
                      <span>Analyze {currentTickerCount} Tickers</span>
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Results Section */}
          {results.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              {/* Results Header */}
              <div className="bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 text-white p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">Batch Analysis Results</h2>
                    <p className="text-emerald-100">Analyzed {results.length} companies</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={downloadResults}
                      className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
                    >
                      <Download className="w-4 h-4" />
                      CSV
                    </button>
                    <button
                      onClick={copyResults}
                      className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
                    >
                      <Copy className="w-4 h-4" />
                      Copy
                    </button>
                  </div>
                </div>
              </div>

              {/* Results Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-100 dark:bg-slate-800">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-600 dark:text-slate-300">Company</th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-slate-600 dark:text-slate-300">
                        <div className="flex items-center justify-center gap-1">
                          <Activity className="w-4 h-4" />
                          Resilience
                        </div>
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-slate-600 dark:text-slate-300">
                        <div className="flex items-center justify-center gap-1">
                          <Target className="w-4 h-4" />
                          Optionality
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-600 dark:text-slate-300">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {results.map((result, index) => (
                      <tr key={result.ticker} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100">{result.ticker}</div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">{result.company_name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-semibold ${getScoreColor(result.resilience_score)}`}>
                            <span className="text-lg">{result.resilience_score}</span>
                            <span className="text-xs">/10</span>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {getScoreLabel(result.resilience_score)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-semibold ${getScoreColor(result.optionality_score)}`}>
                            <span className="text-lg">{result.optionality_score}</span>
                            <span className="text-xs">/10</span>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {getScoreLabel(result.optionality_score)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-700 dark:text-slate-300 max-w-xs">
                            {result.notes}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Stats */}
              <div className="bg-slate-50 dark:bg-slate-800 px-6 py-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
                  <div>
                    <div className="font-bold text-slate-600 dark:text-slate-300">Avg Resilience</div>
                    <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {(results.reduce((sum, r) => sum + r.resilience_score, 0) / results.length).toFixed(1)}
                    </div>
                  </div>
                  <div>
                    <div className="font-bold text-slate-600 dark:text-slate-300">Avg Optionality</div>
                    <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {(results.reduce((sum, r) => sum + r.optionality_score, 0) / results.length).toFixed(1)}
                    </div>
                  </div>
                  <div>
                    <div className="font-bold text-slate-600 dark:text-slate-300">High Resilience</div>
                    <div className="text-lg font-semibold text-emerald-600">
                      {results.filter(r => r.resilience_score >= 7).length}
                    </div>
                  </div>
                  <div>
                    <div className="font-bold text-slate-600 dark:text-slate-300">High Optionality</div>
                    <div className="text-lg font-semibold text-blue-600">
                      {results.filter(r => r.optionality_score >= 7).length}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}