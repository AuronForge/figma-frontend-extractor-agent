import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock fs/promises before importing the repository
const mockAccess = jest.fn();
const mockMkdir = jest.fn();
const mockWriteFile = jest.fn();
const mockReadFile = jest.fn();

await jest.unstable_mockModule('fs/promises', () => ({
  default: {
    access: mockAccess,
    mkdir: mockMkdir,
    writeFile: mockWriteFile,
    readFile: mockReadFile,
  },
  access: mockAccess,
  mkdir: mockMkdir,
  writeFile: mockWriteFile,
  readFile: mockReadFile,
}));

// Import after mocking
const GeneratedCodeRepositoryModule =
  await import('../../src/repositories/generatedCodeRepository.js');
const GeneratedCodeRepository = GeneratedCodeRepositoryModule.default;

describe('GeneratedCodeRepository', () => {
  let repository;

  beforeEach(() => {
    repository = new GeneratedCodeRepository();
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should not create file if it already exists', async () => {
      mockAccess.mockResolvedValue();

      await repository.initialize();

      expect(mockAccess).toHaveBeenCalled();
      expect(mockMkdir).not.toHaveBeenCalled();
      expect(mockWriteFile).not.toHaveBeenCalled();
    });

    it('should create directory and file if they do not exist', async () => {
      mockAccess.mockRejectedValue(new Error('File not found'));
      mockMkdir.mockResolvedValue();
      mockWriteFile.mockResolvedValue();

      await repository.initialize();

      expect(mockMkdir).toHaveBeenCalledWith(expect.stringContaining('database'), {
        recursive: true,
      });
      const writeCall = mockWriteFile.mock.calls[0];
      expect(writeCall[0]).toContain('database');
      expect(writeCall[0]).toContain('generated-code.json');
      expect(writeCall[1]).toBe(JSON.stringify([], null, 2));
    });
  });

  describe('findAll', () => {
    it('should return all records', async () => {
      const mockData = [
        { id: '1', data: { fileKey: 'abc' } },
        { id: '2', data: { fileKey: 'def' } },
      ];
      mockAccess.mockResolvedValue();
      mockReadFile.mockResolvedValue(JSON.stringify(mockData));

      const result = await repository.findAll();

      expect(result).toEqual(mockData);
      expect(mockReadFile).toHaveBeenCalledWith(
        expect.stringContaining('generated-code.json'),
        'utf-8'
      );
    });

    it('should return empty array if file is empty', async () => {
      mockAccess.mockResolvedValue();
      mockReadFile.mockResolvedValue('[]');

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });

    it('should initialize database before reading', async () => {
      mockAccess.mockRejectedValue(new Error('Not found'));
      mockMkdir.mockResolvedValue();
      mockWriteFile.mockResolvedValue();
      mockReadFile.mockResolvedValue('[]');

      await repository.findAll();

      expect(mockAccess).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return record with matching id', async () => {
      const mockData = [
        { id: '1', data: { fileKey: 'abc' } },
        { id: '2', data: { fileKey: 'def' } },
      ];
      mockAccess.mockResolvedValue();
      mockReadFile.mockResolvedValue(JSON.stringify(mockData));

      const result = await repository.findById('2');

      expect(result).toEqual({ id: '2', data: { fileKey: 'def' } });
    });

    it('should return undefined if id not found', async () => {
      mockAccess.mockResolvedValue();
      mockReadFile.mockResolvedValue('[]');

      const result = await repository.findById('999');

      expect(result).toBeUndefined();
    });
  });

  describe('save', () => {
    it('should add new record with createdAt timestamp', async () => {
      const mockData = [{ id: '1', data: { fileKey: 'abc' } }];
      mockAccess.mockResolvedValue();
      mockReadFile.mockResolvedValue(JSON.stringify(mockData));
      mockWriteFile.mockResolvedValue();

      const newRecord = { id: '2', data: { fileKey: 'def' } };
      const result = await repository.save(newRecord);

      expect(result).toEqual(newRecord);
      const writtenData = mockWriteFile.mock.calls[0][1];
      expect(writtenData).toContain('"id": "2"');
      expect(writtenData).toContain('createdAt');
    });

    it('should append to existing records', async () => {
      const existingRecords = [{ id: '1', data: { fileKey: 'abc' } }];
      mockAccess.mockResolvedValue();
      mockReadFile.mockResolvedValue(JSON.stringify(existingRecords));
      mockWriteFile.mockResolvedValue();

      const newRecord = { id: '2', data: { fileKey: 'def' } };
      await repository.save(newRecord);

      const writtenData = JSON.parse(mockWriteFile.mock.calls[0][1]);
      expect(writtenData).toHaveLength(2);
      expect(writtenData[1].id).toBe('2');
    });
  });

  describe('update', () => {
    it('should update existing record with updatedAt timestamp', async () => {
      const mockData = [{ id: '1', data: { fileKey: 'abc' }, createdAt: '2024-01-01' }];
      mockAccess.mockResolvedValue();
      mockReadFile.mockResolvedValue(JSON.stringify(mockData));
      mockWriteFile.mockResolvedValue();

      const updates = { data: { fileKey: 'xyz' } };
      const result = await repository.update('1', updates);

      expect(result.data.fileKey).toBe('xyz');
      expect(result).toHaveProperty('updatedAt');
      expect(result.createdAt).toBe('2024-01-01');
    });

    it('should throw error if record not found', async () => {
      mockAccess.mockResolvedValue();
      mockReadFile.mockResolvedValue('[]');

      await expect(repository.update('999', {})).rejects.toThrow('Record with id 999 not found');
    });

    it('should preserve existing fields not in update', async () => {
      const mockData = [
        {
          id: '1',
          data: { fileKey: 'abc', framework: 'react' },
          createdAt: '2024-01-01',
        },
      ];
      mockAccess.mockResolvedValue();
      mockReadFile.mockResolvedValue(JSON.stringify(mockData));
      mockWriteFile.mockResolvedValue();

      await repository.update('1', { data: { fileKey: 'xyz' } });

      const writtenData = JSON.parse(mockWriteFile.mock.calls[0][1]);
      expect(writtenData[0].createdAt).toBe('2024-01-01');
    });
  });

  describe('delete', () => {
    it('should remove record with matching id', async () => {
      const mockData = [
        { id: '1', data: { fileKey: 'abc' } },
        { id: '2', data: { fileKey: 'def' } },
      ];
      mockAccess.mockResolvedValue();
      mockReadFile.mockResolvedValue(JSON.stringify(mockData));
      mockWriteFile.mockResolvedValue();

      const result = await repository.delete('1');

      expect(result).toBe(true);
      const writtenData = JSON.parse(mockWriteFile.mock.calls[0][1]);
      expect(writtenData).toHaveLength(1);
      expect(writtenData[0].id).toBe('2');
    });

    it('should throw error if record not found', async () => {
      mockAccess.mockResolvedValue();
      mockReadFile.mockResolvedValue('[]');

      await expect(repository.delete('999')).rejects.toThrow('Record with id 999 not found');
    });
  });

  describe('findByFileKey', () => {
    it('should return records with matching fileKey', async () => {
      const mockData = [
        { id: '1', data: { fileKey: 'abc' } },
        { id: '2', data: { fileKey: 'abc' } },
        { id: '3', data: { fileKey: 'def' } },
      ];
      mockAccess.mockResolvedValue();
      mockReadFile.mockResolvedValue(JSON.stringify(mockData));

      const result = await repository.findByFileKey('abc');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
    });

    it('should return empty array if no matches', async () => {
      mockAccess.mockResolvedValue();
      mockReadFile.mockResolvedValue('[]');

      const result = await repository.findByFileKey('nonexistent');

      expect(result).toEqual([]);
    });

    it('should handle records without data property', async () => {
      const mockData = [{ id: '1', data: { fileKey: 'abc' } }, { id: '2' }];
      mockAccess.mockResolvedValue();
      mockReadFile.mockResolvedValue(JSON.stringify(mockData));

      const result = await repository.findByFileKey('abc');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });
  });

  describe('findByFramework', () => {
    it('should return records with matching framework', async () => {
      const mockData = [
        { id: '1', data: { framework: 'react' } },
        { id: '2', data: { framework: 'vue' } },
        { id: '3', data: { framework: 'react' } },
      ];
      mockAccess.mockResolvedValue();
      mockReadFile.mockResolvedValue(JSON.stringify(mockData));

      const result = await repository.findByFramework('react');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('3');
    });

    it('should return empty array if no matches', async () => {
      mockAccess.mockResolvedValue();
      mockReadFile.mockResolvedValue('[]');

      const result = await repository.findByFramework('angular');

      expect(result).toEqual([]);
    });

    it('should handle records without data property', async () => {
      const mockData = [{ id: '1', data: { framework: 'react' } }, { id: '2' }];
      mockAccess.mockResolvedValue();
      mockReadFile.mockResolvedValue(JSON.stringify(mockData));

      const result = await repository.findByFramework('react');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });
  });
});
