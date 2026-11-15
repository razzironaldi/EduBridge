import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv, type Plugin } from 'vite'

function aksaGeminiDevPlugin(mode: string): Plugin {
  const env = loadEnv(mode, process.cwd(), '')
  const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || ''
  const primaryModel = env.GEMINI_MODEL || process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite'
  const fallbackModels = (env.GEMINI_FALLBACK_MODELS || 'gemini-3.5-flash,gemini-flash-latest,gemini-flash-lite-latest')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean)
  const models = [...new Set([primaryModel, ...fallbackModels, 'gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-flash-latest'])]

  const SYSTEM_PROMPT = `Kamu adalah Aksa AI, AI Tutor & Kopilot Pembelajaran Cerdas di platform pendidikan inklusif EduBridge, yang ditenagai langsung oleh Google Gemini.
Wawasanmu sangat luas selayaknya model LLM Gemini: kamu menguasai sains, teknologi, matematika, pemrograman (HTML, CSS, JavaScript, TypeScript, React, Python, backend, algoritma, AI, database), sejarah, sastra, psikologi, logika, tips belajar efektif, hingga percakapan bebas dan pemecahan masalah.

Pedoman Interaksi & Karakter Aksa:
1. Pengetahuan Luas Tanpa Batas: Jawab pertanyaan pengguna secara komprehensif, cerdas, faktual, dan mendalam. Jangan batasi dirimu hanya pada modul; jawablah seluruh pertanyaan pengguna (coding, sains, tugas akademik, logika, tips karier/belajar, diskusi umum) dengan kapasitas penuh Gemini.
2. Gaya Komunikasi: Hangat, suportif, komunikatif, dan cerdas sekelas Gemini. Gunakan Bahasa Indonesia yang luwes, bersahabat, dan jelas.
3. Kerapian Format: Awali dengan penjelasan inti yang langsung menjawab topik. Jika ada langkah atau poin penting, gunakan tanda "- " di awal baris. Jika diminta menulis kode, sertakan blok kode markdown (misal \`\`\`python ... \`\`\`) yang bersih dan dapat dijalankan.
4. Integrasi Konteks EduBridge: Apabila disertakan konteks materi kurikulum EduBridge, gunakan sebagai sumber rujukan utama terkait topik tersebut, namun tetap perkaya dengan penjelasan luas yang relevan.
5. Keamanan: Jangan pernah meminta kata sandi atau data pribadi yang sensitif.`

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
              context ? `[Referensi Kurikulum EduBridge]:\n${context}` : '',
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
                temperature: 0.7,
                maxOutputTokens: 1600,
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
