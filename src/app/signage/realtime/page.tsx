"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/libs/supabaseClient";
import Spinner from "@/components/Spinner";

// コンテンツ型定義
type ImageRecord = {
  id?: string;
  order?: number;
  content_id?: string;
  contentId?: string;
  storageUrl?: string;
  storage_url?: string;
};

type ContentSummary = {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
  status?: string;
  rejectionReason?: string | null;
  group?: { id: string; name: string } | null;
  uploader?: { id: string; username?: string } | null;
  images?: ImageRecord[];
  contentTags?: { tag: { id: string; name: string } }[];
};

const ContentListPage: React.FC = () => {
  const [data, setData] = useState<ContentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0); // 現在表示中のコンテンツインデックス

  // ✅ コンテンツ取得
  const fetchList = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/contents", { credentials: "same-origin" });
      if (!res.ok) throw new Error(`取得に失敗しました (${res.status})`);
      const json = await res.json();
      // API may return either an array or an ApiResponse-like object
      const list: ContentSummary[] = Array.isArray(json)
        ? json
        : (json?.payload ?? []);
      setData(list);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  // ✅ Supabase Realtime購読 & 初回ロード
  useEffect(() => {
    fetchList();

    const channel = supabase
      .channel("realtime-contents")
      // content テーブルの変化
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contents" },
        async (payload) => {
          console.log("[realtime] Content changed:", payload);
          try {
            // Try to update locally from payload for instant UI update
            type RealtimePayload = {
              eventType?: string;
              event?: string;
              type?: string;
              record?: ContentSummary;
              new?: ContentSummary;
              new_record?: ContentSummary;
              old?: ContentSummary;
              old_record?: ContentSummary;
            };
            const p = payload as unknown as RealtimePayload;
            // payload may contain new/record or old (for deletes)
            const rec =
              p.record ?? p.new ?? p.new_record ?? p.old ?? p.old_record;
            const evType = (p.eventType ?? p.event ?? p.type ?? "")
              .toString()
              .toUpperCase();
            if (rec && (evType === "INSERT" || evType === "insert")) {
              setData((prev) => [rec as ContentSummary, ...prev]);
            } else if (rec && (evType === "UPDATE" || evType === "update")) {
              setData((prev) =>
                prev.map((d) => (d.id === rec.id ? (rec as ContentSummary) : d))
              );
            } else if (rec && (evType === "DELETE" || evType === "delete")) {
              setData((prev) => prev.filter((d) => d.id !== rec.id));
            } else {
              // fallback: refetch full list
              await fetchList();
            }
          } catch (err) {
            console.debug("failed to apply realtime payload, refetching", err);
            await fetchList();
          }
        }
      )
      // images テーブルの変化も監視する（画像の並び替えや削除に反映させるため）
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "images" },
        async (payload) => {
          console.log("[realtime] Images changed:", payload);
          try {
            type ImagesPayload = {
              eventType?: string;
              event?: string;
              type?: string;
              record?: ImageRecord;
              new?: ImageRecord;
              new_record?: ImageRecord;
              old?: ImageRecord;
              old_record?: ImageRecord;
            };
            const ip = payload as unknown as ImagesPayload;
            const imageRec =
              ip.record ?? ip.new ?? ip.new_record ?? ip.old ?? ip.old_record;
            const imageEv = (ip.eventType ?? ip.event ?? ip.type ?? "")
              .toString()
              .toUpperCase();

            if (imageRec && imageRec.content_id) {
              const contentId = imageRec.content_id as string;
              // 単純な処理: 該当コンテンツの images 配列を更新/削除/挿入
              setData((prev) => {
                return prev.map((c) => {
                  if (c.id !== contentId) return c;
                  const imgs = Array.isArray(c.images) ? [...c.images] : [];
                  if (imageEv === "INSERT") {
                    // 先頭に追加
                    return { ...c, images: [imageRec, ...imgs] };
                  }
                  if (imageEv === "UPDATE") {
                    const idx = imgs.findIndex((im) => im.id === imageRec.id);
                    if (idx !== -1) {
                      imgs[idx] = { ...imgs[idx], ...imageRec };
                    } else {
                      imgs.push(imageRec);
                    }
                    // ソート保証 (order フィールドがあれば利用)
                    imgs.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
                    return { ...c, images: imgs };
                  }
                  if (imageEv === "DELETE") {
                    return {
                      ...c,
                      images: imgs.filter((im) => im.id !== imageRec.id),
                    };
                  }
                  // フォールバック: 再取得
                  fetchList();
                  return c;
                });
              });
            } else {
              // 画像イベントだが content_id がない場合は安全のため再取得
              await fetchList();
            }
          } catch (err) {
            console.debug(
              "failed to apply images realtime payload, refetching",
              err
            );
            await fetchList();
          }
        }
      )
      // signage テーブルの変化
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "signages" },
        async (payload) => {
          console.log("[realtime] Signage changed:", payload);
          await fetchList();
        }
      );

    // subscribe and log lifecycle events
    const sub = channel.subscribe();
    console.log("[realtime] subscribing to channel", sub);
    // attempt to observe subscription status (receive OK or ERROR)
    try {
      // subscribe() may return a runtime object with `receive` method depending on supabase-js internals
      // Call receive handlers if available to log lifecycle events
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      sub.receive?.("ok", () => console.log("[realtime] subscription ok"));
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      sub.receive?.("error", (e) =>
        console.error("[realtime] subscription error", e)
      );
    } catch (e) {
      console.debug("[realtime] subscribe receive not supported", e);
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ✅ 一定時間ごとに表示コンテンツを切り替える
  useEffect(() => {
    if (data.length === 0) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % data.length);
    }, 8000); // 8秒ごとに切り替え
    return () => clearInterval(timer);
  }, [data]);

  // ✅ UI部分
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Spinner colorClass="text-gray-700" size={3} />
        <p className="mt-3 text-gray-600">読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return <p className="text-red-600 text-center mt-10">{error}</p>;
  }

  if (data.length === 0) {
    return (
      <p className="text-center text-gray-600 mt-10">
        コンテンツが存在しません。
      </p>
    );
  }

  // 現在表示中のコンテンツ
  const content = data[index];

  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-semibold mb-6 text-center">
        サイネージ表示
      </h1>

      <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg overflow-hidden">
        {/* 画像表示 */}
        <div className="h-64 bg-gray-100 flex items-center justify-center">
          {content.images &&
          content.images.length > 0 &&
          content.images[0].storageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={content.images[0].storageUrl}
              alt={content.title}
              className="w-full h-64 object-cover"
            />
          ) : (
            <div className="text-gray-400 text-lg">画像なし</div>
          )}
        </div>

        {/* 本文 */}
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800">{content.title}</h2>
          {content.description && (
            <p className="mt-2 text-gray-600 text-lg">{content.description}</p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {content.group && (
              <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-sm rounded">
                {content.group.name}
              </span>
            )}
            {content.uploader && (
              <span className="text-sm text-gray-500">
                作成者: {content.uploader.username}
              </span>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            {content.contentTags?.map(
              (ct: { tag: { id: string; name: string } }) => (
                <span
                  key={ct.tag.id}
                  className="text-xs bg-gray-100 px-2 py-1 rounded"
                >
                  #{ct.tag.name}
                </span>
              )
            )}
          </div>

          <div className="mt-6 text-sm text-gray-500 text-right">
            {new Date(content.createdAt).toLocaleString()}
          </div>
        </div>
      </div>

      {/* 下部にページ送り情報 */}
      <div className="mt-4 text-gray-500 text-sm">
        {index + 1} / {data.length} 件目
      </div>
    </div>
  );
};

export default ContentListPage;
