"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/libs/supabaseClient";
import Spinner from "@/components/Spinner";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { Autoplay } from "swiper/modules";
import Image from "next/image";
import Timer from "@/app/_components/Clock";
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
  const [now] = useState(new Date());
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

            // normalize snake_case -> camelCase to keep client-side model consistent
            const normalizeImage = (r?: ImageRecord) => {
              if (!r) return undefined;
              const asRec = r as unknown as {
                storage_url?: string;
                storageUrl?: string;
                content_id?: string;
                contentId?: string;
                id?: string;
                order?: number;
              };
              const normalized: ImageRecord = {
                id: asRec.id,
                order: asRec.order,
                content_id: asRec.content_id ?? asRec.contentId,
                contentId: (asRec.contentId ?? asRec.content_id) as
                  | string
                  | undefined,
                storageUrl: asRec.storageUrl ?? asRec.storage_url,
                storage_url: asRec.storage_url ?? asRec.storageUrl,
              };
              return normalized;
            };

            const normalizedRec = normalizeImage(imageRec);

            if (
              normalizedRec &&
              (normalizedRec.content_id || normalizedRec.contentId)
            ) {
              const contentId = (normalizedRec.content_id ??
                normalizedRec.contentId) as string;
              setData((prev) => {
                return prev.map((c) => {
                  if (c.id !== contentId) return c;
                  const imgs = Array.isArray(c.images) ? [...c.images] : [];
                  if (imageEv === "INSERT") {
                    return { ...c, images: [normalizedRec, ...imgs] };
                  }
                  if (imageEv === "UPDATE") {
                    const idx = imgs.findIndex(
                      (im) => im.id === normalizedRec.id
                    );
                    if (idx !== -1) {
                      imgs[idx] = { ...imgs[idx], ...normalizedRec };
                    } else {
                      imgs.push(normalizedRec);
                    }
                    imgs.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
                    return { ...c, images: imgs };
                  }
                  if (imageEv === "DELETE") {
                    return {
                      ...c,
                      images: imgs.filter((im) => im.id !== normalizedRec.id),
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

  const getBorderColorClass = (schedule: string): string => {
    const match = schedule.match(/(\d{1,2}):(\d{2})/);
    if (!match) return "border-sky-400"; // 時刻がなければデフォルトの水色

    const scheduleTime = new Date(now);
    scheduleTime.setHours(parseInt(match[1], 10), parseInt(match[2], 10), 0, 0);
    const diffMinutes = (scheduleTime.getTime() - now.getTime()) / (1000 * 60);

    if (diffMinutes > 0 && diffMinutes < 10) return "border-red-500";
    if (diffMinutes > 0 && diffMinutes < 30) return "border-orange-500";
    if (diffMinutes > 0 && diffMinutes < 60) return "border-green-500";
    return "border-sky-400";
  };

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
    <div>
      <div key={content.id} className="border border-slate-400 p-3 h-screen">
        <div className="flex h-full">
          <div className="w-1/4 flex flex-col h-full">
            <Timer />
            <div className="h-3/4 flex flex-col items-center justify-center text-4xl">
              <div>
                {(content.description ?? "")
                  .split("\n")
                  .map((schedule, idx) => (
                    <div
                      key={idx}
                      className={`my-8 pl-4 border-l-8 ${getBorderColorClass(schedule)}`}
                    >
                      <p>
                        {"🕒" +
                          schedule.substring(0, schedule.indexOf("～") + 1)}
                      </p>
                      <p className="pl-12">
                        {schedule.substring(schedule.indexOf("～") + 1).trim()}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
          <div className="w-3/4 flex flex-col h-full grow">
            <div className="h-1/4 flex items-center justify-center text-5xl font-bold">
              {content.title}
            </div>
            <div className="h-3/4 relative flex items-center justify-center">
              {content.images && content.images.length > 0 && (
                <Swiper
                  modules={[Autoplay]}
                  loop={(content.images?.length ?? 0) > 1}
                  autoplay={{ delay: 10000, disableOnInteraction: false }}
                  className="w-full h-full"
                  style={{ height: "100%" }}
                >
                  {content.images.map((image) => (
                    <SwiperSlide
                      key={image.id}
                      className="w-full h-full flex items-center justify-center"
                    >
                      <div className="p-6 bg-gray-50 rounded-lg flex items-center justify-center w-full h-full">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={image.storageUrl}
                          alt={content.title}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignageViewTest;
