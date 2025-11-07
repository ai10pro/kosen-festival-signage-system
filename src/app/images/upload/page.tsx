"use client";

import React, { ChangeEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/Spinner";
// Image request types are handled on server; keep UI lightweight.
import { supabase } from "@/utils/supabase";

export default function ImageUploadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storageUrl, setStorageUrl] = useState("");
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [contentId, setContentId] = useState("");
  const [order, setOrder] = useState(0);

  const bucketName = "content_image";
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [imageKey, setImageKey] = useState<string | undefined>();

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    setImageKey(undefined);
    setImageUrl(undefined);

    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files?.[0];

    if (file.type !== "image/jpeg" && file.type !== "image/png") {
      window.alert("JPEGまたはPNG形式の画像を選択してください");
      return;
    }

    const path = `public/exhibition/${file.name}`;
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(path, file, { upsert: true });

    if (error || !data) {
      console.error("upload error:", error);
      window.alert(`アップロードに失敗 ${error.message}`);
      return;
    }
    // 画像のキー (実質的にバケット内のパス) を取得
    setImageKey(data.path);
    const publicUrlResult = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);
    // 画像のURLを取得
    setImageUrl(publicUrlResult.data.publicUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const newImage = {
      storageUrl,
      contentId,
      order,
      groupId: selectedGroupId,
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

  // fetch user's groups to allow selecting group for the image
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/user/groups", {
          credentials: "same-origin",
        });
        if (!res.ok) return;
        const body = await res.json();
        if (body?.success) {
          const g = body.payload || [];
          setGroups(g);
          if (g.length > 0) setSelectedGroupId(g[0].id);
        }
      } catch (e) {
        console.error("failed to fetch user groups", e);
      }
    })();
  }, []);

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">画像をアップロード</h1>
      <div className="mb-4">
        <div>
          <input
            id="imgSelector"
            type="file" // ファイルを選択するinput要素に設定
            accept="image/*" // 画像ファイルのみを選択可能に設定
            onChange={handleImageChange}
          />
          <div className="break-all text-sm">coverImageKey : {imageKey}</div>
          <div className="break-all text-sm">coverImageUrl : {imageUrl}</div>
        </div>
      </div>
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
        {groups.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-1">グループ</label>
            <select
              value={selectedGroupId ?? ""}
              onChange={(e) => setSelectedGroupId(e.target.value || null)}
              className="w-full p-2 border rounded"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-1">順番</label>
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(parseInt(e.target.value || "0"))}
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
