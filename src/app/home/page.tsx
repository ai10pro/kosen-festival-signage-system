"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { twMerge } from "tailwind-merge";

import Clock from "@/app/_components/Clock";

const AdminMockDate = {
  user: {
    id: "admin-001",
    name: "山田 太郎",
    role: "ADMIN",
  },
  contents: [
    {
      id: "41e5f050-2b6d-430e-a09e-a29a85950b2e",
      createdAt: "2025-11-07T04:07:41.515Z",
      updatedAt: "2025-11-07T05:50:40.487Z",
      title: "テストコンテンツ - AIデモ",
      description: "このコンテンツは、承認済みのテスト用デモです。",
      status: "APPROVED",
      rejectionReason: null,
      uploaderId: "c5cb4662-0c3a-42bd-8aeb-b76dbdcf0358",
      groupId: "83fbc2ad-a5d5-483c-b9ad-6b08517f6a91",
      images: [
        {
          id: "157b0e1b-91f3-46ca-82cf-f1a534dd3cd9",
          createdAt: "2025-11-07T05:50:40.720Z",
          updatedAt: "2025-11-07T05:50:40.720Z",
          storageUrl: "https://placehold.jp/15bca9/ffffff/600x400.png",
          fileHash: "1ee3718cb8506e925850c266bf56be2d",
          contentId: "41e5f050-2b6d-430e-a09e-a29a85950b2e",
          order: 0,
        },
        {
          id: "df19818f-8b8d-4044-8961-575f52cac97c",
          createdAt: "2025-11-07T05:50:40.759Z",
          updatedAt: "2025-11-07T05:50:40.759Z",
          storageUrl: "https://placehold.jp/3d4070/ffffff/600x400.png",
          fileHash: "df1fbcb898b3e0d217f5e9420f4246e9",
          contentId: "41e5f050-2b6d-430e-a09e-a29a85950b2e",
          order: 1,
        },
        {
          id: "451d0bb4-ca84-481e-9590-9857d8f851b6",
          createdAt: "2025-11-07T05:50:40.801Z",
          updatedAt: "2025-11-07T05:50:40.801Z",
          storageUrl:
            "https://nmhwbvbkageecvdtftxa.supabase.co/storage/v1/object/public/content_image/public/exhibition/f2b8a28d71a2b624f5e2a54500e80039.png",
          fileHash: "bd976fffeddc77d12e4f441cde3f2726",
          contentId: "41e5f050-2b6d-430e-a09e-a29a85950b2e",
          order: 2,
        },
      ],
      contentTags: [],
      uploader: {
        id: "c5cb4662-0c3a-42bd-8aeb-b76dbdcf0358",
        username: "exhibitor",
      },
      group: {
        id: "83fbc2ad-a5d5-483c-b9ad-6b08517f6a91",
        name: "クラスA",
      },
      editors: [
        {
          id: "c5cb4662-0c3a-42bd-8aeb-b76dbdcf0358",
          username: "exhibitor",
        },
      ],
    },
  ],
};

const ViewerMockDate = {
  user: {
    id: "viewer-001",
    name: "鈴木 次郎",
    role: "VIEWER",
  },
  config: {
    viewContentTimeSec: 30,
    groups: [
      { id: "group-001", name: "工業化学部門" },
      { id: "group-002", name: "電子情報部門" },
    ],
  },
};

const ExhibitorMockDate = {
  user: {
    id: "exhibitor-001",
    name: "佐藤 花子",
    role: "EXHIBITOR",
  },
  groups: [
    {
      id: "group-001",
      name: "ロボット研究会",
    },
  ],
  contents: [
    {
      id: "41e5f050-2b6d-430e-a09e-a29a85950b2e",
      createdAt: "2025-11-07T04:07:41.515Z",
      updatedAt: "2025-11-07T05:50:40.487Z",
      title: "テストコンテンツ - AIデモ",
      description: "このコンテンツは、承認済みのテスト用デモです。",
      status: "APPROVED",
      rejectionReason: null,
      uploaderId: "c5cb4662-0c3a-42bd-8aeb-b76dbdcf0358",
      groupId: "83fbc2ad-a5d5-483c-b9ad-6b08517f6a91",
      images: [
        {
          id: "157b0e1b-91f3-46ca-82cf-f1a534dd3cd9",
          createdAt: "2025-11-07T05:50:40.720Z",
          updatedAt: "2025-11-07T05:50:40.720Z",
          storageUrl: "https://placehold.jp/15bca9/ffffff/600x400.png",
          fileHash: "1ee3718cb8506e925850c266bf56be2d",
          contentId: "41e5f050-2b6d-430e-a09e-a29a85950b2e",
          order: 0,
        },
        {
          id: "df19818f-8b8d-4044-8961-575f52cac97c",
          createdAt: "2025-11-07T05:50:40.759Z",
          updatedAt: "2025-11-07T05:50:40.759Z",
          storageUrl: "https://placehold.jp/3d4070/ffffff/600x400.png",
          fileHash: "df1fbcb898b3e0d217f5e9420f4246e9",
          contentId: "41e5f050-2b6d-430e-a09e-a29a85950b2e",
          order: 1,
        },
        {
          id: "451d0bb4-ca84-481e-9590-9857d8f851b6",
          createdAt: "2025-11-07T05:50:40.801Z",
          updatedAt: "2025-11-07T05:50:40.801Z",
          storageUrl:
            "https://nmhwbvbkageecvdtftxa.supabase.co/storage/v1/object/public/content_image/public/exhibition/f2b8a28d71a2b624f5e2a54500e80039.png",
          fileHash: "bd976fffeddc77d12e4f441cde3f2726",
          contentId: "41e5f050-2b6d-430e-a09e-a29a85950b2e",
          order: 2,
        },
      ],
      contentTags: [],
      uploader: {
        id: "c5cb4662-0c3a-42bd-8aeb-b76dbdcf0358",
        username: "exhibitor",
      },
      group: {
        id: "83fbc2ad-a5d5-483c-b9ad-6b08517f6a91",
        name: "クラスA",
      },
      editors: [
        {
          id: "c5cb4662-0c3a-42bd-8aeb-b76dbdcf0358",
          username: "exhibitor",
        },
      ],
    },
  ],
};

const selectUser = ExhibitorMockDate;

const UserRole = selectUser.user.role as "ADMIN" | "VIEWER" | "EXHIBITOR";

const panelDescription = {
  ADMIN:
    "このアカウントロールは「Adminユーザーです」<br/>すべての管理機能にアクセスできます。",
  VIEWER:
    "このアカウントロールは「Viewerユーザーです」<br/>コンテンツの閲覧とその設定が可能です。",
  EXHIBITOR:
    "このアカウントロールは「Exhibitorユーザーです」<br/>自身の展示コンテンツの管理が可能です。",
};

export default function Home() {
  return (
    <main className="flex gap-6 h-full">
      {/* 左側 */}
      <div className="w-3/5 ">
        <div className="h-3/5 py-2">
          <div className="bg-sky-100 w-full h-full border-2 rounded-2xl p-4">
            <div className="h-1/5">
              <h1 className="text-3xl font-bold">
                Hello &quot;{selectUser.user.name}&quot;!!
              </h1>
              <p
                className="text-gray-700 dark:text-gray-300"
                dangerouslySetInnerHTML={{ __html: panelDescription[UserRole] }}
              ></p>
            </div>
            {/* Admin ⇒ コンテンツ一覧 */}
            {UserRole === "ADMIN" && (
              <div className="bg-white p-4 h-4/5 overflow-auto">
                <h2 className="text-xl font-bold mb-2 border-b-2">
                  コンテンツ一覧
                </h2>
                {selectUser.contents.map((content) => (
                  <div
                    key={content.id}
                    className="border-b border-gray-300 py-2"
                  >
                    <div className="flex justify-between items-center">
                      <div className="">
                        <h3 className="text-lg font-semibold">
                          {content.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          ステータス:{" "}
                          <span
                            className={twMerge(
                              content.status === "APPROVED"
                                ? "bg-green-600 font-bold text-white"
                                : content.status === "REJECTED"
                                  ? "bg-red-600 font-bold text-white"
                                  : "bg-yellow-600 font-bold text-white"
                            )}
                          >
                            {content.status}
                          </span>
                        </p>
                      </div>
                      <div className="">
                        <Link
                          href={`/admin/contents/${content.id}`}
                          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors duration-300"
                        >
                          詳細
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Viewer ⇒ 表示グループ一覧 */}
            {UserRole === "VIEWER" && (
              <div className="bg-white p-4 h-4/5 overflow-auto">
                <h2 className="text-xl font-bold mb-2 border-b-2">
                  表示グループ一覧
                </h2>
                {selectUser.config.groups.map((group) => (
                  <div key={group.id} className="border-b border-gray-300 py-2">
                    <h3 className="text-lg font-semibold">{group.name}</h3>
                  </div>
                ))}
              </div>
            )}
            {/* Exhibitor ⇒ 所属グループとコンテンツの一覧 */}
            {UserRole === "EXHIBITOR" && (
              <div className="h-4/5 flex flex-col ">
                <div className="bg-white p-4 h-1/2 overflow-auto">
                  <h2 className="text-xl font-bold mb-2 border-b-2">
                    所属グループ一覧
                  </h2>
                  {selectUser.groups.map((group) => (
                    <div
                      key={group.id}
                      className="border-b border-gray-300 py-2"
                    >
                      <h3 className="text-lg font-semibold">{group.name}</h3>
                    </div>
                  ))}
                </div>
                <div className="bg-white p-4 h-1/2 overflow-auto border-t-4 border-sky-100">
                  <h2 className="text-xl font-bold my-4 border-b-2">
                    コンテンツ一覧
                  </h2>
                  {selectUser.contents.map((content) => (
                    <div
                      key={content.id}
                      className="border-b border-gray-300 py-2"
                    >
                      <div className="flex justify-between items-center">
                        <div className="">
                          <h3 className="text-lg font-semibold">
                            {content.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            ステータス:{" "}
                            <span
                              className={twMerge(
                                content.status === "APPROVED"
                                  ? "bg-green-600 font-bold text-white"
                                  : content.status === "REJECTED"
                                    ? "bg-red-600 font-bold text-white"
                                    : "bg-yellow-600 font-bold text-white"
                              )}
                            >
                              {content.status}
                            </span>
                          </p>
                        </div>
                        <div className="">
                          <Link
                            href={`/exhibitor/contents/${content.id}`}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors duration-300"
                          >
                            詳細
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="h-2/5 py-2">
          <div className="w-full h-full border-2 rounded-2xl p-4 flex items-center">
            <h1 className="text-4xl font-bold m-auto">準備中</h1>
          </div>
        </div>
      </div>

      {/* 右側 */}
      <div className="w-2/5 ">
        <div className="h-1/5 py-2">
          <Clock />
        </div>
        <div className="h-4/5 py-2">
          <div className="w-full h-full border-2 rounded-2xl p-4 flex items-center">
            <h1 className="text-4xl font-bold m-auto">準備中</h1>
          </div>
        </div>
      </div>
    </main>
  );
}
