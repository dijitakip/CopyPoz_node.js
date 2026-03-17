import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CopyPoz V5 - Forex Signal Copier',
  description: 'Professional Forex Signal Copying System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className="bg-gray-50">
        {children}
      </body>
    </html>
  );
}
