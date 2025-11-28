/**
 * Tests for date formatting utilities
 */

import {
  formatToTaipeiTime,
  toDateTimeLocalString,
  formatDateTime,
  formatDate,
} from '@/utils/formatDate';

describe('formatDate utilities', () => {
  describe('formatToTaipeiTime', () => {
    it('should format a Date object to Taipei timezone', () => {
      // UTC time: 2024-12-25T06:00:00Z should be 2024/12/25 14:00 in Taipei (UTC+8)
      const utcDate = new Date('2024-12-25T06:00:00Z');
      const result = formatToTaipeiTime(utcDate);
      
      expect(result).toContain('2024');
      expect(result).toContain('12');
      expect(result).toContain('25');
      expect(result).toContain('14');
    });

    it('should format an ISO string to Taipei timezone', () => {
      const isoString = '2024-06-15T00:00:00Z';
      const result = formatToTaipeiTime(isoString);
      
      expect(result).toContain('2024');
      expect(result).toContain('06');
      expect(result).toContain('15');
    });

    it('should respect custom options', () => {
      const date = new Date('2024-12-25T06:00:00Z');
      const result = formatToTaipeiTime(date, {
        year: 'numeric',
        month: 'long',
      });
      
      expect(result).toContain('2024');
    });
  });

  describe('toDateTimeLocalString', () => {
    it('should convert a Date to datetime-local format', () => {
      const utcDate = new Date('2024-12-25T06:30:00Z');
      const result = toDateTimeLocalString(utcDate);
      
      // Should be in format YYYY-MM-DDTHH:mm
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    });

    it('should convert an ISO string to datetime-local format', () => {
      const isoString = '2024-06-15T08:30:00Z';
      const result = toDateTimeLocalString(isoString);
      
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    });
  });

  describe('formatDateTime', () => {
    it('should format date with full date and time', () => {
      const date = new Date('2024-12-25T06:30:00Z');
      const result = formatDateTime(date);
      
      expect(result).toContain('2024');
      expect(result).toContain('12');
      expect(result).toContain('25');
    });

    it('should handle string input', () => {
      const result = formatDateTime('2024-06-15T10:45:00Z');
      
      expect(result).toContain('2024');
      expect(result).toContain('06');
      expect(result).toContain('15');
    });
  });

  describe('formatDate', () => {
    it('should format date with date only (no time)', () => {
      const date = new Date('2024-12-25T06:30:00Z');
      const result = formatDate(date);
      
      expect(result).toContain('2024');
      expect(result).toContain('12');
      expect(result).toContain('25');
    });

    it('should handle string input', () => {
      const result = formatDate('2024-06-15T10:45:00Z');
      
      expect(result).toContain('2024');
      expect(result).toContain('06');
      expect(result).toContain('15');
    });
  });
});
