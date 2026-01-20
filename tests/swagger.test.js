import { swaggerSpec } from '../swagger.js';

describe('Swagger Spec', () => {
  test('should have valid servers configuration', () => {
    expect(swaggerSpec.servers).toBeDefined();
    expect(swaggerSpec.servers.length).toBeGreaterThan(0);
  });

  test('should have development server', () => {
    const devServer = swaggerSpec.servers.find((s) => s.url === 'http://localhost:3003/api/v1');
    expect(devServer).toBeDefined();
    expect(devServer.description).toBe('Development server');
  });

  test('should have production server', () => {
    const prodServer = swaggerSpec.servers.find(
      (s) => s.url === 'https://figma-frontend-extractor-agent.vercel.app/api/v1'
    );
    expect(prodServer).toBeDefined();
    expect(prodServer.description).toBe('Production server');
  });

  test('should have proper OpenAPI version', () => {
    expect(swaggerSpec.openapi).toBe('3.0.0');
  });

  test('should have API paths defined', () => {
    expect(swaggerSpec.paths).toBeDefined();
    expect(Object.keys(swaggerSpec.paths).length).toBeGreaterThan(0);
  });

  test('should have required path definitions', () => {
    const requiredPaths = [
      '/validate-token',
      '/list-files',
      '/extract-design',
      '/extract-project',
      '/generate-code',
    ];

    for (const path of requiredPaths) {
      expect(swaggerSpec.paths[path]).toBeDefined();
    }
  });
});
