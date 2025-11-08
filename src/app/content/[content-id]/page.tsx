"use client";

import React, { useEffect, useState, ChangeEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Spinner from "@/components/Spinner";
import { supabase } from "@/utils/supabase";
import { generateMD5Hash } from "@/app/_helper/generateHash";

type Group = { id: string; name: string };
type ImageInput = { url: string; id?: string; storageKey?: string };

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
          (contentData.images || []).map(
            (im: { storageUrl: string; id: string }) => ({
              url: im.storageUrl,
              id: im.id,
            })
          )
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

  const bucketName = "content_image";

  const handleFileChange = async (
    idx: number,
    e: ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (!file) return;
    // 既にこのスロットにアップロード済みのファイルがあれば削除する
    const existing = images[idx];
    // storageKey があれば確実に削除
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
    } else if (existing?.url) {
      // 既存の保存済み画像の public URL からパスを推定して削除を試みる（可能な場合のみ）
      try {
        const marker = "/storage/v1/object/public/";
        const idxMarker = existing.url.indexOf(marker);
        if (idxMarker !== -1) {
          const after = existing.url.substring(idxMarker + marker.length); // bucket/relative/path
          const parts = after.split("/");
          // parts[0] が bucket 名のはず
          if (parts.length >= 2 && parts[0] === bucketName) {
            const relPath = parts.slice(1).join("/");
            // Supabase の remove にはバケット内のパス（例: public/exhibition/xxx）を渡す
            try {
              const res = await fetch("/api/supabase/delete-temp-files", {
                method: "POST",
                credentials: "same-origin",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bucket: bucketName, paths: [relPath] }),
              });
              if (!res.ok) {
                const text = await res.text().catch(() => "");
                console.warn(
                  "delete-temp-files returned error on inferred path:",
                  res.status,
                  text
                );
              }
            } catch (err) {
              console.debug(
                "failed to infer and delete previous public url",
                err
              );
            }
          }
        }
      } catch (err) {
        console.debug("failed to infer and delete previous public url", err);
      }
    }
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

    // 既存画像（DBにレコードがある）なら PATCH、それ以外は POST して新規作成
    if (existing && existing.id) {
      // PATCH
      try {
        const res = await fetch(`/api/images/${existing.id}`, {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storageUrl: publicUrl,
            storageKey: data.path,
            order: idx,
          }),
        });
        if (!res.ok) throw new Error(`画像更新に失敗しました (${res.status})`);
        // 更新に成功したら state 更新
        setImages((s) =>
          s.map((it, i) =>
            i === idx ? { ...it, url: publicUrl, storageKey: data.path } : it
          )
        );
      } catch (err) {
        window.alert(String(err));
      }
    } else {
      // POST 新規画像登録
      try {
        const payload = {
          storageUrl: publicUrl,
          storageKey: data.path,
          contentId: id,
          order: idx,
        };
        const res = await fetch(`/api/images`, {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`画像作成に失敗しました (${res.status})`);
        const json = await res.json();
        const created = json.payload;
        setImages((s) =>
          s.map((it, i) =>
            i === idx
              ? {
                  url: created.storageUrl,
                  id: created.id,
                  storageKey: data.path,
                }
              : it
          )
        );
      } catch (err) {
        window.alert(String(err));
      }
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
