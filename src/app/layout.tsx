"use client";

import ThemeProvider from "../theme/theme-provider";
import { Header } from "@/app/_components/Header";
import "./globals.css";

import AuthProvider from "@/app/_contexts/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-white dark:bg-[#191919] text-[#37352f] dark:text-[#ffffffcf]">
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Header />
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
