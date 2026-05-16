import { Router, Request, Response } from 'express';
import { fetchWeather, WeatherServiceError } from '../services/weatherService';

const router = Router();

router.get('/:city', async (req: Request, res: Response): Promise<void> => {
  const { city } = req.params;
  const { lat, lon } = req.query;

  try {
    const data = await fetchWeather(
      city, 
      lat ? parseFloat(lat as string) : undefined, 
      lon ? parseFloat(lon as string) : undefined
    );
    res.json({ success: true, data });
  } catch (error: any) {
    if (error instanceof WeatherServiceError) {
      res.status(error.status).json({ success: false, error: error.message });
    } else {
      res.status(500).json({ success: false, error: 'An unexpected error occurred' });
    }
  }
});

export default router;
