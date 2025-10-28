import { prisma } from "@/libs/prisma";
import { NextRequest, NextResponse } from "next/server";

import {
  CreateImageRequest,
  createImageSchema,
  ImageResponse,
  ImageResponseSchema,
} from "@/app/_types/ImageRequest";
import { generateMD5Hash } from "@/app/_helper/generateHash";
import { ApiResponse } from "@/app/_types/ApiResponse";

export const config = {
  dynamic: "force-dynamic",
  fetchCache: "no-store",
  revalidate: 0,
};

/**
 * GET /api/images
 * 全ての画像レコードを取得するAPI。
 * 開発・管理画面での一覧表示に使用します。
 * @returns Image[] - 画像のリスト
 */
export const GET = async () => {
  try {
    const images = await prisma.image.findMany({
      orderBy: [{ contentId: "asc" }, { order: "asc" }],
    });

    // 画像データをバリデーション
    const validatedImages: ImageResponse[] = images.map((image) =>
      ImageResponseSchema.parse(image)
    );

    return NextResponse.json<ApiResponse<ImageResponse[]>>(
      {
        success: true,
        payload: validatedImages,
        message: "画像データを正常に取得しました。",
      },
      { status: 200 }
    );
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

/**
 * POST /api/images
 * 新しい画像レコードを作成（URL登録）するAPI。
 * @returns ImageResponse - 作成された画像データ
 */
export const POST = async (req: NextRequest) => {
  try {
    const json: CreateImageRequest = await req.json();

    // リクエストボディのバリデーション
    const validation = createImageSchema.safeParse(json);
    if (!validation.success) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          payload: null,
          message: `バリデーションエラー: ${validation.error.issues
            .map((e) => e.message)
            .join(", ")}`,
        },
        { status: 400 }
      );
    }

    const { storageUrl, contentId, order } = validation.data;
    const fileHash = generateMD5Hash(storageUrl);
    const existingImage = await prisma.image.findFirst({
      where: { fileHash },
    });

    // 同じハッシュの画像が既に存在する場合はエラーを返す
    if (existingImage) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          payload: null,
          message: "同じ画像が既に登録されています。",
        },
        { status: 409 }
      );
    }

    const contentExists = await prisma.content.findUnique({
      where: { id: contentId },
    });
    if (!contentExists) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          payload: null,
          message: "指定されたコンテンツIDが存在しません。",
        },
        { status: 400 }
      );
    }

    const newImage = await prisma.image.create({
      data: {
        storageUrl,
        fileHash,
        contentId,
        order: order ?? 0,
      },
    });

    const validatedImage = ImageResponseSchema.parse(newImage);

    return NextResponse.json<ApiResponse<ImageResponse>>(
      {
        success: true,
        payload: validatedImage,
        message: "画像が正常に登録されました。",
      },
      { status: 201 }
    );
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
