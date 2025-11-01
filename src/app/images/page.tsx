"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Spinner from "@/components/Spinner";
import Image from "next/image";

export default function ImageListPage() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchImages = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/images");
      const data = await res.json();

      if (data.success) {
        // // 画像をcontentIdでソート後，order順に並び替え
        // const sortedImages = data.payload.sort((a, b) => {
        //   if (a.contentId === b.contentId) {
        //     return a.order - b.order;
        //   }
        //   return a.contentId.localeCompare(b.contentId);
        // });
        setImages(data.payload);
      } else {
        setError(data.message);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  return (
    <main className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">画像一覧</h1>
        <Link
          href="/images/upload"
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          画像をアップロード
        </Link>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Spinner colorClass="text-gray-700" size={3} />
          <p className="mt-3 text-gray-600">読み込み中...</p>
        </div>
      )}
      {error && <p className="text-red-600">エラー: {error}</p>}

      <ul className="space-y-2">
        {images.map((image: any) => (
          <li
            key={image.id}
            className="flex items-center justify-between p-3 border rounded"
          >
            <div>
              <p className="font-medium">Content ID: {image.contentId}</p>
              <p className="text-sm text-gray-500">ID: {image.id}</p>
              <p className="text-sm text-gray-500">Order: {image.order}</p>
            </div>
            <div className="space-x-2">
              <Image
                src={image.storageUrl}
                alt={`Image ${image.id}`}
                width={150}
                height={100}
                className="rounded"
              />
            </div>
            <div className="space-x-2">
              <Link
                href={`/images/edit/${image.id}`}
                className="px-3 py-1 bg-yellow-400 rounded"
              >
                編集
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
