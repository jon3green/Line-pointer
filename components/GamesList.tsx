'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchGames } from '@/lib/api/sports-data';
import { useStore } from '@/lib/store';
import GameCardEnhanced from './GameCardEnhanced';
import SearchFilter, { FilterState } from './SearchFilter';
import { motion } from 'framer-motion';

export default function GamesList() {
  const { selectedLeague } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    minConfidence: 0,
    betTypes: [],
    status: [],
    teams: [],
  });

  // Map selectedLeague to Sport type
  const leagueParam = useMemo(() => {
    if (selectedLeague === 'ALL') return undefined;
    if (selectedLeague === 'NFL' || selectedLeague === 'NCAAF' || selectedLeague === 'TABLE_TENNIS') return selectedLeague;
    return undefined;
  }, [selectedLeague]);

  const { data: games, isLoading, error } = useQuery({
    queryKey: ['games', selectedLeague],
    queryFn: () => fetchGames(leagueParam),
  });

  // Filter games based on search and filters
  const filteredGames = useMemo(() => {
    if (!games) return [];

    return games.filter((game) => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesSearch = 
          game.homeTeam.name.toLowerCase().includes(search) ||
          game.awayTeam.name.toLowerCase().includes(search) ||
          game.homeTeam.abbreviation.toLowerCase().includes(search) ||
          game.awayTeam.abbreviation.toLowerCase().includes(search);
        
        if (!matchesSearch) return false;
      }

      // Confidence filter
      if (filters.minConfidence > 0 && game.prediction) {
        if (game.prediction.confidence < filters.minConfidence) return false;
      }

      // Status filter
      if (filters.status.length > 0) {
        if (!filters.status.includes(game.status)) return false;
      }

      return true;
    });
  }, [games, searchTerm, filters]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="glass-morphism rounded-xl p-6 animate-pulse h-48"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-morphism rounded-xl p-8 text-center">
        <p className="text-red-500">Error loading games. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">
          {selectedLeague === 'ALL' ? 'All Games' : selectedLeague === 'TABLE_TENNIS' ? 'Ping Pong' : selectedLeague} Predictions
        </h2>
        <span className="text-sm text-gray-400">
          {filteredGames.length} of {games?.length || 0} games
        </span>
      </div>

      {/* Search and Filter */}
      <SearchFilter 
        onSearchChange={setSearchTerm}
        onFilterChange={setFilters}
      />

      {/* Games List */}
      <div className="space-y-4">
        {filteredGames.length === 0 ? (
          <div className="glass-morphism rounded-xl p-12 text-center">
            <p className="text-gray-400 text-lg mb-2">No games found</p>
            <p className="text-sm text-gray-500">Try adjusting your filters</p>
          </div>
        ) : (
          filteredGames.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <GameCardEnhanced game={game} />
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

