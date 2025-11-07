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
      <body className="bg-white dark:bg-[#191919] text-[#37352f] dark:text-[#ffffffcf] flex">
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Header />
            <div className="w-3/4">{children}</div>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
