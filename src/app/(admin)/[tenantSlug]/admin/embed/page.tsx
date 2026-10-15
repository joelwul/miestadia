"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { Copy, CheckCircle, Code, Monitor, Smartphone } from "lucide-react";

export default function EmbedPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const [copiedButton, setCopiedButton] = useState(false);
  const [copiedFull, setCopiedFull] = useState(false);

  const baseUrl = `https://miestadia.online/embed/${tenantSlug}`;

  // Versión 1: Botón + Modal
  const buttonCode = `<!-- Mi Estadía - Botón de Reserva -->
<div id="mi-estadia-widget" data-slug="${tenantSlug}"></div>
<script>
(function() {
  const container = document.getElementById('mi-estadia-widget');
  const slug = container.dataset.slug;
  const iframe = document.createElement('iframe');
  iframe.src = 'https://miestadia.online/embed/' + slug;
  iframe.style.cssText = 'width:100%;height:600px;border:none;border-radius:12px;';
  iframe.setAttribute('loading', 'lazy');
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups');
  
  // Crear botón que abre modal
  const btn = document.createElement('button');
  btn.textContent = '📅 Reservar ahora';
  btn.style.cssText = 'background:#059669;color:white;padding:14px 32px;border:none;border-radius:8px;font-size:16px;font-weight:bold;cursor:pointer;';
  btn.onclick = function() {
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;';
    const content = document.createElement('div');
    content.style.cssText = 'background:white;border-radius:12px;max-width:800px;width:100%;max-height:90vh;overflow:hidden;position:relative;';
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = 'position:absolute;top:10px;right:10px;background:white;border:none;font-size:24px;cursor:pointer;z-index:10;width:36px;height:36px;border-radius:50%;';
    closeBtn.onclick = function() { document.body.removeChild(modal); };
    content.appendChild(closeBtn);
    content.appendChild(iframe.cloneNode(true));
    modal.appendChild(content);
    modal.onclick = function(e) { if (e.target === modal) document.body.removeChild(modal); };
    document.body.appendChild(modal);
  };
  container.appendChild(btn);
})();
</script>`;

  // Versión 2: Full Page (iframe directo)
  const fullCode = `<!-- Mi Estadía - Reservador Completo -->
<iframe 
  src="${baseUrl}" 
  style="width:100%;height:700px;border:none;border-radius:12px;"
  loading="lazy"
  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
  title="Reservador ${tenantSlug}"
></iframe>`;

  function copyToClipboard(text: string, type: "button" | "full") {
    navigator.clipboard.writeText(text).then(() => {
      if (type === "button") {
        setCopiedButton(true);
        setTimeout(() => setCopiedButton(false), 2000);
      } else {
        setCopiedFull(true);
        setTimeout(() => setCopiedFull(false), 2000);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Código para tu web</h1>
        <p className="text-gray-500 mt-1">Copiá y pegá este código en tu sitio web para embeber el reservador</p>
      </div>

      {/* Versión 1: Botón + Modal */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
            <Smartphone className="h-6 w-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">Versión Compacta: Botón + Modal</h2>
            <p className="text-sm text-gray-600 mt-1">
              Un botón "Reservar" que abre un popup con el flujo completo. Ideal para landing pages, homepages o sitios con poco espacio.
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase">Vista previa</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
            <button className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700">
              📅 Reservar ahora
            </button>
            <p className="text-xs text-gray-500 mt-3">Al hacer clic se abre un modal con el reservador</p>
          </div>
        </div>

        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase">Código HTML</span>
            <button
              onClick={() => copyToClipboard(buttonCode, "button")}
              className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
            >
              {copiedButton ? <><CheckCircle className="w-4 h-4" /> Copiado</> : <><Copy className="w-4 h-4" /> Copiar código</>}
            </button>
          </div>
          <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm max-h-96 overflow-y-auto">
            <code>{buttonCode}</code>
          </pre>
        </div>
      </div>

      {/* Versión 2: Full Page */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Monitor className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">Versión Extendida: Full Page</h2>
            <p className="text-sm text-gray-600 mt-1">
              El reservador completo embebido como iframe. Ideal para una página dedicada "/reservas" en tu sitio.
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase">Vista previa</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
              <Code className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600">Acá se mostrará el reservador completo</p>
              <p className="text-xs text-gray-500 mt-1">URL: {baseUrl}</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase">Código HTML</span>
            <button
              onClick={() => copyToClipboard(fullCode, "full")}
              className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
            >
              {copiedFull ? <><CheckCircle className="w-4 h-4" /> Copiado</> : <><Copy className="w-4 h-4" /> Copiar código</>}
            </button>
          </div>
          <pre className="bg-gray-900 text-blue-400 p-4 rounded-lg overflow-x-auto text-sm">
            <code>{fullCode}</code>
          </pre>
        </div>
      </div>

      {/* Instrucciones */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <h3 className="font-bold text-amber-900 mb-3">📋 Instrucciones de instalación</h3>
        <ol className="space-y-2 text-sm text-amber-800">
          <li><strong>1.</strong> Copiá el código de la versión que prefieras</li>
          <li><strong>2.</strong> Pegalo en el HTML de tu sitio web, en la sección donde querés que aparezca</li>
          <li><strong>3.</strong> Si usás WordPress, podés pegarlo en un bloque "HTML personalizado"</li>
          <li><strong>4.</strong> Si usás Wix, Squarespace o similar, buscá la opción "Insertar código" o "Embed"</li>
        </ol>
      </div>

      {/* Nota de seguridad */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-bold text-blue-900 mb-3">🔒 Seguridad</h3>
        <p className="text-sm text-blue-800">
          El código usa el atributo <code className="bg-blue-100 px-1 rounded">sandbox</code> del iframe para limitar los permisos.
          Solo permite scripts, formularios y popups necesarios para el funcionamiento del reservador.
          Tus datos están seguros.
        </p>
      </div>
    </div>
  );
}