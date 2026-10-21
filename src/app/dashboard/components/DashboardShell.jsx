'use client';

import React, { useEffect, useRef } from 'react';
import { useDashboard } from '../context/DashboardContext';
import Demobar from './Demobar';
import Sidebar from './Sidebar';
import EscritorioView from './EscritorioView';
import MotoristaView from './MotoristaView';
import ClienteView from './ClienteView';
import AdminView from './AdminView';
import ModalLayer from './ModalLayer';

export default function DashboardShell({ initialView, initialPage, initialObraId }) {
  const {
    view,
    setViewState,
    page,
    setPageState,
    setObraId,
    toast,
  } = useDashboard();

  const rootRef = useRef(null);

  // Inicialização de sub-rota caso especificado
  useEffect(() => {
    if (initialView) {
      setViewState(initialView);
    }
    if (initialPage) {
      setPageState(initialPage);
    }
    if (initialObraId !== undefined) {
      setObraId(initialObraId);
    }
  }, [initialView, initialPage, initialObraId, setViewState, setPageState, setObraId]);

  // Scroll selectors a preservar
  const scrollSelectors = '.pbody, .modal, .msub, .tablewrap, .pk-tags, .cbox-list, .rchk, .content';
  const scrollPositionsRef = useRef({});

  // Grava scroll antes de re-renders e restaura após
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const handleScrollCapture = () => {
      root.querySelectorAll(scrollSelectors).forEach((el, index) => {
        if (el.scrollTop || el.scrollLeft) {
          const key = el.className + ':' + index;
          scrollPositionsRef.current[key] = { top: el.scrollTop, left: el.scrollLeft };
        }
      });
    };

    root.addEventListener('scroll', handleScrollCapture, { capture: true, passive: true });
    return () => {
      root.removeEventListener('scroll', handleScrollCapture, { capture: true });
    };
  }, []);

  return (
    <div className="vm-dashboard" ref={rootRef}>
      <Demobar />

      {view === 'escritorio' ? (
        <div className="shell">
          <Sidebar />
          <main className={`content ${page === 'inicio' ? 'is-home' : ''}`} id="main">
            <EscritorioView />
          </main>
        </div>
      ) : view === 'admin' ? (
        <div className="shell is-admin">
          <Sidebar />
          <main className={`content ${page === 'inicio' ? 'is-home' : ''}`} id="main">
            <AdminView />
          </main>
        </div>
      ) : view === 'motorista' ? (
        <MotoristaView />
      ) : (
        <ClienteView />
      )}

      {/* Layer de Modais e Toasts */}
      <ModalLayer />

      {toast && (
        <div className="toast" role="status">
          <svg className="i" viewBox="0 0 24 24" aria-hidden="true" style={{ width: '1.25em', height: '1.25em' }}>
            <path d="m4.5 12.5 5 5L20 7" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {toast}
        </div>
      )}
    </div>
  );
}
