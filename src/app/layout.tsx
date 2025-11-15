import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hệ thống Quản lý Du lịch",
  description: "Hệ thống quản lý tour du lịch, booking, khách hàng và chi phí.",
  keywords: ["Du lịch", "Tour", "Booking", "Quản lý khách hàng"],
  authors: [{ name: "Travel Management Team" }],
  openGraph: {
    title: "Hệ thống Quản lý Du lịch",
    description: "Hệ thống quản lý tour du lịch, booking, khách hàng và chi phí.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}