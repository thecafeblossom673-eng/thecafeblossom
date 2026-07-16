import type { Metadata, Viewport } from "next";
import "./globals.css";

import { AuthProvider } from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "Cafe Blossom — Staff Billing System",
  description: "Internal Order Management and Billing System for Cafe Blossom, Ishwarpur",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Cafe Blossom",
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-background text-foreground flex flex-col antialiased">
        <AuthProvider>{children}</AuthProvider>
        
        {/* Vira Tech Watermark Logo */}
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end opacity-50 hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-[#f0eee9]/90 backdrop-blur-sm p-2 rounded-lg shadow-sm border border-black/5 text-center pointer-events-auto flex flex-col items-center select-none scale-[0.65] origin-bottom-right">
            <div className="flex flex-col items-center leading-none mb-1">
              <span className="text-xl text-[#3b2b18] tracking-tighter" style={{ fontFamily: 'Times New Roman, serif' }}>vira</span>
              <span className="font-sans text-[8px] tracking-[0.2em] text-[#3b2b18] uppercase mt-0.5">Tech</span>
            </div>
            <span className="text-[5px] uppercase tracking-[0.1em] text-[#3b2b18]/70 font-semibold mb-1.5">Where ideas become software.</span>
            <a href="mailto:viratech07@gmail.com" className="text-[8px] font-sans font-medium text-primary hover:underline hover:text-primary/80">viratech07@gmail.com</a>
          </div>
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
