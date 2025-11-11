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
// const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['https://partners.classera.com', 'http://localhost:5173','https://myplatformuniversity.netlify.app/'];

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
const allowedOrigins = (process.env.ALLOWED_ORIGINS?.split(',') || [
  'https://partners.classera.com',
  'http://localhost:5173',
  'https://myplatformuniversity.netlify.app/',
]).map(s => s.trim());

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // non-browser clients
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  // Let cors reflect requested headers automatically; only specify if you must:
  // allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', ...],
  optionsSuccessStatus: 204,
};

// Apply once; handles preflights globally
app.use(cors(corsOptions));
// Optional if you want to be explicit; reuse the SAME options:
app.options('*', cors(corsOptions));

app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
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
