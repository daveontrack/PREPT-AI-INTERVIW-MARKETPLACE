"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

export const getInterviewers = async () => {
  const user = await currentUser();

  try {
    const interviewers = await db.user.findMany({
      where: {
        role: "INTERVIEWER",
        // Exclude the logged-in user so an interviewer
        // browsing explore doesn't see themselves
        //return users whose clerkUserId is not equal to the current user's Clerk ID.
        ...(user && { clerkUserId: { not: user.id } }),
      },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        title: true,
        company: true,
        yearsExp: true,
        bio: true,
        categories: true,
        creditRate: true,
        availabilities: {
          where: { isActive: true },
          select: { startTime: true, endTime: true, isActive: true },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return interviewers;
  } catch (err) {
    console.error("getInterviewers error:", err);
    return [];
  }
};
