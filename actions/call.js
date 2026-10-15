"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { createStreamClient } from "@/lib/stream";

export const getCallData = async (callId) => {
  const user = await currentUser();
  if (!user) return { error: "Unauthorized" };

  const booking = await db.booking.findUnique({
    where: { streamCallId: callId },
    include: {
      interviewer: {
        select: {
          id: true,
          clerkUserId: true,
          name: true,
          imageUrl: true,
          categories: true,
        },
      },
      interviewee: {
        select: {
          id: true,
          clerkUserId: true,
          name: true,
          imageUrl: true,
        },
      },
    },
  });

  if (!booking) return { error: "Call not found" };

  const isInterviewer = booking.interviewer.clerkUserId === user.id;
  const isInterviewee = booking.interviewee.clerkUserId === user.id;
  if (!isInterviewer && !isInterviewee) return { error: "Forbidden" };

  const streamClient = createStreamClient();

  const token = streamClient.generateUserToken({
    user_id: user.id,
    validity_in_seconds: 60 * 60,
  });

  return {
    token,
    isInterviewer,
    currentUser: {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`.trim(),
      imageUrl: user.imageUrl,
    },
    booking: {
      id: booking.id,
      interviewer: booking.interviewer,
      interviewee: booking.interviewee,
      categories: booking.interviewer.categories,
      startTime: booking.startTime.toISOString(),
      endTime: booking.endTime.toISOString(),
    },
  };
};
