# Mandorla Contract

`MandorlaSharedDecision` — GenLayer Intelligent Contract for proportional dispute resolution.

## Setup

```bash
# Install GenLayer CLI
npm install -g genlayer

# Start local network
genlayer up

# Install deploy deps
npm install genlayer-js ts-node typescript @types/node

# Install test deps
pip install genlayer-test pytest
```

## Run Tests

```bash
pytest tests/test_mandorla.py -v
```

## Deploy

```bash
# Studionet (default) — https://studio.genlayer.com  Chain ID 61999
npx ts-node deploy.ts

# Local dev
GENLAYER_NETWORK=localnet npx ts-node deploy.ts
```

Get test GEN from the 💧 faucet button inside [GenLayer Studio](https://studio.genlayer.com).

Then add the printed address to `.env.local`:

```
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_GENLAYER_RPC=https://studio.genlayer.com/api
```

## Contract Methods

### Write

| Method | Description |
|---|---|
| `create_case(...)` | Opens a new case; caller becomes claimant |
| `respond_to_case(case_id, position, counter_outcome)` | Respondent submits their truth |
| `submit_evidence(case_id, side, type, ...)` | Adds an evidence tile |
| `advance_to_ready(case_id)` | Moves case to ready_for_resolution |
| `request_resolution(case_id)` | Triggers GenLayer validator consensus |
| `settle_case(case_id)` | Marks case settled after instruction executed |

### Read

| Method | Returns |
|---|---|
| `get_case(case_id)` | Full case record as JSON string |
| `get_case_evidence(case_id)` | All evidence as JSON array string |
| `get_final_result(case_id)` | Canonical result JSON string |
| `get_case_status(case_id)` | Status string |
| `get_case_count()` | Total cases created |

## Result Schema

```json
{
  "outcome_type": "split_payout",
  "claimant_share_bps": 6500,
  "respondent_share_bps": 3500,
  "claimant_responsibility_bps": 3000,
  "respondent_responsibility_bps": 7000,
  "confidence_bps": 8100,
  "evidence_strength": "strong",
  "middle_reason": "...",
  "conditions": ["..."],
  "uncertainties": ["..."],
  "settlement_instruction": "..."
}
```

All monetary values use basis points (bps). Divide by 100 for percentages.
`claimant_share_bps + respondent_share_bps = 10000` for all outcome types except `manual_review`, `insufficient_evidence`, and `shared_fault`.
