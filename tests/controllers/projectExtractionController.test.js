import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock dependencies before importing
const mockExtractProject = jest.fn();
await jest.unstable_mockModule('../../src/services/projectExtractionService.js', () => ({
  default: jest.fn().mockImplementation(() => ({
    extractProject: mockExtractProject,
  })),
}));

const mockValidateFrameworks = jest.fn();
const mockValidatePositiveInteger = jest.fn((value, name, defaultValue) => value || defaultValue);
const mockValidateBoolean = jest.fn((value, defaultValue) =>
  value !== undefined ? value : defaultValue
);
await jest.unstable_mockModule('../../src/utils/validators.js', () => ({
  validateFrameworks: mockValidateFrameworks,
  validatePositiveInteger: mockValidatePositiveInteger,
  validateBoolean: mockValidateBoolean,
}));

const mockSendSuccess = jest.fn();
await jest.unstable_mockModule('../../src/utils/responseFormatter.js', () => ({
  sendSuccess: mockSendSuccess,
}));

await jest.unstable_mockModule('../../src/utils/errorHandler.js', () => ({
  ValidationError: class ValidationError extends Error {
    constructor(message) {
      super(message);
      this.name = 'ValidationError';
    }
  },
}));

// Import after mocking
const { default: ProjectExtractionController } =
  await import('../../src/controllers/projectExtractionController.js');
const { ValidationError } = await import('../../src/utils/errorHandler.js');

describe('ProjectExtractionController', () => {
  let req;
  let res;
  let consoleLogSpy;

  beforeEach(() => {
    req = {
      body: {
        fileKey: 'test-file-key',
        figmaToken: 'test-figma-token',
        githubToken: 'test-github-token',
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('extractProject', () => {
    it('should throw ValidationError if figmaToken is missing', async () => {
      delete req.body.figmaToken;

      await expect(ProjectExtractionController.extractProject(req, res)).rejects.toThrow(
        ValidationError
      );
      await expect(ProjectExtractionController.extractProject(req, res)).rejects.toThrow(
        'figmaToken and githubToken are required'
      );
    });

    it('should throw ValidationError if githubToken is missing', async () => {
      delete req.body.githubToken;

      await expect(ProjectExtractionController.extractProject(req, res)).rejects.toThrow(
        ValidationError
      );
    });

    it('should throw ValidationError if neither fileKey nor (teamId + projectId) is provided', async () => {
      delete req.body.fileKey;

      await expect(ProjectExtractionController.extractProject(req, res)).rejects.toThrow(
        ValidationError
      );
      await expect(ProjectExtractionController.extractProject(req, res)).rejects.toThrow(
        'Either fileKey OR (teamId and projectId) are required'
      );
    });

    it('should accept teamId and projectId instead of fileKey', async () => {
      delete req.body.fileKey;
      req.body.teamId = 'test-team-id';
      req.body.projectId = 'test-project-id';

      mockExtractProject.mockResolvedValue({
        filesProcessed: 5,
        totalComponentsExtracted: 20,
        githubToken: 'should-be-removed',
      });

      await ProjectExtractionController.extractProject(req, res);

      expect(mockExtractProject).toHaveBeenCalled();
      expect(mockSendSuccess).toHaveBeenCalled();
    });

    it('should use frameworks from req.body.frameworks', async () => {
      req.body.frameworks = ['vue', 'angular'];

      mockExtractProject.mockResolvedValue({
        filesProcessed: 5,
        totalComponentsExtracted: 20,
      });

      await ProjectExtractionController.extractProject(req, res);

      expect(mockValidateFrameworks).toHaveBeenCalledWith(['vue', 'angular']);
      expect(mockExtractProject).toHaveBeenCalledWith(
        expect.objectContaining({
          frameworks: ['vue', 'angular'],
        })
      );
    });

    it('should use frameworks from req.body.options.frameworks if frameworks is not provided', async () => {
      req.body.options = { frameworks: ['html'] };

      mockExtractProject.mockResolvedValue({
        filesProcessed: 5,
        totalComponentsExtracted: 20,
      });

      await ProjectExtractionController.extractProject(req, res);

      expect(mockValidateFrameworks).toHaveBeenCalledWith(['html']);
    });

    it('should default to [react] if no frameworks provided', async () => {
      mockExtractProject.mockResolvedValue({
        filesProcessed: 5,
        totalComponentsExtracted: 20,
      });

      await ProjectExtractionController.extractProject(req, res);

      expect(mockValidateFrameworks).toHaveBeenCalledWith(['react']);
      expect(mockExtractProject).toHaveBeenCalledWith(
        expect.objectContaining({
          frameworks: ['react'],
        })
      );
    });

    it('should validate and use options with defaults', async () => {
      req.body.options = {
        maxComponentsPerFile: 15,
        includeStyles: false,
        generateDocs: false,
      };

      mockExtractProject.mockResolvedValue({
        filesProcessed: 5,
        totalComponentsExtracted: 20,
      });

      await ProjectExtractionController.extractProject(req, res);

      expect(mockValidatePositiveInteger).toHaveBeenCalledWith(15, 'maxComponentsPerFile', 10);
      expect(mockValidateBoolean).toHaveBeenCalledWith(false, true);
      expect(mockValidateBoolean).toHaveBeenCalledWith(false, true);
    });

    it('should use default options if not provided', async () => {
      mockExtractProject.mockResolvedValue({
        filesProcessed: 5,
        totalComponentsExtracted: 20,
      });

      await ProjectExtractionController.extractProject(req, res);

      expect(mockValidatePositiveInteger).toHaveBeenCalledWith(
        undefined,
        'maxComponentsPerFile',
        10
      );
      expect(mockValidateBoolean).toHaveBeenCalledWith(undefined, true);
    });

    it('should call service.extractProject with correct parameters', async () => {
      req.body.frameworks = ['react', 'vue'];
      req.body.options = {
        maxComponentsPerFile: 20,
        includeStyles: true,
        generateDocs: false,
      };

      mockValidatePositiveInteger.mockReturnValue(20);
      mockValidateBoolean.mockReturnValueOnce(true).mockReturnValueOnce(false);

      mockExtractProject.mockResolvedValue({
        filesProcessed: 5,
        totalComponentsExtracted: 20,
      });

      await ProjectExtractionController.extractProject(req, res);

      expect(mockExtractProject).toHaveBeenCalledWith({
        fileKey: 'test-file-key',
        teamId: undefined,
        projectId: undefined,
        frameworks: ['react', 'vue'],
        options: {
          maxComponentsPerFile: 20,
          includeStyles: true,
          generateDocs: false,
        },
      });
    });

    it('should log start and completion messages', async () => {
      mockExtractProject.mockResolvedValue({
        filesProcessed: 5,
        totalComponentsExtracted: 20,
      });

      await ProjectExtractionController.extractProject(req, res);

      expect(consoleLogSpy).toHaveBeenCalledWith('Starting project extraction');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Project extraction completed: 5 files, 20 components'
      );
    });

    it('should remove sensitive data (githubToken) from result', async () => {
      const mockResult = {
        filesProcessed: 5,
        totalComponentsExtracted: 20,
        githubToken: 'secret-token',
      };

      mockExtractProject.mockResolvedValue(mockResult);

      await ProjectExtractionController.extractProject(req, res);

      expect(mockResult.githubToken).toBeUndefined();
    });

    it('should send success response with result', async () => {
      const mockResult = {
        filesProcessed: 5,
        totalComponentsExtracted: 20,
        outputDirectory: '/path/to/output',
      };

      mockExtractProject.mockResolvedValue(mockResult);

      await ProjectExtractionController.extractProject(req, res);

      expect(mockSendSuccess).toHaveBeenCalledWith(res, mockResult);
    });

    it('should handle service errors', async () => {
      mockExtractProject.mockRejectedValue(new Error('Service error'));

      await expect(ProjectExtractionController.extractProject(req, res)).rejects.toThrow(
        'Service error'
      );
    });
  });
});
