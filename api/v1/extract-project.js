/**
 * @swagger
 * /extract-project:
 *   post:
 *     summary: Extract Figma file(s) and generate JSON files
 *     description: Extracts specific file or all files from a project and generates JSON specifications for another agent to develop
 *     tags:
 *       - Project Extraction
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - figmaToken
 *               - githubToken
 *             properties:
 *               fileKey:
 *                 type: string
 *                 description: Specific Figma File Key (use this OR teamId+projectId)
 *                 example: "UijlTILMmeErA1cakxBBLU"
 *               teamId:
 *                 type: string
 *                 description: Figma Team ID (required if not using fileKey)
 *                 example: "1550518470816288684"
 *               projectId:
 *                 type: string
 *                 description: Figma Project ID (required if not using fileKey)
 *                 example: "454737867"
 *               figmaToken:
 *                 type: string
 *                 description: Figma Personal Access Token
 *               githubToken:
 *                 type: string
 *                 description: GitHub Personal Access Token
 *               options:
 *                 type: object
 *                 properties:
 *                   frameworks:
 *                     type: array
 *                     items:
 *                       type: string
 *                       enum: [react, vue, angular, html]
 *                     description: Frameworks to generate code for
 *                     default: ["react"]
 *                   maxComponentsPerFile:
 *                     type: integer
 *                     description: Maximum components to extract per file
 *                     default: 10
 *                   includeStyles:
 *                     type: boolean
 *                     default: true
 *                   generateDocs:
 *                     type: boolean
 *                     description: Generate documentation JSON
 *                     default: true
 *     responses:
 *       200:
 *         description: Project successfully extracted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 projectId:
 *                   type: string
 *                 projectName:
 *                   type: string
 *                 filesProcessed:
 *                   type: integer
 *                 outputFiles:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       fileName:
 *                         type: string
 *                       fileKey:
 *                         type: string
 *                       frameworks:
 *                         type: array
 *                         items:
 *                           type: string
 *                       componentsExtracted:
 *                         type: integer
 *                       jsonPath:
 *                         type: string
 *                 metadata:
 *                   type: object
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */

import ProjectExtractionController from '../../src/controllers/projectExtractionController.js';
import { asyncHandler } from '../../src/utils/errorHandler.js';

export default asyncHandler(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      details: 'Only POST requests are supported',
    });
  }

  return await ProjectExtractionController.extractProject(req, res);
});
