import type { Metadata } from "next";
import { Geist, Space_Grotesk, Space_Mono, Anton } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "1001 — Albums To Hear Before You Die",
  description:
    "A funky, hand-picked crate of essential records. Filter by genre, artist, letter and length. No metal, no country — just the good stuff.",
  keywords: ["albums", "music", "1001 albums", "best albums", "record collection", "vinyl"],
  authors: [{ name: "The Crate Diggers" }],
  icons: {
    icon: "/icon-192.svg",
    shortcut: "/icon-192.svg",
    apple: "/icon-192.svg",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "1001 — Albums To Hear Before You Die",
    description: "A funky, hand-picked crate of essential records.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ff4d8d" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="1001 Albums" />
        <link rel="apple-touch-icon" href="/icon-192.svg" />
      </head>
      <body
        className={`${geistSans.variable} ${spaceGrotesk.variable} ${spaceMono.variable} ${anton.variable} antialiased bg-background text-foreground grain`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
