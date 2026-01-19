/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the Figma Frontend Extractor Agent service
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Service is healthy and operational
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 service:
 *                   type: string
 *                   example: figma-frontend-extractor-agent
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 apiVersion:
 *                   type: string
 *                   example: v1
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2026-01-19T10:30:00.000Z
 *                 endpoints:
 *                   type: object
 *                   properties:
 *                     extractDesign:
 *                       type: string
 *                       example: /api/v1/extract-design
 *                     generateCode:
 *                       type: string
 *                       example: /api/v1/generate-code
 *                     generatedCode:
 *                       type: string
 *                       example: /api/v1/generated-code
 *                     swagger:
 *                       type: string
 *                       example: /api/v1/swagger
 *                     apiDocs:
 *                       type: string
 *                       example: /api/v1/api-docs
 *       405:
 *         description: Method not allowed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Method not allowed
 */
export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  res.status(200).json({
    status: 'ok',
    service: 'figma-frontend-extractor-agent',
    version: '1.0.0',
    apiVersion: 'v1',
    timestamp: new Date().toISOString(),
    endpoints: {
      listFiles: '/api/v1/list-files',
      extractDesign: '/api/v1/extract-design',
      generateCode: '/api/v1/generate-code',
      generatedCode: '/api/v1/generated-code',
      swagger: '/api/v1/swagger',
      apiDocs: '/api/v1/api-docs',
    },
  });
}
