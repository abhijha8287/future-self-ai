import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FutureSelf AI",
  description: "Decision intelligence layer for avoiding future regret."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
