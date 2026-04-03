import type { Metadata } from "next";
import { Geist, Geist_Mono, Comic_Neue } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { SocketProvider } from "@/lib/socket";
import { NotificationProvider } from "@/lib/notification-provider";
import { ConfirmProvider } from "@/lib/confirm-provider";
import PageTransitionProvider from "@/components/ui/PageTransitionProvider";
import { Suspense } from "react";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const comicNeue = Comic_Neue({
  variable: "--font-comic-neue",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

export const metadata: Metadata = {
  title: "IrmaVerse",
  description: "Platform pembelajaran Islam interaktif untuk generasi muda",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${comicNeue.variable} antialiased`}
      >
        <SessionProvider>
          <SocketProvider>
            <ConfirmProvider>
              <NotificationProvider>
                <Suspense fallback={null}>
                  <PageTransitionProvider />
                </Suspense>
                {children}
              </NotificationProvider>
            </ConfirmProvider>
          </SocketProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
