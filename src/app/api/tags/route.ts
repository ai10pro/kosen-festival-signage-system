import { prisma } from "@/libs/prisma";
import { NextResponse, NextRequest } from "next/server";
import { Tag } from "@prisma/client";

type RequestBody = {
  name: string;
};

// [GET] /api/tags カテゴリ一覧の取得
export const GET = async (req: NextRequest) => {
  try {
    const tags = await prisma.tag.findMany({});
    return NextResponse.json(tags);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "カテゴリの取得に失敗しました" },
      { status: 500 } // 500: Internal Server Error
    );
  }
};

export const POST = async (req: NextRequest) => {
  try {
    const { name }: RequestBody = await req.json();
    const newTag: Tag = await prisma.tag.create({
      data: {
        name: name,
      },
    });
    return NextResponse.json(newTag, { status: 201 }); // 201: Created
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: "タグの作成に失敗しました",
      },
      { status: 500 }
    );
  }
};
