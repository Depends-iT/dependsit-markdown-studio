"use client";

import dynamic from "next/dynamic";

function EditorLoadingState() {
  return (
    <div
      className="flex h-dvh w-full flex-col bg-[#F5F1E8]"
      role="status"
      aria-live="polite"
      aria-label="Loading Markdown Studio"
    >
      <div className="flex h-12 items-center gap-2 border-b border-black/10 bg-white/60 px-3">
        <div className="h-5 w-12 rounded bg-black/10" />
        <div className="h-7 w-7 rounded bg-black/10" />
        <div className="h-7 w-7 rounded bg-black/10" />
        <div className="h-7 w-7 rounded bg-black/10" />
        <div className="ml-auto h-7 w-7 rounded bg-black/10" />
        <div className="h-7 w-7 rounded bg-black/10" />
        <div className="h-7 w-7 rounded bg-black/10" />
      </div>
      <div className="flex flex-1 gap-px bg-black/10">
        <div className="flex-1 space-y-3 bg-[#F5F1E8] p-6">
          <div className="h-4 w-3/4 rounded bg-black/10" />
          <div className="h-4 w-1/2 rounded bg-black/10" />
          <div className="h-4 w-2/3 rounded bg-black/10" />
          <div className="h-4 w-5/6 rounded bg-black/10" />
          <div className="h-4 w-1/3 rounded bg-black/10" />
        </div>
        <div className="flex-1 space-y-3 bg-white/40 p-6">
          <div className="h-4 w-3/4 rounded bg-black/10" />
          <div className="h-4 w-2/3 rounded bg-black/10" />
          <div className="h-4 w-1/2 rounded bg-black/10" />
          <div className="h-4 w-5/6 rounded bg-black/10" />
        </div>
      </div>
      <div className="flex h-7 items-center gap-3 border-t border-black/10 bg-white/60 px-3">
        <div className="h-3 w-12 rounded bg-black/10" />
        <div className="ml-auto h-3 w-20 rounded bg-black/10" />
      </div>
      <span className="sr-only">Loading Markdown Studio editor…</span>
    </div>
  );
}

const MarkdownStudio = dynamic(() => import("@/md-studio/MarkdownStudio"), {
  ssr: false,
  loading: () => <EditorLoadingState />,
});

export default function StudioClient() {
  return <MarkdownStudio />;
}
