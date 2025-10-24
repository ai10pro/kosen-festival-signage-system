import { prisma } from "@/libs/prisma";
import { NextResponse, NextRequest } from "next/server";

type RouteParams = {
  // Next.js may provide params as a Promise in some environments — await before using.
  params: Promise<{
    id: string;
  }>;
};

export const GET = async (req: NextRequest, routeParams: RouteParams) => {
  try {
    const params = await routeParams.params;
    const id = params.id;
    const tag = await prisma.tag.findUnique({
      select: {
        id: true,
        name: true,
      },
      where: {
        id,
      },
    });
    if (!tag) {
      return NextResponse.json(
        {
          error: "id='" + id + "'のタグは見つかりませんでした",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(tag);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: "タグの取得に失敗しました",
      },
      { status: 500 }
    );
  }
};
