import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/lib/firebase/auth-context";
import TestEnvBanner from "@/components/test-env-banner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FASTRIFA — Campanhas e Rifas Online com PIX Direto",
  description:
    "Crie, publique e gerencie campanhas de cotas online com recebimento instantâneo via PIX direto na sua conta.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <head>
        <link
          rel="preconnect"
          href="https://api.fontshare.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#FFFFFF] text-[#0D1729]">
        <TestEnvBanner />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
