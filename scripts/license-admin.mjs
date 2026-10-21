function readFlag(args, flag) {
  const index = args.indexOf(flag)
  if (index < 0 || !args[index + 1]) return null
  return args[index + 1]
}

function requiredFlag(args, flag) {
  const value = readFlag(args, flag)
  if (!value) throw new Error(`${flag} is required`)
  return value
}

const [, , command, ...args] = process.argv
const baseUrl = process.env.PEPIUS_LICENSE_API_URL?.replace(/\/$/, '')
const token = process.env.LICENSE_OPERATOR_TOKEN

if (!baseUrl || !token) {
  console.error('Set PEPIUS_LICENSE_API_URL and LICENSE_OPERATOR_TOKEN in the operator environment')
  process.exit(2)
}

const route = '/api/licensing/v1/operator/licenses'
let method = 'GET'
let path = route
let body

if (command === 'issue') {
  method = 'POST'
  body = {
    agencyName: requiredFlag(args, '--name'),
    plan: requiredFlag(args, '--plan'),
    monthlyAmountCents: Number(requiredFlag(args, '--monthly-cents')),
    paidThrough: requiredFlag(args, '--paid-through'),
    features: requiredFlag(args, '--features').split(',').filter(Boolean),
  }
} else if (command === 'payment') {
  method = 'POST'
  path += `/${requiredFlag(args, '--license')}/payments`
  body = {
    amountCents: Number(requiredFlag(args, '--amount-cents')),
    paidThrough: requiredFlag(args, '--paid-through'),
    reference: readFlag(args, '--reference') || undefined,
  }
} else if (command === 'suspend' || command === 'restore') {
  method = 'PATCH'
  path += `/${requiredFlag(args, '--license')}`
  body = { suspended: command === 'suspend' }
} else if (command !== 'list') {
  console.error('Usage: license-admin <list|issue|payment|suspend|restore> [options]')
  process.exit(2)
}

try {
  const url = new URL(path, `${baseUrl}/`)
  if (url.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(url.hostname)) {
    throw new Error('The license API must use HTTPS')
  }
  const response = await fetch(url, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(15_000),
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`)
  console.log(JSON.stringify(result, null, 2))
} catch (error) {
  console.error(error instanceof Error ? error.message : 'License operation failed')
  process.exitCode = 1
}
