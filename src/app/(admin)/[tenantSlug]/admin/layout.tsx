"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Sidebar from "@/components/admin/Sidebar";
import TrialBanner from "@/components/billing/TrialBanner";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const [tenantId, setTenantId] = useState("");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadTenant() {
      const { data: tenant } = await supabase
        .from("tenants")
        .select("id")
        .eq("slug", tenantSlug)
        .single();

      if (tenant) {
        setTenantId(tenant.id);
      }
      setLoading(false);
    }
    loadTenant();
  }, [tenantSlug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F766E]"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar tenantSlug={tenantSlug} />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {tenantId && <TrialBanner tenantId={tenantId} />}
          {children}
        </div>
      </div>
    </div>
  );
}