import { BaseService } from './BaseService';
import { Task, TaskStatus } from '../entities/Task';
import { FindOptionsWhere } from 'typeorm';

export class TaskService extends BaseService<Task> {
  constructor() {
    super(Task);
  }

  /**
   * Find tasks by status
   */
  async findByStatus(status: TaskStatus): Promise<Task[]> {
    return this.findBy({ status } as FindOptionsWhere<Task>);
  }

  /**
   * Find overdue tasks
   */
  async findOverdue(): Promise<Task[]> {
    const now = new Date();
    return this.repository
      .createQueryBuilder('task')
      .where('task.dueDate < :now', { now })
      .andWhere('task.status != :done', { done: TaskStatus.DONE })
      .andWhere('task.deletedAt IS NULL')
      .getMany();
  }

  /**
   * Update task status with validation
   */
  async updateStatus(id: string, status: TaskStatus): Promise<Task> {
    return this.update(id, { status } as any);
  }
}
