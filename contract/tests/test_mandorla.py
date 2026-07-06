"""
Mandorla contract tests — genlayer-test 0.29.2 / gltest direct mode.

Run:
    py -3.12 -m pytest tests/test_mandorla.py -v
"""

import pytest
import json
import pathlib
from gltest.direct import VMContext, deploy_contract

CONTRACT_PATH = pathlib.Path(__file__).parent.parent / "mandorla_shared_decision.py"

CLAIMANT   = "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA01"
RESPONDENT = "0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB02"
THIRD      = "0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC03"

NOW   = 1800000000
LATER = 1800086400


# ─── Fixtures ─────────────────────────────────────────────────────────────────

@pytest.fixture()
def vm():
    return VMContext()


@pytest.fixture()
def contract(vm):
    with vm.activate():
        vm.sender = CLAIMANT
        c = deploy_contract(CONTRACT_PATH, vm)
    return c


# ─── Helpers ──────────────────────────────────────────────────────────────────

def create_basic_case(contract, vm, claimant=CLAIMANT, respondent=RESPONDENT):
    with vm.activate():
        vm.sender = claimant
        case_id = contract.create_case(
            "Website Redesign Dispute",
            "freelance_delivery",
            respondent,
            "Full website redesign for 3200 GEN. Scope: 7 pages, responsive, CMS handoff.",
            "I delivered the core design system and 4 of 7 agreed pages. Client changed scope mid-project.",
            "Full payment of 3200 GEN for substantial completion",
            3200,
            "GEN",
            NOW,
            LATER,
        )
    return case_id


def respond(contract, vm, case_id, position="Only 4 of 7 pages were delivered. The responsive build is missing entirely.", counter="Refund 2000 GEN"):
    with vm.activate():
        vm.sender = RESPONDENT
        contract.respond_to_case(case_id, position, counter)


def submit_ev(contract, vm, case_id, sender=CLAIMANT, side="claimant"):
    with vm.activate():
        vm.sender = sender
        return contract.submit_evidence(
            case_id, side, "work_output", "Figma Design File",
            "Complete design showing all screens", "", "", "Proves substantial delivery",
        )


# ─── create_case ──────────────────────────────────────────────────────────────

class TestCreateCase:
    def test_creates_case_and_returns_id(self, contract, vm):
        case_id = create_basic_case(contract, vm)
        assert case_id == 1

    def test_case_count_increments(self, contract, vm):
        create_basic_case(contract, vm)
        create_basic_case(contract, vm)
        with vm.activate():
            count = contract.get_case_count()
        assert count == 2

    def test_case_stored_correctly(self, contract, vm):
        case_id = create_basic_case(contract, vm)
        with vm.activate():
            c = json.loads(contract.get_case(case_id))
        assert c["case_title"] == "Website Redesign Dispute"
        assert c["case_type"] == "freelance_delivery"
        assert c["respondent"] == RESPONDENT
        assert c["amount_at_stake"] == 3200
        assert c["status"] == "open"

    def test_creator_is_sender(self, contract, vm):
        case_id = create_basic_case(contract, vm)
        with vm.activate():
            c = json.loads(contract.get_case(case_id))
        assert c["creator"].lower() == CLAIMANT.lower()

    def test_empty_title_rejected(self, contract, vm):
        with vm.activate():
            vm.sender = CLAIMANT
            with vm.expect_revert("title cannot be empty"):
                contract.create_case(
                    "", "freelance_delivery", RESPONDENT,
                    "Agreement summary", "My position here in detail", "Full payout",
                    1000, "GEN", NOW, LATER,
                )

    def test_invalid_case_type_rejected(self, contract, vm):
        with vm.activate():
            vm.sender = CLAIMANT
            with vm.expect_revert("Invalid case type"):
                contract.create_case(
                    "Valid Title", "invalid_type", RESPONDENT,
                    "Agreement summary", "My position here in detail", "Full payout",
                    1000, "GEN", NOW, LATER,
                )

    def test_short_position_rejected(self, contract, vm):
        with vm.activate():
            vm.sender = CLAIMANT
            with vm.expect_revert("at least 10 characters"):
                contract.create_case(
                    "Valid Title", "freelance_delivery", RESPONDENT,
                    "Agreement summary", "Too short", "Full payout",
                    1000, "GEN", NOW, LATER,
                )

    def test_bad_deadline_order_rejected(self, contract, vm):
        with vm.activate():
            vm.sender = CLAIMANT
            with vm.expect_revert("Evidence deadline must be before"):
                contract.create_case(
                    "Title", "freelance_delivery", RESPONDENT,
                    "Agreement summary", "Detailed position text here", "Payout",
                    1000, "GEN", LATER, NOW,
                )

    def test_initial_status_is_open(self, contract, vm):
        case_id = create_basic_case(contract, vm)
        with vm.activate():
            status = contract.get_case_status(case_id)
        assert status == "open"

    def test_initial_evidence_list_is_empty(self, contract, vm):
        case_id = create_basic_case(contract, vm)
        with vm.activate():
            ev = json.loads(contract.get_case_evidence(case_id))
        assert ev == []


# ─── respond_to_case ──────────────────────────────────────────────────────────

class TestRespondToCase:
    def test_respondent_can_respond(self, contract, vm):
        case_id = create_basic_case(contract, vm)
        respond(contract, vm, case_id)
        with vm.activate():
            c = json.loads(contract.get_case(case_id))
        assert c["respondent_position"] == "Only 4 of 7 pages were delivered. The responsive build is missing entirely."
        assert c["counter_outcome"] == "Refund 2000 GEN"
        assert c["status"] == "responded"

    def test_non_respondent_cannot_respond(self, contract, vm):
        case_id = create_basic_case(contract, vm)
        with vm.activate():
            vm.sender = THIRD
            with vm.expect_revert("Only the named respondent"):
                contract.respond_to_case(case_id, "Position text", "Counter")

    def test_claimant_cannot_respond(self, contract, vm):
        case_id = create_basic_case(contract, vm)
        with vm.activate():
            vm.sender = CLAIMANT
            with vm.expect_revert("Only the named respondent"):
                contract.respond_to_case(case_id, "Position text", "Counter")

    def test_empty_position_rejected(self, contract, vm):
        case_id = create_basic_case(contract, vm)
        with vm.activate():
            vm.sender = RESPONDENT
            with vm.expect_revert("cannot be empty"):
                contract.respond_to_case(case_id, "   ", "Counter")

    def test_cannot_respond_twice(self, contract, vm):
        case_id = create_basic_case(contract, vm)
        respond(contract, vm, case_id)
        with vm.activate():
            vm.sender = RESPONDENT
            with vm.expect_revert("not open for response"):
                contract.respond_to_case(case_id, "Trying again", "Counter")

    def test_nonexistent_case_raises(self, contract, vm):
        with vm.activate():
            vm.sender = RESPONDENT
            with vm.expect_revert("not found"):
                contract.respond_to_case(999, "Position", "Counter")


# ─── submit_evidence ──────────────────────────────────────────────────────────

class TestSubmitEvidence:
    def _responded_case(self, contract, vm):
        case_id = create_basic_case(contract, vm)
        respond(contract, vm, case_id)
        return case_id

    def test_claimant_can_submit_evidence(self, contract, vm):
        case_id = self._responded_case(contract, vm)
        ev_id = submit_ev(contract, vm, case_id, CLAIMANT, "claimant")
        assert ev_id == 1

    def test_respondent_can_submit_evidence(self, contract, vm):
        case_id = self._responded_case(contract, vm)
        ev_id = submit_ev(contract, vm, case_id, RESPONDENT, "respondent")
        assert ev_id == 1

    def test_evidence_stored_correctly(self, contract, vm):
        case_id = self._responded_case(contract, vm)
        submit_ev(contract, vm, case_id, CLAIMANT, "claimant")
        with vm.activate():
            evs = json.loads(contract.get_case_evidence(case_id))
        assert len(evs) == 1
        assert evs[0]["title"] == "Figma Design File"
        assert evs[0]["side"] == "claimant"
        assert evs[0]["evidence_type"] == "work_output"

    def test_status_advances_to_evidence_open(self, contract, vm):
        case_id = self._responded_case(contract, vm)
        submit_ev(contract, vm, case_id)
        with vm.activate():
            status = contract.get_case_status(case_id)
        assert status == "evidence_open"

    def test_multiple_evidence_items_stored(self, contract, vm):
        case_id = self._responded_case(contract, vm)
        for _ in range(3):
            submit_ev(contract, vm, case_id)
        with vm.activate():
            evs = json.loads(contract.get_case_evidence(case_id))
        assert len(evs) == 3

    def test_invalid_side_rejected(self, contract, vm):
        case_id = self._responded_case(contract, vm)
        with vm.activate():
            vm.sender = CLAIMANT
            with vm.expect_revert("Invalid side"):
                contract.submit_evidence(case_id, "villain", "agreement", "Title", "Summary", "", "", "Hint")

    def test_invalid_type_rejected(self, contract, vm):
        case_id = self._responded_case(contract, vm)
        with vm.activate():
            vm.sender = CLAIMANT
            with vm.expect_revert("Invalid evidence type"):
                contract.submit_evidence(case_id, "claimant", "selfie", "Title", "Summary", "", "", "Hint")

    def test_empty_title_rejected(self, contract, vm):
        case_id = self._responded_case(contract, vm)
        with vm.activate():
            vm.sender = CLAIMANT
            with vm.expect_revert("title is required"):
                contract.submit_evidence(case_id, "claimant", "agreement", "", "Summary", "", "", "Hint")

    def test_evidence_ids_increment_globally(self, contract, vm):
        case_id1 = create_basic_case(contract, vm)
        respond(contract, vm, case_id1)
        case_id2 = create_basic_case(contract, vm)
        with vm.activate():
            vm.sender = RESPONDENT
            contract.respond_to_case(case_id2, "Detailed response position.", "Counter")

        submit_ev(contract, vm, case_id1, CLAIMANT, "claimant")
        submit_ev(contract, vm, case_id2, RESPONDENT, "respondent")

        with vm.activate():
            ev1 = json.loads(contract.get_case_evidence(case_id1))
            ev2 = json.loads(contract.get_case_evidence(case_id2))
        assert ev1[0]["evidence_id"] == 1
        assert ev2[0]["evidence_id"] == 2


# ─── advance_to_ready ─────────────────────────────────────────────────────────

class TestAdvanceToReady:
    def _case_with_evidence(self, contract, vm):
        case_id = create_basic_case(contract, vm)
        respond(contract, vm, case_id)
        submit_ev(contract, vm, case_id)
        return case_id

    def test_claimant_can_advance(self, contract, vm):
        case_id = self._case_with_evidence(contract, vm)
        with vm.activate():
            vm.sender = CLAIMANT
            contract.advance_to_ready(case_id)
        with vm.activate():
            assert contract.get_case_status(case_id) == "ready_for_resolution"

    def test_respondent_can_advance(self, contract, vm):
        case_id = self._case_with_evidence(contract, vm)
        with vm.activate():
            vm.sender = RESPONDENT
            contract.advance_to_ready(case_id)
        with vm.activate():
            assert contract.get_case_status(case_id) == "ready_for_resolution"

    def test_third_party_cannot_advance(self, contract, vm):
        case_id = self._case_with_evidence(contract, vm)
        with vm.activate():
            vm.sender = THIRD
            with vm.expect_revert("Only case parties"):
                contract.advance_to_ready(case_id)

    def test_cannot_advance_open_case(self, contract, vm):
        case_id = create_basic_case(contract, vm)
        with vm.activate():
            vm.sender = CLAIMANT
            with vm.expect_revert("Cannot advance"):
                contract.advance_to_ready(case_id)


# ─── settle_case ──────────────────────────────────────────────────────────────

class TestSettleCase:
    def test_cannot_settle_open_case(self, contract, vm):
        case_id = create_basic_case(contract, vm)
        with vm.activate():
            vm.sender = CLAIMANT
            with vm.expect_revert("must be resolved"):
                contract.settle_case(case_id)

    def test_third_party_cannot_settle(self, contract, vm):
        case_id = create_basic_case(contract, vm)
        with vm.activate():
            vm.sender = THIRD
            with vm.expect_revert("Only case parties"):
                contract.settle_case(case_id)


# ─── View methods ─────────────────────────────────────────────────────────────

class TestViewMethods:
    def test_get_nonexistent_case_raises(self, contract, vm):
        with vm.activate():
            with vm.expect_revert("not found"):
                contract.get_case(999)

    def test_get_case_status_nonexistent_raises(self, contract, vm):
        with vm.activate():
            with vm.expect_revert("not found"):
                contract.get_case_status(999)

    def test_get_final_result_without_resolution_raises(self, contract, vm):
        case_id = create_basic_case(contract, vm)
        with vm.activate():
            with vm.expect_revert("No final result"):
                contract.get_final_result(case_id)

    def test_initial_case_count_is_zero(self, contract, vm):
        with vm.activate():
            assert contract.get_case_count() == 0

    def test_case_evidence_empty_for_new_case(self, contract, vm):
        case_id = create_basic_case(contract, vm)
        with vm.activate():
            ev = json.loads(contract.get_case_evidence(case_id))
        assert ev == []
