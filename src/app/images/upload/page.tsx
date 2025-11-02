"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/Spinner";
import type { CreateImageRequest } from "@/app/_types/ImageRequest";

export default function ImageUploadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storageUrl, setStorageUrl] = useState("");
  const [contentId, setContentId] = useState("");
  const [order, setOrder] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const newImage: CreateImageRequest = {
      storageUrl,
      contentId,
      order,
    };

    try {
      const res = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newImage),
      });
      if (!res.ok) throw new Error(`作成に失敗しました (${res.status})`);
      router.push("/images");
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">画像をアップロード</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            ストレージURL
          </label>
          <input
            value={storageUrl}
            onChange={(e) => setStorageUrl(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="例: https://example.com/image.jpg"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">コンテンツID</label>
          <input
            value={contentId}
            onChange={(e) => setContentId(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="例: 12345"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">順番</label>
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(parseInt(e.target.value))}
            className="w-full p-2 border rounded"
            placeholder="例: 1"
            required
          />
        </div>

        {error && <p className="text-red-600">エラー: {error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner colorClass="text-white" size={4} />
                <span>アップロード中...</span>
              </>
            ) : (
              "アップロード"
            )}
          </button>
        </div>
      </form>
    </main>
  );
}
