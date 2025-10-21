export const Role = {
  ADMIN: "ADMIN", // 管理者
  PASSWORD_RESETTER: "PASSWORD_RESETTER", // パスワードリセット専用アカウント
  EXHIBITOR: "EXHIBITOR" // 展示団体担当者
};

export type Role = typeof Role[keyof typeof Role];