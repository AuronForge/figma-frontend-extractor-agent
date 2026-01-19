import ProjectExtractionService from '../services/projectExtractionService.js';
import { ValidationError } from '../utils/errorHandler.js';
import {
  validateFrameworks,
  validatePositiveInteger,
  validateBoolean,
} from '../utils/validators.js';
import { sendSuccess } from '../utils/responseFormatter.js';

/**
 * Controller for project extraction endpoints
 */
class ProjectExtractionController {
  /**
   * Extract Figma project and generate JSON files
   */
  static async extractProject(req, res) {
    const { fileKey, teamId, projectId, figmaToken, githubToken, options = {} } = req.body;

    // Validate required tokens
    if (!figmaToken || !githubToken) {
      throw new ValidationError('figmaToken and githubToken are required');
    }

    // Validate that either fileKey OR (teamId + projectId) is provided
    if (!fileKey && (!teamId || !projectId)) {
      throw new ValidationError('Either fileKey OR (teamId and projectId) are required');
    }

    // Validate and set default options
    const frameworks = options.frameworks || ['react'];
    validateFrameworks(frameworks);

    const maxComponentsPerFile = validatePositiveInteger(
      options.maxComponentsPerFile,
      'maxComponentsPerFile',
      10
    );

    const includeStyles = validateBoolean(options.includeStyles, true);
    const generateDocs = validateBoolean(options.generateDocs, true);

    // Initialize service
    const service = new ProjectExtractionService(figmaToken);

    console.log('Starting project extraction');

    // Extract project
    const result = await service.extractProject({
      fileKey,
      teamId,
      projectId,
      frameworks,
      options: {
        maxComponentsPerFile,
        includeStyles,
        generateDocs,
      },
    });

    console.log(
      `Project extraction completed: ${result.filesProcessed} files, ${result.totalComponentsExtracted} components`
    );

    // Remove sensitive data from response
    delete result.githubToken;

    return sendSuccess(res, result);
  }
}

export default ProjectExtractionController;
