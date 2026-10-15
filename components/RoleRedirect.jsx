"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const INTERVIEWER_ONLY = ["/appointments"];
const INTERVIEWEE_ONLY = ["/dashboard"];

export default function RoleRedirect({ role, isAdmin = false }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Admins (e.g. the payout review account) never have an interviewer /
    // interviewee role, so skip onboarding and role-based redirects for them.
    // Route them to the payout review (/payout forwards to the latest
    // request) so signing in lands them there.
    if (isAdmin) {
      if (!pathname.startsWith("/payout")) {
        router.replace("/payout");
      }
      return;
    }

    if (role === "UNASSIGNED" && pathname !== "/onboarding")
      router.replace("/onboarding");
    // Already onboarded users shouldn't be on /onboarding
    if (role === "INTERVIEWER" && pathname.startsWith("/onboarding"))
      router.replace("/dashboard");
    if (role === "INTERVIEWEE" && pathname.startsWith("/onboarding"))
      router.replace("/explore");
    if (
      role === "INTERVIEWER" &&
      INTERVIEWER_ONLY.some((p) => pathname.startsWith(p))
    )
      router.replace("/dashboard");
    if (
      role === "INTERVIEWEE" &&
      INTERVIEWEE_ONLY.some((p) => pathname.startsWith(p))
    )
      router.replace("/appointments");
  }, [role, pathname, router, isAdmin]);

  return null;
}
