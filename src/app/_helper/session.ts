import { cookies } from "next/headers";
import { prisma } from "@/libs/prisma";

// 環境変数からランダムなCookie名を取得
const SESSION_COOKIE_NAME =
  process.env.SESSION_COOKIE_NAME || "default_session_id";

/**
 * セッションを作成し、そのセッションIDをクッキーに保存する。
 * @param userId - ユーザーID
 * @param tokenMaxAgeSecond - トークンの有効期限（秒）
 * @returns 生成されたセッションID
 */

export const createSession = async (
  userId: string,
  tokenMaxAgeSecond: number
): Promise<string> => {
  const session = await prisma.session.create({
    data: {
      userId,
      expiresAt: new Date(Date.now() + tokenMaxAgeSecond * 1000),
    },
  });

  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, session.id, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: tokenMaxAgeSecond,
    secure: process.env.NODE_ENV === "production",
  });

  return session.id;
};
