import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock fs/promises before importing
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

// Mock axios
const mockAxiosGet = jest.fn();
const mockAxiosPost = jest.fn();
await jest.unstable_mockModule('axios', () => ({
  default: {
    get: mockAxiosGet,
    post: mockAxiosPost,
  },
}));

// Mock uuid
await jest.unstable_mockModule('uuid', () => ({
  v4: jest.fn().mockReturnValue('test-uuid-123'),
}));

// Mock FigmaService
const mockFigmaServiceInstance = {
  getFile: jest.fn(),
  extractComponents: jest.fn(),
  extractStyles: jest.fn(),
};
await jest.unstable_mockModule('../../src/services/figmaService.js', () => ({
  default: jest.fn().mockImplementation(() => mockFigmaServiceInstance),
}));

// Mock DesignAnalyzerAgent
const mockAnalyzeAndGenerateCode = jest.fn();
await jest.unstable_mockModule('../../src/agents/designAnalyzerAgent.js', () => ({
  default: jest.fn().mockImplementation(() => ({
    analyzeAndGenerateCode: mockAnalyzeAndGenerateCode,
  })),
}));

// Mock validators
await jest.unstable_mockModule('../../src/utils/validators.js', () => ({
  sanitizeFileName: jest.fn((name) => {
    if (!name) {
      return 'unknown';
    }
    return name.replace(/\s+/g, '_').toLowerCase();
  }),
}));

// Import after mocking
const { default: ProjectExtractionService } =
  await import('../../src/services/projectExtractionService.js');
const { ExternalAPIError, ValidationError } = await import('../../src/utils/errorHandler.js');

describe('ProjectExtractionService', () => {
  let service;

  beforeEach(() => {
    service = new ProjectExtractionService('test-figma-token');
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with figma token', () => {
      expect(service.figmaToken).toBe('test-figma-token');
      expect(service.figmaService).toBeDefined();
    });
  });

  describe('fetchFiles', () => {
    it('should fetch single file by fileKey', async () => {
      const mockFileData = {
        name: 'TestFile',
        lastModified: '2024-01-01',
        thumbnailUrl: 'https://example.com/thumb.png',
      };

      mockFigmaServiceInstance.getFile.mockResolvedValue(mockFileData);

      const result = await service.fetchFiles('test-file-key', null);

      expect(result.files).toHaveLength(1);
      expect(result.files[0].key).toBe('test-file-key');
      expect(result.files[0].name).toBe('TestFile');
      expect(result.projectName).toBe('TestFile');
    });

    it('should fetch project files by projectId', async () => {
      const mockResponse = {
        data: {
          files: [
            { key: 'file-1', name: 'File 1', last_modified: '2024-01-01' },
            { key: 'file-2', name: 'File 2', last_modified: '2024-01-02' },
          ],
        },
      };

      mockAxiosGet.mockResolvedValue(mockResponse);

      const result = await service.fetchFiles(null, 'project-123');

      expect(mockAxiosGet).toHaveBeenCalledWith(
        'https://api.figma.com/v1/projects/project-123/files',
        { headers: { 'X-Figma-Token': 'test-figma-token' } }
      );
      expect(result.files).toHaveLength(2);
      expect(result.projectName).toBe('File 1');
    });

    it('should handle project fetch with empty files array', async () => {
      const mockResponse = {
        data: {
          files: [],
        },
      };

      mockAxiosGet.mockResolvedValue(mockResponse);

      const result = await service.fetchFiles(null, 'project-123');

      expect(result.files).toHaveLength(0);
      expect(result.projectName).toBe('Unknown Project');
    });

    it('should handle project fetch with null files in response', async () => {
      const mockResponse = {
        data: {
          files: null,
        },
      };

      mockAxiosGet.mockResolvedValue(mockResponse);

      const result = await service.fetchFiles(null, 'project-123');

      expect(result.files).toEqual([]);
      expect(result.projectName).toBe('Unknown Project');
    });

    it('should handle project fetch with missing files property', async () => {
      const mockResponse = {
        data: {},
      };

      mockAxiosGet.mockResolvedValue(mockResponse);

      const result = await service.fetchFiles(null, 'project-123');

      expect(result.files).toEqual([]);
    });

    it('should handle API errors with response', async () => {
      const error = {
        response: {
          status: 404,
          data: { message: 'Project not found' },
        },
      };

      mockAxiosGet.mockRejectedValue(error);

      await expect(service.fetchFiles(null, 'invalid-project')).rejects.toThrow(ExternalAPIError);
    });

    it('should handle API errors without response data', async () => {
      const error = {
        response: {
          status: 500,
        },
      };

      mockAxiosGet.mockRejectedValue(error);

      await expect(service.fetchFiles(null, 'project-123')).rejects.toThrow(ExternalAPIError);
    });

    it('should handle network errors without response', async () => {
      const error = new Error('Network error');
      mockAxiosGet.mockRejectedValue(error);

      await expect(service.fetchFiles(null, 'project-123')).rejects.toThrow(ExternalAPIError);
    });

    it('should handle file fetch errors', async () => {
      const error = new Error('File not found');
      mockFigmaServiceInstance.getFile.mockRejectedValue(error);

      await expect(service.fetchFiles('invalid-key', null)).rejects.toThrow(Error);
    });

    it('should handle single file with null thumbnailUrl', async () => {
      const mockFileData = {
        name: 'TestFile',
        lastModified: '2024-01-01',
        thumbnailUrl: null,
      };

      mockFigmaServiceInstance.getFile.mockResolvedValue(mockFileData);

      const result = await service.fetchFiles('test-file-key', null);

      expect(result.files[0].thumbnail_url).toBeNull();
    });

    it('should handle single file with undefined thumbnailUrl', async () => {
      const mockFileData = {
        name: 'TestFile',
        lastModified: '2024-01-01',
        thumbnailUrl: undefined,
      };

      mockFigmaServiceInstance.getFile.mockResolvedValue(mockFileData);

      const result = await service.fetchFiles('test-file-key', null);

      expect(result.files[0].thumbnail_url).toBeNull();
    });
  });

  describe('extractFileComponents', () => {
    it('should extract components from file', async () => {
      const mockFileData = {
        name: 'TestFile',
        document: { children: [] },
        styles: {},
      };

      const mockComponentsData = {
        components: [
          { id: 'comp-1', name: 'Button', type: 'COMPONENT' },
          { id: 'comp-2', name: 'Card', type: 'COMPONENT' },
        ],
      };

      const mockStyles = {
        colors: { primary: {} },
        typography: {},
        effects: {},
      };

      mockFigmaServiceInstance.getFile.mockResolvedValue(mockFileData);
      mockFigmaServiceInstance.extractComponents.mockReturnValue(mockComponentsData);
      mockFigmaServiceInstance.extractStyles.mockReturnValue(mockStyles);

      const result = await service.extractFileComponents('file-key', 10);

      expect(result.fileData).toEqual(mockFileData);
      expect(result.componentsData).toEqual(mockComponentsData);
      expect(result.styles).toEqual(mockStyles);
    });

    it('should limit components to maxComponents', async () => {
      const mockFileData = { name: 'TestFile', document: { children: [] } };
      const mockComponentsData = {
        components: [
          { id: '1', name: 'Comp1', type: 'COMPONENT' },
          { id: '2', name: 'Comp2', type: 'COMPONENT' },
          { id: '3', name: 'Comp3', type: 'COMPONENT' },
        ],
      };

      mockFigmaServiceInstance.getFile.mockResolvedValue(mockFileData);
      mockFigmaServiceInstance.extractComponents.mockReturnValue(mockComponentsData);
      mockFigmaServiceInstance.extractStyles.mockReturnValue({
        colors: {},
        typography: {},
        effects: {},
      });

      const result = await service.extractFileComponents('file-key', 2);

      expect(result.componentsData.components).toHaveLength(2);
    });

    it('should not limit components when count is less than maxComponents', async () => {
      const mockFileData = { name: 'TestFile', document: { children: [] } };
      const mockComponentsData = {
        components: [
          { id: '1', name: 'Comp1', type: 'COMPONENT' },
          { id: '2', name: 'Comp2', type: 'COMPONENT' },
        ],
      };

      mockFigmaServiceInstance.getFile.mockResolvedValue(mockFileData);
      mockFigmaServiceInstance.extractComponents.mockReturnValue(mockComponentsData);
      mockFigmaServiceInstance.extractStyles.mockReturnValue({
        colors: {},
        typography: {},
        effects: {},
      });

      const result = await service.extractFileComponents('file-key', 10);

      expect(result.componentsData.components).toHaveLength(2);
    });

    it('should handle components with no array property', async () => {
      const mockFileData = { name: 'TestFile', document: { children: [] } };
      const mockComponentsData = { components: null };

      mockFigmaServiceInstance.getFile.mockResolvedValue(mockFileData);
      mockFigmaServiceInstance.extractComponents.mockReturnValue(mockComponentsData);
      mockFigmaServiceInstance.extractStyles.mockReturnValue({
        colors: {},
        typography: {},
        effects: {},
      });

      const result = await service.extractFileComponents('file-key', 10);

      expect(result.componentsData.components).toBeNull();
    });

    it('should handle empty components array', async () => {
      const mockFileData = { name: 'TestFile', document: { children: [] } };
      const mockComponentsData = { components: [] };

      mockFigmaServiceInstance.getFile.mockResolvedValue(mockFileData);
      mockFigmaServiceInstance.extractComponents.mockReturnValue(mockComponentsData);
      mockFigmaServiceInstance.extractStyles.mockReturnValue({
        colors: {},
        typography: {},
        effects: {},
      });

      const result = await service.extractFileComponents('file-key', 10);

      expect(result.componentsData.components).toEqual([]);
    });

    it('should handle exact maxComponents count', async () => {
      const mockFileData = { name: 'TestFile', document: { children: [] } };
      const mockComponentsData = {
        components: [
          { id: '1', name: 'Comp1' },
          { id: '2', name: 'Comp2' },
          { id: '3', name: 'Comp3' },
        ],
      };

      mockFigmaServiceInstance.getFile.mockResolvedValue(mockFileData);
      mockFigmaServiceInstance.extractComponents.mockReturnValue(mockComponentsData);
      mockFigmaServiceInstance.extractStyles.mockReturnValue({
        colors: {},
        typography: {},
        effects: {},
      });

      const result = await service.extractFileComponents('file-key', 3);

      // When components.length === maxComponents, no slicing happens
      expect(result.componentsData.components).toHaveLength(3);
    });
  });

  describe('generateCode', () => {
    it('should generate code for multiple frameworks', async () => {
      const componentsData = {
        components: [{ id: '1', name: 'Button', type: 'COMPONENT', properties: {} }],
      };

      mockAnalyzeAndGenerateCode.mockResolvedValue({
        components: [{ name: 'Button', code: 'code here' }],
      });

      const result = await service.generateCode(componentsData, ['react', 'vue'], {});

      expect(result.react).toBeDefined();
      expect(result.vue).toBeDefined();
      expect(mockAnalyzeAndGenerateCode).toHaveBeenCalledTimes(2);
    });

    it('should handle code generation errors gracefully', async () => {
      const componentsData = { components: [] };

      mockAnalyzeAndGenerateCode
        .mockResolvedValueOnce({ components: [] })
        .mockRejectedValueOnce(new Error('Generation failed'));

      const result = await service.generateCode(componentsData, ['react', 'vue'], {});

      expect(result.react).toBeDefined();
      expect(result.vue.error).toBe('Generation failed');
      expect(result.vue.status).toBe('failed');
    });

    it('should handle empty frameworks list', async () => {
      const componentsData = { components: [{ id: '1', name: 'Button', type: 'COMPONENT' }] };

      const result = await service.generateCode(componentsData, [], {});

      expect(Object.keys(result)).toHaveLength(0);
    });

    it('should handle components with missing properties', async () => {
      const componentsData = {
        components: [{ id: '1', name: 'Component1' }],
      };

      mockAnalyzeAndGenerateCode.mockResolvedValue({
        components: [{ name: 'Component1' }],
      });

      const result = await service.generateCode(componentsData, ['angular'], {});

      expect(result.angular).toBeDefined();
    });

    it('should handle null components array in generateCode', async () => {
      const componentsData = {
        components: null,
      };

      mockAnalyzeAndGenerateCode.mockResolvedValue({
        components: [],
      });

      const result = await service.generateCode(componentsData, ['react'], {});

      expect(result.react).toBeDefined();
      // The map should be called with null (which will be falsy and use the || [] fallback)
      const callArgs = mockAnalyzeAndGenerateCode.mock.calls[0][0];
      expect(callArgs.components).toEqual([]);
    });

    it('should handle undefined components in generateCode', async () => {
      const componentsData = {
        components: undefined,
      };

      mockAnalyzeAndGenerateCode.mockResolvedValue({
        components: [],
      });

      const result = await service.generateCode(componentsData, ['vue'], {});

      expect(result.vue).toBeDefined();
    });

    it('should simplify components data when generating code', async () => {
      const componentsData = {
        components: [
          {
            id: '1',
            name: 'Button',
            type: 'COMPONENT',
            properties: { color: 'blue' },
            extraField: 'should be removed',
          },
        ],
      };

      mockAnalyzeAndGenerateCode.mockResolvedValue({
        components: [{ name: 'Button', code: 'generated' }],
      });

      await service.generateCode(componentsData, ['react'], {});

      const callArgs = mockAnalyzeAndGenerateCode.mock.calls[0][0];
      expect(callArgs.components[0]).toEqual({
        id: '1',
        name: 'Button',
        type: 'COMPONENT',
        properties: { color: 'blue' },
      });
      expect(callArgs.components[0].extraField).toBeUndefined();
    });
  });

  describe('saveFileSpec', () => {
    it('should save file spec to JSON file', async () => {
      mockWriteFile.mockResolvedValue();

      const file = { name: 'TestFile', key: 'file-123' };
      const fileSpec = { id: 'spec-1', components: [] };

      const result = await service.saveFileSpec('/output', file, fileSpec);

      // Check that writeFile was called with proper path construction (handles both / and \)
      const callArgs = mockWriteFile.mock.calls[0][0];
      expect(callArgs).toMatch(/testfile\.json$/);
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('testfile.json'),
        JSON.stringify(fileSpec, null, 2)
      );
      expect(result).toBe('testfile.json');
    });
  });

  describe('createOutputDirectory', () => {
    it('should create output directory with fileKey', async () => {
      mockMkdir.mockResolvedValue();

      await service.createOutputDirectory('file-key', null, 'MyFile');

      expect(mockMkdir).toHaveBeenCalled();
      const callArgs = mockMkdir.mock.calls[0][0];
      expect(callArgs).toContain('file-myfile');
      expect(callArgs).toContain('output');
    });

    it('should create output directory with projectId', async () => {
      mockMkdir.mockResolvedValue();

      await service.createOutputDirectory(null, 'project-123', 'AnyName');

      expect(mockMkdir).toHaveBeenCalled();
      const callArgs = mockMkdir.mock.calls[0][0];
      expect(callArgs).toContain('project-project-123');
    });

    it('should include datetime in directory name', async () => {
      mockMkdir.mockResolvedValue();

      await service.createOutputDirectory('file-key', null, 'File');

      const callArgs = mockMkdir.mock.calls[0][0];
      expect(callArgs).toMatch(/\d{2}-\d{2}-\d{4}-\d{2}h\d{2}m\d{2}s$/);
    });

    it('should sanitize filename in directory name', async () => {
      mockMkdir.mockResolvedValue();

      await service.createOutputDirectory('file-key', null, 'My Test File!@#');

      const callArgs = mockMkdir.mock.calls[0][0];
      expect(callArgs).toMatch(/file-my.*test.*file/i);
    });

    it('should create directory recursively', async () => {
      mockMkdir.mockResolvedValue();

      await service.createOutputDirectory('file-key', null, 'File');

      expect(mockMkdir).toHaveBeenCalledWith(expect.any(String), { recursive: true });
    });

    it('should prefer fileKey over projectId when both provided', async () => {
      mockMkdir.mockResolvedValue();

      await service.createOutputDirectory('file-key', 'project-123', 'File');

      const callArgs = mockMkdir.mock.calls[0][0];
      expect(callArgs).toContain('file-');
      expect(callArgs).not.toContain('project-');
    });
  });

  describe('generateProjectIndex', () => {
    it('should generate project index file', async () => {
      mockWriteFile.mockResolvedValue();

      const indexData = {
        projectId: '123',
        filesProcessed: 2,
        extractedAt: '2024-01-01',
      };

      await service.generateProjectIndex('/output', indexData);

      // Check that writeFile was called with proper path construction (handles both / and \)
      const callArgs = mockWriteFile.mock.calls[0][0];
      expect(callArgs).toMatch(/project-index\.json$/);
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('project-index.json'),
        JSON.stringify(indexData, null, 2)
      );
    });
  });

  describe('processFile', () => {
    it('should process file successfully', async () => {
      const file = {
        name: 'TestFile',
        key: 'file-key',
        last_modified: '2024-01-01',
        thumbnail_url: 'https://example.com/thumb.png',
      };

      const mockComponentsData = {
        components: [{ id: '1', name: 'Button', type: 'COMPONENT', properties: {} }],
      };

      const mockStyles = { colors: {}, typography: {}, effects: {} };
      const mockGeneratedCode = { react: { components: [] } };

      jest.spyOn(service, 'extractFileComponents').mockResolvedValue({
        componentsData: mockComponentsData,
        styles: mockStyles,
      });

      jest.spyOn(service, 'generateCode').mockResolvedValue(mockGeneratedCode);

      const result = await service.processFile(file, ['react'], {
        maxComponentsPerFile: 10,
      });

      expect(result.success).toBe(true);
      expect(result.fileSpec.fileName).toBe('TestFile');
      expect(result.fileSpec.fileKey).toBe('file-key');
      expect(result.componentsExtracted).toBe(1);
    });

    it('should handle file processing errors', async () => {
      const file = { name: 'BadFile', key: 'bad-key' };

      jest
        .spyOn(service, 'extractFileComponents')
        .mockRejectedValue(new Error('Extraction failed'));

      const result = await service.processFile(file, ['react'], {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Extraction failed');
    });

    it('should handle files with no components', async () => {
      const file = {
        name: 'EmptyFile',
        key: 'empty-key',
        last_modified: '2024-01-01',
        thumbnail_url: null,
      };

      const mockComponentsData = { components: [] };
      const mockStyles = { colors: {}, typography: {}, effects: {} };
      const mockGeneratedCode = { react: { components: [] } };

      jest.spyOn(service, 'extractFileComponents').mockResolvedValue({
        componentsData: mockComponentsData,
        styles: mockStyles,
      });

      jest.spyOn(service, 'generateCode').mockResolvedValue(mockGeneratedCode);

      const result = await service.processFile(file, ['react'], {});

      expect(result.success).toBe(true);
      expect(result.componentsExtracted).toBe(0);
    });

    it('should handle files with null components', async () => {
      const file = {
        name: 'NullComponentsFile',
        key: 'null-key',
        last_modified: '2024-01-01',
        thumbnail_url: null,
      };

      const mockComponentsData = { components: null };
      const mockStyles = { colors: {}, typography: {}, effects: {} };
      const mockGeneratedCode = { react: { components: [] } };

      jest.spyOn(service, 'extractFileComponents').mockResolvedValue({
        componentsData: mockComponentsData,
        styles: mockStyles,
      });

      jest.spyOn(service, 'generateCode').mockResolvedValue(mockGeneratedCode);

      const result = await service.processFile(file, ['react'], {});

      expect(result.success).toBe(true);
      expect(result.componentsExtracted).toBe(0);
      expect(result.fileSpec.metadata.totalComponents).toBe(0);
    });
  });

  describe('extractProject', () => {
    it('should extract entire project successfully', async () => {
      const mockFiles = [
        { key: 'file-1', name: 'File1', last_modified: '2024-01-01', thumbnail_url: null },
        { key: 'file-2', name: 'File2', last_modified: '2024-01-02', thumbnail_url: null },
      ];

      jest.spyOn(service, 'fetchFiles').mockResolvedValue({
        files: mockFiles,
        projectName: 'TestProject',
      });

      mockMkdir.mockResolvedValue();
      mockWriteFile.mockResolvedValue();

      jest.spyOn(service, 'processFile').mockResolvedValue({
        success: true,
        fileSpec: {
          generatedCode: { react: { components: [] } },
        },
        componentsExtracted: 5,
      });

      const result = await service.extractProject({
        fileKey: null,
        teamId: 'team-1',
        projectId: 'project-1',
        frameworks: ['react'],
        options: { generateDocs: true, maxComponentsPerFile: 10, includeStyles: true },
      });

      expect(result.projectId).toBe('project-1');
      expect(result.filesProcessed).toBe(2);
      expect(result.totalComponentsExtracted).toBe(10);
      expect(result.files).toHaveLength(2);
    });

    it('should throw error if no files found', async () => {
      jest.spyOn(service, 'fetchFiles').mockResolvedValue({
        files: [],
        projectName: 'EmptyProject',
      });

      await expect(
        service.extractProject({
          fileKey: null,
          teamId: 'team-1',
          projectId: 'project-1',
          frameworks: ['react'],
          options: {},
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should handle failed file processing', async () => {
      const mockFiles = [
        { key: 'file-1', name: 'File1', last_modified: '2024-01-01', thumbnail_url: null },
      ];

      jest.spyOn(service, 'fetchFiles').mockResolvedValue({
        files: mockFiles,
        projectName: 'TestProject',
      });

      mockMkdir.mockResolvedValue();

      jest.spyOn(service, 'processFile').mockResolvedValue({
        success: false,
        error: 'Processing failed',
      });

      const result = await service.extractProject({
        fileKey: 'file-key',
        teamId: null,
        projectId: null,
        frameworks: ['react'],
        options: { generateDocs: false },
      });

      expect(result.files[0].error).toBe('Processing failed');
      expect(result.files[0].status).toBe('failed');
    });

    it('should return output directory as basename only', async () => {
      jest.spyOn(service, 'fetchFiles').mockResolvedValue({
        files: [{ key: 'file-1', name: 'File1', last_modified: '2024-01-01' }],
        projectName: 'Project',
      });

      mockMkdir.mockResolvedValue();

      jest.spyOn(service, 'processFile').mockResolvedValue({
        success: true,
        fileSpec: { generatedCode: { react: {} } },
        componentsExtracted: 0,
      });

      const result = await service.extractProject({
        fileKey: 'file-key',
        teamId: null,
        projectId: null,
        frameworks: ['react'],
        options: { generateDocs: false },
      });

      expect(result.outputDirectory).not.toContain('/');
    });

    it('should not generate project index when generateDocs is false', async () => {
      jest.spyOn(service, 'fetchFiles').mockResolvedValue({
        files: [{ key: 'file-1', name: 'File1', last_modified: '2024-01-01' }],
        projectName: 'Project',
      });

      mockMkdir.mockResolvedValue();

      jest.spyOn(service, 'processFile').mockResolvedValue({
        success: true,
        fileSpec: { generatedCode: { react: {} } },
        componentsExtracted: 0,
      });

      jest.spyOn(service, 'generateProjectIndex').mockResolvedValue();

      await service.extractProject({
        fileKey: 'file-key',
        teamId: null,
        projectId: null,
        frameworks: ['react'],
        options: { generateDocs: false },
      });

      expect(service.generateProjectIndex).not.toHaveBeenCalled();
    });

    it('should generate project index when generateDocs is true', async () => {
      jest.spyOn(service, 'fetchFiles').mockResolvedValue({
        files: [{ key: 'file-1', name: 'File1', last_modified: '2024-01-01' }],
        projectName: 'Project',
      });

      mockMkdir.mockResolvedValue();

      jest.spyOn(service, 'processFile').mockResolvedValue({
        success: true,
        fileSpec: { generatedCode: { react: {} } },
        componentsExtracted: 1,
      });

      jest.spyOn(service, 'generateProjectIndex').mockResolvedValue();

      const result = await service.extractProject({
        fileKey: 'file-key',
        teamId: null,
        projectId: null,
        frameworks: ['react'],
        options: { generateDocs: true },
      });

      expect(service.generateProjectIndex).toHaveBeenCalled();
      expect(result.extractedAt).toBeDefined();
    });

    it('should track successful and failed frameworks', async () => {
      jest.spyOn(service, 'fetchFiles').mockResolvedValue({
        files: [{ key: 'file-1', name: 'File1', last_modified: '2024-01-01' }],
        projectName: 'Project',
      });

      mockMkdir.mockResolvedValue();

      jest.spyOn(service, 'processFile').mockResolvedValue({
        success: true,
        fileSpec: {
          generatedCode: {
            react: { components: [] },
            vue: { error: 'Generation failed', status: 'failed' },
          },
        },
        componentsExtracted: 2,
      });

      const result = await service.extractProject({
        fileKey: 'file-key',
        teamId: null,
        projectId: null,
        frameworks: ['react', 'vue'],
        options: { generateDocs: false },
      });

      expect(result.files[0].frameworks).toContain('react');
      expect(result.files[0].frameworks).not.toContain('vue');
    });

    it('should handle files with missing names', async () => {
      jest.spyOn(service, 'fetchFiles').mockResolvedValue({
        files: [{ key: 'file-1', last_modified: '2024-01-01' }], // Missing name
        projectName: 'Project',
      });

      mockMkdir.mockResolvedValue();

      jest.spyOn(service, 'processFile').mockResolvedValue({
        success: true,
        fileSpec: { generatedCode: { react: {} } },
        componentsExtracted: 0,
      });

      const result = await service.extractProject({
        fileKey: 'file-key',
        teamId: null,
        projectId: null,
        frameworks: ['react'],
        options: { generateDocs: false },
      });

      expect(result.filesProcessed).toBe(1);
      // Should still create output directory with 'unknown' as default name
      expect(mockMkdir).toHaveBeenCalled();
    });
  });
});
