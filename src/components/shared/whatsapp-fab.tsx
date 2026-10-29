'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import type { PublicSiteConfig } from '@/lib/public-listings'

interface WhatsAppFabProps {
  siteConfig: PublicSiteConfig
}

function WhatsAppIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

export function WhatsAppFab({ siteConfig }: WhatsAppFabProps) {
  const [isHovered, setIsHovered] = useState(false)
  const pathname = usePathname()

  const phoneRaw = siteConfig.whatsapp || siteConfig.telefone
  const cleanPhone = phoneRaw ? phoneRaw.replace(/\D/g, '') : null

  if (!cleanPhone || cleanPhone.length < 10) {
    return null
  }

  const phoneWithCountry = cleanPhone.length === 10 || cleanPhone.length === 11
    ? `55${cleanPhone}`
    : cleanPhone

  // Contextual message
  let defaultMessage = `Olá! Acessei o site da ${siteConfig.agencyName} e gostaria de atendimento sobre imóveis.`
  if (pathname.startsWith('/imoveis/')) {
    defaultMessage = `Olá! Acessei o site da ${siteConfig.agencyName} e gostaria de mais informações sobre este imóvel.`
  } else if (pathname.startsWith('/imoveis')) {
    defaultMessage = `Olá! Estava navegando no catálogo da ${siteConfig.agencyName} e gostaria de ajuda para encontrar um imóvel.`
  }

  const whatsappUrl = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(defaultMessage)}`

  const isListingDetail = pathname.startsWith('/imoveis/')

  return (
    <aside
      aria-label="Atendimento rápido via WhatsApp"
      className={`fixed bottom-6 right-6 z-40 flex items-center gap-3 transition-transform duration-300 ${
        isListingDetail ? 'hidden lg:flex' : ''
      }`}
    >
      {/* Tooltip / Balão informativo */}
      <div
        className={`hidden sm:flex items-center rounded-full bg-card/95 border border-border px-3.5 py-1.5 shadow-lg backdrop-blur-sm transition-all duration-300 ${
          isHovered
            ? 'opacity-100 translate-x-0'
            : 'opacity-0 translate-x-2 pointer-events-none'
        }`}
      >
        <span className="text-xs font-medium text-foreground whitespace-nowrap">
          Falar com corretor
        </span>
      </div>

      {/* Botão flutuante principal */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label={`Falar no WhatsApp da ${siteConfig.agencyName}`}
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-[#25D366]/40 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
      >
        {/* Anel pulsante suave */}
        <span
          className="absolute -inset-1 rounded-full bg-[#25D366]/30 animate-ping opacity-75 pointer-events-none"
          aria-hidden="true"
        />
        <WhatsAppIcon className="h-7 w-7 transition-transform group-hover:rotate-6" />
      </a>
    </aside>
  )
}
