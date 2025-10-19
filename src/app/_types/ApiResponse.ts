export type ApiResponse<T> = {
  success: boolean;
  payload: T;
  message: string; // エラーメッセージ等
  metadata?: string; // 追加情報（JSON形式のメタ情報）
};
