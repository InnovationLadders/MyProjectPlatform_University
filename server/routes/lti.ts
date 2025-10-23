import express from 'express';
import { handleLogin, handleLaunch } from '../controllers/ltiController.js';
import { handleJWKS } from '../controllers/jwksController.js';
import { submitGrade } from '../controllers/gradeController.js';
import { rateLimitMiddleware } from '../middleware/rateLimit.js';

const router = express.Router();

router.post('/login', rateLimitMiddleware, handleLogin);
router.get('/login', rateLimitMiddleware, handleLogin);
router.post('/launch', handleLaunch);
router.post('/grades', submitGrade);
router.get('/.well-known/jwks.json', handleJWKS);

export default router;
