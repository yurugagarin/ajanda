"""Günlük haber seçimi (Finnhub + Claude web search) ve haftalık öncü sinyal radarı."""
from __future__ import annotations

import datetime as dt

from common import now_iso, today
from llm import LLM, url_ok

SYSTEM_NEWS = """Sen bir buy-side analistisin. Uzun vadeli, tez odaklı bir yatırımcı için bir hissenin son 7 gündeki en önemli gelişmelerini seçiyorsun.
KURALLAR:
- Sadece verilen haber listesindeki veya web aramasında bulduğun haberleri kullan; her maddenin kaynak_url'si bunlardan biri olmalı (uydurma link otomatik elenir).
- Hafızandan sayı veya olay üretme. Haberde geçmeyen rakamı yazma.
- 'olgu' alanı sadece haberde yazanı söyler; 'yorum' alanı neden önemli olduğunu ve teze etkisini söyler. İkisini karıştırma.
- Fiyat hareketini tek başına haber sayma; nedeni olan şirket/sektör gelişmelerini seç.
- Al/sat tavsiyesi verme. Türkçe yaz."""

NEWS_FORMAT = """Yanıtını SADECE şu JSON formatında, ```json bloğu içinde ver:
{"gelismeler": [
  {"tarih": "YYYY-MM-DD", "baslik": "kısa Türkçe başlık", "olgu": "haberde ne yazıyor (1-2 cümle)",
   "yorum": "neden önemli / teze etkisi (1-2 cümle)", "sutun_id": "ilgili tez sütunu id'si veya null",
   "etki": "destekler|zayiflatir|notr", "onem": 1-5, "kaynak_url": "https://...", "kaynak_adi": "yayın adı"}
]}
En önemli en fazla {n} gelişmeyi önem sırasına göre ver. Önemli gelişme yoksa boş liste ver."""

SYSTEM_RADAR = """Sen bir 'öncü sinyal' araştırmacısısın. Finansal tablolara yansımadan ÖNCE ortaya çıkabilecek zayıf sinyalleri web aramasıyla tararsın.
KURALLAR:
- Her sinyal için mutlaka bir kaynak_url ver (sadece web aramasında gerçekten bulduğun sayfalar; uydurma link otomatik elenir).
- Güven seviyesini dürüst ver: tek kaynaklı söylenti/iş ilanı yorumu = dusuk; birden çok güvenilir kaynak = orta; resmi açıklama/belge = yuksek.
- Hafızandan sayı üretme. Bu bölümün gürültülü olduğunu bil; abartma.
- Türkçe yaz."""

RADAR_FORMAT = """Taranacak alanlar: (1) marka ve patent başvuruları, (2) uygulama mağazası hareketleri (sıralama, yorum, yeni uygulama), (3) yoğun işe alım alanları (iş ilanları), (4) konferans ve etkinlik gündemleri, (5) earnings call dilindeki değişimler (yönetimin vurguladığı/bıraktığı konular), (6) sektör ve tedarik zinciri haberleri (müşteri capex'i, tedarikçi/rakip sinyalleri).
Yanıtını SADECE şu JSON formatında, ```json bloğu içinde ver:
{"sinyaller": [
  {"kategori": "marka_patent|uygulama_magazasi|ise_alim|konferans|earnings_call_dili|sektor_tedarik",
   "sinyal": "ne gözlemlendi (olgu)", "yorum": "neyin öncüsü olabilir", "yon": "olumlu|olumsuz|belirsiz",
   "guven": "dusuk|orta|yuksek", "sutun_id": "ilgili tez sütunu id'si veya null",
   "tarih": "YYYY-MM-DD veya null", "kaynak_url": "https://..."}
]}
En fazla 8 sinyal. Bulamadığın kategori için sinyal uydurma."""


def pillar_list(thesis: dict | None) -> str:
    if not thesis:
        return "(tez yok)"
    return "\n".join(f"- {p['id']}: {p['ad']}" for p in thesis.get("sutunlar", []))


def news(llm: LLM, ticker: str, name: str, fh_news: list, thesis: dict | None, cfg: dict, max_searches: int) -> dict:
    lookback = cfg.get("lookback_days", 7)
    top_n = cfg.get("top_n", 3)
    cutoff = (today() - dt.timedelta(days=lookback)).isoformat()
    items = []
    seen = set()
    for n in sorted(fh_news, key=lambda x: -(x.get("datetime") or 0)):
        h = (n.get("headline") or "").strip()
        if not h or h.lower() in seen:
            continue
        seen.add(h.lower())
        d = dt.datetime.fromtimestamp(n.get("datetime") or 0, dt.timezone.utc).date().isoformat()
        if d < cutoff:
            continue
        items.append({"tarih": d, "baslik": h, "ozet": (n.get("summary") or "")[:400],
                      "kaynak_url": n.get("url"), "kaynak_adi": n.get("source")})
    items = items[:60]
    out = {"ticker": ticker, "guncelleme": now_iso(), "ham_haber_sayisi": len(items),
           "ham_haberler": items[:25], "gelismeler": [], "yontem": None}
    if llm.available:
        lst = "\n".join(f"[{i}] {x['tarih']} | {x['kaynak_adi']} | {x['baslik']} | {x['ozet'][:250]} | {x['kaynak_url']}"
                        for i, x in enumerate(items)) or "(Finnhub haberi yok)"
        user = f"""HİSSE: {ticker} ({name}) — Bugün: {today().isoformat()}
TEZ SÜTUNLARI:
{pillar_list(thesis)}

FINNHUB HABER LİSTESİ (son {lookback} gün):
{lst}

Listeyi değerlendir; eksik kalan önemli bir gelişme varsa en fazla {max_searches} web araması yap (son {lookback} gün).
{NEWS_FORMAT.replace('{n}', str(top_n))}"""
        res = llm.call("haber", ticker, SYSTEM_NEWS, user, max_tokens=6000, web_search=max_searches, effort="medium")
        if res["ok"]:
            allowed = set(res["urls"]) | {x["kaynak_url"] for x in items if x.get("kaynak_url")}
            kept, dropped = [], 0
            for g in (res["json"].get("gelismeler") or [])[:top_n]:
                if url_ok(g.get("kaynak_url", ""), allowed):
                    kept.append(g)
                else:
                    dropped += 1
            out["gelismeler"] = kept
            out["elenen_dogrulanamayan"] = dropped
            out["yontem"] = f"Claude ({llm.model}) + web search; kaynak linkleri doğrulandı"
            return out
        out["llm_hata"] = res["hata"]
    # Yedek: deterministik — en yeni N Finnhub başlığı (sıralama yok, yorum yok)
    out["gelismeler"] = [{"tarih": x["tarih"], "baslik": x["baslik"], "olgu": x["ozet"], "yorum": None,
                          "sutun_id": None, "etki": None, "onem": None, "kaynak_url": x["kaynak_url"],
                          "kaynak_adi": x["kaynak_adi"]} for x in items[:top_n]]
    out["yontem"] = "Claude yok: Finnhub'dan en yeni başlıklar (önem sıralaması yapılmadı)"
    return out


def radar(llm: LLM, ticker: str, name: str, thesis: dict | None, max_searches: int) -> dict:
    out = {"ticker": ticker, "guncelleme": now_iso(), "sinyaller": [],
           "uyari": "Bu bölüm gürültülüdür. Öncü sinyaller çoğu zaman yanlış alarm verir; tek başına karar dayanağı değildir."}
    if not llm.available:
        out["hata"] = "Claude devre dışı (ANTHROPIC_API_KEY yok) — radar çalışmadı."
        return out
    user = f"""HİSSE: {ticker} ({name}) — Bugün: {today().isoformat()} — son ~30 güne odaklan.
TEZ SÜTUNLARI:
{pillar_list(thesis)}
En fazla {max_searches} web araması yap.
{RADAR_FORMAT}"""
    res = llm.call("radar", ticker, SYSTEM_RADAR, user, max_tokens=8000, web_search=max_searches, effort="medium")
    if not res["ok"]:
        out["hata"] = res["hata"]
        return out
    kept, dropped = [], 0
    for s in res["json"].get("sinyaller") or []:
        if url_ok(s.get("kaynak_url", ""), res["urls"]):
            kept.append(s)
        else:
            dropped += 1
    out["sinyaller"] = kept
    out["elenen_dogrulanamayan"] = dropped
    out["model"] = llm.model
    return out
