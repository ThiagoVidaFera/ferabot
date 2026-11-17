import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "O Cerebro — CRM FERA",
  description: "O banco de dados do negocio e a casa onde os agentes de IA trabalham.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
