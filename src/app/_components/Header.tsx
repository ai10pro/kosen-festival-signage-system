"use client";
import { useState } from "react";
import { useAuth } from "@/app/_hooks/useAuth";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import ThemeToggle from "@/theme/theme-toggle";

export const Header: React.FC = () => {
  const { userProfile, logout } = useAuth();
  const router = useRouter();
  const [isContentsMenuOpen, setIsContentsMenuOpen] = useState(false);
  const [isNewsMenuOpen, setIsNewsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isLinkMenuOpen, setIsLinkMenuOpen] = useState(false);

  const contentsData = {
    navItems: [
      {
        id: "ADMIN",
        label: [
          { name: "コンテンツダッシュボード", href: "/content" },
          { name: "認証", href: "/content/auth" },
          { name: "タグ・グループ一覧", href: "/tag" },
          { name: "表示コンテンツ設定", href: "/signages" },
        ],
      },
      {
        id: "VIEWER",
        label: [
          { name: "コンテンツダッシュボード", href: "/content" },
          { name: "認証", href: "/content/auth" },
          { name: "表示コンテンツ設定", href: "/settings" },
          { name: "タグ一覧", href: "/tag" },
          { name: "所属グループ一覧", href: "/groups" },
        ],
      },
      {
        id: "EXHIBITOR",
        label: [
          { name: "コンテンツダッシュボード", href: "/content" },
          { name: "認証", href: "/auth" },
        ],
      },
    ],
  };

  return (
    <header className="w-1/4 h-screen border-r fixed top-0 left-0 border-gray-200 dark:border-gray-700 bg-gray-100  dark:bg-neutral-900">
      <div className="py-2 flex flex-col h-full">
        <div className="flex-1 overflow-y-auto">
          <ThemeToggle />
          <div className="flex px-4 py-2 justify-center mb-4">
            <NextLink href="/">
              <div className="flex items-center gap-x-4">
                <div className="bg-gray-500 w-12 h-12 flex-shrink-0"></div>
                <div className="text-xl">高専祭デジタルサイネージ</div>
              </div>
            </NextLink>
          </div>

          {/* xxx--- サイドバー部分 ---xxx */}
          <div
            className="flex cursor-pointer select-none items-center bg-gray-300 dark:bg-neutral-800 pl-4 py-2"
            onClick={() => setIsContentsMenuOpen(!isContentsMenuOpen)}
          >
            <span>コンテンツ表示管理</span>
            <span className="ml-1">{isContentsMenuOpen ? "▼" : "▶"}</span>
          </div>
          {isContentsMenuOpen && (
            <div className="pl-4 list-none bg-gray-200 dark:bg-neutral-700">
              {userProfile &&
                contentsData.navItems
                  .find((item) => item.id === userProfile.role)
                  ?.label.map((item) => (
                    <NextLink href={item.href} key={item.name}>
                      <div className="flex py-1 px-2 cursor-pointer hover:bg-gray-300 dark:hover:bg-neutral-600 rounded">
                        {item.name}
                      </div>
                    </NextLink>
                  ))}
            </div>
          )}
          <div
            className="flex cursor-pointer select-none items-center bg-gray-300 dark:bg-neutral-800 pl-4 py-2"
            onClick={() => setIsNewsMenuOpen(!isNewsMenuOpen)}
          >
            <span>ニュース表示管理</span>
            <span className="ml-1">{isNewsMenuOpen ? "▼" : "▶"}</span>
          </div>
          {isNewsMenuOpen && (
            <div className="pl-4 bg-gray-200 dark:bg-neutral-700">
              <div className="flex py-1">ニュースフィード</div>
              <div className="flex py-1">天気情報</div>
            </div>
          )}

          {userProfile?.role === "ADMIN" && (
            <>
              <div
                className="flex cursor-pointer select-none items-center bg-gray-300 dark:bg-neutral-800 pl-4 py-2"
                onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
              >
                <span>アカウント管理</span>
                <span className="ml-1">{isAccountMenuOpen ? "▼" : "▶"}</span>
              </div>
              {isAccountMenuOpen && (
                <div className="pl-4 bg-gray-200 dark:bg-neutral-700">
                  <div className="flex py-1">アカウント一覧</div>
                  <div className="flex py-1">ログインID/path変更</div>
                </div>
              )}

              <div
                className="flex cursor-pointer select-none items-center bg-gray-300 dark:bg-neutral-800 pl-4 py-2"
                onClick={() => setIsLinkMenuOpen(!isLinkMenuOpen)}
              >
                <span>管理サイトリンク</span>
                <span className="ml-1">{isLinkMenuOpen ? "▼" : "▶"}</span>
              </div>
              {isLinkMenuOpen && (
                <div className="pl-4 bg-gray-200 dark:bg-neutral-700">
                  <div className="flex py-1">GitHub リポジトリ</div>
                  <div className="flex py-1">Supabase プロジェクト</div>
                  <div className="flex py-1">Vercel デプロイ</div>
                </div>
              )}

              <div className="flex cursor-pointer select-none items-center bg-gray-300 dark:bg-neutral-800 mb-4 pl-4 py-2">
                サイトマップ
              </div>
            </>
          )}
        </div>

        {/* xxx--- ユーザープロフィール ---xxx */}
        <div className="mt-auto">
          {userProfile ? (
            <div className="p-4 mx-2 rounded-2xl bg-gray-200 dark:bg-neutral-800 border-2 border-gray-400 dark:border-neutral-500">
              {isProfileOpen && (
                <div className="border-b-2 border-gray-400 mb-2 pb-2">
                  <div className="divide-y divide-gray-400">
                    <div className="flex justify-center py-1.5">
                      アカウント情報
                    </div>
                    <div className="flex justify-center py-1.5">
                      アカウント設定
                    </div>
                    <div className="flex justify-center items-center py-1.5">
                      <button onClick={logout}>ログアウト</button>
                    </div>
                  </div>
                </div>
              )}
              <div
                className="flex-col justify-center cursor-pointer"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <div>
                  <div className="flex items-center gap-x-2">
                    <div className="rounded-full bg-gray-500 w-12 h-12 flex-shrink-0"></div>
                    <div>
                      {userProfile.username} さん ({userProfile.role})
                      <div className="text-gray-500">@{userProfile.id}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="flex cursor-pointer text-blue-600 hover:underline p-4"
              onClick={(e) => {
                e.stopPropagation();
                router.push("/login");
              }}
            >
              ログイン
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
