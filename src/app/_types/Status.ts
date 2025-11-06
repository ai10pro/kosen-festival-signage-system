export const ContentStatus = {
  PENDING: "PENDING",     // 認証待ち
  APPROVED: "APPROVED",   // 承認済み
  REJECTED: "REJECTED",   // 却下
}

export type ContentStatus = (typeof ContentStatus)[keyof typeof ContentStatus];