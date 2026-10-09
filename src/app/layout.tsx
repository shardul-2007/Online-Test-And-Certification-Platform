import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'SkillCert | Online Test & Automatic Certificate Platform',
  description:
    'Take professional assessments, receive automated server-side evaluation, and obtain instant, cryptographically verified certificates.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className="font-sans bg-[#06080F] text-slate-100 min-h-screen flex flex-col antialiased selection:bg-cyan-500 selection:text-slate-950"
      >
        <ThemeProvider>
          <Navbar />
          <main className="flex-1 w-full">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
