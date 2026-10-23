"""Seed the database with two realistic API-manufacturing deviations.

Runs only when the deviations table is empty, so user data is never overwritten.
"""
from sqlalchemy.orm import Session

from .models import Deviation, Evidence

SAMPLES = [
    {
        "deviation": dict(
            title="Out-of-specification impurity result in hydrogenation batch",
            batch_number="MTZ-HYD-2026-0147",
            product_name="Metronidazole API",
            process_stage="Hydrogenation (Step 3)",
            date_occurred="2026-10-12",
            severity="Critical",
            description=(
                "QC HPLC analysis of the hydrogenation batch reported an unknown impurity "
                "(Impurity-U) at 0.42% against a specification limit of NMT 0.15%, and total "
                "impurities at 1.31% against NMT 1.0%. The batch was placed on QA hold. "
                "Retest of the retained sample confirmed the original result, ruling out a "
                "simple analytical error. The batch had shown a noticeably slower hydrogen "
                "uptake profile than the validated trend."
            ),
            immediate_action=(
                "Batch quarantined and marked 'On Hold' in the ERP; QA notified within 2 hours; "
                "OOS investigation (Phase I) initiated and retained samples sent for confirmatory "
                "HPLC and LC-MS identification of Impurity-U."
            ),
            reported_by="A. Deshmukh, QC Analyst",
            status="Under Investigation",
        ),
        "evidence": [
            dict(
                type="measurement",
                title="HPLC chromatogram — Impurity-U at RRT 1.37",
                details=(
                    "Impurity-U peak at relative retention time 1.37, area 0.42%. Confirmed on "
                    "retest of retained sample (0.40%). LC-MS suggests a partially reduced "
                    "nitro-intermediate consistent with incomplete hydrogenation."
                ),
            ),
            dict(
                type="equipment_log",
                title="Hydrogenator H2 uptake trend — Reactor R-204",
                details=(
                    "Hydrogen uptake over the 6-hour cycle was ~18% below the validated batch "
                    "trend. Catalyst Pd/C lot C-2211 was on its 4th recycle cycle; activity "
                    "testing of recycled catalyst is not part of the current SOP."
                ),
            ),
            dict(
                type="observation",
                title="Shift handover note — agitation speed deviation",
                details=(
                    "Night-shift operator recorded agitator running at 85 rpm for the first "
                    "40 minutes against the batch record setpoint of 110 rpm; corrected after "
                    "handover review. Entry countersigned but not escalated as a deviation "
                    "at the time."
                ),
            ),
            dict(
                type="document",
                title="Batch manufacturing record review (BMR-0147)",
                details=(
                    "All raw material lots within expiry and CoA-compliant. Hydrogen pressure "
                    "and temperature within validated ranges throughout. No other parameter "
                    "excursions recorded."
                ),
            ),
        ],
    },
    {
        "deviation": dict(
            title="Temperature excursion during exothermic reaction step",
            batch_number="CTZ-RXN-2026-0089",
            product_name="Cetirizine Hydrochloride API (Intermediate C-2)",
            process_stage="Reaction — Alkylation (Step 2)",
            date_occurred="2026-10-18",
            severity="Major",
            description=(
                "During the alkylation step, reactor temperature rose to 68°C against a "
                "validated range of 55-60°C for approximately 25 minutes before returning to "
                "range. The excursion coincided with the reagent addition phase. In-process "
                "sample showed a darker colour than standard and a 1.8% higher level of the "
                "known degradation impurity Imp-D."
            ),
            immediate_action=(
                "Reagent addition stopped, full cooling applied, batch held for QA disposition. "
                "Extended in-process testing ordered (assay, related substances, colour) before "
                "any decision to proceed to work-up."
            ),
            reported_by="R. Iyer, Production Officer",
            status="Open",
        ),
        "evidence": [
            dict(
                type="equipment_log",
                title="DCS trend — Reactor R-112 temperature profile",
                details=(
                    "Temperature climbed from 57°C to 68°C over 12 minutes during reagent "
                    "addition, stayed above 60°C for ~25 minutes total, then recovered after "
                    "addition was stopped and chilled water flow was manually increased."
                ),
            ),
            dict(
                type="measurement",
                title="Chilled water supply temperature log",
                details=(
                    "Chilled water supply temperature was 11.2°C during the excursion against a "
                    "normal 6-7°C. Utility log shows Chiller CH-2 had tripped on high pressure "
                    "at 14:05 and was restarted at 14:40; no alarm was routed to the production "
                    "area."
                ),
            ),
            dict(
                type="observation",
                title="Reagent addition rate check",
                details=(
                    "Operator added the reagent over ~20 minutes against the BMR-specified "
                    "45-60 minutes. Operator stated the faster addition was 'normal practice' "
                    "on this line; the addition-rate criticality is not highlighted in the BMR."
                ),
            ),
            dict(
                type="document",
                title="Preventive maintenance record — Chiller CH-2",
                details=(
                    "PM for CH-2 was due on 2026-09-30 and was deferred twice; last completed "
                    "PM was 2026-06-15. High-pressure trips recorded three times in the "
                    "previous month without a linked deviation."
                ),
            ),
        ],
    },
]


def seed_if_empty(db: Session) -> None:
    if db.query(Deviation).count() > 0:
        return
    for sample in SAMPLES:
        dev = Deviation(**sample["deviation"])
        db.add(dev)
        db.flush()
        for ev in sample["evidence"]:
            db.add(Evidence(deviation_id=dev.id, **ev))
    db.commit()
