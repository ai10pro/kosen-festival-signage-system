"use client";
import { useAuth } from "@/app/_hooks/useAuth";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import { twMerge } from "tailwind-merge";
import ThemeToggle from "@/theme/theme-toggle";

export const Header: React.FC = () => {
  const { userProfile, logout } = useAuth();
  const router = useRouter();

  return (
    <header>
      <div className="py-2">
        <ThemeToggle />
        <div className="flex justify-between">
          <NextLink href="/" className="mr-4">
            ホーム
          </NextLink>
        </div>
        {userProfile ? (
          <div className="flex justify-end items-center space-x-4">
            <span>{userProfile.username} さん</span>
            <button onClick={logout}>ログアウト</button>
          </div>
        ) : (
          <div
            className="flex justify-end cursor-pointer text-blue-600 hover:underline"
            onClick={() => {
              router.push("/login");
            }}
          >
            ログイン
          </div>
        )}
      </div>
    </header>
  );
};
