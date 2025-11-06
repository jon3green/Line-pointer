import { useState, useEffect } from 'react';
import { apiService } from '../services/api.service';
import { cacheService } from '../services/cache.service';
import { rateLimiterService } from '../services/rateLimiter.service';
import { API_CONFIG } from '../config/api.config';

export function ApiDashboard() {
  const [apiStatus, setApiStatus] = useState<any>(null);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [rateLimits, setRateLimits] = useState<any>(null);
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    const status = await apiService.getApiStatus();
    setApiStatus(status);
    setCacheStats(cacheService.getStats());
    setRateLimits(rateLimiterService.getStats());
  };

  const testApi = async (apiName: string) => {
    setLoading(apiName);
    try {
      let result;
      switch (apiName) {
        case 'oddsApi':
          result = await apiService.getAllGames('NFL');
          break;
        default:
          result = { success: false, error: 'Test not implemented' };
      }
      setTestResults(prev => ({ ...prev, [apiName]: result }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [apiName]: { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }));
    } finally {
      setLoading(null);
    }
  };

  const clearCache = () => {
    cacheService.clear();
    setCacheStats(cacheService.getStats());
  };

  const resetRateLimits = () => {
    rateLimiterService.resetAll();
    setRateLimits(rateLimiterService.getStats());
  };

  const hasApiKey = (key: string) => {
    return key && key !== '' && key !== 'demo_key' && !key.includes('your_');
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">API Dashboard</h1>
        <p className="text-gray-400">Monitor and manage all API integrations</p>
      </div>

      {/* API Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {apiStatus && Object.entries(apiStatus).map(([name, status]: [string, any]) => (
          <div key={name} className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">{name}</span>
              <span className={`w-3 h-3 rounded-full ${
                status.status === 'operational' ? 'bg-green-500' : 'bg-red-500'
              }`} />
            </div>
            <div className="text-2xl font-bold text-white">{status.latency}ms</div>
            <div className="text-gray-500 text-xs mt-1">{status.status}</div>
          </div>
        ))}
      </div>

      {/* API Configuration Status */}
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">API Configuration Status</h2>
        <div className="space-y-3">
          {[
            { name: 'The Odds API', key: API_CONFIG.theOddsApi.apiKey, url: 'https://the-odds-api.com/', status: 'Free tier: 500 req/month' },
            { name: 'MySportsFeeds', key: API_CONFIG.mySportsFeeds.apiKey, url: 'https://www.mysportsfeeds.com/', status: 'Free for personal use' },
            { name: 'SportsDataIO', key: API_CONFIG.sportsDataIO.apiKey, url: 'https://sportsdata.io/', status: 'Paid: $25+/month' },
            { name: 'OpenWeather', key: API_CONFIG.openWeather.apiKey, url: 'https://openweathermap.org/', status: 'Free tier: 60/min' },
            { name: 'OpenAI', key: API_CONFIG.openai.apiKey, url: 'https://platform.openai.com/', status: 'Pay-as-you-go' }
          ].map((api) => (
            <div key={api.name} className="flex items-center justify-between bg-gray-800 rounded p-3">
              <div className="flex-1">
                <div className="text-white font-semibold">{api.name}</div>
                <div className="text-gray-400 text-xs">{api.status}</div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded text-xs font-bold ${
                  hasApiKey(api.key) ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'
                }`}>
                  {hasApiKey(api.key) ? 'Configured' : 'Not Configured'}
                </span>
                <a
                  href={api.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  Get Key →
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-blue-900/20 border border-blue-800/30 rounded-lg p-4">
          <h3 className="text-blue-400 font-semibold mb-2 text-sm">🚀 Quick Start</h3>
          <ol className="text-gray-300 text-sm space-y-1 list-decimal list-inside">
            <li>Copy <code className="bg-gray-800 px-2 py-0.5 rounded">.env.example</code> to <code className="bg-gray-800 px-2 py-0.5 rounded">.env.local</code></li>
            <li>Get free API keys from The Odds API and OpenWeather</li>
            <li>Add your keys to <code className="bg-gray-800 px-2 py-0.5 rounded">.env.local</code></li>
            <li>Restart the development server</li>
          </ol>
        </div>
      </div>

      {/* API Testing */}
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">API Testing</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'oddsApi', name: 'Test Odds API', description: 'Fetch live NFL odds' },
            { key: 'weatherApi', name: 'Test Weather API', description: 'Get stadium weather' },
            { key: 'statsApi', name: 'Test Stats API', description: 'Fetch player stats' },
            { key: 'predictionApi', name: 'Test AI Predictions', description: 'Generate game predictions' }
          ].map((test) => (
            <div key={test.key} className="bg-gray-800 rounded p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-white font-semibold">{test.name}</div>
                  <div className="text-gray-400 text-xs">{test.description}</div>
                </div>
                <button
                  onClick={() => testApi(test.key)}
                  disabled={loading === test.key}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white text-sm font-semibold rounded-lg"
                >
                  {loading === test.key ? 'Testing...' : 'Test'}
                </button>
              </div>
              {testResults[test.key] && (
                <div className={`mt-3 p-3 rounded text-xs ${
                  testResults[test.key].success ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                }`}>
                  {testResults[test.key].success ? '✓ Success' : `✗ ${testResults[test.key].error?.message || 'Failed'}`}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Cache Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Cache Statistics</h2>
            <button
              onClick={clearCache}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded"
            >
              Clear Cache
            </button>
          </div>
          {cacheStats && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Entries</span>
                <span className="text-white font-semibold">{cacheStats.size} / {cacheStats.maxSize}</span>
              </div>
              <div className="bg-gray-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-2"
                  style={{ width: `${(cacheStats.size / cacheStats.maxSize) * 100}%` }}
                />
              </div>
              <div className="text-gray-500 text-xs">
                Cache hit rate improves performance and reduces API costs
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Rate Limits</h2>
            <button
              onClick={resetRateLimits}
              className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-semibold rounded"
            >
              Reset All
            </button>
          </div>
          {rateLimits && Object.keys(rateLimits).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(rateLimits).map(([api, stats]: [string, any]) => (
                <div key={api} className="bg-gray-800 rounded p-3">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400 text-sm">{api}</span>
                    <span className={`text-xs font-bold ${stats.blocked ? 'text-red-500' : 'text-green-500'}`}>
                      {stats.blocked ? 'Blocked' : 'Active'}
                    </span>
                  </div>
                  <div className="text-white font-semibold">{stats.requests} / {stats.limit}</div>
                  {stats.blocked && (
                    <div className="text-yellow-400 text-xs mt-1">
                      Resets in {Math.ceil(stats.timeToReset / 1000)}s
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-sm">No rate limit data yet</div>
          )}
        </div>
      </div>

      {/* Documentation */}
      <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 rounded-lg p-6 border border-purple-800/30">
        <h2 className="text-lg font-semibold text-white mb-4">📚 API Documentation</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="https://the-odds-api.com/liveapi/guides/v4/"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-900/50 rounded p-4 hover:bg-gray-900/70 transition-colors"
          >
            <div className="text-white font-semibold mb-1">The Odds API</div>
            <div className="text-gray-400 text-xs">Real-time odds documentation</div>
          </a>
          <a
            href="https://www.mysportsfeeds.com/data-feeds/api-docs/"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-900/50 rounded p-4 hover:bg-gray-900/70 transition-colors"
          >
            <div className="text-white font-semibold mb-1">MySportsFeeds</div>
            <div className="text-gray-400 text-xs">Stats & injuries API docs</div>
          </a>
          <a
            href="https://openweathermap.org/api"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-900/50 rounded p-4 hover:bg-gray-900/70 transition-colors"
          >
            <div className="text-white font-semibold mb-1">OpenWeather</div>
            <div className="text-gray-400 text-xs">Weather API documentation</div>
          </a>
        </div>
      </div>
    </div>
  );
}
