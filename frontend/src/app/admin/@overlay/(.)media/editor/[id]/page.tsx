"use client";

import { CropEditorView } from "@/components/admin/media/CropEditorView";
import { useParams, useRouter } from "next/navigation";

export default function AdminMediaEditorOverlayPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const mediaId = Number(params?.id);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#0b1220",
      }}
    >
      <CropEditorView
        mediaId={mediaId}
        onClose={() => {
          router.back();
        }}
      />
    </div>
  );
}

