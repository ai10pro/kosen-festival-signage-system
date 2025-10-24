"use client";

import React from "react";

export default function Spinner({
  size = 4,
  colorClass = "text-white",
  ariaLabel = "読み込み中",
}: {
  size?: number; // rem
  colorClass?: string;
  ariaLabel?: string;
}) {
  const s = size;
  return (
    <svg
      role="img"
      aria-label={ariaLabel}
      className={`animate-spin ${colorClass}`}
      style={{ width: `${s}rem`, height: `${s}rem` }}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      ></path>
    </svg>
  );
}
