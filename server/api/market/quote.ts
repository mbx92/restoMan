import { get as httpsGet } from 'node:https'
import type { IncomingMessage } from 'node:http'

// HTTPS Helper
function httpsRequest(url: string, headers: Record<string, string> = {}, timeoutMs = 10000): Promise<{ body: string; status: number }> {
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    const req = httpsGet({
      hostname: u.hostname,
      path: u.pathname + u.search,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json,text/plain,*/*',
        ...headers,
      },
    }, (res: IncomingMessage) => {
      if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
        httpsRequest(res.headers.location, headers, timeoutMs).then(resolve).catch(reject)
        return
      }
      let body = ''
      res.on('data', chunk => body += chunk)
      res.on('end', () => resolve({ body, status: res.statusCode ?? 0 }))
    })
    req.setTimeout(timeoutMs, () => { req.destroy(); reject(new Error('TIMEOUT')) })
    req.on('error', reject)
  })
}

// Stooq fallback for non-US symbols
function toStooqSymbol(symbol: string): string {
  return symbol.toLowerCase().replace('-usd', '.usd').replace('-', '.')
}

async function fetchFromStooq(symbol: string) {
  try {
    const stooqSymbol = toStooqSymbol(symbol)
    const url = `https://stooq.com/q/l/?s=${encodeURIComponent(stooqSymbol)}&f=sd2t2ohlcv&h&e=csv`
    const { body, status } = await httpsRequest(url)
    if (status !== 200) return null

    const lines = body.trim().split('\n')
    if (lines.length < 2) return null
    const parts = lines[1]?.split(',')
    if (!parts || parts.length < 7) return null
    
    const close = parseFloat(parts[6] || '')
    if (isNaN(close) || close <= 0) return null

    // Bursa Indonesia (IDX) menggunakan IDR
    const isIDX = symbol.toUpperCase().endsWith('.JK')

    return { 
      price: close, 
      name: symbol, 
      currency: isIDX ? 'IDR' : 'USD' 
    }
  } catch (e: any) {
    console.warn('[quote] Stooq error:', e.message)
    return null
  }
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const symbol = query.symbol as string

  if (!symbol) {
    throw createError({ statusCode: 400, statusMessage: 'Symbol is required' })
  }

  // --- Attempt 1: Yahoo Finance Chart API (often doesn't need crumb) ---
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`
    const { body, status } = await httpsRequest(url)

    if (status === 200) {
      const data: any = JSON.parse(body)
      const meta = data?.chart?.result?.[0]?.meta
      
      if (meta && meta.regularMarketPrice !== undefined) {
        return {
          symbol: meta.symbol,
          name: meta.longName || meta.shortName || symbol,
          price: meta.regularMarketPrice,
          currency: meta.currency ?? 'USD',
          change: meta.regularMarketPrice - (meta.chartPreviousClose || meta.regularMarketPrice),
          changePercent: meta.chartPreviousClose ? ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100 : 0,
          marketState: meta.exchangeTimezoneName || null,
        }
      }
    } else {
      console.warn(`[quote] Yahoo chart HTTP ${status} for ${symbol}`)
    }
  } catch (err: any) {
    console.error(`[quote] Yahoo chart error: ${err.message}`)
  }

  // --- Attempt 2: Stooq Fallback ---
  console.log(`[quote] Falling back to Stooq for ${symbol}`)
  const stooq = await fetchFromStooq(symbol)
  if (stooq) {
    return {
      symbol,
      name: stooq.name,
      price: stooq.price,
      currency: stooq.currency,
      change: null,
      changePercent: null,
      marketState: null,
    }
  }

  throw createError({
    statusCode: 404,
    statusMessage: `Tidak dapat mengambil data untuk "${symbol}". Semua sumber data gagal.`,
  })
})
