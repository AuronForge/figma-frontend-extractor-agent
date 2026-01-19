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

import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import FigmaService from '../../src/services/figmaService.js';
import DesignAnalyzerAgent from '../../src/agents/designAnalyzerAgent.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      details: 'Only POST requests are supported',
    });
  }

  try {
    const { teamId, projectId, fileKey, figmaToken, githubToken, options = {} } = req.body;

    // Validar campos obrigatórios
    if (!figmaToken || !githubToken) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        details: 'figmaToken and githubToken are required',
      });
    }

    // Validar que tenha fileKey OU (teamId + projectId)
    if (!fileKey && (!teamId || !projectId)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        details: 'Either fileKey OR (teamId and projectId) are required',
      });
    }

    // Configurar opções padrão
    const {
      frameworks = ['react'],
      maxComponentsPerFile = 10,
      includeStyles = true,
      generateDocs = true,
    } = options;

    console.log(`Starting project extraction`);

    // Inicializar serviço do Figma
    const figmaService = new FigmaService(figmaToken);

    let files = [];
    let projectName = 'Unknown Project';

    // 1. Determinar quais arquivos processar
    if (fileKey) {
      // Processar apenas um arquivo específico
      console.log(`Processing specific file: ${fileKey}`);
      const fileData = await figmaService.getFile(fileKey);
      files = [
        {
          key: fileKey,
          name: fileData.name,
          last_modified: fileData.lastModified,
          thumbnail_url: fileData.thumbnailUrl || null,
        },
      ];
      projectName = fileData.name;
    } else {
      // Listar arquivos do projeto
      console.log(`Fetching files from project ${projectId}`);
      const projectResponse = await axios.get(
        `https://api.figma.com/v1/projects/${projectId}/files`,
        {
          headers: { 'X-Figma-Token': figmaToken },
        }
      );

      files = projectResponse.data.files || [];
      projectName = files[0]?.name || 'Unknown Project';
      console.log(`Found ${files.length} files in project`);
    }

    if (files.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No files found',
        details: 'The specified project contains no files',
      });
    }

    // 2. Criar diretório de output
    const outputDir = path.join(
      process.cwd(),
      'output',
      fileKey ? `file-${fileKey}-${Date.now()}` : `project-${projectId}-${Date.now()}`
    );
    await fs.mkdir(outputDir, { recursive: true });

    // 3. Processar cada arquivo
    const outputFiles = [];
    let totalComponentsExtracted = 0;

    for (const file of files) {
      try {
        console.log(`Processing file: ${file.name} (${file.key})`);

        // Verificar se é um arquivo Figma válido (não FigJam)
        const fileData = await figmaService.getFile(file.key);

        // Extrair componentes
        const componentsData = figmaService.extractComponents(fileData);

        // Limitar componentes
        if (componentsData.components && componentsData.components.length > maxComponentsPerFile) {
          componentsData.components = componentsData.components.slice(0, maxComponentsPerFile);
        }

        // Extrair estilos
        const styles = figmaService.extractStyles(fileData);

        // Gerar especificação JSON para cada framework
        const fileSpec = {
          id: uuidv4(),
          fileName: file.name,
          fileKey: file.key,
          lastModified: file.last_modified,
          thumbnailUrl: file.thumbnail_url,
          extractedAt: new Date().toISOString(),
          components: componentsData.components || [],
          styles: styles,
          metadata: {
            totalComponents: componentsData.components?.length || 0,
            teamId,
            projectId,
          },
        };

        // Gerar código para cada framework solicitado
        const generatedCode = {};
        for (const framework of frameworks) {
          try {
            console.log(`Generating ${framework} code for ${file.name}`);

            // Criar uma versão simplificada dos componentes para evitar payload muito grande
            const simplifiedComponents = {
              ...componentsData,
              components:
                componentsData.components?.slice(0, maxComponentsPerFile).map((comp) => ({
                  id: comp.id,
                  name: comp.name,
                  type: comp.type,
                  properties: comp.properties,
                  // Remover children aninhados profundos
                })) || [],
            };

            const agent = new DesignAnalyzerAgent('github');
            const code = await agent.analyzeAndGenerateCode(simplifiedComponents, framework, {
              includeStyles,
              maxComponents: maxComponentsPerFile,
            });
            generatedCode[framework] = code;
          } catch (error) {
            console.error(`Failed to generate ${framework} code:`, error.message);
            generatedCode[framework] = {
              error: error.message,
              status: 'failed',
            };
          }
        }

        fileSpec.generatedCode = generatedCode;

        // Salvar JSON
        const jsonFileName = `${file.name.replace(/[^a-z0-9]/gi, '-')}.json`;
        const jsonPath = path.join(outputDir, jsonFileName);
        await fs.writeFile(jsonPath, JSON.stringify(fileSpec, null, 2));

        outputFiles.push({
          fileName: file.name,
          fileKey: file.key,
          frameworks: frameworks.filter((f) => !generatedCode[f]?.error),
          componentsExtracted: componentsData.components?.length || 0,
          jsonPath: jsonFileName,
        });

        totalComponentsExtracted += componentsData.components?.length || 0;
      } catch (error) {
        console.error(`Failed to process file ${file.name}:`, error.message);
        outputFiles.push({
          fileName: file.name,
          fileKey: file.key,
          error: error.message,
          status: 'failed',
        });
      }
    }

    // 4. Gerar índice do projeto
    const projectIndex = {
      projectId: projectId || null,
      fileKey: fileKey || null,
      projectName,
      teamId: teamId || null,
      extractedAt: new Date().toISOString(),
      filesProcessed: files.length,
      totalComponentsExtracted,
      frameworks,
      files: outputFiles,
      outputDirectory: outputDir,
      githubToken: '***', // Não incluir o token no output
    };

    if (generateDocs) {
      await fs.writeFile(
        path.join(outputDir, 'project-index.json'),
        JSON.stringify(projectIndex, null, 2)
      );
    }

    console.log(
      `Project extraction completed: ${files.length} files, ${totalComponentsExtracted} components`
    );

    return res.status(200).json({
      success: true,
      ...projectIndex,
      outputDirectory: path.basename(outputDir),
    });
  } catch (error) {
    console.error('Extract project error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to extract project',
      details: error.message,
    });
  }
}
