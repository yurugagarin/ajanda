"""Anthropic API sarmalayıcısı: model seçimi, web search, pause_turn, token/maliyet logu.

- Model: CLAUDE_MODEL ortam değişkeni; yoksa config/settings.yaml (varsayılan claude-sonnet-5).
- Her çağrının kullanımı data/usage.jsonl dosyasına yazılır.
- Web search sonuçlarındaki URL'ler toplanır; modelin döndürdüğü her kaynak linki
  bu kümeye karşı doğrulanır (uydurma link engeli).
"""
from __future__ import annotations

import json
import os
import re

from common import DATA, append_jsonl, load_yaml, log, now_iso

try:
    import anthropic
except ImportError:  # pragma: no cover
    anthropic = None


class LLM:
    def __init__(self, run_id: str):
        self.run_id = run_id
        st = load_yaml("settings.yaml").get("llm", {})
        self.settings = st
        self.model = os.environ.get("CLAUDE_MODEL", "").strip() or st.get("default_model", "claude-sonnet-5")
        self.ws_tool = os.environ.get("WEB_SEARCH_TOOL", "").strip() or st.get("web_search_tool", "web_search_20260318")
        key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
        self.available = bool(key) and anthropic is not None and os.environ.get("SKIP_LLM") != "1"
        self.client = anthropic.Anthropic(max_retries=3, timeout=600) if self.available else None
        if not self.available:
            log.warning("ANTHROPIC_API_KEY yok veya SKIP_LLM=1: Claude adımları atlanacak.")
        self.totals = {"cagri": 0, "input_tokens": 0, "output_tokens": 0, "cache_read": 0,
                       "cache_write": 0, "web_search": 0, "tahmini_maliyet_usd": 0.0}

    # ------------------------------------------------------------------
    def _cost(self, u: dict) -> float:
        pr = self.settings.get("prices_per_mtok", {}).get(self.model)
        if not pr:
            pr = {"input": 2.0, "output": 10.0}
        c = (u["input_tokens"] * pr["input"] + u["output_tokens"] * pr["output"]
             + u["cache_write"] * pr["input"] * 1.25 + u["cache_read"] * pr["input"] * 0.1) / 1e6
        c += u["web_search"] * self.settings.get("web_search_usd_per_1000", 10.0) / 1000
        return round(c, 5)

    def _log(self, task: str, ticker: str | None, resp, note: str = ""):
        us = resp.usage
        stu = getattr(us, "server_tool_use", None)
        u = {
            "input_tokens": getattr(us, "input_tokens", 0) or 0,
            "output_tokens": getattr(us, "output_tokens", 0) or 0,
            "cache_read": getattr(us, "cache_read_input_tokens", 0) or 0,
            "cache_write": getattr(us, "cache_creation_input_tokens", 0) or 0,
            "web_search": (getattr(stu, "web_search_requests", 0) or 0) if stu else 0,
        }
        cost = self._cost(u)
        rec = {"zaman": now_iso(), "calisma": self.run_id, "gorev": task, "ticker": ticker,
               "model": getattr(resp, "model", self.model), "stop_reason": resp.stop_reason, **u,
               "tahmini_maliyet_usd": cost, "not": note}
        append_jsonl(DATA / "usage.jsonl", rec)
        self.totals["cagri"] += 1
        for k in ("input_tokens", "output_tokens", "cache_read", "cache_write", "web_search"):
            self.totals[k] += u[k]
        self.totals["tahmini_maliyet_usd"] = round(self.totals["tahmini_maliyet_usd"] + cost, 5)
        log.info("LLM %s %s: in=%s out=%s ws=%s ~$%.4f", task, ticker, u["input_tokens"], u["output_tokens"],
                 u["web_search"], cost)

    # ------------------------------------------------------------------
    def call(self, task: str, ticker: str | None, system: str, user: str | list, *,
             max_tokens: int = 16000, schema: dict | None = None, web_search: int = 0,
             effort: str | None = None) -> dict:
        """Döner: {'text': str, 'json': obj|None, 'urls': set, 'ok': bool, 'hata': str|None}"""
        if not self.available:
            return {"ok": False, "hata": "Claude devre dışı (API anahtarı yok)", "text": "", "json": None, "urls": set()}
        tools = []
        if web_search:
            tools.append({"type": self.ws_tool, "name": "web_search", "max_uses": int(web_search)})
        kwargs = dict(model=self.model, max_tokens=max_tokens,
                      system=[{"type": "text", "text": system, "cache_control": {"type": "ephemeral"}}])
        oc = {}
        if effort:
            oc["effort"] = effort
        if schema is not None:
            oc["format"] = {"type": "json_schema", "schema": schema}
        if oc:
            kwargs["output_config"] = oc
        if tools:
            kwargs["tools"] = tools
        messages = [{"role": "user", "content": user}]
        blocks = []
        resp = None
        try:
            for _ in range(6):  # pause_turn devamları
                resp = self._stream(messages=messages, **kwargs)
                self._log(task, ticker, resp)
                blocks.extend(resp.content)
                if resp.stop_reason == "pause_turn":
                    messages = messages + [{"role": "assistant", "content": resp.content}]
                    continue
                break
        except Exception as e:  # noqa: BLE001
            msg = str(e)
            if tools and self.ws_tool != "web_search_20250305" and "web_search" in msg:
                log.warning("Web search aracı %s reddedildi, web_search_20250305 deneniyor: %s", self.ws_tool, msg[:200])
                self.ws_tool = "web_search_20250305"
                return self.call(task, ticker, system, user, max_tokens=max_tokens, schema=schema,
                                 web_search=web_search, effort=effort)
            log.error("LLM %s %s hata: %s", task, ticker, msg[:500])
            return {"ok": False, "hata": msg[:300], "text": "", "json": None, "urls": set()}

        if resp is not None and resp.stop_reason == "refusal":
            return {"ok": False, "hata": "Model yanıtı reddetti (refusal)", "text": "", "json": None, "urls": set()}
        text_parts, urls = [], set()
        for b in blocks:
            d = b.model_dump() if hasattr(b, "model_dump") else dict(b)
            _collect_urls(d, urls)
            if d.get("type") == "text":
                text_parts.append(d.get("text", ""))
        text = "".join(text_parts)
        obj = None
        if schema is not None:
            obj = _parse_json(text_parts[-1] if text_parts else "")
        else:
            obj = _parse_json(text)
        ok = obj is not None
        if resp is not None and resp.stop_reason == "max_tokens":
            log.warning("LLM %s %s max_tokens'a ulaştı", task, ticker)
        return {"ok": ok, "hata": None if ok else "JSON ayrıştırılamadı", "text": text, "json": obj, "urls": urls}

    def _stream(self, **kw):
        with self.client.messages.stream(**kw) as s:
            return s.get_final_message()


def _collect_urls(node, acc: set):
    if isinstance(node, dict):
        t = node.get("type")
        if t in ("web_search_result", "web_search_result_location", "char_location") and node.get("url"):
            acc.add(node["url"])
        for v in node.values():
            _collect_urls(v, acc)
    elif isinstance(node, list):
        for v in node:
            _collect_urls(v, acc)


def _parse_json(text: str):
    if not text:
        return None
    m = re.findall(r"```(?:json)?\s*(\{.*?\}|\[.*?\])\s*```", text, re.S)
    cands = list(reversed(m)) + [text.strip()]
    # son çare: ilk { ile son } arası
    i, j = text.find("{"), text.rfind("}")
    if i != -1 and j > i:
        cands.append(text[i:j + 1])
    for c in cands:
        try:
            return json.loads(c)
        except (json.JSONDecodeError, TypeError):
            continue
    return None


def norm_url(u: str) -> str:
    u = (u or "").strip().rstrip("/").lower()
    u = re.sub(r"^https?://(www\.)?", "", u)
    return u.split("#")[0]


def url_ok(u: str, allowed: set) -> bool:
    if not u:
        return False
    n = norm_url(u)
    allowed_n = {norm_url(a) for a in allowed}
    if n in allowed_n:
        return True
    # sorgu parametresi farkı toleransı
    base = n.split("?")[0]
    return any(a.split("?")[0] == base for a in allowed_n)


def verify_quote(quote: str, source: str) -> bool:
    """Alıntının kaynak metinde geçip geçmediğini (boşluk/noktalama toleranslı) kontrol eder."""
    if not quote or not source:
        return False

    def n(s):
        s = s.lower().replace("’", "'").replace("“", '"').replace("”", '"').replace("—", "-").replace("–", "-")
        s = re.sub(r"[^a-z0-9%$.,'\-]+", " ", s)
        return re.sub(r"\s+", " ", s).strip()

    q, src = n(quote), n(source)
    if len(q) < 12:
        return False
    if q in src:
        return True
    # uzun alıntılarda parçalı doğrulama (ilk ve son 60 karakter)
    if len(q) > 140:
        return q[:60] in src and q[-60:] in src
    return False
