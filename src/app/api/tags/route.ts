import { prisma } from "@/libs/prisma";
import { NextResponse, NextRequest } from "next/server";

// [GET] /api/tags カテゴリ一覧の取得
export const GET = async (req: NextRequest) => {
  try {
    const categories = await prisma.tag.findMany({});
    return NextResponse.json(categories);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "カテゴリの取得に失敗しました" },
      { status: 500 } // 500: Internal Server Error
    );
  }
};
