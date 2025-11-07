import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/libs/prisma";
import { verifySession } from "@/app/_helper/session";
import {
  UpdateImageRequest,
  updateImageSchema,
  ImageResponse,
  ImageResponseSchema,
} from "@/app/_types/ImageRequest";
import { ApiResponse } from "@/app/_types/ApiResponse";

/**
 * 共通処理：IDに基づいて画像レコードを取得する関数
 * @param id 画像ID
 * @returns 画像レコードまたはnull
 */
async function findImageById(id: string) {
  const image = await prisma.image.findUnique({
    where: { id },
  });
  if (!image) {
    return null;
  }
  return ImageResponseSchema.parse(image);
}

/**
 * GET /api/images/[id]
 * 特定の画像レコードを取得するAPI。
 * @param params.id - 画像ID（UUID）
 * @returns ImageResponse - 画像データ
 */

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const p = await params;
  const id = p.id;

  try {
    // 認証と所属グループチェック
    const userId = await verifySession();
    if (!userId) {
      const res: ApiResponse<null> = {
        success: false,
        payload: null,
        message: "ログインしてください",
      };
      return NextResponse.json(res, { status: 401 });
    }

    const image = await findImageById(id);
    if (!image) {
      const res: ApiResponse<null> = {
        success: false,
        payload: null,
        message: "画像が見つかりませんでした。",
      };
      return NextResponse.json(res, { status: 404 });
    }

    // 画像に割り当てられた groupId がユーザーの所属グループに含まれるか確認
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { userGroups: true },
    });
    const groupIds = (user?.userGroups || []).map((ug) => ug.groupId);

    if (!image.groupId || !groupIds.includes(image.groupId)) {
      const res: ApiResponse<null> = {
        success: false,
        payload: null,
        message: "この画像にアクセスする権限がありません。",
      };
      return NextResponse.json(res, { status: 403 });
    }

    return NextResponse.json<ApiResponse<ImageResponse>>(
      {
        success: true,
        payload: image,
        message: "画像データを取得しました。",
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMsg = `画像取得エラー（ID: ${id}）:: ${
      error instanceof Error ? error.message : "未知のエラーです"
    }`;
    const res: ApiResponse<null> = {
      success: false,
      payload: null,
      message: errorMsg,
    };
    return NextResponse.json(res, { status: 500 });
  }
};

/**
 * PATCH /api/images/[id]
 * 特定の画像レコードを更新するAPI。
 * @param params.id - 画像ID（UUID）
 * @returns ImageResponse - 更新された画像データ
 */
export const PATCH = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const p = await params;
  const id = p.id;

  try {
    const json: UpdateImageRequest = await req.json();

    // リクエストボディのバリデーション
    const validation = updateImageSchema.safeParse(json);
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
    const dateToUpdate = validation.data;

    // 認証と所属チェック
    const userId = await verifySession();
    if (!userId) {
      const res: ApiResponse<null> = {
        success: false,
        payload: null,
        message: "ログインしてください",
      };
      return NextResponse.json(res, { status: 401 });
    }

    const image = await findImageById(id);
    if (!image) {
      const res: ApiResponse<null> = {
        success: false,
        payload: null,
        message: "画像が見つかりませんでした。",
      };
      return NextResponse.json(res, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { userGroups: true },
    });
    const groupIds = (user?.userGroups || []).map((ug) => ug.groupId);

    if (!image.groupId || !groupIds.includes(image.groupId)) {
      const res: ApiResponse<null> = {
        success: false,
        payload: null,
        message: "この画像を更新する権限がありません。",
      };
      return NextResponse.json(res, { status: 403 });
    }

    // 画像更新
    const updateImage = await prisma.image.update({
      where: { id },
      data: { ...dateToUpdate },
    });

    const validatedImage = ImageResponseSchema.parse(updateImage);

    return NextResponse.json<ApiResponse<ImageResponse>>(
      {
        success: true,
        payload: validatedImage,
        message: "画像が正常に更新されました。",
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "P2025") {
      const res: ApiResponse<null> = {
        success: false,
        payload: null,
        message: "画像が見つかりませんでした。",
      };
      return NextResponse.json(res, { status: 404 });
    }

    const errorMsg = `画像更新エラー（ID: ${id}）:: ${
      error instanceof Error ? error.message : "未知のエラーです"
    }`;
    const res: ApiResponse<null> = {
      success: false,
      payload: null,
      message: errorMsg,
    };
    return NextResponse.json(res, { status: 500 });
  }
};

/**
 * DELETE /api/images/[id]
 * 特定の画像レコードを削除するAPI。
 * @param params.id - 画像ID（UUID）
 * @returns ImageResponse - 削除された画像データ
 */
export const DELETE = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const p = await params;
  const id = p.id;

  try {
    // 認証と所属チェック
    const userId = await verifySession();
    if (!userId) {
      const res: ApiResponse<null> = {
        success: false,
        payload: null,
        message: "ログインしてください",
      };
      return NextResponse.json(res, { status: 401 });
    }

    const image = await findImageById(id);
    if (!image) {
      const res: ApiResponse<null> = {
        success: false,
        payload: null,
        message: "画像が見つかりませんでした。",
      };
      return NextResponse.json(res, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { userGroups: true },
    });
    const groupIds = (user?.userGroups || []).map((ug) => ug.groupId);

    if (!image.groupId || !groupIds.includes(image.groupId)) {
      const res: ApiResponse<null> = {
        success: false,
        payload: null,
        message: "この画像を削除する権限がありません。",
      };
      return NextResponse.json(res, { status: 403 });
    }

    const deletedImage = await prisma.image.delete({
      where: { id },
    });
    ImageResponseSchema.parse(deletedImage);

    return NextResponse.json<ApiResponse<null>>(
      {
        success: true,
        payload: null,
        message: "画像が正常に削除されました。",
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "P2025") {
      const res: ApiResponse<null> = {
        success: false,
        payload: null,
        message: "画像が見つかりませんでした。",
      };
      return NextResponse.json(res, { status: 404 });
    }
    const errorMsg = `画像削除エラー（ID: ${id}）:: ${
      error instanceof Error ? error.message : "未知のエラーです"
    }`;
    const res: ApiResponse<null> = {
      success: false,
      payload: null,
      message: errorMsg,
    };
    return NextResponse.json(res, { status: 500 });
  }
};
