'use client';

import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface SearchFilterProps {
  onSearchChange: (search: string) => void;
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  minConfidence: number;
  betTypes: string[];
  status: string[];
  teams: string[];
}

export default function SearchFilter({ onSearchChange, onFilterChange }: SearchFilterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    minConfidence: 0,
    betTypes: [],
    status: [],
    teams: [],
  });

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onSearchChange(value);
  };

  const toggleFilter = (category: keyof FilterState, value: string | number) => {
    const newFilters = { ...filters };
    if (category === 'minConfidence') {
      newFilters.minConfidence = value as number;
    } else {
      const arr = newFilters[category] as string[];
      if (arr.includes(value as string)) {
        newFilters[category] = arr.filter(item => item !== value) as any;
      } else {
        newFilters[category] = [...arr, value as string] as any;
      }
    }
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters = {
      minConfidence: 0,
      betTypes: [],
      status: [],
      teams: [],
    };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
    setSearchTerm('');
    onSearchChange('');
  };

  const activeFilterCount = 
    (filters.minConfidence > 0 ? 1 : 0) +
    filters.betTypes.length +
    filters.status.length +
    filters.teams.length;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search teams, games..."
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {searchTerm && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <Button
          variant={showFilters ? 'default' : 'outline'}
          onClick={() => setShowFilters(!showFilters)}
          className={`relative ${showFilters ? 'gradient-green' : ''}`}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <Badge className="ml-2 bg-green-500 text-white px-2 py-0.5 text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="glass-morphism p-4 rounded-lg space-y-4 animate-in slide-in-from-top">
          {/* Confidence Filter */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">
              Minimum Confidence: {filters.minConfidence}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={filters.minConfidence}
              onChange={(e) => toggleFilter('minConfidence', Number(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-green-500"
            />
          </div>

          {/* Bet Type Filter */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Bet Types</label>
            <div className="flex flex-wrap gap-2">
              {['Spread', 'Moneyline', 'Total'].map((type) => (
                <button
                  key={type}
                  onClick={() => toggleFilter('betTypes', type)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    filters.betTypes.includes(type)
                      ? 'bg-green-500 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Game Status Filter */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Game Status</label>
            <div className="flex flex-wrap gap-2">
              {['Scheduled', 'Live', 'Completed'].map((status) => (
                <button
                  key={status}
                  onClick={() => toggleFilter('status', status.toLowerCase())}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    filters.status.includes(status.toLowerCase())
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          {activeFilterCount > 0 && (
            <Button
              variant="outline"
              onClick={clearFilters}
              className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10"
            >
              Clear All Filters ({activeFilterCount})
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

