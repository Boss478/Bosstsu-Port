'use client';

import { useState } from 'react';
import { useStockData } from './StockDataContext';
import StockDetailModal from './StockDetailModal';

export default function PortfolioTracker() {
  const { portfolio, stocks, updateHolding, addHolding, removeHolding } = useStockData();
  const [editSymbol, setEditSymbol] = useState<string | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [editShares, setEditShares] = useState(0);
  const [editAvgCost, setEditAvgCost] = useState(0);
  const [editManualPrice, setEditManualPrice] = useState<number | undefined>(undefined);
  const [newSymbol, setNewSymbol] = useState('');
  const [newShares, setNewShares] = useState('');
  const [newAvgCost, setNewAvgCost] = useState('');
  const [removeConfirm, setRemoveConfirm] = useState<string | null>(null);
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);

  const enriched = portfolio.map(h => {
    const current = stocks.find(s => s.symbol === h.symbol);
    const effectivePrice = h.manualPrice ?? current?.price ?? 0;
    const totalCost = h.shares * h.avgCost;
    const totalValue = h.shares * effectivePrice;
    const pl = totalValue - totalCost;
    const plPercent = totalCost > 0 ? (pl / totalCost) * 100 : 0;
    return { ...h, currentPrice: effectivePrice, totalCost, totalValue, pl, plPercent };
  });

  const totalCost = enriched.reduce((s, h) => s + h.totalCost, 0);
  const totalValue = enriched.reduce((s, h) => s + h.totalValue, 0);
  const totalPl = totalValue - totalCost;
  const totalPlPercent = totalCost > 0 ? (totalPl / totalCost) * 100 : 0;

  const startEditing = (h: (typeof enriched)[number]) => {
    setEditSymbol(h.symbol);
    setEditShares(h.shares);
    setEditAvgCost(h.avgCost);
    setEditManualPrice(h.manualPrice);
  };

  const saveEdit = () => {
    if (!editSymbol) return;
    updateHolding(editSymbol, { shares: editShares, avgCost: editAvgCost, manualPrice: editManualPrice });
    setEditSymbol(null);
  };

  const cancelEdit = () => {
    setEditSymbol(null);
  };

  const handleAdd = async () => {
    const s = newSymbol.trim().toUpperCase();
    const shares = parseFloat(newShares);
    const cost = parseFloat(newAvgCost);
    if (!s || isNaN(shares) || shares <= 0 || isNaN(cost) || cost <= 0) {
      setAddError('Please fill in all fields with valid values');
      return;
    }
    setAdding(true);
    setAddError('');
    const ok = await addHolding(s, shares, cost);
    if (ok) {
      setNewSymbol('');
      setNewShares('');
      setNewAvgCost('');
    } else {
      setAddError('Failed to add holding');
    }
    setAdding(false);
  };

  const handleRemove = async (symbol: string) => {
    await removeHolding(symbol);
    setRemoveConfirm(null);
  };

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-xl border border-white/60 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm shadow-sm">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Total Value</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Total Cost</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">P&L</p>
            <p className={`text-2xl font-bold flex items-center gap-1 ${
              totalPl >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'
            }`}>
              <i className={`fi ${totalPl >= 0 ? 'fi-sr-caret-up' : 'fi-sr-caret-down'}`} />
              ${Math.abs(totalPl).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              <span className="text-sm font-medium">
                ({totalPlPercent >= 0 ? '+' : ''}{totalPlPercent.toFixed(2)}%)
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-white/60 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm shadow-sm">
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 block">Symbol</label>
            <input
              type="text"
              value={newSymbol}
              onChange={e => setNewSymbol(e.target.value.toUpperCase())}
              placeholder="e.g. AAPL"
              maxLength={10}
              className="w-24 px-2 py-1.5 rounded border border-zinc-300 dark:border-slate-600 bg-white/60 dark:bg-slate-800/60 text-zinc-900 dark:text-zinc-100 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 block">Shares</label>
            <input
              type="text"
              inputMode="decimal"
              value={newShares}
              onChange={e => setNewShares(e.target.value)}
              placeholder="0.00"
              className="w-28 px-2 py-1.5 rounded border border-zinc-300 dark:border-slate-600 bg-white/60 dark:bg-slate-800/60 text-zinc-900 dark:text-zinc-100 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 block">Avg Cost</label>
            <input
              type="text"
              inputMode="decimal"
              value={newAvgCost}
              onChange={e => setNewAvgCost(e.target.value)}
              placeholder="$0.00"
              className="w-28 px-2 py-1.5 rounded border border-zinc-300 dark:border-slate-600 bg-white/60 dark:bg-slate-800/60 text-zinc-900 dark:text-zinc-100 text-sm"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={adding}
            className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <i className="fi fi-sr-add mr-1.5" />
            Add
          </button>
          {addError && <p className="text-xs text-red-500">{addError}</p>}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/60 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200/60 dark:border-slate-700/50 text-left">
              <th className="py-3 px-4 font-semibold text-zinc-500 dark:text-zinc-400">Symbol</th>
              <th className="py-3 px-4 font-semibold text-zinc-500 dark:text-zinc-400 text-right">Shares</th>
              <th className="py-3 px-4 font-semibold text-zinc-500 dark:text-zinc-400 text-right">Avg Cost</th>
              <th className="py-3 px-4 font-semibold text-zinc-500 dark:text-zinc-400 text-right">Current Price</th>
              <th className="py-3 px-4 font-semibold text-zinc-500 dark:text-zinc-400 text-right">Value</th>
              <th className="py-3 px-4 font-semibold text-zinc-500 dark:text-zinc-400 text-right">P&L</th>
              <th className="py-3 px-4 font-semibold text-zinc-500 dark:text-zinc-400 text-right hidden sm:table-cell">Allocation</th>
              <th className="py-3 px-4 w-10" />
            </tr>
          </thead>
          <tbody>
            {enriched.map(h => {
              const allocation = totalValue > 0 ? (h.totalValue / totalValue) * 100 : 0;
              const isEditing = editSymbol === h.symbol;
              const hasManualPrice = h.manualPrice !== undefined;

              return (
                <tr
                  key={h.symbol}
                  onClick={() => !isEditing && setSelectedSymbol(h.symbol)}
                  className="border-b last:border-0 border-zinc-100/60 dark:border-slate-700/30 hover:bg-blue-50/40 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
                >
                  <td className="py-3 px-4 font-bold text-zinc-900 dark:text-zinc-100">{h.symbol}</td>
                  <td className="py-3 px-4 text-right text-zinc-700 dark:text-zinc-300">
                    {isEditing ? (
                      <input
                        type="text"
                        inputMode="decimal"
                        value={editShares}
                        onChange={e => setEditShares(Number(e.target.value))}
                        onClick={e => e.stopPropagation()}
                        className="w-20 text-right px-2 py-1 rounded border border-zinc-300 dark:border-slate-600 bg-white/60 dark:bg-slate-800/60 text-zinc-900 dark:text-zinc-100"
                      />
                    ) : (
                      h.shares
                    )}
                  </td>
                  <td className="py-3 px-4 text-right text-zinc-700 dark:text-zinc-300">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editAvgCost}
                        onChange={e => setEditAvgCost(Number(e.target.value))}
                        onClick={e => e.stopPropagation()}
                        step="0.01"
                        className="w-24 text-right px-2 py-1 rounded border border-zinc-300 dark:border-slate-600 bg-white/60 dark:bg-slate-800/60 text-zinc-900 dark:text-zinc-100"
                      />
                    ) : (
                      `$${h.avgCost.toFixed(2)}`
                    )}
                  </td>
                  <td className="py-3 px-4 text-right text-zinc-700 dark:text-zinc-300">
                    {isEditing ? (
                      <span className="inline-flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                        <input
                          type="number"
                          value={editManualPrice ?? ''}
                          onChange={e => setEditManualPrice(e.target.value ? Number(e.target.value) : undefined)}
                          step="0.01"
                          className="w-24 text-right px-2 py-1 rounded border border-zinc-300 dark:border-slate-600 bg-white/60 dark:bg-slate-800/60 text-zinc-900 dark:text-zinc-100"
                        />
                        {editManualPrice !== undefined && <span className="text-blue-500 text-xs" title="manual">•</span>}
                      </span>
                    ) : (
                      <span>
                        ${h.currentPrice.toFixed(2)}
                        {hasManualPrice && <span className="text-blue-500 text-xs ml-0.5" title="manual">•</span>}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-zinc-900 dark:text-zinc-100">
                    ${h.totalValue.toFixed(2)}
                  </td>
                  <td className={`py-3 px-4 text-right font-medium ${
                    h.pl >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    ${h.pl >= 0 ? '+' : ''}{h.pl.toFixed(2)}
                    <br />
                    <span className="text-xs">({h.plPercent >= 0 ? '+' : ''}{h.plPercent.toFixed(2)}%)</span>
                  </td>
                  <td className="py-3 px-4 text-right hidden sm:table-cell">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">{allocation.toFixed(1)}%</span>
                      <div className="w-16 h-1.5 rounded-full bg-zinc-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{ width: `${allocation}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={saveEdit}
                          className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer"
                          title="Save"
                        >
                          <i className="fi fi-sr-disk" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer"
                          title="Cancel"
                        >
                          <i className="fi fi-sr-cross" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEditing(h)}
                          className="p-1 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <i className="fi fi-sr-pencil" />
                        </button>
                        {removeConfirm === h.symbol ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleRemove(h.symbol)}
                              className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 cursor-pointer"
                              title="Confirm remove"
                            >
                              <i className="fi fi-sr-check" />
                            </button>
                            <button
                              onClick={() => setRemoveConfirm(null)}
                              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer"
                              title="Cancel"
                            >
                              <i className="fi fi-sr-cross" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setRemoveConfirm(h.symbol)}
                            className="p-1 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                            title="Remove"
                          >
                            <i className="fi fi-sr-trash" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedSymbol && (
        <StockDetailModal symbol={selectedSymbol} onClose={() => setSelectedSymbol(null)} />
      )}
    </div>
  );
}
