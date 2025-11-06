"use client";

import React, { useEffect, useState } from "react";
import Spinner from "@/components/Spinner";

type ContentSummary = {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
  group?: { id: string; name: string } | null;
  uploader?: { id: string; username?: string } | null;
  images?: { storageUrl?: string }[];
  contentTags?: { tag: { id: string; name: string } }[];
};

const ContentListPage: React.FC = () => {
  const [data, setData] = useState<ContentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchList = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/contents", { credentials: "same-origin" });
      if (!res.ok) throw new Error(`取得に失敗しました (${res.status})`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const onEdit = (id: string) => {
    window.location.href = `/content/${id}`;
  };

  const onCreate = () => {
    window.location.href = `/content/new`;
  };

  const onDelete = async (id: string) => {
    if (!confirm("このコンテンツを削除してもよろしいですか？")) return;
    try {
      const res = await fetch(`/api/contents/${id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(
          json?.message || json?.error || `削除に失敗しました (${res.status})`
        );
      }
      await fetchList();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">コンテンツ一覧</h1>
        <div>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded"
            onClick={onCreate}
          >
            新規作成
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Spinner colorClass="text-gray-700" size={3} />
          <p className="mt-3 text-gray-600">読み込み中...</p>
        </div>
      ) : error ? (
        <p className="text-red-600">読み込みエラー: {error}</p>
      ) : data && data.length === 0 ? (
        <div className="text-center text-gray-600">
          コンテンツが存在しません。
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-150 overflow-hidden"
            >
              <div className="h-40 bg-gray-100 flex items-center justify-center">
                {c.images && c.images.length > 0 && c.images[0].storageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.images[0].storageUrl}
                    alt={c.title}
                    className="w-full h-40 object-cover"
                  />
                ) : (
                  <div className="text-gray-400">画像なし</div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-lg font-semibold text-gray-800">
                    {c.title}
                  </h2>
                  <div className="text-sm text-gray-500">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {c.description && (
                  <p className="mt-2 text-sm text-gray-600 line-clamp-3">
                    {c.description}
                  </p>
                )}

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {c.group && (
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded">
                        {c.group.name}
                      </span>
                    )}
                    {c.uploader && (
                      <span className="text-xs text-gray-500">
                        作成者: {c.uploader.username}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="px-3 py-1 bg-yellow-400 rounded text-sm"
                      onClick={() => onEdit(c.id)}
                    >
                      編集
                    </button>
                    <button
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm"
                      onClick={() => onDelete(c.id)}
                    >
                      削除
                    </button>
                  </div>
                </div>

                {c.contentTags && c.contentTags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {c.contentTags.map((ct) => (
                      <span
                        key={ct.tag.id}
                        className="text-xs bg-gray-100 px-2 py-0.5 rounded"
                      >
                        {ct.tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContentListPage;
