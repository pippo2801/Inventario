import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AIService } from '../aiService';

describe('AIService.localFallbackQueryParser', () => {
  const aiService = new AIService();
  const parser = (q: string) => (aiService as any).localFallbackQueryParser(q);

  it('should detect brand ray-ban', () => {
    const result = parser('cerca ray-ban aviator');
    expect(result.brand).toBe('Ray-Ban');
  });

  it('should detect gender uomo', () => {
    const result = parser('occhiali uomo neri');
    expect(result.gender).toBe('Uomo');
  });

  it('should detect gender donna', () => {
    const result = parser('cerca occhiali donna');
    expect(result.gender).toBe('Donna');
  });

  it('should detect color nero', () => {
    const result = parser('occhiali neri');
    expect(result.color).toBe('nero');
  });

  it('should detect max price', () => {
    const result = parser('occhiali sotto 200 euro');
    expect(result.maxPrice).toBe(200);
  });

  it('should detect showcase intent', () => {
    const result = parser('mostra vetrina');
    expect(result.intent).toBe('showcase');
    expect(result.inShowcase).toBe(true);
  });

  it('should detect promo intent', () => {
    const result = parser('occhiali in promo');
    expect(result.intent).toBe('promotions');
    expect(result.inPromo).toBe(true);
  });

  it('should detect stagnant stock intent', () => {
    const result = parser('stock fermo da un anno');
    expect(result.intent).toBe('stagnant_stock');
    expect(result.stagnantOnly).toBe(true);
  });

  it('should detect find location intent', () => {
    const result = parser('dove si trova RB123');
    expect(result.intent).toBe('find_location');
  });

  it('should default to search_inventory', () => {
    const result = parser('tutti gli occhiali');
    expect(result.intent).toBe('search_inventory');
  });
});
