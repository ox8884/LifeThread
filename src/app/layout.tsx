import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ReactDevTools } from "@/components/dev/react-dev-tools";
import { shouldEnableReactDevTools } from "@/config/dev-tools";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "LifeThread",
    template: "%s · LifeThread",
  },
  description: "A private, evidence-aware workspace for living goals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const enableReactDevTools = shouldEnableReactDevTools(
    process.env.NODE_ENV,
    process.env["NEXT_PUBLIC_ENABLE_REACT_DEVTOOLS"],
  );

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body>
        {enableReactDevTools ? <ReactDevTools /> : null}
        {children}
      </body>
    </html>
  );
}
