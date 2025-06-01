import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Navbar from "@/components/shared/navbar/Navbar";
import Footer from "@/components/shared/Footer";
import MobileBottomBar from "@/components/shared/MobileBottomBar";
import { Toaster } from "sonner";
import { ClerkProvider } from "@clerk/nextjs";
import TopBarComponent from "@/components/shared/TopBar";
import { ThemeProvider } from "@/components/providers/theme-provider";
import CartManager from "@/components/shared/cart/CartManager";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "VibeCart - Shop Scents that fits you!",
  description: "Online Shopping Site for to shop scents that fits you!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider dynamic={false}>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <CartManager>
              <TopBarComponent />
              <Navbar />
              {children}
              <MobileBottomBar />
              <Footer />
              <Toaster />
            </CartManager>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
