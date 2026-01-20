/**
 * @swagger
 * /validate-token:
 *   get:
 *     summary: Validate Figma access token
 *     description: Validates if the configured Figma access token is valid and has proper permissions
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Figma token is valid
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     handle:
 *                       type: string
 *       401:
 *         description: Token is invalid or not configured
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
 *                 details:
 *                   type: string
 *       405:
 *         description: Method not allowed
 *   post:
 *     summary: Validate Figma access token
 *     description: Validates if the configured Figma access token is valid and has proper permissions
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Figma token is valid
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     handle:
 *                       type: string
 *       401:
 *         description: Token is invalid or not configured
 *       405:
 *         description: Method not allowed
 */

import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const figmaToken = process.env.FIGMA_ACCESS_TOKEN;

    if (!figmaToken) {
      return res.status(401).json({
        success: false,
        error: 'Figma token not configured',
        details: 'Please set FIGMA_ACCESS_TOKEN in environment variables',
      });
    }

    // Tentar fazer uma chamada simples para validar o token
    const response = await axios.get('https://api.figma.com/v1/me', {
      headers: {
        'X-Figma-Token': figmaToken,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Figma token is valid',
      user: {
        id: response.data.id,
        email: response.data.email,
        handle: response.data.handle,
      },
    });
  } catch (error) {
    if (error.response?.status === 403) {
      return res.status(401).json({
        success: false,
        error: 'Invalid Figma token',
        details: 'The configured FIGMA_ACCESS_TOKEN is invalid or expired',
        help: 'Generate a new token at https://www.figma.com/settings',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to validate token',
      details: error.message,
    });
  }
}
