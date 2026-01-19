/**
 * @swagger
 * /generate-code:
 *   post:
 *     summary: Generate frontend code from Figma design
 *     description: Generates frontend code (React/Vue/Angular/HTML) from a Figma design using AI
 *     tags:
 *       - Code Generation
 *     parameters:
 *       - $ref: '#/components/parameters/AIProvider'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenerateCodeRequest'
 *     responses:
 *       200:
 *         description: Code successfully generated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExtractResponse'
 *       400:
 *         description: Bad request - validation failed
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

import { v4 as uuidv4 } from 'uuid';
import FigmaService from '../../src/services/figmaService.js';
import DesignAnalyzerAgent from '../../src/agents/designAnalyzerAgent.js';
import GeneratedCodeRepository from '../../src/repositories/generatedCodeRepository.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    // Validar entrada
    const { fileKey, framework, pageId, options = {} } = req.body;

    if (!fileKey || !framework) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        details: 'fileKey and framework are required',
      });
    }

    if (!['react', 'vue', 'angular', 'html'].includes(framework)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid framework',
        details: 'framework must be one of: react, vue, angular, html',
      });
    }

    // Obter token do Figma
    const figmaToken = process.env.FIGMA_ACCESS_TOKEN;
    if (!figmaToken) {
      return res.status(401).json({
        success: false,
        error: 'Figma access token not configured',
        details: 'Please set FIGMA_ACCESS_TOKEN in environment variables',
      });
    }

    // Obter provider de IA do header
    const aiProvider = req.headers['x-ai-provider'] || 'github';

    // Inicializar serviços
    const figmaService = new FigmaService(figmaToken);
    const designAgent = new DesignAnalyzerAgent(aiProvider);
    const repository = new GeneratedCodeRepository();

    // Buscar arquivo do Figma
    console.log(`Fetching Figma file: ${fileKey}`);
    const fileData = await figmaService.getFile(fileKey);

    // Extrair componentes
    let componentsData;
    if (pageId) {
      // Extrair página específica
      const nodeData = await figmaService.getNode(fileKey, pageId);
      componentsData = figmaService.extractComponents(nodeData);
    } else {
      // Extrair arquivo completo
      componentsData = figmaService.extractComponents(fileData);
    }

    // Extrair estilos
    const styles = figmaService.extractStyles(fileData);

    // Gerar código com IA
    console.log(`Generating ${framework} code using ${aiProvider}`);
    const generatedCode = await designAgent.analyzeAndGenerateCode(
      componentsData,
      framework,
      options
    );

    // Preparar resultado
    const id = uuidv4();
    const result = {
      success: true,
      id,
      data: {
        framework,
        fileKey,
        fileName: fileData.name,
        pageId: pageId || null,
        components: generatedCode.components || [],
        globalStyles: generatedCode.globalStyles || '',
        notes: generatedCode.notes || '',
        extractedComponents: componentsData.components || [],
        styles,
      },
      metadata: {
        figmaFile: fileKey,
        figmaVersion: fileData.version,
        lastModified: fileData.lastModified,
        provider: aiProvider,
        timestamp: new Date().toISOString(),
      },
    };

    // Salvar no repositório
    await repository.save(result);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Generate code error:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to generate code',
      details: error.message,
    });
  }
}
