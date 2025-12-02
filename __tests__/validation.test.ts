/**
 * Tests for validation utilities
 */

// Mock mongoose to avoid ESM import issues in Jest environment
// The mock replicates MongoDB ObjectId validation: valid IDs are 24-character hex strings
jest.mock('mongoose', () => ({
  Types: {
    ObjectId: {
      isValid: (id: string) => {
        return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
      },
    },
  },
}));

import {
  isValidObjectId,
  validateDateRange,
  validatePagination,
  isValidRule,
  isValidRemark,
  validateRequiredFields,
} from '@/lib/validation';

describe('validation utilities', () => {
  describe('isValidObjectId', () => {
    it('should return true for valid MongoDB ObjectId', () => {
      const validId = '507f1f77bcf86cd799439011';
      expect(isValidObjectId(validId)).toBe(true);
    });

    it('should return false for invalid ObjectId', () => {
      expect(isValidObjectId('invalid-id')).toBe(false);
      expect(isValidObjectId('123')).toBe(false);
      expect(isValidObjectId('')).toBe(false);
    });

    it('should return true for 24 character hex string', () => {
      const hexId = '123456789012345678901234';
      expect(isValidObjectId(hexId)).toBe(true);
    });
  });

  describe('validateDateRange', () => {
    it('should return valid for correct date range', () => {
      const openFrom = new Date('2024-01-01');
      const openTo = new Date('2024-12-31');
      
      const result = validateDateRange(openFrom, openTo);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid when openFrom is after openTo', () => {
      const openFrom = new Date('2024-12-31');
      const openTo = new Date('2024-01-01');
      
      const result = validateDateRange(openFrom, openTo);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return invalid when openFrom equals openTo', () => {
      const date = new Date('2024-06-15');
      
      const result = validateDateRange(date, date);
      expect(result.valid).toBe(false);
    });

    it('should return invalid for invalid date', () => {
      const invalidDate = new Date('invalid');
      const validDate = new Date('2024-01-01');
      
      const result = validateDateRange(invalidDate, validDate);
      expect(result.valid).toBe(false);
    });
  });

  describe('validatePagination', () => {
    it('should return default values when no params provided', () => {
      const result = validatePagination({});
      expect(result.limit).toBe(100);
      expect(result.skip).toBe(0);
    });

    it('should parse valid limit and skip', () => {
      const result = validatePagination({ limit: '50', skip: '10' });
      expect(result.limit).toBe(50);
      expect(result.skip).toBe(10);
    });

    it('should cap limit at MAX_LIMIT', () => {
      const result = validatePagination({ limit: '1000' });
      expect(result.limit).toBe(100);
    });

    it('should set minimum limit to MIN_LIMIT', () => {
      const result = validatePagination({ limit: '-5' });
      expect(result.limit).toBe(1);
    });

    it('should set minimum skip to 0', () => {
      const result = validatePagination({ skip: '-10' });
      expect(result.skip).toBe(0);
    });
  });

  describe('isValidRule', () => {
    it('should return true for valid rules', () => {
      expect(isValidRule('choose_all')).toBe(true);
      expect(isValidRule('choose_one')).toBe(true);
    });

    it('should return false for invalid rules', () => {
      expect(isValidRule('invalid_rule')).toBe(false);
      expect(isValidRule('')).toBe(false);
      expect(isValidRule('CHOOSE_ALL')).toBe(false);
    });
  });

  describe('isValidRemark', () => {
    it('should return true for valid remarks', () => {
      expect(isValidRemark('我要投給他')).toBe(true);
      expect(isValidRemark('我不投給他')).toBe(true);
      expect(isValidRemark('我沒有意見')).toBe(true);
    });

    it('should return false for invalid remarks', () => {
      expect(isValidRemark('invalid_remark')).toBe(false);
      expect(isValidRemark('')).toBe(false);
      expect(isValidRemark('yes')).toBe(false);
    });
  });

  describe('validateRequiredFields', () => {
    it('should return valid when all required fields are present', () => {
      const obj = { name: 'John', age: 25, email: 'john@example.com' };
      const required = ['name', 'age', 'email'];
      
      const result = validateRequiredFields(obj, required);
      expect(result.valid).toBe(true);
      expect(result.missingFields).toBeUndefined();
    });

    it('should return invalid with missing fields', () => {
      const obj = { name: 'John' };
      const required = ['name', 'age', 'email'];
      
      const result = validateRequiredFields(obj, required);
      expect(result.valid).toBe(false);
      expect(result.missingFields).toEqual(['age', 'email']);
    });

    it('should treat empty string as missing', () => {
      const obj = { name: '', age: 25 };
      const required = ['name', 'age'];
      
      const result = validateRequiredFields(obj, required);
      expect(result.valid).toBe(false);
      expect(result.missingFields).toEqual(['name']);
    });

    it('should treat null as missing', () => {
      const obj = { name: null, age: 25 };
      const required = ['name', 'age'];
      
      const result = validateRequiredFields(obj, required);
      expect(result.valid).toBe(false);
      expect(result.missingFields).toEqual(['name']);
    });

    it('should return valid for empty required array', () => {
      const obj = { name: 'John' };
      const required: string[] = [];
      
      const result = validateRequiredFields(obj, required);
      expect(result.valid).toBe(true);
    });
  });
});
