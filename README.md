# ajanda

Bu repoda iki bağımsız statik site var; ikisi de GitHub Pages üzerinden yayınlanır:

| Site | Adres | Klasör |
|---|---|---|
| Ajanda (mevcut uygulama) | https://yurugagarin.github.io/ajanda/ | kök dizin (`index.html`, `store.js` …) |
| **Hisse Tez Takibi** | https://yurugagarin.github.io/ajanda/hisse/ | `hisse/` (arayüz), `pipeline/`, `config/`, `data/` |

Aşağısı Hisse Tez Takibi sitesini anlatır.

---

# Hisse Tez Takibi — kişisel karar destek aracı

> **Yatırım tavsiyesi değildir, kişisel karar destek aracıdır.**
> Site al/sat sinyali üretmez. Amaç: (1) tez bozulunca erken fark etmek, (2) bilançoyu
> kazanç kalitesi açısından okumak, (3) düşüşlerde önceden yazılmış kurallarla hareket etmek.

## Nasıl çalışır

```
GitHub Actions (hafta içi 05:00 UTC + elle tetikleme)
  └─ pipeline/run.py
       ├─ Fiyat: Yahoo Finance chart API (yedek: Stooq, Finnhub quote)
       ├─ SEC EDGAR: companyfacts (XBRL) → çeyreklik tablo → kazanç kalitesi   [yalnızca YENİ 10-Q/10-K'da]
       ├─ SEC EDGAR: 10-Q/10-K tam metin + kazanç basın bülteni → Claude dipnot analizi  [yalnızca YENİ dosyada]
       ├─ SEC EDGAR: Form 4 XML → insider analizi  (+ Finnhub çapraz kontrol)       [günlük, artımlı]
       ├─ Finnhub haberleri + Claude web search → son 7 günün en önemli 3 gelişmesi   [günlük]
       ├─ Claude web search → öncü sinyal radarı                                   [haftalık]
       ├─ Tez değerlendirmesi, çıkış kriterleri, kural takibi, sinyal kaydı, karne
       └─ Haftalık özet (Pazartesi çalışması haftayı kapatır + Claude okuması)
  └─ data/*.json commit'lenir → GitHub Pages yeniden derlenir
```

Tarayıcı tarafı `hisse/` klasöründeki sade HTML/CSS/JS'tir (framework yok, build yok).
Kişisel notların ve tema/sekme tercihlerin tarayıcında **localStorage**'da durur; sunucuya gitmez.

### Veri bütünlüğü kuralları (kodda uygulanır)
- **Sayılar modelin hafızasından gelmez.** Finansallar SEC XBRL'den deterministik hesaplanır
  (`pipeline/xbrl.py`, `pipeline/quality.py`). Türetilen değerler (ör. Q4 = yıllık − 9 ay,
  nakit akışı çeyreği = YTD farkı) sitede "türetilmiş" diye işaretlenir. Veri yoksa "veri yok" yazar.
- Claude'un her dipnot bulgusu için belgeden **birebir alıntı** istenir; alıntı SEC metninde
  otomatik aranır ve sitede ✓ doğrulandı / ✕ doğrulanamadı olarak gösterilir.
- Haber ve radar maddelerinin **kaynak linkleri**, web search sonuçlarında ya da Finnhub listesinde
  gerçekten geçmiyorsa otomatik elenir.
- Olgu (gri kutu, "OLGU") ile yorum (mor kutu, "YORUM") görsel olarak ayrılır.

## Kurulum

### 1. GitHub Secrets
Repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Zorunlu mu | Açıklama |
|---|---|---|
| `SEC_USER_AGENT` | **Evet** (SEC kuralı) | Format: `Emre Yilmaz email@adres`. Yoksa geçici bir UA kullanılır ve uyarı loglanır. |
| `ANTHROPIC_API_KEY` | Claude bölümleri için | Yoksa: dipnot analizi, şeytanın avukatı, radar, haber sıralaması, haftalık okuma çalışmaz; deterministik kısımlar çalışır. |
| `FINNHUB_API_KEY` | Önerilir | Ücretsiz katman yeterli. Yoksa: haber listesi, insider çapraz kontrolü ve Finnhub quote yedeği atlanır. |

Opsiyonel **Variable** (Secrets yanındaki *Variables* sekmesi): `CLAUDE_MODEL` — varsayılan `claude-sonnet-5`.

### 2. GitHub Pages
Repo zaten **public** ve Pages "Deploy from a branch → main / (root)" ile açık. Ek ayar gerekmez;
pipeline `data/` klasörünü `main`'e commit'ler ve Pages yeniden derlenir.

### 3. İlk çalıştırma
**Actions → Hisse analiz pipeline → Run workflow**. Seçenekler:
- `force_filings`: bilanço analizini yeni dosya olmasa da yeniden çalıştırır
- `force_radar`, `force_weekly`, `force_devil`: ilgili Claude adımlarını şimdi yeniden üretir
- `skip_llm`: Claude'u tamamen atlar (maliyet sıfır)
- `tickers`: sadece belirli hisseler (ör. `NVDA,AAOI`)

Her çalışmanın token kullanımı ve tahmini maliyeti: Actions özet sayfası, `data/usage.jsonl`
ve sitedeki **Sistem** sayfası.

## Yeni hisse eklemek

1. `config/stocks.yaml` → tek satır:
   ```yaml
   - {ticker: AMD, name: "Advanced Micro Devices", benchmarks: [QQQ, SMH]}
   ```
   CIK numarası SEC listesinden otomatik bulunur.
2. (Önerilir) `config/theses.yaml`'a tez bölümü ekle — yoksa sitede "tez yazılmamış" görünür:
   ```yaml
   AMD:
     onay: taslak
     ozet: "Tezin tek paragraf özeti"
     sutunlar:
       - {id: buyume, ad: "Gelir büyümesi", tip: metrik, metrik: revenue_yoy, operator: ">", esik: 20, uyari: 10}
       - {id: rekabet, ad: "Rekabet", tip: yorum, soru: "10-Q'da ... tezi destekliyor mu?"}
     cikis_kriterleri:
       - {id: daralma, ad: "Gelir 2 çeyrek üst üste daralırsa", metrik: revenue_yoy, operator: "<", esik: 0, ardisik_ceyrek: 2}
   ```
   Kullanılabilir metrikler dosyanın başındaki katalogda.
3. (Opsiyonel) `config/rules.yaml`'a kademeler ekle; yoksa `varsayilan` kullanılır.
4. Commit'le. `main`'e yapılan `config/**` değişikliği pipeline'ı otomatik tetikler.

## Tezleri onaylamak
`config/theses.yaml` ve `config/rules.yaml` içindeki her hisse `onay: taslak` ile başlar ve sitede
"Taslak — Emre onaylayacak" rozetiyle görünür. Eşikleri gözden geçirip `onay: onaylandi` yap.

## Maliyet kontrolü
- Bilanço analizi (en pahalı adım: 10-Q/10-K tam metni) sadece yeni dosya geldiğinde çalışır;
  işlenen dosyanın accession numarası `data/analysis/` içinde tutulur. SEC belgeleri Actions
  cache'inde (`.cache/`) saklanır, tekrar indirilmez; Form 4 sonuçları `data/cache/form4/`.
- Günlük çalışmada sadece fiyat, haber ve insider güncellenir.
- Web search kullanım üst sınırları: `config/settings.yaml → llm.max_searches`.

## Yerelde çalıştırma
```bash
pip install -r pipeline/requirements.txt
export SEC_USER_AGENT="Ad Soyad email@adres" FINNHUB_API_KEY=... ANTHROPIC_API_KEY=...
python pipeline/run.py            # veya SKIP_LLM=1 python pipeline/run.py
python -m http.server 8000        # → http://localhost:8000/hisse/
```

## Dosya yapısı
```
config/      stocks.yaml, theses.yaml (TASLAK), rules.yaml (TASLAK), settings.yaml
pipeline/    run.py (orkestratör), sec.py, xbrl.py, quality.py, insider.py, prices.py, finnhub.py,
             llm.py, filing_llm.py, news_radar.py, thesis.py, rules.py, signals.py, weekly.py
data/        summary.json, fundamentals/, analysis/, insider/, news/, radar/, thesis/, rules/,
             prices/, weekly/, signals.jsonl, scorecard.json, usage.jsonl, runs.json
hisse/       index.html, style.css, app.js, charts.js
.github/workflows/hisse.yml
```
