export default async function handler(req, res) {
  // Autoriser tout le monde à appeler (CORS)
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "content-type")
  if (req.method === "OPTIONS") return res.status(204).end()

  const isin = (req.query.isin || "CH1115678950-CHF").toString()

  const url =
    "https://data-feed.bxs-dev.ch/proxy/mdp-auth/v1/solid/quotes/bxswiss/" +
    `?keytype=ISIN_ISOCUR&listID=${encodeURIComponent(isin)}` +
    "&fieldList=PRICE_DISPLAY,LVAL_NORM"

  try {
    const r = await fetch(url, {
      headers: {
        Referer: "https://bxplus.ch/",
        Origin: "https://bxplus.ch",
        "User-Agent": "Mozilla/5.0",
      },
    })

    if (!r.ok) return res.status(502).json({ ok: false, price: null, ts: null })

    const j = await r.json()
    const f = j?.records?.[0]?.fields || {}
    const raw = f?.LVAL_NORM?.v ?? f?.PRICE_DISPLAY?.v ?? null
    const ts  = f?.LVAL_NORM?.d ?? null
    const price = raw == null ? null : Number(String(raw).replace(",", "."))

    return res.status(200).json({ ok: true, price, ts })
  } catch (e) {
    return res.status(500).json({ ok: false, price: null, ts: null })
  }
}
