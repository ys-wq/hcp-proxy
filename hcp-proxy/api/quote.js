// api/quote.js
export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "content-type")
  if (req.method === "OPTIONS") return res.status(204).end()

  const isin = (req.query.isin || "CH1115678950-CHF").toString()

  // ⇩⇩ Ton Apps Script (celui qui renvoie { ok, price, ts })
  const SOURCE = "https://script.google.com/macros/s/AKfycbyyD-Q2GB1tHicP19MNVMyqa71Rew5-Cy_2631Gb2Q3TzKvGpWI7Rr2omcQHFwV4QgmFw/exec"

  try {
    const r = await fetch(`${SOURCE}?isin=${encodeURIComponent(isin)}`, { cache: "no-store" })
    if (!r.ok) return res.status(502).json({ ok: false, price: null, ts: null, from: "apps-script", code: r.status })

    const j = await r.json()
    // Normalise la sortie
    const price = (j && j.price != null) ? Number(j.price) : null
    const ts = j && j.ts ? j.ts : null
    return res.status(200).json({ ok: price != null, price, ts })
  } catch (e) {
    return res.status(500).json({ ok: false, price: null, ts: null, err: "fetch-failed" })
  }
}

