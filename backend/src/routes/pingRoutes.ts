import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
    console.log('pingged at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    res.status(200).json({ message: 'pong' });
});

export default router;
