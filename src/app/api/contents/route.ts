import { prisma } from "@/libs/prisma";
import { NextRequest, NextResponse } from "next/server";

import { ContentResponse } from "@/app/_types/ContentRequest";

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
    const validatedContents: ContentResponse[] = contents.map((content) =>
      content as unknown as ContentResponse
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
    const reqBody = await req.json();

    const newContent = await prisma.content.create({
      data: {
        title: reqBody.title,
        description: reqBody.description,
        status: reqBody.status,
        uploaderId: reqBody.uploaderId,
        groupId: reqBody.groupId || null,
      },
      include: {
        images: {
          orderBy: { order: "asc" },
        },
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
