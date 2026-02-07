import { Repository } from 'typeorm';
import { SalesPackaging } from '../Domain/models/SalesPackaging';
import { SalesPackagingStatus } from '../Domain/enums/SalesPackagingStatus';
import { CatalogItemDTO } from '../Domain/DTOs/CatalogItemDTO';
import { PurchaseDTO } from '../Domain/DTOs/PurchaseDTO';
import { Logger } from '../Infrastructure/Logger';
import { CatalogService } from './CatalogService';
import { StorageClient } from '../External/StorageClient';
import { AnalyticsClient } from '../External/AnalyticsClient';
import { AuditClient } from '../External/AuditClient';

export class SalesCoordinator {
  private readonly logger: Logger;
  constructor(
    private salesPackagingRepository: Repository<SalesPackaging>,
    private catalogService: CatalogService,
    private storageClient: StorageClient,
    private analyticsClient: AnalyticsClient,
    private auditClient: AuditClient
  ) {
    this.logger = Logger.getInstance();
  }

  // GET /catalog
  async getCatalog(): Promise<CatalogItemDTO[]> {
    try {
      this.logger.info('SalesCoordinator', 'Getting catalog');
      const catalog = await this.catalogService.getCatalog();

      await this.auditClient.logInfo('SALES', `Katalog preuzet - ${catalog.length} stavki`);

      return catalog;
    } catch (error) {
      this.logger.error('SalesCoordinator', 'Error getting catalog');
      await this.auditClient.logError('SALES', `Greška pri preuzimanju kataloga: ${error instanceof Error ? error.message : 'Unknown'}`);
      throw error;
    }
  }

  // GET /packaging
  async getPackaging(): Promise<any[]> {
    try {
      this.logger.info('SalesCoordinator', 'Getting all packagings');
      const packagings = await this.salesPackagingRepository.find();
      
      // Primeni toJSON() na sve ambalaže za sigurnu konverziju perfumeIds
      const packagingsJSON = packagings.map(p => p.toJSON());
      
      this.logger.info('SalesCoordinator', `Found ${packagingsJSON.length} packagings`);
      return packagingsJSON;
    } catch (error) {
      this.logger.error('SalesCoordinator', 'Error getting packagings');
      throw error;
    }
  }

  // POST /purchase
  async purchase(data: PurchaseDTO, userRole: string, userId: string, username: string, authToken?: string): Promise<any> {
    try {
      this.logger.info('SalesCoordinator', `Processing purchase with ${data.items.length} items`);

      // Step 1: Ekstraktuj perfumeIds iz purchase zahtjeva
      const perfumeIds = data.items.map(item => item.perfumeId);
      this.logger.info('SalesCoordinator', `Checking availability for: ${perfumeIds.join(', ')}`);

      // Step 2: Provjeri dostupnost u katalogu
      const catalogItems = await this.catalogService.getItemsByPerfumeIds(perfumeIds);
      this.logger.info('SalesCoordinator', `Found ${catalogItems.length} items in catalog`);

      // Step 3: Primjeni quantity informacije iz purchase zahtjeva na katalog stavke
      const purchaseMap = new Map(data.items.map(item => [item.perfumeId, item.quantity]));
      const itemsWithQuantity = catalogItems.map(item => ({
        ...item,
        quantity: purchaseMap.get(item.perfumeId) || 1
      }));

      // Step 4: Kreiraj fiskalni račun u Analytics
      const totalAmount = itemsWithQuantity.reduce((sum, item) => sum + (item.quantity * parseFloat(String(item.price))), 0);
      
      const receiptData = {
        saleType: data.saleType,
        paymentMethod: data.paymentMethod,
        items: itemsWithQuantity.map(item => ({
          perfumeId: item.perfumeId,
          quantity: item.quantity,
          price: parseFloat(String(item.price))
        })),
        totalAmount: Math.round(totalAmount * 100) / 100,
        userId,
        username
      };

      this.logger.debug('SalesCoordinator', `Receipt data: ${JSON.stringify(receiptData)}`);
      
      const receipt = await this.analyticsClient.createReceipt(receiptData);

      // Step 5: Smanjuje quantity za svaki kupljeni proizvod
      for (const item of data.items) {
        await this.catalogService.reduceQuantity(item.perfumeId, item.quantity);
      }
      this.logger.info('SalesCoordinator', `Reduced quantity for ${data.items.length} items`);

      // Step 6: Log to Audit
      await this.auditClient.logInfo('SALES', `Prodaja kreirana - ${data.items.length} stavki, iznos: ${totalAmount}`, userId);

      this.logger.info('SalesCoordinator', `Purchase completed successfully with receipt ${receipt.id}`);
      return receipt;
    } catch (error) {
      this.logger.error('SalesCoordinator', 'Error processing purchase');
      await this.auditClient.logError('SALES', `Greška pri kreiranju prodaje: ${error instanceof Error ? error.message : 'Unknown'}`, userId);
      throw error;
    }
  }

  // POST /request-packaging
  async requestPackaging(count: number, userRole: string, authToken?: string): Promise<any[]> {
    try {
      this.logger.info('SalesCoordinator', `Requesting ${count} packagings`);

      // Step 1: Call Storage service
      let packagings: any[] = [];
      try {
        packagings = await this.storageClient.sendToSales(count, userRole, authToken);
      } catch (error: any) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        
        // Warning umesto error - to je normalna poslovna situacija
        if (errorMsg.includes('No packagings available') || errorMsg.includes('no packagings')) {
          this.logger.warn('SalesCoordinator', `⚠️  No packagings available from storage for request of ${count}`);
          await this.auditClient.logWarning('SALES', `Nema dostupnih pakovanja u skladištu za zahtev od ${count}`);
          throw new Error('No packagings available from storage');
        } else {
          // Ostale greške su kritične
          this.logger.error('SalesCoordinator', `Storage service error: ${errorMsg}`);
          await this.auditClient.logError('SALES', `Greška skladišnog servisa pri zahtevanju pakovanja: ${errorMsg}`);
          throw error;
        }
      }

      if (!packagings || packagings.length === 0) {
        this.logger.warn('SalesCoordinator', `⚠️  No packagings available from storage`);
        await this.auditClient.logWarning('SALES', `Skladište nema dostupnih pakovanja`);
        throw new Error('No packagings available from storage');
      }

      // Step 2: Create SalesPackaging records
      const savedPackagings = [];
      for (const packaging of packagings) {
        const salesPackaging = this.salesPackagingRepository.create({
          originalPackagingId: packaging.id,
          perfumeIds: packaging.perfumeIds || [],
          perfumes: packaging.perfumes || [], // Čuva sve perfume detalje
          status: SalesPackagingStatus.RECEIVED
        });

        const saved = await this.salesPackagingRepository.save(salesPackaging);
        savedPackagings.push(saved);
      }

      // Step 3: Add perfumes to catalog sa pravim imenima
      for (const packaging of packagings) {
        if (Array.isArray(packaging.perfumes) && packaging.perfumes.length > 0) {
          // Ako postoje detaljni perfume objekti, koristi njihova imena
          for (const perfume of packaging.perfumes) {
            this.catalogService.addItem({
              perfumeId: perfume.id,
              name: perfume.name, // Pravo ime parfema
              type: perfume.type || 'PERFUME',
              netQuantityMl: perfume.netQuantityMl || 150,
              quantity: 1,
              available: true,
              price: 50.00
            }).catch(() => null);
          }
        } else if (packaging.perfumeIds) {
          // Fallback: ako nema detaljnih perfume objekata, koristi IDs
          for (const perfumeId of packaging.perfumeIds) {
            this.catalogService.addItem({
              perfumeId,
              name: `Perfume ${perfumeId.substring(0, 8)}`,
              type: 'PERFUME' as any,
              netQuantityMl: 150,
              quantity: 1,
              available: true,
              price: 50.00
            }).catch(() => null);
          }
        }
      }

      // Step 4: Log to Audit
      await this.auditClient.logInfo('SALES', `Zatraženo ${count} pakovanja - ${savedPackagings.length} primljeno`);

      // Step 5: Return saved packagings with toJSON() applied for safe perfumeIds conversion
      const result = savedPackagings.map(p => p.toJSON());
      
      this.logger.info('SalesCoordinator', `✅ Packaging request completed with ${result.length} packagings`);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('SalesCoordinator', `Error requesting packaging: ${message}`);
      await this.auditClient.logError('SALES', `Greška pri zahtevanju pakovanja: ${message}`);
      throw error;
    }
  }
}