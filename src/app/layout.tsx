"use client";

import { usePathname } from "next/navigation";
import ThemeProvider from "../theme/theme-provider";
import { Header } from "@/app/_components/Header";
import "./globals.css";

import AuthProvider from "@/app/_contexts/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const noHeaderPaths = ["/login", "/signage/view"];
  const showHeader = !noHeaderPaths.includes(pathname);

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
            {showHeader && <Header />}
            <div className={showHeader ? "w-3/4" : "w-full"}>{children}</div>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
