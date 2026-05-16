import type { Metadata } from "next";
import { Geist, Geist_Mono, Libre_Baskerville } from "next/font/google";

import { FloatingSiteControls } from "@/components/layout/FloatingSiteControls";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const libreBaskerville = Libre_Baskerville({
  variable: "--font-brand-serif",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const themeInitScript = `
  (() => {
    try {
      const tokens = {
        light: {
          "--background": "#fffaf2",
          "--foreground": "#171513",
          "--card": "#fffdf8",
          "--card-foreground": "#171513",
          "--primary": "#9f1416",
          "--primary-foreground": "#fff8ed",
          "--secondary": "#f3e6d2",
          "--secondary-foreground": "#171513",
          "--muted": "#f7eee3",
          "--muted-foreground": "#695f55",
          "--accent": "#c89555",
          "--accent-foreground": "#1d1712",
          "--border": "rgb(23 21 19 / 0.13)",
          "--input": "rgb(23 21 19 / 0.17)",
          "--ring": "#c89555"
        },
        dark: {
          "--background": "#0f0d0c",
          "--foreground": "#f8efe4",
          "--card": "#181513",
          "--card-foreground": "#f8efe4",
          "--primary": "#d6403f",
          "--primary-foreground": "#fff8ed",
          "--secondary": "#251f1b",
          "--secondary-foreground": "#f8efe4",
          "--muted": "#211c18",
          "--muted-foreground": "#c7b7a5",
          "--accent": "#d3a262",
          "--accent-foreground": "#171513",
          "--border": "rgb(255 248 237 / 0.13)",
          "--input": "rgb(255 248 237 / 0.16)",
          "--ring": "#d3a262"
        }
      };
      const storedTheme = window.localStorage.getItem("bmc-theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const theme = storedTheme || (prefersDark ? "dark" : "light");
      Object.entries(tokens[theme]).forEach(([key, value]) => {
        document.documentElement.style.setProperty(key, value);
      });
      document.documentElement.classList.toggle("dark", theme === "dark");
    } catch {
      document.documentElement.classList.remove("dark");
    }
  })();
`;

const languageInitScript = `
  (() => {
    try {
      const language = window.localStorage.getItem("bmc-language");
      if (language === "en" || language === "fr") {
        document.documentElement.lang = language;
        document.documentElement.dataset.language = language;
      }
    } catch {}
  })();
`;

export const metadata: Metadata = {
  title: "BMC Mentorat",
  description: "Plateforme de mentorat académique BMC.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} ${libreBaskerville.variable} h-full`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: languageInitScript }} />
      </head>
      <body className="min-h-full bg-background text-foreground antialiased">
        {children}
        <FloatingSiteControls />
      </body>
    </html>
  );
}
