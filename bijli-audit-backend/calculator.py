import json
import os

TARIFF_FILE = os.path.join(os.path.dirname(__file__), "tariff_mepco.json")


def load_tariff():
    """Loads Mepco rates from the JSON configuration file."""
    with open(TARIFF_FILE, "r") as f:
        return json.load(f)


def calculate_base_charges(units, is_protected, tariff_data):
    """Calculates progressive slab energy costs and retrieves applicable fixed charges."""
    if units <= 0:
        return 0.0, 0.0

    category = "protected" if is_protected else "non_protected"
    slabs = tariff_data[category]

    energy_cost = 0.0
    remaining_units = units
    fixed_charges = 0.0

    for slab in slabs:
        min_u = slab["min_units"]
        max_u = slab["max_units"]
        rate = slab["rate"]

        # Determine fixed charges based on total consumption bracket
        if min_u <= units <= max_u or (units > max_u and slab == slabs[-1]):
            fixed_charges = float(slab.get("fixed_charges", 0.0))

        # Calculate energy cost for current slab
        slab_capacity = (max_u - min_u) + 1
        units_in_slab = min(remaining_units, slab_capacity)

        if units_in_slab > 0:
            energy_cost += units_in_slab * rate
            remaining_units -= units_in_slab

        if remaining_units <= 0:
            break

    return round(energy_cost, 2), fixed_charges


def calculate_taxes(energy_cost, fixed_charges, fpa, qta, dss_surcharge):
    """Calculates ED (1.5%), TV Fee (35 PKR), GST (18%), and Advance Income Tax (7.5%)."""
    electricity_duty = round(energy_cost * 0.015, 2)
    tv_fee = 35.0 if energy_cost > 0 else 0.0

    # GST applies to Energy Cost + Fixed Charges + FPA + QTA + DSS + Electricity Duty
    taxable_subtotal = (
        energy_cost + fixed_charges + fpa + qta + dss_surcharge + electricity_duty
    )
    gst = round(taxable_subtotal * 0.18, 2)

    # 7.5% Advance Tax applies if running total exceeds Rs. 20,000
    subtotal_before_adv_tax = taxable_subtotal + tv_fee + gst
    advance_tax = (
        round(subtotal_before_adv_tax * 0.075, 2)
        if subtotal_before_adv_tax > 20000
        else 0.0
    )

    total_taxes = round(electricity_duty + tv_fee + gst + advance_tax, 2)
    return total_taxes, electricity_duty, tv_fee, gst, advance_tax


def audit_bill(bill_data):
    tariff_data = load_tariff()

    units = float(bill_data.get("units_consumed", 0))
    is_protected = str(bill_data.get("protected_status", "")).strip().lower() == "protected"
    fpa = float(bill_data.get("fpa_charge", 0.0))
    qta = float(bill_data.get("qta_charge", 0.0))
    billed_amount = float(bill_data.get("billed_amount", 0.0))

    # 1. Base Energy & Fixed Charges
    energy_cost, fixed_charges = calculate_base_charges(
        units, is_protected, tariff_data
    )

    # 2. Debt Servicing Surcharge
    dss_surcharge = round(units * 3.23, 2)

    # 3. Taxes & Government Duties
    total_taxes, electricity_duty, tv_fee, gst, advance_tax = calculate_taxes(
        energy_cost, fixed_charges, fpa, qta, dss_surcharge
    )

    # 4. Final Bill Calculations
    calculated_net = round(
        energy_cost + fixed_charges + fpa + qta + dss_surcharge + total_taxes, 2
    )
    discrepancy = round(billed_amount - calculated_net, 2)

    return {
        "status": "VERIFIED" if abs(discrepancy) <= 10.0 else "DISCREPANCY DETECTED",
        "units_consumed": units,
        "is_protected": is_protected,
        "energy_cost": energy_cost,
        "fixed_charges": fixed_charges,
        "fpa_charge": fpa,
        "qta_charge": qta,
        "dss_surcharge": dss_surcharge,
        "electricity_duty": electricity_duty,
        "tv_fee": tv_fee,
        "gst": gst,
        "advance_tax": advance_tax,
        "total_taxes": total_taxes,
        "calculated_net_payable": calculated_net,
        "billed_net_payable": billed_amount,
        "discrepancy_amount": discrepancy,
    }


if __name__ == "__main__":
    test_bill = {
        "units_consumed": 350,
        "status": "non_protected",
        "fpa_charge": 50.0,
        "qta_charge": 20.0,
        "billed_amount": 1500.0,
    }

    output = audit_bill(test_bill)
    print(json.dumps(output, indent=4))
