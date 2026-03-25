import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WasThatAI?",
  description:
    "Paste any text. Get the brutal truth about whether it was written by a human or an AI.",
  openGraph: {
    title: "WasThatAI?",
    description:
      "Paste any text. Get the brutal truth about whether it was written by a human or an AI.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg antialiased">{children}</body>
    </html>
  );
}
