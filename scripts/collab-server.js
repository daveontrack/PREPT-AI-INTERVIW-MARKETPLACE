// ─── Yjs collaboration server ────────────────────────────────────────────────
// Backend for the live code editor (components/CollabEditor.jsx). Run it as a
// separate process next to the Next.js app:
//
//   npm run collab
//
// The client connects to it using NEXT_PUBLIC_COLLAB_WS_URL (defaults to
// ws://localhost:1234 on your machine). Override HOST / PORT to change the
// bind address, e.g. PORT=1234 HOST=0.0.0.0 npm run collab.
//
// Room state is kept in memory — the app itself persists the final document
// on the Booking row (actions/codeEditor.js), so restarts are harmless: the
// next client to open the room re-seeds it from that snapshot.

process.env.HOST = process.env.HOST || "0.0.0.0";
process.env.PORT = process.env.PORT || "1234";

// @y/websocket-server is ESM-only and starts listening on import.
import("@y/websocket-server/server").catch((err) => {
  console.error("[collab] failed to start websocket server:", err);
  process.exit(1);
});
