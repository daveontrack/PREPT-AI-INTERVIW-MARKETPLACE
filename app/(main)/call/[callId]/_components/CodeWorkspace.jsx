"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import CollabEditor from "@/components/CollabEditor";
import { getSharedCode } from "@/actions/codeEditor";

// Loads the last shared-code snapshot for the booking, then hands it to the
// collaborative editor. Mounts only while the "Code" view is active in the
// call room, so the Yjs doc + websocket live exactly as long as the view.
export default function CodeWorkspace({ booking, user, onSave }) {
  const [snapshot, setSnapshot] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getSharedCode({ bookingId: booking.id })
      .then((res) => {
        if (cancelled) return;
        setSnapshot({
          code: res?.code ?? "",
          language: res?.language ?? "javascript",
        });
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load shared code:", err);
        // Fall back to an empty local document — editing still works and the
        // autosave path will surface any persistence failure in the toolbar.
        setSnapshot({ code: "", language: "javascript" });
      });
    return () => {
      cancelled = true;
    };
  }, [booking.id]);

  if (!snapshot) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center bg-[#0f0f11]">
        <Loader2 size={22} className="text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <CollabEditor
      roomName={`booking_${booking.id}`}
      initialCode={snapshot.code}
      language={snapshot.language}
      user={user}
      onSave={onSave}
      className="flex-1 min-h-0"
    />
  );
}
