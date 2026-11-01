import { Hono } from 'hono';
import type { AuthType } from '../lib/auth';
import { AuthError, AuthErrorType } from '../services/error/authError';
import authRouter from './auth';
import { healthHandler } from './handlers/indexHandlers';
import commentRouter from './comment';
import postRouter from './post';

const apiRouter = new Hono();

/**
 * @openapi
 * /api/health/api:
 *   get:
 *     summary: Health check
 *     description: Responds if the app is up and running
 *     responses:
 *       200:
 *         description: App is up and running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 */
apiRouter.get('/health/api', healthHandler);

apiRouter.route('/auth', authRouter);
apiRouter.route('/posts', postRouter);
apiRouter.route('/comments', commentRouter);

export default apiRouter;
