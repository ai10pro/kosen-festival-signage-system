"use client";
import { useState, useEffect } from "react";

const Clock: React.FC = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const clock = setInterval(() => {
      setNow(new Date());
    }, 1000); // 1秒ごとに現在時刻を更新
    return () => clearInterval(clock);
  }, []);

  // 時刻を常に2桁でゼロ埋めしてフォーマットする関数
  const formatTime = (date: Date): string => {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  // 日付を「YYYY年MM月DD日（曜日）」形式でフォーマットする関数
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // 月は0から始まるため+1
    const day = String(date.getDate()).padStart(2, "0");
    const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
    const weekday = weekdays[date.getDay()]; // 曜日を取得
    return `${year}年${month}月${day}日（${weekday}）`;
  };

  return (
    <div className="w-full h-full border-2 rounded-2xl p-4">
      <div className="p-2 m-auto">
        <div className="flex items-center justify-center text-3xl">
          {formatDate(now)}
        </div>
        <div className="flex items-center justify-center text-6xl font-bold">
          {formatTime(now)}
        </div>
      </div>
    </div>
  );
};

export default Clock;
