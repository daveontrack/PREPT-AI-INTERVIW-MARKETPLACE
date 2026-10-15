"use client";

// In-app notification bell — booking confirmations, session reminders and
// "your report is ready" events. Loads on mount, refreshes when opened, and
// marks items read (individually or all at once).

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/actions/notifications";

const TYPE_ICONS = {
  BOOKING_CONFIRMED: "✅",
  BOOKING_RECEIVED: "📅",
  SESSION_REMINDER: "⏰",
  FEEDBACK_READY: "✨",
};

const timeAgo = (iso) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days < 7 ? `${days}d ago` : new Date(iso).toLocaleDateString();
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(null);
  const wrapRef = useRef(null);
  const router = useRouter();

  const load = () =>
    getNotifications()
      .then((res) => setNotifications(Array.isArray(res) ? res : []))
      .catch(() => setNotifications([]));

  useEffect(() => {
    load();
  }, []);

  // Refresh when the panel opens so new events show up without a reload.
  useEffect(() => {
    if (open) load();
  }, [open]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const unread = (notifications ?? []).filter((n) => !n.readAt).length;

  const onItemClick = async (n) => {
    if (!n.readAt) {
      setNotifications((prev) =>
        (prev ?? []).map((x) =>
          x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x
        )
      );
      markNotificationRead({ notificationId: n.id }).catch(() => {});
    }
    setOpen(false);
    if (n.link) router.push(n.link);
  };

  const markAll = async () => {
    const now = new Date().toISOString();
    setNotifications((prev) =>
      (prev ?? []).map((n) => ({ ...n, readAt: n.readAt ?? now }))
    );
    markAllNotificationsRead().catch(() => {});
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        aria-label={
          unread > 0 ? `Notifications (${unread} unread)` : "Notifications"
        }
      >
        <Bell size={16} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-amber-400 text-[10px] font-semibold text-[#0a0a0b] flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border border-border bg-popover shadow-2xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 bg-popover">
            <p className="text-[10px] font-semibold text-muted-foreground tracking-widest uppercase">
              Notifications
            </p>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAll}
                className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:underline"
              >
                <CheckCheck size={11} />
                Mark all read
              </button>
            )}
          </div>

          {notifications === null ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={16} className="text-amber-400 animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <p className="text-xs text-muted-foreground/60 text-center py-8 px-4">
              No notifications yet — bookings, reminders and AI reports will
              show up here.
            </p>
          ) : (
            <ul>
              {notifications.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => onItemClick(n)}
                    className={`w-full text-left px-4 py-3 flex gap-3 border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors ${
                      !n.readAt ? "bg-amber-400/5" : ""
                    }`}
                  >
                    <span className="text-sm mt-0.5 shrink-0">
                      {TYPE_ICONS[n.type] ?? "🔔"}
                    </span>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span
                        className={`text-xs leading-snug ${
                          !n.readAt
                            ? "text-foreground font-medium"
                            : "text-muted-foreground"
                        }`}
                      >
                        {n.title}
                      </span>
                      {n.body && (
                        <span className="text-[11px] text-muted-foreground/70 leading-snug line-clamp-2">
                          {n.body}
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground/50">
                        {timeAgo(n.createdAt)}
                      </span>
                    </div>
                    {!n.readAt && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5 ml-auto" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
