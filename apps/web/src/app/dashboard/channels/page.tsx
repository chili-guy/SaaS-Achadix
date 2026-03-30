'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Power, Radio } from 'lucide-react'

interface Channel {
  id: string
  name: string
  channelId: string
  cronExpression: string
  active: boolean
  createdAt: string
}

const emptyForm = {
  name: '',
  channelId: '',
  cronExpression: '0 9,18 * * *',
}

const CRON_PRESETS = [
  { label: 'Todo dia às 9h e 18h', value: '0 9,18 * * *' },
  { label: 'De hora em hora', value: '0 * * * *' },
  { label: 'A cada 2 horas', value: '0 */2 * * *' },
  { label: 'Todo dia às 8h', value: '0 8 * * *' },
  { label: 'Todo dia às 12h', value: '0 12 * * *' },
  { label: 'Todo dia às 20h', value: '0 20 * * *' },
  { label: 'Personalizado', value: '' },
]

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Channel | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [cronPreset, setCronPreset] = useState(CRON_PRESETS[0].value)

  async function loadChannels() {
    try {
      const { data } = await api.get('/channels')
      setChannels(data)
    } catch {
      toast.error('Erro ao carregar canais')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadChannels() }, [])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setCronPreset(CRON_PRESETS[0].value)
    setModalOpen(true)
  }

  function openEdit(c: Channel) {
    setEditing(c)
    setForm({ name: c.name, channelId: c.channelId, cronExpression: c.cronExpression })
    const preset = CRON_PRESETS.find((p) => p.value === c.cronExpression)
    setCronPreset(preset ? preset.value : '')
    setModalOpen(true)
  }

  function handlePresetChange(value: string) {
    setCronPreset(value)
    if (value) setForm((f) => ({ ...f, cronExpression: value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (editing) {
        await api.put(`/channels/${editing.id}`, form)
        toast.success('Canal atualizado')
      } else {
        await api.post('/channels', form)
        toast.success('Canal criado')
      }
      setModalOpen(false)
      loadChannels()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(c: Channel) {
    try {
      await api.patch(`/channels/${c.id}/toggle`)
      toast.success(c.active ? 'Canal desativado' : 'Canal ativado')
      loadChannels()
    } catch {
      toast.error('Erro ao alterar status')
    }
  }

  async function handleDelete(c: Channel) {
    if (!confirm(`Excluir canal "${c.name}"?`)) return
    try {
      await api.delete(`/channels/${c.id}`)
      toast.success('Canal excluído')
      loadChannels()
    } catch {
      toast.error('Erro ao excluir')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Canais</h1>
          <p className="text-gray-500 text-sm mt-1">
            Configure seus canais do WhatsApp e horários de postagem
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} className="mr-2" />
          Novo Canal
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400">
          Carregando...
        </div>
      ) : channels.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center h-48 text-gray-400">
          <Radio size={48} className="mb-2 opacity-30" />
          <p>Nenhum canal configurado</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nome</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ID do Canal</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Agendamento (Cron)</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {channels.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{c.channelId}</td>
                  <td className="px-4 py-3">
                    <code className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-700">
                      {c.cronExpression}
                    </code>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={c.active ? 'success' : 'default'}>
                      {c.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(c)}>
                        <Pencil size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggle(c)}
                        className={c.active ? 'hover:bg-yellow-50 hover:text-yellow-600' : 'hover:bg-green-50 hover:text-green-600'}
                      >
                        <Power size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(c)}
                        className="hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Canal' : 'Novo Canal'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Canal</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Promoções Shopee"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID do Canal (WhatsApp)</label>
            <input
              type="text"
              value={form.channelId}
              onChange={(e) => setForm((f) => ({ ...f, channelId: e.target.value }))}
              placeholder="120363xxxxxxxxxx"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <p className="text-xs text-gray-400 mt-1">ID do canal/newsletter no WhatsApp (sem @newsletter)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Horário de Postagem</label>
            <select
              value={cronPreset}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 mb-2"
            >
              {CRON_PRESETS.map((p) => (
                <option key={p.label} value={p.value}>{p.label}</option>
              ))}
            </select>
            <input
              type="text"
              value={form.cronExpression}
              onChange={(e) => {
                setForm((f) => ({ ...f, cronExpression: e.target.value }))
                setCronPreset('')
              }}
              placeholder="Expressão cron (ex: 0 9,18 * * *)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
