"""Pipeline orkestratörü.

Kullanım:
  python pipeline/run.py                  # günlük çalışma
  python pipeline/run.py --force-filings  # bilanço analizini yeni dosya olmasa da yeniden çalıştır
  python pipeline/run.py --force-radar --force-weekly
  python pipeline/run.py --tickers NVDA,META
  SKIP_LLM=1 python pipeline/run.py       # Claude adımları olmadan (maliyet sıfır)

Günlük çalışmada: fiyat, haber, insider güncellenir. Bilanço (XBRL + Claude
dipnot analizi + şeytanın avukatı) SADECE yeni 10-Q/10-K geldiğinde çalışır.
Radar haftada bir (settings.yaml: radar_every_days).
"""
from __future__ import annotations

import argparse
import datetime as dt
import sys
import time
import traceback
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import filing_llm  # noqa: E402
import insider as insider_mod  # noqa: E402
import news_radar  # noqa: E402
import prices  # noqa: E402
import quality  # noqa: E402
import rules  # noqa: E402
import sec  # noqa: E402
import signals  # noqa: E402
import thesis as thesis_mod  # noqa: E402
import weekly  # noqa: E402
import xbrl  # noqa: E402
from common import DATA, load_yaml, log, now_iso, read_json, setup_logging, today, write_json  # noqa: E402
from finnhub import Finnhub  # noqa: E402
from llm import LLM  # noqa: E402


class Run:
    def __init__(self, args):
        self.args = args
        self.id = dt.datetime.now(dt.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        self.errors: list[dict] = []
        self.steps: dict[str, dict] = {}

    def step(self, name, ticker, fn, *a, **kw):
        t0 = time.time()
        try:
            r = fn(*a, **kw)
            self.steps.setdefault(name, {"ok": 0, "hata": 0, "sure_sn": 0.0})["ok"] += 1
            return r
        except Exception as e:  # noqa: BLE001
            log.error("%s %s HATA: %s\n%s", name, ticker, e, traceback.format_exc())
            self.errors.append({"adim": name, "ticker": ticker, "hata": f"{type(e).__name__}: {e}"[:400]})
            self.steps.setdefault(name, {"ok": 0, "hata": 0, "sure_sn": 0.0})["hata"] += 1
            return None
        finally:
            self.steps.setdefault(name, {"ok": 0, "hata": 0, "sure_sn": 0.0})["sure_sn"] += round(time.time() - t0, 1)


def filings_map(cik: int, recent: list[dict]) -> dict:
    out = {}
    for f in recent:
        if f.get("form") in ("10-Q", "10-K", "10-Q/A", "10-K/A", "8-K"):
            out[f["accessionNumber"]] = {"form": f["form"], "filingDate": f["filingDate"],
                                         "reportDate": f.get("reportDate"),
                                         "url": sec.archive_url(cik, f["accessionNumber"], f.get("primaryDocument", "")),
                                         "index_url": sec.filing_index_url(cik, f["accessionNumber"])}
    return out


def fundamentals(run: Run, T: str, cik: int, recent: list[dict]) -> tuple[dict, bool]:
    """Yeni 10-Q/10-K varsa XBRL tablosunu ve kazanç kalitesini yeniden hesaplar."""
    path = DATA / "fundamentals" / f"{T}.json"
    old = read_json(path, {}) or {}
    periodic = sorted([f for f in recent if f.get("form") in ("10-Q", "10-K")], key=lambda f: f["filingDate"], reverse=True)
    latest = periodic[0] if periodic else None
    latest_accn = latest["accessionNumber"] if latest else None
    if old and old.get("son_dosya", {}).get("accn") == latest_accn and not run.args.force_filings \
            and not old.get("xbrl_beklemede"):
        log.info("%s: yeni 10-Q/10-K yok (%s) — bilanço analizi atlandı", T, latest_accn)
        return old, False
    cf = sec.companyfacts(cik)
    if not cf:
        raise RuntimeError("companyfacts alınamadı")
    table = xbrl.build_table(cf)
    fmap = filings_map(cik, recent)
    q = quality.analyze(table, fmap, cik, T)
    last_end = table["ceyrekler"][-1]["donem_sonu"] if table.get("ceyrekler") else None
    beklemede = bool(latest and latest.get("reportDate") and last_end and
                     last_end < (dt.date.fromisoformat(latest["reportDate"]) - dt.timedelta(days=5)).isoformat())
    obj = {
        "ticker": T, "cik": cik, "sirket": cf.get("entityName"), "guncelleme": now_iso(),
        "son_dosya": {"accn": latest_accn, "form": latest["form"] if latest else None,
                      "tarih": latest["filingDate"] if latest else None,
                      "donem_sonu": latest.get("reportDate") if latest else None,
                      "url": fmap.get(latest_accn, {}).get("url") if latest_accn else None},
        "xbrl_beklemede": beklemede,
        "tablo": table, "kalite": q,
        "dosyalar": [{"form": f["form"], "tarih": f["filingDate"], "donem_sonu": f.get("reportDate"),
                      "url": sec.archive_url(cik, f["accessionNumber"], f.get("primaryDocument", "")),
                      "accn": f["accessionNumber"]} for f in periodic[:12]],
        "kaynak": f"SEC XBRL companyfacts: https://data.sec.gov/api/xbrl/companyfacts/CIK{cik:010d}.json",
    }
    if beklemede:
        log.warning("%s: %s dosyalandı ama XBRL companyfacts henüz güncellenmemiş; yarın tekrar denenecek", T, latest_accn)
    write_json(path, obj)
    return obj, True


def main():
    setup_logging()
    ap = argparse.ArgumentParser()
    ap.add_argument("--force-filings", action="store_true")
    ap.add_argument("--force-radar", action="store_true")
    ap.add_argument("--force-weekly", action="store_true")
    ap.add_argument("--force-devil", action="store_true")
    ap.add_argument("--tickers", default="")
    args = ap.parse_args()
    run = Run(args)
    started = now_iso()

    settings = load_yaml("settings.yaml")
    stocks = load_yaml("stocks.yaml").get("stocks", [])
    theses = load_yaml("theses.yaml")
    rcfg = load_yaml("rules.yaml")
    for s in stocks:
        s["ticker"] = s["ticker"].upper()
        s.setdefault("name", s["ticker"])
        s.setdefault("benchmarks", settings.get("default_benchmarks", ["QQQ", "SMH"]))
    only = {t.strip().upper() for t in args.tickers.split(",") if t.strip()}
    active = [s for s in stocks if not only or s["ticker"] in only]

    llm = LLM(run.id)
    fh = Finnhub()
    lcfg = settings.get("llm", {})
    ms = lcfg.get("max_searches", {})

    # Konfigürasyonu siteye aktar
    write_json(DATA / "config.json", {"stocks": stocks, "theses": theses, "rules": rcfg,
                                      "settings": {k: v for k, v in settings.items() if k != "llm"},
                                      "model": llm.model, "guncelleme": now_iso()})

    # 1) Fiyatlar
    bench_syms = sorted({b for s in stocks for b in s["benchmarks"]} | {"QQQ"})
    pstats = {}
    for sym in [s["ticker"] for s in stocks] + bench_syms:
        p = run.step("fiyat", sym, prices.update, sym, fh)
        pstats[sym] = prices.stats(p or read_json(DATA / "prices" / f"{sym}.json", {}) or {})

    summary = {"guncelleme": now_iso(), "hisseler": {}, "benchmarklar": {b: pstats.get(b, {}) for b in bench_syms}}
    old_summary = read_json(DATA / "summary.json", {}) or {}

    for s in stocks:
        T = s["ticker"]
        if T not in {a["ticker"] for a in active}:
            if T in old_summary.get("hisseler", {}):
                summary["hisseler"][T] = old_summary["hisseler"][T]
            continue
        log.info("==== %s ====", T)
        th = theses.get(T)
        cik = run.step("cik", T, sec.cik_for, T)
        recent = []
        if cik:
            sub = run.step("submissions", T, sec.submissions, cik)
            recent = sec.recent_filings(sub) if sub else []
        # 2) Bilanço (sadece yeni dosyada)
        fund, is_new = (read_json(DATA / "fundamentals" / f"{T}.json", {}) or {}), False
        if cik and recent:
            r = run.step("bilanco_xbrl", T, fundamentals, run, T, cik, recent)
            if r:
                fund, is_new = r
        table = fund.get("tablo", {}) or {}
        # 3) Insider
        icache = run.step("insider_form4", T, insider_mod.update_cache, T, cik, recent) if cik and recent else None
        fh_ins = run.step("finnhub_insider", T, fh.insider, T) if fh.available else None
        ins = None
        if icache is not None:
            ins = run.step("insider_analiz", T, insider_mod.analyze, T, icache, settings.get("insider", {}),
                           pstats.get(T, {}), fh_ins)
            if ins:
                write_json(DATA / "insider" / f"{T}.json", ins)
        ins = ins or read_json(DATA / "insider" / f"{T}.json", {}) or {}
        # 4) Haberler (günlük)
        fh_news = (run.step("finnhub_haber", T, fh.news, T, settings.get("news", {}).get("lookback_days", 7)) or []) if fh.available else []
        nw = run.step("haber", T, news_radar.news, llm, T, s["name"], fh_news, th, settings.get("news", {}), ms.get("news", 3))
        if nw:
            write_json(DATA / "news" / f"{T}.json", nw)
        nw = nw or read_json(DATA / "news" / f"{T}.json", {}) or {}
        # 5) Radar (haftalık)
        rpath = DATA / "radar" / f"{T}.json"
        rd = read_json(rpath, {}) or {}
        age = None
        if rd.get("guncelleme"):
            age = (dt.datetime.now(dt.timezone.utc) - dt.datetime.fromisoformat(rd["guncelleme"])).days
        if llm.available and (args.force_radar or not rd or rd.get("hata") or age is None or age >= lcfg.get("radar_every_days", 7)):
            new_rd = run.step("radar", T, news_radar.radar, llm, T, s["name"], th, ms.get("radar", 6))
            if new_rd:
                rd = new_rd
                write_json(rpath, rd)
        elif not rd:
            rd = {"ticker": T, "sinyaller": [], "hata": "Claude devre dışı (ANTHROPIC_API_KEY yok) — radar çalışmadı.",
                  "uyari": "Bu bölüm gürültülüdür.", "guncelleme": now_iso()}
            write_json(rpath, rd)
        # 6) Claude bilanço analizi + şeytanın avukatı (yeni dosyada)
        apath = DATA / "analysis" / f"{T}.json"
        an = read_json(apath, {}) or {}
        latest_accn = (fund.get("son_dosya") or {}).get("accn")
        need = latest_accn and ((an.get("son") or {}).get("dosya", {}).get("accn") != latest_accn
                                or (an.get("son") or {}).get("hata") or args.force_filings)
        if llm.available and cik and need and not fund.get("xbrl_beklemede"):
            res = run.step("bilanco_claude", T, filing_llm.analyze_filing, llm, T, cik, recent, table, th)
            if res:
                if an.get("son") and not an["son"].get("hata") and an["son"]["dosya"]["accn"] != latest_accn:
                    hist = an.get("gecmis", [])
                    hist.insert(0, {"dosya": an["son"]["dosya"], "ozet": (an["son"].get("analiz") or {}).get("ozet"),
                                    "seytanin_avukati": an.get("seytanin_avukati")})
                    an["gecmis"] = hist[:8]
                an["son"] = res
                an["seytanin_avukati"] = None
                write_json(apath, an)
        # 7) Tez değerlendirmesi
        te = run.step("tez", T, thesis_mod.evaluate, T, th, table, an.get("son"), nw, rd) or {}
        if llm.available and th and (not an.get("seytanin_avukati") or (an.get("seytanin_avukati") or {}).get("hata")
                                     or args.force_devil) and table.get("ceyrekler"):
            da = run.step("seytanin_avukati", T, filing_llm.devils_advocate, llm, T, table, th, te,
                          nw.get("gelismeler", []), ms.get("devils_advocate", 3))
            if da:
                da["ceyrek"] = (fund.get("son_dosya") or {})
                an["seytanin_avukati"] = da
                write_json(apath, an)
        write_json(DATA / "thesis" / f"{T}.json", te)
        # 8) Kurallar
        bench = {b: pstats.get(b, {}) for b in s["benchmarks"]}
        re_ = run.step("kural", T, rules.evaluate, T, rcfg, pstats.get(T, {}), bench, te) or {}
        write_json(DATA / "rules" / f"{T}.json", re_)
        # 9) Sinyaller
        run.step("sinyal", T, signals.detect, T, te, re_, ins, fund.get("kalite"),
                 latest_accn if is_new or not read_json(DATA / "state.json", {}).get(T) else None,
                 pstats.get(T, {}), pstats.get("QQQ", {}))
        # Özet kartı
        kal = fund.get("kalite") or {}
        summary["hisseler"][T] = {
            "ticker": T, "ad": s["name"], "benchmarks": s["benchmarks"],
            "fiyat": pstats.get(T), "grafik": prices.spark(read_json(DATA / "prices" / f"{T}.json", {}) or {}, 365),
            "tez": {"genel": te.get("genel"), "onay": te.get("onay"),
                    "sutunlar": [{"id": p["id"], "ad": p["ad"], "durum": p["durum"], "deger": p.get("deger"),
                                  "birim": p.get("birim"), "tip": p.get("tip")} for p in te.get("sutunlar", [])],
                    "cikis_tetiklenen": [c["ad"] for c in te.get("cikis", []) if c["durum"] == "tetiklendi"]},
            "gelismeler": nw.get("gelismeler", [])[:3], "haber_yontem": nw.get("yontem"),
            "kural": {k: re_.get(k) for k in ("durum", "mesaj", "tetiklenen", "zirveden_uzaklik", "dusus_kaynagi",
                                              "dusus_kaynagi_aciklama", "kosul_saglaniyor")},
            "insider_uyarilar": ins.get("uyarilar", []),
            "bilanco": {"son_ceyrek": (kal.get("son_ceyrek") or {}).get("etiket"),
                        "kirmizi": sum(1 for b in kal.get("bulgular", []) if b["etiket"] == "kirmizi_bayrak"),
                        "dikkat": sum(1 for b in kal.get("bulgular", []) if b["etiket"] == "dikkat"),
                        "olumlu": sum(1 for b in kal.get("bulgular", []) if b["etiket"] == "olumlu"),
                        "son_dosya": fund.get("son_dosya"), "xbrl_beklemede": fund.get("xbrl_beklemede")},
        }

    # 10) Karne, haftalık özet, özet
    run.step("karne", None, signals.scorecard, settings.get("signals", {}).get("horizons_days", [30, 90, 180]))
    write_json(DATA / "summary.json", summary)
    run.step("haftalik", None, weekly.build, llm, stocks, summary, args.force_weekly)

    runs = read_json(DATA / "runs.json", []) or []
    rec = {"id": run.id, "baslangic": started, "bitis": now_iso(), "hisseler": [a["ticker"] for a in active],
           "llm_aktif": llm.available, "model": llm.model, "finnhub_aktif": fh.available,
           "sec_user_agent_tanimli": bool(__import__("os").environ.get("SEC_USER_AGENT")),
           "sec_istek": sec.sess.count, "token": llm.totals, "adimlar": run.steps, "hatalar": run.errors,
           "argumanlar": vars(args)}
    runs.insert(0, rec)
    write_json(DATA / "runs.json", runs[:120])
    log.info("Bitti. Hatalar: %d, LLM: %s", len(run.errors), llm.totals)


if __name__ == "__main__":
    main()
