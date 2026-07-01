import { create } from 'zustand';

export const RADIUS_OPTIONS_KM = [2, 5, 10, 20] as const;

interface SettingsState {
  searchRadiusKm: number;
  setSearchRadiusKm: (km: number) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  searchRadiusKm: 5,
  setSearchRadiusKm: (km) => set({ searchRadiusKm: km }),
}));
