import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/globals.css";
import Footer from "@/components/Footer";
import FloatingThemeToggle from "@/components/ThemeToggle/FloatingThemeToggle";
import contents from "@/data/contents.json";
import ConsoleSignature from "@/components/Signature";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: contents.website.title.full,
  description: contents.seo.description,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <meta name="apple-mobile-web-app-title" content="TBuilding" />
      </head>
      <body>
          {children}
          <FloatingThemeToggle />
          <ConsoleSignature />
      </body>
    </html>
  );
}
