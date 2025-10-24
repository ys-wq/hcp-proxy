export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  if (req.method === "OPTIONS") return res.status(204).end();

  const isin = (req.query.isin || "CH1115678950-CHF").toString();

  // ⇩ ton URL Apps Script (terminant par /exec)
  const SOURCE = "https://script.google.com/macros/s/XXXXXXXXXXXX/exec";

  try {
    const r = await fetch(`${SOURCE}?isin=${encodeURIComponent(isin)}&t=${Date.now()}`, { cache: "no-store" });
    if (!r.ok) return res.status(502).json({ ok:false, price:null, ts:null, lastTransactionDate:null });

    const j = await r.json();
    const price = (j && j.price != null) ? Number(j.price) : null;
    const ts = j?.ts || null; // ISO UTC

    // ❗️C’est CE formatage "simple" qui pouvait donner l’heure "fausse"
    // (conversion naïve UTC -> toISOString locale-like)
    let lastTransactionDate = null;
    if (ts) {
      try {
        const d = new Date(ts);
        lastTransactionDate = d.toISOString().replace("T", " ").substring(0, 19);
      } catch (e) { /* ignore */ }
    }

    return res.status(200).json({ ok: price != null, price, ts, lastTransactionDate });
  } catch {
    return res.status(500).json({ ok:false, price:null, ts:null, lastTransactionDate:null });
  }
}
