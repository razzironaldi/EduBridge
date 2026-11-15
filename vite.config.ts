import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv, type Plugin } from 'vite'

function aksaGeminiDevPlugin(mode: string): Plugin {
  const env = loadEnv(mode, process.cwd(), '')
  const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || ''
  const primaryModel = env.GEMINI_MODEL || process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite'
  const fallbackModels = (env.GEMINI_FALLBACK_MODELS || 'gemini-2.5-flash,gemini-2.5-flash-lite')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean)
  const models = [...new Set([primaryModel, ...fallbackModels])]

  const SYSTEM_PROMPT = `Kamu adalah Aksa, AI Tutor & Kopilot Pembelajaran Adaptif di platform pendidikan inklusif TemanAkses.
Gaya komunikasimu sekelas Gemini: cerdas, terstruktur, hangat, suportif, dan tajam secara akademis.
Aturan jawaban:
1. Gunakan Bahasa Indonesia yang jernih dan mudah dipahami.
2. Kamu bisa menjawab dua jenis pertanyaan dengan sama baiknya:
   - Pertanyaan tentang materi TemanAkses (gunakan Konteks Materi yang diberikan sebagai rujukan utama).
   - Pertanyaan pengetahuan umum, pemrograman (HTML/CSS/JS/Python/Data/AI), tips belajar, karier, logika, atau diskusi bebas dari pengguna.
3. Susun jawaban dengan rapi: berikan penjelasan inti yang langsung menjawab pertanyaan, tambahkan poin-poin penting (gunakan tanda "- " di awal baris untuk setiap butir), dan berikan contoh konkret atau analogi singkat bila membantu.
4. Jangan pernah meminta kata sandi atau data sensitif pengguna.`

  return {
    name: 'aksa-gemini-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0] ?? ''

        if (url === '/api/companion/status' && req.method === 'GET') {
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(
            JSON.stringify({
              configured: Boolean(apiKey),
              provider: 'Gemini',
              model: primaryModel,
            })
          )
          return
        }

        if (url === '/api/companion' && req.method === 'POST') {
          if (!apiKey) {
            res.statusCode = 503
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ code: 'AI_NOT_CONFIGURED', error: 'GEMINI_API_KEY belum diatur.' }))
            return
          }

          let rawBody = ''
          for await (const chunk of req) {
            rawBody += chunk
          }

          try {
            const payload = JSON.parse(rawBody || '{}')
            const question = typeof payload.question === 'string' ? payload.question.trim() : ''
            const context = typeof payload.context === 'string' ? payload.context.slice(0, 12000) : ''
            const history = Array.isArray(payload.history) ? payload.history.slice(-10) : []

            if (!question) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({ error: 'Pertanyaan kosong.' }))
              return
            }

            const promptText = [
              context ? `[Referensi Kurikulum TemanAkses]:\n${context}` : '',
              `[Pesan Pengguna]:\n${question}`,
            ]
              .filter(Boolean)
              .join('\n\n')

            const requestBody = JSON.stringify({
              systemInstruction: {
                parts: [{ text: SYSTEM_PROMPT }],
              },
              contents: [
                ...history.map((m: { role?: string; content?: string }) => ({
                  role: m.role === 'assistant' ? 'model' : 'user',
                  parts: [{ text: String(m.content ?? '').slice(0, 1200) }],
                })),
                { role: 'user', parts: [{ text: promptText }] },
              ],
              generationConfig: {
                temperature: 0.65,
                maxOutputTokens: 900,
              },
            })

            for (const model of models) {
              const geminiRes = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
                {
                  method: 'POST',
                  headers: {
                    'x-goog-api-key': apiKey,
                    'content-type': 'application/json',
                  },
                  body: requestBody,
                }
              )

              if (geminiRes.ok) {
                const data = (await geminiRes.json()) as {
                  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
                }
                const answer = data.candidates?.[0]?.content?.parts
                  ?.map((p) => p.text)
                  .filter(Boolean)
                  .join('\n')
                  ?.trim()

                if (answer) {
                  res.statusCode = 200
                  res.setHeader('Content-Type', 'application/json; charset=utf-8')
                  res.end(JSON.stringify({ answer, model }))
                  return
                }
              }
            }

            res.statusCode = 502
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ error: 'Layanan Gemini sedang sibuk, silakan coba lagi.' }))
          } catch {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ error: 'Gagal memproses permintaan AI.' }))
          }
          return
        }

        next()
      })
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), aksaGeminiDevPlugin(mode)],
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8789',
    },
  },
}))
