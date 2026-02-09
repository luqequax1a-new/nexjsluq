"use client";

import { CropEditorView } from "@/components/admin/media/CropEditorView";
import { useParams, useRouter } from "next/navigation";

export default function MediaEditorPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const mediaId = Number(params?.id);

  return (
    <div style={{ height: "100vh", background: "#0b1220" }}>
      <CropEditorView
        mediaId={mediaId}
        onClose={() => {
          router.back();
        }}
      />
    </div>
  );
}

