# Response to Review: Authenticated Evidence and Enforceable Settlement

## Review feedback

> The main limitation is that validators accept any well-formed verdict without checking whether it follows from authenticated evidence. Have validators assess source-backed case facts and connect the result to an enforceable settlement path.

## Resolution

This has been addressed in the deployed Mandorla contract.

### 1. Validators no longer accept a verdict solely because it is well formed

Evidence submissions now require:

- an HTTPS source URL;
- a SHA-256 hash of the source bytes; and
- submission from the claimant or respondent wallet corresponding to the evidence side.

During resolution, the leader and every validator independently fetch each source and verify the fetched bytes against the on-chain SHA-256 commitment. A mismatch or unavailable source rejects the resolution attempt.

Validators independently derive a result from the authenticated source material and compare the settlement-relevant decision fields. The leader's verdict is therefore not trusted merely because it conforms to a JSON schema.

### 2. Verdicts must identify source-backed case facts

The verdict schema now requires `supported_facts`. Each finding includes one or more evidence IDs, and the contract rejects citations to evidence outside the authenticated evidence set. The prompt explicitly treats party positions and evidence summaries as allegations, not facts.

### 3. The result is connected to an enforceable settlement path

Cases use native GEN escrow:

1. The parties fund escrow to exactly the stated amount at stake.
2. Resolution cannot be requested until that exact amount is escrowed.
3. The contract calculates recipient amounts deterministically from the consensus basis-point split.
4. `execute_settlement` transfers the GEN escrow on-chain.

Model-generated settlement instructions are descriptive only; they cannot change transfer amounts. Manual-review, insufficient-evidence, and shared-fault outcomes are marked `manual_required` and cannot auto-release escrow.

## Live verification

The complete flow was executed on GenLayer Studionet using two publicly retrievable GitHub evidence files:

- Claimant delivery source: [`demo_claimant_delivery.txt`](contract/evidence/demo_claimant_delivery.txt)
- Respondent confirmation source: [`demo_respondent_confirmation.txt`](contract/evidence/demo_respondent_confirmation.txt)

The live case produced a source-cited `split_payout` verdict of 75% / 25%, after exact 1 GEN escrow funding. `execute_settlement` completed and the case reached `settled`.

Active Studionet contract: `0xD7CAFCbb6e0C4944b95BEf1ee6f0AA0f2abeBF99`

The reproducible runner is available at [`contract/live_round.ts`](contract/live_round.ts).
