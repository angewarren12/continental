/**
 * Tests unitaires basiques pour l'app cliente
 * 
 * Pour exécuter les tests:
 * npm install --save-dev vitest @testing-library/react
 * npm test
 */

import { describe, it, expect } from 'vitest';

describe('Client App Utils', () => {
  it('should calculate total from order items', () => {
    const calculateTotal = (items: Array<{ quantity: number; unitPrice: number }>) => {
      return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    };
    
    const items = [
      { quantity: 2, unitPrice: 10.5 },
      { quantity: 1, unitPrice: 5.0 },
    ];
    
    expect(calculateTotal(items)).toBe(26.0);
  });

  it('should format date correctly', () => {
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    };
    
    const date = new Date('2024-01-15');
    expect(formatDate(date)).toBe('15/01/2024');
  });
});
