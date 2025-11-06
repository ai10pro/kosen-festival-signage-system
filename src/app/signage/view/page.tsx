"use client";
import dummyData from "@/app/_mocks/dummyData";
import Image from "next/image";
import Timer from "@/app/_components/Timer"
import { useState, useEffect } from "react";

const Signage: React.FC = () => {
  const content = dummyData[0]; // モックデータから最初のコンテンツを取得
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000); // 1秒ごとに現在時刻を更新
    return () => clearInterval(timer);
  }, []);

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

  return (
    <div className="border border-slate-400 p-3 h-screen">
      <div className="flex h-full">
        <div className="w-1/4 flex flex-col h-full">
          <Timer></Timer>
          <div className="h-3/4 flex flex-col items-center justify-center text-4xl">
            <div>
              {content.description.split("\n").map((schedule, index) => (
                <div key={index} className={`my-8 pl-4 border-l-8 ${getBorderColorClass(schedule)}`}>
                  <p>
                    {"🕒" + schedule.substring(0, schedule.indexOf("～") + 1)}
                  </p>
                  <p className="pl-12">
                    {schedule.substring(schedule.indexOf("～") + 1).trim()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="w-3/4 flex flex-col h-full">
          <div className="h-1/4 flex items-center justify-center">
            {content.title}
          </div>
          <div className="h-3/4 relative flex items-center justify-center">
            {content.images && content.images.length > 0 && (
              <Image
                src={content.images[0].storageUrl}
                alt={content.title}
                fill
                style={{ objectFit: "contain" }}
                priority
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signage;