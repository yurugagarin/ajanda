"""10-Q/10-K + kazanç basın bülteni metin analizi (Claude) ve şeytanın avukatı.

Sadece YENİ bir 10-Q/10-K geldiğinde çalışır (maliyet kontrolü).
Her bulgu için dosyadan birebir alıntı istenir ve alıntı kaynak metinde
aranarak doğrulanır; doğrulanamayanlar sitede işaretlenir.
"""
from __future__ import annotations

import json
import re

import sec
from common import log, now_iso
from llm import LLM, url_ok, verify_quote

MAX_DOC_CHARS = 600_000
MAX_PR_CHARS = 150_000


def S(props: dict, req: list | None = None) -> dict:
    return {"type": "object", "properties": props, "required": req or list(props), "additionalProperties": False}


STR = {"type": "string"}
BOOL = {"type": "boolean"}


def ENUM(*v):
    return {"type": "string", "enum": list(v)}


def ARR(x):
    return {"type": "array", "items": x}


KAYNAK_BELGE = ENUM("10-Q/10-K", "basin_bulteni", "onceki_basin_bulteni", "metrik_tablosu")

FILING_SCHEMA = S({
    "ozet": STR,
    "non_gaap": S({
        "aciklama_var": BOOL,
        "duzeltmeler": ARR(S({
            "kalem": STR, "tutar_metni": STR,
            "degerlendirme": ENUM("makul", "kari_iyi_gosteriyor", "belirsiz"),
            "gerekce": STR, "kanit_alinti": STR, "kaynak_belge": KAYNAK_BELGE})),
        "genel_yorum": STR}),
    "musteri_yogunlasmasi": S({
        "aciklama_var": BOOL, "detay": STR, "bolum": STR, "kanit_alinti": STR,
        "etiket": ENUM("kirmizi_bayrak", "dikkat", "olumlu", "bilgi")}),
    "organik_buyume": S({
        "satin_alma_var": BOOL, "detay": STR, "bolum": STR, "kanit_alinti": STR}),
    "guidance": S({
        "onceki_guidance": STR, "onceki_alinti": STR, "gerceklesen": STR, "gerceklesen_alinti": STR,
        "sonuc": ENUM("ustunde", "icinde", "altinda", "karsilastirilamaz"),
        "yeni_guidance": STR, "yeni_alinti": STR}),
    "dipnot_bulgulari": ARR(S({
        "etiket": ENUM("kirmizi_bayrak", "dikkat", "olumlu"),
        "baslik": STR, "aciklama": STR, "bolum": STR, "kanit_alinti": STR, "kaynak_belge": KAYNAK_BELGE})),
    "yorum_sutunlari": ARR(S({
        "id": STR, "durum": ENUM("yesil", "sari", "kirmizi", "veri_yok"),
        "gerekce": STR, "kanit_alinti": STR, "kaynak_belge": KAYNAK_BELGE})),
})

SYSTEM_FILING = """Sen deneyimli bir finansal tablo analisti ve kazanç kalitesi uzmanısın. Kullanıcı ileri seviye muhasebe bilgisine sahip bir controller; yüzeysel özet değil, eleştirel analiz istiyor.

KESİN KURALLAR:
1. Yalnızca sana verilen belgelerdeki (10-Q/10-K metni, kazanç basın bülteni, önceki çeyreğin basın bülteni) ve METRİK TABLOSU'ndaki sayıları kullan. Hafızandan HİÇBİR sayı üretme. Belgede yoksa "veri yok" yaz.
2. Her bulgu için `kanit_alinti` alanına ilgili belgeden BİREBİR (kelimesi kelimesine, 300 karakteri geçmeyen) bir alıntı koy. Alıntı otomatik olarak belgede aranacak; uydurma alıntı tespit edilir. Metrik tablosuna dayanan bulgularda kaynak_belge="metrik_tablosu" ve alıntı olarak tablodaki satırı yaz.
3. `bolum` alanına dipnot/bölüm başlığını yaz (ör. "Note 12 - Segment Information", "Item 2. MD&A - Liquidity").
4. Al/sat tavsiyesi verme. Olguyu ve yorumu ayır: `aciklama`/`gerekce` yorumdur, alıntı olgudur.
5. Non-GAAP değerlendirmesinde her düzeltme için: tekrarlayan bir maliyeti mi (ör. SBC, sürekli 'yeniden yapılanma') dışlıyor -> kari_iyi_gosteriyor; gerçekten tek seferlik/nakit dışı ve faaliyetle ilgisiz mi -> makul.
6. Türkçe yaz; kısa ve yoğun ol."""

DEVIL_SCHEMA_HINT = """Yanıtını SADECE aşağıdaki JSON formatında, ```json bloğu içinde ver:
{
 "en_guclu_arguman": "Bu hisseyi şimdi satmak için en güçlü argüman (2-4 paragraf, dürüst ve sert)",
 "destekleyen_olgular": [{"olgu": "...", "kaynak": "URL veya 'SEC XBRL: <metrik adı>'"}],
 "tezin_zayif_halkasi": "hangi sütun (id) en kırılgan ve neden",
 "argumani_curutecek_gostergeler": ["bu gerçekleşirse ayı tezi yanlış çıkar: ..."],
 "izlenecekler": ["..."]
}"""

SYSTEM_DEVIL = """Sen bu hisseye karşı pozisyon alan, dürüst ve titiz bir 'şeytanın avukatı'sın. Görevin, kullanıcının yatırım tezine karşı EN GÜÇLÜ argümanı kurmak. Yumuşatma, dengeleme yapma; ama uydurma da yapma.
KURALLAR:
- Sayılar yalnızca verilen METRİK TABLOSU'ndan veya web aramasında bulduğun ve linkini verdiğin kaynaklardan gelebilir. Hafızandan sayı yazma.
- Her olgunun yanında kaynak (URL veya 'SEC XBRL: metrik') olsun.
- Değerleme argümanı kullanacaksan çarpanları sadece bulduğun kaynaktan alıntıla.
- Al/sat komutu verme; argüman ve senaryo sun. Türkçe yaz."""


def _find_filings(recent: list[dict]) -> tuple[dict | None, list[dict]]:
    periodic = [f for f in recent if f.get("form") in ("10-Q", "10-K")]
    periodic.sort(key=lambda f: f["filingDate"], reverse=True)
    earnings8k = [f for f in recent if f.get("form") == "8-K" and "2.02" in (f.get("items") or "")]
    earnings8k.sort(key=lambda f: f["filingDate"], reverse=True)
    return (periodic[0] if periodic else None), earnings8k


def _exhibits(cik: int, accn: str) -> list[str]:
    items = sec.filing_files(cik, accn)
    names = [i["name"] for i in items if re.search(r"ex[-_]?99", i.get("name", ""), re.I)
             and i["name"].lower().endswith((".htm", ".html", ".txt"))]
    return sorted(names)[:2]


def _pr_text(cik: int, f8k: dict | None) -> tuple[str, list[dict]]:
    if not f8k:
        return "", []
    txt, refs = [], []
    for name in _exhibits(cik, f8k["accessionNumber"]):
        url = sec.archive_url(cik, f8k["accessionNumber"], name)
        h = sec.fetch_text(url)
        if h:
            t = sec.html_to_text(h)
            txt.append(f"--- {name} ---\n{t}")
            refs.append({"ad": name, "url": url, "tarih": f8k["filingDate"]})
    return ("\n\n".join(txt))[:MAX_PR_CHARS], refs


def metrics_text(table: dict, n: int = 8) -> str:
    rows = table.get("ceyrekler", [])[-n:]
    keys = ["revenue", "revenue_yoy", "gross_margin", "operating_income", "operating_margin", "net_income",
            "ocf", "capex", "fcf", "fcf_margin_ttm", "ocf_to_ni_ttm", "sbc_to_revenue_ttm", "diluted_shares",
            "diluted_shares_yoy", "ar", "dso", "inventory", "inventory_yoy", "dio", "deferred_revenue",
            "rpo", "rpo_yoy", "liquidity", "cash_runway_months", "interest_income", "pretax", "tax"]
    lines = ["| metrik | " + " | ".join(r.get("etiket", r["donem_sonu"]) for r in rows) + " |"]
    for k in keys:
        vals = []
        for r in rows:
            v = r.get(k)
            vals.append("—" if v is None else (f"{v:,.0f}" if abs(v) >= 1000 else f"{v}"))
        lines.append(f"| {k} | " + " | ".join(vals) + " |")
    return "\n".join(lines)


def analyze_filing(llm: LLM, ticker: str, cik: int, recent: list[dict], table: dict, thesis: dict) -> dict:
    latest, e8 = _find_filings(recent)
    if not latest:
        return {"hata": "10-Q/10-K bulunamadı"}
    accn = latest["accessionNumber"]
    url = sec.archive_url(cik, accn, latest["primaryDocument"])
    html = sec.fetch_text(url)
    if not html:
        return {"hata": f"Belge indirilemedi: {url}"}
    doc = sec.html_to_text(html)
    truncated = len(doc) > MAX_DOC_CHARS
    doc_used = doc[:MAX_DOC_CHARS]
    # bu döneme ait kazanç 8-K'sı: 10-Q'dan önceki 75 gün içinde
    cur8 = next((f for f in e8 if f["filingDate"] <= latest["filingDate"]
                 and f["filingDate"] >= _minus(latest["filingDate"], 75)), None)
    prev8 = next((f for f in e8 if cur8 and f["filingDate"] < _minus(cur8["filingDate"], 40)), None)
    pr, pr_refs = _pr_text(cik, cur8)
    prev_pr, prev_refs = _pr_text(cik, prev8)

    pillars = [p for p in (thesis or {}).get("sutunlar", []) if p.get("tip") == "yorum"]
    pillar_txt = "\n".join(f"- id={p['id']}: {p['ad']} — {p.get('soru','').strip()}" for p in pillars) or "(yok)"
    user = f"""HİSSE: {ticker}
DOSYA: {latest['form']} — dönem sonu {latest.get('reportDate')} — dosyalama {latest['filingDate']}

TEZ ÖZETİ (kullanıcının): {(thesis or {}).get('ozet','(tez yok)')}

YORUM GEREKTİREN TEZ SÜTUNLARI (yorum_sutunlari alanında her biri için durum ver):
{pillar_txt}

METRİK TABLOSU (SEC XBRL companyfacts'tan hesaplandı; USD, %, gün):
{metrics_text(table)}

GÖREVLER:
1) Non-GAAP mutabakatını (basın bülteninde) eleştirel değerlendir.
2) Dipnotlarda müşteri yoğunlaşması açıklamasını bul.
3) Satın almaların büyümeye katkısı (organik/inorganik ayrımı) — işletme birleşmeleri dipnotu.
4) Önceki çeyrek basın bültenindeki guidance ile bu çeyrek gerçekleşeni karşılaştır; yeni guidance'ı yaz.
5) Dipnotlardan kazanç kalitesiyle ilgili 3-8 bulgu çıkar (gelir tanıma, stok değer düşüklüğü, alım taahhütleri, türevler/warrant, vergi, ilişkili taraf, dava, borç/convertible, segment). Her biri kırmızı_bayrak/dikkat/olumlu.
6) Yorum sütunlarını değerlendir.

=== BELGE 1: {latest['form']} TAM METİN{' (UYARI: belge ' + str(MAX_DOC_CHARS) + ' karakterde kesildi)' if truncated else ''} ===
{doc_used}

=== BELGE 2: BU ÇEYREĞİN KAZANÇ BASIN BÜLTENİ (8-K EX-99) ===
{pr or '(bulunamadı)'}

=== BELGE 3: ÖNCEKİ ÇEYREĞİN KAZANÇ BASIN BÜLTENİ (guidance için) ===
{prev_pr or '(bulunamadı)'}
"""
    res = llm.call("bilanco_analizi", ticker, SYSTEM_FILING, user, max_tokens=24000, schema=FILING_SCHEMA, effort="high")
    out = {
        "dosya": {"accn": accn, "form": latest["form"], "donem_sonu": latest.get("reportDate"),
                  "tarih": latest["filingDate"], "url": url, "index_url": sec.filing_index_url(cik, accn),
                  "kesildi": truncated, "karakter": len(doc)},
        "basin_bulteni": pr_refs, "onceki_basin_bulteni": prev_refs,
        "model": llm.model, "guncelleme": now_iso(),
    }
    if not res["ok"]:
        out["hata"] = res["hata"]
        return out
    a = res["json"]
    sources = {"10-Q/10-K": doc, "basin_bulteni": pr, "onceki_basin_bulteni": prev_pr,
               "metrik_tablosu": metrics_text(table)}
    alltext = "\n".join(sources.values())

    def chk(item, qkey="kanit_alinti", skey="kaynak_belge"):
        q = item.get(qkey, "")
        src = sources.get(item.get(skey, ""), alltext) or alltext
        item[qkey + "_dogrulandi"] = verify_quote(q, src) or verify_quote(q, alltext)

    for d in a.get("non_gaap", {}).get("duzeltmeler", []):
        chk(d)
    for d in a.get("dipnot_bulgulari", []):
        chk(d)
    for d in a.get("yorum_sutunlari", []):
        chk(d)
    for k in ("musteri_yogunlasmasi", "organik_buyume"):
        if a.get(k):
            a[k]["kanit_alinti_dogrulandi"] = verify_quote(a[k].get("kanit_alinti", ""), alltext)
    g = a.get("guidance") or {}
    for k in ("onceki_alinti", "gerceklesen_alinti", "yeni_alinti"):
        g[k + "_dogrulandi"] = verify_quote(g.get(k, ""), alltext)
    out["analiz"] = a
    return out


def devils_advocate(llm: LLM, ticker: str, table: dict, thesis: dict, thesis_eval: dict | None,
                    news: list, max_searches: int) -> dict:
    status = ""
    if thesis_eval:
        status = "\n".join(f"- {s['id']} ({s['ad']}): {s['durum']} — değer {s.get('deger')}"
                           for s in thesis_eval.get("sutunlar", []))
    news_txt = "\n".join(f"- {n.get('tarih','')}: {n.get('baslik','')} ({n.get('kaynak_url','')})" for n in news[:8])
    user = f"""HİSSE: {ticker}
KULLANICININ TEZİ: {(thesis or {}).get('ozet','(tez yok)')}
TEZ SÜTUNLARININ GÜNCEL DURUMU:
{status or '(değerlendirilmedi)'}

METRİK TABLOSU (SEC XBRL):
{metrics_text(table)}

SON HABERLER:
{news_txt or '(yok)'}

Görev: "Bu hisseyi şimdi satmak için en güçlü argüman nedir?" Gerekirse en fazla {max_searches} web araması yap (değerleme, rekabet, müşteri capex'i, regülasyon).
{DEVIL_SCHEMA_HINT}"""
    res = llm.call("seytanin_avukati", ticker, SYSTEM_DEVIL, user, max_tokens=8000,
                   web_search=max_searches, effort="high")
    if not res["ok"]:
        return {"hata": res["hata"], "guncelleme": now_iso()}
    d = res["json"]
    for o in d.get("destekleyen_olgular", []):
        k = o.get("kaynak", "")
        if k.startswith("http"):
            o["kaynak_dogrulandi"] = url_ok(k, res["urls"])
        else:
            o["kaynak_dogrulandi"] = k.startswith("SEC XBRL")
    d["guncelleme"] = now_iso()
    d["model"] = llm.model
    return d


def _minus(date: str, days: int) -> str:
    import datetime as dt
    return (dt.date.fromisoformat(date) - dt.timedelta(days=days)).isoformat()
