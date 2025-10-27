import { cookies } from "next/headers";
import { prisma } from "@/libs/prisma";

// 環境変数からランダムなCookie名を取得
const SESSION_COOKIE_NAME =
  process.env.SESSION_COOKIE_NAME || "default_session_id";

// セッションの最大有効期限（7日間）
const TOKEN_MAX_AGE_SECOND = 60 * 60 * 24 * 7;

// createSession関数
/**
 * セッションを作成し、そのセッションIDをクッキーに保存する。
 * @param userId - ユーザーID
 * @returns 生成されたセッションID
 */
export const createSession = async (
  userId: string,
  tokenMaxAgeSecond: number = TOKEN_MAX_AGE_SECOND
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


// refreshSession関数
/**
 * 有効なセッションの有効期限を延長し、新しいセッションCookieをセットする。
 * @param sessionId - 延長するセッションID
 * @returns 生成されたセッションID
 */
export const refreshSession = async (
  sessionId: string,
  tokenMaxAgeSecond: number = TOKEN_MAX_AGE_SECOND
): Promise<void> => {
  const newExpiresAt = new Date(Date.now() + tokenMaxAgeSecond * 1000);

  try {
    // DBの有効期限を更新
    await prisma.session.update({
      where: {
        id: sessionId,
      },
      data: {
        expiresAt: newExpiresAt,
      },
    });

    // Cookieを再設定（新しい有効期限をブラウザに伝える）
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: tokenMaxAgeSecond,
      secure: process.env.NODE_ENV === 'production',
    });

  } catch (e) {
    console.error(`[Refresh] Failed to refresh session ${sessionId}:`, e);
    // 延長失敗時はセッション削除を試みる (セキュリティのため)
    await deleteSession(sessionId);
  }
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


