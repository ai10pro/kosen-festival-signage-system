import { prisma } from "@/libs/prisma";
import type { UserProfile } from "@/app/_types/UserProfile";
import type { ApiResponse } from "@/app/_types/ApiResponse";
import { NextResponse } from "next/server";
import { verifySession } from "@/app/_helper/session";

export const config = {
  dynamic: "force-dynamic",
  fetchCache: "no-store",
  revalidate: 0,
};

export const GET = async () => {
  try {
    let userId: string | null = "";
    userId = await verifySession();

    if (!userId) {
      const res: ApiResponse<null> = {
        success: false,
        payload: null,
        message: "ログインしてください",
      };
      return NextResponse.json(res, { status: 401 });
    }

    const user = (await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        role: true,
      },
    })) as UserProfile | null;

    if (!user) {
      const res: ApiResponse<null> = {
        success: false,
        payload: null,
        message: "ユーザーが見つかりません",
      };
      return NextResponse.json(res, { status: 404 });
    }

    const res: ApiResponse<UserProfile> = {
      success: true,
      payload: user,
      message: "",
      metadata: JSON.stringify({ publishedAt: new Date() }),
    };
    return NextResponse.json(res);
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "未知のエラーです";
    const res: ApiResponse<null> = {
      success: false,
      payload: null,
      message: `サーバーエラーが発生しました::${errorMsg}`,
    };
    return NextResponse.json(res, { status: 500 });
  }
};
