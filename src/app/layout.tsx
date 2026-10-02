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
      <body>
        <div className="app-container">
          <header className="site-header">
            <div className="brand-group">
              <div className="brand-logo-badge" aria-hidden="true">
                अ
              </div>
              <div className="brand-text">
                <span className="brand-title">Ask Ambedkar</span>
                <span className="brand-subtitle">Primary Source Research</span>
              </div>
            </div>

            <div className="header-actions">
              <div className="status-pill" id="system-status-indicator" title="Segment 0: Project Foundation Active">
                <span className="status-dot"></span>
                <span>Segment 0 Active</span>
              </div>
            </div>
          </header>

          <main id="main-content">{children}</main>

          <footer className="site-footer">
            <p className="footer-quote">
              “Cultivation of mind should be the ultimate aim of human existence.” — Dr. B. R. Ambedkar
            </p>
            <p>
              Ask Ambedkar is an open research platform prioritizing verified primary sources over speculative generation.
            </p>
            <p className="font-mono text-muted" style={{ fontSize: '0.75rem' }}>
              Segment 0: Project Foundation • Anonymous • No Tracking • Primary Sources Only
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
