import React, { useState } from 'react';
import { DECISIONS_LIST } from '../data/initialData';
import { Search, ShieldAlert, BookOpen, Layers, CheckCircle2 } from 'lucide-react';

export const DecisionsReference: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterImpact, setFilterImpact] = useState<string>('all');

  const impacts = Array.from(new Set(DECISIONS_LIST.map(d => d.impactArea)));

  const filteredDecisions = DECISIONS_LIST.filter(d => {
    if (filterImpact !== 'all' && d.impactArea !== filterImpact) return false;
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      return (
        d.id.toLowerCase().includes(q) ||
        d.title.toLowerCase().includes(q) ||
        d.summary.toLowerCase().includes(q) ||
        d.ruleEnforcement.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 font-mono text-xs">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-zinc-100">
            Registro de Decisões Arquiteturais e Regras EGC (D1 a D32)
          </span>
        </div>
        <p className="text-zinc-400">
          Conjunto canônico de 32 decisões invioláveis aplicadas cirurgicamente da Fase 13 à Fase 0.
        </p>
      </div>

      {/* Search and filters */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3 font-mono text-xs">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar decisão (ex: D4, C44, travessão, autoria, AST, Zod)..."
              className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-700 rounded text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-zinc-400">Área de Impacto:</span>
            <select
              value={filterImpact}
              onChange={(e) => setFilterImpact(e.target.value)}
              className="bg-zinc-950 border border-zinc-700 text-zinc-200 rounded px-2 py-1 text-xs"
            >
              <option value="all">Todas as Áreas ({DECISIONS_LIST.length})</option>
              {impacts.map(i => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Decisions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-xs">
        {filteredDecisions.map((dec) => (
          <div
            key={dec.id}
            className={`bg-zinc-900 border rounded-lg p-4 flex flex-col justify-between space-y-3 transition hover:border-zinc-700 ${
              dec.id === 'D1' || dec.id === 'D2' || dec.id === 'D3' || dec.id === 'D4' || dec.id === 'D5'
                ? 'border-emerald-800/80 bg-emerald-950/10'
                : 'border-zinc-800'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded">
                  {dec.id}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
                  {dec.impactArea}
                </span>
              </div>

              <h4 className="font-bold text-zinc-100 text-sm">
                {dec.title}
              </h4>

              <p className="text-zinc-400 text-xs leading-relaxed">
                {dec.summary}
              </p>
            </div>

            <div className="pt-2 border-t border-zinc-800/80 space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                Aplicação & Portão:
              </span>
              <p className="text-[11px] text-zinc-300 font-mono">
                {dec.ruleEnforcement}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
