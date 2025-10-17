import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { initializeFirebase } from './services/firebase.js';
import { initializeKeys } from './utils/jwt.js';
import { errorHandler } from './middleware/errorHandler.js';
import ltiRoutes from './routes/lti.js';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;
app.use(helmet());
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://partners.classera.com', 'http://localhost:5173'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
async function startServer() {
    try {
        initializeFirebase();
        await initializeKeys();
        app.get('/health', (req, res) => {
            res.json({ status: 'ok', timestamp: new Date().toISOString() });
        });
        app.use('/api/lti', ltiRoutes);
        app.use(errorHandler);
        app.listen(PORT, () => {
            console.log(`LTI Backend server running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
startServer();
