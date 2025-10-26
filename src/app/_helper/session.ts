import { cookies } from "next/headers";
import { prisma } from "@/libs/prisma";
import path from "path";

// 環境変数からランダムなCookie名を取得
const SESSION_COOKIE_NAME =
  process.env.SESSION_COOKIE_NAME || "default_session_id";

// createSession関数
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

// getSessionId関数
/**
 * クッキーからセッションIDを取得し、そのセッション情報を返す。
 * @returns セッション情報またはnull
 */
export const getSessionId = async (): Promise<string | null> => {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
};

// deleteSession関数
/**
 * データベースとCookieからセッションを破棄する。
 * @param sessionId - 破棄するセッションID
 */
export const deleteSession = async (sessionId: string): Promise<void> => {
  if (!sessionId) return;

  await prisma.session.deleteMany({
    where: { id: sessionId },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 0,
    secure: process.env.NODE_ENV === "production",
  });
};
