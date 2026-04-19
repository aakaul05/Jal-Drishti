from __future__ import annotations

import asyncio
import os
import time
from typing import Any

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

# Load .env from project root
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

SUPABASE_URL = (os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL") or "").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY") or ""
OLLAMA_URL = "http://localhost:11434/api/generate"

print(f"DEBUG: SUPABASE_URL loaded: {bool(SUPABASE_URL)}")
print(f"DEBUG: SUPABASE_KEY loaded: {bool(SUPABASE_KEY)}")
print(f"DEBUG: Using local Ollama AI (free!)")


def _headers() -> dict[str, str]:
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    }


app = FastAPI(title="Jal-Drishti API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═══════════════════════════════════════════════════════════════════════════
# IN-MEMORY CACHE (5 min TTL)
# ═══════════════════════════════════════════════════════════════════════════

_cache: dict[str, tuple[float, Any]] = {}
CACHE_TTL = 300


def _get_cached(key: str):
    entry = _cache.get(key)
    if entry and (time.time() - entry[0]) < CACHE_TTL:
        return entry[1]
    return None


def _set_cached(key: str, value: Any):
    _cache[key] = (time.time(), value)


# ═══════════════════════════════════════════════════════════════════════════
# HEALTH
# ═══════════════════════════════════════════════════════════════════════════

@app.get("/api/health")
def health_check():
    return {"status": "ok", "supabase_url": SUPABASE_URL or "NOT SET"}


@app.get("/api/debug/district-count")
def debug_district_count():
    """Debug endpoint to check total districts and records."""
    try:
        all_districts = set()
        offset = 0
        batch_size = 1000
        total_fetched = 0

        while True:
            resp = httpx.get(
                f"{SUPABASE_URL}/rest/v1/groundwater_cleaned_final",
                params={"select": "district", "order": "district", "limit": str(batch_size), "offset": str(offset)},
                headers=_headers(),
                timeout=30,
            )
            resp.raise_for_status()
            data = resp.json()
            if not data:
                break
            for item in data:
                if item.get("district") and item["district"].strip():
                    all_districts.add(item["district"].strip())
            total_fetched += len(data)
            if len(data) < batch_size:
                break
            offset += batch_size

        return {
            "total_records_fetched": total_fetched,
            "total_unique_districts": len(all_districts),
            "all_districts_sorted": sorted(list(all_districts)),
            "sample_first_20": sorted(list(all_districts))[:20],
            "sample_last_20": sorted(list(all_districts))[-20:],
        }
    except Exception as e:
        return {"error": str(e)}


# ═══════════════════════════════════════════════════════════════════════════
# LOCATION ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════

@app.get("/api/cleaned/districts")
def get_cleaned_districts():
    cached = _get_cached("districts")
    if cached is not None:
        return cached

    all_names = set()
    offset = 0
    batch_size = 1000

    while True:
        resp = httpx.get(
            f"{SUPABASE_URL}/rest/v1/groundwater_cleaned_final",
            params={"select": "district", "order": "district", "limit": str(batch_size), "offset": str(offset)},
            headers=_headers(),
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        if not data:
            break
        for item in data:
            if item.get("district") and item["district"].strip():
                all_names.add(item["district"].strip())
        if len(data) < batch_size:
            break
        offset += batch_size

    all_names = sorted(all_names)
    main_districts = set()
    for name in all_names:
        if ' ' not in name or name == 'Chhatrapati Sambhajinagar':
            main_districts.add(name)
        else:
            first_word = name.split()[0]
            if first_word not in ['Bhadrawati', 'Brahmapuri', 'Chikhaldara', 'Gondpipri', 'Nagbhid', 'Sindewahi']:
                main_districts.add(first_word)

    final_districts = sorted(main_districts)
    result = [{"district_code": i + 1, "district_name": d} for i, d in enumerate(final_districts)]
    _set_cached("districts", result)
    return result


@app.get("/api/cleaned/blocks/{district_name}")
def get_cleaned_blocks(district_name: str):
    cache_key = f"blocks:{district_name}"
    cached = _get_cached(cache_key)
    if cached is not None:
        return cached

    all_blocks = set()
    offset = 0
    batch_size = 1000

    while True:
        resp = httpx.get(
            f"{SUPABASE_URL}/rest/v1/groundwater_cleaned_final",
            params={"select": "block", "district": f"eq.{district_name}", "order": "block", "limit": str(batch_size), "offset": str(offset)},
            headers=_headers(),
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        if not data:
            break
        for item in data:
            if item.get("block") and item["block"].strip():
                all_blocks.add(item["block"].strip())
        if len(data) < batch_size:
            break
        offset += batch_size

    blocks = sorted(all_blocks)
    result = [{"subdistrict_code": i + 1, "subdistrict_name": b, "district_name": district_name} for i, b in enumerate(blocks)]
    _set_cached(cache_key, result)
    return result


@app.get("/api/cleaned/villages/{district_name}/{block_name}")
def get_cleaned_villages(district_name: str, block_name: str):
    cache_key = f"villages:{district_name}:{block_name}"
    cached = _get_cached(cache_key)
    if cached is not None:
        return cached

    all_villages = []
    offset = 0
    batch_size = 1000

    while True:
        resp = httpx.get(
            f"{SUPABASE_URL}/rest/v1/groundwater_cleaned_final",
            params={"select": "id,village", "district": f"eq.{district_name}", "block": f"eq.{block_name}", "order": "village", "limit": str(batch_size), "offset": str(offset)},
            headers=_headers(),
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        if not data:
            break
        for item in data:
            if item.get("village") and item["village"].strip():
                all_villages.append({
                    "village_code": item["id"],
                    "village_name": item["village"],
                    "subdistrict_name": block_name,
                    "district_name": district_name,
                })
        if len(data) < batch_size:
            break
        offset += batch_size

    _set_cached(cache_key, all_villages)
    return all_villages


@app.get("/api/cleaned/search")
def search_villages(q: str = Query(..., min_length=1)):
    cache_key = f"search:{q.lower()}"
    cached = _get_cached(cache_key)
    if cached is not None:
        return cached

    all_results = []
    offset = 0
    batch_size = 1000
    max_results = 100

    while len(all_results) < max_results:
        resp = httpx.get(
            f"{SUPABASE_URL}/rest/v1/groundwater_cleaned_final",
            params={"select": "id,village,district,block", "village": f"ilike.*{q}*", "order": "village", "limit": str(min(batch_size, max_results - len(all_results))), "offset": str(offset)},
            headers=_headers(),
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        if not data:
            break
        for item in data:
            if item.get("village") and item["village"].strip():
                all_results.append({
                    "village_code": item["id"],
                    "village_name": item["village"],
                    "district_name": item.get("district", ""),
                    "block_name": item.get("block", ""),
                })
        if len(data) < batch_size or len(all_results) >= max_results:
            break
        offset += batch_size

    _set_cached(cache_key, all_results)
    return all_results


# ═══════════════════════════════════════════════════════════════════════════
# HISTORICAL DATA
# ═══════════════════════════════════════════════════════════════════════════

HISTORY_YEARS = list(range(2014, 2024))
HISTORY_MONTHS = ["jan", "may", "aug", "nov"]


@app.get("/api/cleaned/history/{village_id}")
def get_village_history(village_id: int):
    cache_key = f"history:{village_id}"
    cached = _get_cached(cache_key)
    if cached is not None:
        return cached

    resp = httpx.get(
        f"{SUPABASE_URL}/rest/v1/groundwater_cleaned_final",
        params={"select": "*", "id": f"eq.{village_id}"},
        headers=_headers(),
        timeout=15,
    )
    resp.raise_for_status()
    data = resp.json()
    if not data:
        raise HTTPException(status_code=404, detail=f"Village {village_id} not found")

    row = data[0]
    history = []
    for year in HISTORY_YEARS:
        depths = []
        for month in HISTORY_MONTHS:
            val = row.get(f"y{year}_{month}")
            if val is not None:
                depths.append(float(val))
        if depths:
            history.append({"year": year, "avg_depth": round(sum(depths) / len(depths), 2)})

    result = {
        "village_id": village_id,
        "village": row.get("village", ""),
        "district": row.get("district", ""),
        "block": row.get("block", ""),
        "history": history,
    }
    _set_cached(cache_key, result)
    return result


# ═══════════════════════════════════════════════════════════════════════════
# PREDICTIONS
# ═══════════════════════════════════════════════════════════════════════════

@app.get("/api/predictions/{village_name}")
def get_predictions(village_name: str):
    cache_key = f"predictions:{village_name}"
    cached = _get_cached(cache_key)
    if cached is not None:
        return cached

    resp = httpx.get(
        f"{SUPABASE_URL}/rest/v1/groundwater_predictions",
        params={"select": "*", "village": f"eq.{village_name}", "order": "season"},
        headers=_headers(),
        timeout=15,
    )
    resp.raise_for_status()
    data = resp.json()
    if not data:
        raise HTTPException(status_code=404, detail=f"No predictions for '{village_name}'")

    result = {
        "village": village_name,
        "district": data[0].get("district", ""),
        "block": data[0].get("block", ""),
        "predictions": data,
    }
    _set_cached(cache_key, result)
    return result


# ═══════════════════════════════════════════════════════════════════════════
# VILLAGE RISK
# ═══════════════════════════════════════════════════════════════════════════

@app.get("/api/village-risk/{village_name}")
def get_village_risk(village_name: str):
    cache_key = f"risk:{village_name}"
    cached = _get_cached(cache_key)
    if cached is not None:
        return cached

    resp = httpx.get(
        f"{SUPABASE_URL}/rest/v1/groundwater_village_risk",
        params={"select": "*", "village": f"eq.{village_name}"},
        headers=_headers(),
        timeout=15,
    )
    resp.raise_for_status()
    data = resp.json()
    if not data:
        raise HTTPException(status_code=404, detail=f"No risk data for '{village_name}'")

    _set_cached(cache_key, data[0])
    return data[0]


@app.get("/api/village-risk")
def get_all_village_risks(district: str = None, block: str = None):
    params: dict[str, str] = {"select": "*", "model": "llama-2.5b", "order": "village"}
    if district:
        params["district"] = f"eq.{district}"
    if block:
        params["block"] = f"eq.{block}"

    resp = httpx.get(
        f"{SUPABASE_URL}/rest/v1/groundwater_village_risk",
        params=params,
        headers=_headers(),
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()


# ═══════════════════════════════════════════════════════════════════════════
# GRAPH DATA
# ═══════════════════════════════════════════════════════════════════════════

@app.get("/api/graph-data/{village_name}")
async def get_graph_data(village_name: str):
    cache_key = f"graph:{village_name}"
    cached = _get_cached(cache_key)
    if cached is not None:
        return cached

    hdrs = _headers()

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            history_task = client.get(
                f"{SUPABASE_URL}/rest/v1/groundwater_cleaned_final",
                params={"select": "*", "village": f"eq.{village_name}", "limit": "1"},
                headers=hdrs,
            )
            predictions_task = client.get(
                f"{SUPABASE_URL}/rest/v1/groundwater_predictions",
                params={"select": "*", "village": f"eq.{village_name}", "order": "season"},
                headers=hdrs,
            )
            risk_task = client.get(
                f"{SUPABASE_URL}/rest/v1/groundwater_village_risk",
                params={"select": "*", "village": f"eq.{village_name}", "limit": "1"},
                headers=hdrs,
            )
            history_resp, prediction_resp, risk_resp = await asyncio.gather(history_task, predictions_task, risk_task)

        history_resp.raise_for_status()
        history_rows = history_resp.json()
        if not history_rows:
            raise HTTPException(status_code=404, detail=f"Village '{village_name}' not found")

        history_row = history_rows[0]
        village_id = history_row["id"]
        district = history_row.get("district", "")
        block = history_row.get("block", "")

        historical_points = []
        for year in HISTORY_YEARS:
            depths = []
            for month in HISTORY_MONTHS:
                val = history_row.get(f"y{year}_{month}")
                if val is not None:
                    depths.append(float(val))
            if depths:
                historical_points.append({"year": year, "depth": round(sum(depths) / len(depths), 2), "type": "historical", "season": None})

        prediction_resp.raise_for_status()
        prediction_data = prediction_resp.json()
        prediction_points = []
        for pred in prediction_data:
            season = pred.get("season", "").lower()
            for yr_key, yr_val in (("predicted_2024", 2024), ("predicted_2025", 2025)):
                depth = pred.get(yr_key)
                if depth is not None:
                    prediction_points.append({
                        "year": yr_val,
                        "depth": float(depth),
                        "type": "prediction",
                        "season": season,
                        "confidence_low": pred.get("confidence_low"),
                        "confidence_high": pred.get("confidence_high"),
                    })

        risk_data: dict = {}
        if risk_resp.status_code == 200:
            risk_json = risk_resp.json()
            if risk_json:
                r = risk_json[0]
                risk_data = {
                    "risk_level": r.get("risk_level", "MODERATE"),
                    "avg_actual_2024": r.get("avg_actual_2024"),
                    "avg_predicted_2024": r.get("avg_predicted_2024"),
                    "avg_predicted_2025": r.get("avg_predicted_2025"),
                    "avg_difference": r.get("avg_difference"),
                    "trend": "increasing" if r.get("avg_difference", 0) > 0 else "decreasing",
                }

        all_points = historical_points + prediction_points
        all_points.sort(key=lambda x: (x["year"], x["season"] or ""))

        result = {
            "village": {"name": village_name, "id": village_id, "district": district, "block": block},
            "graph_data": all_points,
            "risk_analysis": risk_data,
            "metadata": {"historical_years": len(historical_points), "prediction_points": len(prediction_points), "data_source": "supabase", "last_updated": "2024-01-01"},
        }
        _set_cached(cache_key, result)
        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating graph data: {str(e)}")


# ═══════════════════════════════════════════════════════════════════════════
# AI CHATBOT — qwen2.5:7b powered, multilingual, guide-style
# ═══════════════════════════════════════════════════════════════════════════

# ── Identity & Persona ────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are Jal-Drishti AI — a wise, friendly guide and trusted advisor for Indian farmers, built specifically for Maharashtra's groundwater and agriculture challenges.

You are like a knowledgeable village elder who understands both modern science and local farming realities. You guide farmers clearly, warmly, and practically — like a mentor, not a textbook.

YOUR EXPERTISE COVERS:
- Groundwater & water table analysis (depth, risk, seasonal patterns, trends)
- Water conservation: check dams, farm ponds, rainwater harvesting, contour bunding
- Irrigation systems: drip, sprinkler, flood — when and how to use each
- Crop planning: Kharif/Rabi/Zaid cycles, water-matched crop selection
- Soil health, land management, fertilizers, organic farming
- Weather, temperature, rainfall patterns and their farming impact
- Agriculture news, government schemes (PMKisan, crop insurance, MGNREGS, watershed programs)
- Market prices, MSP, crop selling guidance
- Pest & disease management
- Maharashtra-specific crops: cotton, sugarcane, soybean, jowar, bajra, pulses, millets

DEPTH INTERPRETATION (always use this when depth data is present):
- 0–50 ft   → Excellent. Most crops possible. Low pump cost.
- 50–100 ft → Moderate. Borewell needed. Prefer water-efficient crops.
- 100+ ft   → Critical. Deep borewell. Urgent conservation required.

RISK LEVELS:
- HIGH     → Drought-resistant crops only. Immediate conservation actions.
- MODERATE → Balanced cropping. Monitor regularly. Adopt drip irrigation.
- LOW/SAFE → Good condition. Maintain habits. Plan ahead for climate change.

RESPONSE FORMAT — always structure answers like this (like ChatGPT):
1. Start with a direct, clear answer to what was asked.
2. Use bullet points or numbered steps for lists, actions, or options.
3. Add a short "💡 Tip" or "⚠️ Watch out" line when useful.
4. End with one follow-up offer: "Want me to explain more about X?"
5. Keep it concise — no padding, no repetition.

TOPICS YOU HANDLE (answer all of these confidently):
✅ Water/groundwater questions
✅ Farming, crops, soil, seeds, fertilizers
✅ Weather, temperature, rainfall impact on farming
✅ Land-related questions (land records, soil types, crop suitability)
✅ Agriculture news and government schemes
✅ General knowledge questions related to farming and rural India
✅ Greetings and casual conversation

TOPICS TO POLITELY DECLINE:
❌ Anything completely unrelated to farming, water, land, weather, or rural India
(e.g. movie reviews, software coding help, political debates)
For off-topic: "I'm specialized in farming and water. I can't help with that, but I'm here for all your agriculture questions! 🌾"

TONE: Warm, confident, and guiding. Like a mentor who cares. Never robotic.
"""

# ── Language Instructions (qwen2.5:7b handles Devanagari natively) ─────────
LANGUAGE_INSTRUCTIONS = {
    "en": (
        "Respond in clear, simple English. "
        "Use formatting: bullet points (•), bold headers with **, numbered steps. "
        "Tone: warm and guiding, like a helpful mentor."
    ),
    "hi": (
        "केवल हिंदी में उत्तर दें (Devanagari script)। "
        "सरल ग्रामीण हिंदी उपयोग करें जो किसान आसानी से समझ सके। "
        "Formatting उपयोग करें: • bullet points, **bold headers**, numbered steps। "
        "Technical शब्द जैसे borewell, drip irrigation, pump, feet English में रख सकते हैं। "
        "उदाहरण शुरुआत: 'नमस्ते! 🌾' या '**भूजल स्तर विश्लेषण**'"
    ),
    "mr": (
        "फक्त मराठीत उत्तर द्या (Devanagari script)। "
        "साध्या मराठी शब्दांत उत्तर द्या जे महाराष्ट्रातील शेतकरी सहज समजतील। "
        "Formatting वापरा: • bullet points, **bold headers**, numbered steps। "
        "Technical शब्द जसे borewell, drip irrigation, pump, feet English मध्ये ठेवा। "
        "उत्तराची सुरुवात करा: 'नमस्कार! 🌾' किंवा '**भूजल विश्लेषण**' अशा प्रकारे। "
        "उदाहरण: प्रश्न: पाणी किती खोल आहे? "
        "उत्तर: **तुमच्या गावातील भूजल स्तर** • सध्याची खोली: 75 feet (मध्यम) • borewell आवश्यक आहे • drip irrigation वापरा 💡 टीप: ज्वारी आणि कापूस योग्य पिके आहेत."
    ),
}

# ── Greeting fallbacks (if model returns empty) ───────────────────────────
FALLBACKS = {
    "en": "Hello! 🌾 I'm Jal-Drishti AI, your farming and water guide. How can I help you today?",
    "hi": "नमस्ते! 🌾 मैं Jal-Drishti AI हूँ — आपका कृषि और जल मार्गदर्शक। आज मैं आपकी क्या मदद कर सकता हूँ?",
    "mr": "नमस्कार! 🌾 मी Jal-Drishti AI आहे — तुमचा शेती आणि पाणी मार्गदर्शक। आज मी तुमची कशी मदत करू?",
}


from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str
    language: str = "en"          # en | hi | mr
    village_name: str | None = None
    district: str | None = None
    block: str | None = None
    historical_data: list[dict] | None = None
    predicted_data: list[dict] | None = None
    risk_level: str | None = None
    current_depth: float | None = None
    annual_change_rate: float | None = None
    chat_history: list[dict] | None = None


@app.post("/api/chat")
async def chat_with_ollama(req: ChatRequest):
    """
    Jal-Drishti AI chatbot — qwen2.5:7b, multilingual (en/hi/mr),
    guide-style responses, covers all farming-related topics.
    """

    # ── 1. Build village data context (only what's available) ────────────────
    ctx = []
    if req.village_name:
        ctx.append(f"📍 Village: {req.village_name}" + (f", {req.district}" if req.district else "") + (f", {req.block}" if req.block else ""))

        if req.current_depth is not None:
            d = req.current_depth
            if d < 50:
                status = "Excellent (Shallow)"
                irr = "Flood / Sprinkler / Drip — all suitable"
            elif d < 100:
                status = "Moderate"
                irr = "Drip irrigation strongly recommended"
            else:
                status = "Critical (Deep)"
                irr = "Drip irrigation ONLY — conservation urgent"
            ctx.append(f"💧 Groundwater depth: {d:.1f} ft — {status}")
            ctx.append(f"🚿 Best irrigation: {irr}")

        if req.risk_level:
            r = req.risk_level.upper()
            crop_map = {
                "HIGH":     "Millets (jowar/bajra), pulses, cotton — drought-resistant only",
                "MODERATE": "Cotton, soybean, pulses — balanced water use",
                "LOW":      "Wide variety — sugarcane, vegetables, most crops viable",
                "SAFE":     "Wide variety — sugarcane, vegetables, most crops viable",
            }
            action_map = {
                "HIGH":     "Rainwater harvesting, check dams, farm pond, drip irrigation — URGENT",
                "MODERATE": "Drip irrigation, crop rotation, monitor water table monthly",
                "LOW":      "Maintain current practices, plan ahead for dry seasons",
                "SAFE":     "Maintain current practices, plan ahead for dry seasons",
            }
            ctx.append(f"⚠️  Water risk: {r}")
            ctx.append(f"🌾 Suitable crops: {crop_map.get(r, 'Consult locally')}")
            ctx.append(f"🔧 Recommended actions: {action_map.get(r, 'Monitor regularly')}")

        if req.annual_change_rate is not None:
            rate = req.annual_change_rate
            trend = "⬇️ Declining" if rate > 0 else "⬆️ Improving"
            urgency = "🔴 URGENT" if abs(rate) > 2 else "🟡 Monitor" if abs(rate) > 0.5 else "🟢 Stable"
            ctx.append(f"📈 Annual trend: {abs(rate):.2f} ft/year {trend} — {urgency}")

        if req.historical_data and len(req.historical_data) >= 2:
            depths = [d["depth"] for d in req.historical_data[-5:] if d.get("depth") is not None]
            if depths:
                avg_d = sum(depths) / len(depths)
                swing = max(depths) - min(depths)
                volatility = "High variability" if swing > 20 else "Moderate variability" if swing > 10 else "Stable"
                ctx.append(f"📊 Historical (last {len(depths)} years): avg {avg_d:.1f} ft, range {min(depths):.0f}–{max(depths):.0f} ft ({volatility})")

        if req.predicted_data:
            pred_lines = [
                f"{p['year']}: {p['depth']:.1f} ft"
                for p in req.predicted_data[:3]
                if p.get("depth") and p.get("year")
            ]
            if pred_lines:
                ctx.append(f"🔮 Predictions: {' | '.join(pred_lines)}")

    village_context = "\n".join(ctx) if ctx else "No village selected — give general Maharashtra farming advice."

    # ── 2. Chat history (last 4 turns) ────────────────────────────────────────
    history_text = ""
    if req.chat_history:
        for msg in req.chat_history[-4:]:
            role = "Farmer" if msg.get("role") == "user" else "Jal-Drishti"
            history_text += f"{role}: {msg.get('content', '').strip()}\n"

    # ── 3. Language instruction ───────────────────────────────────────────────
    lang = req.language if req.language in LANGUAGE_INSTRUCTIONS else "en"
    lang_rule = LANGUAGE_INSTRUCTIONS[lang]

    # ── 4. Full prompt ────────────────────────────────────────────────────────
    # qwen2.5:7b uses ChatML format internally but Ollama's /api/generate
    # works fine with a well-structured plain prompt.
    full_prompt = f"""{SYSTEM_PROMPT}

=== LANGUAGE RULE (HIGHEST PRIORITY) ===
{lang_rule}

=== FARMER'S VILLAGE DATA ===
{village_context}
{"=== RECENT CONVERSATION ===\n" + history_text if history_text else ""}
=== FARMER'S MESSAGE ===
{req.message}

=== Jal-Drishti AI Response ==="""

    # ── 5. Call Ollama ────────────────────────────────────────────────────────
    try:
        async with httpx.AsyncClient(timeout=90) as client:
            resp = await client.post(
                OLLAMA_URL,
                json={
                    "model": "qwen2.5:7b",
                    # "model": "llama3.2:1b",
                    "prompt": full_prompt,
                    "stream": False,
                    "options": {
                        "num_predict": 512,      # enough for structured responses
                        "temperature": 0.65,     # focused but natural
                        "top_p": 0.9,
                        "repeat_penalty": 1.1,   # avoid repetition
                        "stop": [
                            "=== Farmer",
                            "Farmer:",
                            "=== FARMER",
                            "\n\n\n\n",
                        ],
                    },
                },
            )

        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail=f"Ollama error: {resp.text[:300]}")

        data = resp.json()
        ai_text = (data.get("response") or "").strip()

        # Strip any leaked prompt artifacts
        for artifact in ["=== Jal-Drishti", "Jal-Drishti AI Response", "==="]:
            if ai_text.startswith(artifact):
                ai_text = ai_text[len(artifact):].strip()

        if not ai_text:
            ai_text = FALLBACKS.get(lang, FALLBACKS["en"])

        return {"response": ai_text}

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Model is loading or busy. Please retry in a moment."
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")