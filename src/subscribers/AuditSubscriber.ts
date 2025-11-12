import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
  SoftRemoveEvent,
} from 'typeorm';
import { AuditLog } from '../entities/AuditLog';
import { BaseEntity } from '../entities/BaseEntity';
import { logger } from '../config/logger';

@EventSubscriber()
export class AuditSubscriber implements EntitySubscriberInterface {
  /**
   * Called after entity insertion.
   */
  async afterInsert(event: InsertEvent<any>) {
    await this.logAudit(event, 'CREATE');
  }

  /**
   * Called after entity update.
   */
  async afterUpdate(event: UpdateEvent<any>) {
    await this.logAudit(event, 'UPDATE');
  }

  /**
   * Called after entity removal.
   */
  async afterRemove(event: RemoveEvent<any>) {
    await this.logAudit(event, 'DELETE');
  }

  /**
   * Called after entity soft removal.
   */
  async afterSoftRemove(event: SoftRemoveEvent<any>) {
    await this.logAudit(event, 'DELETE');
  }

  private async logAudit(
    event: InsertEvent<any> | UpdateEvent<any> | RemoveEvent<any> | SoftRemoveEvent<any>,
    action: 'CREATE' | 'UPDATE' | 'DELETE'
  ) {
    try {
      // Skip audit log entities themselves to prevent infinite loops
      if (event.entity instanceof AuditLog) {
        return;
      }

      const entityName = event.metadata.name;
      const entityId = event.entity?.id || 'unknown';

      // Get user context from entity if it extends BaseEntity
      let userId: string | undefined;
      let userEmail: string | undefined;

      if (event.entity instanceof BaseEntity) {
        userId = event.entity.createdBy || event.entity.updatedBy;
      }

      // Get old and new values
      let oldValues: Record<string, any> | undefined;
      let newValues: Record<string, any> | undefined;
      let changes: Record<string, any> | undefined;

      if (action === 'UPDATE' && 'databaseEntity' in event) {
        oldValues = event.databaseEntity;
        newValues = event.entity;
        changes = this.getChanges(oldValues, newValues);
      } else if (action === 'CREATE') {
        newValues = event.entity;
      } else if (action === 'DELETE') {
        oldValues = event.entity || ('databaseEntity' in event ? event.databaseEntity : undefined);
      }

      // Create audit log
      const auditLog = new AuditLog();
      auditLog.entityName = entityName;
      auditLog.entityId = entityId;
      auditLog.action = action;
      auditLog.userId = userId;
      auditLog.userEmail = userEmail;
      auditLog.oldValues = oldValues;
      auditLog.newValues = newValues;
      auditLog.changes = changes;

      // Save audit log in a separate transaction to avoid affecting main transaction
      await event.manager.save(AuditLog, auditLog);

      logger.info(`Audit log created: ${action} ${entityName}:${entityId}`, {
        action,
        entityName,
        entityId,
        userId,
      });
    } catch (error) {
      logger.error('Failed to create audit log', { error });
    }
  }

  private getChanges(oldValues: any, newValues: any): Record<string, any> {
    const changes: Record<string, any> = {};

    if (!oldValues || !newValues) {
      return changes;
    }

    for (const key in newValues) {
      if (oldValues[key] !== newValues[key]) {
        changes[key] = {
          old: oldValues[key],
          new: newValues[key],
        };
      }
    }

    return changes;
  }
}
