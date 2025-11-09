"use client";

import React, { useEffect, useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/Spinner";
import { supabase } from "@/utils/supabase";
import { generateMD5Hash } from "@/app/_helper/generateHash";

type Group = { id: string; name: string };
type ImageInput = { url: string; storageKey?: string };

export default function ContentCreatePage() {
  const router = useRouter();

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [groupId, setGroupId] = useState<string>("");
  const [images, setImages] = useState<ImageInput[]>([]);
  const [tags, setTags] = useState<{ id: string; name: string }[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("/api/user/groups", { credentials: "same-origin" })
      .then((r) => {
        if (!r.ok) throw new Error(`グループ取得に失敗しました (${r.status})`);
        return r.json();
      })
      .then((data) => {
        console.debug("/api/user/groups response:", data);
        setGroups(data.payload ?? []);
        if ((data.payload ?? []).length === 1)
          setGroupId((data.payload ?? [])[0].id);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // load tags for selection
    fetch("/api/tags", { credentials: "same-origin" })
      .then((r) => {
        if (!r.ok) throw new Error(`タグ取得に失敗しました (${r.status})`);
        return r.json();
      })
      .then((data) => setTags(data ?? []))
      .catch((e) => console.debug("failed to fetch tags", e));
  }, []);

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((s) =>
      s.includes(tagId) ? s.filter((id) => id !== tagId) : [...s, tagId]
    );
  };

  const addImage = () => setImages((s) => [...s, { url: "" }]);
  const removeImage = async (i: number) => {
    const target = images[i];
    // 削除対象がSupabaseにアップロード済みならサーバー経由で削除を試みる
    if (target?.storageKey) {
      try {
        const res = await fetch("/api/supabase/delete-temp-files", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bucket: bucketName,
            paths: [target.storageKey],
          }),
        });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          console.warn("delete-temp-files returned error:", res.status, text);
          window.alert(
            "一時ファイルの削除に失敗しました。後で管理者に確認してください。"
          );
        }
      } catch (e) {
        console.debug("failed to delete storage key:", target.storageKey, e);
        window.alert(
          "一時ファイルの削除中にエラーが発生しました。後で管理者に確認してください。"
        );
      }
    }

    setImages((s) => s.filter((_, idx) => idx !== i));
    setSelectedImageIndex((sel) =>
      sel === null ? null : sel === i ? null : sel > i ? sel - 1 : sel
    );
  };
  const bucketName = "content_image";

  const handleFileChange = async (
    i: number,
    e: ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (!file) return;
    // 既にこのスロットにアップロード済みのファイルがあれば削除する
    const existing = images[i];
    if (existing?.storageKey) {
      try {
        const res = await fetch("/api/supabase/delete-temp-files", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bucket: bucketName,
            paths: [existing.storageKey],
          }),
        });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          console.warn(
            "delete-temp-files returned error on replace:",
            res.status,
            text
          );
        }
      } catch (err) {
        console.debug("failed to delete previous upload", err);
      }
    }
    // 拡張子を取得
    const ext = file.name.includes(".")
      ? file.name.substring(file.name.lastIndexOf("."))
      : "";
    const hashed = generateMD5Hash(file.name + "-" + Date.now());
    // 一時プレフィックスにアップロード
    const path = `public/temp/${hashed}${ext}`;

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(path, file, { upsert: true });
    if (error || !data) {
      console.error("upload error:", error);
      window.alert(
        `アップロードに失敗しました: ${error?.message || "unknown"}`
      );
      return;
    }
    const publicUrlResult = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);
    const publicUrl = publicUrlResult.data.publicUrl;
    setImages((s) =>
      s.map((it, idx) =>
        idx === i ? { ...it, url: publicUrl, storageKey: data.path } : it
      )
    );
  };

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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payloadImages = images.map((it, i) => ({
        url: it.url,
        order: i,
        storageKey: it.storageKey,
      }));
      const body = {
        title,
        description,
        groupId,
        images: payloadImages,
        tagIds: selectedTagIds,
      };
      const res = await fetch(`/api/contents`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(
          json?.message || json?.error || `作成に失敗しました (${res.status})`
        );
      }
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
      <h1 className="text-2xl font-semibold mb-4">コンテンツ作成</h1>
      {error && <p className="text-red-600">エラー: {error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">タイトル</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">説明</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded"
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
              <div className="flex-1">
                {!img.url ? (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      e.stopPropagation();
                      handleFileChange(idx, e);
                    }}
                  />
                ) : (
                  <div className="text-sm text-gray-500">
                    画像はアップロード済みのため変更できません（削除して再追加してください）
                  </div>
                )}
                {img.url && (
                  <div className="mt-2">
                    <img
                      src={img.url}
                      alt={`preview-${idx}`}
                      className="max-h-40 object-contain"
                    />
                    <div className="text-sm break-all text-gray-600">
                      {img.url}
                    </div>
                  </div>
                )}
              </div>
              <button
                type="button"
                className="px-3 py-1 bg-red-600 text-white rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(idx);
                }}
              >
                削除
              </button>
            </div>
          ))}
          <button
            type="button"
            className="px-3 py-1 bg-yellow-400 rounded"
            onClick={addImage}
          >
            画像を追加
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">タグ</label>
          <div className="flex flex-wrap gap-2">
            {tags.length === 0 ? (
              <div className="text-sm text-gray-500">タグが見つかりません</div>
            ) : (
              tags.map((t) => {
                const active = selectedTagIds.includes(t.id);
                return (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => toggleTag(t.id)}
                    className={`text-sm px-2 py-0.5 rounded ${active ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700"}`}
                  >
                    {t.name}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded"
            disabled={saving}
          >
            {saving ? "作成中..." : "作成"}
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-gray-300 rounded"
            onClick={async () => {
              if (saving) return;
              // 未保存のアップロードがあれば削除
              const keys = images
                .map((it) => it.storageKey)
                .filter(Boolean) as string[];
              if (keys.length > 0) {
                try {
                  const res = await fetch("/api/supabase/delete-temp-files", {
                    method: "POST",
                    credentials: "same-origin",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ bucket: bucketName, paths: keys }),
                  });
                  if (!res.ok) {
                    const text = await res.text().catch(() => "");
                    console.warn("cleanup on cancel failed:", res.status, text);
                    window.alert(
                      "キャンセル時の一時ファイル削除に失敗しました。後で管理者に確認してください。"
                    );
                  }
                } catch (e) {
                  console.debug(
                    "failed to cleanup uploaded files on cancel",
                    e
                  );
                  window.alert(
                    "キャンセル時の一時ファイル削除中にエラーが発生しました。後で管理者に確認してください。"
                  );
                }
              }
              router.push("/content");
            }}
            disabled={saving}
          >
            キャンセル
          </button>
        </div>
      </form>
    </main>
  );
}
