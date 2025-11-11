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

// Normalize origins (trim + remove trailing slash)
const defaultOrigins = [
  'https://partners.classera.com',
  'http://localhost:5173',
  'https://myplatformuniversity.netlify.app'
];

const allowedOrigins = (process.env.ALLOWED_ORIGINS?.split(',') || defaultOrigins)
  .map(s => s.trim().replace(/\/$/, ''));

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // non-browser clients and same-origin GET/HEAD cases
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  // omit allowedHeaders to auto-reflect Access-Control-Request-Headers
  optionsSuccessStatus: 204,
};

// Apply once; handles preflights globally
app.use(cors(corsOptions));
// Optional; if kept, MUST use the same options
app.options('*', cors(corsOptions));

// One Helmet registration is enough
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
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}
startServer();
