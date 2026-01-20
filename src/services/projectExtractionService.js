import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import FigmaService from './figmaService.js';
import DesignAnalyzerAgent from '../agents/designAnalyzerAgent.js';
import { ExternalAPIError, ValidationError } from '../utils/errorHandler.js';
import { sanitizeFileName } from '../utils/validators.js';

/**
 * Service for extracting and processing Figma projects
 */
class ProjectExtractionService {
  constructor(figmaToken) {
    this.figmaService = new FigmaService(figmaToken);
    this.figmaToken = figmaToken;
  }

  /**
   * Fetch files from Figma project or single file
   */
  async fetchFiles(fileKey, projectId) {
    if (fileKey) {
      // Single file mode
      const fileData = await this.figmaService.getFile(fileKey);
      return {
        files: [
          {
            key: fileKey,
            name: fileData.name,
            last_modified: fileData.lastModified,
            thumbnail_url: fileData.thumbnailUrl || null,
          },
        ],
        projectName: fileData.name,
      };
    }

    // Project mode
    try {
      const response = await axios.get(`https://api.figma.com/v1/projects/${projectId}/files`, {
        headers: { 'X-Figma-Token': this.figmaToken },
      });

      const files = response.data.files || [];
      return {
        files,
        projectName: files[0]?.name || 'Unknown Project',
      };
    } catch (error) {
      throw new ExternalAPIError(
        'Failed to fetch project files from Figma',
        error.response?.status || 502,
        error.response?.data
      );
    }
  }

  /**
   * Extract components from a file
   */
  async extractFileComponents(fileKey, maxComponents) {
    const fileData = await this.figmaService.getFile(fileKey);
    const componentsData = this.figmaService.extractComponents(fileData);

    // Limit components
    if (componentsData.components && componentsData.components.length > maxComponents) {
      componentsData.components = componentsData.components.slice(0, maxComponents);
    }

    const styles = this.figmaService.extractStyles(fileData);

    return {
      fileData,
      componentsData,
      styles,
    };
  }

  /**
   * Generate code for multiple frameworks
   */
  async generateCode(componentsData, frameworks, options) {
    const generatedCode = {};

    for (const framework of frameworks) {
      try {
        // Simplify components to reduce payload size
        const simplifiedComponents = {
          ...componentsData,
          components:
            componentsData.components?.map((comp) => ({
              id: comp.id,
              name: comp.name,
              type: comp.type,
              properties: comp.properties,
            })) || [],
        };

        const agent = new DesignAnalyzerAgent('github');
        const code = await agent.analyzeAndGenerateCode(simplifiedComponents, framework, options);

        generatedCode[framework] = code;
      } catch (error) {
        console.error(`Failed to generate ${framework} code:`, error.message);
        generatedCode[framework] = {
          error: error.message,
          status: 'failed',
        };
      }
    }

    return generatedCode;
  }

  /**
   * Save file specification to output directory
   */
  async saveFileSpec(outputDir, file, fileSpec) {
    const jsonFileName = `${sanitizeFileName(file.name)}.json`;
    const jsonPath = path.join(outputDir, jsonFileName);

    await fs.writeFile(jsonPath, JSON.stringify(fileSpec, null, 2));

    return jsonFileName;
  }

  /**
   * Create output directory
   */
  async createOutputDirectory(fileKey, projectId, fileName) {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const datetime = `${day}-${month}-${year}-${hours}-${minutes}-${seconds}`;

    const dirName = fileKey
      ? `file-${sanitizeFileName(fileName)}-${datetime}`
      : `project-${projectId}-${datetime}`;

    const outputDir = path.join(process.cwd(), 'output', dirName);
    await fs.mkdir(outputDir, { recursive: true });

    return outputDir;
  }

  /**
   * Generate project index file
   */
  async generateProjectIndex(outputDir, indexData) {
    const indexPath = path.join(outputDir, 'project-index.json');
    await fs.writeFile(indexPath, JSON.stringify(indexData, null, 2));
  }

  /**
   * Process single file extraction
   */
  async processFile(file, frameworks, options) {
    const { maxComponentsPerFile } = options;

    try {
      console.log(`Processing file: ${file.name} (${file.key})`);

      // Extract components
      const { componentsData, styles } = await this.extractFileComponents(
        file.key,
        maxComponentsPerFile
      );

      // Generate code for frameworks
      const generatedCode = await this.generateCode(componentsData, frameworks, options);

      // Build file specification
      const fileSpec = {
        id: uuidv4(),
        fileName: file.name,
        fileKey: file.key,
        lastModified: file.last_modified,
        thumbnailUrl: file.thumbnail_url,
        extractedAt: new Date().toISOString(),
        components: componentsData.components || [],
        styles: styles,
        generatedCode,
        metadata: {
          totalComponents: componentsData.components?.length || 0,
        },
      };

      return {
        fileSpec,
        success: true,
        componentsExtracted: componentsData.components?.length || 0,
      };
    } catch (error) {
      console.error(`Failed to process file ${file.name}:`, error.message);
      return {
        error: error.message,
        status: 'failed',
        success: false,
      };
    }
  }

  /**
   * Extract entire project
   */
  async extractProject(params) {
    const { fileKey, teamId, projectId, frameworks, options } = params;

    // Fetch files
    const { files, projectName } = await this.fetchFiles(fileKey, projectId);

    if (files.length === 0) {
      throw new ValidationError('No files found in the specified project or file');
    }

    // Create output directory with first file name
    const firstFileName = files[0]?.name || 'unknown';
    const outputDir = await this.createOutputDirectory(fileKey, projectId, firstFileName);

    // Process each file
    const outputFiles = [];
    let totalComponentsExtracted = 0;

    for (const file of files) {
      const result = await this.processFile(file, frameworks, options);

      if (result.success) {
        const jsonFileName = await this.saveFileSpec(outputDir, file, result.fileSpec);

        // Determine which frameworks succeeded
        const successfulFrameworks = frameworks.filter(
          (f) => !result.fileSpec.generatedCode[f]?.error
        );

        outputFiles.push({
          fileName: file.name,
          fileKey: file.key,
          frameworks: successfulFrameworks,
          componentsExtracted: result.componentsExtracted,
          jsonPath: jsonFileName,
        });

        totalComponentsExtracted += result.componentsExtracted;
      } else {
        outputFiles.push({
          fileName: file.name,
          fileKey: file.key,
          error: result.error,
          status: 'failed',
        });
      }
    }

    // Generate project index
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
    };

    if (options.generateDocs) {
      await this.generateProjectIndex(outputDir, projectIndex);
    }

    return {
      ...projectIndex,
      outputDirectory: path.basename(outputDir),
    };
  }
}

export default ProjectExtractionService;
