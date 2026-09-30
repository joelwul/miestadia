import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    // Verificar autorización
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const now = new Date().toISOString();

    // Buscar tenants activos con suscripción expirada
    const { data: expiredTenants, error } = await supabase
      .from("tenants")
      .select("id, name, slug, subscription_ends_at")
      .eq("subscription_status", "active")
      .lt("subscription_ends_at", now);

    if (error) {
      console.error("Error checking subscriptions:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Actualizar tenants expirados
    let updatedCount = 0;
    if (expiredTenants && expiredTenants.length > 0) {
      for (const tenant of expiredTenants) {
        await supabase
          .from("tenants")
          .update({ subscription_status: "expired" })
          .eq("id", tenant.id);

        console.log(`Tenant ${tenant.id} (${tenant.name}) marcado como expirado`);
        updatedCount++;
      }
    }

    return NextResponse.json({
      message: `Verificación completada. ${updatedCount} tenants expirados.`,
      expired: updatedCount,
      timestamp: now,
    });
  } catch (error: any) {
    console.error("Error en check-subscriptions:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}