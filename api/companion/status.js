export default async function handler(request, response) {
  // CORS & Cache control
  if (typeof response.setHeader === 'function') {
    response.setHeader('Access-Control-Allow-Origin', '*')
    response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    response.setHeader('Cache-Control', 'no-store')
  }

  if (request.method === 'OPTIONS') {
    if (typeof response.status === 'function') return response.status(204).end()
    response.writeHead(204)
    response.end()
    return
  }

  const configured = Boolean(process.env.GEMINI_API_KEY)
  const provider = 'Gemini'
  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite'

  const payload = {
    configured,
    provider,
    model,
    status: configured ? 'ready' : 'key_missing',
  }

  if (typeof response.status === 'function' && typeof response.json === 'function') {
    return response.status(200).json(payload)
  }

  response.writeHead(200, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  })
  response.end(JSON.stringify(payload))
}
