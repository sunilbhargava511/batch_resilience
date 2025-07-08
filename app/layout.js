import './globals.css';

export const metadata = {
  title: 'Batch Resilience Analyzer | Complexity Investing Framework',
  description: 'Batch analyze company resilience and optionality scores using Complexity Investing framework.',
  keywords: [
    'company resilience', 'complexity investing', 'resilience scoring', 
    'investment analysis', 'batch processing', 'ticker analysis'
  ],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {children}
      </body>
    </html>
  );
}