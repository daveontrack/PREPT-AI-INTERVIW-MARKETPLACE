"use client";

import { useEffect, useCallback, useState } from "react";

// Stream Video
import {
  StreamTheme,
  SpeakerLayout,
  useCallStateHooks,
  useCall,
  CallingState,
  CallControls,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";

// Stream Chat
import {
  Chat,
  Channel,
  MessageList,
  MessageComposer,
  Window,
  useCreateChatClient,
} from "stream-chat-react";
import "stream-chat-react/dist/css/index.css";

import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Sparkles,
  Loader2,
  Code2,
  Video,
  Hand,
} from "lucide-react";
import AIQuestionsPanel from "./AIQuestions";
import SignLanguagePanel from "@/components/sign-language/SignLanguagePanel";
import CodeWorkspace from "./CodeWorkspace";
import { saveSharedCode } from "@/actions/codeEditor";

// ─── Call UI (inside StreamCall context) ─────────────────────────────────────

export default function CallUI({
  callId,
  isInterviewer,
  booking,
  onLeave,
  apiKey,
  token,
  currentUser,
}) {
  const { useCallCallingState } = useCallStateHooks();
  const call = useCall();
  const callingState = useCallCallingState();

  const [activeTab, setActiveTab] = useState("chat");
  // "interview" = video + side panel, "code" = collaborative editor + side
  // panel (with a compact video tab so both participants stay on screen).
  const [view, setView] = useState("interview");

  const changeView = (next) => {
    if (next === view) return;
    setView(next);
    setActiveTab((tab) =>
      next === "interview"
        ? tab === "video"
          ? "chat"
          : tab
        : tab === "chat"
          ? "video"
          : tab
    );
  };

  // Persisted by CollabEditor (debounced + on leave) so the code survives the
  // call and both parties can review it from their appointments afterwards.
  const handleSaveSnapshot = useCallback(
    ({ code, language }) =>
      saveSharedCode({ bookingId: booking.id, code, language }),
    [booking.id]
  );

  // Auto-stop recording before leaving
  const handleLeave = useCallback(async () => {
    try {
      if (call) {
        const isRecording = call.state?.recording;
        if (isRecording) {
          await call.stopRecording().catch(() => {});
        }
        await call.leave().catch(() => {});
      }
    } finally {
      onLeave();
    }
  }, [call, onLeave]);

  // ── Chat client — same token works for both Video + Chat SDKs ──
  const chatClient = useCreateChatClient({
    apiKey,
    tokenOrProvider: token,
    userData: {
      id: currentUser.id,
      name: currentUser.name,
      image: currentUser.imageUrl,
    },
  });

  const [chatChannel, setChatChannel] = useState(null);

  useEffect(() => {
    if (!chatClient) return;

    const channel = chatClient.channel("messaging", callId, {
      name: "Interview Chat",
      members: [
        booking.interviewer.clerkUserId,
        booking.interviewee.clerkUserId,
      ],
    });

    channel
      .watch()
      .then(() => setChatChannel(channel))
      .catch(console.error);

    return () => {
      channel.stopWatching().catch(() => {});
    };
  }, [chatClient, callId, booking]);

  if (callingState === CallingState.LEFT) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <p className="text-muted-foreground text-sm">Leaving call…</p>
      </div>
    );
  }

  return (
    <div className="min-h-[92vh] bg-background flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-border text-muted-foreground text-xs"
          >
            {booking.interviewer.name}
            <span className="text-muted-foreground/50 mx-1.5">×</span>
            {booking.interviewee.name}
          </Badge>
          {isInterviewer && (
            <Badge
              variant="outline"
              className="border-amber-400/20 bg-amber-400/5 text-amber-400 text-xs"
            >
              Interviewer
            </Badge>
          )}
        </div>

        {/* View switcher: video interview ↔ collaborative code editor */}
        <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-[#141417] p-1 shrink-0">
          <button
            type="button"
            onClick={() => changeView("interview")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              view === "interview"
                ? "bg-amber-400/15 text-amber-400"
                : "text-stone-500 hover:text-stone-300"
            }`}
          >
            <Video size={13} />
            Interview
          </button>
          <button
            type="button"
            onClick={() => changeView("code")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              view === "code"
                ? "bg-amber-400/15 text-amber-400"
                : "text-stone-500 hover:text-stone-300"
            }`}
          >
            <Code2 size={13} />
            Code
          </button>
        </div>
      </div>

      {/* Body: main area + side panel */}
      <div className="flex flex-1 min-h-0">
        {view === "interview" ? (
          // ── LEFT: Video ──
          <div className="flex flex-col flex-1 min-w-0">
            <StreamTheme>
              <SpeakerLayout participantBarPosition="bottom" />
              <CallControls onLeave={handleLeave} />
            </StreamTheme>
          </div>
        ) : (
          // ── LEFT: Collaborative code editor ──
          <div className="flex-1 min-w-0 min-h-0 flex flex-col border-r border-border">
            <CodeWorkspace
              booking={booking}
              user={currentUser}
              onSave={handleSaveSnapshot}
            />
          </div>
        )}

        {/* ── RIGHT: Chat / AI panel ── */}
        <div className="w-85 shrink-0 flex flex-col border-l border-border bg-background">
          {/* Tab switcher */}
          <div className="flex border-b border-border shrink-0">
            {/* Video tab — only meaningful while the editor takes the main
                area, so both participants stay on screen while coding */}
            {view === "code" && (
              <button
                type="button"
                onClick={() => setActiveTab("video")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium transition-colors ${
                  activeTab === "video"
                    ? "text-amber-400 border-b-2 border-amber-400"
                    : "text-muted-foreground hover:text-stone-300"
                }`}
              >
                <Video size={13} />
                Video
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab("chat")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium transition-colors ${
                activeTab === "chat"
                  ? "text-amber-400 border-b-2 border-amber-400"
                  : "text-muted-foreground hover:text-stone-300"
              }`}
            >
              <MessageSquare size={13} />
              Chat
            </button>

            {/* AI Questions tab — interviewer only */}
            {isInterviewer && (
              <button
                type="button"
                onClick={() => setActiveTab("ai")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium transition-colors ${
                  activeTab === "ai"
                    ? "text-amber-400 border-b-2 border-amber-400"
                    : "text-muted-foreground hover:text-stone-300"
                }`}
              >
                <Sparkles size={13} />
                AI Questions
              </button>
            )}

            {/* Sign language — candidate controls, interviewer sees the
                confirmed transcript (experimental EthSL assistance) */}
            <button
              type="button"
              onClick={() => setActiveTab("sign")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium transition-colors ${
                activeTab === "sign"
                  ? "text-amber-400 border-b-2 border-amber-400"
                  : "text-muted-foreground hover:text-stone-300"
              }`}
            >
              <Hand size={13} />
              Sign
            </button>
          </div>

          {/* Panel content */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {activeTab === "video" ? (
              <div className="h-full flex flex-col">
                <div className="flex-1 min-h-0">
                  <StreamTheme>
                    <SpeakerLayout participantBarPosition="bottom" />
                  </StreamTheme>
                </div>
                <div className="p-2 border-t border-border shrink-0">
                  <StreamTheme>
                    <CallControls onLeave={handleLeave} />
                  </StreamTheme>
                </div>
              </div>
            ) : activeTab === "chat" ? (
              chatClient && chatChannel ? (
                <Chat client={chatClient} theme="str-chat__theme-dark">
                  <Channel channel={chatChannel}>
                    <Window>
                      <MessageList />
                      <MessageComposer />
                    </Window>
                  </Channel>
                </Chat>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Loader2 size={18} className="text-stone-600 animate-spin" />
                </div>
              )
            ) : activeTab === "sign" ? (
              <div className="h-full overflow-hidden p-3">
                <SignLanguagePanel
                  booking={booking}
                  isInterviewer={isInterviewer}
                />
              </div>
            ) : (
              <div className="p-4 h-full overflow-y-scroll max-h-screen">
                <AIQuestionsPanel categories={booking.categories} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
