"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Spinner from "@/components/Spinner";

type Tag = { id: string; name: string };

export default function TagEditPage() {
  const router = useRouter();
  const params = useParams();
  const tagId = params?.["tag-id"] || "";

  const [tag, setTag] = useState<Tag | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tagId) return;
    setLoading(true);
    fetch(`/api/tags/${tagId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`タグ取得に失敗しました (${res.status})`);
        return res.json();
      })
      .then((data) => {
        setTag(data);
        setName(data.name ?? "");
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [tagId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/tags/${tagId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error(`更新に失敗しました (${res.status})`);
      router.push("/tag");
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("本当にこのタグを削除しますか？ この操作は元に戻せません。"))
      return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/tags/${tagId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`削除に失敗しました (${res.status})`);
      router.push("/tag");
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">タグを編集</h1>
        <Link href="/tag" className="px-3 py-1 bg-gray-200 rounded">
          一覧に戻る
        </Link>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-12 h-12 flex items-center justify-center bg-transparent">
            <Spinner colorClass="text-gray-700" size={3} />
          </div>
          <p className="mt-3 text-gray-600">読み込み中...</p>
        </div>
      )}
      {error && <p className="text-red-600">エラー: {error}</p>}

      {tag && (
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">タグ名</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
            <p className="text-sm text-gray-500 mt-1">ID: {tag.id}</p>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded flex items-center gap-2"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Spinner colorClass="text-white" size={4} />
                  <span>保存中...</span>
                </>
              ) : (
                "保存"
              )}
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-red-600 text-white rounded flex items-center gap-2"
              onClick={handleDelete}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Spinner colorClass="text-white" size={4} />
                  <span>処理中...</span>
                </>
              ) : (
                "削除"
              )}
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
