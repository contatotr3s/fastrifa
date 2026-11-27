import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/lib/firebase/auth-context";
import { ThemeProvider, GLOBAL_THEME_STORAGE_KEY } from "@/lib/theme-context";
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
    <html
      lang="pt-BR"
      data-theme="green"
      data-scroll-behavior="smooth"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Anti-FOUC: aplica o tema verde definitivo antes do primeiro paint da tela */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function() {
              try {
                localStorage.setItem('${GLOBAL_THEME_STORAGE_KEY}', 'green');
                document.cookie = '${GLOBAL_THEME_STORAGE_KEY}=green; path=/; max-age=31536000; SameSite=Lax';
                document.documentElement.setAttribute('data-theme', 'green');
              } catch (e) {
                document.documentElement.setAttribute('data-theme', 'green');
              }
            })();`,
          }}
        />
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
        <AuthProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
