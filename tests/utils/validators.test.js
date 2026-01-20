import { describe, it, expect } from '@jest/globals';
import {
  validateRequired,
  validateFramework,
  validateAIProvider,
  validateFrameworks,
  sanitizeFileName,
  validatePositiveInteger,
  validateBoolean,
} from '../../src/utils/validators.js';

describe('validators', () => {
  describe('validateRequired', () => {
    it('should not throw when all required fields are present', () => {
      const data = { field1: 'value1', field2: 'value2' };
      expect(() => validateRequired(data, ['field1', 'field2'])).not.toThrow();
    });

    it('should throw when required fields are missing', () => {
      const data = { field1: 'value1' };
      expect(() => validateRequired(data, ['field1', 'field2'])).toThrow(
        'Missing required fields: field2'
      );
    });

    it('should throw when multiple required fields are missing', () => {
      const data = {};
      expect(() => validateRequired(data, ['field1', 'field2', 'field3'])).toThrow(
        'Missing required fields: field1, field2, field3'
      );
    });
  });

  describe('validateFramework', () => {
    it('should not throw for valid frameworks', () => {
      expect(() => validateFramework('react')).not.toThrow();
      expect(() => validateFramework('vue')).not.toThrow();
      expect(() => validateFramework('angular')).not.toThrow();
      expect(() => validateFramework('html')).not.toThrow();
    });

    it('should throw for invalid framework', () => {
      expect(() => validateFramework('invalid')).toThrow(
        'Invalid framework. Must be one of: react, vue, angular, html'
      );
    });

    it('should throw for empty string', () => {
      expect(() => validateFramework('')).toThrow();
    });
  });

  describe('validateAIProvider', () => {
    it('should return github as default when no provider is given', () => {
      expect(validateAIProvider()).toBe('github');
      expect(validateAIProvider(null)).toBe('github');
      expect(validateAIProvider(undefined)).toBe('github');
    });

    it('should return the valid provider when given', () => {
      expect(validateAIProvider('github')).toBe('github');
      expect(validateAIProvider('openai')).toBe('openai');
      expect(validateAIProvider('anthropic')).toBe('anthropic');
    });

    it('should throw for invalid provider', () => {
      expect(() => validateAIProvider('invalid')).toThrow(
        'Invalid AI provider. Must be one of: github, openai, anthropic'
      );
    });
  });

  describe('validateFrameworks', () => {
    it('should not throw for valid array of frameworks', () => {
      expect(() => validateFrameworks(['react', 'vue'])).not.toThrow();
      expect(() => validateFrameworks(['html'])).not.toThrow();
      expect(() => validateFrameworks(['react', 'vue', 'angular', 'html'])).not.toThrow();
    });

    it('should throw when frameworks is not an array', () => {
      expect(() => validateFrameworks('react')).toThrow('Frameworks must be an array');
      expect(() => validateFrameworks(null)).toThrow('Frameworks must be an array');
      expect(() => validateFrameworks({})).toThrow('Frameworks must be an array');
    });

    it('should throw when array contains invalid framework', () => {
      expect(() => validateFrameworks(['react', 'invalid'])).toThrow(
        'Invalid framework. Must be one of: react, vue, angular, html'
      );
    });
  });

  describe('sanitizeFileName', () => {
    it('should convert to lowercase', () => {
      expect(sanitizeFileName('MyFile')).toBe('myfile');
    });

    it('should replace spaces with hyphens', () => {
      expect(sanitizeFileName('My File Name')).toBe('my-file-name');
    });

    it('should replace special characters with hyphens', () => {
      expect(sanitizeFileName('file@name#test.txt')).toBe('file-name-test-txt');
    });

    it('should handle multiple consecutive special characters', () => {
      expect(sanitizeFileName('file!!!name')).toBe('file---name');
    });

    it('should handle already sanitized names', () => {
      expect(sanitizeFileName('file-name')).toBe('file-name');
    });
  });

  describe('validatePositiveInteger', () => {
    it('should return default value when value is undefined', () => {
      expect(validatePositiveInteger(undefined, 'field', 10)).toBe(10);
    });

    it('should return default value when value is null', () => {
      expect(validatePositiveInteger(null, 'field', 5)).toBe(5);
    });

    it('should return parsed integer for valid positive numbers', () => {
      expect(validatePositiveInteger(5, 'field', 10)).toBe(5);
      expect(validatePositiveInteger('15', 'field', 10)).toBe(15);
      expect(validatePositiveInteger(100, 'field')).toBe(100);
    });

    it('should throw for zero', () => {
      expect(() => validatePositiveInteger(0, 'field', 10)).toThrow(
        'field must be a positive integer'
      );
    });

    it('should throw for negative numbers', () => {
      expect(() => validatePositiveInteger(-5, 'field', 10)).toThrow(
        'field must be a positive integer'
      );
    });

    it('should throw for non-numeric values', () => {
      expect(() => validatePositiveInteger('abc', 'field', 10)).toThrow(
        'field must be a positive integer'
      );
    });
  });

  describe('validateBoolean', () => {
    it('should return default value when value is undefined', () => {
      expect(validateBoolean(undefined, true)).toBe(true);
      expect(validateBoolean(undefined, false)).toBe(false);
    });

    it('should return default value when value is null', () => {
      expect(validateBoolean(null, true)).toBe(true);
    });

    it('should return false as default when no default is provided', () => {
      expect(validateBoolean(undefined)).toBe(false);
      expect(validateBoolean(null)).toBe(false);
    });

    it('should convert truthy values to true', () => {
      expect(validateBoolean(true)).toBe(true);
      expect(validateBoolean(1)).toBe(true);
      expect(validateBoolean('yes')).toBe(true);
      expect(validateBoolean({})).toBe(true);
    });

    it('should convert falsy values to false', () => {
      expect(validateBoolean(false)).toBe(false);
      expect(validateBoolean(0)).toBe(false);
      expect(validateBoolean('')).toBe(false);
    });
  });
});
