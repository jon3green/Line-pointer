import { useState, useEffect } from 'react';
import { lineMovementService } from '../services/lineMovement.service';
import type { LineMovement, LineAlert } from '../services/lineMovement.service';
import { Link } from 'react-router-dom';

export function LineMovementPage() {
  const [movements, setMovements] = useState<LineMovement[]>([]);
  const [alerts, setAlerts] = useState<LineAlert[]>([]);
  const [selectedGame, setSelectedGame] = useState<LineMovement | null>(null);
  const [chartType, _setChartType] = useState<'spread' | 'total' | 'moneyline'>('spread');
  const [filter, setFilter] = useState<'all' | 'sharp' | 'significant'>('all');

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = () => {
    let allMovements;

    switch (filter) {
      case 'sharp':
        allMovements = lineMovementService.getSharpGames();
        break;
      case 'significant':
        allMovements = lineMovementService.getGamesWithSignificantMovement(1);
        break;
      default:
        allMovements = lineMovementService.getAllMovements();
    }

    setMovements(allMovements);
    setAlerts(lineMovementService.getAlerts(true)); // Unread only
  };

  const handleMarkAlertRead = (alertId: string) => {
    lineMovementService.markAlertRead(alertId);
    loadData();
  };

  const handleExportCSV = () => {
    const csv = lineMovementService.exportToCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `line_movements_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const renderLineChart = (movement: LineMovement, type: 'spread' | 'total') => {
    const data = type === 'spread'
      ? movement.snapshots.map(s => s.spread)
      : movement.snapshots.map(s => s.total);

    const opening = type === 'spread' ? movement.openingLine.spread : movement.openingLine.total;
    const current = type === 'spread' ? movement.currentLine.spread : movement.currentLine.total;
    const change = current - opening;

    // Calculate min and max for scaling
    const min = Math.min(...data, opening, current);
    const max = Math.max(...data, opening, current);
    const range = max - min || 1;

    return (
      <div className="relative h-32 bg-black/20 rounded-lg p-4">
        {/* Chart Line */}
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline
            points={data
              .map((value, index) => {
                const x = (index / (data.length - 1 || 1)) * 100;
                const y = 100 - ((value - min) / range) * 100;
                return `${x},${y}`;
              })
              .join(' ')}
            fill="none"
            stroke={change > 0 ? '#10b981' : change < 0 ? '#ef4444' : '#6b7280'}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />

          {/* Opening line (dashed) */}
          <line
            x1="0"
            y1={100 - ((opening - min) / range) * 100}
            x2="100"
            y2={100 - ((opening - min) / range) * 100}
            stroke="#6b7280"
            strokeWidth="1"
            strokeDasharray="4,4"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* Labels */}
        <div className="absolute top-2 left-2 text-xs text-gray-400">
          Opening: {opening}
        </div>
        <div className="absolute top-2 right-2 text-xs font-medium" style={{
          color: change > 0 ? '#10b981' : change < 0 ? '#ef4444' : '#6b7280'
        }}>
          Current: {current} ({change > 0 ? '+' : ''}{change.toFixed(1)})
        </div>

        {/* Movement count */}
        <div className="absolute bottom-2 left-2 text-xs text-gray-500">
          {type === 'spread' ? movement.movements.spreadMoves : movement.movements.totalMoves} moves
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="text-blue-400 hover:text-blue-300">
                ← Back
              </Link>
              <h1 className="text-2xl font-bold">Line Movement Tracker</h1>
              {alerts.length > 0 && (
                <span className="px-2 py-1 bg-red-600 text-white text-xs font-medium rounded-full">
                  {alerts.length} new alerts
                </span>
              )}
            </div>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors"
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div className="mb-8 space-y-2">
            <h2 className="text-lg font-bold mb-3">🚨 Recent Alerts</h2>
            {alerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className={`bg-white/5 backdrop-blur-sm border rounded-lg p-4 ${
                  alert.alertType === 'steam_move' ? 'border-red-500/50' :
                  alert.alertType === 'rlm' ? 'border-yellow-500/50' :
                  'border-white/10'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        alert.alertType === 'steam_move' ? 'bg-red-600' :
                        alert.alertType === 'rlm' ? 'bg-yellow-600' :
                        'bg-blue-600'
                      }`}>
                        {alert.alertType === 'steam_move' ? '⚡ STEAM' :
                         alert.alertType === 'rlm' ? '🔄 RLM' :
                         '📈 SHARP'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-sm font-medium">{alert.message}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      Change: {alert.oldValue} → {alert.newValue} ({alert.change > 0 ? '+' : ''}{alert.change.toFixed(1)})
                    </div>
                  </div>
                  <button
                    onClick={() => handleMarkAlertRead(alert.id)}
                    className="text-xs text-gray-400 hover:text-white ml-4"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            All Games ({lineMovementService.getAllMovements().length})
          </button>
          <button
            onClick={() => setFilter('sharp')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'sharp'
                ? 'bg-yellow-600 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            Sharp Indicators ({lineMovementService.getSharpGames().length})
          </button>
          <button
            onClick={() => setFilter('significant')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'significant'
                ? 'bg-purple-600 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            1+ Point Moves ({lineMovementService.getGamesWithSignificantMovement(1).length})
          </button>
        </div>

        {/* Games List */}
        {movements.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-12 text-center">
            <div className="text-gray-400 mb-4">
              No line movements tracked yet. Line movements will be recorded automatically as odds change.
            </div>
            <div className="text-sm text-gray-500">
              Visit the <Link to="/" className="text-blue-400 hover:text-blue-300">Games page</Link> to start tracking odds.
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {movements.map((movement) => (
              <div
                key={movement.gameId}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6"
              >
                {/* Game Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs font-medium rounded">
                        {movement.sport}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(movement.gameTime).toLocaleString()}
                      </span>
                      {movement.sharpIndicators.steamMove && (
                        <span className="px-2 py-1 bg-red-600 text-white text-xs font-medium rounded">
                          ⚡ STEAM
                        </span>
                      )}
                      {movement.sharpIndicators.reverseLineMovement && (
                        <span className="px-2 py-1 bg-yellow-600 text-white text-xs font-medium rounded">
                          🔄 RLM
                        </span>
                      )}
                    </div>

                    <div className="text-xl font-bold mb-1">
                      {movement.awayTeam} @ {movement.homeTeam}
                    </div>

                    {movement.publicBetting && (
                      <div className="text-sm text-gray-400">
                        Public: {movement.publicBetting.homePercentage}% on {movement.homeTeam} | {' '}
                        {movement.publicBetting.awayPercentage}% on {movement.awayTeam}
                      </div>
                    )}
                  </div>

                  <div className="text-right text-sm">
                    <div className="text-gray-400">Snapshots</div>
                    <div className="text-2xl font-bold">{movement.snapshots.length}</div>
                  </div>
                </div>

                {/* Charts Grid */}
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Spread Chart */}
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-gray-400">Spread Movement</h4>
                    {renderLineChart(movement, 'spread')}
                  </div>

                  {/* Total Chart */}
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-gray-400">Total Movement</h4>
                    {renderLineChart(movement, 'total')}
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-black/20 rounded p-3">
                    <div className="text-xs text-gray-400">Opening Spread</div>
                    <div className="text-lg font-bold">{movement.openingLine.spread}</div>
                  </div>
                  <div className="bg-black/20 rounded p-3">
                    <div className="text-xs text-gray-400">Current Spread</div>
                    <div className="text-lg font-bold" style={{
                      color: movement.movements.spreadMovement > 0 ? '#10b981' :
                             movement.movements.spreadMovement < 0 ? '#ef4444' : '#ffffff'
                    }}>
                      {movement.currentLine.spread}
                      {movement.movements.spreadMovement !== 0 && (
                        <span className="text-sm ml-1">
                          ({movement.movements.spreadMovement > 0 ? '+' : ''}
                          {movement.movements.spreadMovement.toFixed(1)})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="bg-black/20 rounded p-3">
                    <div className="text-xs text-gray-400">Opening Total</div>
                    <div className="text-lg font-bold">{movement.openingLine.total}</div>
                  </div>
                  <div className="bg-black/20 rounded p-3">
                    <div className="text-xs text-gray-400">Current Total</div>
                    <div className="text-lg font-bold" style={{
                      color: movement.movements.totalMovement > 0 ? '#10b981' :
                             movement.movements.totalMovement < 0 ? '#ef4444' : '#ffffff'
                    }}>
                      {movement.currentLine.total}
                      {movement.movements.totalMovement !== 0 && (
                        <span className="text-sm ml-1">
                          ({movement.movements.totalMovement > 0 ? '+' : ''}
                          {movement.movements.totalMovement.toFixed(1)})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Detailed Snapshots (Expandable) */}
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-gray-400 hover:text-white">
                    View all {movement.snapshots.length} snapshots
                  </summary>
                  <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                    {movement.snapshots.map((snapshot, index) => (
                      <div key={index} className="text-xs bg-black/20 rounded p-2 flex justify-between">
                        <span className="text-gray-400">
                          {new Date(snapshot.timestamp).toLocaleString()}
                        </span>
                        <span>
                          Spread: {snapshot.spread} | Total: {snapshot.total} | ML: {snapshot.moneylineHome}/{snapshot.moneylineAway}
                        </span>
                        <span className="text-gray-500">{snapshot.bookmaker}</span>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-blue-900/20 border border-blue-700/30 rounded-lg p-6">
          <h3 className="text-lg font-bold mb-3">📊 How to Use Line Movement Data</h3>
          <div className="space-y-2 text-sm text-gray-300">
            <p><strong>⚡ Steam Moves:</strong> Rapid line movements (1+ points in under 5 minutes) often indicate sharp money.</p>
            <p><strong>🔄 Reverse Line Movement (RLM):</strong> When the line moves opposite to where the majority of public bets are placed - a classic sharp indicator.</p>
            <p><strong>📈 Significant Moves:</strong> Any 1+ point movement in the spread or total is worth investigating.</p>
            <p><strong>💡 Pro Tip:</strong> Look for RLM combined with steam moves - this is often where the sharps are betting heavily.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
