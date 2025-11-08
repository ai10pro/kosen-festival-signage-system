"use client";

import React, { useEffect, useState } from "react";
import Spinner from "@/components/Spinner";

type ContentSummary = {
  id: string;
  title: string;
  description?: string;
  status: string;
  rejectionReason?: string | null;
  createdAt: string;
  group?: { id: string; name: string } | null;
  uploader?: { id: string; username?: string } | null;
};

export default function AdminContentsAuthPage() {
  const [data, setData] = useState<ContentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const fetchList = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/contents", { credentials: "same-origin" });
      if (!res.ok) throw new Error(`取得に失敗しました (${res.status})`);
      const json = await res.json();
      setData(json ?? []);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // load current user role then fetch list
    const load = async () => {
      try {
        const r = await fetch("/api/auth", { credentials: "same-origin" });
        if (r.ok) {
          const json = await r.json().catch(() => null);
          const role = json?.payload?.role;
          setIsAdmin(role === "ADMIN");
        }
      } catch (err) {
        console.debug(err);
        setIsAdmin(false);
      }
      await fetchList();
    };
    load();
  }, []);

  const changeStatus = async (
    id: string,
    status: "APPROVED" | "REJECTED" | "PENDING"
  ) => {
    if (status === "REJECTED") {
      const reason = prompt("却下理由を入力してください（任意）:") ?? null;
      return submitStatus(id, status, reason);
    }
    return submitStatus(id, status, null);
  };

  const submitStatus = async (
    id: string,
    status: string,
    rejectionReason: string | null
  ) => {
    setSavingId(id);
    try {
      const res = await fetch(`/api/contents/auth/${id}`, {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, rejectionReason }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(
          json?.message || json?.error || `更新に失敗しました (${res.status})`
        );
      }
      await fetchList();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">コンテンツ承認管理</h1>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Spinner colorClass="text-gray-700" size={3} />
          <p className="mt-3 text-gray-600">読み込み中...</p>
        </div>
      ) : error ? (
        <p className="text-red-600">読み込みエラー: {error}</p>
      ) : data && data.length === 0 ? (
        <div className="text-center text-gray-600">
          コンテンツが存在しません。
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {data.map((c) => (
            <div
              key={c.id}
              className="p-4 bg-white rounded shadow flex flex-col md:flex-row md:items-center md:justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold">{c.title}</h2>
                  <span className="text-sm text-gray-500">{c.group?.name}</span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {c.description}
                </div>
                <div className="mt-2">
                  <span
                    className={`px-2 py-0.5 text-xs rounded ${c.status === "APPROVED" ? "bg-green-100 text-green-700" : c.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}
                  >
                    {c.status}
                  </span>
                  {c.rejectionReason && (
                    <div className="text-sm text-red-600 mt-1">
                      却下理由: {c.rejectionReason}
                    </div>
                  )}
                </div>
              </div>

              {isAdmin && (
                <div className="flex items-center gap-2">
                  <button
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm"
                    disabled={savingId === c.id}
                    onClick={() => changeStatus(c.id, "APPROVED")}
                  >
                    承認
                  </button>
                  <button
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm"
                    disabled={savingId === c.id}
                    onClick={() => changeStatus(c.id, "REJECTED")}
                  >
                    却下
                  </button>
                  <button
                    className="px-3 py-1 bg-gray-300 rounded text-sm"
                    disabled={savingId === c.id}
                    onClick={() => changeStatus(c.id, "PENDING")}
                  >
                    保留
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
