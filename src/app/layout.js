import { Geist, Orbitron } from "next/font/google";
import "@/styles/globals.css";
import Footer from "@/components/Footer";
import FloatingThemeToggle from "@/components/ThemeToggle/FloatingThemeToggle";
import contents from "@/data/contents.json";
import ConsoleSignature from "@/components/Signature";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
});

export const metadata = {
  title: contents.website.title.full,
  description: contents.seo.description,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${orbitron.variable}`}>
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
