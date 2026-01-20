/**
 * @swagger
 * /swagger-debug:
 *   get:
 *     summary: Swagger Debug Information
 *     description: Debug endpoint to check Swagger spec generation
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Debug information
 */
import { swaggerSpec } from '../../swagger.js';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  const debugInfo = {
    timestamp: new Date().toISOString(),
    spec: {
      openapi: swaggerSpec.openapi,
      info: {
        title: swaggerSpec.info.title,
        version: swaggerSpec.info.version,
      },
      servers: swaggerSpec.servers,
      pathCount: Object.keys(swaggerSpec.paths).length,
      paths: Object.keys(swaggerSpec.paths),
      tagsCount: swaggerSpec.tags?.length || 0,
      tags: swaggerSpec.tags?.map((t) => ({ name: t.name, description: t.description })) || [],
    },
    request: {
      host: req.headers.host,
      protocol: req.headers['x-forwarded-proto'] || 'http',
      origin: req.headers.origin,
      referer: req.headers.referer,
    },
  };

  res.status(200).json(debugInfo);
}
