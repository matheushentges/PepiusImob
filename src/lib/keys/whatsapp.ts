/**
 * Gera URL e mensagem amigável para contato via WhatsApp com o responsável pela chave.
 */

export function cleanPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10 || digits.length === 11) {
    // Adiciona código do Brasil (55) se vier apenas DDD + número
    return `55${digits}`
  }
  return digits
}

export function formatDateTimeBR(isoString: string | null | undefined): string {
  if (!isoString) return ''
  try {
    const date = new Date(isoString)
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  } catch {
    return ''
  }
}

export function buildKeyReminderWhatsAppUrl({
  phone,
  responsibleName,
  propertyTitle,
  expectedAt,
  isLate,
}: {
  phone: string
  responsibleName: string
  propertyTitle: string
  expectedAt?: string | null
  isLate?: boolean
}): string | null {
  const cleanPhone = cleanPhoneNumber(phone)
  if (!cleanPhone || cleanPhone.length < 10) return null

  const firstName = responsibleName.trim().split(' ')[0] || responsibleName
  const formattedTime = formatDateTimeBR(expectedAt)

  let message: string
  if (isLate && formattedTime) {
    message = `Olá, ${firstName}! Tudo bem? Aqui é da imobiliária. Estamos acompanhando a devolução das chaves do imóvel "${propertyTitle}", cuja previsão era ${formattedTime}. Você teria uma previsão atualizada de retorno? Muito obrigado!`
  } else if (formattedTime) {
    message = `Olá, ${firstName}! Tudo bem? Aqui é da imobiliária referente às chaves do imóvel "${propertyTitle}". Lembramos que a previsão de devolução combinada é para ${formattedTime}. Qualquer dúvida, estamos à disposição!`
  } else {
    message = `Olá, ${firstName}! Tudo bem? Aqui é da imobiliária referente às chaves do imóvel "${propertyTitle}". Como está a visita? Qualquer dúvida, estamos à disposição!`
  }

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
}
