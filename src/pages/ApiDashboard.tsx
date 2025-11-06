import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
    const interval = setInterval(loadStats, 5000);
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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link to="/" className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors group mb-3">
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-medium">Back to Home</span>
        </Link>
        <h1 className="text-4xl font-bold text-text-primary mb-2">API Dashboard</h1>
        <p className="text-text-secondary text-lg">Monitor and manage all API integrations</p>
      </div>

      {/* API Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {apiStatus && Object.entries(apiStatus).map(([name, status]: [string, any]) => (
          <div key={name} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-text-muted text-sm font-semibold">{name.toUpperCase()}</span>
              <span className={`w-3 h-3 rounded-full ${
                status.status === 'operational' ? 'bg-accent-green animate-pulse shadow-glow-green' : 'bg-accent-red'
              }`} />
            </div>
            <div className="text-3xl font-bold text-text-primary mb-1">{status.latency}ms</div>
            <div className="text-text-dim text-xs">{status.status}</div>
          </div>
        ))}
      </div>

      {/* API Configuration Status */}
      <div className="card">
        <h2 className="text-2xl font-bold text-text-primary mb-6">API Configuration Status</h2>
        <div className="space-y-3">
          {[
            { name: 'The Odds API', key: API_CONFIG.theOddsApi.apiKey, url: 'https://the-odds-api.com/', status: 'Free tier: 500 req/month' },
            { name: 'MySportsFeeds', key: API_CONFIG.mySportsFeeds.apiKey, url: 'https://www.mysportsfeeds.com/', status: 'Free for personal use' },
            { name: 'SportsDataIO', key: API_CONFIG.sportsDataIO.apiKey, url: 'https://sportsdata.io/', status: 'Paid: $25+/month' },
            { name: 'OpenWeather', key: API_CONFIG.openWeather.apiKey, url: 'https://openweathermap.org/', status: 'Free tier: 60/min' },
            { name: 'OpenAI', key: API_CONFIG.openai.apiKey, url: 'https://platform.openai.com/', status: 'Pay-as-you-go' }
          ].map((api) => (
            <div key={api.name} className="flex items-center justify-between p-4 bg-dark-surface rounded-2xl border border-dark-border hover:border-brand-blue/30 transition-all">
              <div className="flex-1">
                <div className="text-text-primary font-bold">{api.name}</div>
                <div className="text-text-muted text-sm">{api.status}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`badge ${
                  hasApiKey(api.key) ? 'badge-success' : 'badge-warning'
                }`}>
                  {hasApiKey(api.key) ? '✓ Configured' : 'Not Configured'}
                </span>
                <a
                  href={api.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-blue-light hover:text-brand-blue text-sm font-medium"
                >
                  Get Key →
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-brand-blue/10 border border-brand-blue/30 rounded-2xl p-6">
          <h3 className="text-brand-blue-light font-bold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            Quick Start
          </h3>
          <ol className="text-text-secondary space-y-2 list-decimal list-inside">
            <li>Copy <code className="bg-dark-surface px-2 py-1 rounded text-brand-blue-light">.env.example</code> to <code className="bg-dark-surface px-2 py-1 rounded text-brand-blue-light">.env.local</code></li>
            <li>Get free API keys from The Odds API and OpenWeather</li>
            <li>Add your keys to <code className="bg-dark-surface px-2 py-1 rounded text-brand-blue-light">.env.local</code></li>
            <li>Restart the development server</li>
          </ol>
        </div>
      </div>

      {/* API Testing */}
      <div className="card">
        <h2 className="text-2xl font-bold text-text-primary mb-6">API Testing</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'oddsApi', name: 'Test Odds API', description: 'Fetch live NFL odds' },
            { key: 'weatherApi', name: 'Test Weather API', description: 'Get stadium weather' },
            { key: 'statsApi', name: 'Test Stats API', description: 'Fetch player stats' },
            { key: 'predictionApi', name: 'Test AI Predictions', description: 'Generate game predictions' }
          ].map((test) => (
            <div key={test.key} className="stat-card hover:border-brand-blue/30 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-text-primary font-bold">{test.name}</div>
                  <div className="text-text-muted text-sm">{test.description}</div>
                </div>
                <button
                  onClick={() => testApi(test.key)}
                  disabled={loading === test.key}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading === test.key ? 'Testing...' : 'Test'}
                </button>
              </div>
              {testResults[test.key] && (
                <div className={`p-3 rounded-2xl text-sm ${
                  testResults[test.key].success
                    ? 'bg-accent-green/20 text-accent-green-light border border-accent-green/40'
                    : 'bg-accent-red/20 text-accent-red border border-accent-red/40'
                }`}>
                  {testResults[test.key].success ? '✓ Success' : `✗ ${testResults[test.key].error?.message || 'Failed'}`}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Cache & Rate Limits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-text-primary">Cache Statistics</h2>
            <button
              onClick={clearCache}
              className="px-4 py-2 bg-accent-red hover:brightness-90 text-white font-semibold rounded-full transition-all"
            >
              Clear Cache
            </button>
          </div>
          {cacheStats && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-text-muted font-semibold">ENTRIES</span>
                <span className="text-text-primary font-bold text-xl">{cacheStats.size} / {cacheStats.maxSize}</span>
              </div>
              <div className="bg-dark-surface rounded-full h-3 overflow-hidden border border-dark-border">
                <div
                  className="bg-gradient-brand h-full transition-all duration-1000"
                  style={{ width: `${(cacheStats.size / cacheStats.maxSize) * 100}%` }}
                />
              </div>
              <div className="text-text-muted text-sm">
                Cache hit rate improves performance and reduces API costs
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-text-primary">Rate Limits</h2>
            <button
              onClick={resetRateLimits}
              className="px-4 py-2 bg-accent-orange hover:brightness-90 text-white font-semibold rounded-full transition-all"
            >
              Reset All
            </button>
          </div>
          {rateLimits && Object.keys(rateLimits).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(rateLimits).map(([api, stats]: [string, any]) => (
                <div key={api} className="stat-card py-3">
                  <div className="flex justify-between mb-2">
                    <span className="text-text-muted text-sm font-semibold">{api.toUpperCase()}</span>
                    <span className={`badge text-xs ${stats.blocked ? 'badge-danger' : 'badge-success'}`}>
                      {stats.blocked ? 'Blocked' : 'Active'}
                    </span>
                  </div>
                  <div className="text-text-primary font-bold text-lg">{stats.requests} / {stats.limit}</div>
                  {stats.blocked && (
                    <div className="text-accent-orange text-xs mt-1">
                      Resets in {Math.ceil(stats.timeToReset / 1000)}s
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-text-muted">No rate limit data yet</div>
          )}
        </div>
      </div>

      {/* Documentation */}
      <div className="card bg-gradient-to-br from-brand-purple/10 to-brand-blue/10 border-brand-purple/30">
        <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-2">
          <svg className="w-6 h-6 text-brand-purple-light" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
          </svg>
          API Documentation
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'The Odds API', desc: 'Real-time odds documentation', url: 'https://the-odds-api.com/liveapi/guides/v4/' },
            { name: 'MySportsFeeds', desc: 'Stats & injuries API docs', url: 'https://www.mysportsfeeds.com/data-feeds/api-docs/' },
            { name: 'OpenWeather', desc: 'Weather API documentation', url: 'https://openweathermap.org/api' }
          ].map((doc) => (
            <a
              key={doc.name}
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="stat-card hover:border-brand-blue/50 transition-all group"
            >
              <div className="text-text-primary font-bold mb-2 group-hover:gradient-text transition-all">{doc.name}</div>
              <div className="text-text-muted text-sm">{doc.desc}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
