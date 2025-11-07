import { ContentResponse } from "@/app/_types/ContentRequest";
import { UserProfile } from "@/app/_types/UserProfile";
import { ImageResponse } from "@/app/_types/ImageRequest";
import { Role } from "@/app/_types/Role";

const dummyUploaderProfile: UserProfile = {
  id: "d60452c9-88ac-4e4a-bd7b-444e628c5e04",
  username: "uploaderUser",
  role: Role.EXHIBITOR,
};

const dummyEditorProfile: UserProfile = {
  id: "cb4d0085-fa02-4772-9ce2-cf7d886f07a0",
  username: "editorUser",
  role: Role.ADMIN,
};

const dummyImage: ImageResponse = {
  id: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  storageUrl: "https://placehold.jp/3d4070/ffffff/600x400.png",
  fileHash: "somehash123",
  order: 1,
  contentId: "cb4d0085-fa02-4772-9ce2-cf7d886f07a0",
  groupId: "83fbc2ad-a5d5-483c-b9ad-6b08517f6a91",
  createdAt: new Date("2025-11-2T15:48:12.156Z"),
  updatedAt: new Date("2025-11-5T22:06:30.156Z"),
};

const dummyData: ContentResponse[] = [
  {
    id: "cb4d0085-fa02-4772-9ce2-cf7d886f07a0",
    title: "TitleTitleTitle",
    description: "13:00～　○○\n14:00～　△△\n15:00～　ビンゴ大会",
    status: "APPROVED",
    rejectionReason: null,
    uploaderId: dummyUploaderProfile,
    groupIds: ["c57db876-7542-4bc8-bb1b-f27efbc3405d"],
    editors: [dummyEditorProfile],
    images: [dummyImage],
    createdAt: new Date("2025-11-2T15:48:12.156Z"),
    updatedAt: new Date("2025-11-5T22:06:30.156Z"),
  },
];

export default dummyData;
