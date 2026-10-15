"use server";

// ─── In-app notification actions ─────────────────────────────────────────────

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

const TAKE = 30;

export const getNotifications = async () => {
  const user = await currentUser();
  if (!user) return [];

  const dbUser = await db.user.findUnique({
    where: { clerkUserId: user.id },
    select: { id: true },
  });
  if (!dbUser) return [];

  const notifications = await db.notification.findMany({
    where: { userId: dbUser.id },
    orderBy: { createdAt: "desc" },
    take: TAKE,
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      link: true,
      readAt: true,
      createdAt: true,
    },
  });

  return notifications.map((n) => ({
    ...n,
    createdAt: n.createdAt.toISOString(),
    readAt: n.readAt ? n.readAt.toISOString() : null,
  }));
};

export const markNotificationRead = async ({ notificationId }) => {
  const user = await currentUser();
  if (!user) return { success: false, error: "Unauthorized" };
  if (!notificationId) return { success: false, error: "Notification required" };

  const dbUser = await db.user.findUnique({
    where: { clerkUserId: user.id },
    select: { id: true },
  });
  if (!dbUser) return { success: false, error: "User not found" };

  await db.notification.updateMany({
    where: { id: notificationId, userId: dbUser.id, readAt: null },
    data: { readAt: new Date() },
  });
  return { success: true };
};

export const markAllNotificationsRead = async () => {
  const user = await currentUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const dbUser = await db.user.findUnique({
    where: { clerkUserId: user.id },
    select: { id: true },
  });
  if (!dbUser) return { success: false, error: "User not found" };

  await db.notification.updateMany({
    where: { userId: dbUser.id, readAt: null },
    data: { readAt: new Date() },
  });
  return { success: true };
};
