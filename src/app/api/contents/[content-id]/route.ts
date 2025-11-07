import { prisma } from "@/libs/prisma";
import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/app/_types/ApiResponse";

import {
  ContentResponse,
  CreateContentRequest,
  createContentSchema,
} from "@/app/_types/ContentRequest";
import { verifySession } from "@/app/_helper/session";
// no direct enum import needed here
import { getGroupIdFromUser } from "@/app/_helper/getGroup";
import { generateMD5Hash } from "@/app/_helper/generateHash";

type RouteParams = {
  params: Promise<{
    "content-id": string;
  }>;
};

export const config = {
  dynamic: "force-dynamic",
  fetchCache: "no-store",
  revalidate: 0,
};

/**
 * GET /api/contents/[content-id]
 * 指定したコンテンツレコードを取得するAPI。
 * 開発・管理画面での一覧表示に使用します。
 * @returns Content - コンテンツのリスト
 */
export const GET = async (req: NextRequest, routeParams: RouteParams) => {
  try {
    // セッション検証：ログインユーザーのIDを取得
    const userId = await verifySession();
    if (!userId) {
      const res: ApiResponse<null> = {
        success: false,
        payload: null,
        message: "ログインしてください",
      };
      return NextResponse.json(res, { status: 401 });
    }
    const params = await routeParams.params;
    const id = params["content-id"];
    // ID に対応する単一レコードを取得する（関連データも含める）
    const content = await prisma.content.findUnique({
      where: { id },
      include: {
        images: { orderBy: { createdAt: "asc" } },
        contentTags: { include: { tag: true } },
        uploader: { select: { id: true, username: true } },
        group: { select: { id: true, name: true } },
        editors: { select: { id: true, username: true } },
      },
    });

    if (!content) {
      return NextResponse.json(
        { error: "指定されたコンテンツが見つかりませんでした。" },
        { status: 404 }
      );
    }

    // 単一コンテンツを API スキーマに合わせてキャスト（簡易バリデーション）
    const validatedContent: ContentResponse =
      content as unknown as ContentResponse;

    return NextResponse.json(validatedContent, { status: 200 });
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "未知のエラーです";
    return NextResponse.json(
      { error: `サーバーエラーが発生しました::${errorMsg}` },
      { status: 500 }
    );
  }
};

/**
 * PUT /api/contents/[content-id]
 * 指定したコンテンツレコードを更新するAPI。
 * @returns ContentResponse - 更新されたコンテンツデータ
 */
export const PUT = async (req: NextRequest, routeParams: RouteParams) => {
  try {
    // セッション検証：ログインユーザーのIDを取得
    const userId = await verifySession();
    if (!userId) {
      const res: ApiResponse<null> = {
        success: false,
        payload: null,
        message: "ログインしてください",
      };
      return NextResponse.json(res, { status: 401 });
    }

    const params = await routeParams.params;
    const id = params["content-id"];

    const userGroups = await getGroupIdFromUser(userId);
    if (!userGroups) {
      return NextResponse.json(
        { error: "ユーザーのグループ情報が見つかりません" },
        { status: 400 }
      );
    }

    // リクエストボディのバリデーション
    const result = createContentSchema.safeParse(await req.json());
    if (!result.success) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          payload: null,
          message: `バリデーションエラー: ${result.error.issues
            .map((e) => e.message)
            .join(", ")}`,
        },
        { status: 400 }
      );
    }

    const { title, description, groupId, tagIds } = result.data;
    const images = result.data.images || [];

    // 既存コンテンツが存在するか確認
    const existing = await prisma.content.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "指定されたidのコンテンツが見つかりませんでした。" },
        { status: 404 }
      );
    }

    // トランザクションで一括更新する
    await prisma.$transaction(async (tx) => {
      // 本体更新
      await tx.content.update({
        where: { id },
        data: {
          title,
          description,
          groupId: groupId ?? existing.groupId,
          editors: { connect: { id: userId } },
        },
      });

      // タグを差し替える
      if (Array.isArray(tagIds)) {
        await tx.contentTag.deleteMany({ where: { contentId: id } });
        if (tagIds.length > 0) {
          await tx.contentTag.createMany({
            data: tagIds.map((tagId) => ({ contentId: id, tagId })),
          });
        }
      }

      // 画像を差し替える
      if (Array.isArray(images)) {
        await tx.image.deleteMany({ where: { contentId: id } });
        if (images.length > 0) {
          for (const image of images) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (tx as any).image.create({
              data: {
                storageUrl: image.url,
                fileHash: generateMD5Hash(image.url),
                contentId: id,
                order: image.order ?? 0,
              },
            });
          }
        }
      }
    });

    // トランザクション完了後に更新後のレコードを取得して返却
    const updatedContent = await prisma.content.findUnique({
      where: { id },
      include: {
        images: {},
        contentTags: { include: { tag: true } },
        uploader: { select: { id: true, username: true } },
        group: { select: { id: true, name: true } },
        editors: { select: { id: true, username: true } },
      },
    });

    if (!updatedContent) {
      return NextResponse.json(
        { error: "更新後のコンテンツが取得できませんでした。" },
        { status: 500 }
      );
    }

    const validatedContent = updatedContent as unknown as ContentResponse;
    return NextResponse.json<ApiResponse<ContentResponse>>(
      {
        success: true,
        payload: validatedContent,
        message: "コンテンツが正常に更新されました。",
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "未知のエラーです";
    return NextResponse.json(
      { error: `サーバーエラーが発生しました::${errorMsg}` },
      { status: 500 }
    );
  }
};

/**
 * DELETE /api/contents/[content-id]
 * 指定したコンテンツレコードを削除するAPI。
 * @returns ApiResponse<null> - 削除結果
 */
export const DELETE = async (req: NextRequest, routeParams: RouteParams) => {
  try {
    // セッション検証：ログインユーザーのIDを取得
    const userId = await verifySession();
    if (!userId) {
      const res: ApiResponse<null> = {
        success: false,
        payload: null,
        message: "ログインしてください",
      };
      return NextResponse.json(res, { status: 401 });
    }

    const params = await routeParams.params;
    const id = params["content-id"];
    const content = await prisma.content.findUnique({ where: { id } });
    if (!content) {
      return NextResponse.json(
        { error: "指定されたidのコンテンツが見つかりませんでした。" },
        { status: 404 }
      );
    }

    // ユーザーの所属グループを取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { userGroups: true },
    });
    const groupIds = (user?.userGroups || []).map((ug) => ug.groupId);

    // ADMIN ロールのユーザーは削除を許可
    const isAdmin = user?.role === "ADMIN";

    // ADMIN でなければ所属グループと一致する必要がある
    if (!isAdmin) {
      if (!content.groupId || !groupIds.includes(content.groupId)) {
        const res: ApiResponse<null> = {
          success: false,
          payload: null,
          message: "このコンテンツを削除する権限がありません。",
        };
        return NextResponse.json(res, { status: 403 });
      }
    }

    await prisma.content.delete({ where: { id } });
    return NextResponse.json<ApiResponse<null>>(
      {
        success: true,
        payload: null,
        message: "コンテンツが正常に削除されました。",
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "未知のエラーです";
    return NextResponse.json(
      { error: `サーバーエラーが発生しました::${errorMsg}` },
      { status: 500 }
    );
  }
};
