/**
 * @swagger
 * /list-files:
 *   get:
 *     summary: List Figma files from a project or team
 *     description: Retrieves all Figma files (drafts and projects) accessible with the provided token. Requires team_id or project_id parameter.
 *     tags:
 *       - Design Extraction
 *     parameters:
 *       - name: team_id
 *         in: query
 *         description: Figma team ID to list files from
 *         required: false
 *         schema:
 *           type: string
 *           example: '1234567890'
 *       - name: project_id
 *         in: query
 *         description: Figma project ID to list files from
 *         required: false
 *         schema:
 *           type: string
 *           example: '9876543210'
 *     responses:
 *       200:
 *         description: Successfully retrieved Figma files
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 source:
 *                   type: string
 *                   example: 'team'
 *                 id:
 *                   type: string
 *                   example: '1234567890'
 *                 data:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: 'My Team'
 *                     files:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           key:
 *                             type: string
 *                             example: 'abc123xyz789'
 *                           name:
 *                             type: string
 *                             example: 'Landing Page Design'
 *                           thumbnail_url:
 *                             type: string
 *                             example: 'https://...'
 *                           last_modified:
 *                             type: string
 *                             format: date-time
 *                             example: '2026-01-19T10:30:00Z'
 *       400:
 *         description: Bad request - missing team_id or project_id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - invalid or missing Figma token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       405:
 *         description: Method not allowed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   post:
 *     summary: List Figma files from a project or team
 *     description: Retrieves all Figma files (drafts and projects) accessible with the provided token. Requires team_id or project_id in request body.
 *     tags:
 *       - Design Extraction
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               figmaToken:
 *                 type: string
 *                 description: Figma access token (optional, uses env var if not provided)
 *                 example: 'figo_...'
 *               team_id:
 *                 type: string
 *                 description: Figma team ID to list files from
 *                 example: '1234567890'
 *               teamId:
 *                 type: string
 *                 description: Figma team ID to list files from (alternative camelCase)
 *                 example: '1234567890'
 *               project_id:
 *                 type: string
 *                 description: Figma project ID to list files from
 *                 example: '9876543210'
 *               projectId:
 *                 type: string
 *                 description: Figma project ID to list files from (alternative camelCase)
 *                 example: '9876543210'
 *     responses:
 *       200:
 *         description: Successfully retrieved Figma files
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 source:
 *                   type: string
 *                   example: 'team'
 *                 id:
 *                   type: string
 *                   example: '1234567890'
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request - missing team_id or project_id
 *       401:
 *         description: Unauthorized - invalid or missing Figma token
 *       405:
 *         description: Method not allowed
 *       500:
 *         description: Internal server error
 */

import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  // Extract parameters from query (GET) or body (POST)
  const params = req.method === 'GET' ? req.query : req.body || {};

  // Support both snake_case and camelCase
  const team_id = params.team_id || params.teamId;
  const project_id = params.project_id || params.projectId;
  const customFigmaToken = params.figmaToken;

  // Validação: precisa de pelo menos um dos parâmetros
  if (!team_id && !project_id) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameter: team_id or project_id',
      details: 'Please provide either team_id or project_id to list files',
    });
  }

  // Obter token do Figma (prioridade: custom token do request > variáveis de ambiente)
  const figmaToken = customFigmaToken || process.env.FIGMA_ACCESS_TOKEN;

  if (!figmaToken) {
    return res.status(401).json({
      success: false,
      error: 'Figma access token not configured',
      details:
        'Please set FIGMA_ACCESS_TOKEN in environment variables or provide figmaToken in request',
    });
  }

  let source = '';
  let id = '';

  try {
    let response;

    // Determinar qual endpoint da API do Figma usar
    if (project_id) {
      // Listar arquivos de um projeto específico
      source = 'project';
      id = project_id;
      response = await axios.get(`https://api.figma.com/v1/projects/${project_id}/files`, {
        headers: {
          'X-Figma-Token': figmaToken,
        },
      });
    } else {
      // Listar arquivos de um team
      source = 'team';
      id = team_id;
      response = await axios.get(`https://api.figma.com/v1/teams/${team_id}/projects`, {
        headers: {
          'X-Figma-Token': figmaToken,
        },
      });
    }

    return res.status(200).json({
      success: true,
      source,
      id,
      data: response.data,
      metadata: {
        provider: 'figma',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Figma API Error:', error.response?.data || error.message);

    // Tratamento de erros específicos da API do Figma
    if (error.response?.status === 401) {
      return res.status(401).json({
        success: false,
        error: 'Invalid Figma access token',
        details: 'The provided token is invalid or expired',
      });
    }

    if (error.response?.status === 403) {
      return res.status(403).json({
        success: false,
        error: 'Access forbidden',
        details: 'You do not have permission to access this resource',
      });
    }

    if (error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        error: 'Resource not found',
        details: `${source} with id ${id} not found`,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch Figma files',
      details: error.response?.data?.message || error.message,
    });
  }
}
