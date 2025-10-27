import { prisma } from "@/libs/prisma";
import { loginRequestSchema } from "@/app/_types/LoginRequest";
import { userProfileSchema } from "@/app/_types/UserProfile";
import type { UserProfile } from "@/app/_types/UserProfile";
import type { ApiResponse } from "@/app/_types/ApiResponse";
import { NextRequest, NextResponse } from "next/server";

import { createSession } from "@/app/_helper/session";
import bcrypt from "bcryptjs";

export const config = {
  dynamic: "force-dynamic",
  fetchCache: "no-store",
  revalidate: 0,
};

export const POST = async (req: NextRequest) => {
  try {
    // バリデーション
    const result = loginRequestSchema.safeParse(await req.json());
    // バリデーションエラーの時
    if (!result.success) {
      const res: ApiResponse<null> = {
        success: false,
        payload: null,
        message: "リクエストボディが不正です::" + result.error.message, // ★：詳細なエラーメッセージは削除
      };
      return NextResponse.json(res, { status: 400 });
    }
    // loginRequestとして扱う
    const loginRequest = result.data;

    // ユーザー名でユーザーを検索
    const user = await prisma.user.findUnique({
      where: {
        username: loginRequest.userName,
      },
      select: {
        id: true,
        username: true,
        passwordHash: true,
        role: true,
      },
    });
    if (!user) {
      const res: ApiResponse<null> = {
        success: false,
        payload: null,
        message: "ユーザー名またはパスワードが違います",
      };
      return NextResponse.json(res, { status: 401 });
    }

    // パスワード検証
    const isValidPassword = await bcrypt.compare(
      loginRequest.password,
      user.passwordHash
    );
    if (!isValidPassword) {
      const res: ApiResponse<null> = {
        success: false,
        payload: null,
        message: "ユーザー名またはパスワードが違います",
      };
      return NextResponse.json(res, { status: 401 });
    }

    // セッションベース認証処理
    const tokenMaxAgeSecond = 60 * 60 * 24 * 7; // 7日間
    await createSession(user.id, tokenMaxAgeSecond);
    const res: ApiResponse<UserProfile> = {
      success: true,
      payload: userProfileSchema.parse(user),
      message: "",
    };
    return NextResponse.json(res);

    // 成功レスポンス
  } catch (e) {
    const errorMessage =
      e instanceof Error ? e.message : "Internal Server Error";
    console.log("Login error:", errorMessage);
    const res: ApiResponse<null> = {
      success: false,
      payload: null,
      message: "サーバーエラーが発生しました::" + errorMessage, // ★：詳細なエラーメッセージは削除
    };
    return NextResponse.json(res, { status: 500 });
  }
};
