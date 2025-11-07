"use client";

import React from "react";

const Page: React.FC = () => {
  // 仮のコンテンツデータ
  const contentOptions = [
    { id: "1", title: "コンテンツA" },
    { id: "2", title: "コンテンツB" },
    { id: "3", title: "コンテンツC" },
  ];

  // 仮のコンテンツ詳細データ
  const contentDetails = {
    "1": { title: "コンテンツA", description: "コンテンツAの説明", status: "APPROVED", rejectionReason: null},
    "2": { title: "コンテンツB", description: "コンテンツBの説明", status: "REJECTED", rejectionReason: "不適切な内容" },
    "3": { title: "コンテンツC", description: "コンテンツCの説明", status: "PENDING", rejectionReason: null },
  };

  const [selectedContentId, setSelectedContentId] = React.useState("1");
  const selectedContent = contentDetails[selectedContentId as keyof typeof contentDetails];

  return (
    <main className="p-4">
      <h1 className="text-2xl font-semibold mb-4">コンテンツ認証確認</h1>

      {/* コンテンツ選択ドロップダウン */}
      <div className="mb-4">
        <label htmlFor="contentSelect" className="block text-gray-700 text-sm font-bold mb-2">
          コンテンツを選択:
        </label>
        <select
          id="contentSelect"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          value={selectedContentId}
          onChange={(e) => setSelectedContentId(e.target.value)}
        >
          {contentOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.title}
            </option>
          ))}
        </select>
      </div>

      {/* コンテンツ情報表示 */}
      {selectedContent && (
        <div>
          <div className="divide-y divide-gray-400">
            <h2 className="text-xl font-semibold">タイトル</h2>
            <div className="pl-4 mt-2 mb-4 text-xl font-semibold text-gray-600">{selectedContent.title}</div>
          </div>
          <div className="divide-y divide-gray-400">
            <h2 className="text-xl font-semibold">説明</h2>
            <p className="pl-4 mt-2 mb-4 text-gray-600">{selectedContent.description}</p>
          </div>
          <div className="divide-y divide-gray-400">
            <h2 className="text-xl font-semibold">認証状態</h2>
            <p className="pl-4 mt-2 mb-4 text-gray-600">{selectedContent.status}</p>
          </div>
          {selectedContent.status === "REJECTED" &&
            <div className="divide-y divide-gray-400">
              <h2 className="text-xl font-semibold">拒否理由</h2>
              <p className="pl-4 mt-2 mb-4 text-gray-600">{selectedContent.rejectionReason}</p>
            </div>
          }
        </div>
      )}
    </main>
  );
};

export default Page;