import { Repository, In } from 'typeorm';
import { CatalogItem } from '../Domain/models/CatalogItem';
import { CatalogItemDTO } from '../Domain/DTOs/CatalogItemDTO';
import { Logger } from '../Infrastructure/Logger';
import { IAuditClient } from '../External/IAuditClient';

export class CatalogService {
  private readonly logger: Logger;
  
  constructor(
    private catalogRepository: Repository<CatalogItem>,
    private auditClient: IAuditClient
  ) {
    this.logger = Logger.getInstance();
  }

  async getCatalog(): Promise<CatalogItemDTO[]> {
    try {
      this.logger.info('CatalogService', 'Fetching catalog from database');
      const items = await this.catalogRepository.find({
        where: { available: true }
      });
      this.logger.info('CatalogService', `Found ${items.length} available catalog items`);
      await this.auditClient.logInfo('SALES', `Catalog fetched: ${items.length} items available`);
      return items;
    } catch (error: any) {
      const message = error?.message || 'Unknown error';
      this.logger.error('CatalogService', `Error fetching catalog: ${message}`);
      await this.auditClient.logError('SALES', `Failed to fetch catalog: ${message}`);
      throw error;
    }
  }

  async getItemsByPerfumeIds(perfumeIds: string[]): Promise<CatalogItem[]> {
    try {
      this.logger.info('CatalogService', `Fetching items for perfumeIds: ${perfumeIds.join(', ')}`);
      const items = await this.catalogRepository.find({
        where: {
          perfumeId: In(perfumeIds),
          available: true
        }
      });
      
      // Provjeri da li su svi traženi perfumi dostupni
      const foundIds = items.map(item => item.perfumeId);
      const missingIds = perfumeIds.filter(id => !foundIds.includes(id));
      
      if (missingIds.length > 0) {
        throw new Error(`Perfumes not available in catalog: ${missingIds.join(', ')}`);
      }
      
      await this.auditClient.logInfo('SALES', `Catalog items fetched for ${perfumeIds.length} perfumes`);
      return items;
    } catch (error: any) {
      const message = error?.message || 'Unknown error';
      this.logger.error('CatalogService', `Error fetching items by perfume IDs: ${message}`);
      await this.auditClient.logError('SALES', `Failed to fetch catalog items: ${message}`);
      throw error;
    }
  }

  async addItem(item: CatalogItemDTO): Promise<CatalogItem> {
    try {
      this.logger.info('CatalogService', `Adding new catalog item: ${item.perfumeId}`);
      const catalogItem = this.catalogRepository.create(item);
      const saved = await this.catalogRepository.save(catalogItem);
      await this.auditClient.logInfo('SALES', `Catalog item added for perfume: ${item.perfumeId}`);
      return saved;
    } catch (error: any) {
      const message = error?.message || 'Unknown error';
      this.logger.error('CatalogService', `Error adding catalog item: ${message}`);
      await this.auditClient.logError('SALES', `Failed to add catalog item: ${message}`);
      throw error;
    }
  }

  async markAsUnavailable(perfumeIds: string[]): Promise<void> {
    try {
      this.logger.info('CatalogService', `Updating quantity for ${perfumeIds.length} items after purchase`);
      // Ne označavamo kao nedostupno, već samo smanjujemo quantity
      // Logika smanjivanja je u reduceQuantity metodi
      await this.auditClient.logWarning('SALES', `Quantity updated for ${perfumeIds.length} catalog items after purchase`);
    } catch (error: any) {
      const message = error?.message || 'Unknown error';
      this.logger.error('CatalogService', `Error updating quantity: ${message}`);
      await this.auditClient.logError('SALES', `Failed to update quantity: ${message}`);
      throw error;
    }
  }

  async reduceQuantity(perfumeId: string, quantity: number): Promise<void> {
    try {
      this.logger.info('CatalogService', `Reducing quantity for ${perfumeId} by ${quantity}`);
      const item = await this.catalogRepository.findOne({
        where: { perfumeId }
      });
      
      if (!item) {
        throw new Error(`Catalog item not found for perfume ${perfumeId}`);
      }

      const newQuantity = Math.max(0, item.quantity - quantity);
      await this.catalogRepository.update(
        { perfumeId },
        { quantity: newQuantity, available: newQuantity > 0 }
      );
      
      this.logger.info('CatalogService', `Quantity reduced for ${perfumeId}. New quantity: ${newQuantity}`);
      await this.auditClient.logWarning('SALES', `Quantity reduced for ${perfumeId}: ${item.quantity} -> ${newQuantity}`);
    } catch (error: any) {
      const message = error?.message || 'Unknown error';
      this.logger.error('CatalogService', `Error reducing quantity: ${message}`);
      await this.auditClient.logError('SALES', `Failed to reduce quantity: ${message}`);
      throw error;
    }
  }
}
