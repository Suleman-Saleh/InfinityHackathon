import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NovaWorks PM",
  description: "AI Project Manager: turn meeting transcripts into projects and tasks",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
