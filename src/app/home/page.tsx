"use client";

import { useEffect, useState } from "react";

import Clock from "@/app/_components/Clock";

export default function Home() {
  return (
    <main className="flex">
      <div className="w-3/5 bg-gray-100 h-screen">
        <div className="h-3/5 border-2 rounded-2xl">1つ目の左上のやつ</div>
        <div className="h-2/5 border-2 rounded-2xl space-y-5">
          二つ目の左下のやつ
        </div>
      </div>
      <div className="w-2/5 bg-neutral-100">
        <div className="h-1/5 border-2 rounded-4xl flex-col flex">
          <Clock />
        </div>
        <div className="h-4/5 border-2 rounded-4xl">通知エリア</div>
      </div>
    </main>
  );
}
