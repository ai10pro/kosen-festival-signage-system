"use client";

import React, { useEffect, useState } from "react";
import Spinner from "@/components/Spinner";
import Link from "next/link";
import type {
  RawSignage,
  RawContentSetting,
  SignageItem as SignageItemType,
} from "@/_types/Signage";

export default function SignagesPage() {
  const [signages, setSignages] = useState<SignageItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSignages = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/signages", {
          credentials: "same-origin",
        });
        if (!res.ok) {
          const j = await res.json().catch(() => null);
          throw new Error(
            j?.message || `failed to fetch signages (${res.status})`
          );
        }
        const json = (await res.json()) as {
          success?: boolean;
          message?: string;
          payload?: RawSignage[];
        };
        if (!json?.success)
          throw new Error(json?.message || "failed to fetch signages");

        // normalize shape if necessary
        const items: SignageItemType[] = (json.payload || []).map(
          (s: RawSignage) => ({
            id: s.id,
            uniqueKey: s.uniqueKey,
            locationName: s.locationName,
            lastActiveAt: s.lastActiveAt ?? null,
            contentSettings: (s.contentSettings || []).map(
              (cs: RawContentSetting) => ({
                signageId: cs.signageId ?? s.id,
                groupId: cs.group?.id ?? cs.groupId ?? "",
                order: cs.order ?? 0,
                group: {
                  id: cs.group?.id ?? cs.groupId ?? "",
                  name: cs.group?.name ?? null,
                  imageContentIds:
                    cs.imageContentIds ?? cs.group?.imageContentIds ?? [],
                },
              })
            ),
          })
        );

        setSignages(items);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    };

    fetchSignages();
  }, []);

  const formatLastActive = (iso: string) => {
    try {
      const d = new Date(iso);
      // フォーマットは日本時間で表示
      const formatted = d.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
      const diffMin = Math.round((Date.now() - d.getTime()) / 60000);
      if (Number.isNaN(diffMin)) return formatted;
      if (diffMin <= 0) return `${formatted} (今)`;
      if (diffMin < 60) return `${formatted} (${diffMin}分前)`;
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) return `${formatted} (${diffHour}時間前)`;
      const diffDay = Math.floor(diffHour / 24);
      return `${formatted} (${diffDay}日前)`;
    } catch {
      return iso;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Spinner size={4} colorClass="text-gray-700" />
        <p className="mt-3 text-gray-600">サイネージを読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return <p className="text-red-600">エラー: {error}</p>;
  }

  return (
    <main className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">サイネージ一覧</h1>
        <Link
          href="/signage/view"
          prefetch={false}
          className="px-3 py-2 bg-blue-600 text-white rounded"
        >
          サイネージモードで表示
        </Link>
      </div>

      {signages.length === 0 ? (
        <div className="text-center text-gray-600">
          サイネージが登録されていません。
        </div>
      ) : (
        <ul className="space-y-4">
          {signages.map((s) => (
            <li key={s.id} className="p-4 border rounded">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-medium">{s.locationName}</h2>
                  <p className="text-sm text-gray-500">Key: {s.uniqueKey}</p>
                  <p className="text-sm text-gray-500">
                    最終接続:{" "}
                    {s.lastActiveAt ? formatLastActive(s.lastActiveAt) : "--"}
                  </p>
                </div>
                <div className="text-right">
                  <Link
                    href={`/signages/${s.id}`}
                    prefetch={false}
                    className="text-sm text-blue-600"
                  >
                    編集
                  </Link>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {s.contentSettings.map((cs) => (
                  <div
                    key={cs.group?.id ?? cs.groupId}
                    className="p-3 bg-gray-50 rounded"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          Group: {cs.group?.name ?? cs.groupId}
                        </p>
                        <p className="text-sm text-gray-500">
                          順序: {cs.order}
                        </p>
                      </div>
                      <div className="text-sm text-gray-600">
                        {(cs.group?.imageContentIds || []).length}{" "}
                        件のコンテンツ
                      </div>
                    </div>

                    {(cs.group?.imageContentIds || []).length > 0 && (
                      <div className="mt-2 text-sm text-gray-700">
                        <strong className="mr-2">contentIds:</strong>
                        <span className="break-all">
                          {(cs.group?.imageContentIds || [])
                            .slice(0, 8)
                            .join(", ")}
                          {(cs.group?.imageContentIds || []).length > 8
                            ? ", ..."
                            : ""}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
