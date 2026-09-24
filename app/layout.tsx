import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MediaPulse — AI-Powered Movie Personality",
  description:
    "Discover what your movie taste says about you with MediaPulse, an AI-powered movie personality and recommendation experience.",
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
