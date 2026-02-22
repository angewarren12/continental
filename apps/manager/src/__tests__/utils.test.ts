/**
 * Tests unitaires basiques pour l'app gestionnaire
 * 
 * Pour exécuter les tests:
 * npm install --save-dev vitest @testing-library/react
 * npm test
 */

import { describe, it, expect } from 'vitest';

describe('Manager App Utils', () => {
  it('should format currency correctly', () => {
    const formatCurrency = (amount: number) => {
      return `${amount.toFixed(2)} €`;
    };
    
    expect(formatCurrency(10.5)).toBe('10.50 €');
    expect(formatCurrency(0)).toBe('0.00 €');
    expect(formatCurrency(1000)).toBe('1000.00 €');
  });

  it('should validate phone number format', () => {
    const isValidPhone = (phone: string) => {
      const phoneRegex = /^(\+225|0)[1-9](\d{2}){4}$/;
      return phoneRegex.test(phone.replace(/\s/g, ''));
    };
    
    expect(isValidPhone('0612345678')).toBe(true);
    expect(isValidPhone('+225612345678')).toBe(true);
    expect(isValidPhone('123')).toBe(false);
  });
});
