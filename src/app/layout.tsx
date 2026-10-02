import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Ask Ambedkar — Discover what Ambedkar wrote',
  description:
    'A public, anonymous research platform to discover what Dr. B. R. Ambedkar’s documented writings and recorded statements say about any subject. Anchored strictly in primary sources.',
  keywords: [
    'Ambedkar',
    'B. R. Ambedkar',
    'Primary Sources',
    'BAWS',
    'Constituent Assembly',
    'Indian Constitution',
    'Castes in India',
    'Annihilation of Caste',
  ],
  authors: [{ name: 'Ask Ambedkar Research Initiative' }],
  openGraph: {
    title: 'Ask Ambedkar — Discover what Ambedkar wrote',
    description:
      'Ask anything. Discover what Dr. B. R. Ambedkar wrote from verified primary sources.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
