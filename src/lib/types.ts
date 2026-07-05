export type CaseStatus =
  | "draft"
  | "open"
  | "responded"
  | "evidence_open"
  | "ready_for_resolution"
  | "resolving"
  | "resolved"
  | "settled"
  | "cancelled";

export type CaseType =
  | "freelance_delivery"
  | "dao_compensation"
  | "grant_milestone"
  | "community_conflict"
  | "shared_fault_claim"
  | "conditional_approval"
  | "custom";

export type EvidenceType =
  | "agreement"
  | "message_thread"
  | "work_output"
  | "payment_record"
  | "timeline"
  | "screenshot"
  | "public_url"
  | "expert_note"
  | "admission"
  | "counter_evidence";

export type EvidenceSide = "claimant" | "respondent" | "neutral";

export type OutcomeType =
  | "full_claimant_win"
  | "full_respondent_win"
  | "split_payout"
  | "partial_credit"
  | "shared_fault"
  | "conditional_approval"
  | "staged_release"
  | "revision_required"
  | "mutual_concession"
  | "insufficient_evidence"
  | "bad_faith_claim"
  | "manual_review";

export type EvidenceStrength = "strong" | "moderate" | "weak" | "conflicting" | "insufficient";

export interface Evidence {
  evidence_id: number;
  case_id: number;
  submitted_by: string;
  side: EvidenceSide;
  evidence_type: EvidenceType;
  title: string;
  summary: string;
  url?: string;
  content_hash?: string;
  weight_hint: string;
  submitted_at: string;
}

export interface FinalResult {
  outcome_type: OutcomeType;
  claimant_share_bps: number;
  respondent_share_bps: number;
  claimant_responsibility_bps: number;
  respondent_responsibility_bps: number;
  confidence_bps: number;
  evidence_strength: EvidenceStrength;
  middle_reason: string;
  conditions: string[];
  uncertainties: string[];
  settlement_instruction: string;
}

export interface Case {
  case_id: number;
  creator: string;
  respondent: string;
  case_title: string;
  case_type: CaseType;
  agreement_summary: string;
  claimant_position: string;
  respondent_position?: string;
  requested_outcome: string;
  counter_outcome?: string;
  amount_at_stake: number;
  asset_symbol: string;
  created_at: string;
  evidence_deadline: string;
  resolution_deadline: string;
  status: CaseStatus;
  locked_amount?: number;
  final_result?: FinalResult;
  evidence?: Evidence[];
}
