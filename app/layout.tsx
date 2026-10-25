import type { Metadata } from "next";
import { SiteHeader } from "@/components/ui/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "MediaPulse — Find your next favorite film",
  description:
    "A personal film discovery, guided by the stories you love.",
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
