import type { Metadata } from "next";
import type { CSSProperties } from "react";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { FloatingChatbot } from "@/components/chatbot/FloatingChatbot";

export const metadata: Metadata = {
  title: "TechNova - Cửa Hàng Công Nghệ Cao Cấp",
  description: "Khám phá công nghệ tương lai. Laptop, điện thoại thông minh và máy tính để bàn cao cấp với chất lượng không thỏa hiệp.",
  icons: {
    icon: "/technova-mark.svg",
    shortcut: "/technova-mark.svg",
    apple: "/technova-mark.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className="antialiased bg-background text-text font-body"
        style={
          {
            ['--font-heading' as string]: '"Iowan Old Style", "Book Antiqua", Georgia, serif',
            ['--font-body' as string]: '"Avenir Next", "Segoe UI", Helvetica, sans-serif',
          } as CSSProperties
        }
      >
        <AuthProvider>
          <NotificationProvider
            wsEndpoint={process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000'}
            enableToasts={true}
          >
            <WishlistProvider>
              <CartProvider>
                {children}
              </CartProvider>
            </WishlistProvider>
          </NotificationProvider>
        </AuthProvider>
        <FloatingChatbot />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1C1917',
              color: '#FAFAF9',
              fontFamily: 'var(--font-body)',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#CA8A04',
                secondary: '#FAFAF9',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#EF4444',
                secondary: '#FAFAF9',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
