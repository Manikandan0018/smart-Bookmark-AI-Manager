import React from "react";
import { Bookmark } from "../types";

interface BookmarkCardProps {
  bookmark: Bookmark;
  onDelete: (id: string) => void;
}

export const BookmarkCard: React.FC<BookmarkCardProps> = ({
  bookmark,
  onDelete,
}) => {
  let safeUrl = bookmark.url;
  let domain = bookmark.url;

  try {
    safeUrl = bookmark.url.startsWith("http")
      ? bookmark.url
      : `https://${bookmark.url}`;

    domain = new URL(safeUrl).hostname.replace("www.", "");
  } catch {
    domain = bookmark.url;
  }

  return (
    <div
      className="
        group bg-white rounded-2xl border border-slate-200
        shadow-sm hover:shadow-lg hover:-translate-y-1
        transition-all duration-300 p-5 flex flex-col h-full
      "
    >
      {/* Top Row */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2 overflow-hidden">
          <img
            src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
            alt="favicon"
            className="w-5 h-5 rounded"
          />
          <span className="text-xs font-medium text-slate-500 truncate">
            {domain}
          </span>
        </div>

        <button
          onClick={() => onDelete(bookmark.id)}
          className="
            opacity-0 group-hover:opacity-100
            text-slate-300 hover:text-red-500
            transition-all duration-200 p-1
          "
          title="Delete Bookmark"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>

      {/* Content */}
      <a
        href={safeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <h3
          className="
            text-base font-semibold text-slate-800
            group-hover:text-blue-600 transition-colors
            line-clamp-2 mb-2
          "
        >
          {bookmark.title}
        </h3>

        <p
          className="
            text-sm text-slate-600 line-clamp-3
            leading-relaxed mb-4
          "
        >
          {bookmark.description || "No description available."}
        </p>
      </a>

      {/* Tags */}
      <div className="mt-auto flex flex-wrap gap-2 pt-2">
        {bookmark.tags.map((tag, i) => (
          <span
            key={i}
            className="
              px-2.5 py-1 rounded-lg text-xs
              bg-slate-100 text-slate-600
              group-hover:bg-blue-50 group-hover:text-blue-600
              transition-colors
            "
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
};
