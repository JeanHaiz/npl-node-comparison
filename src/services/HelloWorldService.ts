import { BaseService } from './BaseService';
import { HelloWorld } from '../entities/HelloWorld';
import { FindOptionsWhere } from 'typeorm';
import { AppError } from '../middleware/error.middleware';

export class HelloWorldService extends BaseService<HelloWorld> {
  constructor() {
    super(HelloWorld);
  }

  /**
   * Create a new HelloWorld instance for a specific user
   */
  async createForUser(username: string, ownerId: string): Promise<HelloWorld> {
    const helloWorld = new HelloWorld();
    helloWorld.username = username;
    helloWorld.ownerId = ownerId;
    helloWorld.hasBeenGreeted = false;
    helloWorld.createdBy = ownerId;

    return await this.create(helloWorld);
  }

  /**
   * Find HelloWorld instances owned by a specific user
   */
  async findByOwnerId(ownerId: string): Promise<HelloWorld[]> {
    return this.findBy({ ownerId } as FindOptionsWhere<HelloWorld>);
  }

  /**
   * Execute the sayHello operation - can only be called once per instance
   */
  async sayHello(id: string, userId: string): Promise<{ message: string; helloWorld: HelloWorld }> {
    const helloWorld = await this.findById(id);

    // Check ownership
    if (helloWorld.ownerId !== userId) {
      throw new AppError('Access denied: You can only access your own HelloWorld instances', 403);
    }

    // Check if already greeted
    if (helloWorld.hasBeenGreeted) {
      throw new AppError('HelloWorld has already been used. Each HelloWorld can only say hello once.', 400);
    }

    // Update the HelloWorld to mark as greeted
    helloWorld.hasBeenGreeted = true;
    helloWorld.greetedAt = new Date();
    helloWorld.updatedBy = userId;

    const updatedHelloWorld = await this.repository.save(helloWorld);
    const message = `Hello ${helloWorld.username}!`;

    return { message, helloWorld: updatedHelloWorld };
  }

  /**
   * Override findById to include ownership check
   */
  async findByIdForUser(id: string, userId: string): Promise<HelloWorld> {
    const helloWorld = await this.findById(id);

    if (helloWorld.ownerId !== userId) {
      throw new AppError('Access denied: You can only access your own HelloWorld instances', 403);
    }

    return helloWorld;
  }
}
