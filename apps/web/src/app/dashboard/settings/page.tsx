'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'
import { Save, Eye, EyeOff } from 'lucide-react'

interface SettingsForm {
  evolution_base_url: string
  evolution_api_key: string
  evolution_instance: string
}

export default function SettingsPage() {
  const [form, setForm] = useState<SettingsForm>({
    evolution_base_url: '',
    evolution_api_key: '',
    evolution_instance: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showKey, setShowKey] = useState(false)

  useEffect(() => {
    api.get('/settings')
      .then(({ data }) => {
        setForm({
          evolution_base_url: data.evolution_base_url || '',
          evolution_api_key: data.evolution_api_key || '',
          evolution_instance: data.evolution_instance || '',
        })
      })
      .catch(() => toast.error('Erro ao carregar configurações'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      await api.put('/settings', form)
      toast.success('Configurações salvas com sucesso!')
    } catch {
      toast.error('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-500 text-sm mt-1">
          Gerencie as credenciais da Evolution API
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400">
          Carregando...
        </div>
      ) : (
        <div className="max-w-xl">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                Evolution API
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Base URL
                  </label>
                  <input
                    type="url"
                    value={form.evolution_base_url}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, evolution_base_url: e.target.value }))
                    }
                    placeholder="https://sua-evolution.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={form.evolution_api_key}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, evolution_api_key: e.target.value }))
                      }
                      placeholder="••••••••••••••••"
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Instância
                  </label>
                  <input
                    type="text"
                    value={form.evolution_instance}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, evolution_instance: e.target.value }))
                    }
                    placeholder="minha-instancia"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button onClick={handleSave} disabled={saving}>
                <Save size={16} className="mr-2" />
                {saving ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4">
            <p className="text-sm text-amber-800">
              <strong>Dica:</strong> As configurações salvas aqui sobrescrevem as variáveis de ambiente.
              Você também pode configurar via <code className="bg-amber-100 px-1 rounded">.env</code> no servidor.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
