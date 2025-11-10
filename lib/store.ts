import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ParlayLeg, Game } from './types';

type SelectableLeague = 'NFL' | 'NCAAF' | 'TABLE_TENNIS' | 'ALL';

interface StoreState {
  selectedLeague: SelectableLeague;
  setSelectedLeague: (league: SelectableLeague) => void;
  
  parlayLegs: ParlayLeg[];
  addParlayLeg: (leg: ParlayLeg) => void;
  removeParlayLeg: (gameId: string) => void;
  clearParlay: () => void;
  
  favorites: string[];
  toggleFavorite: (gameId: string) => void;
  
  stake: number;
  setStake: (stake: number) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      selectedLeague: 'ALL',
      setSelectedLeague: (league) => set({ selectedLeague: league }),
      
      parlayLegs: [],
      addParlayLeg: (leg) => set((state) => {
        const exists = state.parlayLegs.find(l => l.gameId === leg.gameId);
        if (exists) {
          return {
            parlayLegs: state.parlayLegs.map(l => 
              l.gameId === leg.gameId ? leg : l
            )
          };
        }
        return { parlayLegs: [...state.parlayLegs, leg] };
      }),
      removeParlayLeg: (gameId) => set((state) => ({
        parlayLegs: state.parlayLegs.filter(leg => leg.gameId !== gameId)
      })),
      clearParlay: () => set({ parlayLegs: [] }),
      
      favorites: [],
      toggleFavorite: (gameId) => set((state) => ({
        favorites: state.favorites.includes(gameId)
          ? state.favorites.filter(id => id !== gameId)
          : [...state.favorites, gameId]
      })),
      
      stake: 100,
      setStake: (stake) => set({ stake }),
    }),
    {
      name: 'line-pointer-storage',
    }
  )
);

