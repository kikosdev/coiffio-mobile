import { useCallback, useState } from 'react';
import * as Location from 'expo-location';

export type LocationStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'error';

export interface Coords {
  lat: number;
  lng: number;
}

export function useUserLocation() {
  const [status, setStatus] = useState<LocationStatus>('idle');
  const [coords, setCoords] = useState<Coords | null>(null);

  const request = useCallback(async () => {
    setStatus('requesting');
    const { status: perm } = await Location.requestForegroundPermissionsAsync();
    if (perm !== 'granted') {
      setStatus('denied');
      return;
    }
    try {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setStatus('granted');
    } catch {
      setStatus('error');
    }
  }, []);

  return { status, coords, request };
}
