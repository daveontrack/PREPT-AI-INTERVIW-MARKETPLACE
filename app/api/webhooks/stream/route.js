// // app/api/webhooks/stream/route.js
// import { db } from "@/lib/prisma";
// import { createStreamClient } from "@/lib/stream";
// import {
//   generateFeedback,
//   parseTranscript,
//   saveFeedbackForBooking,
// } from "@/lib/feedback";

// export async function POST(request) {
//   // Verify the request actually came from Stream before trusting it.
//   // The HMAC-SHA256 signature is computed over the raw (unparsed) body,
//   // so verification must happen before JSON.parse.
//   const rawBody = await request.text();
//   const signature = request.headers.get("x-signature");

//   const streamClient = createStreamClient();

//   if (!signature || !streamClient.verifyWebhook(rawBody, signature)) {
//     console.warn(
//       "[stream-webhook] ✗ Signature verification failed — rejecting webhook"
//     );
//     return Response.json({ ok: false }, { status: 401 });
//   }

//   let body;
//   try {
//     body = JSON.parse(rawBody);
//   } catch {
//     console.warn("[stream-webhook] ✗ Invalid JSON body — rejecting");
//     return Response.json({ ok: false }, { status: 400 });
//   }
//   const eventType = body.type;

//   console.log(`\n[stream-webhook] ← Received event: ${eventType}`);

//   if (
//     eventType !== "call.transcription_ready" &&
//     eventType !== "call.recording_ready"
//   ) {
//     console.log(`[stream-webhook] Ignoring event type: ${eventType}`);
//     return Response.json({ ok: true });
//   }

//   // call_cid arrives as "default:mock_123_abc" — we stored just "mock_123_abc"
//   const callCid = body.call_cid ?? "";
//   const streamCallId = callCid.includes(":") ? callCid.split(":")[1] : callCid;
//   console.log(
//     `[stream-webhook] call_cid: ${callCid} → streamCallId: ${streamCallId}`
//   );

//   if (!streamCallId) {
//     console.log(`[stream-webhook] No streamCallId found, skipping`);
//     return Response.json({ ok: true });
//   }

//   try {
//     console.log(`[stream-webhook] Looking up booking in DB...`);
//     const booking = await db.booking.findUnique({
//       where: { streamCallId },
//       include: {
//         interviewer: {
//           select: { id: true, clerkUserId: true, name: true, categories: true },
//         },
//         interviewee: {
//           select: { id: true, clerkUserId: true, name: true },
//         },
//         feedback: { select: { id: true } },
//       },
//     });

//     if (!booking) {
//       console.log(
//         `[stream-webhook] No booking found for streamCallId: ${streamCallId}`
//       );
//       return Response.json({ ok: true });
//     }

//     console.log(
//       `[stream-webhook] Booking found: ${booking.id} | interviewer: ${booking.interviewer.name} | interviewee: ${booking.interviewee.name}`
//     );

//     // ── Recording ready ───────────────────────────────────────────────────────
//     if (eventType === "call.recording_ready") {
//       const recordingUrl = body.call_recording?.url;

//       if (!recordingUrl) {
//         console.log(
//           `[stream-webhook] call.recording_ready received but no URL in payload`
//         );
//         return Response.json({ ok: true });
//       }

//       console.log(`[stream-webhook] Saving recording URL to booking...`);
//       await db.booking.update({
//         where: { id: booking.id },
//         data: { recordingUrl },
//       });

//       console.log(
//         `[stream-webhook] ✓ Recording URL saved for booking ${booking.id}`
//       );
//       return Response.json({ ok: true });
//     }

//     // ── Transcription ready ───────────────────────────────────────────────────
//     if (eventType === "call.transcription_ready") {
//       // Outer guard — catches sequential retries
//       if (booking.feedback) {
//         console.log(
//           `[stream-webhook] Feedback already exists for booking ${booking.id}, skipping duplicate webhook`
//         );
//         return Response.json({ ok: true });
//       }

//       const transcriptUrl = body.call_transcription?.url;
//       if (!transcriptUrl) {
//         console.log(
//           `[stream-webhook] call.transcription_ready received but no transcript URL in payload`
//         );
//         return Response.json({ ok: true });
//       }

//       // 1. Download JSONL from Stream CDN
//       console.log(`[stream-webhook] Downloading transcript from Stream CDN...`);
//       const transcriptRes = await fetch(transcriptUrl);
//       const transcriptText = await transcriptRes.text();
//       console.log(
//         `[stream-webhook] Transcript downloaded (${transcriptText.length} chars)`
//       );

//       // 2. Parse JSONL into readable conversation
//       console.log(`[stream-webhook] Parsing JSONL transcript...`);
//       const speakerMap = {
//         [booking.interviewer.clerkUserId]:
//           booking.interviewer.name ?? "Interviewer",
//         [booking.interviewee.clerkUserId]:
//           booking.interviewee.name ?? "Interviewee",
//       };

//       const transcript = parseTranscript(transcriptText, speakerMap);
//       if (!transcript) {
//         console.log(
//           `[stream-webhook] No speech segments found in transcript, skipping`
//         );
//         return Response.json({ ok: true });
//       }

//       console.log(
//         `[stream-webhook] Transcript preview:\n${transcript.slice(0, 300)}${
//           transcript.length > 300 ? "..." : ""
//         }`
//       );

//       // 3. Generate feedback via Gemini
//       console.log(`[stream-webhook] Sending transcript to Gemini...`);
//       const feedbackData = await generateFeedback(
//         transcript,
//         booking.interviewer,
//         booking.interviewee
//       );
//       console.log(
//         `[stream-webhook] Feedback parsed — overallRating: ${feedbackData.overallRating} | recommendation: ${feedbackData.recommendation}`
//       );

//       // 4. Write to DB — upsert handles concurrent webhook retries cleanly (no P2002)
//       console.log(`[stream-webhook] Writing feedback to DB...`);
//       await saveFeedbackForBooking(booking, feedbackData);
//       console.log(
//         `[stream-webhook] Feedback upserted + booking marked COMPLETED`
//       );

//       console.log(`[stream-webhook] ✓ All done for booking ${booking.id}`);
//     }

//     return Response.json({ ok: true });
//   } catch (err) {
//     console.error(`[stream-webhook] ✗ ${eventType} error:`, err);
//     // Always 200 — non-2xx triggers Stream retries, making the race worse
//     return Response.json({ ok: true });
//   }
// }
// app/api/webhooks/stream/route.js
import { db } from "@/lib/prisma";
import { createStreamClient } from "@/lib/stream";
import {
  buildParticipationNote,
  generateFeedback,
  parseTranscript,
  parseTranscriptLines,
  saveFeedbackForBooking,
} from "@/lib/feedback";

export async function POST(request) {
  // Verify the request actually came from Stream before trusting it.
  // The HMAC-SHA256 signature is computed over the raw (unparsed) body,
  // so verification must happen before JSON.parse.
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");

  const streamClient = createStreamClient();
  //“Signature verification is a security check in 
  // my Stream webhook handler. It verifies that the 
  // incoming webhook has a valid signature before 
  // my application processes the event. 
  // If the signature is missing or invalid, the 
  // request is rejected.”
  if (!signature || !streamClient.verifyWebhook(rawBody, signature)) {
    console.warn(
      "[stream-webhook] ✗ Signature verification failed — rejecting webhook"
    );
    return Response.json({ ok: false }, { status: 401 });
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    console.warn("[stream-webhook] ✗ Invalid JSON body — rejecting");
    return Response.json({ ok: false }, { status: 400 });
  }
  const eventType = body.type;

  console.log(`\n[stream-webhook] ← Received event: ${eventType}`);

  if (
    eventType !== "call.transcription_ready" &&
    eventType !== "call.recording_ready"
  ) {
    console.log(`[stream-webhook] Ignoring event type: ${eventType}`);
    return Response.json({ ok: true });
  }

  // call_cid arrives as "default:mock_123_abc" — we stored just "mock_123_abc"
  const callCid = body.call_cid ?? "";
  const streamCallId = callCid.includes(":") ? callCid.split(":")[1] : callCid;
  console.log(
    `[stream-webhook] call_cid: ${callCid} → streamCallId: ${streamCallId}`
  );

  if (!streamCallId) {
    console.log(`[stream-webhook] No streamCallId found, skipping`);
    return Response.json({ ok: true });
  }

  try {
    console.log(`[stream-webhook] Looking up booking in DB...`);
    const booking = await db.booking.findUnique({
      where: { streamCallId },
      include: {
        interviewer: {
          select: { id: true, clerkUserId: true, name: true, categories: true },
        },
        interviewee: {
          select: { id: true, clerkUserId: true, name: true },
        },
        feedback: { select: { id: true } },
      },
    });

    if (!booking) {
      console.log(
        `[stream-webhook] No booking found for streamCallId: ${streamCallId}`
      );
      return Response.json({ ok: true });
    }

    console.log(
      `[stream-webhook] Booking found: ${booking.id} | interviewer: ${booking.interviewer.name} | interviewee: ${booking.interviewee.name}`
    );

    // ── Recording ready ───────────────────────────────────────────────────────
    if (eventType === "call.recording_ready") {
      const recordingUrl = body.call_recording?.url;

      if (!recordingUrl) {
        console.log(
          `[stream-webhook] call.recording_ready received but no URL in payload`
        );
        return Response.json({ ok: true });
      }

      console.log(`[stream-webhook] Saving recording URL to booking...`);
      await db.booking.update({
        where: { id: booking.id },
        data: { recordingUrl },
      });

      console.log(
        `[stream-webhook] ✓ Recording URL saved for booking ${booking.id}`
      );
      return Response.json({ ok: true });
    }

    // ── Transcription ready ───────────────────────────────────────────────────
    if (eventType === "call.transcription_ready") {
      // Outer guard — catches sequential retries
      if (booking.feedback) {
        console.log(
          `[stream-webhook] Feedback already exists for booking ${booking.id}, skipping duplicate webhook`
        );
        return Response.json({ ok: true });
      }

      const transcriptUrl = body.call_transcription?.url;
      if (!transcriptUrl) {
        console.log(
          `[stream-webhook] call.transcription_ready received but no transcript URL in payload`
        );
        return Response.json({ ok: true });
      }

      // 1. Download JSONL from Stream CDN
      console.log(`[stream-webhook] Downloading transcript from Stream CDN...`);
      const transcriptRes = await fetch(transcriptUrl);
      const transcriptText = await transcriptRes.text();
      console.log(
        `[stream-webhook] Transcript downloaded (${transcriptText.length} chars)`
      );

      // 2. Parse JSONL into readable conversation
      console.log(`[stream-webhook] Parsing JSONL transcript...`);
      const speakerMap = {
        [booking.interviewer.clerkUserId]:
          booking.interviewer.name ?? "Interviewer",
        [booking.interviewee.clerkUserId]:
          booking.interviewee.name ?? "Interviewee",
      };

      const transcript = parseTranscript(transcriptText, speakerMap);
      if (!transcript) {
        console.log(
          `[stream-webhook] No speech segments found in transcript, skipping`
        );
        return Response.json({ ok: true });
      }

      console.log(
        `[stream-webhook] Transcript preview:\n${transcript.slice(0, 300)}${transcript.length > 300 ? "..." : ""
        }`
      );

      // 3. Generate feedback via Gemini
      console.log(`[stream-webhook] Sending transcript to Gemini...`);
      const participationNote = buildParticipationNote(
        parseTranscriptLines(transcriptText),
        booking.interviewee.clerkUserId,
        booking.interviewee.name
      );
      const feedbackData = await generateFeedback(
        transcript,
        booking.interviewer,
        booking.interviewee,
        participationNote
      );
      console.log(
        `[stream-webhook] Feedback parsed — overallRating: ${feedbackData.overallRating} | recommendation: ${feedbackData.recommendation}`
      );

      // 4. Write to DB — upsert handles concurrent webhook retries cleanly (no P2002)
      console.log(`[stream-webhook] Writing feedback to DB...`);
      await saveFeedbackForBooking(booking, feedbackData);
      console.log(
        `[stream-webhook] Feedback upserted + booking marked COMPLETED`
      );

      console.log(`[stream-webhook] ✓ All done for booking ${booking.id}`);
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error(`[stream-webhook] ✗ ${eventType} error:`, err);
    // Always 200 — non-2xx triggers Stream retries, making the race worse
    return Response.json({ ok: true });
  }
}
