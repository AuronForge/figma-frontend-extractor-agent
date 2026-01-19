import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Repository para gerenciar códigos gerados
 */
class GeneratedCodeRepository {
  constructor() {
    this.dbPath = path.join(__dirname, '../../database/generated-code.json');
  }

  /**
   * Inicializa o banco de dados se não existir
   */
  async initialize() {
    try {
      await fs.access(this.dbPath);
    } catch {
      // Criar diretório se não existir
      const dir = path.dirname(this.dbPath);
      await fs.mkdir(dir, { recursive: true });
      // Criar arquivo vazio
      await fs.writeFile(this.dbPath, JSON.stringify([], null, 2));
    }
  }

  /**
   * Lê todos os registros
   */
  async findAll() {
    await this.initialize();
    const data = await fs.readFile(this.dbPath, 'utf-8');
    return JSON.parse(data);
  }

  /**
   * Busca um registro por ID
   */
  async findById(id) {
    const records = await this.findAll();
    return records.find((record) => record.id === id);
  }

  /**
   * Salva um novo registro
   */
  async save(data) {
    const records = await this.findAll();
    records.push({
      ...data,
      createdAt: new Date().toISOString(),
    });
    await fs.writeFile(this.dbPath, JSON.stringify(records, null, 2));
    return data;
  }

  /**
   * Atualiza um registro existente
   */
  async update(id, data) {
    const records = await this.findAll();
    const index = records.findIndex((record) => record.id === id);

    if (index === -1) {
      throw new Error(`Record with id ${id} not found`);
    }

    records[index] = {
      ...records[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await fs.writeFile(this.dbPath, JSON.stringify(records, null, 2));
    return records[index];
  }

  /**
   * Deleta um registro
   */
  async delete(id) {
    const records = await this.findAll();
    const filtered = records.filter((record) => record.id !== id);

    if (records.length === filtered.length) {
      throw new Error(`Record with id ${id} not found`);
    }

    await fs.writeFile(this.dbPath, JSON.stringify(filtered, null, 2));
    return true;
  }

  /**
   * Busca registros por fileKey
   */
  async findByFileKey(fileKey) {
    const records = await this.findAll();
    return records.filter((record) => record.data?.fileKey === fileKey);
  }

  /**
   * Busca registros por framework
   */
  async findByFramework(framework) {
    const records = await this.findAll();
    return records.filter((record) => record.data?.framework === framework);
  }
}

export default GeneratedCodeRepository;
