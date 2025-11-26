import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import React, { Suspense } from "react";
import '../lib/awsInitialize';
import "./globals.css";
import { Layout } from "@/components/layout/Layout";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SessionProvider } from "@/components/providers/SessionProvider";
import PerformanceInitializer from "@/components/PerformanceInitializer";
import { AwsConfigProvider } from "@/components/AwsConfigProvider";
// AWS Config is handled by AwsConfigProvider

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#6366f1",
};

export const metadata: Metadata = {
  title: "Zaillisy - Social E-Commerce Platform",
  description:
    "Discover, buy, and sell products in a social commerce environment. Connect with sellers, browse trending items, and shop with confidence.",
  keywords:
    "e-commerce, social commerce, online shopping, marketplace, buy, sell, Pakistan, Lahore",
  authors: [{ name: "Zaillisy Team" }],
  robots: "index, follow",
  manifest: "/manifest.json",
  other: {
    "cache-control": "no-cache, no-store, must-revalidate",
    pragma: "no-cache",
    expires: "0",
  },
  openGraph: {
    title: "Zaillisy - Social E-Commerce Platform",
    description:
      "Discover, buy, and sell products in a social commerce environment.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zaillisy - Social E-Commerce Platform",
    description:
      "Discover, buy, and sell products in a social commerce environment.",
  },
  icons: {
    icon: "/icon-192x192.svg",
    apple: "/icon-192x192.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Zaillisy",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                window.__AWS_CONFIG__ = {
                  region: 'ap-south-1',
                  userPoolId: 'ap-south-1_UrgROe7bY',
                  clientId: '1dnqju9c3c6fhtq937fl5gmh8e',
                  cognitoDomain: 'zaillisy-auth.auth.ap-south-1.amazoncognito.com',
                  productsTable: 'goryl-products',
                  usersTable: 'goryl-users',
                  reelsTable: 'goryl-reels',
                  chatsTable: 'goryl-chats',
                  messagesTable: 'goryl-messages',
                  s3Bucket: 'goryl-storage',
                  s3CdnUrl: 'https://zaillisy-storage.s3.ap-south-1.amazonaws.com'
                };
              })();
            `,
          }}
        />
      </head>

      <body className={inter.className} suppressHydrationWarning>
        <SessionProvider>
          <AwsConfigProvider />
          <Suspense fallback={null}>
            <PerformanceInitializer />
            <ThemeProvider>
              <Layout>{children}</Layout>
            </ThemeProvider>
          </Suspense>
        </SessionProvider>
      </body>
    </html>
  );
}
