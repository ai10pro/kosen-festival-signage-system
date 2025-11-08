/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/libs/prisma";
import { verifySession } from "@/app/_helper/session";
import { ApiResponse } from "@/app/_types/ApiResponse";
import { SignageConfigResponse } from "@/app/_types/SignageConfig";
import { ContentResponse } from "@/app/_types/ContentRequest";

export const config = {
  dynamic: "force-dynamic",
  fetchCache: "no-store",
  revalidate: 0,
};

/**
 * GET /api/signages
 * サイネージの設定（例: 表示時間）を返します。
 * レスポンスの payload は { config: { view_time: number } } 型です。
 */
export const GET = async (req: NextRequest) => {
  try {
    void req;

    // サイネージ端末からのポーリングなどで lastActiveAt を更新したい場合、
    // クエリ、ヘッダー、あるいは JSON ボディに signageId/user/key を渡せばセッション無しで更新します。
    const url = new URL(req.url);
    const signageIdParam =
      url.searchParams.get("signageId") ?? url.searchParams.get("id");
    const uniqueKeyParam =
      url.searchParams.get("uniqueKey") ?? url.searchParams.get("key");
    // ヘッダのサポート（端末から送る場合に便利）
    const headerKey =
      req.headers.get("x-signage-key") ?? req.headers.get("x-key");
    const headerUser =
      req.headers.get("x-signage-user") ?? req.headers.get("x-user");
    // ボディのサポート（POST でも受ける可能性がある場合）
    let bodyJson: any = null;
    try {
      // only attempt to parse JSON when content-type present
      const ct = req.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        bodyJson = await req.json();
      }
    } catch {
      bodyJson = null;
    }
    const bodyKey = bodyJson?.key ?? bodyJson?.uniqueKey ?? null;
    const bodyUser =
      bodyJson?.userName ?? bodyJson?.user ?? bodyJson?.username ?? null;

    const finalKey = uniqueKeyParam ?? headerKey ?? bodyKey;
    const finalSignageId =
      signageIdParam ?? bodyJson?.signageId ?? bodyJson?.id ?? null;

    if (finalSignageId || finalKey) {
      // セッション検証は行わず、対象サイネージの lastActiveAt を更新する
      const where: any = finalSignageId
        ? { id: finalSignageId }
        : { uniqueKey: finalKey };
      let signage = null as any;
      try {
        signage = await prisma.signage.findUnique({
          where,
          include: { contentSettings: { include: { group: true } } },
        });
        if (signage) {
          // 必ず lastActiveAt を更新
          await prisma.signage.update({
            where: { id: signage.id },
            data: { lastActiveAt: new Date() },
          });
        }
      } catch {
        // 見つからない等は無視して通常レスポンスへ
      }

      // オプション: userName が渡されている場合は user.name と key の組合せで検証して1件返す
      const userNameParam =
        url.searchParams.get("userName") ??
        url.searchParams.get("user") ??
        url.searchParams.get("username") ??
        headerUser ??
        bodyUser;
      if (userNameParam) {
        if (!signage) {
          const res: ApiResponse<null> = {
            success: false,
            payload: null,
            message: "サイネージが見つかりません",
          };
          return NextResponse.json(res, { status: 404 });
        }

        // ユーザー存在チェック
        const user = await prisma.user.findUnique({
          where: { username: userNameParam },
        });
        if (!user) {
          const res: ApiResponse<null> = {
            success: false,
            payload: null,
            message: "ユーザーが見つかりません",
          };
          return NextResponse.json(res, { status: 404 });
        }

        // ユーザーがこのサイネージで参照されるいずれかのグループに所属しているか確認
        const referencedGroupIds = (signage.contentSettings || [])
          .map((cs: any) => cs.groupId)
          .filter(Boolean);
        const membership = await prisma.userGroup.findFirst({
          where: { userId: user.id, groupId: { in: referencedGroupIds } },
        });
        if (!membership) {
          const res: ApiResponse<null> = {
            success: false,
            payload: null,
            message: "指定ユーザーはこのサイネージにアクセスできません",
          };
          return NextResponse.json(res, { status: 403 });
        }

        // 条件に合うサイネージを一件返す（先に lastActiveAt は更新済み）
        const payload = signage as any;
        const res: ApiResponse<any> = {
          success: true,
          payload,
          message: "サイネージを取得しました",
        };
        return NextResponse.json(res);
      }
      // userName が指定されていなければ通常の動作に続行して一覧等を返す
    } else {
      const userId = await verifySession();
      if (!userId) {
        const res: ApiResponse<null> = {
          success: false,
          payload: null,
          message: "ログインしてください",
        };
        return NextResponse.json(res, { status: 401 });
      }
    }

    // 環境変数で表示時間を設定できるようにする。デフォルトは 30 秒。
    const envVal =
      process.env.NEXT_PUBLIC_SIGNAGE_VIEW_TIME ??
      process.env.SIGNAGE_VIEW_TIME;
    const viewTime = Number(envVal ?? 30);

    // データベースからサイネージと紐づく groupId を取得する
    const signages = await (prisma.signage as any).findMany({
      include: { contentSettings: { include: { group: true } } },
      orderBy: [{ locationName: "asc" }],
    });

    const groupIds: string[] = (
      signages
        .flatMap((s: any) =>
          (s.contentSettings || []).map((cs: any) => cs.group?.id)
        )
        .filter(Boolean) as string[]
    ).filter((v, i, a) => a.indexOf(v) === i);

    // 全コンテンツを一度だけ取得して内部でグルーピング（DBへの複数リクエストを避ける）
    const allContents = await prisma.content.findMany({
      orderBy: [{ createdAt: "desc" }],
      include: {
        images: { orderBy: { createdAt: "asc" } },
        contentTags: { include: { tag: true } },
        uploader: { select: { id: true, username: true } },
        group: { select: { id: true, name: true } },
        editors: { select: { id: true, username: true } },
      },
    });

    const contentsMap: Record<string, ContentResponse[]> = {};
    for (const c of allContents) {
      const gid = (c as any).group?.id ?? (c as any).groupId;
      if (!gid) continue;
      if (!groupIds.includes(gid)) continue; // サイネージで参照されるグループのみ
      if (!contentsMap[gid]) contentsMap[gid] = [];
      contentsMap[gid].push(c as unknown as ContentResponse);
    }

    const payload: SignageConfigResponse = {
      config: {
        viewtime: Number.isFinite(viewTime) ? viewTime : 30,
        view_groups: groupIds,
      },
      contents: contentsMap,
    };

    const res: ApiResponse<SignageConfigResponse> = {
      success: true,
      payload,
      message: "サイネージ設定とコンテンツを取得しました",
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
