"use client";

import React, { useState, useEffect, createContext } from "react";
import type { UserProfile } from "@/app/_types/UserProfile";
import useSWR, { mutate } from "swr";
import type { ApiResponse } from "../_types/ApiResponse";
import { sessionFetcher } from "./sessionFetcher";

// 認証コンテキストの作成
interface AuthContextProps {
  userProfile: UserProfile | null;
  logout: () => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextProps | undefined>(
  undefined
);

interface Props {
  children: React.ReactNode;
}

const AuthProvider: React.FC<Props> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { data: session } = useSWR<ApiResponse<UserProfile>>(
    "/api/auth",
    sessionFetcher
  );

  useEffect(() => {
    if (session && session.success) {
      setUserProfile(session.payload);
      return;
    }
    setUserProfile(null);
  }, [session]);

  const logout = async () => {
    // ■■ セッションベース認証 ■■
    // → バックエンドにログアウトリクエストを送信してセッションを破棄
    await fetch("/api/auth/logout", {
      method: "DELETE",
      credentials: "same-origin",
    });
    // SWR キャッシュを無効化
    mutate(() => true, undefined, { revalidate: false });
    setUserProfile(null);
    return true;
  };

  return (
    <AuthContext.Provider value={{ userProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
