import { prisma } from "@/libs/prisma";
import { NextResponse, NextRequest } from "next/server";
import { Tag } from "@prisma/client";

type RouteParams = {
  // Next.js may provide params as a Promise in some environments — await before using.
  params: Promise<{
    "tag-id": string;
  }>;
};

export const GET = async (req: NextRequest, routeParams: RouteParams) => {
  try {
    const params = await routeParams.params;
    const id = params["tag-id"];
    const tag: Tag | null = await prisma.tag.findUnique({
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

export const DELETE = async (req: NextRequest, routeParams: RouteParams) => {
  try {
    const params = await routeParams.params;
    const id = params["tag-id"];
    const deletedTag: Tag = await prisma.tag.delete({
      where: {
        id,
      },
    });
    if (!deletedTag) {
      return NextResponse.json(
        { error: "id='" + id + "'のタグは見つかりませんでした" },
        { status: 404 }
      );
    }
    return NextResponse.json(deletedTag);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: "タグの削除に失敗しました",
      },
      { status: 500 }
    );
  }
};

export const PUT = async (req: NextRequest, routeParams: RouteParams) => {
  try {
    const params = await routeParams.params;
    const id = params["tag-id"];
    const body = await req.json();
    const updatedTag: Tag = await prisma.tag.update({
      where: { id },
      data: body,
    });
    if (!updatedTag) {
      return NextResponse.json(
        { error: "id='" + id + "'のタグは見つかりませんでした" },
        { status: 404 }
      );
    }
    return NextResponse.json(updatedTag);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: "タグの更新に失敗しました",
      },
      { status: 500 }
    );
  }
};
