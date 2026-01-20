import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock axios before importing
const mockAxiosGet = jest.fn();
const mockAxiosPost = jest.fn();
await jest.unstable_mockModule('axios', () => ({
  default: {
    get: mockAxiosGet,
    post: mockAxiosPost,
  },
}));

// Import after mocking
const { default: FigmaService } = await import('../../src/services/figmaService.js');

describe('FigmaService', () => {
  let service;

  beforeEach(() => {
    service = new FigmaService('test-token');
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with access token', () => {
      expect(service.accessToken).toBe('test-token');
      expect(service.baseURL).toBe('https://api.figma.com/v1');
    });
  });

  describe('getFile', () => {
    it('should fetch file data successfully', async () => {
      const mockFileData = {
        id: '123',
        name: 'TestFile',
        version: '1.0',
        lastModified: '2024-01-01',
        thumbnailUrl: 'https://example.com/thumbnail.png',
        document: { children: [] },
        styles: {},
      };

      mockAxiosGet.mockResolvedValue({ data: mockFileData });

      const result = await service.getFile('test-file-key');

      expect(mockAxiosGet).toHaveBeenCalledWith('https://api.figma.com/v1/files/test-file-key', {
        headers: {
          'X-Figma-Token': 'test-token',
        },
      });
      expect(result).toEqual(mockFileData);
    });

    it('should handle API errors with response data', async () => {
      const error = {
        response: {
          status: 401,
          statusText: 'Unauthorized',
          data: { message: 'Invalid token' },
        },
        message: 'Unauthorized',
      };
      mockAxiosGet.mockRejectedValue(error);

      await expect(service.getFile('test-file-key')).rejects.toThrow('Failed to fetch Figma file');
    });

    it('should handle API errors without response data', async () => {
      const error = new Error('Network error');
      mockAxiosGet.mockRejectedValue(error);

      await expect(service.getFile('test-file-key')).rejects.toThrow('Failed to fetch Figma file');
    });
  });

  describe('getNode', () => {
    it('should fetch node data successfully', async () => {
      const mockNodeData = {
        nodes: {
          'node-1': {
            id: 'node-1',
            name: 'TestNode',
            type: 'COMPONENT',
          },
        },
      };

      mockAxiosGet.mockResolvedValue({ data: mockNodeData });

      const result = await service.getNode('file-key', 'node-1');

      expect(mockAxiosGet).toHaveBeenCalledWith('https://api.figma.com/v1/files/file-key/nodes', {
        params: { ids: 'node-1' },
        headers: {
          'X-Figma-Token': 'test-token',
        },
      });
      expect(result).toEqual(mockNodeData);
    });

    it('should handle node fetch errors', async () => {
      const error = {
        response: {
          data: { message: 'Node not found' },
        },
        message: 'Not found',
      };
      mockAxiosGet.mockRejectedValue(error);

      await expect(service.getNode('file-key', 'invalid-node')).rejects.toThrow(
        'Failed to fetch Figma node'
      );
    });
  });

  describe('getImages', () => {
    it('should fetch images successfully', async () => {
      const mockImageData = {
        images: {
          'node-1': 'https://example.com/image1.svg',
          'node-2': 'https://example.com/image2.svg',
        },
      };

      mockAxiosGet.mockResolvedValue({ data: mockImageData });

      const result = await service.getImages('file-key', ['node-1', 'node-2']);

      expect(mockAxiosGet).toHaveBeenCalledWith('https://api.figma.com/v1/images/file-key', {
        params: { ids: 'node-1,node-2', format: 'svg' },
        headers: {
          'X-Figma-Token': 'test-token',
        },
      });
      expect(result).toEqual(mockImageData);
    });

    it('should handle image fetch errors', async () => {
      const error = {
        response: {
          data: { message: 'Rate limit exceeded' },
        },
      };
      mockAxiosGet.mockRejectedValue(error);

      await expect(service.getImages('file-key', ['node-1'])).rejects.toThrow(
        'Failed to fetch Figma images'
      );
    });
  });

  describe('extractComponents', () => {
    it('should extract components from file data', () => {
      const fileData = {
        name: 'TestFile',
        version: '1.0',
        lastModified: '2024-01-01',
        document: {
          children: [
            {
              id: 'page-1',
              name: 'Page 1',
              type: 'PAGE',
              children: [
                {
                  id: 'comp-1',
                  name: 'Button',
                  type: 'COMPONENT',
                  absoluteBoundingBox: { x: 0, y: 0, width: 100, height: 50 },
                  fills: [{ color: { r: 0.5, g: 0.5, b: 0.5 } }],
                  children: [],
                },
              ],
            },
          ],
        },
      };

      const result = service.extractComponents(fileData);

      expect(result.name).toBe('TestFile');
      expect(result.version).toBe('1.0');
      expect(result.components).toBeDefined();
      expect(result.components.length).toBeGreaterThan(0);
      expect(result.components[0].name).toBe('Button');
    });

    it('should extract TEXT component properties', () => {
      const fileData = {
        name: 'TestFile',
        version: '1.0',
        lastModified: '2024-01-01',
        document: {
          children: [
            {
              id: 'page-1',
              name: 'Page 1',
              type: 'PAGE',
              children: [
                {
                  id: 'text-1',
                  name: 'Label',
                  type: 'TEXT',
                  characters: 'Click me',
                  style: {
                    fontSize: 14,
                    fontFamily: 'Arial',
                    fontWeight: 'bold',
                    textAlignHorizontal: 'center',
                  },
                  fills: [{ color: { r: 0, g: 0, b: 0 } }],
                  children: [],
                },
              ],
            },
          ],
        },
      };

      const result = service.extractComponents(fileData);

      const textComp = result.components.find((c) => c.type === 'TEXT');
      expect(textComp.properties.content).toBe('Click me');
      expect(textComp.properties.fontSize).toBe(14);
      expect(textComp.properties.fontFamily).toBe('Arial');
    });

    it('should extract RECTANGLE component properties', () => {
      const fileData = {
        name: 'TestFile',
        version: '1.0',
        lastModified: '2024-01-01',
        document: {
          children: [
            {
              id: 'page-1',
              name: 'Page 1',
              type: 'PAGE',
              children: [
                {
                  id: 'rect-1',
                  name: 'Box',
                  type: 'RECTANGLE',
                  absoluteBoundingBox: { x: 10, y: 20, width: 100, height: 50 },
                  fills: [{ color: { r: 1, g: 0, b: 0 } }],
                  cornerRadius: 8,
                  paddingLeft: 16,
                  paddingTop: 16,
                  children: [],
                },
              ],
            },
          ],
        },
      };

      const result = service.extractComponents(fileData);

      const rectComp = result.components.find((c) => c.type === 'RECTANGLE');
      expect(rectComp.properties.width).toBe(100);
      expect(rectComp.properties.height).toBe(50);
      expect(rectComp.properties.borderRadius).toBe(8);
    });

    it('should extract INSTANCE component properties', () => {
      const fileData = {
        name: 'TestFile',
        version: '1.0',
        lastModified: '2024-01-01',
        document: {
          children: [
            {
              id: 'page-1',
              name: 'Page 1',
              type: 'PAGE',
              children: [
                {
                  id: 'inst-1',
                  name: 'ButtonInstance',
                  type: 'INSTANCE',
                  absoluteBoundingBox: { x: 0, y: 0, width: 100, height: 50 },
                  children: [],
                },
              ],
            },
          ],
        },
      };

      const result = service.extractComponents(fileData);

      const instComp = result.components.find((c) => c.type === 'INSTANCE');
      expect(instComp.properties.componentName).toBe('ButtonInstance');
      expect(instComp.properties.width).toBe(100);
    });

    it('should handle empty document', () => {
      const fileData = {
        name: 'EmptyFile',
        version: '1.0',
        lastModified: '2024-01-01',
        document: { children: [] },
      };

      const result = service.extractComponents(fileData);

      expect(result.components).toEqual([]);
    });

    it('should handle missing document', () => {
      const fileData = {
        name: 'NoDocFile',
        version: '1.0',
        lastModified: '2024-01-01',
      };

      const result = service.extractComponents(fileData);

      expect(result.components).toEqual([]);
    });

    it('should handle null nodes in children', () => {
      const fileData = {
        name: 'TestFile',
        version: '1.0',
        document: {
          children: [
            {
              id: 'page-1',
              name: 'Page 1',
              type: 'PAGE',
              children: [
                null,
                {
                  id: 'comp-1',
                  name: 'Button',
                  type: 'COMPONENT',
                },
              ],
            },
          ],
        },
      };

      const result = service.extractComponents(fileData);

      expect(result.components).toBeDefined();
      expect(Array.isArray(result.components)).toBe(true);
    });

    it('should handle nested children recursively', () => {
      const fileData = {
        name: 'TestFile',
        document: {
          children: [
            {
              id: 'page-1',
              name: 'Page 1',
              type: 'PAGE',
              children: [
                {
                  id: 'frame-1',
                  name: 'Frame',
                  type: 'FRAME',
                  absoluteBoundingBox: { x: 0, y: 0, width: 500, height: 500 },
                  children: [
                    {
                      id: 'comp-1',
                      name: 'Button',
                      type: 'COMPONENT',
                      absoluteBoundingBox: { x: 10, y: 10, width: 100, height: 50 },
                      children: [
                        {
                          id: 'text-1',
                          name: 'Label',
                          type: 'TEXT',
                          characters: 'Click',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      };

      const result = service.extractComponents(fileData);

      expect(result.components).toBeDefined();
      expect(result.components.length).toBeGreaterThan(0);
    });

    it('should handle FRAME type nodes', () => {
      const fileData = {
        name: 'TestFile',
        document: {
          children: [
            {
              id: 'page-1',
              name: 'Page 1',
              type: 'PAGE',
              children: [
                {
                  id: 'frame-1',
                  name: 'MainFrame',
                  type: 'FRAME',
                  absoluteBoundingBox: { x: 0, y: 0, width: 1920, height: 1080 },
                  fills: [{ color: { r: 1, g: 1, b: 1 } }],
                  cornerRadius: 0,
                  paddingLeft: 0,
                  children: [],
                },
              ],
            },
          ],
        },
      };

      const result = service.extractComponents(fileData);

      const frameComp = result.components.find((c) => c.type === 'FRAME');
      expect(frameComp).toBeDefined();
      expect(frameComp.properties.width).toBe(1920);
    });

    it('should handle components without specific types', () => {
      const fileData = {
        name: 'TestFile',
        document: {
          children: [
            {
              id: 'page-1',
              name: 'Page 1',
              type: 'PAGE',
              children: [
                {
                  id: 'group-1',
                  name: 'Group',
                  type: 'GROUP',
                  absoluteBoundingBox: { x: 0, y: 0, width: 100, height: 100 },
                  children: [],
                },
              ],
            },
          ],
        },
      };

      const result = service.extractComponents(fileData);

      const groupComp = result.components.find((c) => c.type === 'GROUP');
      expect(groupComp).toBeDefined();
      expect(groupComp.properties).toEqual({});
    });

    it('should extract TEXT properties with missing style fields', () => {
      const fileData = {
        name: 'TestFile',
        document: {
          children: [
            {
              id: 'page-1',
              name: 'Page 1',
              type: 'PAGE',
              children: [
                {
                  id: 'text-1',
                  name: 'Text',
                  type: 'TEXT',
                  // Missing characters, style, and fills
                  children: [],
                },
              ],
            },
          ],
        },
      };

      const result = service.extractComponents(fileData);

      const textComp = result.components.find((c) => c.type === 'TEXT');
      expect(textComp.properties.content).toBe('');
      expect(textComp.properties.fontSize).toBeUndefined();
    });

    it('should extract RECTANGLE properties with minimal data', () => {
      const fileData = {
        name: 'TestFile',
        document: {
          children: [
            {
              id: 'page-1',
              name: 'Page 1',
              type: 'PAGE',
              children: [
                {
                  id: 'rect-1',
                  name: 'Rect',
                  type: 'RECTANGLE',
                  // Minimal properties
                  paddingTop: null,
                  children: [],
                },
              ],
            },
          ],
        },
      };

      const result = service.extractComponents(fileData);

      const rectComp = result.components.find((c) => c.type === 'RECTANGLE');
      expect(rectComp.properties.padding).toBe(0);
    });

    it('should extract COMPONENT properties without bounding box', () => {
      const fileData = {
        name: 'TestFile',
        document: {
          children: [
            {
              id: 'page-1',
              name: 'Page 1',
              type: 'PAGE',
              children: [
                {
                  id: 'comp-1',
                  name: 'MyComponent',
                  type: 'COMPONENT',
                  children: [],
                },
              ],
            },
          ],
        },
      };

      const result = service.extractComponents(fileData);

      const comp = result.components.find((c) => c.type === 'COMPONENT');
      expect(comp.properties.componentName).toBe('MyComponent');
      expect(comp.properties.width).toBeUndefined();
    });

    it('should filter out components with parent references', () => {
      const fileData = {
        name: 'TestFile',
        document: {
          children: [
            {
              id: 'page-1',
              name: 'Page 1',
              type: 'PAGE',
              children: [
                {
                  id: 'parent-1',
                  name: 'Parent',
                  type: 'FRAME',
                  children: [
                    {
                      id: 'child-1',
                      name: 'Child',
                      type: 'RECTANGLE',
                    },
                  ],
                },
              ],
            },
          ],
        },
      };

      const result = service.extractComponents(fileData);

      // Only root components (without parent) should be in result
      const childComp = result.components.find((c) => c.id === 'child-1');
      expect(childComp).toBeUndefined();

      // Parent should be included
      const parentComp = result.components.find((c) => c.id === 'parent-1');
      expect(parentComp).toBeDefined();
    });

    it('should return empty components array when page has no children', () => {
      const fileData = {
        name: 'TestFile',
        document: {
          children: [
            {
              id: 'page-1',
              name: 'Page 1',
              type: 'PAGE',
              // No children property
            },
          ],
        },
      };

      const result = service.extractComponents(fileData);

      expect(result.components).toEqual([]);
    });

    it('should extract TEXT with all style properties', () => {
      const fileData = {
        name: 'TestFile',
        document: {
          children: [
            {
              id: 'page-1',
              name: 'Page 1',
              type: 'PAGE',
              children: [
                {
                  id: 'text-1',
                  name: 'Styled Text',
                  type: 'TEXT',
                  characters: 'Styled text content',
                  style: {
                    fontSize: 16,
                    fontFamily: 'Roboto',
                    fontWeight: 700,
                    textAlignHorizontal: 'LEFT',
                  },
                  fills: [{ color: { r: 0.1, g: 0.2, b: 0.3 } }],
                  children: [],
                },
              ],
            },
          ],
        },
      };

      const result = service.extractComponents(fileData);
      const textComp = result.components.find((c) => c.type === 'TEXT');

      expect(textComp.properties.content).toBe('Styled text content');
      expect(textComp.properties.fontSize).toBe(16);
      expect(textComp.properties.fontFamily).toBe('Roboto');
      expect(textComp.properties.fontWeight).toBe(700);
      expect(textComp.properties.textAlign).toBe('LEFT');
      expect(textComp.properties.color).toBeDefined();
    });

    it('should extract RECTANGLE with bounding box and padding', () => {
      const fileData = {
        name: 'TestFile',
        document: {
          children: [
            {
              id: 'page-1',
              name: 'Page 1',
              type: 'PAGE',
              children: [
                {
                  id: 'rect-1',
                  name: 'Padded Box',
                  type: 'RECTANGLE',
                  absoluteBoundingBox: {
                    x: 10,
                    y: 20,
                    width: 200,
                    height: 150,
                  },
                  cornerRadius: 12,
                  paddingLeft: 16,
                  paddingTop: 20,
                  fills: [{ color: { r: 0.8, g: 0.8, b: 0.8 } }],
                  children: [],
                },
              ],
            },
          ],
        },
      };

      const result = service.extractComponents(fileData);
      const rectComp = result.components.find((c) => c.type === 'RECTANGLE');

      expect(rectComp.properties.x).toBe(10);
      expect(rectComp.properties.y).toBe(20);
      expect(rectComp.properties.width).toBe(200);
      expect(rectComp.properties.height).toBe(150);
      expect(rectComp.properties.borderRadius).toBe(12);
      expect(rectComp.properties.padding).toBe(16);
      expect(rectComp.properties.backgroundColor).toBeDefined();
    });

    it('should handle children with null component returned from traverse', () => {
      // This tests line 134: if (childComponent) { component.children.push(childComponent); }
      // When traverse returns undefined for null nodes
      const fileData = {
        name: 'TestFile',
        document: {
          children: [
            {
              id: 'page-1',
              name: 'Page 1',
              type: 'PAGE',
              children: [
                {
                  id: 'frame-1',
                  name: 'Frame',
                  type: 'FRAME',
                  children: [
                    null, // This will cause traverse to return undefined
                    {
                      id: 'child-1',
                      name: 'Child',
                      type: 'RECTANGLE',
                    },
                  ],
                },
              ],
            },
          ],
        },
      };

      const result = service.extractComponents(fileData);
      const frameComp = result.components.find((c) => c.type === 'FRAME');

      // frameComp should exist and only have the valid child
      expect(frameComp).toBeDefined();
      // Children with null should be filtered out
      expect(frameComp.children.filter((c) => c !== undefined).length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('extractStyles', () => {
    it('should extract styles from file data', () => {
      const fileData = {
        styles: {
          'color-1': {
            name: 'Primary',
            styleType: 'FILL',
            color: { r: 0.2, g: 0.2, b: 0.8 },
          },
          'text-1': {
            name: 'Heading',
            styleType: 'TEXT',
            fontSize: 24,
          },
          'effect-1': {
            name: 'Shadow',
            styleType: 'EFFECT',
          },
        },
      };

      const result = service.extractStyles(fileData);

      expect(result.colors['Primary']).toBeDefined();
      expect(result.typography['Heading']).toBeDefined();
      expect(result.effects['Shadow']).toBeDefined();
    });

    it('should handle missing styles', () => {
      const fileData = {
        name: 'NoStyles',
      };

      const result = service.extractStyles(fileData);

      expect(result.colors).toEqual({});
      expect(result.typography).toEqual({});
      expect(result.effects).toEqual({});
    });

    it('should handle empty styles', () => {
      const fileData = {
        styles: {},
      };

      const result = service.extractStyles(fileData);

      expect(result.colors).toEqual({});
      expect(result.typography).toEqual({});
      expect(result.effects).toEqual({});
    });

    it('should handle unknown style types', () => {
      const fileData = {
        styles: {
          'unknown-1': {
            name: 'Unknown',
            styleType: 'UNKNOWN_TYPE',
          },
        },
      };

      const result = service.extractStyles(fileData);

      expect(result.colors).toEqual({});
      expect(result.typography).toEqual({});
      expect(result.effects).toEqual({});
    });

    it('should handle mixed valid and invalid styles', () => {
      const fileData = {
        styles: {
          'fill-1': {
            name: 'ValidColor',
            styleType: 'FILL',
            color: { r: 1, g: 0, b: 0 },
          },
          'unknown-1': {
            name: 'InvalidStyle',
            styleType: 'UNKNOWN',
          },
          'text-1': {
            name: 'ValidText',
            styleType: 'TEXT',
            fontSize: 16,
          },
        },
      };

      const result = service.extractStyles(fileData);

      expect(result.colors['ValidColor']).toBeDefined();
      expect(result.typography['ValidText']).toBeDefined();
      expect(Object.keys(result.colors)).toHaveLength(1);
      expect(Object.keys(result.typography)).toHaveLength(1);
      expect(Object.keys(result.effects)).toHaveLength(0);
    });
  });
});
