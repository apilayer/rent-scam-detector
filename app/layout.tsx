import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, IBM_Plex_Serif } from "next/font/google";
import "./globals.css";

/**
 * IBM Plex, not the framework default. Plex was drawn for technical and
 * institutional work, which is the register this tool needs: it is telling
 * someone whether to hand over a deposit. The three cuts are one superfamily,
 * so the serif headlines and the mono data sit together without clashing.
 */
const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const plexSerif = IBM_Plex_Serif({
  variable: "--font-plex-serif",
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rental Scam Detector: check a listing before you pay a deposit",
  description:
    "Paste a rental listing URL. The tool reads the advert, reverse image searches every photo with Zenserp, then compares the price and location on every other page using those same pictures. Cross-posting is normal. The same rooms advertised far cheaper, or somewhere else entirely, is what a rental scam looks like.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${plexSans.variable} ${plexMono.variable} ${plexSerif.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('rentalscan-theme');if(t==='dark'||t==='light'){document.documentElement.dataset.theme=t;}}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
