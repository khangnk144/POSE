import type { Metadata, Viewport } from 'next';
import { Be_Vietnam_Pro, Quicksand } from 'next/font/google';
import { ToastProvider } from '@/components/ui/toast';
import './globals.css';

const quicksand = Quicksand({
  variable: '--font-quicksand',
  subsets: ['vietnamese', 'latin'],
  weight: ['600', '700'],
  display: 'swap',
});

const beVietnam = Be_Vietnam_Pro({
  variable: '--font-be-vietnam',
  subsets: ['vietnamese', 'latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Pose Xinh', template: '%s · Pose Xinh' },
  description: 'Thư viện dáng chụp ảnh riêng cho team.',
};

export const viewport: Viewport = {
  themeColor: '#fff7f2',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${quicksand.variable} ${beVietnam.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
