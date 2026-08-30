import { useState, useEffect, useCallback } from 'react';
import { healthService } from '../services/healthService';

export function useApiHealth() {
  const [healthData, setHealthData] = useState(null);
  const [dbData, setDbData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [latencyMs, setLatencyMs] = useState(null);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    const start = performance.now();

    try {
      const [healthRes, dbRes] = await Promise.all([
        healthService.getHealth(),
        healthService.getDatabaseHealth()
      ]);

      const duration = Math.round(performance.now() - start);
      setLatencyMs(duration);

      if (healthRes.ok || healthRes.success) {
        setHealthData(healthRes.data || healthRes);
      } else {
        setError(healthRes.message || 'API is not responding');
      }

      setDbData(dbRes);
    } catch (err) {
      setError(err.message || 'Failed to reach backend API');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return {
    healthData,
    dbData,
    loading,
    error,
    latencyMs,
    refresh: checkHealth
  };
}
