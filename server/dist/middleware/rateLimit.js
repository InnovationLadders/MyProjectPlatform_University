import rateLimit from 'express-rate-limit';
export const rateLimitMiddleware = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.warn('[Rate Limit] Exceeded', {
            ip: req.ip,
            url: req.url,
            timestamp: new Date().toISOString()
        });
        res.status(429).json({
            error: {
                message: 'Too many requests from this IP, please try again later.'
            }
        });
    }
});
