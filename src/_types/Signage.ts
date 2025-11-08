// 型定義: サイネージ関連の生データ(Raw) と正規化後の型
export type RawGroup = {
  id?: string;
  name?: string | null;
  imageContentIds?: string[];
};

export type RawContentSetting = {
  signageId?: string;
  groupId?: string;
  order?: number;
  group?: RawGroup | null;
  imageContentIds?: string[];
};

export type RawSignage = {
  id: string;
  uniqueKey: string;
  locationName: string;
  lastActiveAt?: string | null;
  contentSettings?: RawContentSetting[];
};

export type GroupWithImages = {
  id: string;
  name?: string | null;
  imageContentIds?: string[];
};

export type ContentSetting = {
  signageId: string;
  groupId: string;
  order: number;
  group?: GroupWithImages | null;
};

export type SignageItem = {
  id: string;
  uniqueKey: string;
  locationName: string;
  lastActiveAt?: string | null;
  contentSettings: ContentSetting[];
};
