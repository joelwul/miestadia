"use client";
import TrialBanner from "@/components/billing/TrialBanner";
import SubscriptionGate from "@/components/billing/SubscriptionGate";

export default function AdminSubLayout({ children }: { children: React.ReactNode }) {
  return (
    <SubscriptionGate>
      {children}
      <TrialBanner />
    </SubscriptionGate>
  );
}