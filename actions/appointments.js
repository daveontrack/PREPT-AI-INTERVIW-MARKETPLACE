"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

export const getIntervieweeAppointments = async () => {
  const user = await currentUser();
  if (!user) return [];

  const dbUser = await db.user.findUnique({ where: { clerkUserId: user.id } });
  if (!dbUser) return [];

  return db.booking.findMany({
    where: { intervieweeId: dbUser.id },
    include: {
      interviewer: {
        select: {
          name: true,
          imageUrl: true,
          email: true,
          title: true,
          company: true,
          categories: true,
        },
      },
      feedback: true,
    },
    orderBy: { startTime: "desc" },
  });
};
