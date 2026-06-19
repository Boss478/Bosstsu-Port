import type { Metadata } from "next";
import localFont from "next/font/local";
import "../fonts/flaticon-subset.css";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { CONFIG } from "@/lib/config";

const geistSans = localFont({
  src: "../fonts/Geist-Variable.woff2",
  variable: "--font-geist-sans",
});

const geistMono = localFont({
  src: "../fonts/GeistMono-Variable.woff2",
  variable: "--font-geist-mono",
});

const mali = localFont({
  src: [
    { path: "../fonts/Mali-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/Mali-Medium.woff2", weight: "500", style: "normal" },
    { path: "../fonts/Mali-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../fonts/Mali-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-mali",
});

export const metadata: Metadata = {
  title: CONFIG.SITE.TITLE,
  description: CONFIG.SITE.DESCRIPTION,
  icons: {
    icon: [
      { url: "/icon/favicon.ico", sizes: "any" },
      { url: "/icon/icon.png", type: "image/png" }
    ],
    apple: [
      { url: "/icon/apple-icon.png", type: "image/png", sizes: "180x180" }
    ]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${mali.variable} antialiased`}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
