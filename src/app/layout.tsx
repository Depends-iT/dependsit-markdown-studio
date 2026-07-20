import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const APP_NAME = "DependsiT Markdown Studio";
const APP_DESCRIPTION =
  "A free, open-source Markdown editor and document converter that runs entirely in your browser. Import PDF, DOCX, PPTX, XLSX and more. Your files never leave your device.";
const APP_URL_FALLBACK = "https://md.dependsit.com";

async function getSiteUrl(): Promise<URL> {
  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? "https";

  if (host) {
    return new URL(`${protocol}://${host}`);
  }

  if (process.env.VERCEL_URL) {
    return new URL(`https://${process.env.VERCEL_URL}`);
  }

  return new URL(APP_URL_FALLBACK);
}

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = await getSiteUrl();
  const ogImageUrl = new URL("/og-image.webp", siteUrl).toString();

  return {
    metadataBase: siteUrl,
    title: {
      default: `${APP_NAME} — Private Markdown Editor & Document Converter`,
      template: `%s · ${APP_NAME}`,
    },
    description: APP_DESCRIPTION,
    applicationName: APP_NAME,
    generator: "Next.js",
    referrer: "origin-when-cross-origin",
    keywords: [
      "Markdown editor",
      "document converter",
      "PDF to Markdown",
      "DOCX to Markdown",
      "PPTX to Markdown",
      "XLSX to Markdown",
      "Mermaid diagrams",
      "KaTeX math",
      "privacy-first",
      "offline editor",
      "open source",
      "PWA",
      "browser-based editor",
      "no signup",
    ],
    authors: [{ name: "DependsiT", url: "https://github.com/Depends-iT" }],
    creator: "DependsiT",
    publisher: "DependsiT",
    manifest: "/manifest.webmanifest",
    alternates: {
      canonical: siteUrl.toString(),
      types: {
        "application/rss+xml": "https://github.com/Depends-iT/dependsit-markdown-studio/releases.atom",
      },
    },
    category: "developer tools",
    classification: "Developer Tools, Productivity, Text Editor",
    formatDetection: {
      telephone: false,
      address: false,
      email: false,
    },
    icons: {
      icon: [
        { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
        { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
        { url: "/favicon.png", type: "image/png", sizes: "48x48" },
        { url: "/pwa-192x192.png", type: "image/png", sizes: "192x192" },
      ],
      shortcut: ["/favicon.png"],
      apple: [
        { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      ],
      other: [
        {
          rel: "mask-icon",
          url: "/safari-pinned-tab.svg",
          color: "#0A0A0A",
        },
      ],
    },
    openGraph: {
      title: `${APP_NAME} — Private Markdown Editor & Document Converter`,
      description: APP_DESCRIPTION,
      url: siteUrl.toString(),
      siteName: APP_NAME,
      type: "website",
      locale: "en_US",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${APP_NAME} — Markdown editor with split-pane preview`,
          type: "image/webp",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: APP_NAME,
      description: APP_DESCRIPTION,
      images: [ogImageUrl],
      creator: "@dependsit",
      site: "@dependsit",
    },
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    appLinks: {
      web: {
        url: siteUrl.toString(),
        should_fallback: true,
      },
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F1E8" },
    { media: "(prefers-color-scheme: dark)", color: "#121212" },
  ],
  colorScheme: "light dark",
};

const SW_INIT_SCRIPT = `
(function(){
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(function() {});
    });
  }
})();
`;

const THEME_INIT_SCRIPT = `
(function(){
  try {
    var stored = localStorage.getItem('md-studio-theme');
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = stored || (prefersDark ? 'dark' : 'light');
    var root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
    root.classList.add('theme-' + theme);
    if (theme === 'dark') root.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content={APP_NAME} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content={APP_NAME} />
        <meta name="msapplication-TileColor" content="#121212" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="color-scheme" content="light dark" />
        <meta name="referrer" content="origin-when-cross-origin" />
        <script
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
        <script
          dangerouslySetInnerHTML={{ __html: SW_INIT_SCRIPT }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
