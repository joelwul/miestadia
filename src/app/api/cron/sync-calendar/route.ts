import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Obtener todas las sincronizaciones activas
    const { data: syncs, error } = await supabase
      .from("calendar_sync")
      .select("id, external_url, last_sync_at, sync_frequency")
      .eq("sync_type", "import")
      .eq("is_active", true);

    if (error) {
      console.error("Error obteniendo syncs:", error);
      return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }

    const now = new Date();
    let syncedCount = 0;

    for (const sync of syncs || []) {
      // Verificar si ya pasó el tiempo de frecuencia
      if (sync.last_sync_at) {
        const lastSync = new Date(sync.last_sync_at);
        const hoursSinceLastSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastSync < sync.sync_frequency) {
          continue; // Aún no es tiempo
        }
      }

      // Ejecutar la sincronización
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "https://miestadia.online"}/api/ical/import`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ syncId: sync.id }),
        });

        if (response.ok) {
          syncedCount++;
        } else {
          console.error(`Error sync ${sync.id}:`, await response.text());
        }
      } catch (err) {
        console.error(`Error sync ${sync.id}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sincronización automática completada. ${syncedCount} calendarios sincronizados.`,
    });
  } catch (error: any) {
    console.error("Error en cron sync:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
} 