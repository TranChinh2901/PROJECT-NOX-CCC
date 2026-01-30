import type { Metadata } from "next";
import { Cormorant, Montserrat } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const cormorant = Cormorant({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TechNova - Cửa Hàng Công Nghệ Cao Cấp",
  description: "Khám phá công nghệ tương lai. Laptop, điện thoại thông minh và máy tính để bàn cao cấp với chất lượng không thỏa hiệp.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${cormorant.variable} ${montserrat.variable} antialiased bg-background text-text font-body`}
      >
        {children}
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
