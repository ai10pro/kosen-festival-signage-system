"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ApiResponse } from "@/app/_types/ApiResponse";
import { useRouter } from "next/navigation";

const setPasswordRequestSchema = z
  .object({
    currentPassword: z.string().min(1, "現在のパスワードを入力してください"),
    newPassword: z.string(),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "新しいパスワードが一致しません",
    path: ["confirmNewPassword"],
  });

type SetPasswordRequest = z.infer<typeof setPasswordRequestSchema>;

const Page: React.FC = () => {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SetPasswordRequest>({
    mode: "onChange",
    resolver: zodResolver(setPasswordRequestSchema),
  });

  const setRootError = (errorMsg: string) => {
    setError("root", {
      type: "manual",
      message: errorMsg,
    });
  };

  const onSubmit = async (formValues: SetPasswordRequest) => {
    const ep = "/api/auth/set-password"; // パスワード設定APIのエンドポイント
    console.log(JSON.stringify(formValues));

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

      if (!res.ok) {
        // 400, 500番台エラーの場合
        const errorBody = await res.json();
        setRootError(errorBody.message || "サーバーエラーが発生しました");
        setIsPending(false);
        return;
      }

      const body = (await res.json()) as ApiResponse<null>;
      if (!body.success) {
        setRootError(body.message || "パスワードの変更に失敗しました");
        setIsPending(false);
        return;
      }

      router.push("/login");
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "予期せぬエラーが発生しました";
      setRootError(errorMsg);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
      <div className="p-6 max-w-sm w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <h1 className="text-xl font-semibold text-center text-gray-900 dark:text-white mb-6">
          パスワードの変更
        </h1>

        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 現在のパスワード */}
          <div>
            <label
              htmlFor="currentPassword"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              現在のパスワード
            </label>
            <input
              {...register("currentPassword")}
              id="currentPassword"
              type="password"
              placeholder="現在のパスワード"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              disabled={isPending}
              autoComplete="current-password"
            />
            {errors.currentPassword && (
              <p className="mt-1 text-sm text-red-600">
                {errors.currentPassword.message}
              </p>
            )}
          </div>

          {/* 新しいパスワード */}
          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              新しいパスワード
            </label>
            <input
              {...register("newPassword")}
              id="newPassword"
              type="password"
              placeholder="********"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              disabled={isPending}
              autoComplete="new-password"
            />
            {errors.newPassword && (
              <p className="mt-1 text-sm text-red-600">
                {errors.newPassword.message}
              </p>
            )}
          </div>

          {/* 新しいパスワード（確認用） */}
          <div>
            <label
              htmlFor="confirmNewPassword"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              新しいパスワード（確認用）
            </label>
            <input
              {...register("confirmNewPassword")}
              id="confirmNewPassword"
              type="password"
              placeholder="********"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              disabled={isPending}
              autoComplete="new-password"
            />
            {errors.confirmNewPassword && (
              <p className="mt-1 text-sm text-red-600">
                {errors.confirmNewPassword.message}
              </p>
            )}
          </div>

          {/* ルートエラー表示 (サーバー認証エラーなど) */}
          {errors.root && (
            <p className="mt-3 p-2 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300 rounded-md text-sm font-medium">
              {errors.root.message}
            </p>
          )}

          {/* 変更ボタン */}
          <button
            type="submit"
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white font-medium bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition duration-150"
            disabled={isPending}
          >
            {isPending ? "処理中..." : "変更する"}
          </button>
        </form>
      </div>
    </main>
  );
};

export default Page;