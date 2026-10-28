'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { PTD, MK, VIEWBOX, FABRICA, proj } from './mapaPortugal';
import { resumo, ST, diasTxt } from '../data/logic';
import { Icon } from '../data/icons';
import './MapaPortugal.css';

export default function MapaPortugal({ preview = false, filter = 'todas' }) {
  const { obras, movs, setObraId, setPageState, openModal } = useDashboard();
  const [tooltip, setTooltip] = useState(null);
  const [popup, setPopup] = useState(null);
  const wrapRef = useRef(null);

  const ord = { ok: 0, watch: 1, soon: 2, late: 3 };
  const dots = obras
    .map(o => ({ o, r: resumo(o, movs) }))
    .filter(x => x.r.total > 0 && (!filter || filter === 'todas' || x.r.st === filter))
    .sort((a, b) => ord[a.r.st] - ord[b.r.st]);

  const [fx, fy] = proj(FABRICA.lon, FABRICA.lat);

  // Fechar popup se clicar fora dele
  useEffect(() => {
    if (!popup) return;
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.mpop') && !e.target.closest('circle.dot')) {
        setPopup(null);
      }
    };
    document.addEventListener('pointerdown', handleOutsideClick);
    return () => document.removeEventListener('pointerdown', handleOutsideClick);
  }, [popup]);

  const handleDotClick = (e, o, r) => {
    if (preview) return;
    const wrap = wrapRef.current;
    if (!wrap) return;
    const wb = wrap.getBoundingClientRect();
    const cb = e.currentTarget.getBoundingClientRect();

    const cx = cb.left - wb.left + cb.width / 2;
    const cy = cb.top - wb.top + cb.height / 2;

    let left = cx + 16;
    if (left + 260 > wb.width) {
      left = cx - 16 - 260;
    }
    left = Math.max(4, left);
    let top = Math.min(Math.max(4, cy - 80), wb.height - 180);

    setPopup({ o, r, left, top });
    setTooltip(null);
  };

  const handleDotMouseEnter = (e, o, r) => {
    if (preview || popup) return;
    const wrap = wrapRef.current;
    if (!wrap) return;
    const wb = wrap.getBoundingClientRect();
    const cb = e.currentTarget.getBoundingClientRect();

    setTooltip({
      text: `${o.nome} · ${r.total} cavaletes`,
      left: cb.left - wb.left + cb.width / 2,
      top: cb.top - wb.top - 8,
    });
  };

  const handleDotMouseLeave = () => {
    setTooltip(null);
  };

  const renderSvg = () => (
    <svg
      className={`map ${preview ? 'small' : ''}`}
      viewBox={VIEWBOX || '0 0 12969 26674'}
      role="img"
      aria-label="Mapa de Portugal com as obras que têm cavaletes"
    >
      <g className="land">
        {PTD.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>

      {dots.map(({ o, r }) => {
        const [x, y] = proj(o.lon, o.lat);
        const rr = ((3 + Math.sqrt(r.total) * 0.75) * MK).toFixed(0);
        const st = ST[r.st];

        if (preview) {
          return (
            <circle
              key={o.id}
              cx={x}
              cy={y}
              r={rr}
              fill={st.color}
              fillOpacity="1"
              stroke="white"
              strokeWidth="2.5"
              vectorEffect="non-scaling-stroke"
            />
          );
        }

        return (
          <circle
            key={o.id}
            className="dot"
            cx={x}
            cy={y}
            r={rr}
            fill={st.color}
            fillOpacity="0.85"
            stroke="var(--surface)"
            strokeWidth="1.2"
            tabIndex={0}
            role="button"
            aria-label={`${o.nome}, ${r.total} cavaletes`}
            onClick={(e) => handleDotClick(e, o, r)}
            onMouseEnter={(e) => handleDotMouseEnter(e, o, r)}
            onMouseLeave={handleDotMouseLeave}
          />
        );
      })}

      <rect
        x={fx - 6 * MK}
        y={fy - 6 * MK}
        width={12 * MK}
        height={12 * MK}
        rx={2 * MK}
        fill="var(--ink)"
        stroke="var(--surface)"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      >
        <title>Vidraria Mortágua</title>
      </rect>

      {!preview && (
        <text
          pointerEvents="none"
          x={+fx + 10 * MK}
          y={+fy + 4 * MK}
          fontSize={10 * MK}
          fontWeight="600"
          fill="var(--ink)"
          stroke="var(--surface)"
          strokeWidth={3 * MK}
          paintOrder="stroke"
          fontFamily="Space Grotesk, sans-serif"
        >
          Fábrica
        </text>
      )}
    </svg>
  );

  return (
    <>
      {preview ? (
        <div className="mapbox">
          {renderSvg()}
        </div>
      ) : (
        <div className="mapwrap" ref={wrapRef}>
          {renderSvg()}

          {tooltip && (
            <div
              className="mtip"
              style={{ left: `${tooltip.left}px`, top: `${tooltip.top}px` }}
            >
              {tooltip.text}
            </div>
          )}

          {popup && (
            <div
              className="mpop"
              role="dialog"
              style={{ left: `${popup.left}px`, top: `${popup.top}px` }}
            >
              <button
                type="button"
                className="x"
                aria-label="Fechar"
                onClick={() => setPopup(null)}
              >
                <Icon name="x" />
              </button>
              <p className="eyebrow">{popup.o.empresa}</p>
              <h3>{popup.o.nome}</h3>
              <div className="mrowp">
                <span className="num">{popup.r.total}</span>
                <span className="muted">cavaletes</span>
              </div>
              <div className="whenrow">
                <span className="when" style={{ color: ST[popup.r.st].color }}>
                  {diasTxt(popup.r.dias)}
                </span>
                <span className={`pill tone-${ST[popup.r.st].tone}`}>
                  <Icon name={ST[popup.r.st].icon} />
                  {ST[popup.r.st].label}
                </span>
              </div>
              <div className="acts">
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setPopup(null);
                    setObraId(popup.o.id);
                    setPageState('obras');
                  }}
                >
                  Abrir obra
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setPopup(null);
                    openModal({
                      type: 'email',
                      obraId: popup.o.id,
                      tpl: popup.r.st === 'late' ? 'terminado' : 'amigavel',
                    });
                  }}
                >
                  <Icon name="mail" />
                  Email
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="legend">
        <span><i style={{ background: '#ef3340' }} />Terminado</span>
        <span><i style={{ background: '#f59e0b' }} />50–60 dias</span>
        <span><i style={{ background: '#3b82f6' }} />30–50 dias</span>
        <span><i style={{ background: '#10b981' }} />&lt; 30 dias</span>
        {!preview && (
          <span><i style={{ background: 'var(--ink)', borderRadius: '2px' }} />Fábrica</span>
        )}
      </div>
    </>
  );
}
