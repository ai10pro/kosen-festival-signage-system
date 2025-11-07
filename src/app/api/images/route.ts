import { prisma } from "@/libs/prisma";
import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/app/_helper/session";

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
export const GET = async (req: NextRequest) => {
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

    // ユーザー情報と所属グループID一覧を取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { userGroups: true },
    });
    const groupIds = (user?.userGroups || []).map((ug) => ug.groupId);
    const isAdmin = user?.role === "ADMIN";

    // クエリパラメータから groupId を取得（任意）
    const url = new URL(req.url);
    const requestedGroupId = url.searchParams.get("groupId");

    // ADMIN ユーザーは全件取得（どの groupId にもアクセス可能）
    if (!isAdmin) {
      // グループが無い場合は空配列を返す
      if (!requestedGroupId && groupIds.length === 0) {
        return NextResponse.json<ApiResponse<ImageResponse[]>>(
          { success: true, payload: [], message: "" },
          { status: 200 }
        );
      }

      // 指定された groupId がある場合は、そのグループに所属しているか確認
      if (requestedGroupId) {
        if (!groupIds.includes(requestedGroupId)) {
          const res: ApiResponse<null> = {
            success: false,
            payload: null,
            message: "指定されたグループの画像にアクセスする権限がありません。",
          };
          return NextResponse.json(res, { status: 403 });
        }
      }
    }

    // 画像取得：ADMIN ならフィルタ無しで全件、そうでなければ groupId 指定または所属グループ分を取得
    const whereClause = isAdmin
      ? {}
      : requestedGroupId
        ? { groupId: requestedGroupId }
        : { groupId: { in: groupIds } };

    const images = await prisma.image.findMany({
      where: whereClause,
      orderBy: [{ contentId: "asc" }, { createdAt: "asc" }],
    });

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

    const { storageUrl, contentId, groupId, order } = validation.data;
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

    const newImage = await (prisma as any).image.create({
      data: {
        storageUrl,
        fileHash,
        contentId,
        groupId: groupId ?? null,
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
