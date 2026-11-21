import type { Metadata, Viewport } from "next";
import "@fontsource-variable/unbounded";
import "@fontsource-variable/montserrat";
import "lenis/dist/lenis.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Пять букетов — цветочная мастерская",
  description: "Авторские букеты и композиции, созданные с вниманием к каждой детали.",
  openGraph: {
    title: "Пять букетов — цветы, у которых есть характер",
    description: "Авторские букеты и композиции.",
    locale: "ru_RU",
    type: "website",
  },
};

export const viewport: Viewport = { themeColor: "#42241f" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
