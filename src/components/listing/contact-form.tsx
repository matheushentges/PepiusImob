'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const contactSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  phone: z.string().min(10, 'Telefone inválido'),
  message: z.string().optional(),
  preference: z.enum(['manha', 'tarde', 'noite']),
})

type ContactFormData = z.infer<typeof contactSchema>

interface ContactFormProps {
  listingId: string
  listingTitle: string
}

export function ContactForm({ listingId, listingTitle }: ContactFormProps) {
  const [isSubmitted, setIsSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      phone: '',
      message: '',
      preference: 'manha',
    },
  })

  async function onSubmit(data: ContactFormData) {
    // Simulate API call — no backend yet
    await new Promise((resolve) => setTimeout(resolve, 1200))
    setIsSubmitted(true)
    console.log('Contact form submitted:', { listingId, listingTitle, ...data })
  }

  function handleReset() {
    setIsSubmitted(false)
    reset()
  }

  if (isSubmitted) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-10 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-subtle text-success">
            <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary">Solicitação enviada!</h3>
          <p className="mt-2 text-sm text-text-secondary max-w-xs">
            Entraremos em contato em breve sobre este imóvel.
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="mt-6 text-sm font-medium text-accent transition-colors hover:text-accent-hover focus-visible:outline-none focus-visible:underline"
          >
            Enviar nova mensagem
          </button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Tenho interesse neste imóvel</CardTitle>
        <p className="text-xs text-text-secondary">Preencha seus dados e agende uma visita</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="contact-name">Nome</Label>
            <Input
              id="contact-name"
              placeholder="Seu nome completo"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-error">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contact-phone">Telefone</Label>
            <Input
              id="contact-phone"
              type="tel"
              placeholder="(11) 99999-9999"
              {...register('phone')}
            />
            {errors.phone && (
              <p className="text-xs text-error">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contact-preference">Melhor horário para contato</Label>
            <select
              id="contact-preference"
              className="flex h-9 w-full rounded-md border border-border-default bg-surface-raised px-3 py-1 text-sm text-text-primary shadow-xs transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              {...register('preference')}
            >
              <option value="manha">Manhã</option>
              <option value="tarde">Tarde</option>
              <option value="noite">Noite</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contact-message">Mensagem (opcional)</Label>
            <textarea
              id="contact-message"
              rows={3}
              placeholder="Gostaria de agendar uma visita..."
              className="flex w-full rounded-md border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary shadow-xs transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none"
              {...register('message')}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
                Enviando...
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <Send className="h-4 w-4" aria-hidden="true" />
                Solicitar contato
              </span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}