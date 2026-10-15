import type { Metadata } from "next";
import { SiteHeader } from "@/components/ui/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "MediaPulse — Your Next Great Story",
  description:
    "Tell us what moves you. MediaPulse finds the film that feels like it was made for tonight.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
