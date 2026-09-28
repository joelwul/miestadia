'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageSquare, Send, Eye, Mail } from 'lucide-react'

interface Props {
  params: Promise<{ tenantSlug: string }>
}

export default function MessagesPage({ params }: Props) {
  const [tenantSlug, setTenantSlug] = useState('')
  const [tenantId, setTenantId] = useState('')
  const [messages, setMessages] = useState<any[]>([])
  const [selectedMessage, setSelectedMessage] = useState<any>(null)
  const [showCompose, setShowCompose] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const [newMessage, setNewMessage] = useState({
    guest_id: '',
    reservation_id: '',
    subject: '',
    body: '',
  })

  const [guests, setGuests] = useState<any[]>([])
  const [reservations, setReservations] = useState<any[]>([])

  useEffect(() => {
    const init = async () => {
      const resolvedParams = await params
      setTenantSlug(resolvedParams.tenantSlug)
      
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', resolvedParams.tenantSlug)
        .single()

      if (tenant) {
        setTenantId(tenant.id)
        await Promise.all([
          loadMessages(tenant.id),
          loadGuests(tenant.id),
          loadReservations(tenant.id),
        ])
      }
    }
    init()
  }, [params])

  async function loadMessages(tid: string) {
    const { data } = await supabase
      .from('messages')
      .select(`
        *,
        guests (first_name, last_name, email),
        reservations (reservation_code)
      `)
      .eq('tenant_id', tid)
      .order('created_at', { ascending: false })

    if (data) setMessages(data)
    setLoading(false)
  }

  async function loadGuests(tid: string) {
    const { data } = await supabase
      .from('guests')
      .select('id, first_name, last_name, email')
      .eq('tenant_id', tid)
      .order('first_name')
    if (data) setGuests(data)
  }

  async function loadReservations(tid: string) {
    const { data } = await supabase
      .from('reservations')
      .select('id, reservation_code, guest_id, guests (first_name, last_name)')
      .eq('tenant_id', tid)
      .order('check_in', { ascending: false })
      .limit(50)
    if (data) setReservations(data)
  }

  async function sendMessage() {
    if (!newMessage.body) return

    const guest = guests.find(g => g.id === newMessage.guest_id)
    const reservation = reservations.find(r => r.id === newMessage.reservation_id)

    const { error } = await supabase
      .from('messages')
      .insert({
        tenant_id: tenantId,
        guest_id: newMessage.guest_id,
        reservation_id: newMessage.reservation_id || null,
        sender_type: 'admin',
        sender_name: 'Administrador',
        subject: newMessage.subject || 'Sin asunto',
        body: newMessage.body,
      })

    if (error) {
      alert('Error al enviar: ' + error.message)
      return
    }

    setNewMessage({ guest_id: '', reservation_id: '', subject: '', body: '' })
    setShowCompose(false)
    await loadMessages(tenantId)
  }

  async function markAsRead(id: string) {
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', id)
    await loadMessages(tenantId)
  }

  const unreadCount = messages.filter(m => !m.is_read && m.sender_type !== 'admin').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mensajes</h1>
          <p className="text-gray-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todos los mensajes leídos'}
          </p>
        </div>
        <Button onClick={() => setShowCompose(!showCompose)}>
          <Send className="mr-2 h-4 w-4" />
          {showCompose ? 'Cancelar' : 'Nuevo Mensaje'}
        </Button>
      </div>

      {showCompose && (
        <Card>
          <CardHeader>
            <CardTitle>Componer Mensaje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Huésped</label>
              <select
                value={newMessage.guest_id}
                onChange={(e) => setNewMessage({ ...newMessage, guest_id: e.target.value })}
                className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white mt-1"
              >
                <option value="">Seleccionar huésped</option>
                {guests.map(g => (
                  <option key={g.id} value={g.id}>{g.first_name} {g.last_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Reserva (opcional)</label>
              <select
                value={newMessage.reservation_id}
                onChange={(e) => setNewMessage({ ...newMessage, reservation_id: e.target.value })}
                className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white mt-1"
              >
                <option value="">Sin reserva específica</option>
                {reservations.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.reservation_code} - {r.guests?.first_name} {r.guests?.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Asunto</label>
              <Input
                value={newMessage.subject}
                onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                placeholder="Asunto del mensaje"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Mensaje</label>
              <textarea
                value={newMessage.body}
                onChange={(e) => setNewMessage({ ...newMessage, body: e.target.value })}
                className="w-full min-h-[120px] px-3 py-2 border border-gray-300 rounded-lg mt-1"
                placeholder="Escribí tu mensaje..."
              />
            </div>

            <Button onClick={sendMessage} disabled={!newMessage.guest_id || !newMessage.body}>
              <Send className="mr-2 h-4 w-4" /> Enviar
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{messages.length} mensajes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-12 text-gray-500">Cargando...</p>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">No hay mensajes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`border rounded-lg p-4 hover:bg-gray-50 cursor-pointer ${
                    !msg.is_read && msg.sender_type !== 'admin' ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => {
                    setSelectedMessage(msg)
                    if (!msg.is_read) markAsRead(msg.id)
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        msg.sender_type === 'admin' ? 'bg-green-100' : 'bg-blue-100'
                      }`}>
                        <Mail className={`h-5 w-5 ${msg.sender_type === 'admin' ? 'text-green-600' : 'text-blue-600'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">{msg.sender_name}</p>
                          {!msg.is_read && msg.sender_type !== 'admin' && (
                            <Badge className="bg-blue-500 text-white text-xs">Nuevo</Badge>
                          )}
                          {msg.sender_type === 'admin' && (
                            <Badge variant="outline" className="text-xs">Enviado</Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-700 mt-1">{msg.subject}</p>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{msg.body}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(msg.created_at).toLocaleString('es-AR')}
                          {msg.reservations && <span className="ml-2">📋 {msg.reservations.reservation_code}</span>}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">{selectedMessage.subject}</h2>
              <button onClick={() => setSelectedMessage(null)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  selectedMessage.sender_type === 'admin' ? 'bg-green-100' : 'bg-blue-100'
                }`}>
                  <Mail className={`h-5 w-5 ${selectedMessage.sender_type === 'admin' ? 'text-green-600' : 'text-blue-600'}`} />
                </div>
                <div>
                  <p className="font-semibold">{selectedMessage.sender_name}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(selectedMessage.created_at).toLocaleString('es-AR')}
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-800 whitespace-pre-wrap">{selectedMessage.body}</p>
              </div>
              {selectedMessage.guests && (
                <div className="text-sm text-gray-600">
                  <p><strong>Huésped:</strong> {selectedMessage.guests.first_name} {selectedMessage.guests.last_name}</p>
                  {selectedMessage.guests.email && <p><strong>Email:</strong> {selectedMessage.guests.email}</p>}
                </div>
              )}
              <Button variant="outline" onClick={() => setSelectedMessage(null)}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}