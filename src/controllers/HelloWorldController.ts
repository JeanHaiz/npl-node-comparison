import { Router, Request, Response } from 'express';
import { HelloWorldService } from '../services/HelloWorldService';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from 'class-validator';
import { HelloWorld } from '../entities/HelloWorld';
import { AppError } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const router = Router();
const helloWorldService = new HelloWorldService();

/**
 * @swagger
 * /api/hello-worlds:
 *   get:
 *     summary: Get user's HelloWorld instances
 *     tags: [HelloWorlds]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's HelloWorld instances
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/HelloWorld'
 */
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const helloWorlds = await helloWorldService.findByOwnerId(userId);
  res.json(helloWorlds);
});

/**
 * @swagger
 * /api/hello-worlds/{id}:
 *   get:
 *     summary: Get HelloWorld by ID
 *     tags: [HelloWorlds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: HelloWorld details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HelloWorld'
 *       404:
 *         description: HelloWorld not found
 *       403:
 *         description: Access denied
 */
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const helloWorld = await helloWorldService.findByIdForUser(req.params.id, userId);
  res.json(helloWorld);
});

/**
 * @swagger
 * /api/hello-worlds/{id}/say-hello:
 *   post:
 *     summary: Execute sayHello operation (single-use)
 *     tags: [HelloWorlds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Hello message returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Hello username!"
 *                 helloWorld:
 *                   $ref: '#/components/schemas/HelloWorld'
 *       400:
 *         description: HelloWorld has already been used
 *       403:
 *         description: Access denied
 *       404:
 *         description: HelloWorld not found
 */
router.post('/:id/say-hello', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const result = await helloWorldService.sayHello(req.params.id, userId);
  res.json(result);
});


/**
 * @swagger
 * /api/hello-worlds:
 *   post:
 *     summary: Create new HelloWorld instance
 *     tags: [HelloWorlds]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *             properties:
 *               username:
 *                 type: string
 *                 description: Username for personalized greeting
 *     responses:
 *       201:
 *         description: HelloWorld created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HelloWorld'
 */
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { username } = req.body;

  if (!username) {
    throw new AppError('Username is required', 400);
  }

  const helloWorld = await helloWorldService.createForUser(username, userId);
  res.status(201).json(helloWorld);
});


/**
 * @swagger
 * /api/hello-worlds/{id}:
 *   delete:
 *     summary: Delete HelloWorld instance (soft delete)
 *     tags: [HelloWorlds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: HelloWorld deleted successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: HelloWorld not found
 */
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  // First check ownership
  await helloWorldService.findByIdForUser(req.params.id, userId);
  // Then delete
  await helloWorldService.delete(req.params.id);
  res.status(204).send();
});


export default router;
