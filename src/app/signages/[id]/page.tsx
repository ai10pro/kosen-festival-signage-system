"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Spinner from "@/components/Spinner";
import Link from "next/link";

type Group = { id: string; name?: string | null };
type Signage = {
  id: string;
  locationName: string;
  uniqueKey: string;
  contentSettings: Array<{
    groupId: string;
    order: number;
    group?: Group | null;
  }>;
};

export default function SignageEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id || "";

  const [signage, setSignage] = useState<Signage | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/signages/${id}`).then((r) => r.json()),
      // fetch all groups so editor can pick any group
      fetch(`/api/groups`).then((r) => r.json()),
    ])
      .then(([sdata, gdata]) => {
        if (!sdata?.success)
          throw new Error(sdata?.message || "サイネージ取得失敗");
        if (!gdata?.success)
          throw new Error(gdata?.message || "グループ取得失敗");
        setSignage(sdata.payload);
        setLocationName(sdata.payload.locationName || "");
        setGroups(gdata.payload || []);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddGroup = (groupId: string) => {
    if (!signage) return;
    if (signage.contentSettings.some((cs) => cs.groupId === groupId)) return;
    // find the group object from fetched groups so we can show the name immediately
    const g = groups.find((x) => x.id === groupId) ?? null;
    const next = [
      ...signage.contentSettings,
      { groupId, order: signage.contentSettings.length, group: g },
    ];
    setSignage({ ...signage, contentSettings: next });
  };

  const handleMoveUp = (groupId: string) => {
    if (!signage) return;
    const idx = signage.contentSettings.findIndex(
      (cs) => cs.groupId === groupId
    );
    if (idx <= 0) return; // 先頭は上に動かせない
    const arr = [...signage.contentSettings];
    // swap
    const tmp = arr[idx - 1];
    arr[idx - 1] = { ...arr[idx], order: idx - 1 };
    arr[idx] = { ...tmp, order: idx };
    // reindex to be safe
    const reindexed = arr.map((it, i) => ({ ...it, order: i }));
    setSignage({ ...signage, contentSettings: reindexed });
  };

  const handleMoveDown = (groupId: string) => {
    if (!signage) return;
    const idx = signage.contentSettings.findIndex(
      (cs) => cs.groupId === groupId
    );
    if (idx < 0 || idx >= signage.contentSettings.length - 1) return; // 最後は下に動かせない
    const arr = [...signage.contentSettings];
    const tmp = arr[idx + 1];
    arr[idx + 1] = { ...arr[idx], order: idx + 1 };
    arr[idx] = { ...tmp, order: idx };
    const reindexed = arr.map((it, i) => ({ ...it, order: i }));
    setSignage({ ...signage, contentSettings: reindexed });
  };

  const handleRemoveGroup = (groupId: string) => {
    if (!signage) return;
    const next = signage.contentSettings
      .filter((cs) => cs.groupId !== groupId)
      .map((cs, i) => ({ ...cs, order: i }));
    setSignage({ ...signage, contentSettings: next });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signage) return;
    setSaving(true);
    setError(null);
    try {
      const body = {
        locationName,
        contentSettings: signage.contentSettings.map((cs) => ({
          groupId: cs.groupId,
          order: cs.order,
        })),
      };
      const res = await fetch(`/api/signages/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`保存に失敗しました (${res.status})`);
      router.push("/signages");
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Spinner size={4} colorClass="text-gray-700" />
        <p className="mt-3 text-gray-600">読み込み中...</p>
      </div>
    );
  }

  if (error) return <p className="text-red-600">エラー: {error}</p>;

  if (!signage)
    return <p className="text-gray-600">サイネージが見つかりません</p>;

  return (
    <main className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">サイネージを編集</h1>
        <Link href="/signages" className="px-3 py-1 bg-gray-200 rounded">
          一覧に戻る
        </Link>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">設置場所名</label>
          <input
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
          <p className="text-sm text-gray-500 mt-1">Key: {signage.uniqueKey}</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            表示グループ（順序は下の順）
          </label>
          <div className="space-y-2">
            {signage.contentSettings.map((cs, index) => (
              <div
                key={cs.groupId}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <div>
                  <div className="font-medium">
                    {cs.group?.name ?? cs.groupId}
                  </div>
                  <div className="text-sm text-gray-500">order: {cs.order}</div>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => handleMoveUp(cs.groupId)}
                      disabled={index === 0}
                      className={`px-2 py-1 rounded text-sm ${index === 0 ? "bg-gray-200 text-gray-500" : "bg-blue-500 text-white"}`}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveDown(cs.groupId)}
                      disabled={index === signage.contentSettings.length - 1}
                      className={`mt-1 px-2 py-1 rounded text-sm ${index === signage.contentSettings.length - 1 ? "bg-gray-200 text-gray-500" : "bg-blue-500 text-white"}`}
                    >
                      ↓
                    </button>
                  </div>

                  <button
                    type="button"
                    className="px-2 py-1 bg-red-600 text-white rounded"
                    onClick={() => handleRemoveGroup(cs.groupId)}
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            グループを追加
          </label>
          <div className="flex gap-2 flex-wrap">
            {groups.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => handleAddGroup(g.id)}
                className="px-3 py-1 bg-gray-200 rounded text-sm"
              >
                {g.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            {saving ? "保存中..." : "保存"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/signages")}
            className="px-4 py-2 bg-gray-200 rounded"
          >
            キャンセル
          </button>
        </div>
      </form>
    </main>
  );
}
