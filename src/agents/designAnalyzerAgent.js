import axios from 'axios';

/**
 * Agent que usa IA para analisar designs do Figma e gerar código
 */
class DesignAnalyzerAgent {
  constructor(provider = 'github') {
    this.provider = provider;
    this.setupProvider();
  }

  setupProvider() {
    switch (this.provider) {
      case 'github':
        this.apiUrl = 'https://models.inference.ai.azure.com/chat/completions';
        this.apiKey = process.env.GITHUB_TOKEN;
        this.model = process.env.GITHUB_MODEL || 'gpt-4o';
        break;
      case 'openai':
        this.apiUrl = 'https://api.openai.com/v1/chat/completions';
        this.apiKey = process.env.OPENAI_API_KEY;
        this.model = process.env.OPENAI_MODEL || 'gpt-4o';
        break;
      case 'anthropic':
        this.apiUrl = 'https://api.anthropic.com/v1/messages';
        this.apiKey = process.env.ANTHROPIC_API_KEY;
        this.model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
        break;
      default:
        throw new Error(`Unsupported AI provider: ${this.provider}`);
    }

    if (!this.apiKey) {
      throw new Error(`API key not configured for provider: ${this.provider}`);
    }
  }

  /**
   * Analisa componentes do Figma e gera código
   * @param {Object} components - Componentes extraídos do Figma
   * @param {string} framework - Framework alvo (react, vue, angular, html)
   * @param {Object} options - Opções adicionais
   * @returns {Promise<Object>} Código gerado
   */
  async analyzeAndGenerateCode(components, framework, options = {}) {
    const prompt = this.buildPrompt(components, framework, options);

    try {
      const response = await this.callAI(prompt);
      return this.parseResponse(response, framework);
    } catch (error) {
      throw new Error(`Failed to generate code: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Constrói o prompt para a IA
   */
  buildPrompt(components, framework, options) {
    const componentsJson = JSON.stringify(components, null, 2);

    let frameworkInstructions = '';
    switch (framework) {
      case 'react':
        frameworkInstructions = `
Generate React functional components using hooks.
${options.typescript ? 'Use TypeScript with proper type definitions.' : 'Use JavaScript.'}
${options.includeStyles ? 'Include inline styles or CSS modules.' : ''}
Use modern React best practices (React 18+).
`;
        break;
      case 'vue':
        frameworkInstructions = `
Generate Vue 3 components using Composition API.
${options.typescript ? 'Use TypeScript with proper type definitions.' : 'Use JavaScript.'}
${options.includeStyles ? 'Include scoped styles in the <style> section.' : ''}
Use modern Vue 3 best practices.
`;
        break;
      case 'angular':
        frameworkInstructions = `
Generate Angular components (Angular 15+).
Use TypeScript with proper type definitions and decorators.
${options.includeStyles ? 'Include component styles.' : ''}
Follow Angular style guide and best practices.
`;
        break;
      case 'html':
        frameworkInstructions = `
Generate semantic HTML5 markup.
${options.includeStyles ? 'Include CSS styles in a separate section.' : ''}
Use modern HTML5 and CSS3 features.
`;
        break;
    }

    return `You are an expert frontend developer. Analyze the following Figma design components and generate clean, production-ready ${framework} code.

FIGMA COMPONENTS:
${componentsJson}

INSTRUCTIONS:
${frameworkInstructions}
${options.responsive ? '- Make the design responsive with proper breakpoints.' : ''}
${options.cssFramework === 'tailwind' ? '- Use Tailwind CSS classes.' : ''}
${options.cssFramework === 'styled-components' ? '- Use styled-components for styling.' : ''}

Generate the code with:
1. Component structure following ${framework} conventions
2. Proper component hierarchy
3. Accessible HTML elements
4. Clean, readable code with comments
5. Reusable component patterns

Return the response in the following JSON format:
{
  "components": [
    {
      "name": "ComponentName",
      "code": "component code here",
      "styles": "styles code here (if applicable)",
      "dependencies": ["list", "of", "dependencies"]
    }
  ],
  "globalStyles": "global styles if any",
  "notes": "implementation notes and suggestions"
}`;
  }

  /**
   * Chama a API de IA
   */
  async callAI(prompt) {
    if (this.provider === 'anthropic') {
      return this.callAnthropic(prompt);
    }

    const response = await axios.post(
      this.apiUrl,
      {
        model: this.model,
        messages: [
          {
            role: 'system',
            content:
              'You are an expert frontend developer specialized in converting designs to code.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
      }
    );

    return response.data.choices[0].message.content;
  }

  /**
   * Chama a API do Anthropic
   */
  async callAnthropic(prompt) {
    const response = await axios.post(
      this.apiUrl,
      {
        model: this.model,
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
      }
    );

    return response.data.content[0].text;
  }

  /**
   * Faz parse da resposta da IA
   */
  parseResponse(response, _framework) {
    try {
      // Tentar extrair JSON da resposta
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Se não encontrar JSON, retornar estrutura padrão
      return {
        components: [
          {
            name: 'GeneratedComponent',
            code: response,
            styles: '',
            dependencies: [],
          },
        ],
        globalStyles: '',
        notes: 'Generated code from AI response',
      };
    } catch {
      // Fallback: retornar a resposta bruta
      return {
        components: [
          {
            name: 'GeneratedComponent',
            code: response,
            styles: '',
            dependencies: [],
          },
        ],
        globalStyles: '',
        notes: 'Raw AI response',
      };
    }
  }
}

export default DesignAnalyzerAgent;
