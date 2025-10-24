"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Spinner from "@/components/Spinner";

type Tag = { id: string; name: string };

export default function TagListPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/tags")
      .then((res) => res.json())
      .then((data) => setTags(data))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">タグ一覧</h1>
        <Link
          href="/tag/add"
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          タグを追加
        </Link>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Spinner colorClass="text-gray-700" size={3} />
          <p className="mt-3 text-gray-600">読み込み中...</p>
        </div>
      )}
      {error && <p className="text-red-600">エラー: {error}</p>}

      <ul className="space-y-2">
        {tags.map((tag) => (
          <li
            key={tag.id}
            className="flex items-center justify-between p-3 border rounded"
          >
            <div>
              <p className="font-medium">{tag.name}</p>
              <p className="text-sm text-gray-500">ID: {tag.id}</p>
            </div>
            <div className="space-x-2">
              <Link
                href={`/tag/edit/${tag.id}`}
                className="px-3 py-1 bg-yellow-400 rounded"
              >
                編集
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
