'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Info,
  FileSpreadsheet,
  FileText,
  Mail
} from 'lucide-react';

export default function BatchScores() {
  const [tickerInput, setTickerInput] = useState('');
  const [model, setModel] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [batchSizeLimit, setBatchSizeLimit] = useState(500);
  const [analysisProgress, setAnalysisProgress] = useState({ stage: '', progress: 0 });
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedTickers, setUploadedTickers] = useState([]);
  const [email, setEmail] = useState('');
  const [processingLargeBatch, setProcessingLargeBatch] = useState(false);
  const [batchJobInfo, setBatchJobInfo] = useState(null);
  const fileInputRef = useRef(null);

  const models = [
    { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', description: 'Latest and most capable - excellent intelligence and speed' },
    { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', description: 'Most powerful model for complex challenges' },
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: 'Previous generation - proven reliability' },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'High intelligence for complex analysis' },
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
        
        // Set default model from config or fallback
        if (config.default_model) {
          setModel(config.default_model);
        } else {
          setModel('claude-sonnet-4-20250514'); // Default to Sonnet 4
        }
      } catch (err) {
        console.error('Failed to fetch batch config:', err);
        // Keep default of 500 if fetch fails
        setModel('claude-sonnet-4-20250514'); // Default to Sonnet 4
      }
    };
    
    fetchBatchConfig();
  }, []);

  const processTickerInput = (input) => {
    const manualTickers = input
      .toUpperCase()
      .split(/[,\s\n]+/)
      .filter(ticker => ticker.trim());
    
    // Combine manual input with uploaded tickers, remove duplicates
    const allTickers = [...new Set([...manualTickers, ...uploadedTickers])];
    return allTickers.slice(0, batchSizeLimit);
  };

  const parseCSVFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const text = event.target.result;
          const lines = text.split(/\r?\n/).filter(line => line.trim());
          
          // Try to detect header row
          const firstLine = lines[0];
          const hasHeader = firstLine && (
            firstLine.toLowerCase().includes('ticker') ||
            firstLine.toLowerCase().includes('symbol') ||
            firstLine.toLowerCase().includes('stock') ||
            isNaN(firstLine.charAt(0))
          );
          
          const dataLines = hasHeader ? lines.slice(1) : lines;
          const tickers = [];
          
          dataLines.forEach(line => {
            // Handle different CSV formats
            const cells = line.split(/[,;\t]/).map(cell => cell.trim());
            
            // Look for ticker-like values (typically uppercase letters, 1-5 chars)
            cells.forEach(cell => {
              // Remove quotes if present
              const cleanCell = cell.replace(/["']/g, '').trim();
              
              // Check if it looks like a ticker symbol
              if (cleanCell && /^[A-Za-z]{1,5}$/.test(cleanCell)) {
                tickers.push(cleanCell.toUpperCase());
              }
            });
          });
          
          // Remove duplicates
          const uniqueTickers = [...new Set(tickers)];
          resolve(uniqueTickers);
        } catch (err) {
          reject(new Error('Failed to parse CSV file'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }
    
    setError('');
    setUploadedFile(file);
    
    try {
      const tickers = await parseCSVFile(file);
      
      if (tickers.length === 0) {
        setError('No valid ticker symbols found in CSV file');
        setUploadedFile(null);
        setUploadedTickers([]);
        return;
      }
      
      setUploadedTickers(tickers);
      
      // Show success message
      const message = `Loaded ${tickers.length} ticker${tickers.length > 1 ? 's' : ''} from ${file.name}`;
      console.log(message);
      
    } catch (err) {
      setError(err.message);
      setUploadedFile(null);
      setUploadedTickers([]);
    }
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
    setUploadedTickers([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
      setError('Please enter ticker symbols or upload a CSV file');
      return;
    }

    // For batches larger than 25, require email
    if (tickers.length > 25 && !email) {
      setError('Please enter your email address for batches larger than 25 tickers');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);
    
    try {
      if (tickers.length <= 25) {
        // Process small batches immediately (existing code)
        setAnalysisProgress({ stage: 'Preparing analysis...', progress: 10 });
        
        const response = await fetch('/api/batch-scores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tickers, model })
        });

        setAnalysisProgress({ stage: 'Processing response...', progress: 80 });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Analysis failed');
        }

        setAnalysisProgress({ stage: 'Finalizing results...', progress: 95 });
        setTimeout(() => {
          setResults(data.results);
          setAnalysisProgress({ stage: 'Complete!', progress: 100 });
        }, 500);

      } else {
        // Process large batches in background
        setProcessingLargeBatch(true);
        setAnalysisProgress({ stage: 'Submitting batch job...', progress: 20 });
        
        const response = await fetch('/api/batch-queue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            tickers, 
            model, 
            email 
          })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to create batch job');
        }

        setAnalysisProgress({ stage: 'Job submitted!', progress: 100 });
        
        // Set batch job info instead of fake results
        setBatchJobInfo({
          tickerCount: tickers.length,
          email: email,
          estimatedTime: data.estimatedTime,
          jobId: data.jobId
        });
        setResults([]);  // Clear any existing results
      }
    } catch (err) {
      setError(err.message || 'An error occurred while analyzing tickers');
      setAnalysisProgress({ stage: '', progress: 0 });
    } finally {
      setTimeout(() => {
        setLoading(false);
        setAnalysisProgress({ stage: '', progress: 0 });
        setProcessingLargeBatch(false);
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
    setBatchJobInfo(null);
    removeUploadedFile();
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

  const downloadSampleCSV = () => {
    const sampleCSV = [
      'Ticker,Company Name',
      'AAPL,Apple Inc',
      'MSFT,Microsoft Corporation',
      'GOOGL,Alphabet Inc',
      'AMZN,Amazon.com Inc',
      'TSLA,Tesla Inc'
    ].join('\n');
    
    const blob = new Blob([sampleCSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_tickers.csv';
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
                  
                  {/* Input Methods Tabs */}
                  <div className="flex gap-2 mb-4">
                    <div className="flex-1 relative">
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
                  </div>

                  {/* CSV Upload Section */}
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-white/80">
                        <FileSpreadsheet className="w-4 h-4 text-blue-400" />
                        <span>Or upload a CSV file</span>
                      </div>
                      <button
                        onClick={downloadSampleCSV}
                        className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded hover:bg-blue-500/30 transition"
                      >
                        Sample CSV
                      </button>
                    </div>
                    
                    {!uploadedFile ? (
                      <div className="relative">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".csv"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="csv-upload"
                        />
                        <label
                          htmlFor="csv-upload"
                          className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-white/5 border border-dashed border-white/20 rounded-lg text-white/60 hover:bg-white/10 hover:border-white/30 hover:text-white cursor-pointer transition"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Click to upload CSV</span>
                        </label>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between px-3 py-2 bg-emerald-500/20 border border-emerald-400/30 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-emerald-200">
                          <FileText className="w-4 h-4" />
                          <span>{uploadedFile.name}</span>
                          <span className="text-emerald-300 font-medium">
                            ({uploadedTickers.length} tickers)
                          </span>
                        </div>
                        <button
                          onClick={removeUploadedFile}
                          className="p-1 text-emerald-200 hover:text-white hover:bg-emerald-500/20 rounded transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    
                    <div className="text-xs text-white/50 mt-2">
                      CSV should contain ticker symbols. Headers are optional.
                    </div>
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
                      {uploadedTickers.length > 0 && (
                        <span className="ml-2 text-emerald-400">
                          ({uploadedTickers.length} from CSV)
                        </span>
                      )}
                    </div>
                    {currentTickerCount > 0 && (
                      <div className="flex items-center gap-1 text-sm text-white/60">
                        <Clock className="w-3 h-3" />
                        <span>~{estimatedTime}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Email input field for large batches */}
                {currentTickerCount > 15 && (
                  <div className="mt-4">
                    <label className="block text-white font-semibold mb-3 flex items-center gap-2">
                      <Mail className="w-5 h-5 text-emerald-400" />
                      Email for Results (Required for 15+ tickers)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      required={currentTickerCount > 15}
                    />
                    <p className="text-xs text-white/60 mt-2">
                      Large batches are processed in the background. Results will be emailed as a CSV file.
                    </p>
                  </div>
                )}

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
                  <h3 className="text-white font-semibold mb-3">Input Methods</h3>
                  <div className="space-y-3 text-sm text-white/70">
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-1.5"></div>
                      <span><strong>Manual:</strong> Type or paste tickers directly</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5"></div>
                      <span><strong>CSV Upload:</strong> Upload a file with ticker symbols</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-1.5"></div>
                      <span><strong>Combined:</strong> Use both methods together</span>
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
                      {currentTickerCount > 15 ? 'Submitting batch job...' : `Analyzing ${currentTickerCount} companies...`}
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
                      <span>Processing...</span>
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

          {/* Results Section for batch jobs */}
          {batchJobInfo && (
            <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl p-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full mb-4">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Batch Job Submitted Successfully!</h3>
                <p className="text-white/80 mb-4">
                  Processing {batchJobInfo.tickerCount} companies in the background
                </p>
                <div className="bg-emerald-500/20 border border-emerald-400/30 rounded-xl p-4 max-w-md mx-auto">
                  <p className="text-emerald-200 text-sm">
                    <strong>What happens next:</strong><br/>
                    1. Your batch will be processed in chunks of 15<br/>
                    2. Each chunk has a 30-second delay to respect API limits<br/>
                    3. Results will be emailed to <strong>{batchJobInfo.email}</strong><br/>
                    4. Estimated time: <strong>{batchJobInfo.estimatedTime}</strong><br/>
                    5. You can safely close this window
                  </p>
                </div>
                {batchJobInfo.jobId && (
                  <p className="text-white/60 text-sm mt-4">
                    Job ID: {batchJobInfo.jobId}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Regular Results Section */}
          {!batchJobInfo && results.length > 0 && (
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