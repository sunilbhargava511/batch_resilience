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
      <body className="min-h-screen">
        {/* Tailwind Test - Remove this after testing */}
        <div className="fixed top-0 left-0 right-0 bg-red-500 text-white p-2 text-center z-50">
          If you see this red bar, Tailwind IS working!
        </div>
        {children}
      </body>
    </html>
  );
}