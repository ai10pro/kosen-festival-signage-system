"use client";
import Image from "next/image";
import Timer from "@/app/_components/Clock";
import { useState, useEffect } from "react";
import type { ContentResponse } from "@/app/_types/ContentRequest";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { Autoplay } from "swiper/modules";

const Signage: React.FC = () => {
  const [now, setNow] = useState<Date | null>(null);
  const [contents, setContents] = useState<ContentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNow(new Date());
    const fetchContents = async () => {
      try {
        const res = await fetch("/api/contents", {
          credentials: "same-origin",
        });
        if (!res.ok) {
          throw new Error(`コンテンツの取得に失敗しました: ${res.status}`);
        }
        const json = await res.json();
        setContents(json);
      } catch (e: unknown) {
        if (e instanceof Error) {
          setError(e.message);
          console.error(e);
        } else {
          setError("不明なエラーが発生しました");
          console.error("Unknown error: ", e);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchContents();
  }, []);

  const getBorderColorClass = (schedule: string): string => {
    if (!now) return "border-sky-400"; // nowがnullの場合はデフォルト

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

  if (loading || !now) {
    return (
      <div className="h-screen flex items-center justify-center">
        読み込み中...
      </div>
    );
  }
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center text-red-500">
        エラー: {error}
      </div>
    );
  }
  if (contents.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center">
        表示するコンテンツがありません。
      </div>
    );
  }

  return (
    <div>
      {contents.map((content) => (
        <div key={content.id} className="border border-slate-400 p-3 h-screen">
          <div className="flex h-full">
            <div className="w-1/4 flex flex-col h-full">
              <Timer></Timer>
              <div className="h-3/4 flex flex-col items-center justify-center text-4xl">
                <div>
                  {content.description.split("\n").map((schedule, index) => (
                    <div
                      key={index}
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
                    loop={contents.length > 1}
                    autoplay={{ delay: 10000, disableOnInteraction: false }}
                  >
                    {content.images.map((image) => (
                      <SwiperSlide key={image.id}>
                        <img
                          src={image.storageUrl}
                          alt={content.title}
                          className="mx-auto"
                        />
                      </SwiperSlide>
                    ))}
                  </Swiper>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Signage;
