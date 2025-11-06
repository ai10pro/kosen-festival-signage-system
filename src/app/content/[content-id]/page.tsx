"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Spinner from "@/components/Spinner";

type Group = { id: string; name: string };
type ImageInput = { url: string };

export default function ContentEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.["content-id"] || "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [groups, setGroups] = useState<Group[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [groupId, setGroupId] = useState("");
  const [images, setImages] = useState<ImageInput[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    Promise.all([
      fetch(`/api/contents/${id}`, { credentials: "same-origin" }).then((r) => {
        if (!r.ok)
          throw new Error(`コンテンツ取得に失敗しました (${r.status})`);
        return r.json();
      }),
      fetch(`/api/user/groups`, { credentials: "same-origin" }).then((r) => {
        if (!r.ok) throw new Error(`グループ取得に失敗しました (${r.status})`);
        return r.json();
      }),
    ])
      .then(([contentData, groupsResp]) => {
        console.debug("/api/user/groups response:", groupsResp);
        setTitle(contentData.title ?? "");
        setDescription(contentData.description ?? "");
        setGroupId(contentData.group?.id ?? contentData.groupId ?? "");
        setImages(
          (contentData.images || []).map((im: { storageUrl: string }) => ({
            url: im.storageUrl,
          }))
        );
        setGroups(groupsResp.payload ?? []);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [id]);

  const onAddImage = () => setImages((s) => [...s, { url: "" }]);
  const onRemoveImage = (idx: number) => {
    setImages((s) => s.filter((_, i) => i !== idx));
    setSelectedImageIndex((sel) =>
      sel === null ? null : sel === idx ? null : sel > idx ? sel - 1 : sel
    );
  };
  const onChangeImage = (idx: number, value: string) =>
    setImages((s) =>
      s.map((it, i) => (i === idx ? { ...it, url: value } : it))
    );

  const onClickImageItem = (idx: number) => {
    if (selectedImageIndex === null) {
      setSelectedImageIndex(idx);
      return;
    }
    if (selectedImageIndex === idx) {
      setSelectedImageIndex(null);
      return;
    }
    setImages((s) => {
      const copy = [...s];
      const tmp = copy[selectedImageIndex];
      copy[selectedImageIndex] = copy[idx];
      copy[idx] = tmp;
      return copy;
    });
    setSelectedImageIndex(null);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payloadImages = images.map((it, i) => ({ url: it.url, order: i }));
      const body = {
        title,
        description,
        groupId,
        images: payloadImages,
        tagIds: [],
      };
      const res = await fetch(`/api/contents/${id}`, {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(
          json?.message || json?.error || `更新に失敗しました (${res.status})`
        );
      }
      router.push("/content");
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("本当にこのコンテンツを削除しますか？")) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/contents/${id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (!res.ok) throw new Error(`削除に失敗しました (${res.status})`);
      router.push("/content");
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Spinner colorClass="text-gray-700" size={3} />
        <p className="mt-3 text-gray-600">読み込み中...</p>
      </div>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">コンテンツを編集</h1>
        <Link href="/content" className="px-3 py-1 bg-gray-200 rounded">
          一覧に戻る
        </Link>
      </div>

      {error && <p className="text-red-600">エラー: {error}</p>}

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">タイトル</label>
          <input
            className="w-full p-2 border rounded"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">説明</label>
          <textarea
            className="w-full p-2 border rounded"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">グループ</label>
          {groups.length > 1 ? (
            <div className="relative inline-block w-full">
              <button
                type="button"
                className="w-full text-left p-2 border rounded flex justify-between items-center"
                onClick={() => setDropdownOpen((s) => !s)}
              >
                <span>
                  {groups.find((g) => g.id === groupId)?.name ??
                    "選択してください"}
                </span>
                <span className="text-sm">▾</span>
              </button>
              {dropdownOpen && (
                <ul className="absolute left-0 right-0 bg-white border mt-1 max-h-48 overflow-auto z-10">
                  {groups.map((g) => (
                    <li key={g.id}>
                      <button
                        type="button"
                        className="w-full text-left p-2 hover:bg-gray-100"
                        onClick={() => {
                          setGroupId(g.id);
                          setDropdownOpen(false);
                        }}
                      >
                        {g.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : groups.length === 1 ? (
            <input
              className="w-full p-2 border rounded"
              value={groups[0].id}
              disabled
            />
          ) : (
            <input
              className="w-full p-2 border rounded"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              placeholder="グループIDを入力"
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            画像（クリックで選択→別の画像をクリックで入れ替え）
          </label>
          {images.map((img, idx) => (
            <div
              key={idx}
              onClick={() => onClickImageItem(idx)}
              className={`flex gap-2 items-center mb-2 p-2 rounded cursor-pointer ${selectedImageIndex === idx ? "bg-blue-50 border border-blue-200" : ""}`}
            >
              <div className="w-8 text-center text-sm text-gray-600">
                {idx + 1}
              </div>
              <input
                className="flex-1 p-2 border rounded"
                placeholder="画像URL"
                value={img.url}
                onChange={(e) => onChangeImage(idx, e.target.value)}
              />
              <button
                type="button"
                className="px-3 py-1 bg-red-600 text-white rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveImage(idx);
                }}
              >
                削除
              </button>
            </div>
          ))}
          <button
            type="button"
            className="px-3 py-1 bg-yellow-400 rounded"
            onClick={onAddImage}
          >
            画像を追加
          </button>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded"
            disabled={saving}
          >
            {saving ? "保存中..." : "保存"}
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-red-600 text-white rounded"
            onClick={handleDelete}
            disabled={saving}
          >
            削除
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-gray-300 rounded"
            onClick={() => router.push("/content")}
            disabled={saving}
          >
            キャンセル
          </button>
        </div>
      </form>
    </main>
  );
}
