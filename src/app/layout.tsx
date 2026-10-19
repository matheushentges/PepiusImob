import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Pepius Imob - Sistema para Imobiliárias",
  description:
    "Sistema SaaS completo para gestão de imobiliárias com atendimento omnichannel e IA",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-surface-base font-sans antialiased text-text-primary">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}