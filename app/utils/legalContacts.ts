// Utility functions for managing legal contacts

export interface LegalContacts {
  epaContact: string;
  policeContact: string;
  miningCommissionContact: string;
}

export const defaultLegalContacts: LegalContacts = {
  epaContact: '+233 302 664 697',
  policeContact: '191',
  miningCommissionContact: '+233 302 665 064'
};

// Get saved legal contacts from localStorage
export const getSavedLegalContacts = (): LegalContacts => {
  if (typeof window === 'undefined') {
    return defaultLegalContacts;
  }
  
  const saved = localStorage.getItem('goldguard_legal_contacts');
  return saved ? JSON.parse(saved) : defaultLegalContacts;
};

// Save legal contacts to localStorage
export const saveLegalContacts = (contacts: LegalContacts): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('goldguard_legal_contacts', JSON.stringify(contacts));
  }
};

// Check if legal contacts have been customized
export const hasCustomLegalContacts = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  
  return localStorage.getItem('goldguard_legal_contacts') !== null;
};
