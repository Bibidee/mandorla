# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json
import re

# ─── Constants ────────────────────────────────────────────────────────────────

VALID_CASE_TYPES = {
    "freelance_delivery", "dao_compensation", "grant_milestone",
    "community_conflict", "shared_fault_claim", "conditional_approval", "custom",
}

VALID_OUTCOME_TYPES = {
    "full_claimant_win", "full_respondent_win", "split_payout", "partial_credit",
    "shared_fault", "conditional_approval", "staged_release", "revision_required",
    "mutual_concession", "insufficient_evidence", "bad_faith_claim", "manual_review",
}

VALID_EVIDENCE_TYPES = {
    "agreement", "message_thread", "work_output", "payment_record", "timeline",
    "screenshot", "public_url", "expert_note", "admission", "counter_evidence",
}

VALID_EVIDENCE_SIDES = {"claimant", "respondent", "neutral"}
VALID_EVIDENCE_STRENGTHS = {"strong", "moderate", "weak", "conflicting", "insufficient"}

# outcome types where share_bps need not sum to 10000
OPEN_SUM_OUTCOMES = {"manual_review", "insufficient_evidence", "shared_fault"}


# ─── Contract ─────────────────────────────────────────────────────────────────

class MandorlaSharedDecision(gl.Contract):
    """
    Mandorla: a GenLayer protocol for resolving ambiguous claims through
    proportional outcomes instead of binary winners.

    Storage layout (all complex data stored as JSON strings):
        cases               TreeMap[u32, str]  — case_id -> case JSON
        case_evidence_ids   TreeMap[u32, str]  — case_id -> JSON array of evidence IDs
        evidence_store      TreeMap[u32, str]  — evidence_id -> evidence JSON
        final_results       TreeMap[u32, str]  — case_id -> result JSON
        case_statuses       TreeMap[u32, str]  — case_id -> status string (fast lookup)
        case_count          u32
        evidence_count      u32
    """

    case_count: u32
    evidence_count: u32
    cases: TreeMap[u32, str]
    case_evidence_ids: TreeMap[u32, str]
    evidence_store: TreeMap[u32, str]
    final_results: TreeMap[u32, str]
    case_statuses: TreeMap[u32, str]

    def __init__(self) -> None:
        self.case_count = u32(0)
        self.evidence_count = u32(0)

    # ─── Write: Case Lifecycle ────────────────────────────────────────────────

    @gl.public.write
    def create_case(
        self,
        case_title: str,
        case_type: str,
        respondent: str,
        agreement_summary: str,
        claimant_position: str,
        requested_outcome: str,
        amount_at_stake: u32,
        asset_symbol: str,
        evidence_deadline: u32,
        resolution_deadline: u32,
    ) -> u32:
        """
        Opens a new Mandorla case. Returns the new case_id.
        The caller becomes the claimant (creator).
        """
        if not case_title.strip():
            raise gl.UserError("Case title cannot be empty")
        if case_type not in VALID_CASE_TYPES:
            raise gl.UserError(f"Invalid case type: {case_type}. Valid: {', '.join(sorted(VALID_CASE_TYPES))}")
        if len(claimant_position.strip()) < 10:
            raise gl.UserError("Claimant position must be at least 10 characters")
        if not agreement_summary.strip():
            raise gl.UserError("Agreement summary cannot be empty")
        if int(amount_at_stake) < 0:
            raise gl.UserError("Amount at stake cannot be negative")
        if int(evidence_deadline) >= int(resolution_deadline):
            raise gl.UserError("Evidence deadline must be before resolution deadline")

        self.case_count = u32(int(self.case_count) + 1)
        case_id = self.case_count

        case_data = {
            "case_id": int(case_id),
            "creator": str(gl.message.sender),
            "respondent": respondent,
            "case_title": case_title,
            "case_type": case_type,
            "agreement_summary": agreement_summary,
            "claimant_position": claimant_position,
            "respondent_position": "",
            "requested_outcome": requested_outcome,
            "counter_outcome": "",
            "amount_at_stake": int(amount_at_stake),
            "asset_symbol": asset_symbol,
            "evidence_deadline": int(evidence_deadline),
            "resolution_deadline": int(resolution_deadline),
            "status": "open",
            "locked_amount": 0,
            "final_result_json": "",
        }

        self.cases[case_id] = json.dumps(case_data)
        self.case_statuses[case_id] = "open"
        self.case_evidence_ids[case_id] = "[]"

        return case_id

    @gl.public.write
    def respond_to_case(
        self,
        case_id: u32,
        respondent_position: str,
        counter_outcome: str,
    ) -> None:
        """
        Allows the named respondent to submit their counter-position.
        Moves status from 'open' to 'responded'.
        """
        case = _load_case(self, case_id)

        if str(gl.message.sender) != case["respondent"]:
            raise gl.UserError("Only the named respondent can respond to this case")
        if case["status"] != "open":
            raise gl.UserError(f"Case is not open for response (current status: {case['status']})")
        if not respondent_position.strip():
            raise gl.UserError("Respondent position cannot be empty")

        case["respondent_position"] = respondent_position
        case["counter_outcome"] = counter_outcome
        case["status"] = "responded"

        self.cases[case_id] = json.dumps(case)
        self.case_statuses[case_id] = "responded"

    @gl.public.write
    def submit_evidence(
        self,
        case_id: u32,
        side: str,
        evidence_type: str,
        title: str,
        summary: str,
        url: str,
        content_hash: str,
        weight_hint: str,
    ) -> u32:
        """
        Adds an evidence tile to a case. Returns the new evidence_id.
        Advances case status to 'evidence_open' if currently 'responded'.
        weight_hint is informational — validators must assess evidence independently.
        """
        case = _load_case(self, case_id)

        if case["status"] not in ("open", "responded", "evidence_open"):
            raise gl.UserError(f"Case is not accepting evidence (status: {case['status']})")
        if side not in VALID_EVIDENCE_SIDES:
            raise gl.UserError(f"Invalid side: {side}. Must be: claimant, respondent, or neutral")
        if evidence_type not in VALID_EVIDENCE_TYPES:
            raise gl.UserError(f"Invalid evidence type: {evidence_type}")
        if not title.strip():
            raise gl.UserError("Evidence title is required")
        if not summary.strip():
            raise gl.UserError("Evidence summary is required")

        self.evidence_count = u32(int(self.evidence_count) + 1)
        evidence_id = self.evidence_count

        evidence_data = {
            "evidence_id": int(evidence_id),
            "case_id": int(case_id),
            "submitted_by": str(gl.message.sender),
            "side": side,
            "evidence_type": evidence_type,
            "title": title,
            "summary": summary,
            "url": url,
            "content_hash": content_hash,
            "weight_hint": weight_hint,
        }
        self.evidence_store[evidence_id] = json.dumps(evidence_data)

        ids = json.loads(self.case_evidence_ids.get(case_id, "[]"))
        ids.append(int(evidence_id))
        self.case_evidence_ids[case_id] = json.dumps(ids)

        if case["status"] == "responded":
            case["status"] = "evidence_open"
            self.cases[case_id] = json.dumps(case)
            self.case_statuses[case_id] = "evidence_open"

        return evidence_id

    @gl.public.write
    def advance_to_ready(self, case_id: u32) -> None:
        """
        Moves a case to 'ready_for_resolution'.
        Can be called by either party once the evidence phase is complete.
        In production, this would also check evidence_deadline timestamp.
        """
        case = _load_case(self, case_id)
        caller = str(gl.message.sender)

        if caller != case["creator"] and caller != case["respondent"]:
            raise gl.UserError("Only case parties can advance to ready")
        if case["status"] not in ("responded", "evidence_open"):
            raise gl.UserError(f"Cannot advance to ready from status: {case['status']}")

        case["status"] = "ready_for_resolution"
        self.cases[case_id] = json.dumps(case)
        self.case_statuses[case_id] = "ready_for_resolution"

    @gl.public.write
    def request_resolution(self, case_id: u32) -> None:
        """
        The core GenLayer method. Runs a non-deterministic validator prompt
        to determine the proportional fair middle outcome. Stores the
        canonical JSON result under consensus.

        Either party may trigger resolution once the case is ready.
        """
        case = _load_case(self, case_id)

        if case["status"] != "ready_for_resolution":
            raise gl.UserError(f"Case is not ready for resolution (status: {case['status']})")

        caller = str(gl.message.sender)
        if caller != case["creator"] and caller != case["respondent"]:
            raise gl.UserError("Only case parties can request resolution")

        # ── Load all evidence into local memory before the nondet block ──────
        # (reading storage directly inside nondet is not yet supported)
        evidence_ids = json.loads(self.case_evidence_ids.get(case_id, "[]"))
        evidence_list = []
        for eid in evidence_ids:
            ev_json = self.evidence_store.get(u32(eid), "")
            if ev_json:
                ev = json.loads(ev_json)
                evidence_list.append({
                    "side": ev["side"],
                    "type": ev["evidence_type"],
                    "title": ev["title"],
                    "summary": ev["summary"],
                    "weight_hint": ev["weight_hint"],
                })

        # ── Build the prompt (deterministic — must happen outside nondet) ─────
        evidence_json_str = json.dumps(evidence_list, indent=2)
        prompt = _build_resolution_prompt(case, evidence_json_str)

        # Mark as resolving immediately so it cannot be triggered twice
        case["status"] = "resolving"
        self.cases[case_id] = json.dumps(case)
        self.case_statuses[case_id] = "resolving"

        # ── Non-deterministic GenLayer consensus block ─────────────────────────
        def leader_fn():
            raw = gl.nondet.exec_prompt(prompt, response_format="json")
            result = _parse_and_validate_result(raw, case)
            return result

        def validator_fn(leader_result) -> bool:
            if not isinstance(leader_result, gl.vm.Return):
                return False
            return _is_valid_result_structure(leader_result.calldata, case)

        consensus_result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

        # ── Store canonical result and finalise case ───────────────────────────
        result_json = json.dumps(consensus_result)
        self.final_results[case_id] = result_json

        case["status"] = "resolved"
        case["final_result_json"] = result_json
        self.cases[case_id] = json.dumps(case)
        self.case_statuses[case_id] = "resolved"

    @gl.public.write
    def settle_case(self, case_id: u32) -> None:
        """
        Marks the case as settled after the parties execute the
        settlement instruction. In a full integration this triggers
        the actual token transfer based on the result's bps split.
        """
        case = _load_case(self, case_id)
        caller = str(gl.message.sender)

        if caller != case["creator"] and caller != case["respondent"]:
            raise gl.UserError("Only case parties can settle")
        if case["status"] != "resolved":
            raise gl.UserError(f"Case must be resolved before settling (status: {case['status']})")
        if not self.final_results.get(case_id, ""):
            raise gl.UserError("No final result found for this case")

        case["status"] = "settled"
        self.cases[case_id] = json.dumps(case)
        self.case_statuses[case_id] = "settled"

    # ─── View Methods ─────────────────────────────────────────────────────────

    @gl.public.view
    def get_case(self, case_id: u32) -> str:
        """Returns the full case record as a JSON string."""
        result = self.cases.get(case_id, "")
        if not result:
            raise gl.UserError(f"Case {case_id} not found")
        return result

    @gl.public.view
    def get_case_evidence(self, case_id: u32) -> str:
        """Returns all evidence for a case as a JSON array string."""
        ids = json.loads(self.case_evidence_ids.get(case_id, "[]"))
        evidence_list = []
        for eid in ids:
            ev_json = self.evidence_store.get(u32(eid), "")
            if ev_json:
                evidence_list.append(json.loads(ev_json))
        return json.dumps(evidence_list)

    @gl.public.view
    def get_final_result(self, case_id: u32) -> str:
        """Returns the canonical final result JSON string."""
        result = self.final_results.get(case_id, "")
        if not result:
            raise gl.UserError(f"No final result for case {case_id}")
        return result

    @gl.public.view
    def get_case_status(self, case_id: u32) -> str:
        """Returns the current status string for a case."""
        status = self.case_statuses.get(case_id, "")
        if not status:
            raise gl.UserError(f"Case {case_id} not found")
        return status

    @gl.public.view
    def get_case_count(self) -> u32:
        """Returns the total number of cases created."""
        return self.case_count


# ─── Private helpers (module-level, not part of ABI) ─────────────────────────

def _load_case(contract: MandorlaSharedDecision, case_id: u32) -> dict:
    case_json = contract.cases.get(case_id, "")
    if not case_json:
        raise gl.UserError(f"Case {case_id} not found")
    return json.loads(case_json)


def _build_resolution_prompt(case: dict, evidence_json_str: str) -> str:
    respondent_position = case.get("respondent_position") or "(no response submitted — treat as non-appearance)"
    counter_outcome = case.get("counter_outcome") or "(none)"

    return f"""You are a Mandorla validator resolving a shared-decision case.

Mandorla is a protocol for cases where two or more positions may be partly true.
Your task is to identify the fairest proportional outcome based on overlapping truths.

Core principle: Do not default to a binary winner unless the evidence clearly and strongly supports it.
Middle does not mean equal. A 65/35 split is a valid middle outcome.

─── CASE ────────────────────────────────────────────────────

CASE TITLE: {case["case_title"]}
CASE TYPE: {case["case_type"]}

AGREEMENT OR EXPECTATION:
{case["agreement_summary"]}

─── POSITIONS ───────────────────────────────────────────────

CLAIMANT POSITION:
{case["claimant_position"]}

CLAIMANT REQUESTED OUTCOME:
{case["requested_outcome"]}

RESPONDENT POSITION:
{respondent_position}

RESPONDENT COUNTER OUTCOME:
{counter_outcome}

AMOUNT AT STAKE: {case["amount_at_stake"]} {case["asset_symbol"]}

─── EVIDENCE ────────────────────────────────────────────────

{evidence_json_str if evidence_json_str != "[]" else "No evidence submitted."}

─── EVALUATION REQUIRED ─────────────────────────────────────

Evaluate each of the following before deciding:
1. What parts of the claimant's position are supported by evidence?
2. What parts of the respondent's position are supported by evidence?
3. What facts remain genuinely uncertain?
4. Did either side overclaim or misrepresent?
5. Was performance complete, partial, defective, delayed, excused, or misrepresented?
6. What proportional result best fits the actual overlap of supported facts?
7. Are there conditions, revision requirements, staged release, or manual review needs?

─── OUTPUT FORMAT ───────────────────────────────────────────

Return ONLY a valid JSON object with exactly these keys and no others:

{{
  "outcome_type": "<one of: full_claimant_win | full_respondent_win | split_payout | partial_credit | shared_fault | conditional_approval | staged_release | revision_required | mutual_concession | insufficient_evidence | bad_faith_claim | manual_review>",
  "claimant_share_bps": <integer 0-10000>,
  "respondent_share_bps": <integer 0-10000>,
  "claimant_responsibility_bps": <integer 0-10000>,
  "respondent_responsibility_bps": <integer 0-10000>,
  "confidence_bps": <integer 0-10000>,
  "evidence_strength": "<one of: strong | moderate | weak | conflicting | insufficient>",
  "middle_reason": "<one concise paragraph explaining the proportional rationale>",
  "conditions": ["<condition string>"],
  "uncertainties": ["<uncertainty string>"],
  "settlement_instruction": "<clear actionable instruction for payout or next step>"
}}

Rules:
- claimant_share_bps + respondent_share_bps MUST equal 10000, EXCEPT when outcome_type is manual_review, insufficient_evidence, or shared_fault (where no monetary split applies).
- claimant_responsibility_bps + respondent_responsibility_bps should reflect proportional fault and need not match the payout split.
- All bps values are integers between 0 and 10000.
- conditions and uncertainties must be arrays (empty array [] if none).
- Do not include markdown fences, comments, or keys not listed above.
- Do not include any text before or after the JSON object."""


def _parse_and_validate_result(raw: any, case: dict) -> dict:
    """
    Called on the leader node. Parses, cleans, and validates the LLM response.
    Raises gl.UserError to force leader rotation if the response is unusable.
    """
    if isinstance(raw, str):
        first = raw.find("{")
        last = raw.rfind("}")
        if first == -1 or last == -1:
            raise gl.UserError("LLM returned no JSON object in response")
        raw = raw[first:last + 1]
        # Remove trailing commas before ] or } (common LLM mistake)
        raw = re.sub(r",\s*([}\]])", r"\1", raw)
        try:
            raw = json.loads(raw)
        except Exception as e:
            raise gl.UserError(f"LLM JSON parse failed: {e}")

    if not isinstance(raw, dict):
        raise gl.UserError(f"LLM returned non-dict type: {type(raw)}")

    required_keys = [
        "outcome_type", "claimant_share_bps", "respondent_share_bps",
        "claimant_responsibility_bps", "respondent_responsibility_bps",
        "confidence_bps", "evidence_strength", "middle_reason",
        "conditions", "uncertainties", "settlement_instruction",
    ]
    for key in required_keys:
        if key not in raw:
            raise gl.UserError(f"LLM result missing required key: {key}")

    if raw["outcome_type"] not in VALID_OUTCOME_TYPES:
        raise gl.UserError(f"Invalid outcome_type: {raw['outcome_type']}")
    if raw["evidence_strength"] not in VALID_EVIDENCE_STRENGTHS:
        raise gl.UserError(f"Invalid evidence_strength: {raw['evidence_strength']}")

    # Coerce bps values to int
    for bps_key in ("claimant_share_bps", "respondent_share_bps",
                    "claimant_responsibility_bps", "respondent_responsibility_bps",
                    "confidence_bps"):
        try:
            raw[bps_key] = int(raw[bps_key])
        except (TypeError, ValueError):
            raise gl.UserError(f"Non-integer bps value for {bps_key}: {raw[bps_key]}")

    if raw["outcome_type"] not in OPEN_SUM_OUTCOMES:
        total = raw["claimant_share_bps"] + raw["respondent_share_bps"]
        if total != 10000:
            raise gl.UserError(f"Payout bps must sum to 10000, got {total}")

    if not isinstance(raw["conditions"], list):
        raw["conditions"] = []
    if not isinstance(raw["uncertainties"], list):
        raw["uncertainties"] = []
    if not isinstance(raw["middle_reason"], str) or not raw["middle_reason"].strip():
        raise gl.UserError("middle_reason cannot be empty")
    if not isinstance(raw["settlement_instruction"], str) or not raw["settlement_instruction"].strip():
        raise gl.UserError("settlement_instruction cannot be empty")

    # Return only the canonical fields — strip any extra keys the LLM added
    return {k: raw[k] for k in required_keys}


def _is_valid_result_structure(data: any, case: dict) -> bool:
    """
    Called on each validator node. Checks structure and validity rather than
    exact match — LLM outputs are non-deterministic, but the structured
    fields they produce must satisfy these invariants.
    """
    if not isinstance(data, dict):
        return False
    try:
        if data.get("outcome_type") not in VALID_OUTCOME_TYPES:
            return False
        if data.get("evidence_strength") not in VALID_EVIDENCE_STRENGTHS:
            return False

        c_bps = int(data.get("claimant_share_bps", -1))
        r_bps = int(data.get("respondent_share_bps", -1))
        conf = int(data.get("confidence_bps", -1))
        cr_bps = int(data.get("claimant_responsibility_bps", -1))
        rr_bps = int(data.get("respondent_responsibility_bps", -1))

        for val in (c_bps, r_bps, conf, cr_bps, rr_bps):
            if not (0 <= val <= 10000):
                return False

        if data["outcome_type"] not in OPEN_SUM_OUTCOMES:
            if c_bps + r_bps != 10000:
                return False

        if not isinstance(data.get("middle_reason"), str) or not data["middle_reason"].strip():
            return False
        if not isinstance(data.get("conditions"), list):
            return False
        if not isinstance(data.get("uncertainties"), list):
            return False
        if not isinstance(data.get("settlement_instruction"), str) or not data["settlement_instruction"].strip():
            return False

        return True
    except (TypeError, ValueError, KeyError):
        return False
