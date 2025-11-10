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
app.use(helmet({ crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,}));
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['https://partners.classera.com', 'http://localhost:5173',];

// app.use(cors({
//     origin: function(origin, callback) {
//         if (!origin) return callback(null, true); // allow non-browser requests
//         if (allowedOrigins.includes(origin)) {
//             callback(null, true);
//         } else {
//             callback(new Error('Not allowed by CORS'));
//         }
//     },
//     credentials: true
// }));
app.use(cors({
    origin: function(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.options('*', cors()); // Handles preflight

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
