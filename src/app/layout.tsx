import type { Metadata, Viewport } from "next";
import { Roboto_Flex } from "next/font/google";
import { cookies } from "next/headers";
import { LangProvider } from "@/components/LangProvider";
import "./globals.css";

const flex = Roboto_Flex({
  subsets: ["latin", "cyrillic"],
  axes: ["wdth", "opsz"],
  variable: "--font-flex",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bilimdon — adabiyot bellashuvi",
  description: "Adabiyotdan jonli viktorina: xona yarating, kodni ulashing va bellashing. Живая викторина по литературе.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fdf7ff" },
    { media: "(prefers-color-scheme: dark)", color: "#141218" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = (await cookies()).get("lang")?.value === "ru" ? "ru" : "uz";
  return (
    <html lang={lang} className={flex.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
        <link rel="preconnect" href="https://api.dicebear.com" />
      </head>
      <body className="font-sans antialiased">
        <LangProvider initial={lang}>{children}</LangProvider>
      </body>
    </html>
  );
}
