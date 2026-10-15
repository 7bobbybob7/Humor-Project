import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { Nav } from "./nav";

// Fraunces is the newspaper-funnies voice: a soft, slightly wonky serif.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Humor Project",
  description:
    "A daily caption contest. The robots write, you decide what's funny.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-paper text-ink">
        <Nav />
        {children}
        <footer className="mt-16 border-t-2 border-ink/15 py-8">
          <p className="mx-auto max-w-3xl px-6 text-center text-xs text-ink-soft">
            The Humor Project · captions written by AI, ranked by humans
          </p>
        </footer>
      </body>
    </html>
  );
}
