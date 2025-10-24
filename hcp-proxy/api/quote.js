// api/quote.js
export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "content-type")
  if (req.method === "OPTIONS") return res.status(204).end()

  const isin = (req.query.isin || "CH1115678950-CHF").toString()

  // Ton Apps Script (celui qui renvoie { ok, price, ts })
  const SOURCE = "https://script.google.com/macros/s/AKfycbwLnroWjq38pFojf0uza6oQJAniDEIy_mGvVZZLcYzasi-_EadsOTCtxH_oUBobleKJKA/exec"

  try {
    const r = await fetch(`${SOURCE}?isin=${encodeURIComponent(isin)}`, { cache: "no-store" })
    if (!r.ok) {
      return res.status(502).json({ ok: false, price: null, ts: null, lastTransactionDate: null })
    }

    const j = await r.json()

    const price = (j && j.price != null) ? Number(j.price) : null
    const ts = j && j.ts ? j.ts : null

    // Ajout d’un champ "lastTransactionDate" lisible
    let lastTransactionDate = null
    if (ts) {
      try {
        const d = new Date(ts)
        // format YYYY-MM-DD HH:mm:ss (local time)
        lastTransactionDate = d.toISOString().replace("T", " ").substring(0, 19)
      } catch (e) {
        lastTransactionDate = ts // fallback brut
      }
    }

  return res.status(200).json({ 
  ok: price != null, 
  price, 
  ts, 
  tradeTs: j?.tradeTs || null 
})
  } catch (e) {
    return res.status(500).json({ ok: false, price: null, ts: null, lastTransactionDate: null, err: "fetch-failed" })
  }
}
