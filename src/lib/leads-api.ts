import { createApiHeaders, getApiEndpoint } from '@/lib/api';
import type { Lead, LeadPreferredContact } from '@/types/lead';

interface LeadsSuccessResponse {
  success: true;
  leads?: Lead[];
  lead?: Lead;
}

interface LeadsErrorResponse {
  success: false;
  error: string;
}

type LeadsResponse = LeadsSuccessResponse | LeadsErrorResponse;

export interface CreateLeadInput {
  productId?: string;
  fullName: string;
  phone: string;
  email?: string;
  message: string;
  preferredContact: LeadPreferredContact;
  language?: string;
  pageUrl?: string;
}

async function parseLeadsResponse(response: Response): Promise<LeadsResponse> {
  return (await response.json()) as LeadsResponse;
}

export async function createLeadInApi(input: CreateLeadInput) {
  const response = await fetch(getApiEndpoint('/api/leads'), {
    method: 'POST',
    headers: createApiHeaders({ json: true }),
    body: JSON.stringify(input),
  });

  const payload = await parseLeadsResponse(response);
  if (!response.ok || !payload.success || !payload.lead) {
    throw new Error(payload.success ? 'leads_create_failed' : payload.error);
  }

  return payload.lead;
}

export async function fetchLeadsFromApi() {
  const response = await fetch(getApiEndpoint('/api/leads'), {
    method: 'GET',
    headers: createApiHeaders({ auth: true }),
  });

  const payload = await parseLeadsResponse(response);
  if (!response.ok || !payload.success) {
    throw new Error(payload.success ? 'leads_fetch_failed' : payload.error);
  }

  return payload.leads ?? [];
}
