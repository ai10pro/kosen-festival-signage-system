import { ContentResponse } from "./ContentRequest";

// サイネージの設定
export type SignageConfig = {
  // 1コンテンツあたりの表示時間（秒）
  viewtime: number;
  // 表示対象として設定された groupId の配列
  view_groups: string[];
};

// 最終的に API が返す payload の型
export type SignagesPayload = {
  config: SignageConfig;
  // groupId -> そのグループの Content のリスト
  contents: Record<string, ContentResponse[]>;
};

export type SignageConfigResponse = SignagesPayload;
