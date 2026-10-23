import test from 'node:test'
import assert from 'node:assert/strict'

function formatVisitRelative(dateIso) {
  const date = new Date(dateIso)
  const now = new Date()

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()

  const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  if (isToday) return `Hoje às ${timeStr}`

  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const isTomorrow =
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear()

  if (isTomorrow) return `Amanhã às ${timeStr}`

  const dayMonth = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  return `${dayMonth} às ${timeStr}`
}

test('formatVisitRelative accurately formats today, tomorrow and future dates', () => {
  const now = new Date()
  const today15h = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 30)
  assert.equal(formatVisitRelative(today15h.toISOString()), 'Hoje às 15:30')

  const tomorrow10h = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 10, 0)
  assert.equal(formatVisitRelative(tomorrow10h.toISOString()), 'Amanhã às 10:00')
})
