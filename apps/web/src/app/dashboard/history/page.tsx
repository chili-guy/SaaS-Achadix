'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'
import { RefreshCw } from 'lucide-react'

interface Post {
  id: string
  productId: string
  channelId: string
  status: 'pending' | 'sent' | 'failed'
  sentAt: string | null
  errorMessage: string | null
  createdAt: string
  productTitle: string | null
  productPrice: string | null
  productImageUrl: string | null
  channelName: string | null
}

interface Channel {
  id: string
  name: string
}

const STATUS_OPTIONS = [
  { label: 'Todos', value: '' },
  { label: 'Enviado', value: 'sent' },
  { label: 'Falhou', value: 'failed' },
  { label: 'Pendente', value: 'pending' },
]

function statusBadge(status: string) {
  if (status === 'sent') return <Badge variant="success">Enviado</Badge>
  if (status === 'failed') return <Badge variant="error">Falhou</Badge>
  return <Badge variant="warning">Pendente</Badge>
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(d))
}

export default function HistoryPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [channelFilter, setChannelFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  async function loadData() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' })
      if (channelFilter) params.set('channelId', channelFilter)
      if (statusFilter) params.set('status', statusFilter)

      const [postsRes, channelsRes] = await Promise.all([
        api.get(`/posts?${params}`),
        api.get('/channels'),
      ])
      setPosts(postsRes.data)
      setChannels(channelsRes.data)
    } catch {
      toast.error('Erro ao carregar histórico')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [channelFilter, statusFilter, page])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Histórico</h1>
          <p className="text-gray-500 text-sm mt-1">
            Registro de todas as postagens realizadas
          </p>
        </div>
        <Button variant="secondary" onClick={loadData}>
          <RefreshCw size={16} className="mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <select
          value={channelFilter}
          onChange={(e) => { setChannelFilter(e.target.value); setPage(1) }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="">Todos os canais</option>
          {channels.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400">Carregando...</div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center h-48 text-gray-400">
          Nenhuma postagem encontrada
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Produto</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Canal</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Enviado em</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Criado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {posts.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900 line-clamp-1">
                          {p.productTitle ?? '—'}
                        </p>
                        {p.productPrice && (
                          <p className="text-orange-600 text-xs">R$ {p.productPrice}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.channelName ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div>
                        {statusBadge(p.status)}
                        {p.errorMessage && (
                          <p className="text-xs text-red-500 mt-1 max-w-xs truncate">
                            {p.errorMessage}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(p.sentAt)}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <span className="text-sm text-gray-500">Página {page}</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={posts.length < 20}
            >
              Próxima
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
