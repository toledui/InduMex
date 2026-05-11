export type B2BTier = 'premium' | 'verified' | 'basic';

export interface B2BProvider {
  id: string;
  name: string;
  slug: string;
  logo: string;
  tier: B2BTier;
  shortDescription: string;
  about: string;
  sectors: string[];
  certifications: string[];
  location: {
    city: string;
    state: string;
    country: string;
  };
  contact: {
    website: string;
    email: string;
    phone: string;
    whatsapp: string;
  };
  isActive: boolean;
}