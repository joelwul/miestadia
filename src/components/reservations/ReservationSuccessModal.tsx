'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, CheckCircle, Copy, MessageCircle, Download } from 'lucide-react'

interface Props {
  reservation: any
  tenantSlug: string
  onClose: () => void
}

export default function ReservationSuccessModal({ reservation, tenantSlug, onClose }: Props) {
  const [copied, setCopied] = useState(false)
  
  // Link al login con código y apellido precargados
  const guestLastName = reservation.guests?.last_name || ''
  const accessUrl = `http://localhost:3000/${tenantSlug}?code=${reservation.reservation_code}&lastName=${encodeURIComponent(guestLastName)}`
  
  const guestName = reservation.guests?.first_name || 'Huésped'
  const checkIn = new Date(reservation.check_in).toLocaleDateString('es-AR')
  const checkOut = new Date(reservation.check_out).toLocaleDateString('es-AR')
  const unitName = reservation.units?.name || 'Unidad'
  const code = reservation.reservation_code

  const whatsappMessage = `¡Hola ${guestName}! 👋%0A%0ATu reserva está confirmada:%0A📅 Check-in: ${checkIn}%0A📅 Check-out: ${checkOut}%0A🏠 Unidad: ${unitName}%0A📋 Código: ${code}%0A%0AAccedé a tu experiencia:%0A${accessUrl}%0A%0A¡Esperamos que disfrutes!`

  function copyToClipboard() {
    navigator.clipboard.writeText(accessUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function downloadQR() {
    const svg = document.getElementById('qr-code')
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx?.drawImage(img, 0, 0)
        const pngFile = canvas.toDataURL('image/png')
        const downloadLink = document.createElement('a')
        downloadLink.download = `reserva-${code}.png`
        downloadLink.href = pngFile
        downloadLink.click()
      }
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900">¡Reserva Creada!</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Código de reserva */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-sm text-blue-700 mb-1">Código de Reserva</p>
            <p className="text-3xl font-bold text-blue-900 font-mono">{code}</p>
          </div>

          {/* QR Code */}
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 mb-3">Código QR de acceso</p>
            <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
              <QRCodeSVG
                id="qr-code"
                value={accessUrl}
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadQR}
              >
                <Download className="mr-2 h-4 w-4" />
                Descargar QR
              </Button>
            </div>
          </div>

          {/* Link de acceso */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Link de acceso (con código y apellido precargados)</p>
            <div className="flex gap-2">
              <Input
                value={accessUrl}
                readOnly
                className="flex-1 text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
              >
                <Copy className="h-4 w-4" />
                {copied ? '✓' : ''}
              </Button>
            </div>
          </div>

          {/* Detalles */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Huésped:</span>
              <span className="font-medium">{guestName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Check-in:</span>
              <span className="font-medium">{checkIn}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Check-out:</span>
              <span className="font-medium">{checkOut}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Unidad:</span>
              <span className="font-medium">{unitName}</span>
            </div>
          </div>

          {/* Botones */}
          <div className="space-y-3">
            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
              onClick={() => {
                const phone = reservation.guests?.phone?.replace(/\D/g, '') || ''
                if (phone) {
                  window.open(`https://wa.me/${phone}?text=${whatsappMessage}`, '_blank')
                } else {
                  alert('El huésped no tiene teléfono registrado')
                }
              }}
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Enviar por WhatsApp
            </Button>

            <Button 
              variant="outline" 
              className="w-full" 
              onClick={onClose}
              size="lg">
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}