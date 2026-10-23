export type Severity = 'Minor' | 'Major' | 'Critical'
export type Status = 'Open' | 'Under Investigation' | 'CAPA Proposed' | 'Closed'
export type EvidenceType = 'document' | 'observation' | 'measurement' | 'equipment_log'

export interface Evidence {
  id: number
  deviation_id: number
  type: EvidenceType
  title: string
  details: string
  created_at: string
}

export interface Deviation {
  id: number
  title: string
  batch_number: string
  product_name: string
  process_stage: string
  date_occurred: string
  severity: Severity
  description: string
  immediate_action: string
  reported_by: string
  status: Status
  ai_summary: string | null
  ai_root_cause: string | null // JSON string
  ai_capa: string | null // JSON string
  created_at: string
  updated_at: string
  evidence: Evidence[]
}

export interface WhyStep {
  level: number
  question: string
  answer: string
}

export interface RootCause {
  ishikawa: Record<string, string[]>
  five_whys: WhyStep[]
  root_cause_statement: string
}

export interface CapaAction {
  action: string
  owner_role: string
  due_in_days: number
}

export interface Capa {
  corrective_actions: CapaAction[]
  preventive_actions: CapaAction[]
}

export const SEVERITIES: Severity[] = ['Minor', 'Major', 'Critical']
export const STATUSES: Status[] = ['Open', 'Under Investigation', 'CAPA Proposed', 'Closed']
export const EVIDENCE_TYPES: EvidenceType[] = ['document', 'observation', 'measurement', 'equipment_log']
export const ISHIKAWA_CATEGORIES = ['Man', 'Machine', 'Material', 'Method', 'Measurement', 'Environment']
