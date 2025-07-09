'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  BarChart3,
  Activity,
  Target,
  Zap,
  Shield,
  Users,
  ArrowRight,
  Star,
  CheckCircle,
  Layers,
  Compass
} from 'lucide-react';

export default function Home() {
  const [batchSizeLimit, setBatchSizeLimit] = useState(500);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-white relative overflow-hidden">
      {/* Enhanced animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Enhanced Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(120,119,198,0.3),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,119,198,0.2),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(68,200,245,0.1)_50%,transparent_75%)]"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-2 h-2 bg-blue-400 rounded-full animate-pulse opacity-60"></div>
        <div className="absolute top-40 right-32 w-1 h-1 bg-purple-400 rounded-full animate-ping opacity-40"></div>
        <div className="absolute bottom-32 left-1/4 w-1.5 h-1.5 bg-pink-400 rounded-full animate-pulse opacity-50"></div>
        
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '4s' }}></div>
        
        {/* Animated grid pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10">
        {/* Enhanced header */}
        <header className="py-16 text-center relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/20 to-transparent"></div>
          
          <div className="relative">
            <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-500 rounded-3xl mb-8 shadow-2xl shadow-emerald-500/30 animate-pulse-ring relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-3xl"></div>
              <Activity className="w-18 h-18 text-white relative z-10 drop-shadow-lg" />
            </div>
            
            <h1 className="text-7xl lg:text-8xl font-black mb-6 relative">
              <span className="bg-gradient-to-r from-white via-emerald-200 via-blue-200 to-purple-200 bg-clip-text text-transparent animate-gradient-shift bg-size-200">
                Company Resilience
              </span>
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Analyzer
              </span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-slate-300 max-w-4xl mx-auto leading-relaxed mb-8 font-light">
              Advanced resilience evaluation using <strong className="text-emerald-400">Complexity Investing</strong> framework. 
              Assess adaptability, optionality, and long-term value creation potential with institutional-grade analysis.
            </p>
            
            {/* Enhanced trust indicators */}
            <div className="flex items-center justify-center gap-8 text-sm text-purple-300 mb-8">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                <span>Resilience Framework</span>
              </div>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span>Complexity Investing</span>
              </div>
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4" />
                <span>Strategic Assessment</span>
              </div>
            </div>
          </div>
        </header>

        {/* Analysis Options */}
        <main className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Full Analysis Option */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
              
              <div className="relative bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl p-8 hover:border-white/30 transition-all duration-300 transform hover:scale-[1.02]">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                
                <h2 className="text-3xl font-bold text-white mb-4">Full Analysis</h2>
                <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                  Comprehensive resilience evaluation with detailed reports, competitive analysis, 
                  adjacent market opportunities, and strategic recommendations.
                </p>
                
                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3 text-white/80">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span>Complete 10-category analysis</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/80">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span>Competitive landscape mapping</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/80">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span>Adjacent market opportunities</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/80">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span>Strategic recommendations</span>
                  </div>
                </div>
                
                <a
                  href="https://company-resilience-analyzer.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 w-full justify-center bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  <Building2 className="w-5 h-5" />
                  <span>Start Full Analysis</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                </a>
                
                <div className="mt-4 text-center text-sm text-white/60">
                  Perfect for: Investment decisions, strategic planning
                </div>
              </div>
            </div>

            {/* Batch Scores Option */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-blue-600 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
              
              <div className="relative bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl p-8 hover:border-white/30 transition-all duration-300 transform hover:scale-[1.02]">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                
                <h2 className="text-3xl font-bold text-white mb-4">Batch Scores</h2>
                <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                  Quick resilience and optionality scores for multiple companies. 
                  Perfect for portfolio screening and comparative analysis.
                </p>
                
                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3 text-white/80">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span>Analyze up to {batchSizeLimit.toLocaleString()} companies at once</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/80">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span>CSV file upload support</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/80">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span>Resilience & optionality scores</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/80">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span>CSV export for spreadsheets</span>
                  </div>
                </div>
                
                <Link
                  href="/batch"
                  className="inline-flex items-center gap-3 w-full justify-center bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white px-6 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  <BarChart3 className="w-5 h-5" />
                  <span>Start Batch Analysis</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                </Link>
                
                <div className="mt-4 text-center text-sm text-white/60">
                  Perfect for: Portfolio screening, competitive analysis
                </div>
              </div>
            </div>
          </div>

          {/* Framework Info */}
          <div className="mt-16 text-center">
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center justify-center gap-3">
                <Star className="w-6 h-6 text-yellow-400" />
                Complexity Investing Framework
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-bold text-white mb-2">Adaptability</h4>
                  <p className="text-sm text-slate-300">Companies that thrive in changing conditions</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-bold text-white mb-2">Optionality</h4>
                  <p className="text-sm text-slate-300">Growth through adjacent market opportunities</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-bold text-white mb-2">Non-Zero-Sum</h4>
                  <p className="text-sm text-slate-300">Value creation for all stakeholders</p>
                </div>
              </div>
              
              <p className="text-slate-300 leading-relaxed max-w-3xl mx-auto">
                Based on complexity investing principles that view markets as adaptive systems. 
                Focus on companies with long-duration growth, innovation capabilities, and 
                win-win value creation strategies.
              </p>
            </div>
          </div>
        </main>

        {/* Enhanced Footer */}
        <footer className="relative z-10 py-12 text-center mt-16">
          <div className="max-w-4xl mx-auto px-6">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Shield className="w-5 h-5 text-emerald-400" />
                <span className="text-slate-300">Secure & Private Analysis</span>
                <span className="text-slate-500">•</span>
                <Activity className="w-5 h-5 text-blue-400" />
                <span className="text-slate-300">Complexity Framework</span>
                <span className="text-slate-500">•</span>
                <Zap className="w-5 h-5 text-purple-400" />
                <span className="text-slate-300">Powered by Claude AI</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Advanced resilience evaluation platform using complexity investing principles. 
                Assess adaptability, optionality, and long-term value creation with institutional-grade analysis.
              </p>
              <div className="mt-6 flex items-center justify-center gap-6 text-xs text-slate-500">
                <span>Complexity Investing</span>
                <span>•</span>
                <span>Resilience Framework</span>
                <span>•</span>
                <span>Strategic Assessment</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}