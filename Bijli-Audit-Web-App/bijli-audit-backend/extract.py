import json
import os
import re
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()


def get_client():
    key = os.getenv("OPENROUTER_API_KEY") or os.getenv("DEEPSEEK_API_KEY")
    if not key:
        print("\n[CRITICAL ERROR] OPENROUTER_API_KEY is missing from .env!\n")
        return None
    return OpenAI(
        api_key=key,
        base_url="https://openrouter.ai/api/v1",
        default_headers={
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "BijliAudit",
        },
    )


MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]

MONTH_TYPO_MAP = {
    "JIV": "JUL",
    "JLV": "JUL",
    "AUGU": "AUG",
    "SEPT": "SEP",
    "OCTO": "OCT",
    "NOVE": "NOV",
    "DECE": "DEC",
    "FED": "FEB",
    "MARCH": "MAR",
}


def clean_billing_month(raw_month: str) -> str:
    if not raw_month:
        return "UNKNOWN"

    cleaned = raw_month.upper().strip()

    for typo, fix in MONTH_TYPO_MAP.items():
        cleaned = cleaned.replace(typo, fix)

    found_month = next((m for m in MONTHS if m in cleaned), None)
    if not found_month:
        return "UNKNOWN"

    year_match = re.search(r"(20\d{2}|\d{2})(?!\d)", cleaned)
    year_str = year_match.group(1)[-2:] if year_match else ""

    return f"{found_month}{' ' + year_str if year_str else ''}"


def _is_mepco_ref(value: str) -> bool:
    """MEPCO reference numbers are exactly 14 digits."""
    digits = re.sub(r"\D", "", value)
    return len(digits) == 14


def _to_float(value) -> float:
    if value is None:
        return 0.0
    if isinstance(value, (int, float)):
        return float(value)
    cleaned = re.sub(r"[,\s]", "", str(value))
    try:
        return float(cleaned)
    except ValueError:
        return 0.0


def extract_bill_data(raw_ocr_text: list[str]) -> dict:
    client = get_client()
    combined_text = "\n".join(raw_ocr_text)

    if not client:
        return {
            "error": "OPENROUTER_API_KEY is missing in the backend .env file.",
            "consumer_name": "",
            "reference_number": "",
            "billing_month": "",
            "units_consumed": 0,
            "total_amount_due": 0,
        }

    prompt = f"""You are a precise extraction engine for official Pakistani MEPCO electricity bills.
Below is the raw OCR text of ONE bill. Extract fields per these MEPCO anchoring rules.

RULES:
1. consumer_name: The bill holder name after "CONSUMER NAME" / "CONSUMER DETAIL". Ignore transformer names (e.g. REHMAT BLOCK), feeder/sub-division names (e.g. GULGASHT), and addresses.
2. reference_number: The 14-digit number under "REFERENCE NO". On the physical bill it appears as digit groups joined by dashes (e.g. "2015-171825-0600"). Remove the dashes: the number is exactly 14 digits total, e.g. "20151718250600".
3. units_consumed: Under "METER INFO" the value next to "UNITS" / "KWH". Cross-check: PRESENT READING minus PREVIOUS READING must equal units. E.g. 3573 - 3492 = 81. Prefer your computed reading difference if "UNITS" isn't clearly readable.
4. tariff_category / protected_status: From "TARIFF CATEGORY" or the word PROTECTED/UNPROTECTED. If absent, infer PROTECTED when units <= 200.
5. energy_charges: "TOTAL ELECTRICITY CHARGES" (gross energy charge before subsidy adjustments is fine). Do NOT put FPA, GST, or the final total here.
5b. subsidies: The "SUBSIDIES" / subsidy adjustment amount deducted from the gross charges (0 if absent).
5c. net_electricity_charges: The "NET ELECTRICITY CHARGES" line after subsidy deduction (0 if absent).
5d. gross_total: The PRE-SUBSIDY grand total (e.g. gross electricity charges + FPA before subsidies are deducted). This is the LARGER amount, never the amount payable. 480
6. fpa: "TOTAL FPA" / "Total Fpx" fuel price adjustment amount.
7. qta: "QTA" quarterly tariff adjustment (0 if absent).
8. gst: "GST" general sales tax amount.
9. electricity_duty: "ELECTRICITY DUTY" amount.
10. tv_fee: "TV FEE" license fee (0 if absent).
11. total_amount_due: The amount next to "PAYABLE WITHIN DUE DATE" or "GRAND TOTAL — PAYABLE". It is the FINAL FINAL figure the consumer actually pays, AFTER subsidies are deducted. On subsidized (protected) bills there are often TWO similar numbers near the bottom: the bigger PRE-SUBSIDY grand total and the smaller PAYABLE amount. total_amount_due MUST be the smaller PAYABLE figure — never the pre-subsidy gross total, never the subsidy amount itself.
12. billing_month: Under "BILL MONTH / QTR", e.g. "JUL 26".
13. due_date: The "DUE DATE".
14. present_reading / previous_reading: METER INFO readings if visible.

MUST-DO:
- Cross-validate units: (present - previous) should match units.
- Cross-validate the total: total_amount_due should approximately equal energy + fpa + qta + gst + duty + tv_fee (values may be rounded).
- If a field truly cannot be read from the text, return "" or 0 as instructed. NEVER invent numbers.

Return ONLY valid raw JSON, no markdown fences, matching EXACTLY this shape:
{{
  "consumer_name": "",
  "reference_number": "",
  "billing_month": "",
  "units_consumed": 0,
  "tariff_category": "",
  "protected_status": "",
  "phase": "",
  "energy_charges": 0.0,
  "subsidies": 0.0,
  "net_electricity_charges": 0.0,
  "gross_total": 0.0,
  "fpa": 0.0,
  "qta": 0.0,
  "gst": 0.0,
  "electricity_duty": 0.0,
  "tv_fee": 0.0,
  "total_amount_due": 0.0,
  "due_date": "",
  "present_reading": 0,
  "previous_reading": 0
}}

RAW OCR TEXT:
{combined_text}"""

    models_to_try = ["openai/gpt-4o-mini", "deepseek/deepseek-chat"]

    last_error = None
    for model_name in models_to_try:
        try:
            print(f"\n[INFO] Requesting extraction via OpenRouter model: {model_name}")
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a JSON extraction assistant for MEPCO electricity bills. Return ONLY valid raw JSON without markdown formatting or code blocks.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.0,
            )

            response_text = response.choices[0].message.content.strip()

            if "```" in response_text:
                response_text = response_text.split("```json")[-1].split("```")[0].strip()
                if response_text.startswith("```"):
                    response_text = response_text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()

            data = json.loads(response_text)

            if data.get("error"):
                return {
                    "error": "The uploaded image was not recognized as a MEPCO electricity bill.",
                    "consumer_name": "",
                    "reference_number": "",
                    "billing_month": "",
                    "units_consumed": 0,
                    "total_amount_due": 0,
                }

            data = _postprocess(data, combined_text)

            # Hard-fail only when nothing usable was read.
            has_ref = bool(data.get("reference_number"))
            has_total = data.get("total_amount_due", 0) > 0
            has_units = data.get("units_consumed", 0) > 0

            if not has_ref and not has_total and not has_units:
                return {
                    "error": (
                        "No readable bill fields were found. Please upload a sharper, "
                        "well-lit photo of the full MEPCO bill."
                    ),
                    "consumer_name": data.get("consumer_name", ""),
                    "reference_number": "",
                    "billing_month": data.get("billing_month", ""),
                    "units_consumed": 0,
                    "total_amount_due": 0,
                }

            # Mark low-confidence fields for the UI without failing the job.
            data["extraction_confident"] = has_ref and has_total and has_units
            data["units_missing"] = not has_units
            return data

        except Exception as err:
            last_error = repr(err)
            print(f"\n[ERROR] Model '{model_name}' failed: {last_error}")
            continue

    return {
        "error": f"All extraction models failed. Backend error: {last_error}",
        "consumer_name": "",
        "reference_number": "",
        "billing_month": "",
        "units_consumed": 0,
        "total_amount_due": 0,
    }


def _postprocess(data: dict, combined_text: str) -> dict:
    """Deterministic cleanup + validation on top of the LLM's JSON."""
    data = dict(data)

    # --- Month normalization ---
    data["billing_month"] = clean_billing_month(data.get("billing_month", ""))

    # --- Units consumed ---
    units = _to_float(data.get("units_consumed"))

    if units == 0:
        unit_match = re.search(r"(?:UNITS|KWH|CONSUMED)[\s:]*(\d{1,4})\b", combined_text, re.IGNORECASE)
        if unit_match:
            units = float(unit_match.group(1))
            print(f"[REGEX FIX] Extracted units directly: {units}")

    if units == 0:
        # Meter reading difference: pair of 4-6 digit numbers forming a sane delta.
        readings = re.findall(r"\b(\d{4,6})\b", combined_text)
        ptr = 0
        while ptr + 1 < len(readings) and units == 0:
            try:
                a, b = float(readings[ptr]), float(readings[ptr + 1])
                diff = abs(b - a)
                if 0 < diff < 1000:
                    units = diff
                    print(f"[MATH FIX] Units from meter reading diff: {units}")
            except ValueError:
                pass
            ptr += 1

    data["units_consumed"] = int(round(units))

    # --- Meter reading round-trip check ---
    present = _to_float(data.get("present_reading"))
    previous = _to_float(data.get("previous_reading"))
    if present and previous and data["units_consumed"] > 0 and abs((present - previous) - data["units_consumed"]) > 5:
        data["units_consumed"] = int(abs(present - previous))
    elif present and previous and data["units_consumed"] == 0:
        diff = int(abs(present - previous))
        if 0 < diff < 1000:
            data["units_consumed"] = diff

    # --- Reference number ---
    # Prefer a clean 14-digit run that literally appears in the OCR text.
    # The LLM sometimes keeps 14 digits but transposes one of them; when the
    # LLM value does not match the OCR, trust the OCR run instead.
    ref_digits = re.sub(r"\D", "", str(data.get("reference_number", "") or ""))
    ocr_run = ""
    m = re.search(r"\b\d{14}\b", combined_text)
    if m:
        ocr_run = m.group(0)

    ocr_nospace = re.sub(r"\s", "", combined_text)
    if ocr_run and (not _is_mepco_ref(ref_digits) or ref_digits not in ocr_nospace):
        ref_digits = ocr_run

    data["reference_number"] = ref_digits if _is_mepco_ref(ref_digits) else ""

    # --- Numeric coercion (comma-safe) ---
    for key in [
        "energy_charges",
        "subsidies",
        "net_electricity_charges",
        "gross_total",
        "fpa",
        "qta",
        "gst",
        "electricity_duty",
        "tv_fee",
        "total_amount_due",
    ]:
        data[key] = _to_float(data.get(key))

    # --- Subsidy-aware TOTAL pick ---
    # MEPCO bills print TWO amounts near the bottom: the pre-subsidy gross
    # total and the smaller PAYABLE amount. The LLM sometimes grabs the gross.
    # Deterministic rescue:
    subsidies = data["subsidies"]
    gross_total = data["gross_total"]
    net_electricity = data["net_electricity_charges"]
    llm_total = data["total_amount_due"]

    # 1) Anchor on the word "PAYABLE" in the OCR text itself.
    #    The naive "first number after PAYABLE" grabs date days like
    #    "17-AUG-26" (17) instead of the real amount. Filter those out:
    #    skip numbers followed by a month token, and keep only values that
    #    could actually be a bill total (>= 100 rupees).
    payable_anchor = 0
    month_tokens = re.compile(r"\s*(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\b", re.IGNORECASE)
    for m in re.finditer(
        r"PA\w*ABL\w*[^\d]{0,60}?(\d[\d,]*)",
        combined_text,
        re.IGNORECASE,
    ):
        tail = combined_text[m.end(): m.end() + 5]
        if month_tokens.match(tail):
            continue  # "17-AUG-26" -> 17 is a date day, not an amount
        anchor_val = _to_float(m.group(1))
        if anchor_val >= 100 and (gross_total <= 0 or anchor_val <= gross_total):
            payable_anchor = anchor_val

    # 2) If the LLM total equals the pre-subsidy gross, rebuild the payable.
    if subsidies > 0 and gross_total > 0 and llm_total >= gross_total:
        rebuilt = gross_total - subsidies
        if net_electricity > 0:
            rebuilt = net_electricity
            if data["gst"] > 0:
                rebuilt += data["gst"]
            if data["electricity_duty"] > 0:
                rebuilt += data["electricity_duty"]
            if data["tv_fee"] > 0:
                rebuilt += data["tv_fee"]
        llm_total = round(rebuilt, 2)

    if payable_anchor > 0:
        llm_total = payable_anchor
    elif llm_total > 0 and gross_total > 0 and llm_total >= gross_total and subsidies <= 0:
        # No subsidy info but the total still exceeds gross charges — suspect.
        if net_electricity > 0:
            llm_total = net_electricity

    data["total_amount_due"] = round(llm_total, 2)

    # --- Protected status / applied category ---
    prot_raw = str(data.get("protected_status", "") or "").lower()
    if "protected" in prot_raw or (data["units_consumed"] and data["units_consumed"] <= 200):
        applied = "Protected"
    else:
        applied = "Unprotected"

    data["applied_category"] = str(data.get("tariff_category") or applied).title()
    if "Protect" in data["applied_category"]:
        data["applied_category"] = "Protected"
    elif "Unprotect" in data["applied_category"]:
        data["applied_category"] = "Unprotected"

    # --- Discrepancy placeholder (real check happens in rules engine) ---
    data["discrepancy_flag"] = "CHECK_REQUIRED"

    return data