// api/gs.js
// Proxy simples para o Google Apps Script, evitando JSONP/CORS.
// Funciona na Vercel como Serverless Function.

export default async function handler(req, res) {
  try {
    // SUA URL DO APPS SCRIPT (mantida fixa aqui):
    const API_BASE = "https://script.google.com/macros/s/AKfycbwQKE1-rZjds0531to4Qb07rBYx_1WsxNwh6-5TVAtWuyu6824wRuPBqFG4C4f48Anx/exec";

    // Repassa a query string recebida (ex.: ?action=summary&startISO=...&endISO=...)
    const qs = req.url.includes("?") ? req.url.split("?")[1] : "";
    const url = `${API_BASE}${qs ? "?" + qs : ""}`;

    // Chama o Apps Script
    const r = await fetch(url, { method: "GET" });

    // Pode vir JSON puro (ContentService JSON) ou JSONP (callback(...))
    const text = await r.text();

    let data;
    const trimmed = text.trim();

    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      // JSON normal
      data = JSON.parse(trimmed);
    } else {
      // Tenta extrair JSON de JSONP: callback(...);
      const m = trimmed.match(/^[\w$]+\(([\s\S]*)\);\s*$/);
      if (m && m[1]) {
        data = JSON.parse(m[1]);
      } else {
        // Retorno inesperado
        data = { ok: false, error: "Resposta inesperada do Apps Script", raw: trimmed.slice(0, 2000) };
      }
    }

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(JSON.stringify(data));
  } catch (err) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.status(500).send(JSON.stringify({ ok: false, error: String(err) }));
  }
}
