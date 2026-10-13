"use client";
import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";

interface UnitPhoto {
  id: string;
  image_url: string;
  order_index: number;
  is_primary: boolean;
}

interface Props {
  unitId: string;
  existingPhotos: UnitPhoto[];
  onPhotosUpdate: (photos: UnitPhoto[]) => void;
}

export default function UnitPhotoUpload({ unitId, existingPhotos, onPhotosUpdate }: Props) {
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState<UnitPhoto[]>(existingPhotos || []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const file = files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${unitId}/${Date.now()}.${fileExt}`;

      // Upload a Storage
      const { error: uploadError } = await supabase.storage
        .from("unit-photos")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage.from("unit-photos").getPublicUrl(fileName);
      const imageUrl = data.publicUrl;

      // Save to database
      const { data: photoData, error: dbError } = await supabase
        .from("unit_photos")
        .insert({
          unit_id: unitId,
          image_url: imageUrl,
          order_index: photos.length,
          is_primary: photos.length === 0,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setPhotos([...photos, photoData]);
      onPhotosUpdate([...photos, photoData]);
    } catch (err: any) {
      alert("Error al subir la foto: " + err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (photoId: string, imageUrl: string) => {
    if (!confirm("¿Eliminar esta foto?")) return;

    try {
      // Delete from storage
      const fileName = imageUrl.split("/").pop();
      if (fileName) {
        await supabase.storage.from("unit-photos").remove([`${unitId}/${fileName}`]);
      }

      // Delete from database
      await supabase.from("unit_photos").delete().eq("id", photoId);

      const updatedPhotos = photos.filter((p) => p.id !== photoId);
      setPhotos(updatedPhotos);
      onPhotosUpdate(updatedPhotos);
    } catch (err: any) {
      alert("Error al eliminar: " + err.message);
    }
  };

  const handleSetPrimary = async (photoId: string) => {
    try {
      // Unset all as primary
      await supabase.from("unit_photos").update({ is_primary: false }).eq("unit_id", unitId);

      // Set this as primary
      await supabase.from("unit_photos").update({ is_primary: true }).eq("id", photoId);

      const updatedPhotos = photos.map((p) => ({
        ...p,
        is_primary: p.id === photoId,
      }));

      setPhotos(updatedPhotos);
      onPhotosUpdate(updatedPhotos);
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const primaryPhoto = photos.find((p) => p.is_primary);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Fotos de la unidad</h3>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="photo-upload"
          />
          <label
            htmlFor="photo-upload"
            className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? "Subiendo..." : "Subir foto"}
          </label>
        </div>
      </div>

      {photos.length === 0 ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-600">No hay fotos cargadas</p>
          <p className="text-xs text-gray-500 mt-1">Subí la primera foto para mostrar la unidad</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {photos.map((photo, index) => (
            <div key={photo.id} className="relative group">
              <img
                src={photo.image_url}
                alt={`Foto ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border border-gray-200"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                {!photo.is_primary && (
                  <button
                    onClick={() => handleSetPrimary(photo.id)}
                    className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                    title="Marcar como principal"
                  >
                    Principal
                  </button>
                )}
                <button
                  onClick={() => handleDelete(photo.id, photo.image_url)}
                  className="p-1 bg-red-600 text-white rounded hover:bg-red-700"
                  title="Eliminar"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              {photo.is_primary && (
                <div className="absolute top-2 left-2 px-2 py-1 bg-green-600 text-white text-xs rounded">
                  ✓ Principal
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}