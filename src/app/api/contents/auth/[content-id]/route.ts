import { prisma } from "@/libs/prisma";
import { ContentStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/app/_helper/session";
import { ApiResponse } from "@/app/_types/ApiResponse";

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

export const PUT = async (req: NextRequest, routeParams: RouteParams) => {
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

    // only ADMIN can change content auth status
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== "ADMIN") {
      const res: ApiResponse<null> = {
        success: false,
        payload: null,
        message: "権限がありません",
      };
      return NextResponse.json(res, { status: 403 });
    }

    const params = await routeParams.params;
    const id = params["content-id"];

    const body = await req.json();
    const status = body?.status as string | undefined;
    const rejectionReason = body?.rejectionReason as string | undefined;

    if (!status || !["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "無効な status" }, { status: 400 });
    }

    const updated = await prisma.content.update({
      where: { id },
      data: {
        status: status as ContentStatus,
        rejectionReason:
          status === "REJECTED" ? (rejectionReason ?? null) : null,
      },
      include: {
        images: { orderBy: { createdAt: "asc" } },
        contentTags: { include: { tag: true } },
        uploader: { select: { id: true, username: true } },
        group: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      payload: updated,
      message: "更新しました",
    });
  } catch (error) {
    console.error(error);
    const msg = error instanceof Error ? error.message : "未知のエラーです";
    return NextResponse.json(
      { error: `サーバーエラー::${msg}` },
      { status: 500 }
    );
  }
};
