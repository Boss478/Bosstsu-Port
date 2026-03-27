import type { Metadata } from "next";
import localFont from "next/font/local";
import "@flaticon/flaticon-uicons/css/solid/rounded.css";
import "@flaticon/flaticon-uicons/css/brands/all.css";
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
    { path: "../fonts/Mali-Light.ttf", weight: "300", style: "normal" },
    { path: "../fonts/Mali-Regular.ttf", weight: "400", style: "normal" },
    { path: "../fonts/Mali-Medium.ttf", weight: "500", style: "normal" },
    { path: "../fonts/Mali-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../fonts/Mali-Bold.ttf", weight: "700", style: "normal" },
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
