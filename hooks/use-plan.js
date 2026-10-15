/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect } from "react";

import { getMyPlan } from "@/actions/stripe";
import useFetch from "@/hooks/use-fetch";

// User.currentPlan in the database is the source of truth for plan state —
// the Stripe webhook upgrades and downgrades it. `null` means signed out.
const useMyPlan = () => {
  const { data, fn } = useFetch(getMyPlan);

  // fn intentionally omitted — useFetch returns a new reference every render.
  useEffect(() => {
    fn();
  }, []);

  return {
    plan: data ?? null,
    loading: data === undefined,
    refresh: fn,
  };
};

export default useMyPlan;
//hooks folder usually contains reusable custom React hooks.