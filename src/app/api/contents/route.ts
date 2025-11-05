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
import { group } from "console";

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
        groupId: groupId ?? userId.groupId,
        tagIds: tagIds ?? [],
        editors: { connect: { id: userId } },
      },
    });

    const validatedContent = newContent as unknown as ContentResponse;
    return NextResponse.json(validatedContent, { status: 201 }); // 201: Created
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "未知のエラーです";
    return NextResponse.json(
      { error: `サーバーエラーが発生しました::${errorMsg}` },
      { status: 500 }
    );
  }
};
