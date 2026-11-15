const DEFAULT_MODEL = 'gemini-3.5-flash-lite'
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504])
const MAX_ATTEMPTS_PER_MODEL = 2
const ATTEMPT_TIMEOUT_MS = 14_000
const TOTAL_BUDGET_MS = 28_000

const SYSTEM_INSTRUCTION = `Kamu adalah Aksa AI, AI Tutor & Kopilot Pembelajaran Cerdas di platform pendidikan inklusif EduBridge, yang ditenagai langsung oleh Google Gemini.
Wawasanmu sangat luas selayaknya model LLM Gemini: kamu menguasai sains, teknologi, matematika, pemrograman (HTML, CSS, JavaScript, TypeScript, React, Python, backend, algoritma, AI, database), sejarah, literatur, psikologi, logika, tips belajar efektif, hingga percakapan bebas dan pemecahan masalah.

Pedoman Interaksi & Karakter Aksa:
1. Pengetahuan Luas Tanpa Batas: Jawab pertanyaan pengguna secara komprehensif, cerdas, faktual, dan mendalam. Jangan batasi dirimu hanya pada modul; jawablah seluruh pertanyaan pengguna (coding, sains, tugas akademik, logika, tips karier/belajar, diskusi umum) dengan kapasitas penuh Gemini.
2. Gaya Komunikasi: Hangat, suportif, komunikatif, dan cerdas sekelas Gemini. Gunakan Bahasa Indonesia yang luwes, bersahabat, dan jelas.
3. Kerapian Format: Awali dengan penjelasan inti yang langsung menjawab topik. Jika ada langkah atau poin penting, gunakan tanda "- " di awal baris. Jika diminta menulis kode, sertakan blok kode markdown (misal \`\`\`python ... \`\`\`) yang bersih dan dapat dijalankan.
4. Integrasi Konteks EduBridge: Apabila disertakan konteks materi kurikulum EduBridge, gunakan sebagai sumber rujukan utama terkait topik tersebut, namun tetap perkaya dengan penjelasan luas yang relevan.
5. Keamanan: Jangan pernah meminta kata sandi atau data pribadi yang sensitif.`

function getModelCandidates() {
  const primary = process.env.GEMINI_MODEL || DEFAULT_MODEL
  const fallbacks = (process.env.GEMINI_FALLBACK_MODELS || 'gemini-3.5-flash,gemini-flash-latest,gemini-flash-lite-latest')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean)
  return [...new Set([primary, ...fallbacks, 'gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-flash-latest'])]
}

function sendResponse(response, status, payload) {
  if (typeof response.setHeader === 'function') {
    response.setHeader('Access-Control-Allow-Origin', '*')
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    response.setHeader('Content-Type', 'application/json; charset=utf-8')
    response.setHeader('Cache-Control', 'no-store')
  }

  if (typeof response.status === 'function' && typeof response.json === 'function') {
    return response.status(status).json(payload)
  }

  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  })
  response.end(JSON.stringify(payload))
}

async function parseRequestBody(request) {
  if (request.body && typeof request.body === 'object') return request.body
  if (typeof request.body === 'string') {
    try {
      return JSON.parse(request.body)
    } catch {
      return {}
    }
  }

  let body = ''
  for await (const chunk of request) {
    body += chunk
  }
  try {
    return JSON.parse(body || '{}')
  } catch {
    return {}
  }
}

async function requestGemini(model, requestBody, apiKey, timeoutMs) {
  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: 'POST',
        headers: {
          'x-goog-api-key': apiKey,
          'content-type': 'application/json',
        },
        body: requestBody,
        signal: AbortSignal.timeout(timeoutMs),
      }
    )

    if (geminiResponse.ok) {
      return { ok: true, result: await geminiResponse.json(), status: geminiResponse.status }
    }

    const errorPayload = await geminiResponse.json().catch(() => null)
    const providerCode = errorPayload?.error?.status ?? errorPayload?.error?.code
    return {
      ok: false,
      status: geminiResponse.status,
      providerCode: typeof providerCode === 'string' ? providerCode.slice(0, 80) : '',
    }
  } catch (error) {
    return { ok: false, status: 0, providerCode: error instanceof Error ? error.name : 'network_error' }
  }
}

export default async function handler(request, response) {
  if (request.method === 'OPTIONS') {
    if (typeof response.status === 'function') return response.status(204).end()
    response.writeHead(204)
    response.end()
    return
  }

  if (request.method !== 'POST') {
    return sendResponse(response, 405, { error: 'Metode tidak didukung. Gunakan POST.' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return sendResponse(response, 503, {
      code: 'AI_NOT_CONFIGURED',
      error: 'Kunci Gemini API belum dikonfigurasi di server.',
    })
  }

  let payload
  try {
    payload = await parseRequestBody(request)
  } catch {
    return sendResponse(response, 400, { error: 'Format permintaan tidak valid.' })
  }

  const question = typeof payload.question === 'string' ? payload.question.trim().slice(0, 1500) : ''
  if (!question) {
    return sendResponse(response, 400, { error: 'Tulis pertanyaan terlebih dahulu.' })
  }

  const context = typeof payload.context === 'string' ? payload.context.slice(0, 15000) : ''
  const history = Array.isArray(payload.history)
    ? payload.history
        .filter((message) => ['user', 'assistant'].includes(message?.role) && typeof message.content === 'string')
        .slice(-10)
        .map((message) => ({ role: message.role, content: message.content.slice(0, 1500) }))
    : []

  const contextAndQuestion = [
    context ? `[Konteks Materi Kurikulum EduBridge]:\n${context}` : '',
    `[Pertanyaan Pengguna]:\n${question}`,
  ]
    .filter(Boolean)
    .join('\n\n')

  const requestBody = JSON.stringify({
    systemInstruction: {
      parts: [{ text: SYSTEM_INSTRUCTION }],
    },
    contents: [
      ...history.map((message) => ({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.content }],
      })),
      { role: 'user', parts: [{ text: contextAndQuestion }] },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1600,
    },
  })

  const deadline = Date.now() + TOTAL_BUDGET_MS
  const candidateModels = getModelCandidates()
  let lastOutcome = { ok: false, status: 0, providerCode: '' }

  for (const model of candidateModels) {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_MODEL; attempt += 1) {
      const remaining = deadline - Date.now()
      if (remaining < 1000) break

      const outcome = await requestGemini(model, requestBody, apiKey, Math.min(ATTEMPT_TIMEOUT_MS, remaining))
      if (outcome.ok) {
        const candidate = outcome.result.candidates?.[0]
        const answer = candidate?.content?.parts
          ?.map((part) => part.text)
          .filter((text) => typeof text === 'string')
          .join('\n')
          ?.trim()

        if (answer) {
          return sendResponse(response, 200, { answer, model })
        }
      }

      lastOutcome = outcome
      if (!RETRYABLE_STATUSES.has(outcome.status) && outcome.status !== 0) {
        break
      }
    }
  }

  if (lastOutcome.status === 429) {
    return sendResponse(response, 429, {
      error: 'Batas kuota Gemini tercapai. Silakan coba kembali sesaat lagi.',
      retryable: true,
    })
  }

  return sendResponse(response, 502, {
    error: 'Aksa sedang mengoptimalkan respons Gemini. Silakan coba kirim ulang pertanyaanmu.',
    retryable: true,
  })
}
