import {
  Repository,
  FindOptionsWhere,
  FindManyOptions,
  DeepPartial,
  QueryRunner,
} from 'typeorm';
import { AppDataSource } from '../config/database';
import { BaseEntity } from '../entities/BaseEntity';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../config/logger';
import { getContext } from '../middleware/context.middleware';

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Base service class with automatic transaction management and rollback
 */
export class BaseService<T extends BaseEntity> {
  protected repository: Repository<T>;

  constructor(private entityClass: new () => T) {
    this.repository = AppDataSource.getRepository(entityClass);
  }

  /**
   * Execute operation within a transaction with automatic rollback on error
   */
  protected async withTransaction<R>(
    operation: (queryRunner: QueryRunner) => Promise<R>
  ): Promise<R> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await operation(queryRunner);
      await queryRunner.commitTransaction();
      logger.info('Transaction committed successfully');
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      logger.error('Transaction rolled back due to error', { error });
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Set audit fields based on current user context
   */
  protected setAuditFields(entity: T, isUpdate: boolean = false): void {
    const context = getContext();

    if (!isUpdate) {
      entity.createdBy = context?.userId;
    }
    entity.updatedBy = context?.userId;
  }

  /**
   * Find all entities with pagination
   */
  async findAll(options?: PaginationOptions): Promise<PaginatedResult<T>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const findOptions: FindManyOptions<T> = {
      skip,
      take: limit,
      where: { deletedAt: null } as any,
    };

    if (options?.sortBy) {
      findOptions.order = {
        [options.sortBy]: options.sortOrder || 'ASC',
      } as any;
    }

    const [data, total] = await this.repository.findAndCount(findOptions);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find entity by ID
   */
  async findById(id: string): Promise<T> {
    const entity = await this.repository.findOne({
      where: { id, deletedAt: null } as any,
    });

    if (!entity) {
      throw new AppError(`${this.entityClass.name} not found`, 404);
    }

    return entity;
  }

  /**
   * Find entities by criteria
   */
  async findBy(where: FindOptionsWhere<T>): Promise<T[]> {
    return this.repository.find({
      where: { ...where, deletedAt: null } as any,
    });
  }

  /**
   * Create new entity with transaction
   */
  async create(data: DeepPartial<T>): Promise<T> {
    return this.withTransaction(async (queryRunner) => {
      const entity = this.repository.create(data);
      this.setAuditFields(entity);

      const saved = await queryRunner.manager.save(entity);
      logger.info(`${this.entityClass.name} created`, { id: saved.id });
      return saved;
    });
  }

  /**
   * Create multiple entities with transaction
   */
  async createMany(dataArray: DeepPartial<T>[]): Promise<T[]> {
    return this.withTransaction(async (queryRunner) => {
      const entities = dataArray.map((data) => {
        const entity = this.repository.create(data);
        this.setAuditFields(entity);
        return entity;
      });

      const saved = await queryRunner.manager.save(entities);
      logger.info(`${dataArray.length} ${this.entityClass.name}(s) created`);
      return saved;
    });
  }

  /**
   * Update entity with transaction
   */
  async update(id: string, data: DeepPartial<T>): Promise<T> {
    return this.withTransaction(async (queryRunner) => {
      const entity = await this.findById(id);

      Object.assign(entity, data);
      this.setAuditFields(entity, true);

      const saved = await queryRunner.manager.save(entity);
      logger.info(`${this.entityClass.name} updated`, { id: saved.id });
      return saved;
    });
  }

  /**
   * Soft delete entity with transaction
   */
  async delete(id: string): Promise<void> {
    return this.withTransaction(async (queryRunner) => {
      const entity = await this.findById(id);

      entity.deletedAt = new Date();
      entity.deletedBy = getContext()?.userId;

      await queryRunner.manager.save(entity);
      logger.info(`${this.entityClass.name} soft deleted`, { id });
    });
  }

  /**
   * Hard delete entity (permanent) with transaction
   */
  async hardDelete(id: string): Promise<void> {
    return this.withTransaction(async (queryRunner) => {
      const entity = await this.findById(id);
      await queryRunner.manager.remove(entity);
      logger.info(`${this.entityClass.name} hard deleted`, { id });
    });
  }

  /**
   * Restore soft-deleted entity with transaction
   */
  async restore(id: string): Promise<T> {
    return this.withTransaction(async (queryRunner) => {
      const entity = await this.repository.findOne({
        where: { id } as any,
      });

      if (!entity) {
        throw new AppError(`${this.entityClass.name} not found`, 404);
      }

      if (!entity.deletedAt) {
        throw new AppError(`${this.entityClass.name} is not deleted`, 400);
      }

      entity.deletedAt = undefined;
      entity.deletedBy = undefined;

      const saved = await queryRunner.manager.save(entity);
      logger.info(`${this.entityClass.name} restored`, { id });
      return saved;
    });
  }

  /**
   * Count entities
   */
  async count(where?: FindOptionsWhere<T>): Promise<number> {
    return this.repository.count({
      where: { ...where, deletedAt: null } as any,
    });
  }

  /**
   * Check if entity exists
   */
  async exists(where: FindOptionsWhere<T>): Promise<boolean> {
    const count = await this.repository.count({
      where: { ...where, deletedAt: null } as any,
    });
    return count > 0;
  }
}
