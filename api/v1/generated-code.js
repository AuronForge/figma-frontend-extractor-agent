/**
 * @swagger
 * /generated-code:
 *   get:
 *     summary: Retrieve generated code entries
 *     description: Retrieves all generated code entries or a specific entry by ID
 *     tags:
 *       - Code Generation
 *     parameters:
 *       - $ref: '#/components/parameters/CodeId'
 *       - name: fileKey
 *         in: query
 *         description: Filter by Figma file key
 *         required: false
 *         schema:
 *           type: string
 *       - name: framework
 *         in: query
 *         description: Filter by framework
 *         required: false
 *         schema:
 *           type: string
 *           enum: [react, vue, angular, html]
 *     responses:
 *       200:
 *         description: Successfully retrieved generated code entries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 5
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ExtractResponse'
 *       404:
 *         description: Generated code entry not found
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
 */

import GeneratedCodeRepository from '../../src/repositories/generatedCodeRepository.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const { id, fileKey, framework } = req.query;
    const repository = new GeneratedCodeRepository();

    // Buscar por ID específico
    if (id) {
      const record = await repository.findById(id);

      if (!record) {
        return res.status(404).json({
          success: false,
          error: 'Generated code not found',
          details: `No record found with id: ${id}`,
        });
      }

      return res.status(200).json({
        success: true,
        data: record,
      });
    }

    // Buscar com filtros
    let records;
    if (fileKey) {
      records = await repository.findByFileKey(fileKey);
    } else if (framework) {
      records = await repository.findByFramework(framework);
    } else {
      records = await repository.findAll();
    }

    return res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    console.error('Get generated code error:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve generated code',
      details: error.message,
    });
  }
}
