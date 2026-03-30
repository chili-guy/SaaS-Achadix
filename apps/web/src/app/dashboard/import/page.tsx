'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import toast from 'react-hot-toast'
import { Download, RefreshCw, Plus } from 'lucide-react'
import Image from 'next/image'

interface Offer {
  productName: string
  priceMin: number
  imageUrl: string
  productUrl: string
  affiliateLink: string
}

export default function ImportPage() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState<string | null>(null)
  const [url, setUrl] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatedLink, setGeneratedLink] = useState('')

  async function loadOffers() {
    setLoading(true)
    try {
      const { data } = await api.get('/shopee/offers?limit=20')
      setOffers(data)
    } catch {
      toast.error('Erro ao buscar ofertas da Shopee')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadOffers() }, [])

  async function handleImport(offer: Offer) {
    setImporting(offer.productUrl)
    try {
      await api.post('/shopee/import', {
        shopeeUrl: offer.productUrl,
        title: offer.productName,
        price: (offer.priceMin / 100000).toFixed(2),
        imageUrl: offer.imageUrl,
      })
      toast.success('Produto importado com sucesso!')
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Erro ao importar produto')
    } finally {
      setImporting(null)
    }
  }

  async function handleGenerateLink() {
    if (!url) return
    setGenerating(true)
    setGeneratedLink('')
    try {
      const { data } = await api.post('/shopee/generate-link', { url })
      setGeneratedLink(data.affiliateLink)
      toast.success('Link gerado!')
    } catch {
      toast.error('Erro ao gerar link de afiliado')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Importar da Shopee</h1>
        <p className="text-gray-500 text-sm mt-1">
          Busque ofertas em alta ou gere links de afiliado manualmente
        </p>
      </div>

      {/* Gerador de link manual */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Gerar link de afiliado
        </h2>
        <div className="flex gap-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://shopee.com.br/produto..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <Button onClick={handleGenerateLink} disabled={generating || !url}>
            {generating ? 'Gerando...' : 'Gerar Link'}
          </Button>
        </div>
        {generatedLink && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs text-green-700 font-medium mb-1">Link gerado:</p>
            <a
              href={generatedLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-green-800 break-all hover:underline"
            >
              {generatedLink}
            </a>
            <button
              onClick={() => {
                navigator.clipboard.writeText(generatedLink)
                toast.success('Copiado!')
              }}
              className="mt-2 text-xs text-green-700 hover:underline block"
            >
              Copiar link
            </button>
          </div>
        )}
      </div>

      {/* Ofertas em alta */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">
          Ofertas em alta
        </h2>
        <Button variant="secondary" size="sm" onClick={loadOffers} disabled={loading}>
          <RefreshCw size={14} className="mr-2" />
          Atualizar
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400">
          Buscando ofertas...
        </div>
      ) : offers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center h-48 text-gray-400">
          Nenhuma oferta encontrada
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {offers.map((offer, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="relative h-48 bg-gray-100">
                {offer.imageUrl && (
                  <Image
                    src={offer.imageUrl}
                    alt={offer.productName}
                    fill
                    className="object-contain p-2"
                    unoptimized
                  />
                )}
              </div>
              <div className="p-4">
                <p className="font-medium text-gray-900 text-sm line-clamp-2">
                  {offer.productName}
                </p>
                <p className="text-orange-600 font-bold mt-1">
                  R$ {(offer.priceMin / 100000).toFixed(2)}
                </p>
                <Button
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => handleImport(offer)}
                  disabled={importing === offer.productUrl}
                >
                  <Plus size={14} className="mr-1" />
                  {importing === offer.productUrl ? 'Importando...' : 'Importar produto'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
