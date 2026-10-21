import Link from 'next/link'
import { Download, KeyRound } from 'lucide-react'

export function LicenseSuspended() {
  return (
    <section role="status" className="mb-6 flex flex-col gap-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <KeyRound className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div>
          <h1 className="font-semibold">Licença suspensa ou expirada</h1>
          <p className="mt-1 text-sm">O painel está em modo de leitura. Os dados permanecem nesta instalação; alterações e a vitrine estão desativadas.</p>
        </div>
      </div>
      <Link
        href="/api/dashboard/export"
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-amber-700/30 bg-white px-4 py-2 text-sm font-medium hover:bg-amber-100"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        Exportar dados
      </Link>
    </section>
  )
}
