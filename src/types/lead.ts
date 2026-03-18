export type LeadPreferredContact = 'phone' | 'whatsapp' | 'email';

export interface Lead {
  id: string;
  productId?: string;
  fullName: string;
  phone: string;
  email?: string;
  message: string;
  preferredContact: LeadPreferredContact;
  language?: string;
  pageUrl?: string;
  createdAt: string;
}
