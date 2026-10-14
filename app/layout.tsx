import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Manrope } from "next/font/google";
import "./globals.css";

const font = Manrope({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "Teardown: интерактивный гайд по устройствам",
  description: "Разберите устройство колесом мыши и узнайте, что внутри.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body className={`${font.className} fixed inset-0 overflow-hidden`}>{children}</body>
    </html>
  );
}
