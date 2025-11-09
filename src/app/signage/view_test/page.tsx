"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/libs/supabaseClient";
import Spinner from "@/components/Spinner";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { Autoplay } from "swiper/modules";

// 画面表示用のコンテンツ型（必要最小限）
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

const SignageViewTest: React.FC = () => {
  const [data, setData] = useState<ContentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);

  const fetchList = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/contents", { credentials: "same-origin" });
      if (!res.ok) throw new Error(`取得に失敗しました (${res.status})`);
      const json = await res.json();
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

  useEffect(() => {
    fetchList();

    const channel = supabase
      .channel("realtime-contents-view-test")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contents" },
        async (payload) => {
          console.log("[realtime:view_test] Content changed:", payload);
          try {
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
              await fetchList();
            }
          } catch (err) {
            console.debug(
              "failed to apply realtime payload (contents), refetching",
              err
            );
            await fetchList();
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "images" },
        async (payload) => {
          console.log("[realtime:view_test] Images changed:", payload);
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

            if (imageRec && (imageRec.content_id || imageRec.contentId)) {
              const contentId = (imageRec.content_id ??
                imageRec.contentId) as string;
              setData((prev) => {
                return prev.map((c) => {
                  if (c.id !== contentId) return c;
                  const imgs = Array.isArray(c.images) ? [...c.images] : [];
                  if (imageEv === "INSERT") {
                    return { ...c, images: [imageRec, ...imgs] };
                  }
                  if (imageEv === "UPDATE") {
                    const idx = imgs.findIndex((im) => im.id === imageRec.id);
                    if (idx !== -1) {
                      imgs[idx] = { ...imgs[idx], ...imageRec };
                    } else {
                      imgs.push(imageRec);
                    }
                    imgs.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
                    return { ...c, images: imgs };
                  }
                  if (imageEv === "DELETE") {
                    return {
                      ...c,
                      images: imgs.filter((im) => im.id !== imageRec.id),
                    };
                  }
                  fetchList();
                  return c;
                });
              });
            } else {
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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "signages" },
        async () => {
          // signage テーブルの変更があればフルリロード
          await fetchList();
        }
      );

    const sub = channel.subscribe();
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      sub.receive?.("ok", () =>
        console.log("[realtime:view_test] subscription ok")
      );
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      sub.receive?.("error", (e) =>
        console.error("[realtime:view_test] subscription error", e)
      );
    } catch (e) {
      console.debug("subscribe receive not supported", e);
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 自動で切り替え — 画像があればそのスライドが1周し終わったら次へ
  useEffect(() => {
    if (data.length === 0) return;

    // 現在のコンテンツが配列外になっていたらリセット
    if (index >= data.length) {
      setIndex(0);
      return;
    }

    const current = data[index];
    const slideDelayMs = 10000; // Swiper 側の autoplay delay と合わせる
    const displayDuration =
      current?.images && current.images.length > 0
        ? current.images.length * slideDelayMs
        : 8000; // 画像がない場合は既定の表示時間

    const timer = setTimeout(() => {
      setIndex((prev) => (prev + 1) % data.length);
    }, displayDuration);

    return () => clearTimeout(timer);
  }, [data, index]);

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

  const content = data[index];

  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-semibold mb-6 text-center">
        サイネージ表示（テスト）
      </h1>

      <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="h-64 bg-gray-100 flex items-center justify-center">
          {content.images &&
          content.images.length > 0 &&
          content.images[0].storageUrl ? (
            <Swiper
              modules={[Autoplay]}
              loop={(content.images?.length ?? 0) > 1}
              autoplay={{ delay: 10000, disableOnInteraction: false }}
            >
              {content.images?.map((image) => (
                <SwiperSlide key={image.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.storageUrl}
                    alt={content.title}
                    className="w-full h-64 object-cover"
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div className="text-gray-400 text-lg">画像なし</div>
          )}
        </div>

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

      <div className="mt-4 text-gray-500 text-sm">
        {index + 1} / {data.length} 件目
      </div>
    </div>
  );
};

export default SignageViewTest;
