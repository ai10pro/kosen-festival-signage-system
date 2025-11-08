// サイネージに紐づくグループ設定（SignageContent）
export type SignageContentSetting = {
  signageId: string;
  groupId: string;
  order: number;
  group?: { id: string; name?: string | null } | null;
};

export type SignageResponse = {
  id: string;
  locationName: string;
  uniqueKey: string;
  displayMode?: string;
  contentSettings: SignageContentSetting[];
  createdAt?: string;
  updatedAt?: string;
};

export type UpdateSignageRequest = {
  locationName?: string;
  // 新しい順序でグループ配列を渡す
  contentSettings?: Array<{ groupId: string; order: number }>;
};
