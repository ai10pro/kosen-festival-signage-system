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

    // 各 group に紐づく Image の contentId をまとめる
    const allGroupIds = (
      signages.flatMap((s: any) =>
        (s.contentSettings || []).map((cs: any) => cs.group?.id).filter(Boolean)
      ) as string[]
    ).filter((v, i, a) => a.indexOf(v) === i);

    let imagesByGroup: Record<string, string[]> = {};
    if (allGroupIds.length > 0) {
      const imgs = await (prisma.image as any).findMany({
        where: { groupId: { in: allGroupIds } },
        select: { contentId: true, groupId: true },
      });

      imagesByGroup = imgs.reduce((acc: Record<string, string[]>, it: any) => {
        const gid = it.groupId;
        if (!acc[gid]) acc[gid] = [];
        if (it.contentId && !acc[gid].includes(it.contentId)) {
          acc[gid].push(it.contentId);
        }
        return acc;
      }, {});
    }

    // signages を変換して、group 毎に imageContentIds を追加する
    const signagesWithImageContentIds = (signages as any).map((s: any) => ({
      ...s,
      contentSettings: (s.contentSettings || []).map((cs: any) => ({
        ...cs,
        group: cs.group || null,
        imageContentIds: imagesByGroup[cs.group?.id ?? ""] || [],
      })),
    }));

    const res: ApiResponse<any> = {
      success: true,
      payload: signagesWithImageContentIds,
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
