import { prisma } from "@/libs/prisma";
import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse } from "@/app/_types/ApiResponse";
import { verifySession } from "@/app/_helper/session";

export const config = {
  dynamic: "force-dynamic",
  fetchCache: "no-store",
  revalidate: 0,
};

export const GET = async (req: NextRequest) => {
  try {
    // 認証は行うが、全グループを返す
    const userId = await verifySession();
    if (!userId) {
      const res: ApiResponse<null> = {
        success: false,
        payload: null,
        message: "ログインしてください",
      };
      return NextResponse.json(res, { status: 401 });
    }

    const groups = await prisma.group.findMany({ orderBy: [{ name: "asc" }] });
    const res: ApiResponse<typeof groups> = {
      success: true,
      payload: groups,
      message: "グループ一覧を取得しました",
    };
    return NextResponse.json(res);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "未知のエラーです";
    const res: ApiResponse<null> = {
      success: false,
      payload: null,
      message: `サーバーエラーが発生しました::${msg}`,
    };
    return NextResponse.json(res, { status: 500 });
  }
};
