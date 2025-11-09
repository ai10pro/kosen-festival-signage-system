import { prisma } from "@/libs/prisma";
import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/app/_types/ApiResponse";
import {
  ContentResponse,
  CreateContentRequest,
  createContentSchema,
} from "@/app/_types/ContentRequest";
import { verifySession } from "@/app/_helper/session";
import { ContentStatus as PrismaContentStatus, Prisma } from "@prisma/client";
import { getGroupIdFromUser } from "@/app/_helper/getGroup";
import { generateMD5Hash } from "@/app/_helper/generateHash";
import { createClient } from "@supabase/supabase-js";
import { is } from "zod/locales";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(
  SUPABASE_URL ?? "",
  SUPABASE_SERVICE_ROLE_KEY ?? ""
);

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

    // ユーザーの所属グループを取得（UserGroupオブジェクトの配列が返る）
    const userGroups = await getGroupIdFromUser(userId);
    if (!userGroups) {
      return NextResponse.json(
        { error: "ユーザーのグループ情報が見つかりません" },
        { status: 400 }
      );
    }

    // ユーザーの権限（ADMINかどうか）を取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    // OBSERVER は管理者と同等に全データ参照を許可する運用に変更
    const isAdmin = user?.role === "ADMIN" || user?.role === "OBSERVER";

    // クエリパラメータから groupId が指定されているか確認
    const groupIdFromQuery = req.nextUrl.searchParams.get("groupId");

    // userGroups は UserGroup オブジェクト配列なので groupId の文字列配列に変換
    const allowedGroupIds: string[] = Array.isArray(userGroups)
      ? (userGroups as { groupId: string }[]).map((ug) => ug.groupId)
      : [];

    // 非管理者がクエリで他グループを指定している場合はアクセス不可
    if (
      !isAdmin &&
      groupIdFromQuery &&
      !allowedGroupIds.includes(groupIdFromQuery)
    ) {
      return NextResponse.json(
        { error: "指定したグループにアクセス権がありません" },
        { status: 403 }
      );
    }

    // where 条件を組み立てる
    let whereClause: Prisma.ContentWhereInput | undefined = undefined;
    if (groupIdFromQuery) {
      whereClause = { groupId: groupIdFromQuery };
    } else if (!isAdmin) {
      whereClause = { groupId: { in: allowedGroupIds } };
    }

    const contents = await prisma.content.findMany({
      where: whereClause,
      orderBy: [{ createdAt: "desc" }],
      include: {
        images: { orderBy: { createdAt: "asc" } },
        contentTags: { include: { tag: true } },
        uploader: { select: { id: true, username: true } },
        group: { select: { id: true, name: true } },
        editors: { select: { id: true, username: true } },
      },
    });

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

    const data = result.data as CreateContentRequest;
    const { title, description, groupId, tagIds } = data;
    const images = data.images;

    const newContent = await prisma.content.create({
      data: {
        title,
        description,
        status: PrismaContentStatus.PENDING,
        uploaderId: userId,
        // userGroups is an array of UserGroup objects; default to the first groupId if groupId not provided
        groupId:
          groupId ??
          (Array.isArray(userGroups)
            ? (userGroups as { groupId: string }[])[0]?.groupId
            : undefined),
        contentTags: {
          create: tagIds?.map((tagId) => ({ tagId })),
        },
        editors: { connect: { id: userId } },
      },
    });

    // コンテンツIDを取得
    const newContentId = newContent.id;
    // 画像データを登録（order を保存）。一時プレフィックスからの移動を行う
    for (const image of images) {
      let finalStorageUrl = image.url;
      let finalStorageKey = image.storageKey as string | undefined;
      try {
        if (finalStorageKey && finalStorageKey.startsWith("public/temp/")) {
          const group = await prisma.group.findUnique({
            where: { id: newContent.groupId },
          });
          const uploader = await prisma.user.findUnique({
            where: { id: userId },
          });
          const groupName = group?.name ?? "group";
          const contentName = title ?? "content";
          const userName = uploader?.username ?? "user";
          const slug = (s: string) =>
            s
              .toString()
              .trim()
              .toLowerCase()
              .replace(/[^a-z0-9\-_.]/g, "_")
              .replace(/_+/g, "_")
              .slice(0, 120);

          const hashed = generateMD5Hash(
            finalStorageKey + Date.now().toString()
          );
          const ext = finalStorageKey.includes(".")
            ? finalStorageKey.substring(finalStorageKey.lastIndexOf("."))
            : "";
          const destPath = `public/${slug(groupName)}/${slug(contentName)}/${slug(userName)}/${hashed}${ext}`;
          const moveRes = await supabaseAdmin.storage
            .from("content_image")
            .move(finalStorageKey, destPath);
          if (!moveRes.error) {
            finalStorageKey = destPath;
            const publicUrlResult = await supabaseAdmin.storage
              .from("content_image")
              .getPublicUrl(destPath);
            finalStorageUrl =
              publicUrlResult.data?.publicUrl ?? finalStorageUrl;
          } else {
            console.debug("failed to move file", moveRes.error);
          }
        }
      } catch (err) {
        console.debug("error moving storage file:", err);
      }

      await prisma.image.create({
        data: {
          storageUrl: finalStorageUrl,
          fileHash: generateMD5Hash(finalStorageUrl),
          contentId: newContentId,
          order: image.order ?? 0,
          groupId: newContent.groupId ?? null,
        },
      });
    }
    // 最終的なコンテンツデータを取得（画像も含む）
    const createdContent = await prisma.content.findUnique({
      where: { id: newContentId },
      include: {
        images: {},
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
      const validatedContent = createdContent as unknown as ContentResponse;
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
