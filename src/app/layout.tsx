import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PSG Match Tracker",
  description: "App statistiche partite P.S.G. Molteno Brongio",
  manifest: "/manifest.json",
  themeColor: "#007AFF",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PSG Tracker",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#007AFF",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif',
          backgroundColor: '#F2F2F7',
          color: '#000000',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        }}
      >
        {children}
      </body>
    </html>
  );
}
