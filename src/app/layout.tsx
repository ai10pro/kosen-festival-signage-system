"use client";

import ThemeProvider from "../theme/theme-provider";
import ThemeToggle from "@/theme/theme-toggle";
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const logout = async () => {
    await fetch("/api/auth/logout", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });
    // ログアウト後にログインページへリダイレクト
    window.location.href = "/login";
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-white dark:bg-[#191919] text-[#37352f] dark:text-[#ffffffcf]">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div>
            <ThemeToggle />
          </div>
          {/* ログアウトボタン */}
          <button
            className="fixed top-4 right-4 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md z-50"
            onClick={logout}
          >
            ログアウト
          </button>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
