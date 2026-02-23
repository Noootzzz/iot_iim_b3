import type { Metadata } from "next";
import { Sora, Inter } from "next/font/google";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Riftbound — Arena",
  description: "Riftbound card game arena — Score duel 1v1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <meta
          name="viewport"
          content="width=800, height=480, initial-scale=1, user-scalable=no"
        />
      </head>
      <body
        className={`${sora.variable} ${inter.variable} antialiased w-[800px] h-[480px] overflow-hidden`}
      >
        {children}
      </body>
    </html>
  );
}
