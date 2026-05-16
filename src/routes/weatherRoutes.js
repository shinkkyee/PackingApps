import { Router } from 'express';
import { fetchWeather, WeatherServiceError } from '../services/weatherService';
const router = Router();
router.get('/:city', async (req, res) => {
    const { city } = req.params;
    if (!city) {
        res.status(400).json({ success: false, error: 'City is required' });
        return;
    }
    try {
        const data = await fetchWeather(city);
        res.json({ success: true, data });
    }
    catch (error) {
        if (error instanceof WeatherServiceError) {
            res.status(error.status).json({ success: false, error: error.message });
        }
        else {
            res.status(500).json({ success: false, error: 'An unexpected error occurred' });
        }
    }
});
export default router;
