import type { Capa, Deviation, Evidence, EvidenceType, RootCause } from './types'

const BASE = (import.meta as unknown as { env: Record<string, string | undefined> }).env
  .VITE_API_BASE ?? ''

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const resp = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!resp.ok) {
    let message = `Request failed (${resp.status})`
    try {
      const body = await resp.json()
      if (body?.detail) message = body.detail
    } catch {
      /* keep default message */
    }
    throw new Error(message)
  }
  if (resp.status === 204) return undefined as T
  return resp.json() as Promise<T>
}

export const api = {
  listDeviations: () => request<Deviation[]>('/api/deviations'),
  createDeviation: (data: Partial<Deviation>) =>
    request<Deviation>('/api/deviations', { method: 'POST', body: JSON.stringify(data) }),
  updateDeviation: (id: number, data: Partial<Deviation>) =>
    request<Deviation>(`/api/deviations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDeviation: (id: number) => request<void>(`/api/deviations/${id}`, { method: 'DELETE' }),
  addEvidence: (deviationId: number, data: { type: EvidenceType; title: string; details: string }) =>
    request<Evidence>(`/api/deviations/${deviationId}/evidence`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteEvidence: (evidenceId: number) =>
    request<void>(`/api/evidence/${evidenceId}`, { method: 'DELETE' }),
  aiSummary: (id: number) =>
    request<{ summary: string }>(`/api/deviations/${id}/ai/summary`, { method: 'POST' }),
  aiRootCause: (id: number) =>
    request<RootCause>(`/api/deviations/${id}/ai/root-cause`, { method: 'POST' }),
  aiCapa: (id: number) => request<Capa>(`/api/deviations/${id}/ai/capa`, { method: 'POST' }),
}
