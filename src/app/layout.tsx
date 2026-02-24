import type { Metadata } from "next";
import { Geist, Geist_Mono, Mali } from "next/font/google";
import "@flaticon/flaticon-uicons/css/solid/rounded.css";
import "@flaticon/flaticon-uicons/css/brands/all.css";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const mali = Mali({
  variable: "--font-mali",
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Boss478 | Portfolio",
  description: "เว็บไซต์ส่วนตัวสำหรับเก็บผลงาน กิจกรรม รูปภาพ สื่อการเรียนรู้ และเกมการศึกษา",
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
