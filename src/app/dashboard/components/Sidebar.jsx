'use client';

import React from 'react';
import { useDashboard } from '../context/DashboardContext';
import { Icon } from '../data/icons';
import { IMG } from '../data/constants';
import { totals } from '../data/logic';

export default function Sidebar() {
  const {
    view,
    page,
    setPageState,
    setObraId,
    setEmp,
    setEmpFrom,
    setFiltro,
    setQ,
    setOgSel,
    setMlim,
    obras,
    movs,
    pedidos,
    currentUser,
  } = useDashboard();

  const t = totals(obras, movs);
  const div = movs.filter(m => m.estado === 'divergencia').length;
  const ped = pedidos.filter(p => p.estado === 'pendente').length;
  const totalAlertas = t.lateObras + div + ped;

  const navEscritorio = [
    ['inicio', 'home', 'Início', 'Início', null],
    ['obras', 'obra', 'Obras', 'Obras', null],
    ['clientes', 'users', 'Clientes', 'Clientes', null],
    ['cavaletes', 'cav', 'Cavaletes', 'Cav.', null],
    ['mapa', 'pin', 'Mapa', 'Mapa', null],
    ['entregas', 'truck', 'Movimentos', 'Mov.', null],
    ['alertas', 'bell', 'Alertas', 'Alertas', totalAlertas > 0 ? totalAlertas : null],
    ['qr', 'qr', 'Códigos QR', 'QR', 'Fase 2'],
  ];

  const navAdmin = [
    ['inicio', 'home', 'Painel', 'Painel', null],
    ['obras', 'obra', 'Obras', 'Obras', null],
    ['clientes', 'users', 'Clientes', 'Clientes', null],
    ['financeiro', 'euro', 'Financeiro', 'Fin.', null],
    ['atividade', 'clock', 'Atividade', 'Ativ.', null],
  ];

  const currentNav = view === 'admin' ? navAdmin : navEscritorio;

  const handleNavClick = (targetPage) => {
    setPageState(targetPage);
    setObraId(null);
    if (setEmp) setEmp(null);
    if (setEmpFrom) setEmpFrom(null);
    setMlim(10);
    if (targetPage === 'obras') {
      setFiltro('todas');
      setQ('');
      setOgSel(null);
    }
    window.scrollTo(0, 0);
    const mainEl = document.getElementById('main');
    if (mainEl) mainEl.scrollTop = 0;
  };

  const handleDefinicoesClick = () => {
    setPageState('definicoes');
    setObraId(null);
    if (setEmp) setEmp(null);
    if (setEmpFrom) setEmpFrom(null);
    window.scrollTo(0, 0);
    const mainEl = document.getElementById('main');
    if (mainEl) mainEl.scrollTop = 0;
  };

  return (
    <aside className="side">
      <div className="brand">
        <img className="brand-logo" src={IMG.logo} alt="Vidraria Mortágua — vidros & espelhos, S.A." />
      </div>

      <nav className="nav" aria-label="Menu">
        {currentNav.map(([k, iconName, labelLg, labelSh, badgeOrSoon]) => {
          const isCurrent = page === k;
          return (
            <button
              key={k}
              type="button"
              data-act="nav"
              data-k={k}
              aria-current={isCurrent ? 'page' : undefined}
              onClick={() => handleNavClick(k)}
            >
              <Icon name={iconName} />
              <span className="lg">{labelLg}</span>
              <span className="sh">{labelSh}</span>
              {badgeOrSoon && typeof badgeOrSoon === 'number' && (
                <span className="badge">{badgeOrSoon}</span>
              )}
              {badgeOrSoon === 'Fase 2' && (
                <span className="soon">Fase 2</span>
              )}
            </button>
          );
        })}
      </nav>

      {view === 'admin' ? (
        <div className="me">
          <span className="av">N</span>
          <span>
            <b>Sr. Nuno</b>
            <small>Administração · Sair</small>
          </span>
        </div>
      ) : (
        <div className="me">
          <span className="av">
            {currentUser === 'Cristiana' ? 'Cr' : currentUser === 'Catarina' ? 'Ca' : currentUser.slice(0, 2)}
          </span>
          <span>
            <b>{currentUser}</b>
            <small>Escritório · Sair</small>
          </span>
          <button
            type="button"
            className="iconbtn"
            data-act="nav"
            data-k="definicoes"
            aria-label="Definições"
            aria-current={page === 'definicoes' ? 'page' : undefined}
            onClick={handleDefinicoesClick}
          >
            <Icon name="gear" />
          </button>
        </div>
      )}
    </aside>
  );
}
