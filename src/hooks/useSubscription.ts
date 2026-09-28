"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Subscription {
  status: "trial" | "active" | "expired" | "cancelled";
  plan: "monthly" | "yearly" | null;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  days_left: number;
  is_blocked: boolean;
}

export function useSubscription(tenantId: string | null) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      if (!tenantId) return;

      const { data: tenant } = await supabase
        .from("tenants")
        .select("subscription_status, subscription_plan, trial_ends_at, subscription_ends_at")
        .eq("id", tenantId)
        .single();

      if (tenant) {
        const status = tenant.subscription_status || "trial";
        const trialEnds = tenant.trial_ends_at ? new Date(tenant.trial_ends_at) : null;
        const subEnds = tenant.subscription_ends_at ? new Date(tenant.subscription_ends_at) : null;
        const now = new Date();

        let daysLeft = 30;
        let isBlocked = false;

        if (status === "trial" && trialEnds) {
          daysLeft = Math.ceil((trialEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          isBlocked = daysLeft <= 0;
        } else if (status === "active" && subEnds) {
          daysLeft = Math.ceil((subEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          isBlocked = daysLeft <= 0;
        } else if (status === "expired" || status === "cancelled") {
          isBlocked = true;
          daysLeft = 0;
        }

        setSubscription({
          status,
          plan: tenant.subscription_plan,
          trial_ends_at: tenant.trial_ends_at,
          subscription_ends_at: tenant.subscription_ends_at,
          days_left: daysLeft,
          is_blocked,
        });
      }
    }
    load();
  }, [tenantId]);

  return subscription;
}