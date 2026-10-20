import { BedDouble, Bath, Maximize, Car } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { Listing } from '@/lib/listings-data'

interface ListingSpecsProps {
  listing: Listing
}

export function ListingSpecs({ listing }: ListingSpecsProps) {
  const specs = [
    listing.bedrooms > 0 && {
      icon: BedDouble,
      value: listing.bedrooms,
      label: listing.bedrooms === 1 ? 'Quarto' : 'Quartos',
    },
    listing.bathrooms > 0 && {
      icon: Bath,
      value: listing.bathrooms,
      label: listing.bathrooms === 1 ? 'Banheiro' : 'Banheiros',
    },
    {
      icon: Maximize,
      value: `${listing.area}m²`,
      label: 'Área total',
    },
    listing.parking > 0 && {
      icon: Car,
      value: listing.parking,
      label: listing.parking === 1 ? 'Vaga' : 'Vagas',
    },
  ].filter(Boolean) as Array<{
    icon: React.ComponentType<{ className?: string }>
    value: string | number
    label: string
  }>

  if (specs.length === 0) return null

  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="mb-4 text-sm font-semibold text-text-primary">Especificações</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {specs.map((spec) => (
            <div key={spec.label} className="flex flex-col items-center text-center sm:items-start sm:text-left">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-accent-subtle text-accent">
                <spec.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="text-lg font-bold tracking-tight text-text-primary tabular-nums">
                {spec.value}
              </p>
              <p className="text-xs text-text-secondary">{spec.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}