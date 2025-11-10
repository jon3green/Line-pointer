/**
 * Line Movement Tracker - Line Pointer
 */

import { useState, useEffect } from 'react';
import { lineMovementService } from '../services/lineMovement.service';
import type { LineMovement, LineAlert } from '../services/lineMovement.service';
import { Link } from 'react-router-dom';

export function LineMovementPage() {
  const [movements, setMovements] = useState<LineMovement[]>([]);
  const [alerts, setAlerts] = useState<LineAlert[]>([]);
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
    setAlerts(lineMovementService.getAlerts(true));
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

    const min = Math.min(...data, opening, current);
    const max = Math.max(...data, opening, current);
    const range = max - min || 1;

    return (
      <div className="relative h-32 bg-dark-surface rounded-2xl p-4 border border-dark-border">
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
            stroke={change > 0 ? '#10B981' : change < 0 ? '#EF4444' : '#3461FF'}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1="0"
            y1={100 - ((opening - min) / range) * 100}
            x2="100"
            y2={100 - ((opening - min) / range) * 100}
            stroke="#4B5563"
            strokeWidth="1"
            strokeDasharray="4,4"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div className="absolute top-2 left-2 text-xs text-text-muted">
          Opening: {opening}
        </div>
        <div className="absolute top-2 right-2 text-xs font-semibold" style={{
          color: change > 0 ? '#10B981' : change < 0 ? '#EF4444' : '#9CA3AF'
        }}>
          Current: {current} ({change > 0 ? '+' : ''}{change.toFixed(1)})
        </div>
        <div className="absolute bottom-2 left-2 text-xs text-text-dim">
          {type === 'spread' ? movement.movements.spreadMoves : movement.movements.totalMoves} moves
        </div>
      </div>
    );
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-text-primary mb-2">Line Movement Tracker</h1>
            <p className="text-text-secondary text-lg">Track betting line changes and sharp money indicators</p>
          </div>
          {alerts.length > 0 && (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent-red/20 border border-accent-red/40 rounded-full animate-pulse">
                <span className="w-2 h-2 bg-accent-red rounded-full"></span>
                <span className="text-accent-red font-bold">{alerts.length} New Alerts</span>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <span className="text-3xl">🚨</span>
              Recent Alerts
            </h2>
            <button
              onClick={handleExportCSV}
              className="btn-secondary"
            >
              Export CSV
            </button>
          </div>
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className={`stat-card ${
                  alert.alertType === 'steam_move' ? 'border-accent-red' :
                  alert.alertType === 'rlm' ? 'border-accent-orange' :
                  'border-brand-blue'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`badge ${
                        alert.alertType === 'steam_move' ? 'badge-danger' :
                        alert.alertType === 'rlm' ? 'badge-warning' :
                        'badge-info'
                      }`}>
                        {alert.alertType === 'steam_move' ? '⚡ STEAM' :
                         alert.alertType === 'rlm' ? '🔄 RLM' :
                         '📈 SHARP'}
                      </span>
                      <span className="text-xs text-text-muted">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-text-primary mb-1">{alert.message}</div>
                    <div className="text-xs text-text-secondary">
                      Change: {alert.oldValue} → {alert.newValue} ({alert.change > 0 ? '+' : ''}{alert.change.toFixed(1)})
                    </div>
                  </div>
                  <button
                    onClick={() => handleMarkAlertRead(alert.id)}
                    className="text-xs text-text-muted hover:text-text-primary ml-4 font-medium"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="pill-container inline-flex">
        <button
          onClick={() => setFilter('all')}
          className={`pill-item ${filter === 'all' ? 'pill-item-active' : 'pill-item-inactive'}`}
        >
          All Games ({lineMovementService.getAllMovements().length})
        </button>
        <button
          onClick={() => setFilter('sharp')}
          className={`pill-item ${filter === 'sharp' ? 'pill-item-active' : 'pill-item-inactive'}`}
        >
          Sharp Indicators ({lineMovementService.getSharpGames().length})
        </button>
        <button
          onClick={() => setFilter('significant')}
          className={`pill-item ${filter === 'significant' ? 'pill-item-active' : 'pill-item-inactive'}`}
        >
          1+ Point Moves ({lineMovementService.getGamesWithSignificantMovement(1).length})
        </button>
      </div>

      {/* Games List */}
      {movements.length === 0 ? (
        <div className="card text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-dark-surface border border-dark-border rounded-full mb-6">
            <svg className="w-10 h-10 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <p className="text-text-secondary mb-2 text-lg">No line movements tracked yet</p>
          <p className="text-text-muted text-sm mb-6">
            Line movements will be recorded automatically as odds change
          </p>
          <Link to="/" className="btn-primary inline-block">
            View Live Games
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {movements.map((movement) => (
            <div key={movement.gameId} className="card">
              {/* Game Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className="badge badge-info">
                      {movement.sport}
                    </span>
                    <span className="text-xs text-text-muted">
                      {new Date(movement.gameTime).toLocaleString()}
                    </span>
                    {movement.sharpIndicators.steamMove && (
                      <span className="badge badge-danger">
                        ⚡ STEAM
                      </span>
                    )}
                    {movement.sharpIndicators.reverseLineMovement && (
                      <span className="badge badge-warning">
                        🔄 RLM
                      </span>
                    )}
                  </div>

                  <h3 className="text-2xl font-bold text-text-primary mb-2">
                    {movement.awayTeam} @ {movement.homeTeam}
                  </h3>

                  {movement.publicBetting && (
                    <div className="text-sm text-text-secondary">
                      Public: {movement.publicBetting.homePercentage}% on {movement.homeTeam} | {' '}
                      {movement.publicBetting.awayPercentage}% on {movement.awayTeam}
                    </div>
                  )}
                </div>

                <div className="stat-card text-center py-3 px-4">
                  <div className="text-text-muted text-xs mb-1">SNAPSHOTS</div>
                  <div className="text-3xl font-bold gradient-text">{movement.snapshots.length}</div>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div>
                  <h4 className="text-sm font-semibold mb-3 text-text-muted">Spread Movement</h4>
                  {renderLineChart(movement, 'spread')}
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-3 text-text-muted">Total Movement</h4>
                  {renderLineChart(movement, 'total')}
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="stat-card py-3">
                  <div className="text-text-muted text-xs mb-1">OPENING SPREAD</div>
                  <div className="text-lg font-bold text-text-primary">{movement.openingLine.spread}</div>
                </div>
                <div className="stat-card py-3">
                  <div className="text-text-muted text-xs mb-1">CURRENT SPREAD</div>
                  <div className="text-lg font-bold" style={{
                    color: movement.movements.spreadMovement > 0 ? '#10B981' :
                           movement.movements.spreadMovement < 0 ? '#EF4444' : '#E5E7EB'
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
                <div className="stat-card py-3">
                  <div className="text-text-muted text-xs mb-1">OPENING TOTAL</div>
                  <div className="text-lg font-bold text-text-primary">{movement.openingLine.total}</div>
                </div>
                <div className="stat-card py-3">
                  <div className="text-text-muted text-xs mb-1">CURRENT TOTAL</div>
                  <div className="text-lg font-bold" style={{
                    color: movement.movements.totalMovement > 0 ? '#10B981' :
                           movement.movements.totalMovement < 0 ? '#EF4444' : '#E5E7EB'
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

              {/* Detailed Snapshots */}
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-text-secondary hover:text-text-primary font-medium">
                  View all {movement.snapshots.length} snapshots →
                </summary>
                <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                  {movement.snapshots.map((snapshot, index) => (
                    <div key={index} className="text-xs bg-dark-surface rounded-xl p-3 flex justify-between items-center border border-dark-border">
                      <span className="text-text-muted">
                        {new Date(snapshot.timestamp).toLocaleString()}
                      </span>
                      <span className="text-text-secondary">
                        Spread: {snapshot.spread} | Total: {snapshot.total} | ML: {snapshot.moneylineHome}/{snapshot.moneylineAway}
                      </span>
                      <span className="text-text-dim">{snapshot.bookmaker}</span>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="card bg-gradient-to-br from-brand-blue/10 to-brand-purple/10 border-brand-blue/30">
        <h3 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-2">
          <span className="text-3xl">📊</span>
          How to Use Line Movement Data
        </h3>
        <div className="space-y-3 text-sm text-text-secondary">
          <p><strong className="text-accent-red">⚡ Steam Moves:</strong> Rapid line movements (1+ points in under 5 minutes) often indicate sharp money.</p>
          <p><strong className="text-accent-orange">🔄 Reverse Line Movement (RLM):</strong> When the line moves opposite to where the majority of public bets are placed - a classic sharp indicator.</p>
          <p><strong className="text-brand-blue-light">📈 Significant Moves:</strong> Any 1+ point movement in the spread or total is worth investigating.</p>
          <p><strong className="text-accent-green-light">💡 Pro Tip:</strong> Look for RLM combined with steam moves - this is often where the sharps are betting heavily.</p>
        </div>
      </div>
    </div>
  );
}
