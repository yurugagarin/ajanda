"""Haftalık özet: günlük toplanan verinin haftalık derlemesi + (Pazartesi) Claude okuması."""
from __future__ import annotations

import datetime as dt

from common import DATA, now_iso, read_json, read_jsonl, today, write_json
from llm import LLM

SYSTEM_WEEKLY = """Sen uzun vadeli, haftalık DCA yapan bir yatırımcının haftalık okuma notunu yazıyorsun. Kullanıcı controller; muhasebe bilgisi ileri seviye.
KURALLAR:
- SADECE verilen JSON verisindeki olgu ve sayıları kullan. Yeni sayı, olay veya kaynak ekleme; web araması yok.
- Al/sat komutu verme. Tez durumu, riskler ve önceden yazılmış kurallar açısından ne değişti, onu söyle.
- Fiyat hareketi ile tez durumunu ayrı tut.
- Kısa ve yoğun yaz (hisse başına en fazla 3 cümle + genel 2-3 cümle). Türkçe.
Yanıtını SADECE şu JSON formatında ```json bloğu içinde ver:
{"genel": "...", "hisseler": {"TICKER": "..."}, "bu_hafta_okunacaklar": ["..."]}"""


def week_label(d: dt.date) -> tuple[str, dt.date, dt.date]:
    y, w, _ = d.isocalendar()
    start = d - dt.timedelta(days=d.weekday())
    return f"{y}-W{w:02d}", start, start + dt.timedelta(days=6)


def build(llm: LLM, tickers: list[dict], summary: dict, force_llm: bool = False) -> dict:
    ref = today() - dt.timedelta(days=1)  # Pazartesi 05:00 çalışması önceki haftayı kapatır
    label, ws, we = week_label(ref)
    kapanis = today().weekday() == 0  # Pazartesi: hafta kapanış raporu
    path = DATA / "weekly" / f"{label}.json"
    prev = read_json(path, {}) or {}
    sigs = [s for s in read_jsonl(DATA / "signals.jsonl") if ws.isoformat() <= s["tarih"] <= (we + dt.timedelta(days=1)).isoformat()]
    per = []
    for t in tickers:
        T = t["ticker"]
        s = summary["hisseler"].get(T, {})
        ins = read_json(DATA / "insider" / f"{T}.json", {}) or {}
        week_tx = [r for r in ins.get("son_islemler", []) if ws.isoformat() <= r["tarih"] <= we.isoformat()]
        codes = {}
        for r in week_tx:
            if r["turev"]:
                continue
            codes.setdefault(r["kod"], 0)
            codes[r["kod"]] += 1
        an = read_json(DATA / "analysis" / f"{T}.json", {}) or {}
        new_filing = None
        d = (an.get("son") or {}).get("dosya") or {}
        if d.get("tarih") and ws.isoformat() <= d["tarih"] <= we.isoformat():
            new_filing = d
        radar = read_json(DATA / "radar" / f"{T}.json", {}) or {}
        news = read_json(DATA / "news" / f"{T}.json", {}) or {}
        per.append({
            "ticker": T, "ad": t.get("name"),
            "fiyat": s.get("fiyat"), "haftalik_degisim": s.get("fiyat", {}).get("degisim_1h") if s.get("fiyat") else None,
            "benchmark_haftalik": {b: (summary["benchmarklar"].get(b) or {}).get("degisim_1h") for b in t.get("benchmarks", [])},
            "tez": s.get("tez"), "kural": s.get("kural"),
            "insider_hafta": {"kodlar": codes, "islem": len(week_tx)},
            "insider_uyarilar": ins.get("uyarilar", []),
            "yeni_bilanco": new_filing,
            "gelismeler": news.get("gelismeler", [])[:3],
            "radar": [x for x in radar.get("sinyaller", []) if x.get("guven") in ("orta", "yuksek")][:3],
            "sinyaller": [x for x in sigs if x["ticker"] == T],
        })
    out = {"hafta": label, "baslangic": ws.isoformat(), "bitis": we.isoformat(), "guncelleme": now_iso(),
           "durum": "kapanis" if kapanis else "devam_ediyor", "hisseler": per, "sinyaller": sigs,
           "okuma": prev.get("okuma")}
    need = llm.available and (kapanis or force_llm or not prev.get("okuma"))
    if need:
        import json
        compact = [{k: v for k, v in h.items() if k not in ("insider_uyarilar",)} for h in per]
        res = llm.call("haftalik_ozet", None, SYSTEM_WEEKLY,
                       f"HAFTA {label} ({ws}–{we}) VERİSİ:\n```json\n{json.dumps(compact, ensure_ascii=False, default=str)[:120000]}\n```",
                       max_tokens=4000, effort="medium")
        if res["ok"]:
            out["okuma"] = {**res["json"], "model": llm.model, "guncelleme": now_iso(),
                            "not": "YORUM — yalnızca bu sayfadaki verilerden üretildi."}
    write_json(path, out)
    idx = read_json(DATA / "weekly" / "index.json", []) or []
    if label not in idx:
        idx.append(label)
    idx = sorted(idx)[-104:]
    write_json(DATA / "weekly" / "index.json", idx)
    return out
