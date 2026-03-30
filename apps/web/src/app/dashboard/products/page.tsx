'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Power } from 'lucide-react'
import Image from 'next/image'

interface Product {
  id: string
  title: string
  price: string
  imageUrl: string
  affiliateLink: string
  shopeeUrl: string
  active: boolean
  createdAt: string
}

const emptyForm = {
  title: '',
  price: '',
  imageUrl: '',
  affiliateLink: '',
  shopeeUrl: '',
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  async function loadProducts() {
    try {
      const { data } = await api.get('/products')
      setProducts(data)
    } catch {
      toast.error('Erro ao carregar produtos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadProducts() }, [])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(p: Product) {
    setEditing(p)
    setForm({
      title: p.title,
      price: p.price,
      imageUrl: p.imageUrl,
      affiliateLink: p.affiliateLink,
      shopeeUrl: p.shopeeUrl,
    })
    setModalOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (editing) {
        await api.put(`/products/${editing.id}`, form)
        toast.success('Produto atualizado')
      } else {
        await api.post('/products', form)
        toast.success('Produto criado')
      }
      setModalOpen(false)
      loadProducts()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(p: Product) {
    try {
      await api.patch(`/products/${p.id}/toggle`)
      toast.success(p.active ? 'Produto desativado' : 'Produto ativado')
      loadProducts()
    } catch {
      toast.error('Erro ao alterar status')
    }
  }

  async function handleDelete(p: Product) {
    if (!confirm(`Excluir "${p.title}"?`)) return
    try {
      await api.delete(`/products/${p.id}`)
      toast.success('Produto excluído')
      loadProducts()
    } catch {
      toast.error('Erro ao excluir')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="text-gray-500 text-sm mt-1">
            Gerencie seu catálogo de produtos afiliados
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} className="mr-2" />
          Novo Produto
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400">
          Carregando...
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center h-48 text-gray-400">
          <ShoppingBagEmpty />
          <p className="mt-2">Nenhum produto cadastrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {products.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="relative h-48 bg-gray-100">
                {p.imageUrl && (
                  <Image
                    src={p.imageUrl}
                    alt={p.title}
                    fill
                    className="object-contain p-2"
                    unoptimized
                  />
                )}
                <div className="absolute top-2 right-2">
                  <Badge variant={p.active ? 'success' : 'default'}>
                    {p.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
                  {p.title}
                </h3>
                <p className="text-orange-600 font-bold mt-1">R$ {p.price}</p>
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    variant={p.active ? 'secondary' : 'primary'}
                    onClick={() => handleToggle(p)}
                  >
                    <Power size={14} className="mr-1" />
                    {p.active ? 'Desativar' : 'Ativar'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                    <Pencil size={14} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(p)}
                    className="hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Produto' : 'Novo Produto'}
      >
        <div className="space-y-4">
          {[
            { key: 'title', label: 'Título', placeholder: 'Nome do produto' },
            { key: 'price', label: 'Preço', placeholder: '99.90' },
            {
              key: 'imageUrl',
              label: 'URL da Imagem',
              placeholder: 'https://...',
            },
            {
              key: 'affiliateLink',
              label: 'Link Afiliado',
              placeholder: 'https://s.shopee.com.br/...',
            },
            {
              key: 'shopeeUrl',
              label: 'URL Shopee',
              placeholder: 'https://shopee.com.br/...',
            },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
              </label>
              <input
                type="text"
                value={form[key as keyof typeof form]}
                onChange={(e) =>
                  setForm((f) => ({ ...f, [key]: e.target.value }))
                }
                placeholder={placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setModalOpen(false)}
            >
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

function ShoppingBagEmpty() {
  return (
    <svg
      className="w-12 h-12 text-gray-300"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1}
        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
      />
    </svg>
  )
}
