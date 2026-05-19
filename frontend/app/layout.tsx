import type { Metadata } from "next";

import { AppShell } from "@/components/layout/AppShell";
import { FloatingSiteControls } from "@/components/layout/FloatingSiteControls";
import {
  BRAND_APPLE_TOUCH_ICON_SRC,
  BRAND_FAVICON_16_SRC,
  BRAND_FAVICON_32_SRC,
  BRAND_FAVICON_48_SRC,
  BRAND_FAVICON_ICO_SRC,
  BRAND_FAVICON_SVG_SRC,
  BRAND_FULL_NAME,
  BRAND_ICON_SRC,
  BRAND_ICON_192_SRC,
  BRAND_ICON_512_SRC,
  BRAND_SHORT_NAME,
} from "@/lib/branding";

import "./globals.css";

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
      const storedTheme = window.localStorage.getItem("bmm-theme") || window.localStorage.getItem("bmc-theme");
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
      const language = window.localStorage.getItem("bmm-language") || window.localStorage.getItem("bmc-language");
      if (language === "en" || language === "fr") {
        document.documentElement.lang = language;
        document.documentElement.dataset.language = language;
      }
    } catch {}
  })();
`;

export const metadata: Metadata = {
  title: `${BRAND_SHORT_NAME} - ${BRAND_FULL_NAME}`,
  description: `Plateforme de mentorat académique ${BRAND_FULL_NAME}.`,
  icons: {
    icon: [
      { url: BRAND_FAVICON_ICO_SRC, type: "image/x-icon" },
      { url: BRAND_FAVICON_SVG_SRC, type: "image/svg+xml" },
      { url: BRAND_FAVICON_16_SRC, sizes: "16x16", type: "image/png" },
      { url: BRAND_FAVICON_32_SRC, sizes: "32x32", type: "image/png" },
      { url: BRAND_FAVICON_48_SRC, sizes: "48x48", type: "image/png" },
      { url: BRAND_ICON_SRC, sizes: "192x192", type: "image/png" },
      { url: BRAND_ICON_192_SRC, sizes: "192x192", type: "image/png" },
      { url: BRAND_ICON_512_SRC, sizes: "512x512", type: "image/png" },
    ],
    shortcut: BRAND_FAVICON_ICO_SRC,
    apple: [{ url: BRAND_APPLE_TOUCH_ICON_SRC, sizes: "180x180", type: "image/png" }],
  },
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
      className="h-full"
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: languageInitScript }} />
      </head>
      <body className="min-h-full bg-background text-foreground antialiased">
        <AppShell>{children}</AppShell>
        <FloatingSiteControls />
      </body>
    </html>
  );
}
