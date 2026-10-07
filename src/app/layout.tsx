import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PSG Match Tracker",
  description: "App statistiche partite",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
