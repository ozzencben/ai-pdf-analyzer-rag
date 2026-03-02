import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI PDF Analyzer | Backend Insight",
  description: "Advanced RAG system for PDF analysis and strategic insights",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
