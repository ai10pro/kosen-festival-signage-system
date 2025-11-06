"use client";
import dummyData from "@/app/_mocks/dummyData";
import Image from "next/image";

const Signage: React.FC = () => {
  const content = dummyData[0]; // モックデータから最初のコンテンツを取得

  return (
    <div className="border border-slate-400 p-3 h-screen">
      <div className="flex h-full">
        <div className="w-1/4 flex flex-col h-full">
          <div className="h-1/4 flex items-center justify-center">
            {new Date().toLocaleTimeString()}
          </div>
          <div className="h-2/3 flex items-center justify-center">
            <p>Schedule</p>
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