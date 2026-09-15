import json
import os

DOMESTIC_CATEGORIES = ("protected", "unprotected")


def load_tariff(filepath: str = "rules_engine/tariff_mepco.json") -> dict:
    if not os.path.exists(filepath):
        filepath = os.path.join(os.path.dirname(__file__), "tariff_mepco.json")
    with open(filepath, "r") as f:
        return json.load(f)


def _protected_slab_max(tariff: dict) -> int:
    return max(s["max_units"] for s in tariff.get("protected", []))


def _resolve_category(category: str, units: int, tariff: dict) -> tuple[str, bool]:
    """Return (effective_category, downgraded_from_protected).

    Domestic protected consumers who cross the slab ceiling are re-rated under
    the unprotected schedule for ALL units (MEPCO behaviour).
    """
    cat = (category or "auto").lower()
    slab_limit = _protected_slab_max(tariff)

    if cat == "auto":
        return ("protected" if units <= slab_limit else "unprotected"), False
    if cat == "protected" and units > slab_limit:
        return "unprotected", True
    return cat, False


def _apply_slabs(units: int, cat: str, tariff: dict) -> list[dict]:
    slabs = tariff.get(cat, [])
    lines: list[dict] = []
    for slab in slabs:
        min_u = slab["min_units"]
        max_u = slab["max_units"]
        rate = slab["rate"]

        if units >= min_u:
            slab_units = min(units, max_u) - min_u + 1
            lines.append(
                {
                    "range": f"{min_u}-{max_u}",
                    "units": slab_units,
                    "rate": rate,
                    "cost": round(slab_units * rate, 2),
                }
            )

        if units <= max_u:
            break
    return lines


def calculate_energy_charge(units: int, category: str, tariff: dict) -> float:
    """Slab-by-slab energy charge.

    If a 'protected' consumer exceeded the protected slab ceiling, they are
    automatically billed under the unprotected schedule for ALL units
    (matching MEPCO behaviour: crossing the 200-unit line re-rates the
    entire consumption).
    """
    if units <= 0:
        return 0.0

    cat = category.lower()
    if cat in ("protected", "unprotected", "auto"):
        eff, _ = _resolve_category(cat, units, tariff)
    else:
        eff = cat
    total_energy_charge = sum(l["cost"] for l in _apply_slabs(units, eff, tariff))
    return round(total_energy_charge, 2)


def slab_breakdown(units: int, category: str, tariff: dict) -> list[dict]:
    """Per-slab line items for a given consumption figure.

    Mirrors `calculate_energy_charge` exactly (including the protected->unprotected
    re-rate guard) so the planner sheet and the audit engine always agree.
    """
    if units <= 0:
        return []

    cat = category.lower()
    eff, _ = _resolve_category(cat, units, tariff)
    return _apply_slabs(units, eff, tariff)


class CalcOpts:
    """Configurable surcharge / tax inputs for the interactive calculator."""

    def __init__(
        self,
        fpa_per_unit: float = 0.0,
        qta_amount: float = 0.0,
        tv_fee: float = 0.0,
        surcharge_percent: float = 0.0,
        gst_percent: float | None = None,
        duty_percent: float | None = None,
    ):
        self.fpa_per_unit = max(fpa_per_unit or 0.0, 0.0)
        self.qta_amount = max(qta_amount or 0.0, 0.0)
        self.tv_fee = max(tv_fee or 0.0, 0.0)
        self.surcharge_percent = max(surcharge_percent or 0.0, 0.0)
        self.gst_percent = gst_percent
        self.duty_percent = duty_percent


def calculate_full(
    units: int,
    category: str,
    phase: str,
    tariff: dict,
    opts: CalcOpts | None = None,
) -> dict:
    """Full transparent audit calculation with itemized line items.

    Math order (kept consistent with the bill-verification engine):

        energy      = slab-by-slab charge (protected re-rates past the ceiling)
        fpa         = units x FPA per-unit rate            (user override)
        qta         = flat quarterly tariff adjustment      (user override)
        fixed       = single/three phase connection charge
        duty        = energy x ED %                          (default 1.5%)
        gst         = (energy + fixed + fpa + qta) x GST %   (default 18%)
        surcharge   = (energy + fixed) x surcharge %         (user override)
        tv_fee      = flat                            (user override)

    For protected consumers a separate gross build (as-if unprotected) is kept
    so subsidy relief = gross - payable and is never negative.
    """
    opts = opts or CalcOpts()
    if units < 0:
        units = 0

    slab_limit = _protected_slab_max(tariff)
    resolved, downgraded = _resolve_category(category, units, tariff)
    is_protected = resolved == "protected" and units > 0

    slabs = _apply_slabs(units, resolved, tariff)
    energy = round(sum(l["cost"] for l in slabs), 2)
    fixed = float(tariff["fixed_charges"].get("three_phase" if phase == "three" else "single_phase", 75))

    gst_rate = (opts.gst_percent if opts.gst_percent is not None else float(tariff["taxes"]["gst_percent"])) / 100
    duty_rate = (opts.duty_percent if opts.duty_percent is not None else float(tariff["taxes"]["electricity_duty_percent"])) / 100

    fpa = round(units * opts.fpa_per_unit, 2)
    qta = round(opts.qta_amount, 2)
    gst = round((energy + fixed + fpa + qta) * gst_rate, 2)
    duty = round(energy * duty_rate, 2)
    surcharge = round((energy + fixed) * (opts.surcharge_percent / 100), 2)
    tv_fee = round(opts.tv_fee, 2)

    energy_plus_fixed = round(energy + fixed, 2)
    subtotal_before_tax = round(energy_plus_fixed + fpa + qta, 2)

    # -- Protected subsidy logic (gross as-if unprotected) --------------------
    subsidy = 0.0
    gross_total = 0.0
    if is_protected:
        unprot_slabs = _apply_slabs(units, "unprotected", tariff)
        unprot_energy = round(sum(l["cost"] for l in unprot_slabs), 2)
        up_gst = round((unprot_energy + fixed + fpa + qta) * gst_rate, 2)
        up_duty = round(unprot_energy * duty_rate, 2)
        up_surcharge = round((unprot_energy + fixed) * (opts.surcharge_percent / 100), 2)
        gross_total = round(unprot_energy + fixed + fpa + qta + up_gst + up_duty + up_surcharge + tv_fee, 2)
        payable = round(energy + fixed + fpa + qta + gst + duty + surcharge + tv_fee, 2)
        subsidy = round(gross_total - payable, 2)
    else:
        gross_total = round(energy + fixed + fpa + qta + gst + duty + surcharge + tv_fee, 2)
        payable = gross_total

    itemization = [
        {"key": "energy", "label": "Slab energy charge", "amount": energy, "note": "Units in slab x tariff rate"},
        {"key": "fixed", "label": "Fixed charges", "amount": fixed, "note": f"{phase.title()} phase connection"},
    ]
    if fpa > 0:
        itemization.append({"key": "fpa", "label": "Fuel price adjustment (FPA)", "amount": fpa, "note": f"{units} kWh x Rs {opts.fpa_per_unit}"})
    if qta > 0:
        itemization.append({"key": "qta", "label": "Quarterly tariff adjustment (QTA)", "amount": qta, "note": "Flat adjustment for this cycle"})
    if duty > 0:
        itemization.append({"key": "duty", "label": "Electricity duty", "amount": duty, "note": f"{round(duty_rate*100,2)}% of slab energy"})
    if surcharge > 0:
        itemization.append({"key": "surcharge", "label": "Surcharge", "amount": surcharge, "note": f"{opts.surcharge_percent}% on energy + fixed"})
    if gst > 0:
        itemization.append({"key": "gst", "label": "GST", "amount": gst, "note": f"{round(gst_rate*100,2)}% of energy + fixed + FPA + QTA"})
    if tv_fee > 0:
        itemization.append({"key": "tv", "label": "TV licence fee", "amount": tv_fee, "note": "Flat monthly fee"})
    if subsidy > 0:
        itemization.append({"key": "subsidy", "label": "Protected subsidy (relief)", "amount": -subsidy, "note": "Gross minus payable"})

    return {
        "units": units,
        "phase": phase,
        "category": resolved,
        "applied_category": resolved.capitalize(),
        "category_downgraded_from_protected": downgraded,
        "slab_limit": slab_limit,
        "breakdown": slabs,
        "base_cost": energy,
        "fixed_charges": fixed,
        "fpa": fpa,
        "qta": qta,
        "electricity_duty": duty,
        "gst": gst,
        "tv_fee": tv_fee,
        "surcharge": surcharge,
        "energy_plus_fixed": energy_plus_fixed,
        "subtotal_before_tax": subtotal_before_tax,
        "gross_total": gross_total,
        "estimated_subsidy": subsidy,
        "total_bill": round(payable),
        "itemization": itemization,
    }


def verify_bill(extracted_data: dict, tariff: dict) -> dict:
    units = float(extracted_data.get("units_consumed", 0) or 0)
    protected_raw = str(extracted_data.get("protected_status", "") or "").lower()
    stated_protected = "protected" in protected_raw and "unprotected" not in protected_raw

    slab_limit = _protected_slab_max(tariff)

    # Cross-validate the stated category against the slab ceiling.
    if units <= 0 or units > slab_limit:
        effective_protected = False
    else:
        effective_protected = stated_protected

    category = "protected" if effective_protected else "unprotected"

    calculated_energy = calculate_energy_charge(units, category, tariff)

    # Component amounts the extractor actually read off the bill.
    fpa = float(extracted_data.get("fpa", 0) or 0)
    qta = float(extracted_data.get("qta", 0) or 0)
    gst = float(extracted_data.get("gst", 0) or 0)
    electricity_duty = float(extracted_data.get("electricity_duty", 0) or 0)
    tv_fee = float(extracted_data.get("tv_fee", 0) or 0)
    reported_total = float(extracted_data.get("total_amount_due", 0) or 0)
    reported_energy = float(extracted_data.get("energy_charges", 0) or 0)
    reported_net = float(extracted_data.get("net_electricity_charges", 0) or 0)

    # Build an apples-to-apples expected grand total from the tariff + the
    # components that were actually legible on the bill.
    gst_rate = float(tariff["taxes"]["gst_percent"]) / 100
    duty_rate = float(tariff["taxes"]["electricity_duty_percent"]) / 100
    fixed = float(tariff["fixed_charges"]["single_phase"])

    taxable_base = round(calculated_energy + fpa + qta, 2)
    gst_expected = gst if gst > 0 else round(taxable_base * gst_rate, 2)
    duty_expected = electricity_duty if electricity_duty > 0 else round(calculated_energy * duty_rate, 2)
    calculated_total = round(taxable_base + gst_expected + duty_expected + tv_fee + fixed, 2)

    # Only the pure slab energy is directly verifiable; the bill's gross
    # "total electricity charges" line bundles in fuel/QTA pass-through, so
    # comparing it to slab energy produces false alarms. We therefore only
    # audit when the component lines (FPA/QTA/GST/duty/tv) were actually read.
    components_read = (fpa > 0) or (qta > 0) or (gst > 0) or (electricity_duty > 0) or (tv_fee > 0)

    units_remaining = slab_limit - units

    if units <= 0:
        flag = "Inconclusive"
    elif reported_total <= 0:
        flag = "Inconclusive"
    elif not components_read:
        # Without the component lines we cannot build a reliable expected
        # total — report honestly instead of flagging on a partial comparison.
        flag = "Inconclusive"
    else:
        tolerance = max(0.10 * calculated_total, 50)
        discrepancy = abs(calculated_total - reported_total) > tolerance
        flag = "Possible discrepancy" if discrepancy else "No discrepancy"

    return {
        "calculated_energy_charge": round(calculated_energy, 2),
        "calculated_total": calculated_total,
        "reported_energy_charge": round(reported_energy, 2),
        "reported_net_electricity_charge": round(reported_net, 2),
        "discrepancy_flag": flag,
        "units_remaining_to_next_slab": round(units_remaining, 1),
        "applied_category": category.capitalize(),
        "protected_slab_limit": slab_limit,
    }