import { swaggerSpec } from '../../swagger.js';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(swaggerSpec);
}
