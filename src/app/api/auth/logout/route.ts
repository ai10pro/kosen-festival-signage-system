import { NextResponse } from "next/server";
import type { ApiResponse } from "@/app/_types/ApiResponse";

import { getSessionId } from "@/app/_helper/session";
import { deleteSession } from "@/app/_helper/session";

export const dynamic = "force-dynamic";
export const fetchCache = "no-store";
export const revalidate = 0;

export const DELETE = async () => {
  try {
    const sessionId = await getSessionId();

    if (sessionId) {
      await deleteSession(sessionId);
    }

    const res: ApiResponse<null> = {
      success: true,
      payload: null,
      message: "ログアウトに成功しました",
    };
    return NextResponse.json(res);
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : "Internal Server Error";
    console.error(errorMsg);

    const res: ApiResponse<null> = {
      success: false,
      payload: null,
      message: "ログアウトのサーバ処理でエラーが発生しました。",
    };
    return NextResponse.json(res, { status: 500 });
  }
};
