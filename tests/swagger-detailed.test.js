import { describe, test, expect } from '@jest/globals';
import { swaggerSpec } from '../swagger.js';

describe('Swagger Spec - Detailed Validation', () => {
  test('should have all API paths defined with methods', () => {
    const expectedPaths = {
      '/health': ['get'],
      '/validate-token': ['get', 'post'],
      '/list-files': ['get', 'post'],
      '/extract-design': ['post'],
      '/extract-project': ['post'],
      '/generate-code': ['post'],
      '/generated-code': ['get'],
    };

    for (const [path, methods] of Object.entries(expectedPaths)) {
      expect(swaggerSpec.paths[path]).toBeDefined();

      for (const method of methods) {
        expect(swaggerSpec.paths[path][method]).toBeDefined();

        const methodDef = swaggerSpec.paths[path][method];
        expect(methodDef.summary || methodDef.description).toBeDefined();
      }
    }
  });

  test('should have proper servers with URLs', () => {
    expect(swaggerSpec.servers).toBeDefined();
    expect(swaggerSpec.servers.length).toBe(2);

    const devServer = swaggerSpec.servers[0];
    expect(devServer.url).toBe('http://localhost:3003/api/v1');
    expect(devServer.url).not.toBe('');
    expect(devServer.url).not.toBeNull();

    const prodServer = swaggerSpec.servers[1];
    expect(prodServer.url).toBe('https://figma-frontend-extractor-agent.vercel.app/api/v1');
    expect(prodServer.url).not.toBe('');
    expect(prodServer.url).not.toBeNull();
  });

  test('should not have empty URL properties anywhere', () => {
    // Check servers
    swaggerSpec.servers.forEach((server) => {
      expect(server.url).toBeTruthy();
    });

    // Check paths have responses with proper content
    Object.entries(swaggerSpec.paths).forEach(([_path, methods]) => {
      Object.entries(methods).forEach(([_method, definition]) => {
        if (typeof definition === 'object' && definition.responses) {
          Object.entries(definition.responses).forEach(([_status, response]) => {
            expect(response).toBeDefined();
          });
        }
      });
    });
  });

  test('verify complete OpenAPI structure', () => {
    expect(swaggerSpec.openapi).toBe('3.0.0');
    expect(swaggerSpec.info).toBeDefined();
    expect(swaggerSpec.info.title).toBeTruthy();
    expect(swaggerSpec.info.version).toBeTruthy();
    expect(swaggerSpec.paths).toBeDefined();
    expect(Object.keys(swaggerSpec.paths).length).toBeGreaterThan(0);
    expect(swaggerSpec.servers).toBeDefined();
    expect(swaggerSpec.servers.length).toBeGreaterThan(0);
  });
});
