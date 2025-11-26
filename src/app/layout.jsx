import { Inter } from 'next/font/google';
import './globals.css';
import { Layout } from '@/components/layout/Layout';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
const inter = Inter({ subsets: ['latin'] });
export const metadata = { title: 'Zaillisy - Social E-Commerce Platform',
    description: 'Discover, buy, and sell products in a social commerce environment. Connect with sellers, browse trending items, and shop with confidence.',
    keywords: 'e-commerce, social commerce, online shopping, marketplace, buy, sell, Pakistan, Lahore',
    authors: [{ name: 'Zaillisy Team' }],
    robots: 'index, follow',
    openGraph: {
        title: 'Zaillisy - Social E-Commerce Platform',
        description: 'Discover, buy, and sell products in a social commerce environment.',
        type: 'website',
        locale: 'en_US',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Zaillisy - Social E-Commerce Platform',
        description: 'Discover, buy, and sell products in a social commerce environment.',
    },
};
export default function RootLayout({ children, }) {
    return (<html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <Layout>
            {children}
          </Layout>
        </ThemeProvider>
      </body>
    </html>);
}
