/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/libs/prisma";
import { verifySession } from "@/app/_helper/session";
import { ApiResponse } from "@/app/_types/ApiResponse";
import { SignageResponse, UpdateSignageRequest } from "@/app/_types/Signage";

export const config = {
  dynamic: "force-dynamic",
  fetchCache: "no-store",
  revalidate: 0,
};

/**
 * GET /api/signages/:signageId
 * PUT /api/signages/:signageId
 */
export const GET = async (req: NextRequest, ctx: any) => {
  try {
    const userId = await verifySession();
    if (!userId) {
      const res: ApiResponse<null> = {
        success: false,
        payload: null,
        message: "ログインしてください",
      };
      return NextResponse.json(res, { status: 401 });
    }

    const params = ctx?.params ?? (await ctx?.params);
    const signageId = params?.signageId as string;
    const signage = await (prisma.signage as any).findUnique({
      where: { id: signageId },
      include: { contentSettings: { include: { group: true } } },
    });

    if (!signage) {
      const res: ApiResponse<null> = {
        success: false,
        payload: null,
        message: "サイネージが見つかりません",
      };
      return NextResponse.json(res, { status: 404 });
    }

    const payload: SignageResponse = {
      id: signage.id,
      locationName: signage.locationName,
      uniqueKey: signage.uniqueKey,
      displayMode: signage.displayMode,
      contentSettings: (signage.contentSettings || []).map((cs: any) => ({
        signageId: cs.signageId,
        groupId: cs.groupId,
        order: cs.order,
        group: cs.group ? { id: cs.group.id, name: cs.group.name } : null,
      })),
      createdAt: signage.createdAt?.toISOString?.(),
      updatedAt: signage.updatedAt?.toISOString?.(),
    };

    const res: ApiResponse<SignageResponse> = {
      success: true,
      payload,
      message: "サイネージを取得しました",
    };
    return NextResponse.json(res);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "未知のエラーです";
    const res: ApiResponse<null> = {
      success: false,
      payload: null,
      message: `サーバーエラーが発生しました::${msg}`,
    };
    return NextResponse.json(res, { status: 500 });
  }
};

export const PUT = async (req: NextRequest, ctx: any) => {
  try {
    const userId = await verifySession();
    if (!userId) {
      const res: ApiResponse<null> = {
        success: false,
        payload: null,
        message: "ログインしてください",
      };
      return NextResponse.json(res, { status: 401 });
    }

    const params = ctx?.params ?? (await ctx?.params);
    const signageId = params?.signageId as string;
    const body = (await req.json()) as UpdateSignageRequest;

    // 更新処理: サイネージ基本情報の更新 + SignageContent をトランザクションで上書き
    const result = await prisma.$transaction(async (tx) => {
      // 基本情報更新
      const updateData: any = {};
      if (typeof body.locationName === "string")
        updateData.locationName = body.locationName;

      const updated = Object.keys(updateData).length
        ? await tx.signage.update({
            where: { id: signageId },
            data: updateData,
          })
        : await tx.signage.findUnique({ where: { id: signageId } });

      if (!updated) throw new Error("指定されたサイネージが見つかりません");

      if (Array.isArray(body.contentSettings)) {
        // 既存の紐付けを削除してから再作成
        await tx.signageContent.deleteMany({ where: { signageId } });
        for (const cs of body.contentSettings) {
          await tx.signageContent.create({
            data: { signageId, groupId: cs.groupId, order: cs.order },
          });
        }
      }

      return updated;
    });

    const res: ApiResponse<any> = {
      success: true,
      payload: result,
      message: "サイネージを更新しました",
    };
    return NextResponse.json(res);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "未知のエラーです";
    const res: ApiResponse<null> = {
      success: false,
      payload: null,
      message: `サーバーエラーが発生しました::${msg}`,
    };
    return NextResponse.json(res, { status: 500 });
  }
};
