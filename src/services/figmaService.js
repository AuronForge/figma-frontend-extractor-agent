import axios from 'axios';

/**
 * Service para interagir com a API do Figma
 */
class FigmaService {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.baseURL = 'https://api.figma.com/v1';
  }

  /**
   * Busca informações de um arquivo do Figma
   * @param {string} fileKey - Chave do arquivo Figma
   * @returns {Promise<Object>} Dados do arquivo
   */
  async getFile(fileKey) {
    try {
      const response = await axios.get(`${this.baseURL}/files/${fileKey}`, {
        headers: {
          'X-Figma-Token': this.accessToken,
        },
      });
      return response.data;
    } catch (error) {
      const errorDetails = error.response?.data || error.message;
      console.error('Figma API Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: errorDetails,
        fileKey,
      });
      throw new Error(`Failed to fetch Figma file: ${JSON.stringify(errorDetails)}`);
    }
  }

  /**
   * Busca um nó específico de um arquivo
   * @param {string} fileKey - Chave do arquivo Figma
   * @param {string} nodeId - ID do nó
   * @returns {Promise<Object>} Dados do nó
   */
  async getNode(fileKey, nodeId) {
    try {
      const response = await axios.get(`${this.baseURL}/files/${fileKey}/nodes`, {
        params: { ids: nodeId },
        headers: {
          'X-Figma-Token': this.accessToken,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(
        `Failed to fetch Figma node: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Busca imagens de um arquivo
   * @param {string} fileKey - Chave do arquivo Figma
   * @param {string[]} ids - Array de IDs de nós
   * @returns {Promise<Object>} URLs das imagens
   */
  async getImages(fileKey, ids) {
    try {
      const response = await axios.get(`${this.baseURL}/images/${fileKey}`, {
        params: { ids: ids.join(','), format: 'svg' },
        headers: {
          'X-Figma-Token': this.accessToken,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(
        `Failed to fetch Figma images: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Extrai componentes de um arquivo Figma
   * @param {Object} fileData - Dados do arquivo Figma
   * @returns {Object} Estrutura de componentes extraídos
   */
  extractComponents(fileData) {
    const components = [];
    const traverse = (node, parent = null) => {
      if (!node) {
        return;
      }

      const component = {
        id: node.id,
        name: node.name,
        type: node.type,
        parent: parent ? parent.id : null,
        children: [],
        properties: {},
      };

      // Extrair propriedades específicas por tipo
      if (node.type === 'TEXT') {
        component.properties = {
          content: node.characters || '',
          fontSize: node.style?.fontSize,
          fontFamily: node.style?.fontFamily,
          fontWeight: node.style?.fontWeight,
          textAlign: node.style?.textAlignHorizontal,
          color: node.fills?.[0]?.color,
        };
      } else if (node.type === 'RECTANGLE' || node.type === 'FRAME') {
        component.properties = {
          width: node.absoluteBoundingBox?.width,
          height: node.absoluteBoundingBox?.height,
          x: node.absoluteBoundingBox?.x,
          y: node.absoluteBoundingBox?.y,
          backgroundColor: node.fills?.[0]?.color,
          borderRadius: node.cornerRadius,
          padding: node.paddingLeft || node.paddingTop || 0,
        };
      } else if (node.type === 'INSTANCE' || node.type === 'COMPONENT') {
        component.properties = {
          componentName: node.name,
          width: node.absoluteBoundingBox?.width,
          height: node.absoluteBoundingBox?.height,
        };
      }

      // Processar filhos
      if (node.children && node.children.length > 0) {
        node.children.forEach((child) => {
          const childComponent = traverse(child, component);
          if (childComponent) {
            component.children.push(childComponent);
          }
        });
      }

      components.push(component);
      return component;
    };

    // Começar pela página principal
    if (fileData.document && fileData.document.children) {
      fileData.document.children.forEach((page) => {
        if (page.children) {
          page.children.forEach((child) => traverse(child));
        }
      });
    }

    return {
      name: fileData.name,
      version: fileData.version,
      lastModified: fileData.lastModified,
      components: components.filter((c) => !c.parent), // Apenas componentes raiz
    };
  }

  /**
   * Extrai estilos do arquivo
   * @param {Object} fileData - Dados do arquivo Figma
   * @returns {Object} Estilos extraídos
   */
  extractStyles(fileData) {
    const styles = {
      colors: {},
      typography: {},
      effects: {},
    };

    if (fileData.styles) {
      Object.entries(fileData.styles).forEach(([_key, style]) => {
        if (style.styleType === 'FILL') {
          styles.colors[style.name] = style;
        } else if (style.styleType === 'TEXT') {
          styles.typography[style.name] = style;
        } else if (style.styleType === 'EFFECT') {
          styles.effects[style.name] = style;
        }
      });
    }

    return styles;
  }
}

export default FigmaService;
