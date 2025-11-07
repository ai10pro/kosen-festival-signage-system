"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { LoginRequest, loginRequestSchema } from "@/app/_types/LoginRequest";
import { LoginSuccessResponse } from "@/app/_types/LoginSuccessResponse";
import { UserProfile, userProfileSchema } from "@/app/_types/UserProfile";
import { ApiResponse } from "@/app/_types/ApiResponse";

import { twMerge } from "tailwind-merge";
import NextLink from "next/link";
import { useRouter } from "next/navigation";

const Page: React.FC = () => {
  const c_UserName = "userName";
  const c_Password = "password";

  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [isLoginCompleted, setIsLoginCompleted] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isPasswordSet, setIsPasswordSet] = useState<boolean>(false);

  const formMethods = useForm<LoginRequest>({
    mode: "onChange",
    resolver: zodResolver(loginRequestSchema),
  });
  const fieldErrors = formMethods.formState.errors;

  const setRootError = (errorMsg: string) => {
    formMethods.setError("root", {
      type: "manual",
      message: errorMsg,
    });
  };

  // URLパラメータからユーザー名をセット
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const username = searchParams.get("C_UserName");
    formMethods.setValue("userName", username || "");
  }, [formMethods]);

  // フォームフィールドの変更を監視し、エラーをクリア
  useEffect(() => {
    const subscription = formMethods.watch((value, { name }) => {
      if (name === c_UserName || name === c_Password) {
        formMethods.clearErrors("root");
      }
    });
    return () => subscription.unsubscribe();
  }, [formMethods]);

  const errors = {
    userName: null as { message: string } | null,
    password: null as { message: string } | null,
    root: null as { message: string } | null,
  };

  // ログイン完了後のリダイレクト処理
  useEffect(() => {
    setIsPasswordSet(true); // ★：デバッグ用に常にtrueに設定
    if (isLoginCompleted && isPasswordSet) {
      router.push("/");
    } else if (isLoginCompleted && !isPasswordSet) {
      router.push("/login/set-password");
    } else {
      router.push("/login");
    }
  }, [isLoginCompleted, isPasswordSet, router]);

  const onSubmit = async (formValues: LoginRequest) => {
    const ep = "/api/auth/login";
    console.log(JSON.stringify(formValues)); // ★：デバッグ用ログ

    try {
      setIsPending(true);
      setRootError("");

      const res = await fetch(ep, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formValues),
        credentials: "same-origin",
        cache: "no-store",
      });
      setIsPending(false);

      if (!res.ok) return;

      const body = (await res.json()) as ApiResponse<LoginSuccessResponse>;
      if (!body.success) {
        setRootError(body.message || "ログインに失敗しました");
        return;
      }

      // セッションベース認証の処理
      setUserProfile(userProfileSchema.parse(body.payload));
      console.log("ユーザープロファイル:", body.payload); // ★：デバッグ用ログ
      setIsPasswordSet(body.payload.isPasswordSet);
      setIsLoginCompleted(true);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "予期せぬエラーが発生しました";
      setRootError(errorMsg);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
      <div className="p-6 max-w-sm w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <h1 className="text-xl font-semibold text-center text-gray-900 dark:text-white mb-6">
          ログイン
        </h1>

        <form
          noValidate
          onSubmit={formMethods.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          {/* User ID (UserName) フィールド */}
          <div>
            <label
              htmlFor={c_UserName}
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              ユーザーID
            </label>
            <input
              {...formMethods.register(c_UserName)}
              id={c_UserName}
              type="text"
              placeholder="admin"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              disabled={isPending || isLoginCompleted}
              autoComplete="username"
            />
            {errors.userName && (
              <p className="mt-1 text-sm text-red-600">
                {errors.userName.message}
              </p>
            )}
          </div>

          {/* Password フィールド */}
          <div>
            <label
              htmlFor={c_Password}
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              パスワード
            </label>
            <input
              {...formMethods.register(c_Password)}
              id={c_Password}
              type="password"
              placeholder="********"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              disabled={isPending || isLoginCompleted}
              autoComplete="current-password"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">
                {errors.password.message}
              </p>
            )}

            {/* ルートエラー表示 (サーバー認証エラー) */}
            {errors.root && (
              <p className="mt-3 p-2 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300 rounded-md text-sm font-medium">
                {errors.root.message}
              </p>
            )}
          </div>

          {/* ログインボタン */}
          <button
            type="submit"
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white font-medium bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition duration-150"
            disabled={isPending || isLoginCompleted}
          >
            {isPending ? "処理中..." : "ログイン"}
          </button>
        </form>
      </div>
    </main>
  );
};

export default Page;
