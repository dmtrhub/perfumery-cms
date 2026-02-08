import { Repository } from "typeorm";
import { IAuditService } from "../Domain/services/IAuditService";
import { AuditLog } from "../Domain/models/AuditLog";
import { CreateAuditLogDTO } from "../Domain/DTOs/CreateAuditLogDTO";
import { FilterAuditLogsDTO } from "../Domain/DTOs/FilterAuditLogsDTO";
import { Logger } from "../Infrastructure/Logger";
import { ResourceNotFoundException } from "../Domain/exceptions/ResourceNotFoundException";

/**
 * AuditRepositoryService
 * 
 * Implementacija poslovne logike za rad sa audit logovima
 */
export class AuditService implements IAuditService {
  private readonly logger: Logger;

  constructor(private readonly auditRepository: Repository<AuditLog>) {
    this.logger = Logger.getInstance();
  }

  /**
   * Kreiraj novi audit log
   */
  async createAuditLog(dto: CreateAuditLogDTO): Promise<AuditLog> {
    try {
      this.logger.debug(
        "AuditRepositoryService",
        `Creating audit log for service: ${dto.serviceName}`
      );

      const auditLog = this.auditRepository.create({
        type: dto.type,
        serviceName: dto.serviceName,
        description: dto.description,
        userId: dto.userId,
        ipAddress: dto.ipAddress
      });

      const saved = await this.auditRepository.save(auditLog);

      this.logger.info(
        "AuditRepositoryService",
        `✅ Audit log created: ${saved.id}`
      );

      return saved;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("AuditRepositoryService", `❌ Failed to create audit log: ${message}`);
      throw error;
    }
  }

  /**
   * Dohvati audit log po ID-u
   */
  async getAuditLogById(id: string): Promise<AuditLog> {
    try {
      this.logger.debug("AuditRepositoryService", `Fetching audit log: ${id}`);

      const auditLog = await this.auditRepository.findOne({ where: { id } });

      if (!auditLog) {
        throw new ResourceNotFoundException(`Audit log with ID ${id} not found`);
      }

      this.logger.info(
        "AuditRepositoryService",
        `✅ Fetched audit log: ${auditLog.id}`
      );

      return auditLog;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("AuditRepositoryService", `❌ Failed to fetch audit log: ${message}`);
      throw error;
    }
  }

  /**
   * Dohvati sve audit logove sa filterima
   */
  async getAllAuditLogs(filters?: FilterAuditLogsDTO): Promise<AuditLog[]> {
    try {
      this.logger.info(
        "AuditService",
        `getAllAuditLogs called - type: '${filters?.type || 'NONE'}', serviceName: '${filters?.serviceName || 'NONE'}'`
      );

      let query = this.auditRepository.createQueryBuilder("audit");

      if (filters?.type) {
        query = query.where("audit.type = :type", { type: filters.type });
      }

      if (filters?.serviceName) {
        if (filters?.type) {
          query = query.andWhere("audit.serviceName = :serviceName", { serviceName: filters.serviceName });
        } else {
          query = query.where("audit.serviceName = :serviceName", { serviceName: filters.serviceName });
        }
      }

      query = query.orderBy("audit.timestamp", "DESC");

      const auditLogs = await query.getMany();

      this.logger.info(
        "AuditService",
        `✅ Fetched ${auditLogs.length} audit logs`
      );

      return auditLogs;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("AuditRepositoryService", `❌ Failed to fetch audit logs: ${message}`);
      throw error;
    }
  }

  /**
   * Obriši audit log
   */
  async deleteAuditLog(id: string): Promise<void> {
    try {
      this.logger.debug("AuditRepositoryService", `Deleting audit log: ${id}`);

      const auditLog = await this.getAuditLogById(id);

      await this.auditRepository.remove(auditLog);

      this.logger.info(
        "AuditRepositoryService",
        `✅ Audit log deleted: ${id}`
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("AuditRepositoryService", `❌ Failed to delete audit log: ${message}`);
      throw error;
    }
  }
}