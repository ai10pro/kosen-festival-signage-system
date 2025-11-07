import { prisma } from "@/libs/prisma";
import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/app/_helper/session";
import { ApiResponse } from "@/app/_types/ApiResponse";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const config = {
  dynamic: "force-dynamic",
  fetchCache: "no-store",
  revalidate: 0,
};

/**
 * GET /api/signages
 * サイネージ一覧を返すAPI。セッション検証を行い、
 * 各 Signage に紐づく SignageContent（group を含む）を併せて返却します。
 */
export const GET = async (req: NextRequest) => {
  try {
    // 引数の未使用警告を抑制
    void req;
    const userId = await verifySession();
    if (!userId) {
      const res: ApiResponse<null> = {
        success: false,
        payload: null,
        message: "ログインしてください",
      };
      return NextResponse.json(res, { status: 401 });
    }

    // 全サイネージを取得。SignageContent 経由で Group を含める。
    // Prisma クライアントの型がスキーマ変更の影響で一致しない場合があるため
    // 実行時の取得を優先し any として呼び出す（型安全性は実行環境で担保してください）
    const signages = await (prisma.signage as any).findMany({
      include: {
        contentSettings: {
          include: { group: true },
          orderBy: { order: "asc" },
        },
        contentTags: true,
      },
      orderBy: [{ locationName: "asc" }],
    });

    const res: ApiResponse<typeof signages> = {
      success: true,
      payload: signages,
      message: "サイネージ一覧を取得しました",
    };

    return NextResponse.json(res, { status: 200 });
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
