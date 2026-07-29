import type { Metadata } from "next";
import { Geist, Geist_Mono, Kalam } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import "@excalidraw/excalidraw/index.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const kalam = Kalam({
  variable: "--font-kalam",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

export const metadata: Metadata = {
  title: "Amatic.ai - AI-Powered Creative Platform",
  description: "Transform your ideas with AI-powered tools. Perfect for professionals, creators, and teams.",
  keywords: ["AI tools", "creative platform", "visual learning", "AI assistant", "productivity"],
  authors: [{ name: "Amatic.ai Team" }],
  openGraph: {
    title: "Amatic.ai - AI-Powered Creative Platform",
    description: "Transform your ideas into beautiful visuals with AI",
    type: "website",
    locale: "en_US",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
    >
      <html lang="en" suppressHydrationWarning>
        <head>
          {/* Suppress development warnings - runs before React loads */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                // Suppress console warnings immediately
                (function() {
                  // Store originals
                  const _log = console.log.bind(console);
                  const _warn = console.warn.bind(console);
                  const _error = console.error.bind(console);
                  
                  // Override console.log
                  console.log = function(...args) {
                    const msg = String(args[0] || '');
                    if (
                      msg.includes('Download the React DevTools') ||
                      msg.includes('development experience')
                    ) return;
                    _log(...args);
                  };
                  
                  // Override console.warn
                  console.warn = function(...args) {
                    const msg = String(args[0] || '');
                    if (
                      msg.includes('Clerk has been loaded with development keys') ||
                      msg.includes('afterSignInUrl') ||
                      msg.includes('deprecated')
                    ) return;
                    _warn(...args);
                  };
                  
                  // Override console.error
                  console.error = function(...args) {
                    const msg = String(args[0] || '');
                    if (
                      msg.includes('runtime.lastError') ||
                      msg.includes('message port closed') ||
                      msg.includes('Error analyzing content') ||
                      msg.includes('Error speaking text')
                    ) return;
                    _error(...args);
                  };
                  
                  // Suppress passive event listener warnings
                  const originalWarn2 = console.warn;
                  console.warn = function(...args) {
                    const msg = String(args[0] || '');
                    if (
                      msg.includes('preventDefault') && msg.includes('passive') ||
                      msg.includes('Chat API not available') ||
                      msg.includes('Voice synthesis error') ||
                      msg.includes('Visual generation')
                    ) return;
                    originalWarn2.apply(console, args);
                  };
                  
                  // Suppress Clerk warnings specifically
                  if (typeof window !== 'undefined') {
                    const originalWarn = window.console.warn;
                    window.console.warn = function(...args) {
                      const message = args.join(' ');
                      if (message.includes('Clerk:')) return;
                      originalWarn.apply(console, args);
                    };
                  }
                })();
              `,
            }}
          />
          {/* Google Fonts - Multi-language Support for 50+ Countries */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link 
            href="https://fonts.googleapis.com/css2?family=Kalam:wght@300;400;700&family=Caveat:wght@400;700&family=Patrick+Hand&family=Shadows+Into+Light&family=Dancing+Script:wght@400;700&family=Pacifico&family=Amiri:wght@400;700&family=Cairo:wght@400;700&family=Noto+Sans+Arabic:wght@400;700&family=Noto+Sans+SC:wght@400;700&family=Noto+Sans+TC:wght@400;700&family=Noto+Sans+JP:wght@400;700&family=Noto+Sans+KR:wght@400;700&family=Noto+Sans+Devanagari:wght@400;700&family=Noto+Sans+Bengali:wght@400;700&family=Noto+Sans+Tamil:wght@400;700&family=Noto+Sans+Telugu:wght@400;700&family=Noto+Sans+Thai:wght@400;700&family=Noto+Sans+Hebrew:wght@400;700&family=Inter:wght@400;700&family=Roboto:wght@400;700&family=Open+Sans:wght@400;700&family=Lato:wght@400;700&family=Montserrat:wght@400;700&family=Poppins:wght@400;700&family=Mali:wght@400;700&family=Sarabun:wght@400;700&family=Gamja+Flower&family=Klee+One:wght@400;600&family=Yuji+Syuku&family=Yuji+Boku&family=Tillana:wght@400;700&family=Hind:wght@400;700&family=Mukta:wght@400;700&family=Sriracha&family=Secular+One&family=Rubik:wght@400;700&family=Assistant:wght@400;700&family=Vazirmatn:wght@400;700&family=Merriweather:wght@400;700&family=Playfair+Display:wght@400;700&family=Lora:wght@400;700&family=PT+Serif:wght@400;700&family=PT+Sans:wght@400;700&family=Fira+Code:wght@400;700&family=JetBrains+Mono:wght@400;700&family=Source+Code+Pro:wght@400;700&family=IBM+Plex+Mono:wght@400;700&family=Fredoka+One&family=Bebas+Neue&family=Satisfy&family=Permanent+Marker&family=Righteous&family=Quicksand:wght@400;700&family=Nunito:wght@400;700&family=Ubuntu:wght@400;700&family=Source+Sans+Pro:wght@400;700&family=Raleway:wght@400;700&family=Noto+Sans+Khmer:wght@400;700&family=Noto+Sans+Lao:wght@400;700&family=Noto+Sans+Myanmar:wght@400;700&family=Noto+Sans+Ethiopic:wght@400;700&family=Noto+Sans+Georgian:wght@400;700&family=Noto+Sans+Armenian:wght@400;700&family=Ma+Shan+Zheng&family=ZCOOL+XiaoWei&family=Liu+Jian+Mao+Cao&family=Long+Cang&family=Gugi&family=Jua&family=Aref+Ruqaa:wght@400;700&family=Lalezar&family=M+PLUS+Rounded+1c:wght@400;700&family=Zen+Kaku+Gothic+New:wght@400;700&family=Black+Han+Sans&family=Nanum+Gothic:wght@400;700&family=Noto+Serif:wght@400;700&family=Noto+Serif+JP:wght@400;700&family=Noto+Serif+KR:wght@400;700&family=Noto+Serif+SC:wght@400;700&family=Tajawal:wght@400;700&family=Almarai:wght@400;700&family=IBM+Plex+Sans+Arabic:wght@400;700&family=Noto+Sans+HK:wght@400;700&family=Prompt:wght@400;700&family=Courier+Prime:wght@400;700&family=Crimson+Text:wght@400;700&display=swap"
            rel="stylesheet" 
          />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} ${kalam.variable} antialiased`}
        >
          <ErrorBoundary>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem={false}
              disableTransitionOnChange
              storageKey="theme"
            >
              {children}
              <Toaster 
                position="bottom-right" 
                richColors 
                closeButton
                duration={4000}
              />
            </ThemeProvider>
          </ErrorBoundary>
        </body>
      </html>
    </ClerkProvider>
  );
}
