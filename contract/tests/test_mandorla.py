"""
Mandorla contract tests — uses genlayer-test direct mode.

Run:
    pip install genlayer-test
    pytest tests/test_mandorla.py -v
"""

import pytest
import json
from genlayer_test.direct import DirectRunner

CONTRACT_PATH = "mandorla_shared_decision.py"


@pytest.fixture()
def runner():
    r = DirectRunner(CONTRACT_PATH)
    r.deploy([])
    return r


@pytest.fixture()
def claimant():
    return "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA01"


@pytest.fixture()
def respondent():
    return "0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB02"


@pytest.fixture()
def third_party():
    return "0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC03"


# ─── Helpers ──────────────────────────────────────────────────────────────────

def create_basic_case(runner, claimant, respondent):
    """Creates a standard freelance delivery case and returns case_id."""
    case_id = runner.write(
        "create_case",
        args=[
            "Website Redesign Dispute",
            "freelance_delivery",
            respondent,
            "Full website redesign for 3200 GEN. Scope: 7 pages, responsive, CMS handoff.",
            "I delivered the core design system and 4 of 7 agreed pages. Client changed scope mid-project.",
            "Full payment of 3200 GEN for substantial completion",
            3200,
            "GEN",
            1800000000,  # evidence_deadline (unix timestamp)
            1800086400,  # resolution_deadline (evidence_deadline + 1 day)
        ],
        sender=claimant,
    )
    return case_id


# ─── create_case ──────────────────────────────────────────────────────────────

class TestCreateCase:
    def test_creates_case_and_returns_id(self, runner, claimant, respondent):
        case_id = create_basic_case(runner, claimant, respondent)
        assert case_id == 1

    def test_case_count_increments(self, runner, claimant, respondent):
        create_basic_case(runner, claimant, respondent)
        create_basic_case(runner, claimant, respondent)
        count = runner.call("get_case_count")
        assert count == 2

    def test_case_stored_correctly(self, runner, claimant, respondent):
        case_id = create_basic_case(runner, claimant, respondent)
        case_json = runner.call("get_case", args=[case_id])
        case = json.loads(case_json)
        assert case["case_title"] == "Website Redesign Dispute"
        assert case["case_type"] == "freelance_delivery"
        assert case["respondent"] == respondent
        assert case["amount_at_stake"] == 3200
        assert case["status"] == "open"

    def test_creator_is_sender(self, runner, claimant, respondent):
        case_id = create_basic_case(runner, claimant, respondent)
        case = json.loads(runner.call("get_case", args=[case_id]))
        assert case["creator"].lower() == claimant.lower()

    def test_empty_title_rejected(self, runner, claimant, respondent):
        with pytest.raises(Exception, match="title cannot be empty"):
            runner.write(
                "create_case",
                args=["", "freelance_delivery", respondent,
                      "Agreement summary", "My position here in detail", "Full payout",
                      1000, "GEN", 1800000000, 1800086400],
                sender=claimant,
            )

    def test_invalid_case_type_rejected(self, runner, claimant, respondent):
        with pytest.raises(Exception, match="Invalid case type"):
            runner.write(
                "create_case",
                args=["Valid Title", "invalid_type", respondent,
                      "Agreement summary", "My position here in detail", "Full payout",
                      1000, "GEN", 1800000000, 1800086400],
                sender=claimant,
            )

    def test_short_position_rejected(self, runner, claimant, respondent):
        with pytest.raises(Exception, match="at least 10 characters"):
            runner.write(
                "create_case",
                args=["Valid Title", "freelance_delivery", respondent,
                      "Agreement summary", "Too short", "Full payout",
                      1000, "GEN", 1800000000, 1800086400],
                sender=claimant,
            )

    def test_bad_deadline_order_rejected(self, runner, claimant, respondent):
        with pytest.raises(Exception, match="Evidence deadline must be before"):
            runner.write(
                "create_case",
                args=["Title", "freelance_delivery", respondent,
                      "Agreement summary", "Detailed position text here", "Payout",
                      1000, "GEN", 1800086400, 1800000000],  # deadline reversed
                sender=claimant,
            )

    def test_initial_status_is_open(self, runner, claimant, respondent):
        case_id = create_basic_case(runner, claimant, respondent)
        status = runner.call("get_case_status", args=[case_id])
        assert status == "open"

    def test_initial_evidence_list_is_empty(self, runner, claimant, respondent):
        case_id = create_basic_case(runner, claimant, respondent)
        evidence_json = runner.call("get_case_evidence", args=[case_id])
        assert json.loads(evidence_json) == []


# ─── respond_to_case ──────────────────────────────────────────────────────────

class TestRespondToCase:
    def test_respondent_can_respond(self, runner, claimant, respondent):
        case_id = create_basic_case(runner, claimant, respondent)
        runner.write(
            "respond_to_case",
            args=[case_id, "Only 4 of 7 pages were delivered. The responsive build is missing entirely.", "Refund 2000 GEN"],
            sender=respondent,
        )
        case = json.loads(runner.call("get_case", args=[case_id]))
        assert case["respondent_position"] == "Only 4 of 7 pages were delivered. The responsive build is missing entirely."
        assert case["counter_outcome"] == "Refund 2000 GEN"
        assert case["status"] == "responded"

    def test_non_respondent_cannot_respond(self, runner, claimant, respondent, third_party):
        case_id = create_basic_case(runner, claimant, respondent)
        with pytest.raises(Exception, match="Only the named respondent"):
            runner.write(
                "respond_to_case",
                args=[case_id, "Position text", "Counter"],
                sender=third_party,
            )

    def test_claimant_cannot_respond(self, runner, claimant, respondent):
        case_id = create_basic_case(runner, claimant, respondent)
        with pytest.raises(Exception, match="Only the named respondent"):
            runner.write(
                "respond_to_case",
                args=[case_id, "Position text", "Counter"],
                sender=claimant,
            )

    def test_empty_position_rejected(self, runner, claimant, respondent):
        case_id = create_basic_case(runner, claimant, respondent)
        with pytest.raises(Exception, match="cannot be empty"):
            runner.write(
                "respond_to_case",
                args=[case_id, "   ", "Counter"],
                sender=respondent,
            )

    def test_cannot_respond_twice(self, runner, claimant, respondent):
        case_id = create_basic_case(runner, claimant, respondent)
        runner.write(
            "respond_to_case",
            args=[case_id, "My position in detail here.", "Counter outcome"],
            sender=respondent,
        )
        with pytest.raises(Exception, match="not open for response"):
            runner.write(
                "respond_to_case",
                args=[case_id, "Trying again", "Counter"],
                sender=respondent,
            )

    def test_nonexistent_case_raises(self, runner, claimant, respondent):
        with pytest.raises(Exception, match="not found"):
            runner.write(
                "respond_to_case",
                args=[999, "Position", "Counter"],
                sender=respondent,
            )


# ─── submit_evidence ──────────────────────────────────────────────────────────

class TestSubmitEvidence:
    def _setup_responded_case(self, runner, claimant, respondent):
        case_id = create_basic_case(runner, claimant, respondent)
        runner.write(
            "respond_to_case",
            args=[case_id, "Detailed respondent position text.", "Counter outcome"],
            sender=respondent,
        )
        return case_id

    def test_claimant_can_submit_evidence(self, runner, claimant, respondent):
        case_id = self._setup_responded_case(runner, claimant, respondent)
        ev_id = runner.write(
            "submit_evidence",
            args=[case_id, "claimant", "work_output", "Figma Design File",
                  "Complete design showing all screens", "https://figma.com/file/abc",
                  "0xabc123", "Proves substantial delivery"],
            sender=claimant,
        )
        assert ev_id == 1

    def test_respondent_can_submit_evidence(self, runner, claimant, respondent):
        case_id = self._setup_responded_case(runner, claimant, respondent)
        ev_id = runner.write(
            "submit_evidence",
            args=[case_id, "respondent", "agreement", "Signed Contract",
                  "Lists 7 pages and responsive as deliverables", "",
                  "", "Defines agreed scope"],
            sender=respondent,
        )
        assert ev_id == 1

    def test_evidence_stored_correctly(self, runner, claimant, respondent):
        case_id = self._setup_responded_case(runner, claimant, respondent)
        runner.write(
            "submit_evidence",
            args=[case_id, "claimant", "work_output", "Figma File",
                  "Design system and 4 pages", "", "", "Proves work done"],
            sender=claimant,
        )
        evidence_json = runner.call("get_case_evidence", args=[case_id])
        evidence_list = json.loads(evidence_json)
        assert len(evidence_list) == 1
        assert evidence_list[0]["title"] == "Figma File"
        assert evidence_list[0]["side"] == "claimant"
        assert evidence_list[0]["evidence_type"] == "work_output"

    def test_status_advances_to_evidence_open(self, runner, claimant, respondent):
        case_id = self._setup_responded_case(runner, claimant, respondent)
        runner.write(
            "submit_evidence",
            args=[case_id, "claimant", "agreement", "Contract", "Summary", "", "", "Hint"],
            sender=claimant,
        )
        status = runner.call("get_case_status", args=[case_id])
        assert status == "evidence_open"

    def test_multiple_evidence_items_stored(self, runner, claimant, respondent):
        case_id = self._setup_responded_case(runner, claimant, respondent)
        for i in range(3):
            runner.write(
                "submit_evidence",
                args=[case_id, "claimant", "work_output", f"Evidence {i}",
                      f"Summary for item {i}", "", "", "Weight hint"],
                sender=claimant,
            )
        evidence_json = runner.call("get_case_evidence", args=[case_id])
        assert len(json.loads(evidence_json)) == 3

    def test_invalid_side_rejected(self, runner, claimant, respondent):
        case_id = self._setup_responded_case(runner, claimant, respondent)
        with pytest.raises(Exception, match="Invalid side"):
            runner.write(
                "submit_evidence",
                args=[case_id, "villain", "agreement", "Title", "Summary", "", "", "Hint"],
                sender=claimant,
            )

    def test_invalid_type_rejected(self, runner, claimant, respondent):
        case_id = self._setup_responded_case(runner, claimant, respondent)
        with pytest.raises(Exception, match="Invalid evidence type"):
            runner.write(
                "submit_evidence",
                args=[case_id, "claimant", "selfie", "Title", "Summary", "", "", "Hint"],
                sender=claimant,
            )

    def test_empty_title_rejected(self, runner, claimant, respondent):
        case_id = self._setup_responded_case(runner, claimant, respondent)
        with pytest.raises(Exception, match="title is required"):
            runner.write(
                "submit_evidence",
                args=[case_id, "claimant", "agreement", "", "Summary", "", "", "Hint"],
                sender=claimant,
            )

    def test_evidence_count_increments_globally(self, runner, claimant, respondent):
        case_id_1 = self._setup_responded_case(runner, claimant, respondent)
        case_id_2 = create_basic_case(runner, claimant, respondent)
        runner.write("respond_to_case", args=[case_id_2, "Detailed response position.", "Counter"], sender=respondent)

        runner.write("submit_evidence", args=[case_id_1, "claimant", "agreement", "T1", "S1", "", "", "H"], sender=claimant)
        runner.write("submit_evidence", args=[case_id_2, "respondent", "agreement", "T2", "S2", "", "", "H"], sender=respondent)

        ev1 = json.loads(runner.call("get_case_evidence", args=[case_id_1]))
        ev2 = json.loads(runner.call("get_case_evidence", args=[case_id_2]))
        assert ev1[0]["evidence_id"] == 1
        assert ev2[0]["evidence_id"] == 2


# ─── advance_to_ready ─────────────────────────────────────────────────────────

class TestAdvanceToReady:
    def _setup_case_with_evidence(self, runner, claimant, respondent):
        case_id = create_basic_case(runner, claimant, respondent)
        runner.write("respond_to_case", args=[case_id, "Detailed respondent reply.", "Counter"], sender=respondent)
        runner.write("submit_evidence", args=[case_id, "claimant", "work_output", "Files", "Summary", "", "", "Hint"], sender=claimant)
        return case_id

    def test_claimant_can_advance(self, runner, claimant, respondent):
        case_id = self._setup_case_with_evidence(runner, claimant, respondent)
        runner.write("advance_to_ready", args=[case_id], sender=claimant)
        assert runner.call("get_case_status", args=[case_id]) == "ready_for_resolution"

    def test_respondent_can_advance(self, runner, claimant, respondent):
        case_id = self._setup_case_with_evidence(runner, claimant, respondent)
        runner.write("advance_to_ready", args=[case_id], sender=respondent)
        assert runner.call("get_case_status", args=[case_id]) == "ready_for_resolution"

    def test_third_party_cannot_advance(self, runner, claimant, respondent, third_party):
        case_id = self._setup_case_with_evidence(runner, claimant, respondent)
        with pytest.raises(Exception, match="Only case parties"):
            runner.write("advance_to_ready", args=[case_id], sender=third_party)

    def test_cannot_advance_open_case(self, runner, claimant, respondent):
        case_id = create_basic_case(runner, claimant, respondent)
        with pytest.raises(Exception, match="Cannot advance"):
            runner.write("advance_to_ready", args=[case_id], sender=claimant)


# ─── settle_case ──────────────────────────────────────────────────────────────

class TestSettleCase:
    def test_cannot_settle_open_case(self, runner, claimant, respondent):
        case_id = create_basic_case(runner, claimant, respondent)
        with pytest.raises(Exception, match="must be resolved"):
            runner.write("settle_case", args=[case_id], sender=claimant)

    def test_third_party_cannot_settle(self, runner, claimant, respondent, third_party):
        case_id = create_basic_case(runner, claimant, respondent)
        with pytest.raises(Exception, match="Only case parties"):
            runner.write("settle_case", args=[case_id], sender=third_party)


# ─── View methods ─────────────────────────────────────────────────────────────

class TestViewMethods:
    def test_get_nonexistent_case_raises(self, runner):
        with pytest.raises(Exception, match="not found"):
            runner.call("get_case", args=[999])

    def test_get_case_status_nonexistent_raises(self, runner):
        with pytest.raises(Exception, match="not found"):
            runner.call("get_case_status", args=[999])

    def test_get_final_result_without_resolution_raises(self, runner, claimant, respondent):
        case_id = create_basic_case(runner, claimant, respondent)
        with pytest.raises(Exception, match="No final result"):
            runner.call("get_final_result", args=[case_id])

    def test_initial_case_count_is_zero(self, runner):
        assert runner.call("get_case_count") == 0

    def test_case_evidence_empty_for_new_case(self, runner, claimant, respondent):
        case_id = create_basic_case(runner, claimant, respondent)
        result = json.loads(runner.call("get_case_evidence", args=[case_id]))
        assert result == []
