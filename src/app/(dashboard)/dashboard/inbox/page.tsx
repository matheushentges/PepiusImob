import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { MessageSquare, Search, Filter, MoreHorizontal, Send } from 'lucide-react'

export const dynamic = 'force-dynamic'

const channelIcons: Record<string, string> = {
  whatsapp: '📱',
  instagram: '📷',
  messenger: '💬',
  webchat: '🌐',
}

const statusColors: Record<string, string> = {
  ativo: 'bg-green-50 text-green-700 ring-green-600/20',
  arquivado: 'bg-gray-50 text-gray-700 ring-gray-600/20',
  spam: 'bg-red-50 text-red-700 ring-red-600/20',
}

function formatTime(date: string) {
  const d = new Date(date)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) {
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export default async function InboxPage() {
  const supabase = await createClient()
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('*, channels(tipo, nome), properties(titulo)')
    .order('last_message_at', { ascending: false })

  if (error) {
    console.error('Error fetching conversations:', error)
  }

  return (
    <div className="space-y-6">
      {/* Header - Linha de Planta */}
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
          Inbox
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Central omnichannel de conversas com clientes
        </p>
      </div>

      {/* Stats Row - Linha de Planta: cards compactos com border precisa */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Total', value: conversations?.length || 0, accent: false },
          { label: 'Ativas', value: conversations?.filter(c => c.status === 'ativo').length || 0, accent: false },
          { label: 'Arquivadas', value: conversations?.filter(c => c.status === 'arquivado').length || 0, accent: false },
          { label: 'Bot Ativo', value: conversations?.filter(c => c.is_bot_active).length || 0, accent: true },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {stat.label}
            </p>
            <p className={`mt-1 text-xl font-semibold ${stat.accent ? 'text-accent' : 'text-foreground'}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Inbox Container - Master/Detail Layout */}
      <div className="flex h-[calc(100vh-280px)] min-h-[500px] overflow-hidden rounded-lg border border-border bg-card">
        {/* Conversation List - Sidebar */}
        <div className="flex w-full flex-col border-r border-border md:w-80 lg:w-96">
          {/* Search & Filter Bar */}
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar conversas..."
                className="h-9 w-full rounded-md border border-input bg-input pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="mt-2 flex gap-2">
              <Button variant="outline" size="sm" className="h-7 flex-1 text-xs">
                Todas
              </Button>
              <Button variant="ghost" size="sm" className="h-7 flex-1 text-xs">
                Não lidas
              </Button>
              <Button variant="ghost" size="sm" className="h-7 flex-1 text-xs">
                Bot
              </Button>
            </div>
          </div>

          {/* Conversation Items */}
          <div className="flex-1 overflow-y-auto">
            {conversations && conversations.length > 0 ? (
              conversations.map((conv, idx) => (
                <div
                  key={conv.id}
                  className={`cursor-pointer border-b border-border p-4 transition-colors hover:bg-secondary ${idx === 0 ? 'bg-secondary/50' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base" title={conv.channels?.tipo}>
                          {channelIcons[conv.channels?.tipo] || '💬'}
                        </span>
                        <p className="truncate text-sm font-medium text-foreground">
                          {conv.contact_name}
                        </p>
                      </div>
                      {conv.properties?.titulo && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          🏠 {conv.properties.titulo}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                      {formatTime(conv.last_message_at)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span
                      className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${statusColors[conv.status] || 'bg-gray-50 text-gray-700 ring-gray-600/20'}`}
                    >
                      {conv.status === 'ativo' ? 'Ativa' : conv.status === 'arquivado' ? 'Arquivada' : 'Spam'}
                    </span>
                    {conv.is_bot_active && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-accent">
                        🤖 Bot
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <p className="mt-3 text-sm font-medium text-foreground">Nenhuma conversa</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  As conversas aparecerão aqui quando clientes entrarem em contato
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Detail - Main Area (placeholder for selected conversation) */}
        <div className="hidden flex-1 flex-col md:flex">
          {/* Chat Header */}
          <div className="flex items-center justify-between border-b border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-lg">
                👤
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Selecione uma conversa</p>
                <p className="text-xs text-muted-foreground">
                  Clique em uma conversa para ver os detalhes
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex flex-1 items-center justify-center bg-secondary/30 p-8">
            <div className="text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">
                Selecione uma conversa da lista para visualizar as mensagens
              </p>
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-border p-4">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <textarea
                  placeholder="Digite sua mensagem..."
                  rows={2}
                  disabled
                  className="w-full resize-none rounded-md border border-input bg-input px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                />
              </div>
              <Button size="icon" className="h-10 w-10 shrink-0" disabled>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}