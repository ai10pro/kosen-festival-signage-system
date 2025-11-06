import { prisma } from "@/libs/prisma";
import { NextResponse } from "next/server";
import type { ApiResponse } from "@/app/_types/ApiResponse";
import { verifySession } from "@/app/_helper/session";

export const config = {
  dynamic: "force-dynamic",
  fetchCache: "no-store",
  revalidate: 0,
};

export const GET = async () => {
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { userGroups: { include: { group: true } } },
    });

    const groups = (user?.userGroups || []).map((ug) => ug.group);

    // Removed debug logs after investigation

    const res: ApiResponse<typeof groups> = {
      success: true,
      payload: groups,
      message: "",
    };
    return NextResponse.json(res);
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
