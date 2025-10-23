function doGet(e){
  const isin = (e && e.parameter && e.parameter.isin) || "CH1115678950-CHF";
  const url = "https://data-feed.bxs-dev.ch/proxy/mdp-auth/v1/solid/quotes/bxswiss/"
    + "?keytype=ISIN_ISOCUR&listID=" + encodeURIComponent(isin)
    + "&fieldList=PRICE_DISPLAY,LVAL_NORM,BID,ASK,VOL,TUR,NC2_NORM,NC2_PR_NORM";

  const r = UrlFetchApp.fetch(url, {
    muteHttpExceptions: true,
    headers: { Referer: "https://bxplus.ch/", Origin: "https://bxplus.ch", "User-Agent": "Mozilla/5.0" }
  });

  if (r.getResponseCode() !== 200) {
    return ContentService.createTextOutput(JSON.stringify({ ok:false, price:null, ts:null, tradeTs:null }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const j = JSON.parse(r.getContentText());
  const f = j && j.records && j.records[0] && j.records[0].fields || {};

  const rawPrice = (f.LVAL_NORM && f.LVAL_NORM.v) ?? (f.PRICE_DISPLAY && f.PRICE_DISPLAY.v) ?? "";
  const price = Number(String(rawPrice).replace(",", "."));
  const ts = (f.LVAL_NORM && f.LVAL_NORM.d) || null; // horodatage du "last value" (peut ne pas être le trade réel)

  // 1) Tentatives de champs "trade time" explicites si existants (selon le flux)
  const candidateKeys = [
    "LAST", "LAST_TRADE", "LASTTIME", "LSTTRD",
    "TRDTIM", "TRD_TIME", "TRADE_TIME", "TR_TIME"
  ];

  let tradeTs = null;
  for (var k = 0; k < candidateKeys.length; k++) {
    var key = candidateKeys[k];
    if (f[key]) {
      // si c'est un objet avec .d
      if (typeof f[key] === "object" && f[key].d) { tradeTs = f[key].d; break; }
      // si c'est une string ISO
      if (typeof f[key] === "string" && f[key].includes("T")) { tradeTs = f[key]; break; }
    }
  }

  // 2) Si aucun champ "trade time" explicite, on prend l'horodatage le plus récent parmi tous les .d
  if (!tradeTs) {
    var latest = null;
    Object.keys(f).forEach(function(name){
      var v = f[name];
      if (v && typeof v === "object" && v.d) {
        if (!latest || new Date(v.d) > new Date(latest)) latest = v.d;
      }
    });
    tradeTs = latest || ts;
  }

  const out = { ok: !isNaN(price), price: isNaN(price) ? null : price, ts, tradeTs };
  return ContentService.createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}
