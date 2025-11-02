"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Spinner from "@/components/Spinner";
import { ImageResponse } from "@/app/_types/ImageRequest";

export default function ImageEditPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const imageId = params?.id || "";
  const [image, setImage] = useState<ImageResponse | null>(null);
  const [storageUrl, setStorageUrl] = useState("");
  const [contentId, setContentId] = useState("");
  const [order, setOrder] = useState(0);

  const fetchImage = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/images/${imageId}`);
      if (!res.ok) throw new Error(`画像取得に失敗しました (${res.status})`);
      const data = await res.json();
      console.log(data.payload);
      setImage(data.payload);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImage();
    console.log(image);
  }, [imageId]);

  useEffect(() => {
    setStorageUrl(image?.storageUrl || "");
    setContentId(image?.contentId || "");
    setOrder(image?.order || 0);
  }, [image?.contentId, image?.order, image?.storageUrl]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const updatedImage = {
      storageUrl,
      contentId,
      order,
    };

    try {
      const res = await fetch(`/api/images/${imageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedImage),
      });
      if (!res.ok) throw new Error(`更新に失敗しました (${res.status})`);
      router.push("/images");
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("本当にこの画像を削除しますか？ この操作は元に戻せません。"))
      return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/images/${imageId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`削除に失敗しました (${res.status})`);
      router.push("/images");
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size={6} />
      </div>
    );
  }
  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">画像を更新</h1>
      <form onSubmit={handleSave} className="space-y-4">
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
          <button
            type="submit"
            className="px-4 py-2 bg-red-600 text-white rounded flex items-center gap-2"
            disabled={saving}
            onClick={handleDelete}
          >
            {saving ? (
              <>
                <Spinner colorClass="text-white" size={4} />
                <span>削除中...</span>
              </>
            ) : (
              "削除"
            )}
          </button>
        </div>
      </form>
    </main>
  );
}
