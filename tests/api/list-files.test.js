import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock axios
const mockGet = jest.fn();
await jest.unstable_mockModule('axios', () => ({
  default: {
    get: mockGet,
  },
}));

// Import the handler
const listFilesModule = await import('../../api/v1/list-files.js');
const handler = listFilesModule.default;

describe('list-files endpoint', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      query: {},
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
    delete process.env.FIGMA_ACCESS_TOKEN;
  });

  describe('HTTP Methods', () => {
    it('should accept GET requests', async () => {
      req.method = 'GET';
      req.query = { team_id: '123' };
      process.env.FIGMA_ACCESS_TOKEN = 'test-token';

      mockGet.mockResolvedValue({ data: { projects: [] } });

      await handler(req, res);

      expect(mockGet).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should accept POST requests', async () => {
      req.method = 'POST';
      req.body = { teamId: '123' };
      process.env.FIGMA_ACCESS_TOKEN = 'test-token';

      mockGet.mockResolvedValue({ data: { projects: [] } });

      await handler(req, res);

      expect(mockGet).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should reject PUT requests', async () => {
      req.method = 'PUT';

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Method not allowed',
      });
    });

    it('should reject DELETE requests', async () => {
      req.method = 'DELETE';

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Method not allowed',
      });
    });
  });

  describe('Parameter handling - GET', () => {
    beforeEach(() => {
      req.method = 'GET';
      process.env.FIGMA_ACCESS_TOKEN = 'test-token';
    });

    it('should accept team_id parameter in GET request', async () => {
      req.query = { team_id: '123456' };
      mockGet.mockResolvedValue({ data: { name: 'Team', projects: [] } });

      await handler(req, res);

      expect(mockGet).toHaveBeenCalledWith('https://api.figma.com/v1/teams/123456/projects', {
        headers: { 'X-Figma-Token': 'test-token' },
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should accept project_id parameter in GET request', async () => {
      req.query = { project_id: '789012' };
      mockGet.mockResolvedValue({ data: { files: [] } });

      await handler(req, res);

      expect(mockGet).toHaveBeenCalledWith('https://api.figma.com/v1/projects/789012/files', {
        headers: { 'X-Figma-Token': 'test-token' },
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should require either team_id or project_id', async () => {
      req.query = {};

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Missing required parameter: team_id or project_id',
        details: 'Please provide either team_id or project_id to list files',
      });
    });
  });

  describe('Parameter handling - POST', () => {
    beforeEach(() => {
      req.method = 'POST';
      process.env.FIGMA_ACCESS_TOKEN = 'test-token';
    });

    it('should accept team_id in POST body (snake_case)', async () => {
      req.body = { team_id: '123456' };
      mockGet.mockResolvedValue({ data: { name: 'Team', projects: [] } });

      await handler(req, res);

      expect(mockGet).toHaveBeenCalledWith('https://api.figma.com/v1/teams/123456/projects', {
        headers: { 'X-Figma-Token': 'test-token' },
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should accept teamId in POST body (camelCase)', async () => {
      req.body = { teamId: '123456' };
      mockGet.mockResolvedValue({ data: { name: 'Team', projects: [] } });

      await handler(req, res);

      expect(mockGet).toHaveBeenCalledWith('https://api.figma.com/v1/teams/123456/projects', {
        headers: { 'X-Figma-Token': 'test-token' },
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should accept project_id in POST body (snake_case)', async () => {
      req.body = { project_id: '789012' };
      mockGet.mockResolvedValue({ data: { files: [] } });

      await handler(req, res);

      expect(mockGet).toHaveBeenCalledWith('https://api.figma.com/v1/projects/789012/files', {
        headers: { 'X-Figma-Token': 'test-token' },
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should accept projectId in POST body (camelCase)', async () => {
      req.body = { projectId: '789012' };
      mockGet.mockResolvedValue({ data: { files: [] } });

      await handler(req, res);

      expect(mockGet).toHaveBeenCalledWith('https://api.figma.com/v1/projects/789012/files', {
        headers: { 'X-Figma-Token': 'test-token' },
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should use custom figmaToken from POST body', async () => {
      req.body = { projectId: '789012', figmaToken: 'custom-token' };
      delete process.env.FIGMA_ACCESS_TOKEN;
      mockGet.mockResolvedValue({ data: { files: [] } });

      await handler(req, res);

      expect(mockGet).toHaveBeenCalledWith('https://api.figma.com/v1/projects/789012/files', {
        headers: { 'X-Figma-Token': 'custom-token' },
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should prefer custom figmaToken over env variable', async () => {
      req.body = { projectId: '789012', figmaToken: 'custom-token' };
      process.env.FIGMA_ACCESS_TOKEN = 'env-token';
      mockGet.mockResolvedValue({ data: { files: [] } });

      await handler(req, res);

      expect(mockGet).toHaveBeenCalledWith('https://api.figma.com/v1/projects/789012/files', {
        headers: { 'X-Figma-Token': 'custom-token' },
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Token handling', () => {
    beforeEach(() => {
      req.method = 'POST';
      req.body = { projectId: '789012' };
    });

    it('should require token from env or request', async () => {
      delete process.env.FIGMA_ACCESS_TOKEN;

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Figma access token not configured',
        details:
          'Please set FIGMA_ACCESS_TOKEN in environment variables or provide figmaToken in request',
      });
    });
  });

  describe('API responses', () => {
    beforeEach(() => {
      req.method = 'POST';
      process.env.FIGMA_ACCESS_TOKEN = 'test-token';
    });

    it('should return team data successfully', async () => {
      req.body = { teamId: '123456' };
      const teamData = {
        name: 'My Team',
        projects: [
          {
            id: 'proj1',
            name: 'Project 1',
            files: [{ key: 'file1', name: 'Design 1' }],
          },
        ],
      };
      mockGet.mockResolvedValue({ data: teamData });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        source: 'team',
        id: '123456',
        data: teamData,
        metadata: {
          provider: 'figma',
          timestamp: expect.any(String),
        },
      });
    });

    it('should return project data successfully', async () => {
      req.body = { projectId: '789012' };
      const projectData = {
        name: 'Project',
        files: [
          { key: 'file1', name: 'Design 1', thumbnail_url: 'https://...' },
          { key: 'file2', name: 'Design 2', thumbnail_url: 'https://...' },
        ],
      };
      mockGet.mockResolvedValue({ data: projectData });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        source: 'project',
        id: '789012',
        data: projectData,
        metadata: {
          provider: 'figma',
          timestamp: expect.any(String),
        },
      });
    });

    it('should handle 401 Figma API error', async () => {
      req.body = { projectId: '789012' };
      const error = new Error('Unauthorized');
      error.response = {
        status: 401,
        data: { message: 'Invalid token' },
      };
      mockGet.mockRejectedValue(error);

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid Figma access token',
        details: 'The provided token is invalid or expired',
      });
    });

    it('should handle 403 Figma API error', async () => {
      req.body = { projectId: '789012' };
      const error = new Error('Forbidden');
      error.response = { status: 403 };
      mockGet.mockRejectedValue(error);

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access forbidden',
        details: 'You do not have permission to access this resource',
      });
    });

    it('should handle 404 Figma API error', async () => {
      req.body = { projectId: '789012' };
      const error = new Error('Not found');
      error.response = { status: 404 };
      mockGet.mockRejectedValue(error);

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Resource not found',
        details: 'project with id 789012 not found',
      });
    });

    it('should handle generic API errors', async () => {
      req.body = { projectId: '789012' };
      const error = new Error('Network error');
      error.response = { data: { message: 'Server error' } };
      mockGet.mockRejectedValue(error);

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to fetch Figma files',
        details: 'Server error',
      });
    });
  });
});
