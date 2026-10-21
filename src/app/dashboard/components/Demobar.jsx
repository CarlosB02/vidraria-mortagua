'use client';

import React from 'react';
import { useDashboard } from '../context/DashboardContext';
import { Icon } from '../data/icons';

export default function Demobar() {
  const { view, setViewState, setPageState, setObraId, setCli, obras, movs } = useDashboard();

  const handleSelectView = (v) => {
    if (view === v) return;
    if ((view === 'admin') !== (v === 'admin')) {
      setPageState('inicio');
      setObraId(null);
    }
    setViewState(v);
    if (v === 'cliente') {
      const em = movs.find(
        m => m.estado === 'em_viagem' && obras.find(o => o.id === m.obraId)?.empresa === 'Construções Alves Pinto'
      );
      setCli(c => ({
        ...c,
        obraId: em ? em.obraId : 'o1',
        done: null,
      }));
    }
    window.scrollTo(0, 0);
  };

  // Ocultado temporariamente para deploy na Vercel (alterar para true para reativar)
  const SHOW_ADMIN = false;

  const allViews = [
    ['escritorio', 'monitor', 'Escritório'],
    ['motorista', 'truck', 'Motorista'],
    ['cliente', 'user', 'Cliente'],
    ['admin', 'shield', 'Admin'],
  ];

  const views = SHOW_ADMIN ? allViews : allViews.filter(([k]) => k !== 'admin');

  return (
    <div className="demobar">
      <span className="tag">
        <span className="dot" />
        Protótipo · dados fictícios
      </span>
      <div className="seg" role="group" aria-label="Ver como">
        {views.map(([k, i, l]) => (
          <button
            key={k}
            type="button"
            data-act="view"
            data-v={k}
            aria-pressed={view === k}
            onClick={() => handleSelectView(k)}
          >
            <Icon name={i} />
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}
