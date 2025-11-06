import { prisma } from "@/libs/prisma";
import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/app/_types/ApiResponse";

import {
  ContentResponse,
  CreateContentRequest,
  createContentSchema,
} from "@/app/_types/ContentRequest";
import { verifySession } from "@/app/_helper/session";
import { ContentStatus as PrismaContentStatus } from "@prisma/client";
import { getGroupIdFromUser } from "@/app/_helper/getGroup";
import { generateMD5Hash } from "@/app/_helper/generateHash";

export const config = {
  dynamic: "force-dynamic",
  fetchCache: "no-store",
  revalidate: 0,
};

/**
 * GET /api/contents
 * 全てのコンテンツレコードを取得するAPI。
 * 開発・管理画面での一覧表示に使用します。
 * @returns Content[] - コンテンツのリスト
 */
export const GET = async () => {
  try {
    const contents = await prisma.content.findMany({
      orderBy: [{ createdAt: "desc" }],
      include: {
        images: {
          orderBy: { order: "asc" },
        },
      },
    });

    // コンテンツデータをバリデーション
    const validatedContents: ContentResponse[] = contents.map(
      (content) => content as unknown as ContentResponse
    );

    return NextResponse.json(validatedContents, { status: 200 });
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
 * POST /api/contents
 * 新しいコンテンツレコードを作成するAPI。
 * @returns ContentResponse - 作成されたコンテンツデータ
 */
export const POST = async (req: NextRequest) => {
  try {
    let userId: string | null = "";
    userId = await verifySession();

    if (!userId) {
      return NextResponse.json(
        { error: "ログインしてください" },
        { status: 401 }
      );
    }
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
    const images = result.data.images;

    const newContent = await prisma.content.create({
      data: {
        title,
        description,
        status: PrismaContentStatus.PENDING,
        uploaderId: userId,
        groupId: groupId ?? userGroups,
        contentTags: {
          create: tagIds?.map((tagId) => ({ tagId })),
        },
        editors: { connect: { id: userId } },
      },
    });

    // コンテンツIDを取得
    const newContentId = newContent.id;
    // 画像データを登録
    for (const image of images) {
      await prisma.image.create({
        data: {
          storageUrl: image.url,
          fileHash: generateMD5Hash(image.url),
          order: image.order,
          contentId: newContentId,
        },
      });
    }
    // 最終的なコンテンツデータを取得（画像も含む）
    const createdContent = await prisma.content.findUnique({
      where: { id: newContentId },
      include: {
        images: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!createdContent) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          payload: null,
          message: "コンテンツの作成に失敗しました。",
        },
        { status: 500 }
      );
    } else if (createdContent) {
      const validatedContent =
        createdContent as unknown as ContentResponse;
      return NextResponse.json<ApiResponse<ContentResponse>>(
        {
          success: true,
          payload: validatedContent,
          message: "コンテンツが正常に作成されました。",
        },
        { status: 201 }
      );
    }
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "未知のエラーです";
    return NextResponse.json(
      { error: `サーバーエラーが発生しました::${errorMsg}` },
      { status: 500 }
    );
  }
};
