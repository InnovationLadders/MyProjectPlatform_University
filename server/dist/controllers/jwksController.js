import { generateJWKS } from '../utils/jwt.js';
export async function handleJWKS(req, res, next) {
    try {
        const jwks = await generateJWKS();
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.json(jwks);
    }
    catch (error) {
        next(error);
    }
}
