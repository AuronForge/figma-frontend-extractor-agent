import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock axios before importing
const mockAxiosPost = jest.fn();
await jest.unstable_mockModule('axios', () => ({
  default: {
    post: mockAxiosPost,
  },
}));

// Import after mocking
const { default: DesignAnalyzerAgent } = await import('../../src/agents/designAnalyzerAgent.js');

describe('DesignAnalyzerAgent', () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    process.env.GITHUB_TOKEN = 'test-github-token';
    process.env.OPENAI_API_KEY = 'test-openai-key';
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('constructor and setupProvider', () => {
    it('should initialize with github provider by default', () => {
      const agent = new DesignAnalyzerAgent();

      expect(agent.provider).toBe('github');
      expect(agent.apiUrl).toBe('https://models.inference.ai.azure.com/chat/completions');
      expect(agent.apiKey).toBe('test-github-token');
      expect(agent.model).toBe('gpt-4o');
    });

    it('should initialize with openai provider', () => {
      const agent = new DesignAnalyzerAgent('openai');

      expect(agent.provider).toBe('openai');
      expect(agent.apiUrl).toBe('https://api.openai.com/v1/chat/completions');
      expect(agent.apiKey).toBe('test-openai-key');
      expect(agent.model).toBe('gpt-4o');
    });

    it('should initialize with anthropic provider', () => {
      const agent = new DesignAnalyzerAgent('anthropic');

      expect(agent.provider).toBe('anthropic');
      expect(agent.apiUrl).toBe('https://api.anthropic.com/v1/messages');
      expect(agent.apiKey).toBe('test-anthropic-key');
      expect(agent.model).toBe('claude-3-5-sonnet-20241022');
    });

    it('should use custom model from environment variable for github', () => {
      process.env.GITHUB_MODEL = 'gpt-4-turbo';
      const agent = new DesignAnalyzerAgent('github');

      expect(agent.model).toBe('gpt-4-turbo');
    });

    it('should use custom model from environment variable for openai', () => {
      process.env.OPENAI_MODEL = 'gpt-3.5-turbo';
      const agent = new DesignAnalyzerAgent('openai');

      expect(agent.model).toBe('gpt-3.5-turbo');
    });

    it('should use custom model from environment variable for anthropic', () => {
      process.env.ANTHROPIC_MODEL = 'claude-3-opus';
      const agent = new DesignAnalyzerAgent('anthropic');

      expect(agent.model).toBe('claude-3-opus');
    });

    it('should throw error for unsupported provider', () => {
      expect(() => new DesignAnalyzerAgent('unsupported')).toThrow(
        'Unsupported AI provider: unsupported'
      );
    });

    it('should throw error if github token is not configured', () => {
      delete process.env.GITHUB_TOKEN;

      expect(() => new DesignAnalyzerAgent('github')).toThrow(
        'API key not configured for provider: github'
      );
    });

    it('should throw error if openai key is not configured', () => {
      delete process.env.OPENAI_API_KEY;

      expect(() => new DesignAnalyzerAgent('openai')).toThrow(
        'API key not configured for provider: openai'
      );
    });

    it('should throw error if anthropic key is not configured', () => {
      delete process.env.ANTHROPIC_API_KEY;

      expect(() => new DesignAnalyzerAgent('anthropic')).toThrow(
        'API key not configured for provider: anthropic'
      );
    });
  });

  describe('buildPrompt', () => {
    let agent;

    beforeEach(() => {
      agent = new DesignAnalyzerAgent();
    });

    it('should build prompt for react framework', () => {
      const components = { component: 'test' };
      const prompt = agent.buildPrompt(components, 'react', {});

      expect(prompt).toContain('React functional components');
      expect(prompt).toContain('react');
      expect(prompt).toContain('Component structure following react conventions');
      expect(prompt).toContain(JSON.stringify(components, null, 2));
    });

    it('should build prompt for react with typescript', () => {
      const components = { component: 'test' };
      const prompt = agent.buildPrompt(components, 'react', { typescript: true });

      expect(prompt).toContain('Use TypeScript with proper type definitions');
    });

    it('should build prompt for react with styles', () => {
      const components = { component: 'test' };
      const prompt = agent.buildPrompt(components, 'react', { includeStyles: true });

      expect(prompt).toContain('Include inline styles or CSS modules');
    });

    it('should build prompt for vue framework', () => {
      const components = { component: 'test' };
      const prompt = agent.buildPrompt(components, 'vue', {});

      expect(prompt).toContain('Vue 3 components');
      expect(prompt).toContain('Composition API');
      expect(prompt).toContain('vue');
    });

    it('should build prompt for vue with typescript', () => {
      const components = { component: 'test' };
      const prompt = agent.buildPrompt(components, 'vue', { typescript: true });

      expect(prompt).toContain('Use TypeScript with proper type definitions');
    });

    it('should build prompt for vue with styles', () => {
      const components = { component: 'test' };
      const prompt = agent.buildPrompt(components, 'vue', { includeStyles: true });

      expect(prompt).toContain('Include scoped styles in the <style> section');
    });

    it('should build prompt for angular framework', () => {
      const components = { component: 'test' };
      const prompt = agent.buildPrompt(components, 'angular', {});

      expect(prompt).toContain('Angular components');
      expect(prompt).toContain('TypeScript with proper type definitions');
      expect(prompt).toContain('angular');
    });

    it('should build prompt for angular with styles', () => {
      const components = { component: 'test' };
      const prompt = agent.buildPrompt(components, 'angular', { includeStyles: true });

      expect(prompt).toContain('Include component styles');
    });

    it('should build prompt for html framework', () => {
      const components = { component: 'test' };
      const prompt = agent.buildPrompt(components, 'html', {});

      expect(prompt).toContain('semantic HTML5 markup');
      expect(prompt).toContain('html');
    });

    it('should build prompt for html with styles', () => {
      const components = { component: 'test' };
      const prompt = agent.buildPrompt(components, 'html', { includeStyles: true });

      expect(prompt).toContain('Include CSS styles in a separate section');
    });

    it('should include responsive option in prompt', () => {
      const components = { component: 'test' };
      const prompt = agent.buildPrompt(components, 'react', { responsive: true });

      expect(prompt).toContain('Make the design responsive with proper breakpoints');
    });

    it('should include tailwind css framework option', () => {
      const components = { component: 'test' };
      const prompt = agent.buildPrompt(components, 'react', { cssFramework: 'tailwind' });

      expect(prompt).toContain('Use Tailwind CSS classes');
    });

    it('should include styled-components framework option', () => {
      const components = { component: 'test' };
      const prompt = agent.buildPrompt(components, 'react', {
        cssFramework: 'styled-components',
      });

      expect(prompt).toContain('Use styled-components for styling');
    });

    it('should include JSON format instructions', () => {
      const components = { component: 'test' };
      const prompt = agent.buildPrompt(components, 'react', {});

      expect(prompt).toContain('Return the response in the following JSON format');
      expect(prompt).toContain('"components"');
      expect(prompt).toContain('"globalStyles"');
      expect(prompt).toContain('"notes"');
    });
  });

  describe('callAI', () => {
    let agent;

    beforeEach(() => {
      agent = new DesignAnalyzerAgent('github');
    });

    it('should call github models API with correct parameters', async () => {
      const mockResponse = {
        data: {
          choices: [{ message: { content: 'Generated code' } }],
        },
      };
      mockAxiosPost.mockResolvedValue(mockResponse);

      const result = await agent.callAI('test prompt');

      expect(mockAxiosPost).toHaveBeenCalledWith(
        'https://models.inference.ai.azure.com/chat/completions',
        {
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content:
                'You are an expert frontend developer specialized in converting designs to code.',
            },
            {
              role: 'user',
              content: 'test prompt',
            },
          ],
          temperature: 0.7,
          max_tokens: 4000,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-github-token',
          },
        }
      );
      expect(result).toBe('Generated code');
    });

    it('should call openai API with correct parameters', async () => {
      agent = new DesignAnalyzerAgent('openai');
      const mockResponse = {
        data: {
          choices: [{ message: { content: 'Generated code' } }],
        },
      };
      mockAxiosPost.mockResolvedValue(mockResponse);

      const result = await agent.callAI('test prompt');

      expect(mockAxiosPost).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          model: 'gpt-4o',
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-openai-key',
          },
        }
      );
      expect(result).toBe('Generated code');
    });

    it('should call anthropic API with correct parameters', async () => {
      agent = new DesignAnalyzerAgent('anthropic');
      const mockResponse = {
        data: {
          content: [{ text: 'Generated code from anthropic' }],
        },
      };
      mockAxiosPost.mockResolvedValue(mockResponse);

      const result = await agent.callAI('test prompt');

      expect(mockAxiosPost).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4000,
          messages: [
            {
              role: 'user',
              content: 'test prompt',
            },
          ],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'test-anthropic-key',
            'anthropic-version': '2023-06-01',
          },
        }
      );
      expect(result).toBe('Generated code from anthropic');
    });
  });

  describe('parseResponse', () => {
    let agent;

    beforeEach(() => {
      agent = new DesignAnalyzerAgent();
    });

    it('should parse valid JSON response', () => {
      const jsonResponse = JSON.stringify({
        components: [
          {
            name: 'TestComponent',
            code: 'const TestComponent = () => {}',
            styles: '.test {}',
            dependencies: ['react'],
          },
        ],
        globalStyles: 'body {}',
        notes: 'Test notes',
      });

      const result = agent.parseResponse(jsonResponse, 'react');

      expect(result.components).toHaveLength(1);
      expect(result.components[0].name).toBe('TestComponent');
      expect(result.globalStyles).toBe('body {}');
      expect(result.notes).toBe('Test notes');
    });

    it('should extract JSON from response with extra text', () => {
      const response =
        'Here is the code: {"components": [{"name": "Test", "code": "test", "styles": "", "dependencies": []}], "globalStyles": "", "notes": ""}';

      const result = agent.parseResponse(response, 'react');

      expect(result.components).toHaveLength(1);
      expect(result.components[0].name).toBe('Test');
    });

    it('should return default structure if no JSON found', () => {
      const response = 'Some plain text response without JSON';

      const result = agent.parseResponse(response, 'react');

      expect(result.components).toHaveLength(1);
      expect(result.components[0].name).toBe('GeneratedComponent');
      expect(result.components[0].code).toBe(response);
      expect(result.notes).toBe('Generated code from AI response');
    });

    it('should return fallback structure for invalid JSON', () => {
      const response = '{"invalid": json}';

      const result = agent.parseResponse(response, 'react');

      expect(result.components).toHaveLength(1);
      expect(result.components[0].name).toBe('GeneratedComponent');
      expect(result.components[0].code).toBe(response);
      expect(result.notes).toBe('Raw AI response');
    });
  });

  describe('analyzeAndGenerateCode', () => {
    let agent;

    beforeEach(() => {
      agent = new DesignAnalyzerAgent();
    });

    it('should successfully generate code', async () => {
      const mockResponse = {
        data: {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  components: [
                    {
                      name: 'Button',
                      code: 'const Button = () => {}',
                      styles: '.button {}',
                      dependencies: ['react'],
                    },
                  ],
                  globalStyles: '',
                  notes: 'Button component',
                }),
              },
            },
          ],
        },
      };
      mockAxiosPost.mockResolvedValue(mockResponse);

      const components = { button: { type: 'button' } };
      const result = await agent.analyzeAndGenerateCode(components, 'react');

      expect(result.components).toHaveLength(1);
      expect(result.components[0].name).toBe('Button');
    });

    it('should pass options to buildPrompt', async () => {
      const mockResponse = {
        data: {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  components: [],
                  globalStyles: '',
                  notes: '',
                }),
              },
            },
          ],
        },
      };
      mockAxiosPost.mockResolvedValue(mockResponse);

      const buildPromptSpy = jest.spyOn(agent, 'buildPrompt');
      const components = { test: 'test' };
      const options = { typescript: true, includeStyles: true };

      await agent.analyzeAndGenerateCode(components, 'react', options);

      expect(buildPromptSpy).toHaveBeenCalledWith(components, 'react', options);
    });

    it('should handle API errors with response data', async () => {
      const error = {
        response: {
          data: {
            message: 'API rate limit exceeded',
          },
        },
      };
      mockAxiosPost.mockRejectedValue(error);

      const components = { test: 'test' };

      await expect(agent.analyzeAndGenerateCode(components, 'react')).rejects.toThrow(
        'Failed to generate code: API rate limit exceeded'
      );
    });

    it('should handle API errors without response data', async () => {
      const error = new Error('Network error');
      mockAxiosPost.mockRejectedValue(error);

      const components = { test: 'test' };

      await expect(agent.analyzeAndGenerateCode(components, 'react')).rejects.toThrow(
        'Failed to generate code: Network error'
      );
    });

    it('should work with all framework options', async () => {
      const mockResponse = {
        data: {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  components: [{ name: 'Test', code: '', styles: '', dependencies: [] }],
                  globalStyles: '',
                  notes: '',
                }),
              },
            },
          ],
        },
      };
      mockAxiosPost.mockResolvedValue(mockResponse);

      const components = { test: 'test' };
      const frameworks = ['react', 'vue', 'angular', 'html'];

      for (const framework of frameworks) {
        const result = await agent.analyzeAndGenerateCode(components, framework);
        expect(result.components).toBeDefined();
      }
    });
  });
});
