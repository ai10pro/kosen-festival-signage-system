"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Spinner from "@/components/Spinner";
import Image from "next/image";

type ImageItem = {
  id: string;
  storageUrl: string;
  fileHash?: string;
  order: number;
  contentId: string;
  groupId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export default function ImageListPage() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);

  // contentId -> title map (fetched once per content)
  // no title fetching: show contentId to avoid extra API calls
  // (previously we kept a contentsMap and fetched /api/contents/:id per content)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const deleteImage = async (id: string) => {
    if (!confirm("本当にこの画像を削除しますか？")) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/images/${id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });

      if (!res.ok) {
        // Try to parse json error if present
        try {
          const err = await res.json();
          setError(err?.message || `削除に失敗しました (status ${res.status})`);
        } catch (err) {
          console.error(err);
          setError(
            `削除に失敗しました (status ${res.status} ${res.statusText})`
          );
        }
        return;
      }

      const data = await res.json();
      if (data.success) {
        alert("画像を削除しました。");
      } else {
        setError(data.message);
      }
    } catch (e) {
      // ネットワークエラー等
      setError(String(e));
    } finally {
      setLoading(false);
      // 再フェッチ（現在選択中のグループで）
      fetchImages(selectedGroupId);
    }
  };

  const fetchImages = useCallback(async (groupId?: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const url = groupId
        ? `/api/images?groupId=${encodeURIComponent(groupId)}`
        : "/api/images";
      console.debug("fetchImages ->", url);
      const res = await fetch(url, { credentials: "same-origin" });

      if (!res.ok) {
        try {
          const err = await res.json();
          setError(err?.message || `取得に失敗しました (status ${res.status})`);
        } catch (err) {
          console.error(err);
          setError(
            `取得に失敗しました (status ${res.status} ${res.statusText})`
          );
        }
        return;
      }

      const data = await res.json();

      if (data.success) {
        // 画像をcontentIdでソート後，order順に並び替え
        const sortedImages = (data.payload as ImageItem[]).sort((a, b) => {
          if (a.contentId === b.contentId) {
            return a.order - b.order;
          }
          return a.contentId.localeCompare(b.contentId);
        });
        setImages(sortedImages);
        // NOTE: Avoid fetching content titles to prevent extra /api/contents/:id calls
        // We will display contentId directly to avoid Supabase / Prisma rate/limits.
      } else {
        setError(data.message);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  // fetchGroups runs once on mount; fetchImages is memoized with useCallback
  useEffect(() => {
    // まず所属グループを取得してから画像を取得
    const fetchGroups = async () => {
      setLoading(true);
      // get current user role
      let admin = false;
      try {
        const authRes = await fetch("/api/auth", {
          credentials: "same-origin",
        });
        if (authRes.ok) {
          const authBody = await authRes.json();
          admin = !!(authBody?.success && authBody.payload?.role === "ADMIN");
        }
      } catch {
        // ignore auth errors here; groups fetch will handle permissions
      }
      try {
        const res = await fetch("/api/user/groups", {
          credentials: "same-origin",
        });

        if (!res.ok) {
          try {
            const err = await res.json();
            setError(
              err?.message ||
                `グループ取得に失敗しました (status ${res.status})`
            );
          } catch (err) {
            console.error(err);
            setError(
              `グループ取得に失敗しました (status ${res.status} ${res.statusText})`
            );
          }
          return;
        }

        const data = await res.json();
        if (data.success) {
          const g = data.payload || [];
          setGroups(g);
          // ADMIN は全件表示（group 未指定）をデフォルトにする
          if (admin) {
            setSelectedGroupId(null);
            await fetchImages(null);
          } else {
            // デフォルト選択：グループが1件以上なら最初のグループを選択
            if (g.length === 1) {
              setSelectedGroupId(g[0].id);
              await fetchImages(g[0].id);
            } else if (g.length > 1) {
              // 複数ある場合は最初のグループを選択して表示（ユーザーは後で切替可能）
              setSelectedGroupId(g[0].id);
              await fetchImages(g[0].id);
            } else {
              // 所属グループが無い場合は空配列を表示
              setImages([]);
              setLoading(false);
            }
          }
        } else {
          setError(data.message || "グループ取得エラー");
        }
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
    // Note: fetchImages is stable (useCallback without deps). isAdmin is read inside the effect;
    // leaving dependency array empty to run this only on mount is intentional.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGroupChange = async (groupId: string) => {
    setSelectedGroupId(groupId);
    await fetchImages(groupId);
  };

  return (
    <main className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">画像一覧</h1>
        <div className="flex items-center gap-3">
          {groups.length > 1 && (
            <select
              value={selectedGroupId ?? ""}
              onChange={(e) => handleGroupChange(e.target.value)}
              className="px-3 py-2 border rounded"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          )}
          <Link
            href="/images/upload"
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            画像をアップロード
          </Link>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Spinner colorClass="text-gray-700" size={3} />
          <p className="mt-3 text-gray-600">読み込み中...</p>
        </div>
      )}
      {error && <p className="text-red-600">エラー: {error}</p>}

      {/* Filter out images without a valid storageUrl before rendering */}
      {images.length === 0 ? (
        <div className="text-center text-gray-600">画像が存在しません。</div>
      ) : (
        <ul className="space-y-2">
          {images
            .filter((img) => img.storageUrl && img.storageUrl.trim() !== "")
            .map((image) => (
              <li
                key={image.id}
                className="flex items-center justify-between p-3 border rounded"
              >
                <div>
                  <p className="font-medium">
                    Content:{" "}
                    <Link href={`/content/${image.contentId}`} prefetch={false}>
                      {image.contentId}
                    </Link>
                    {/* disable Link prefetch to avoid automatic prefetching requests */}
                  </p>
                  <p className="text-sm text-gray-500">ID: {image.id}</p>
                  {/* Order フィールドは存在しないため表示しない */}
                </div>
                <div className="space-x-2">
                  <Image
                    src={image.storageUrl}
                    alt={`Image ${image.id}`}
                    width={150}
                    height={100}
                    className="rounded"
                  />
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => deleteImage(image.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded"
                  >
                    削除
                  </button>
                </div>
                <div className="space-x-2">
                  <Link
                    href={`/images/edit/${image.id}`}
                    className="px-3 py-1 bg-yellow-400 rounded"
                  >
                    編集
                  </Link>
                </div>
              </li>
            ))}
        </ul>
      )}
    </main>
  );
}
