'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { Icon } from '../data/icons';
import {
  TODAY,
  DIAS,
  MESES,
  MESES_L,
  FROTA,
  TIPOS_CAV,
  PRAZO,
  QRPATH,
  IMG,
  fdl,
  fd,
  diffDays,
} from '../data/constants';
import {
  totals,
  resumo,
  ST,
  diasTxt,
  norm,
  esc,
  fmtN,
  rel,
  stFor,
  inventario,
  cavEstado,
  parseIso,
  empInfo,
  qEntregue,
} from '../data/logic';
import MapaPortugal from './MapaPortugal';

export function cleanPerson(str) {
  if (!str) return '';
  return str
    .replace(/^Assinado por\s*/i, '')
    .replace(/^(Sr[aª]?\.?|Sr\.?ª?|D\.)\s*/i, '')
    .replace(/^[ªº.]\s*/, '')
    .trim();
}

function formatMovDate(d) {
  if (!d) return '—';
  const dt = d instanceof Date ? d : (typeof d === 'string' ? parseIso(d) : new Date(d));
  if (!dt || isNaN(dt.getTime())) return String(d);
  const dd = String(dt.getDate()).padStart(2, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${dt.getFullYear()}`;
}

export default function EscritorioView() {
  const {
    page,
    obraId,
    setObraId,
    emp,
    setEmp,
    empFrom,
    setEmpFrom,
    openObra,
    openEmpresa,
    goBack,
    setPageState,
    filtro,
    setFiltro,
    q,
    setQ,
    og,
    setOg,
    ogSel,
    setOgSel,
    mapf,
    setMapf,
    mlim,
    setMlim,
    osize,
    setOsize,
    theme,
    setTheme,
    auto,
    setAuto,
    currentUser,
    cav,
    setCav,
    obras,
    movs,
    pedidos,
    lembretes,
    openModal,
    showToast,
  } = useDashboard();

  const t = totals(obras, movs);

  // Filtros locais da ficha da empresa
  const [eh, setEh] = useState({ obra: '', per: '', mot: '', est: '', ord: 'rec' });
  const [ehlim, setEhlim] = useState(15);
  const [ehOpen, setEhOpen] = useState(null); // 'obra' | 'per' | 'mot' | 'est' | 'ord' | null
  const ehfsRef = useRef(null);

  useEffect(() => {
    if (!ehOpen) return;
    const handleClickOutside = e => {
      if (ehfsRef.current && !ehfsRef.current.contains(e.target)) {
        setEhOpen(null);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [ehOpen]);

  // Filtros locais da página de Clientes
  const [cliQ, setCliQ] = useState('');
  const [cliF, setCliF] = useState('todos');
  const [cliSort, setCliSort] = useState('cav');
  const [cliSortOpen, setCliSortOpen] = useState(false);
  const cliSortRef = useRef(null);

  useEffect(() => {
    if (!cliSortOpen) return;
    const handleClickOutside = e => {
      if (cliSortRef.current && !cliSortRef.current.contains(e.target)) {
        setCliSortOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [cliSortOpen]);

  // Estado do accordion de alertas
  const [aOpen, setAOpen] = useState(null);
  const [qrBusca, setQrBusca] = useState('3127');

  // Helper de badge/pill de movimento
  const movPill = m => {
    const map = {
      preparada: ['mut', 'clock', 'A preparar'],
      em_viagem: ['info', 'truck', 'A caminho'],
      entregue: ['ok', 'check', 'Entregue'],
      divergencia: ['warn', 'alert', 'Diferença'],
      agendada: ['info', 'cal', 'Marcada'],
      por_atribuir: ['warn', 'clock', 'Na logística'],
      concluida: ['ok', 'check', 'Recolhida'],
    };
    const [tTone, iIcon, lLabel] = map[m.estado] || ['mut', 'info', m.estado];
    return (
      <span className={`pill tone-${tTone}`}>
        <Icon name={iIcon} />
        {lLabel}
      </span>
    );
  };

  const cleanPerson = str => {
    if (!str) return '';
    return str
      .replace(/^Assinado por\s*/i, '')
      .replace(/^(Sr[aª]?\.?|Sr\.?ª?|D\.)\s*/i, '')
      .replace(/^[ªº.]\s*/, '')
      .trim();
  };

  const fmtSlashDate = d => {
    if (!d) return '—';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  };

  // ================= PÁGINA INÍCIO =================
  if (page === 'inicio' && !obraId && !emp) {
    const items = [];

    movs
      .filter(m => m.estado === 'divergencia')
      .forEach(m => {
        const o = obras.find(x => x.id === m.obraId);
        items.push({
          tone: 'warn',
          icon: 'diff',
          t: `Diferença de contagem na guia ${m.guia}`,
          s: `${o?.nome} · Vidraria: ${m.qtd} · Cliente: ${m.qtdCli}`,
          action: () => openModal({ type: 'resolver', id: m.id }),
          btn: (
            <button
              type="button"
              className="btn btn-soft btn-sm"
              onClick={e => {
                e.stopPropagation();
                openModal({ type: 'resolver', id: m.id });
              }}
            >
              Resolver
            </button>
          ),
        });
      });

    pedidos
      .filter(p => p.estado === 'pendente' || p.estado === 'logistica')
      .forEach(p => {
        const o = obras.find(x => x.id === p.obraId);
        const isPend = p.estado === 'pendente';
        items.push({
          tone: isPend ? 'info' : 'warn',
          icon: isPend ? 'hand' : 'truck',
          t: isPend ? `Pedido de recolha: ${p.qtd} cavaletes` : `Recolha na logística: ${p.qtd} cavaletes`,
          s: isPend
            ? `${o?.nome} · ${o?.cidade} · pedido ${rel(p.data)}`
            : `${o?.nome} · ${o?.cidade} · falta selecionar motorista`,
          action: () => {
            if (o) openObra(o.id);
          },
          btn: isPend ? (
            <button
              type="button"
              className="btn btn-soft btn-sm"
              onClick={e => {
                e.stopPropagation();
                if (!p.guia) p.guia = 'GR-2026/' + (1400 + pedidos.indexOf(p) + 1);
                openModal({ type: 'mrec', pid: p.id });
              }}
            >
              Marcar
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={e => {
                e.stopPropagation();
                openModal({ type: 'atrib', pid: p.id, movId: p.movId });
              }}
            >
              Selecionar motorista
            </button>
          ),
        });
      });

    const rs = obras
      .map(o => ({ o, r: resumo(o, movs) }))
      .filter(x => x.r.st === 'late' || x.r.st === 'soon')
      .sort((a, b) => a.r.dias - b.r.dias);

    rs.forEach(({ o, r }) => {
      items.push({
        tone: r.st === 'late' ? 'late' : 'warn',
        icon: r.st === 'late' ? 'alert' : 'clock',
        t: `${r.st === 'late' ? 'Prazo terminado' : 'Prazo a terminar em breve'}: ${o.nome}`,
        s: `${r.first?.qtd} cavaletes · ${diasTxt(r.dias)} · limite ${fd(r.first?.prazo)}${lembretes[o.id] ? ' · lembrete enviado ' + rel(lembretes[o.id]) : ''}`,
        action: () => openObra(o.id),
        btn: (
          <button
            type="button"
            className="btn btn-soft btn-sm"
            onClick={e => {
              e.stopPropagation();
              openModal({
                type: 'email',
                obraId: o.id,
                tpl: r.st === 'late' ? 'terminado' : 'amigavel',
              });
            }}
          >
            Email
          </button>
        ),
      });
    });

    const saudacao = (h => (h < 13 ? 'Bom dia' : h < 20 ? 'Boa tarde' : 'Boa noite'))(new Date().getHours());

    return (
      <>
        <div className="pagehead home">
          <div>
            <p className="date">{DIAS[TODAY.getDay()]}, {fdl(TODAY)}</p>
            <h1 className="ph">
              <span className="phi"><Icon name="home" /></span>
              <span>{saudacao}, {currentUser}</span>
            </h1>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => openModal({ type: 'nova', nums: [] })}
          >
            <Icon name="plus" />
            Nova entrega
          </button>
        </div>

        <div className="kpis">
          <button
            type="button"
            className="kpi"
            onClick={() => {
              setPageState('cavaletes');
              window.scrollTo(0, 0);
            }}
          >
            <span className="top"><Icon name="factory" />Na fábrica</span>
            <span className="kvr">
              <span className="v num">{fmtN(t.fabrica)}</span>
              <small>de {fmtN(FROTA)}</small>
            </span>
          </button>
          <button
            type="button"
            className="kpi"
            onClick={() => {
              setPageState('obras');
              setObraId(null);
              setEmp(null);
              window.scrollTo(0, 0);
            }}
          >
            <span className="top"><Icon name="obra" />Em obras</span>
            <span className="kvr">
              <span className="v num">{fmtN(t.emObra)}</span>
              <small>{obras.filter(o => resumo(o, movs).total > 0).length} obras</small>
            </span>
          </button>
          <button
            type="button"
            className="kpi"
            onClick={() => {
              setPageState('entregas');
              window.scrollTo(0, 0);
            }}
          >
            <span className="top"><Icon name="truck" />A caminho</span>
            <span className="kvr">
              <span className="v num">{fmtN(t.transito)}</span>
              <small>por confirmar</small>
            </span>
          </button>
          <button
            type="button"
            className="kpi late"
            onClick={() => {
              setPageState('obras');
              setObraId(null);
              setEmp(null);
              setFiltro('late');
              window.scrollTo(0, 0);
            }}
          >
            <span className="top"><Icon name="alert" />Fora do prazo</span>
            <span className="kvr">
              <span className="v num">{fmtN(t.late)}</span>
              <small>{t.lateObras} obras</small>
            </span>
          </button>
        </div>

        <div className="grid2 home">
          <section className="card">
            <div className="card-h">
              <h2 className="pulse-h">
                <i className="pulse" />
                Precisa da sua atenção
              </h2>
              <button
                type="button"
                className="linkbtn"
                onClick={() => {
                  setPageState('alertas');
                  window.scrollTo(0, 0);
                }}
              >
                Ver todos ({items.length}) <Icon name="right" />
              </button>
            </div>
            <div className="card-b">
              <div className="alist">
                {items.slice(0, 5).map((a, i) => (
                  <div
                    key={i}
                    className={`aitem click tb-${a.tone}`}
                    role="button"
                    tabIndex={0}
                    onClick={a.action}
                  >
                    <div className="t">
                      <b>
                        <span className={`aic aic-${a.tone}`}><Icon name={a.icon} /></span>
                        {a.t}
                      </b>
                      <span>{a.s}</span>
                    </div>
                    {a.btn}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-h">
              <h2>Mapa</h2>
              <button
                type="button"
                className="linkbtn"
                onClick={() => {
                  setPageState('mapa');
                  window.scrollTo(0, 0);
                }}
              >
                Abrir mapa <Icon name="right" />
              </button>
            </div>
            <div
              className="card-b mapprev"
              role="button"
              tabIndex={0}
              aria-label="Abrir mapa completo"
              onClick={() => {
                setPageState('mapa');
                window.scrollTo(0, 0);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setPageState('mapa');
                  window.scrollTo(0, 0);
                }
              }}
            >
              <MapaPortugal preview />
            </div>
          </section>
        </div>
      </>
    );
  }

  // ================= FICHA DA EMPRESA (CLIENTE) =================
  if (emp && !obraId) {
    const I = empInfo(emp, obras);
    const L = obras.filter(o => o.empresa === emp).map(o => ({ o, r: resumo(o, movs) }));
    const ativas = L.filter(x => x.r.total > 0 || x.r.transito > 0);
    const tot = L.reduce((n, x) => n + x.r.total, 0);
    const cam = L.reduce((n, x) => n + x.r.transito, 0);
    const late = L.reduce((n, x) => n + x.r.lateQ, 0);

    const seg = { ok: 0, watch: 0, soon: 0, late: 0 };
    L.forEach(x => {
      x.r.lots.forEach(l => {
        seg[stFor(l.data, l.dias)] += l.qtd;
      });
    });

    const urg = ativas.filter(x => x.r.total).sort((a, b) => a.r.dias - b.r.dias)[0];
    const ids = new Set(L.map(x => x.o.id));

    let H = movs.filter(m => ids.has(m.obraId));
    const mots = [...new Set(H.map(m => m.motorista).filter(Boolean))].sort();

    const getEst = m => (m.tipo === 'recolha' ? 'rec' : m.estado === 'divergencia' ? 'dif' : m.assinatura ? 'ass' : 'pend');
    if (eh.obra) H = H.filter(m => m.obraId === eh.obra);
    if (eh.mot) H = H.filter(m => m.motorista === eh.mot);
    if (eh.est) H = H.filter(m => getEst(m) === eh.est);
    if (eh.per) H = H.filter(m => diffDays(TODAY, m.data) <= Number(eh.per) && m.data <= TODAY);

    H.sort(eh.ord === 'qtd' ? (a, b) => b.qtd - a.qtd : (a, b) => new Date(b.data) - new Date(a.data));
    const shownMovs = H.slice(0, ehlim);

    return (
      <>
        <button type="button" className="back" onClick={goBack}>
          <Icon name="left" />Voltar atrás
        </button>

        {empFrom && obras.find(o => o.id === empFrom)?.empresa === emp && (
          <div className="otabs">
            <button type="button" onClick={() => openObra(empFrom)}>
              <Icon name="obra" />Ficha da obra
            </button>
            <button type="button" aria-current="page">
              <Icon name="users" />Empresa: {emp}
            </button>
          </div>
        )}

        <section className="ocard emp-unified-card">
          <div className="emp-uni-top">
            <div className="emp-uni-main">
              <div className="emp-meta-top">
                {I.morada && I.morada !== '—' && (
                  <>
                    <span className="emp-meta-loc">
                      <Icon name="pin" />
                      {I.morada}
                    </span>
                    <span className="emp-meta-dash">—</span>
                  </>
                )}
                <span className="emp-meta-nif">NIF {I.nif}</span>
              </div>
              <h1 className="oh-t">{emp}</h1>
              <div className="emp-contact-strip">
                <span className="emp-cs-item" title="Responsável">
                  <Icon name="user" />
                  <span>{I.resp}</span>
                </span>
                <span className="emp-cs-dot">·</span>
                <a className="emp-cs-item" href={`tel:+351${I.tm.replace(/\D/g, '')}`} title="Telemóvel">
                  <Icon name="phone" />
                  <span>{I.tm}</span>
                </a>
                <span className="emp-cs-dot">·</span>
                <a className="emp-cs-item" href={`mailto:${I.email}`} title="Email">
                  <Icon name="mail" />
                  <span>{I.email}</span>
                </a>
              </div>
            </div>
            <div className="oh-act">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => openModal({ type: 'nova', empresa: emp })}
              >
                <Icon name="plus" />Nova entrega
              </button>
              <button
                type="button"
                className="btn btn-ok"
                onClick={() => openModal({ type: 'recolha', empresa: emp })}
              >
                <Icon name="recolha" />Registar recolha
              </button>
              {urg && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() =>
                    openModal({
                      type: 'email',
                      obraId: urg.o.id,
                      tpl: urg.r.st === 'late' ? 'terminado' : 'amigavel',
                    })
                  }
                >
                  <Icon name="mail" />Enviar email
                </button>
              )}
            </div>
          </div>

          <div className="emp-uni-divider" />

          <div className="emp-uni-kpis">
            <div className="emp-uni-kpi">
              <small>Total em Obras</small>
              <span className="num">{fmtN(tot)}</span>
            </div>
            <div className="emp-uni-kpi">
              <small>Cavaletes a Caminho</small>
              <span className="num">{fmtN(cam)}</span>
            </div>
            <div className={`emp-uni-kpi${late ? ' late' : ''}`}>
              <small>Fora do Prazo (6m)</small>
              <span className="num">{fmtN(late)}</span>
            </div>
            <div className="emp-uni-kpi">
              <small>Obras Ativas</small>
              <span className="num">{ativas.length}</span>
            </div>
          </div>

          {tot > 0 && (
            <div className="emp-uni-prazos">
              <div className="emp-prazos-left">
                <span className="emp-prazos-title">Distribuição dos prazos</span>
                <span className="emp-prazos-bar">
                  {['ok', 'watch', 'soon', 'late'].map(k =>
                    seg[k] ? (
                      <i key={k} style={{ flex: seg[k], background: ST[k].color }} title={`${seg[k]} cavaletes`} />
                    ) : null
                  )}
                </span>
              </div>
              <div className="emp-prazos-legend">
                {[
                  ['ok', '< 30 dias'],
                  ['watch', '30–50 d.'],
                  ['soon', '50–60 d.'],
                  ['late', 'Terminado'],
                ].map(([k, l], idx) => (
                  <React.Fragment key={k}>
                    {idx > 0 && <span className="emp-prazos-sep">—</span>}
                    <span className="emp-prazos-legend-item">
                      <i style={{ background: ST[k].color }} />
                      <span>{l}</span>
                    </span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="ocard">
          <div className="oc-h">
            <div>
              <h2>Obras da empresa</h2>
              <p>Cada obra tem o seu responsável local e o respetivo estado de prazo.</p>
            </div>
          </div>
          <div className="eobras-list">
            {L.slice()
              .sort((a, b) => (a.r.dias ?? 999) - (b.r.dias ?? 999))
              .map(({ o, r }) => {
                const isLate = r.total > 0 && r.dias != null && r.dias < 0;
                const isOk = r.total > 0 && r.dias != null && r.dias >= 0;

                return (
                  <article
                    key={o.id}
                    className="eob-row"
                    onClick={() => openObra(o.id)}
                  >
                    <div className="eob-row-info">
                      <div className="eob-row-title">
                        <b>{o.nome}</b>
                        <span className="eob-row-loc">
                          <Icon name="pin" />
                          {o.morada}, {o.cidade}
                        </span>
                      </div>
                      <div className="eob-row-sub">
                        {o.contacto && (
                          <span>
                            <Icon name="user" />
                            {o.contacto}
                          </span>
                        )}
                        {/\d/.test(o.tel) && (
                          <span>
                            <Icon name="phone" />
                            <a
                              className="tel-link"
                              target="_blank"
                              rel="noopener noreferrer"
                              href={`tel:+351${o.tel.replace(/\D/g, '')}`}
                              onClick={e => e.stopPropagation()}
                            >
                              {o.tel}
                            </a>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="eob-row-status">
                      {isLate ? (
                        <span className="eob-st-tag is-late">
                          Fora de prazo ({Math.abs(r.dias)}d)
                        </span>
                      ) : isOk ? (
                        <span className="eob-st-tag is-ok">
                          Em prazo ({r.dias}d restantes)
                        </span>
                      ) : (
                        <span className="eob-st-tag is-none">
                          Sem cavaletes
                        </span>
                      )}
                    </div>

                    <div className="eob-row-count">
                      <span className="num">{r.total}</span>
                      <small>
                        {r.transito > 0 ? `+${r.transito} a caminho` : 'em obra'}
                      </small>
                    </div>

                    <div className="eob-row-action">
                      <span className="eob-arrow">
                        <Icon name="right" />
                      </span>
                    </div>
                  </article>
                );
              })}
          </div>
        </section>

        <section className="ocard ohist-card">
          <div className="oc-h">
            <div>
              <h2>Histórico de movimentos</h2>
              <p>Todas as guias de entrega e recolha com esta empresa.</p>
            </div>

            <div className="ehfs" ref={ehfsRef}>
            {/* Obra */}
            <div className="cli-sort-wrap">
              <button
                type="button"
                className={`cli-sort-btn${ehOpen === 'obra' ? ' open' : ''}`}
                onClick={() => setEhOpen(o => o === 'obra' ? null : 'obra')}
                aria-haspopup="listbox"
                aria-expanded={ehOpen === 'obra'}
              >
                <span className="cli-sort-label">
                  {eh.obra ? (L.find(x => x.o.id === eh.obra)?.o.nome || 'Todas as obras') : 'Todas as obras'}
                </span>
                <svg
                  className={`cli-sort-arrow${ehOpen === 'obra' ? ' open' : ''}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {ehOpen === 'obra' && (
                <div className="cli-sort-pop" role="listbox">
                  <button
                    type="button"
                    role="option"
                    aria-selected={!eh.obra}
                    className={`cli-sort-opt${!eh.obra ? ' is-sel' : ''}`}
                    onClick={() => {
                      setEh(s => ({ ...s, obra: '' }));
                      setEhlim(15);
                      setEhOpen(null);
                    }}
                  >
                    <div className="cli-opt-info">
                      <span className="cli-opt-title">Todas as obras</span>
                    </div>
                    {!eh.obra && (
                      <span className="cli-opt-check">
                        <Icon name="check" />
                      </span>
                    )}
                  </button>
                  {L.map(x => {
                    const isSel = eh.obra === x.o.id;
                    return (
                      <button
                        key={x.o.id}
                        type="button"
                        role="option"
                        aria-selected={isSel}
                        className={`cli-sort-opt${isSel ? ' is-sel' : ''}`}
                        onClick={() => {
                          setEh(s => ({ ...s, obra: x.o.id }));
                          setEhlim(15);
                          setEhOpen(null);
                        }}
                      >
                        <div className="cli-opt-info">
                          <span className="cli-opt-title">{x.o.nome}</span>
                        </div>
                        {isSel && (
                          <span className="cli-opt-check">
                            <Icon name="check" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Data */}
            <div className="cli-sort-wrap">
              <button
                type="button"
                className={`cli-sort-btn${ehOpen === 'per' ? ' open' : ''}`}
                onClick={() => setEhOpen(o => o === 'per' ? null : 'per')}
                aria-haspopup="listbox"
                aria-expanded={ehOpen === 'per'}
              >
                <span className="cli-sort-label">
                  {eh.per === '7' ? 'Últimos 7 dias' : eh.per === '30' ? 'Últimos 30 dias' : eh.per === '90' ? 'Últimos 90 dias' : 'Todas as datas'}
                </span>
                <svg
                  className={`cli-sort-arrow${ehOpen === 'per' ? ' open' : ''}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {ehOpen === 'per' && (
                <div className="cli-sort-pop" role="listbox">
                  {[
                    ['', 'Todas as datas'],
                    ['7', 'Últimos 7 dias'],
                    ['30', 'Últimos 30 dias'],
                    ['90', 'Últimos 90 dias'],
                  ].map(([val, label]) => {
                    const isSel = eh.per === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        role="option"
                        aria-selected={isSel}
                        className={`cli-sort-opt${isSel ? ' is-sel' : ''}`}
                        onClick={() => {
                          setEh(s => ({ ...s, per: val }));
                          setEhlim(15);
                          setEhOpen(null);
                        }}
                      >
                        <div className="cli-opt-info">
                          <span className="cli-opt-title">{label}</span>
                        </div>
                        {isSel && (
                          <span className="cli-opt-check">
                            <Icon name="check" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Estado */}
            <div className="cli-sort-wrap">
              <button
                type="button"
                className={`cli-sort-btn${ehOpen === 'est' ? ' open' : ''}`}
                onClick={() => setEhOpen(o => o === 'est' ? null : 'est')}
                aria-haspopup="listbox"
                aria-expanded={ehOpen === 'est'}
              >
                <span className="cli-sort-label">
                  {eh.est === 'ass'
                    ? 'Entregue e assinado'
                    : eh.est === 'pend'
                    ? 'Por assinar'
                    : eh.est === 'dif'
                    ? 'Com diferença'
                    : eh.est === 'rec'
                    ? 'Recolhas'
                    : 'Todos os estados'}
                </span>
                <svg
                  className={`cli-sort-arrow${ehOpen === 'est' ? ' open' : ''}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {ehOpen === 'est' && (
                <div className="cli-sort-pop" role="listbox">
                  {[
                    ['', 'Todos os estados'],
                    ['ass', 'Entregue e assinado'],
                    ['pend', 'Por assinar'],
                    ['dif', 'Com diferença'],
                    ['rec', 'Recolhas'],
                  ].map(([val, label]) => {
                    const isSel = eh.est === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        role="option"
                        aria-selected={isSel}
                        className={`cli-sort-opt${isSel ? ' is-sel' : ''}`}
                        onClick={() => {
                          setEh(s => ({ ...s, est: val }));
                          setEhlim(15);
                          setEhOpen(null);
                        }}
                      >
                        <div className="cli-opt-info">
                          <span className="cli-opt-title">{label}</span>
                        </div>
                        {isSel && (
                          <span className="cli-opt-check">
                            <Icon name="check" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Ordenar */}
            <div className="cli-sort-wrap ehf-sort">
              <button
                type="button"
                className={`cli-sort-btn${ehOpen === 'ord' ? ' open' : ''}`}
                onClick={() => setEhOpen(o => o === 'ord' ? null : 'ord')}
                aria-haspopup="listbox"
                aria-expanded={ehOpen === 'ord'}
              >
                <span className="cli-sort-label">
                  {eh.ord === 'qtd' ? 'Maior quantidade' : 'Mais recentes'}
                </span>
                <svg
                  className={`cli-sort-arrow${ehOpen === 'ord' ? ' open' : ''}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {ehOpen === 'ord' && (
                <div className="cli-sort-pop" role="listbox">
                  {[
                    ['rec', 'Mais recentes'],
                    ['qtd', 'Maior quantidade'],
                  ].map(([val, label]) => {
                    const isSel = eh.ord === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        role="option"
                        aria-selected={isSel}
                        className={`cli-sort-opt${isSel ? ' is-sel' : ''}`}
                        onClick={() => {
                          setEh(s => ({ ...s, ord: val }));
                          setEhOpen(null);
                        }}
                      >
                        <div className="cli-opt-info">
                          <span className="cli-opt-title">{label}</span>
                        </div>
                        {isSel && (
                          <span className="cli-opt-check">
                            <Icon name="check" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="cli-table-card ohist-table-card">
            <div className="cli-table-wrap">
              <table className="cli-table ohist-table">
                <thead>
                  <tr>
                    <th>Guia</th>
                    <th>Tipo</th>
                    <th>Obra</th>
                    <th>Data</th>
                    <th>Quantidade</th>
                    <th>Motorista</th>
                    <th>Assinatura / Estado</th>
                    <th style={{ width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {shownMovs.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '32px' }}>
                        <p className="muted" style={{ margin: 0 }}>Nenhum movimento encontrado com os filtros selecionados.</p>
                      </td>
                    </tr>
                  ) : (
                    shownMovs.map(m => {
                      const isE = m.tipo === 'entrega';
                      const o = obras.find(x => x.id === m.obraId);
                      const motNome = m.motorista ? cleanPerson(m.motorista) : '—';
                      const assEst = m.tipo === 'recolha'
                        ? (m.estado === 'concluida'
                            ? 'Recolhida'
                            : m.estado === 'divergencia'
                            ? 'Divergência'
                            : m.estado === 'agendada'
                            ? 'Agendada'
                            : m.estado === 'por_atribuir'
                            ? 'Na logística'
                            : 'Pendente')
                        : m.assinatura
                        ? cleanPerson(m.assinatura)
                        : (m.estado === 'divergencia' ? 'Divergência' : 'Por assinar');

                      return (
                        <tr
                          key={m.id}
                          className="oh-trow"
                          onClick={() => openModal({ type: 'mov', id: m.id })}
                        >
                          <td>{m.guia}</td>
                          <td>
                            <span className={`oh-txt-tipo ${isE ? 'is-e' : 'is-r'}`}>
                              {isE ? 'Entrega' : 'Recolha'}
                            </span>
                          </td>
                          <td>{o?.nome || '—'}</td>
                          <td>{fmtSlashDate(m.data)}</td>
                          <td>{isE ? qEntregue(m) : m.qtd} cavaletes</td>
                          <td>{motNome}</td>
                          <td>{assEst}</td>
                          <td style={{ textAlign: 'right', width: '40px' }}>
                            <button
                              type="button"
                              className="oh-row-arrow"
                              onClick={e => {
                                e.stopPropagation();
                                openModal({ type: 'mov', id: m.id });
                              }}
                              aria-label="Ver detalhes"
                            >
                              <Icon name="right" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {H.length > shownMovs.length && (
            <div className="more" style={{ display: 'flex', justifyContent: 'center', marginTop: '14px' }}>
              <span className="muted" style={{ fontSize: '0.88rem' }}>
                A mostrar {shownMovs.length} de {H.length}
              </span>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setEhlim(l => l + 15)}
              >
                <Icon name="plus" />Ver mais 15
              </button>
            </div>
          )}
        </section>
      </>
    );
  }

  // ================= PÁGINA CLIENTES =================
  if (page === 'clientes' && !obraId) {
    // Agrupa dados de todas as empresas clientes
    const allEmpsMap = new Map();
    obras.forEach(o => {
      if (!o.empresa) return;
      const r = resumo(o, movs);
      if (!allEmpsMap.has(o.empresa)) {
        const inf = empInfo(o.empresa, obras);
        allEmpsMap.set(o.empresa, {
          name: o.empresa,
          info: inf,
          obras: [],
          totalCav: 0,
          transito: 0,
          lateQ: 0,
          seg: { ok: 0, watch: 0, soon: 0, late: 0 },
          earliestLot: null,
          earliestDias: null,
        });
      }
      const item = allEmpsMap.get(o.empresa);
      item.obras.push({ o, r });
      item.totalCav += r.total;
      item.transito += r.transito;
      item.lateQ += r.lateQ;

      r.lots.forEach(l => {
        const st = stFor(l.data, l.dias);
        item.seg[st] += l.qtd;
        if (item.earliestDias === null || l.dias < item.earliestDias) {
          item.earliestDias = l.dias;
          item.earliestLot = l;
        }
      });
    });

    const clientListRaw = Array.from(allEmpsMap.values());

    // KPIs globais de clientes
    const totalClientsCount = clientListRaw.length;
    const withCavCount = clientListRaw.filter(c => c.totalCav > 0).length;
    const totalCavInClients = clientListRaw.reduce((acc, c) => acc + c.totalCav, 0);
    const lateClientsCount = clientListRaw.filter(c => c.lateQ > 0).length;

    // Filtros e pesquisa
    const qNorm = cliQ.toLowerCase().trim();
    let filteredClients = clientListRaw.filter(c => {
      if (cliF === 'atraso' && c.lateQ === 0) return false;
      if (cliF === 'obras_ativas' && c.obras.length === 0) return false;
      if (cliF === 'em_dia' && (c.lateQ > 0 || c.totalCav === 0)) return false;

      if (qNorm) {
        const matchName = c.name.toLowerCase().includes(qNorm);
        const matchResp = (c.info?.resp || '').toLowerCase().includes(qNorm);
        const matchCity = (c.info?.morada || '').toLowerCase().includes(qNorm);
        const matchEmail = (c.info?.email || '').toLowerCase().includes(qNorm);
        const matchObra = c.obras.some(
          x => x.o.nome.toLowerCase().includes(qNorm) || x.o.cidade.toLowerCase().includes(qNorm)
        );
        return matchName || matchResp || matchCity || matchEmail || matchObra;
      }
      return true;
    });

    // Ordenação
    filteredClients.sort((a, b) => {
      if (cliSort === 'nome') return a.name.localeCompare(b.name, 'pt');
      if (cliSort === 'obras') return b.obras.length - a.obras.length;
      if (cliSort === 'atraso') return b.lateQ - a.lateQ || b.totalCav - a.totalCav;
      // 'cav' (default)
      if (b.lateQ !== a.lateQ) return b.lateQ - a.lateQ;
      return b.totalCav - a.totalCav || a.name.localeCompare(b.name, 'pt');
    });

    const activeObrasCount = clientListRaw.filter(c => c.obras.length > 0).length;
    const inDayClientsCount = clientListRaw.filter(c => c.lateQ === 0 && c.totalCav > 0).length;

    const chips = [
      { k: 'todos', label: 'Todos' },
      { k: 'atraso', label: 'Com Atrasos' },
      { k: 'obras_ativas', label: 'Com Obras Ativas' },
      { k: 'em_dia', label: 'Em Dia' },
    ];

    const cliSortOptions = [
      { k: 'cav', label: 'Mais Cavaletes' },
      { k: 'atraso', label: 'Maior Atraso' },
      { k: 'obras', label: 'Mais Obras' },
      { k: 'nome', label: 'Nome (A – Z)' },
    ];
    const currentSort = cliSortOptions.find(o => o.k === cliSort) || cliSortOptions[0];

    return (
      <div key={`cli-${page}`} className="admin-page-anim">
        <div className="pagehead">
          <div>
            <h1 className="ph">
              <span className="phi"><Icon name="users" /></span>
              <span>Clientes</span>
            </h1>
          </div>
          <div className="ph-act">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => openModal({ type: 'nova' })}
            >
              <Icon name="plus" />
              Nova entrega
            </button>
          </div>
        </div>

        {/* KPIs de Clientes */}
        <div className="kpis k4">
          <div className="kpi">
            <span className="top"><Icon name="users" />Total de empresas</span>
            <span className="kvr"><span className="v num">{totalClientsCount}</span><small>clientes</small></span>
          </div>
          <div className="kpi">
            <span className="top"><Icon name="cav" />Com cavaletes em obra</span>
            <span className="kvr"><span className="v num">{withCavCount}</span><small>empresas</small></span>
          </div>
          <div className="kpi">
            <span className="top"><Icon name="clock" />Cavaletes em clientes</span>
            <span className="kvr"><span className="v num">{fmtN(totalCavInClients)}</span><small>cavaletes</small></span>
          </div>
          <div className={`kpi ${lateClientsCount > 0 ? 'late' : ''}`}>
            <span className="top"><Icon name="alert" />Com prazos ultrapassados</span>
            <span className="kvr"><span className="v num">{lateClientsCount}</span><small>clientes</small></span>
          </div>
        </div>

        {/* Barra de Filtros e Pesquisa igual à página de Obras */}
        <div className="toolbar" style={{ marginTop: '22px' }}>
          <label className="search" htmlFor="cli-q">
            <Icon name="search" />
            <input
              id="cli-q"
              type="search"
              placeholder="Pesquisar por empresa, responsável, email ou obra..."
              value={cliQ}
              onChange={e => setCliQ(e.target.value)}
              aria-label="Pesquisar"
            />
            {cliQ && (
              <button
                type="button"
                className="iconbtn"
                onClick={() => setCliQ('')}
                aria-label="Limpar pesquisa"
              >
                <Icon name="x" />
              </button>
            )}
          </label>

          <div className="chips-seg" role="group" aria-label="Filtrar clientes">
            {chips.map(ch => (
              <button
                key={ch.k}
                type="button"
                className="chip"
                aria-pressed={cliF === ch.k}
                onClick={() => setCliF(ch.k)}
              >
                <span>{ch.label}</span>
              </button>
            ))}
          </div>

          <div className="cli-sort-wrap" ref={cliSortRef}>
            <button
              type="button"
              className={`cli-sort-btn${cliSortOpen ? ' open' : ''}`}
              onClick={() => setCliSortOpen(v => !v)}
              aria-haspopup="listbox"
              aria-expanded={cliSortOpen}
            >
              <svg className="cli-sort-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M6 12h12M9 18h6" />
              </svg>
              <span className="cli-sort-label">
                {currentSort.label}
              </span>
              <svg
                className={`cli-sort-arrow${cliSortOpen ? ' open' : ''}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {cliSortOpen && (
              <div className="cli-sort-pop" role="listbox">
                <div className="cli-pop-head">Ordenar clientes</div>
                {cliSortOptions.map(opt => {
                  const isSel = cliSort === opt.k;
                  return (
                    <button
                      key={opt.k}
                      type="button"
                      role="option"
                      aria-selected={isSel}
                      className={`cli-sort-opt${isSel ? ' is-sel' : ''}`}
                      onClick={() => {
                        setCliSort(opt.k);
                        setCliSortOpen(false);
                      }}
                    >
                      <div className="cli-opt-info">
                        <span className="cli-opt-title">{opt.label}</span>
                        <span className="cli-opt-sub">{opt.sub}</span>
                      </div>
                      {isSel && (
                        <span className="cli-opt-check">
                          <Icon name="check" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Tabela de Clientes Estilo Clean (Referência) */}
        {filteredClients.length === 0 ? (
          <div className="card" style={{ padding: '36px', textAlign: 'center', marginTop: '16px' }}>
            <p className="muted" style={{ fontSize: '1rem', margin: 0 }}>Nenhum cliente encontrado com estes filtros.</p>
          </div>
        ) : (
          <div className="cli-table-card">
            <div className="cli-table-wrap">
              <table className="cli-table">
                <thead>
                  <tr>
                    <th>Empresa</th>
                    <th>Contacto Principal</th>
                    <th style={{ textAlign: 'center' }}>Obras</th>
                    <th style={{ textAlign: 'center' }}>Cavaletes</th>
                    <th style={{ textAlign: 'center' }}>Fora Prazo</th>
                    <th>Estado</th>
                    <th style={{ width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map(c => {
                    return (
                      <tr
                        key={c.name}
                        onClick={() => openEmpresa(c.name)}
                      >
                        <td className="cli-td-empresa">
                          <b>{c.name}</b>
                          {c.info?.email && (
                            <a
                              href={`mailto:${c.info.email}`}
                              onClick={e => e.stopPropagation()}
                              title={c.info.email}
                            >
                              <Icon name="mail" />
                              <span>{c.info.email}</span>
                            </a>
                          )}
                        </td>

                        <td className="cli-td-contato">
                          {c.info?.resp ? <b>{c.info.resp}</b> : <span className="muted">—</span>}
                          {/\d/.test(c.info?.tel) && (
                            <a
                              href={`tel:+351${c.info.tel.replace(/\D/g, '')}`}
                              onClick={e => e.stopPropagation()}
                              title={c.info.tel}
                            >
                              <Icon name="phone" />
                              <span>{c.info.tel}</span>
                            </a>
                          )}
                        </td>

                        <td className="cli-td-num">
                          {c.obras.length}
                        </td>

                        <td className="cli-td-num">
                          {c.totalCav}
                        </td>

                        <td style={{ textAlign: 'center' }}>
                          {c.lateQ > 0 ? (
                            <span className="cli-tag-foraprazo">
                              <Icon name="alert" />
                              <span>{c.lateQ}</span>
                            </span>
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </td>

                        <td>
                          {c.lateQ > 0 ? (
                            <span className="cli-st-atraso">
                              Fora do prazo
                            </span>
                          ) : c.totalCav > 0 ? (
                            <span className="cli-st-emdia">
                              Em dia
                            </span>
                          ) : (
                            <span className="cli-st-vazio">Sem cavaletes</span>
                          )}
                        </td>

                        <td style={{ textAlign: 'right', paddingRight: '16px' }}>
                          <span className="cli-go-arrow">
                            <Icon name="right" />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ================= PÁGINA OBRAS =================
  if (obraId || page === 'obras') {
    // ---------------- FICHA DA OBRA ----------------
    if (obraId) {
      const o = obras.find(x => x.id === obraId);
      if (!o) return null;
      const r = resumo(o, movs);
      const hist = movs.filter(m => m.obraId === o.id).sort((a, b) => new Date(b.data) - new Date(a.data));

      const f = r.first;
      const st = r.total ? r.st : 'vazia';
      const col = r.total ? ST[st].color : 'var(--muted)';
      const used = f ? Math.min(1, Math.max(0, 1 - f.dias / PRAZO)) : 0;
      const prazoTxt = f
        ? f.dias < 0
          ? `Ultrapassado há ${-f.dias} dia${f.dias === -1 ? '' : 's'}`
          : f.dias === 0
            ? 'Termina hoje'
            : `Faltam ${f.dias} dia${f.dias === 1 ? '' : 's'}`
        : 'Sem cavaletes na obra';

      const nLots = r.lots.length;
      const nEmp = obras.filter(x => x.empresa === o.empresa).length;

      return (
        <>
          <button type="button" className="back" onClick={goBack}>
            <Icon name="left" />Voltar atrás
          </button>

          <div className="otabs">
            <button type="button" aria-current="page">
              <Icon name="obra" />Ficha da obra
            </button>
            <button type="button" onClick={() => openEmpresa(o.empresa)}>
              <Icon name="users" />Empresa: {o.empresa}
            </button>
          </div>

          <section className="ocard emp-unified-card">
            <div className="emp-uni-top">
              <div className="emp-uni-main">
                <div className="emp-meta-top">
                  <span className="emp-meta-loc">
                    <Icon name="pin" />
                    {o.morada}, {o.cidade} · {o.distrito}
                  </span>
                  <span className="emp-meta-dash">—</span>
                  <button
                    type="button"
                    className="emp-meta-link"
                    onClick={() => openEmpresa(o.empresa)}
                  >
                    <Icon name="users" />
                    {o.empresa}
                  </button>
                </div>

                <h1 className="oh-t">{o.nome}</h1>

                <div className="emp-contact-strip">
                  {o.contacto && (
                    <span className="emp-cs-item" title="Responsável">
                      <Icon name="user" />
                      <span>{o.contacto}</span>
                    </span>
                  )}
                  {/\d/.test(o.tel) && (
                    <>
                      {o.contacto && <span className="emp-cs-dot">·</span>}
                      <a
                        className="emp-cs-item"
                        target="_blank"
                        rel="noopener noreferrer"
                        href={`tel:+351${o.tel.replace(/\D/g, '')}`}
                        title="Telemóvel"
                      >
                        <Icon name="phone" />
                        <span>{o.tel}</span>
                      </a>
                    </>
                  )}
                  {o.email && (
                    <>
                      {(o.contacto || /\d/.test(o.tel)) && <span className="emp-cs-dot">·</span>}
                      <a className="emp-cs-item" href={`mailto:${o.email}`} title="Email">
                        <Icon name="mail" />
                        <span>{o.email}</span>
                      </a>
                    </>
                  )}
                </div>
              </div>

              <div className="oh-act">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => openModal({ type: 'nova', obraId: o.id, nums: [] })}
                >
                  <Icon name="plus" />Nova entrega
                </button>
                <button
                  type="button"
                  className="btn btn-ok"
                  onClick={() => {
                    if (!r.total) {
                      showToast('Esta obra não tem cavaletes para recolher.');
                      return;
                    }
                    openModal({ type: 'recolha', obraId: o.id, qty: r.total });
                  }}
                >
                  <Icon name="recolha" />Registar recolha
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() =>
                    openModal({
                      type: 'email',
                      obraId: o.id,
                      tpl: r.st === 'late' ? 'terminado' : 'amigavel',
                    })
                  }
                >
                  <Icon name="mail" />Enviar email
                </button>
              </div>
            </div>

            <div className="emp-uni-divider" />

            <div className="emp-uni-kpis obra-uni-kpis">
              <div className="emp-uni-kpi">
                <small>Cavaletes na obra</small>
                <span className="num">{fmtN(r.total)}</span>
              </div>
              <div className="emp-uni-kpi">
                <small>A caminho</small>
                <span className="num">{fmtN(r.transito || 0)}</span>
              </div>
            </div>

            {r.total > 0 && (
              <div className="emp-uni-prazos">
                <div className="emp-prazos-left">
                  <span className="emp-prazos-title">Distribuição dos prazos</span>
                  <span className="emp-prazos-bar">
                    {['ok', 'watch', 'soon', 'late'].map(k => {
                      const count = r.lots.filter(l => stFor(l.data, l.dias) === k).reduce((s, l) => s + l.qtd, 0);
                      return count ? (
                        <i key={k} style={{ flex: count, background: ST[k].color }} title={`${count} cavaletes`} />
                      ) : null;
                    })}
                  </span>
                </div>
                <div className="emp-prazos-legend">
                  {[
                    ['ok', '< 30 dias'],
                    ['watch', '30–50 d.'],
                    ['soon', '50–60 d.'],
                    ['late', 'Terminado'],
                  ].map(([k, l], idx) => (
                    <React.Fragment key={k}>
                      {idx > 0 && <span className="emp-prazos-sep">—</span>}
                      <span className="emp-prazos-legend-item">
                        <i style={{ background: ST[k].color }} />
                        <span>{l}</span>
                      </span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </section>

          {nLots > 0 && (
            <section className="ocard">
              <div className="oc-h">
                <div>
                  <h2>Prazos por entrega nesta obra</h2>
                  <p>As recolhas abatem primeiro no lote de entrega mais antigo.</p>
                </div>
              </div>
              <div className="cli-table-card" style={{ marginTop: '0' }}>
                <div className="cli-table-wrap">
                  <table className="cli-table">
                    <thead>
                      <tr>
                        <th>Guia</th>
                        <th>Data de entrega</th>
                        <th>Cavaletes na obra</th>
                        <th>Data limite</th>
                        <th>Dias restantes</th>
                        <th style={{ textAlign: 'right' }}>Situação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {r.lots.map(l => {
                        const s2 = stFor(l.data, l.dias);
                        return (
                          <tr key={l.mov.id}>
                            <td>{l.mov.guia}</td>
                            <td>{fmtSlashDate(l.data)}</td>
                            <td>
                              <b>{l.qtd} cavaletes</b>
                            </td>
                            <td>{fmtSlashDate(l.prazo)}</td>
                            <td style={{ color: ST[s2].color, fontWeight: 600 }}>
                              {diasTxt(l.dias).replace(/^./, c => c.toUpperCase())}
                            </td>
                            <td style={{ textAlign: 'right', color: ST[s2].color, fontWeight: 600 }}>
                              {ST[s2].label}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          <section className="ocard ohist-card">
            <div className="oc-h">
              <div>
                <h2>Histórico de movimentos da obra</h2>
                <p>Todas as guias de entrega e recolha registadas nesta obra.</p>
              </div>
            </div>

            <div className="cli-table-card ohist-table-card" style={{ marginTop: '0' }}>
              <div className="cli-table-wrap">
                <table className="cli-table ohist-table">
                  <thead>
                    <tr>
                      <th>Guia</th>
                      <th>Tipo</th>
                      <th>Data</th>
                      <th>Quantidade</th>
                      <th>Motorista</th>
                      <th>Assinatura / Estado</th>
                      <th style={{ width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {hist.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '32px' }}>
                          <p className="muted" style={{ margin: 0 }}>Nenhum movimento registado nesta obra.</p>
                        </td>
                      </tr>
                    ) : (
                      hist.map(m => {
                        const isE = m.tipo === 'entrega';
                        const motNome = m.motorista ? cleanPerson(m.motorista) : '—';
                        const assEst = m.tipo === 'recolha'
                          ? (m.estado === 'concluida'
                              ? 'Recolhida'
                              : m.estado === 'divergencia'
                              ? 'Divergência'
                              : m.estado === 'agendada'
                              ? 'Agendada'
                              : m.estado === 'por_atribuir'
                              ? 'Na logística'
                              : 'Pendente')
                          : m.assinatura
                          ? cleanPerson(m.assinatura)
                          : (m.estado === 'divergencia' ? 'Divergência' : 'Por assinar');

                        return (
                          <tr
                            key={m.id}
                            className="oh-trow"
                            onClick={() => openModal({ type: 'mov', id: m.id })}
                          >
                            <td>{m.guia}</td>
                            <td>
                              <span className={`oh-txt-tipo ${isE ? 'is-e' : 'is-r'}`}>
                                {isE ? 'Entrega' : 'Recolha'}
                              </span>
                            </td>
                            <td>{fmtSlashDate(m.data)}</td>
                            <td>{isE ? qEntregue(m) : m.qtd} cavaletes</td>
                            <td>{motNome}</td>
                            <td>{assEst}</td>
                            <td style={{ textAlign: 'right', width: '40px' }}>
                              <button
                                type="button"
                                className="oh-row-arrow"
                                onClick={e => {
                                  e.stopPropagation();
                                  openModal({ type: 'mov', id: m.id });
                                }}
                                aria-label="Ver detalhes"
                              >
                                <Icon name="right" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </>
      );
    }

    // ---------------- LISTA DE OBRAS / PASTAS ----------------
    const isFolderView = og !== 'todas' && !ogSel && !q.trim() && filtro === 'todas';

    const inGroup = o => {
      if (!ogSel || og === 'todas') return true;
      return og === 'distrito' ? o.distrito === ogSel : o.empresa === ogSel;
    };

    const normQ = norm(q.trim());
    const filteredList = obras
      .map(o => ({ o, r: resumo(o, movs) }))
      .filter(x => x.r.total > 0 || x.r.transito > 0)
      .filter(x => inGroup(x.o))
      .filter(x => filtro === 'todas' || x.r.st === filtro)
      .filter(x => !normQ || norm(x.o.nome + ' ' + x.o.empresa + ' ' + x.o.cidade + ' ' + x.o.distrito).includes(normQ))
      .sort((a, b) => (a.r.dias ?? 999) - (b.r.dias ?? 999));

    // Pastas por distrito ou empresa
    const keyFn = o => (og === 'distrito' ? o.distrito : o.empresa);
    const groups = {};
    obras.forEach(o => {
      const r = resumo(o, movs);
      if (!(r.total > 0 || r.transito > 0)) return;
      const k = keyFn(o);
      const g = (groups[k] = groups[k] || {
        n: 0,
        cav: 0,
        late: 0,
        lateObras: 0,
        seg: { late: 0, soon: 0, watch: 0, ok: 0 },
      });
      g.n++;
      g.cav += r.total;
      if (r.st in g.seg) g.seg[r.st] += r.total;
      if (r.st === 'late') {
        g.late += r.lateQ;
        g.lateObras++;
      }
    });
    const folderList = Object.entries(groups).sort(
      (a, b) => b[1].lateObras - a[1].lateObras || b[1].cav - a[1].cav
    );

    const chips = [
      ['todas', 'Todas'],
      ['late', 'Prazo terminado'],
      ['soon', '50–60 dias'],
      ['watch', '30–50 dias'],
      ['ok', '< 30 dias'],
    ];

    return (
      <>
        <div className="pagehead">
          <div>
            <h1 className="ph">
              <span className="phi"><Icon name="obra" /></span>
              <span>Obras</span>
            </h1>
          </div>
          <div className="actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => openModal({ type: 'nova', nums: [] })}
            >
              <Icon name="plus" />
              Nova entrega
            </button>
          </div>
        </div>

        <div className="toolbar">
          <label className="search" htmlFor="q">
            <Icon name="search" />
            <input
              id="q"
              type="search"
              placeholder="Procurar por obra, cliente ou cidade"
              value={q}
              onChange={e => {
                setQ(e.target.value);
                setMlim(10);
              }}
              aria-label="Procurar"
            />
          </label>
          <div className="ogseg" role="group" aria-label="Organizar por">
            {[
              ['distrito', 'pin', 'Por distrito'],
              ['empresa', 'obra', 'Por empresa'],
              ['todas', 'search', 'Todas as obras'],
            ].map(([k, iconName, label]) => (
              <button
                key={k}
                type="button"
                aria-pressed={og === k}
                onClick={() => {
                  setOg(k);
                  setOgSel(null);
                  setMlim(10);
                }}
              >
                <Icon name={iconName} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {isFolderView ? (
          <div className="folders" key={`${page}-${og}`}>
            {folderList.map(([k, g], i) => {
              const totFolder = Math.max(1, g.cav);
              return (
                <button
                  key={k}
                  type="button"
                  className="folder"
                  style={{ '--d': `${Math.min(i, 14) * 25}ms` }}
                  onClick={() => {
                    setOgSel(k);
                    setMlim(10);
                  }}
                >
                  <span className="sheet" />
                  <span className="sheet s2" />
                  <span className="front">
                    <span className="fh">
                      <b>{k}</b>
                      {g.lateObras > 0 && (
                        <span className="fbadge">
                          <Icon name="alert" />
                          {g.lateObras}
                        </span>
                      )}
                    </span>
                    <span className="fm">
                      <span className="num">{g.cav}</span> cavaletes
                    </span>
                    <span className="fs muted">
                      {g.n} obra{g.n > 1 ? 's' : ''}
                      {g.late > 0 && <> · <em>{g.late} fora do prazo</em></>}
                    </span>
                    <span className="fbar">
                      {['late', 'soon', 'watch', 'ok'].map(s =>
                        g.seg[s] ? (
                          <i
                            key={s}
                            style={{
                              width: `${(g.seg[s] / totFolder) * 100}%`,
                              background: ST[s].soft,
                            }}
                          />
                        ) : null
                      )}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <>
            <div className="obras-header-row">
              {ogSel && og !== 'todas' ? (
                <div className="crumb">
                  <button
                    type="button"
                    className="linkbtn"
                    onClick={() => {
                      setOgSel(null);
                      setMlim(10);
                    }}
                    title={og === 'distrito' ? 'Voltar aos distritos' : 'Voltar às empresas'}
                  >
                    <Icon name="left" />
                    <span>{og === 'distrito' ? 'Distritos' : 'Empresas'}</span>
                  </button>
                  <span className="crumb-sep">/</span>
                  <b className="crumb-title">{ogSel}</b>
                  {og === 'empresa' && (
                    <button
                      type="button"
                      className="empfull"
                      onClick={() => openEmpresa(ogSel)}
                    >
                      <Icon name="users" />
                      <span>Ver ficha completa da empresa</span>
                      <svg className="efa" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </button>
                  )}
                </div>
              ) : <div />}

              <div className="chips-seg" role="group" aria-label="Filtrar">
                {chips.map(([k, l]) => (
                  <button
                    key={k}
                    type="button"
                    className="chip"
                    aria-pressed={filtro === k}
                    onClick={() => {
                      setFiltro(k);
                      setMlim(10);
                    }}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div className="olist" id="olist">
              {filteredList.length === 0 ? (
                <div className="olist-empty">
                  <Icon name="search" />
                  <p>Nenhuma obra encontrada.</p>
                </div>
              ) : (
                filteredList.slice(0, mlim).map(({ o, r }) => (
                  <div
                    key={o.id}
                    className={`orow st-${r.st}`}
                    style={{ '--stripe': ST[r.st]?.color || '#10b981' }}
                    role="button"
                    tabIndex={0}
                    onClick={() => openObra(o.id)}
                  >
                    <div className="oleft">
                      <div className="oname-line">
                        <b className="oname">{o.nome}</b>
                      </div>
                      <div className="ometa">
                        <span
                          className="oemp"
                          role="button"
                          tabIndex={0}
                          title={`Ver empresa ${o.empresa}`}
                          onClick={e => {
                            e.stopPropagation();
                            openEmpresa(o.empresa);
                          }}
                        >
                          {o.empresa}
                        </span>
                        <span className="ometa-sep">·</span>
                        <span className="oloc">
                          <Icon name="pin" />
                          <span>{o.cidade || o.morada}</span>
                        </span>
                        {r.transito > 0 && (
                          <>
                            <span className="ometa-sep">·</span>
                            <span className="otrn">+{r.transito} a caminho</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="omid">
                      {r.first ? (
                        <div className="prazo">
                          <div className="bar" role="img" aria-label="Prazo">
                            <i
                              style={{
                                width: `${Math.max(4, Math.min(100, (1 - r.dias / PRAZO) * 100))}%`,
                                background: ST[r.st].color,
                              }}
                            />
                          </div>
                          <div className="prazo-meta">
                            <span className="prazo-txt" style={{ color: ST[r.st].color }}>
                              {diasTxt(r.dias).replace(/^./, c => c.toUpperCase())}
                            </span>
                            <span className="prazo-sep">·</span>
                            <span className="prazo-data">limite {fd(r.first.prazo)}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="prazo prazo-vazio">
                          <small>Sem cavaletes na obra</small>
                        </div>
                      )}
                    </div>

                    <div className="oright">
                      <div className="ocav-box">
                        <span className="onum num">{r.total}</span>
                        <span className="olbl">{r.total === 1 ? 'cavalete' : 'cavaletes'}</span>
                      </div>
                      <span className="chev" aria-hidden="true">
                        <Icon name="right" />
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {filteredList.length > mlim && (
              <div className="more" style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setMlim(l => l + 10)}
                >
                  <Icon name="plus" />
                  Ver mais obras ({filteredList.length - mlim} restantes)
                </button>
              </div>
            )}
          </>
        )}
      </>
    );
  }

  // ================= PÁGINA CAVALETES =================
  if (page === 'cavaletes') {
    const inv = inventario(obras, movs);
    const tipos = Object.entries(TIPOS_CAV);

    const cFab = inv.filter(x => x.estado === 'fabrica').length;
    const cObra = inv.filter(x => x.estado === 'obra').length;
    const cLate = inv.filter(x => x.estado === 'obra' && x.dias != null && x.dias < 0).length;
    const cCam = inv.filter(x => x.estado === 'caminho').length;

    const normCavQ = norm(cav.q.trim());
    const filteredCav = inv
      .filter(x => cav.tipo === 'todos' || x.tipo === cav.tipo)
      .filter(x => {
        if (cav.est === 'todos') return true;
        if (cav.est === 'fabrica') return x.estado === 'fabrica';
        if (cav.est === 'obra') return x.estado === 'obra';
        if (cav.est === 'caminho') return x.estado === 'caminho';
        if (cav.est === 'late') return x.estado === 'obra' && x.dias != null && x.dias < 0;
        return true;
      })
      .filter(x => {
        if (!normCavQ) return true;
        if (String(x.n).includes(normCavQ)) return true;
        if (TIPOS_CAV[x.tipo]?.nome && norm(TIPOS_CAV[x.tipo].nome).includes(normCavQ)) return true;
        const ob = x.obraId ? obras.find(o => o.id === x.obraId) : null;
        if (ob && norm(ob.nome + ' ' + ob.empresa + ' ' + ob.cidade).includes(normCavQ)) return true;
        return false;
      });

    return (
      <>
        <div className="pagehead">
          <div>
            <h1 className="ph">
              <span className="phi"><Icon name="cav" /></span>
              <span>Cavaletes</span>
            </h1>
          </div>
          <div className="actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => openModal({ type: 'nova', nums: [] })}
            >
              <Icon name="plus" />
              Nova entrega
            </button>
          </div>
        </div>

        {/* 3 Cards de Tipos de Cavalete */}
        <div className="tcards" key={page}>
          {tipos.map(([k, T]) => {
            const listT = inv.filter(x => x.tipo === k);
            const totalT = T.fim - T.ini + 1;
            const fabT = listT.filter(x => x.estado === 'fabrica').length;
            const obraT = listT.filter(x => x.estado === 'obra').length;
            const camT = listT.filter(x => x.estado === 'caminho').length;
            const lateT = listT.filter(x => x.estado === 'obra' && x.dias != null && x.dias < 0).length;

            return (
              <div
                key={k}
                className="tcard"
                role="button"
                tabIndex={0}
                aria-pressed={cav.tipo === k}
                onClick={() => setCav(s => ({ ...s, tipo: s.tipo === k ? 'todos' : k, lim: 20 }))}
              >
                <div className="th">
                  <span className={`tic t${k}`}>
                    <Icon name="cav" />
                  </span>
                  <div>
                    <b>{T.nome}</b>
                    <small>N.º {T.ini} – {T.fim}</small>
                  </div>
                  <span className="tt num">{totalT}</span>
                </div>

                <div className="tbar" role="img" aria-label={`Distribuição de ${T.nome}`}>
                  <i style={{ flex: fabT, background: 'var(--ok-bar, #9fceb5)' }} />
                  <i style={{ flex: obraT, background: 'var(--info-bar, #a7c0d9)' }} />
                  <i style={{ flex: camT, background: 'var(--warn-bar, #ecc285)' }} />
                </div>

                <div className="tleg">
                  <span>
                    <i style={{ background: 'var(--ok-bar, #9fceb5)', borderRadius: '50%' }} />
                    Fábrica <b>{fabT}</b>
                  </span>
                  <span>
                    <i style={{ background: 'var(--info-bar, #a7c0d9)', borderRadius: '50%' }} />
                    Obras <b>{obraT}</b>
                  </span>
                  <span>
                    <i style={{ background: 'var(--warn-bar, #ecc285)', borderRadius: '50%' }} />
                    A caminho <b>{camT}</b>
                  </span>
                </div>

                <div className={`tlate${lateT === 0 ? ' ok' : ''}`}>
                  <Icon name={lateT > 0 ? 'alert' : 'check'} />
                  <span>{lateT > 0 ? `${lateT} fora do prazo` : 'Nenhum fora do prazo'}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Card Principal: Todos os Cavaletes */}
        <section className="card" style={{ marginTop: '18px' }}>
          <div className="card-b" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 16px 0' }}>Todos os cavaletes</h2>

            {/* Barra de Pesquisa e Filtros na mesma linha */}
            <div className="toolbar" style={{ marginBottom: '18px' }}>
              <label className="search" htmlFor="cav-q">
                <Icon name="search" />
                <input
                  id="cav-q"
                  type="search"
                  placeholder="Procurar por número ou obra"
                  value={cav.q}
                  onChange={e => setCav(s => ({ ...s, q: e.target.value, lim: 20 }))}
                  aria-label="Procurar cavalete"
                />
              </label>

              <div className="ogseg" role="group" aria-label="Filtrar por estado">
                {[
                  ['todos', 'Todos', inv.length],
                  ['fabrica', 'Na fábrica', cFab],
                  ['obra', 'Em obra', cObra],
                  ['caminho', 'A caminho', cCam],
                  ['late', 'Fora do prazo', cLate],
                ].map(([k, l, count]) => (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={cav.est === k}
                    onClick={() => setCav(s => ({ ...s, est: k, lim: 20 }))}
                  >
                    <span>{l}</span>
                    <span className="n">{count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tabela de Cavaletes */}
            <div className="tablewrap">
              <table className="cavt">
                <thead>
                  <tr>
                    <th>N.º</th>
                    <th>Tipo</th>
                    <th>Estado</th>
                    <th>Onde está</th>
                    <th>Desde</th>
                    <th>Prazo</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCav.slice(0, cav.lim).map(c => {
                    const ob = c.obraId ? obras.find(o => o.id === c.obraId) : null;
                    const isLate = c.estado === 'obra' && c.dias !== null && c.dias < 0;

                    return (
                      <tr key={c.n}>
                        <td className="num" style={{ fontWeight: 600 }}>{c.n}</td>
                        <td className={`cav-tipo-${c.tipo}`} style={{ color: `var(--t${c.tipo})`, fontWeight: 600 }}>
                          {TIPOS_CAV[c.tipo]?.nome || c.tipo}
                        </td>
                        <td>
                          {c.estado === 'fabrica' ? (
                            <span className="pill tone-ok">Na fábrica</span>
                          ) : c.estado === 'caminho' ? (
                            <span className="pill tone-warn">A caminho</span>
                          ) : isLate ? (
                            <span className="pill tone-late">Fora do prazo</span>
                          ) : (
                            <span className="pill tone-info">Em obra</span>
                          )}
                        </td>
                        <td>
                          {ob ? (
                            <span>
                              <b>{ob.nome}</b> <span className="muted">· {ob.cidade}</span>
                            </span>
                          ) : (
                            <span className="muted">Fábrica de Mortágua</span>
                          )}
                        </td>
                        <td>{c.desde ? fd(c.desde) : '—'}</td>
                        <td>
                          {c.dias !== null ? (
                            <span style={{ color: isLate ? 'var(--late)' : 'var(--ok)', fontWeight: 500 }}>
                              {diasTxt(c.dias)}
                            </span>
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredCav.length > cav.lim && (
              <div className="more" style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setCav(s => ({ ...s, lim: s.lim + 20 }))}
                >
                  <Icon name="plus" />
                  Ver mais 20 cavaletes ({filteredCav.length - cav.lim} restantes)
                </button>
              </div>
            )}
          </div>
        </section>
      </>
    );
  }

  // ================= PÁGINA MAPA =================
  if (page === 'mapa') {
    const rs = obras.map(o => ({ o, r: resumo(o, movs) })).filter(x => x.r.total > 0);
    const dist = {};
    rs.forEach(({ o, r }) => {
      const d = dist[o.distrito] || (dist[o.distrito] = { n: 0, obras: 0, late: 0 });
      d.n += r.total;
      d.obras++;
      if (r.st === 'late') d.late += r.lateQ;
    });
    const distList = Object.entries(dist).sort((a, b) => b[1].n - a[1].n);
    const maxDist = distList.length > 0 ? distList[0][1].n : 1;

    const cnt = k => (k === 'todas' ? rs.length : rs.filter(x => x.r.st === k).length);
    const ch = [
      ['todas', 'Todas', '', ''],
      ['late', 'Terminado', 'var(--late)', '#ef3340'],
      ['soon', '50–60 dias', 'var(--warn)', '#f59e0b'],
      ['watch', '30–50 dias', 'var(--info)', '#3b82f6'],
      ['ok', '< 30 dias', 'var(--ok)', '#10b981'],
    ];

    return (
      <>
        <div className="pagehead">
          <div>
            <h1 className="ph">
              <span className="phi"><Icon name="pin" /></span>
              <span>Mapa Geográfico de Cavaletes</span>
            </h1>
          </div>
        </div>

        <div className="grid2 mapgrid">
          <section className="card">
            <div className="card-b" style={{ paddingTop: '16px' }}>
              <div className="mfbar">
                {ch.map(([k, l, colVar, dotCol]) => {
                  const on = mapf === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      className={`mfb${on ? ' on' : ''}`}
                      aria-pressed={on}
                      style={dotCol ? { '--c': colVar, '--d': dotCol } : {}}
                      onClick={() => setMapf(k)}
                    >
                      {dotCol && <i />}
                      {l}
                      {k === 'todas' && ` (${cnt(k)})`}
                    </button>
                  );
                })}
              </div>
              <MapaPortugal filter={mapf} noLegend />
            </div>
          </section>

          <section className="card">
            <div className="card-h">
              <h2>Por distrito</h2>
            </div>
            <div className="card-b">
              <div className="dlist">
                {distList.map(([d, v]) => (
                  <button
                    key={d}
                    type="button"
                    className="drow"
                    onClick={() => {
                      setPageState('obras');
                      setOg('distrito');
                      setOgSel(d);
                      setObraId(null);
                      setEmp(null);
                      window.scrollTo(0, 0);
                    }}
                  >
                    <span className="dn">
                      {d}
                      <small>
                        {v.obras} obra{v.obras > 1 ? 's' : ''}
                        {v.late > 0 && <> · <em>{v.late} fora do prazo</em></>}
                      </small>
                    </span>
                    <span className="num">{v.n}</span>
                    <span className="dbar">
                      <i style={{ width: `${((v.n / maxDist) * 100).toFixed(0)}%` }} />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      </>
    );
  }

  // ================= PÁGINA MOVIMENTOS / ENTREGAS =================
  if (page === 'entregas') {
    const getMovTime = d => {
      if (!d) return 0;
      if (d instanceof Date) return d.getTime();
      const dt = typeof d === 'string' ? parseIso(d) : new Date(d);
      return dt && !isNaN(dt.getTime()) ? dt.getTime() : 0;
    };

    const sortedMovs = [...movs].sort((a, b) => getMovTime(b.data) - getMovTime(a.data));

    return (
      <>
        <div className="pagehead">
          <div>
            <h1 className="ph">
              <span className="phi"><Icon name="truck" /></span>
              <span>Registo de Movimentos</span>
            </h1>
          </div>
          <div className="actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => openModal({ type: 'nova', nums: [] })}
            >
              <Icon name="plus" />Nova entrega
            </button>
          </div>
        </div>

        <section className="card">
          <div className="card-b">
            <div className="mlist">
              {sortedMovs.map(m => renderMovRow(m, obras, openModal, openObra, openEmpresa))}
            </div>
          </div>
        </section>
      </>
    );
  }

  // ================= PÁGINA ALERTAS =================
  if (page === 'alertas') {
    const rs = obras.map(o => ({ o, r: resumo(o, movs) })).filter(x => x.r.total > 0);
    const g = k => rs.filter(x => x.r.st === k).sort((a, b) => a.r.dias - b.r.dias);
    const difs = movs.filter(m => m.estado === 'divergencia');
    const peds = pedidos.filter(p => p.estado !== 'concluido');

    const sumQ = L => {
      const qTot = L.reduce((n, x) => n + (x.r.first?.qtd || 0), 0);
      return L.length ? `${fmtN(qTot)} cavaletes em ${L.length} obra${L.length > 1 ? 's' : ''}` : 'Nenhuma obra';
    };

    const nPend = peds.filter(p => p.estado === 'pendente').length;
    const nLog = peds.filter(p => p.estado === 'logistica').length;
    const nAg = peds.filter(p => p.estado === 'agendado').length;

    const lateList = g('late');
    const soonList = g('soon');
    const watchList = g('watch');

    const totalAlertas = difs.length + peds.length + lateList.length + soonList.length;

    const fmtSlashDate = d => {
      if (!d) return '—';
      const dt = d instanceof Date ? d : (typeof d === 'string' ? parseIso(d) : new Date(d));
      if (!dt || isNaN(dt.getTime())) return String(d);
      const day = String(dt.getDate()).padStart(2, '0');
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const y = dt.getFullYear();
      return `${day}/${m}/${y}`;
    };

    const groups = [
      {
        k: 'dif',
        dot: 'is-amber',
        t: `Diferenças nas Entregas (${difs.length})`,
        sub: `(Entregas com números que não batem certo por resolver)`,
        items: difs.map(m => {
          const o = obras.find(x => x.id === m.obraId);
          const distrito = o?.distrito || o?.cidade || '';
          const diffQtd = Math.abs(m.qtd - (m.qtdCli ?? m.qtd));
          return (
            <div key={m.id} className="al-card al-card-dif">
              <div className="al-card-main">
                <div className="al-card-row1">
                  <span className="al-card-obra">{o?.nome || 'Obra não encontrada'}</span>
                  {o?.empresa && (
                    <>
                      <span className="al-sep">-</span>
                      <span className="al-card-emp" onClick={() => o && openEmpresa(o.empresa)}>{o.empresa}</span>
                    </>
                  )}
                  {distrito && (
                    <>
                      <span className="al-sep">-</span>
                      <span className="al-card-distrito">{distrito}</span>
                    </>
                  )}
                  <span className="al-sep">·</span>
                  <span className="al-card-obra" style={{ fontWeight: 600, fontSize: '0.92rem' }}>Guia {m.guia}</span>
                </div>
                <div className="al-card-row2">
                  <span className="al-tag-soon">{diffQtd} cavalete{diffQtd > 1 ? 's' : ''} em falta</span>
                  <span className="al-sep">·</span>
                  <span>Vidraria: <b>{m.qtd}</b></span>
                  <span className="al-sep">·</span>
                  <span>Cliente: <b style={{ color: 'var(--warn)' }}>{m.qtdCli ?? '—'}</b></span>
                  <span className="al-sep">·</span>
                  <span className="al-limite">Data: {fmtSlashDate(m.data)}</span>
                  {m.motorista && (
                    <>
                      <span className="al-sep">·</span>
                      <span className="al-limite">Motorista: Sr. {m.motorista}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="al-card-actions">
                {o && (
                  <button
                    type="button"
                    className="btn-al-open"
                    onClick={() => openObra(o.id)}
                  >
                    Abrir ↗
                  </button>
                )}
                <button
                  type="button"
                  className="btn-al-action is-amber"
                  onClick={() => openModal({ type: 'resolver', id: m.id })}
                >
                  <Icon name="check" />
                  <span>Resolver diferença</span>
                </button>
              </div>
            </div>
          );
        }),
      },
      {
        k: 'ped',
        dot: 'is-blue',
        t: `Pedidos de Recolha (${peds.length})`,
        sub: `(Pedidos efetuados pelos clientes a aguardar recolha)`,
        items: peds.map(p => {
          const o = obras.find(x => x.id === p.obraId);
          const distrito = o?.distrito || o?.cidade || '';
          const isPend = p.estado === 'pendente';
          const isLog = p.estado === 'logistica';
          return (
            <div key={p.id} className="al-card al-card-ped">
              <div className="al-card-main">
                <div className="al-card-row1">
                  <span className="al-card-obra">{o?.nome || 'Obra'}</span>
                  {o?.empresa && (
                    <>
                      <span className="al-sep">-</span>
                      <span className="al-card-emp" onClick={() => o && openEmpresa(o.empresa)}>{o.empresa}</span>
                    </>
                  )}
                  {distrito && (
                    <>
                      <span className="al-sep">-</span>
                      <span className="al-card-distrito">{distrito}</span>
                    </>
                  )}
                </div>
                <div className="al-card-row2">
                  <span><b>{p.qtd}</b> cavaletes para recolha</span>
                  <span className="al-sep">·</span>
                  <span className="al-tag-info">{isPend ? 'Por marcar' : isLog ? 'Na logística (selecionar motorista)' : 'Agendada'}</span>
                  <span className="al-sep">·</span>
                  <span className="al-limite">Pedido {rel(p.data)}</span>
                </div>
              </div>
              <div className="al-card-actions">
                {o && (
                  <button
                    type="button"
                    className="btn-al-open"
                    onClick={() => openObra(o.id)}
                  >
                    Abrir ↗
                  </button>
                )}
                {isPend ? (
                  <button
                    type="button"
                    className="btn-al-action is-blue"
                    onClick={() => {
                      if (!p.guia) p.guia = 'GR-2026/' + (1400 + pedidos.indexOf(p) + 1);
                      openModal({ type: 'mrec', pid: p.id });
                    }}
                  >
                    <Icon name="cal" />
                    <span>Marcar recolha</span>
                  </button>
                ) : isLog ? (
                  <button
                    type="button"
                    className="btn-al-action is-dark"
                    onClick={() => openModal({ type: 'atrib', pid: p.id, movId: p.movId })}
                  >
                    <Icon name="truck" />
                    <span>Selecionar motorista</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-al-open"
                    onClick={() => window.print()}
                  >
                    <Icon name="print" />
                    <span>Imprimir guia</span>
                  </button>
                )}
              </div>
            </div>
          );
        }),
      },
      {
        k: 'late',
        dot: 'is-red',
        t: `Prazos Expirados — Urgente (${lateList.length})`,
        sub: `(Cavaletes há mais de 60 dias no cliente)`,
        items: lateList.map(({ o, r }) => {
          const distrito = o.distrito || o.cidade || '';
          const q = r.first?.qtd || r.total;
          return (
            <div key={o.id} className="al-card al-card-late">
              <div className="al-card-main">
                <div className="al-card-row1">
                  <span className="al-card-obra">{o.nome}</span>
                  <span className="al-sep">-</span>
                  <span className="al-card-emp" onClick={() => openEmpresa(o.empresa)}>{o.empresa}</span>
                  {distrito && (
                    <>
                      <span className="al-sep">-</span>
                      <span className="al-card-distrito">{distrito}</span>
                    </>
                  )}
                </div>
                <div className="al-card-row2">
                  <span><b>{q}</b> {q === 1 ? 'cavalete' : 'cavaletes'} na obra</span>
                  <span className="al-sep">·</span>
                  <span className="al-tag-late">Ultrapassado há {Math.abs(r.dias)} dias</span>
                  <span className="al-sep">·</span>
                  <span className="al-limite">Limite: {fmtSlashDate(r.first?.prazo)}</span>
                </div>
              </div>
              <div className="al-card-actions">
                <button
                  type="button"
                  className="btn-al-open"
                  onClick={() => openObra(o.id)}
                >
                  Abrir ↗
                </button>
                <button
                  type="button"
                  className="btn-al-action is-red"
                  onClick={() =>
                    openModal({
                      type: 'email',
                      obraId: o.id,
                      tpl: 'terminado',
                    })
                  }
                >
                  <Icon name="mail" />
                  <span>Preparar email</span>
                </button>
              </div>
            </div>
          );
        }),
      },
      {
        k: 'soon',
        dot: 'is-orange',
        t: `A Terminar — Próximos 30 Dias (${soonList.length})`,
        sub: `(Recomendado envio de lembrete com antecedência)`,
        items: soonList.map(({ o, r }) => {
          const distrito = o.distrito || o.cidade || '';
          const q = r.first?.qtd || r.total;
          return (
            <div key={o.id} className="al-card al-card-soon">
              <div className="al-card-main">
                <div className="al-card-row1">
                  <span className="al-card-obra">{o.nome}</span>
                  <span className="al-sep">-</span>
                  <span className="al-card-emp" onClick={() => openEmpresa(o.empresa)}>{o.empresa}</span>
                  {distrito && (
                    <>
                      <span className="al-sep">-</span>
                      <span className="al-card-distrito">{distrito}</span>
                    </>
                  )}
                </div>
                <div className="al-card-row2">
                  <span><b>{q}</b> {q === 1 ? 'cavalete' : 'cavaletes'} na obra</span>
                  <span className="al-sep">·</span>
                  <span className="al-tag-soon">Faltam {r.dias} dias para o limite</span>
                  <span className="al-sep">·</span>
                  <span className="al-limite">Limite: {fmtSlashDate(r.first?.prazo)}</span>
                </div>
              </div>
              <div className="al-card-actions">
                <button
                  type="button"
                  className="btn-al-open"
                  onClick={() => openObra(o.id)}
                >
                  Abrir ↗
                </button>
                <button
                  type="button"
                  className="btn-al-action is-dark"
                  onClick={() =>
                    openModal({
                      type: 'email',
                      obraId: o.id,
                      tpl: 'amigavel',
                    })
                  }
                >
                  <Icon name="mail" />
                  <span>Preparar email</span>
                </button>
              </div>
            </div>
          );
        }),
      },
      {
        k: 'watch',
        dot: 'is-slate',
        t: `Na Obra há 30 a 50 Dias (${watchList.length})`,
        sub: `(Monitorização e acompanhamento de rotina)`,
        items: watchList.map(({ o, r }) => {
          const distrito = o.distrito || o.cidade || '';
          const q = r.first?.qtd || r.total;
          return (
            <div key={o.id} className="al-card al-card-watch">
              <div className="al-card-main">
                <div className="al-card-row1">
                  <span className="al-card-obra">{o.nome}</span>
                  <span className="al-sep">-</span>
                  <span className="al-card-emp" onClick={() => openEmpresa(o.empresa)}>{o.empresa}</span>
                  {distrito && (
                    <>
                      <span className="al-sep">-</span>
                      <span className="al-card-distrito">{distrito}</span>
                    </>
                  )}
                </div>
                <div className="al-card-row2">
                  <span><b>{q}</b> {q === 1 ? 'cavalete' : 'cavaletes'} na obra</span>
                  <span className="al-sep">·</span>
                  <span className="al-tag-watch">Faltam {r.dias} dias para o limite</span>
                  <span className="al-sep">·</span>
                  <span className="al-limite">Limite: {fmtSlashDate(r.first?.prazo)}</span>
                </div>
              </div>
              <div className="al-card-actions">
                <button
                  type="button"
                  className="btn-al-open"
                  onClick={() => openObra(o.id)}
                >
                  Abrir ↗
                </button>
              </div>
            </div>
          );
        }),
      },
    ];

    return (
      <>
        <div className="pagehead">
          <div>
            <h1 className="ph">
              <span className="phi"><Icon name="bell" /></span>
              <span>Central de Alertas & Prazos</span>
            </h1>
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setPageState('definicoes');
              window.scrollTo(0, 0);
            }}
          >
            <Icon name="gear" />Emails automáticos
          </button>
        </div>

        {/* 4 Blocos Principais de Alerta (KPIs Visuais) */}
        <div className="alert-kpis">
          <div
            className="alert-kpi-card"
            style={{ '--kpi-color': 'var(--warn)', cursor: 'pointer' }}
            onClick={() => document.getElementById('sec-dif')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <div className="alert-kpi-head">
              <div className="alert-kpi-val-wrap">
                <span className="alert-kpi-icon tone-warn"><Icon name="diff" /></span>
                <span className="val num">{difs.length}</span>
              </div>
              <span className="pill tone-warn pill-sm">
                {difs.length > 0 ? 'Atenção' : 'OK'}
              </span>
            </div>
            <div className="alert-kpi-body">
              <span className="lbl">Diferenças</span>
              <span className="sub">Nas guias de entrega</span>
            </div>
          </div>

          <div
            className="alert-kpi-card"
            style={{ '--kpi-color': 'var(--info)', cursor: 'pointer' }}
            onClick={() => document.getElementById('sec-ped')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <div className="alert-kpi-head">
              <div className="alert-kpi-val-wrap">
                <span className="alert-kpi-icon tone-info"><Icon name="hand" /></span>
                <span className="val num">{peds.length}</span>
              </div>
              <span className="pill tone-info pill-sm">
                {nPend > 0 ? `${nPend} por marcar` : (nLog > 0 ? `${nLog} p/ motorista` : 'Em dia')}
              </span>
            </div>
            <div className="alert-kpi-body">
              <span className="lbl">Pedidos de Recolha</span>
              <span className="sub">
                {nPend > 0 ? `${nPend} por marcar` : ''}
                {nPend > 0 && nLog > 0 ? ' · ' : ''}
                {nLog > 0 ? `${nLog} a selecionar motorista` : (nPend === 0 ? 'Em dia' : '')}
              </span>
            </div>
          </div>

          <div
            className="alert-kpi-card"
            style={{ '--kpi-color': 'var(--late)', cursor: 'pointer' }}
            onClick={() => document.getElementById('sec-late')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <div className="alert-kpi-head">
              <div className="alert-kpi-val-wrap">
                <span className="alert-kpi-icon tone-late"><Icon name="alert" /></span>
                <span className="val num">{lateList.length}</span>
              </div>
              <span className="pill tone-late pill-sm">
                {lateList.length > 0 ? 'Crítico' : 'Zero'}
              </span>
            </div>
            <div className="alert-kpi-body">
              <span className="lbl">Prazos Expirados</span>
              <span className="sub">&gt; 60 dias no cliente</span>
            </div>
          </div>

          <div
            className="alert-kpi-card"
            style={{ '--kpi-color': '#d97706', cursor: 'pointer' }}
            onClick={() => document.getElementById('sec-soon')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <div className="alert-kpi-head">
              <div className="alert-kpi-val-wrap">
                <span className="alert-kpi-icon" style={{ background: '#fef3c7', color: '#d97706' }}><Icon name="clock" /></span>
                <span className="val num">{soonList.length}</span>
              </div>
              <span className="pill pill-sm" style={{ background: '#fef3c7', color: '#d97706' }}>
                Prevenção
              </span>
            </div>
            <div className="alert-kpi-body">
              <span className="lbl">A Terminar</span>
              <span className="sub">50 a 60 dias na obra</span>
            </div>
          </div>
        </div>

        {/* Lista de Grupos em Cards Elegantes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', marginTop: '12px' }}>
          {groups.map(grp => (
            <section key={grp.k} id={`sec-${grp.k}`} className="al-group">
              <div className="al-group-hd">
                <span className={`al-dot ${grp.dot}`} />
                <h3 className="al-group-title">{grp.t}</h3>
                {grp.sub ? <span className="al-group-sub">{grp.sub}</span> : null}
              </div>

              {grp.items.length === 0 ? (
                <div className="al-empty">
                  <Icon name="check" />
                  <span>Sem pendências nesta secção — tudo regularizado.</span>
                </div>
              ) : (
                <div className="al-cards-stack">
                  {grp.items}
                </div>
              )}
            </section>
          ))}
        </div>
      </>
    );
  }

  // ================= PÁGINA QR =================
  if (page === 'qr') {
    return (
      <>
        <div className="pagehead">
          <div>
            <p className="eyebrow">Fase 2 · opcional</p>
            <h1 className="ph">
              <span className="phi"><Icon name="qr" /></span>
              <span>Cada cavalete com o seu código</span>
            </h1>
          </div>
        </div>

        <section className="card qrhero">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '1.12rem' }}>
              Uma etiqueta resistente em cada cavalete, com um código QR e um número fácil de ler. O motorista aponta a câmara do telemóvel e fica registado <b>que cavalete</b> saiu, <b>para onde</b> e <b>quando</b>.
            </p>
            <p className="muted">
              Não é preciso comprar máquinas de picagem nem leitores: qualquer telemóvel lê o código. A Fase 1 (contagem com três confirmações) funciona sem etiquetas. Esta fase acrescenta o controlo cavalete a cavalete.
            </p>
          </div>

          <div className="sticker">
            <svg viewBox="0 0 21 21" shapeRendering="crispEdges" role="img" aria-label="Código QR de exemplo">
              <rect width="21" height="21" fill="#fff" />
              <path stroke="#000" d={QRPATH} />
            </svg>
            <div>
              <img className="brandline" src={IMG.logo} alt="Vidraria Mortágua" />
              <small>Cavalete duplo n.º</small>
              <b>3127</b>
              <small style={{ marginTop: '8px' }}>Propriedade da empresa. Devolver no prazo de 60 dias.</small>
            </div>
          </div>
        </section>

        <div className="compare">
          <div className="card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '4px' }}>Papel e Excel (hoje)</h3>
            <ul>
              <li><Icon name="x" /><span>O 5 escrito à mão parece um 8</span></li>
              <li><Icon name="x" /><span>Três folhas com números diferentes</span></li>
              <li><Icon name="x" /><span>Prazos contados à mão, obra a obra</span></li>
            </ul>
          </div>
          <div className="card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '4px' }}>Máquina de picagem</h3>
            <ul>
              <li><Icon name="x" /><span>Equipamento próprio para comprar e manter</span></li>
              <li><Icon name="x" /><span>Só lê onde a máquina está</span></li>
              <li><Icon name="check" style={{ color: 'var(--ok)' }} /><span>Acaba com os erros de escrita</span></li>
            </ul>
          </div>
          <div className="card best">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '4px' }}>Etiqueta QR + telemóvel</h3>
            <ul>
              <li><Icon name="check" style={{ color: 'var(--ok)' }} /><span>Usa o telemóvel que todos já têm</span></li>
              <li><Icon name="check" style={{ color: 'var(--ok)' }} /><span>Funciona na fábrica e em qualquer obra</span></li>
              <li><Icon name="check" style={{ color: 'var(--ok)' }} /><span>Data, hora e motorista registados sozinhos</span></li>
            </ul>
          </div>
        </div>

        <section className="card qrsearch">
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0 }}>Experimente: procurar um cavalete</h3>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                border: '1.5px solid var(--line)',
                borderRadius: '12px',
                padding: '0 16px',
                background: 'var(--surface)',
                minHeight: '48px',
              }}
            >
              <Icon name="scan" style={{ width: '20px', height: '20px', color: 'var(--muted)', flexShrink: 0 }} />
              <input
                type="text"
                value={qrBusca}
                onChange={(e) => setQrBusca(e.target.value)}
                placeholder="Número do cavalete..."
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  width: '100%',
                  fontSize: '1rem',
                  color: 'var(--ink)',
                }}
              />
            </div>
            <button
              type="button"
              className="btn btn-primary"
              style={{
                borderRadius: '12px',
                padding: '0 24px',
                minHeight: '48px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.95rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              <Icon name="search" />
              <span>Procurar</span>
            </button>
          </div>

          <div className="qrsearch-grid">
            <div
              style={{
                border: '1px solid var(--line)',
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                background: 'var(--surface)',
              }}
            >
              <div>
                <small style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                  CAVALETE DUPLO N.º 3127
                </small>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '6px 0 2px', color: 'var(--ink)' }}>
                  Pavilhão industrial Horizonte
                </h4>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--muted)' }}>
                  Serralharia Fonseca · Faro
                </p>
              </div>

              <div>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#e0f2fe',
                    color: '#0284c7',
                    padding: '4px 12px',
                    borderRadius: '999px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}
                >
                  <Icon name="clock" style={{ width: '15px', height: '15px' }} />
                  A acompanhar
                </span>
              </div>

              <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--ink)' }}>
                Na obra desde <b>15 set. 2026</b> · faltam 16 dias
              </p>

              <div>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => openObra('o13')}
                  style={{
                    borderRadius: '10px',
                    padding: '8px 16px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                  }}
                >
                  <span>Abrir obra</span>
                  <Icon name="right" style={{ width: '14px', height: '14px' }} />
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '6px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: '#e0f2fe',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon name="scan" style={{ width: '20px', height: '20px' }} />
                </div>
                <div>
                  <b style={{ display: 'block', fontSize: '0.95rem', color: 'var(--ink)' }}>Lido na entrega</b>
                  <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>15 set. 2026 · Faro</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: '#dcfce7',
                    color: '#16a34a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon name="factory" style={{ width: '20px', height: '20px' }} />
                </div>
                <div>
                  <b style={{ display: 'block', fontSize: '0.95rem', color: 'var(--ink)' }}>Voltou à fábrica</b>
                  <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>6 jun. 2026 · Mortágua</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: '#f1f5f9',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon name="scan" style={{ width: '20px', height: '20px' }} />
                </div>
                <div>
                  <b style={{ display: 'block', fontSize: '0.95rem', color: 'var(--ink)' }}>Lido na entrega anterior</b>
                  <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>25 mar. 2026 · Edifício Mondego</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }

  // ================= PÁGINA DEFINIÇÕES =================
  if (page === 'definicoes') {
    const rs = obras.map(o => ({ o, r: resumo(o, movs) })).filter(x => x.r.total > 0);
    const autoCount = rs.filter(({ r }) => {
      const d = r.dias;
      return (
        (auto.d30 && d > 15 && d <= 22) ||
        (auto.d7 && d > 7 && d <= 14) ||
        (auto.d0 && d >= 0 && d <= 7) ||
        (auto.sem && d < 0)
      );
    }).length;

    const chk = (
      <svg className="dck" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m5 12 5 5 9-10" />
      </svg>
    );

    return (
      <>
        <div className="pagehead">
          <div>
            <h1 className="ph">
              <span className="phi"><Icon name="gear" /></span>
              <span>Definições</span>
            </h1>
          </div>
        </div>

        <div className="defs">
          {/* 1. Tamanho do texto */}
          <section className="dsec">
            <div className="dsh">
              <span className="dsi"><Icon name="txt" /></span>
              <div>
                <h2>Tamanho do Texto (Acessibilidade)</h2>
                <p>Ajusta a dimensão da tipografia em todo o escritório para facilitar a leitura diária.</p>
              </div>
            </div>
            <div className="dsb">
              <div className="dgrid3">
                <button
                  type="button"
                  className={`dtile${osize === 'n' ? ' on' : ''}`}
                  aria-pressed={osize === 'n'}
                  onClick={() => setOsize('n')}
                >
                  <span className="dtt">
                    <b>Normal</b>
                    <small>Padrão do sistema</small>
                  </span>
                  {osize === 'n' && chk}
                </button>
                <button
                  type="button"
                  className={`dtile${osize === 'l' ? ' on' : ''}`}
                  aria-pressed={osize === 'l'}
                  onClick={() => setOsize('l')}
                >
                  <span className="dtt">
                    <b style={{ fontSize: '1.12em' }}>Grande</b>
                    <small>Leitura confortável</small>
                  </span>
                  {osize === 'l' && chk}
                </button>
                <button
                  type="button"
                  className={`dtile${osize === 'xl' ? ' on' : ''}`}
                  aria-pressed={osize === 'xl'}
                  onClick={() => setOsize('xl')}
                >
                  <span className="dtt">
                    <b style={{ fontSize: '1.25em' }}>Muito grande</b>
                    <small>Visibilidade reforçada</small>
                  </span>
                  {osize === 'xl' && chk}
                </button>
              </div>
            </div>
          </section>

          {/* 2. Aparência do ambiente */}
          <section className="dsec">
            <div className="dsh">
              <span className="dsi"><Icon name="sun" /></span>
              <div>
                <h2>Aparência do Ambiente</h2>
                <p>Escolha o tema de cores visual adequado à luminosidade do seu posto de trabalho.</p>
              </div>
            </div>
            <div className="dsb">
              <div className="dgrid3">
                <button
                  type="button"
                  className={`dtile${theme === 'light' ? ' on' : ''}`}
                  aria-pressed={theme === 'light'}
                  onClick={() => setTheme('light')}
                >
                  <span className="dti"><Icon name="sun" /></span>
                  <span className="dtt">
                    <b>Claro</b>
                    <small>Fundo branco e contraste</small>
                  </span>
                  {theme === 'light' && chk}
                </button>
                <button
                  type="button"
                  className={`dtile${theme === 'dark' ? ' on' : ''}`}
                  aria-pressed={theme === 'dark'}
                  onClick={() => setTheme('dark')}
                >
                  <span className="dti"><Icon name="moon" /></span>
                  <span className="dtt">
                    <b>Escuro</b>
                    <small>Menor fadiga ocular</small>
                  </span>
                  {theme === 'dark' && chk}
                </button>
                <button
                  type="button"
                  className={`dtile${theme === 'auto' ? ' on' : ''}`}
                  aria-pressed={theme === 'auto'}
                  onClick={() => setTheme('auto')}
                >
                  <span className="dti"><Icon name="monitor" /></span>
                  <span className="dtt">
                    <b>Automático</b>
                    <small>Conforme o sistema operativo</small>
                  </span>
                  {theme === 'auto' && chk}
                </button>
              </div>
            </div>
          </section>

          {/* 3. Emails automáticos */}
          <section className="dsec">
            <div className="dsh">
              <span className="dsi"><Icon name="mail" /></span>
              <div>
                <h2>Emails Automáticos</h2>
                <p>Escolha quando o sistema envia sozinho um lembrete ao cliente. Pode sempre ler e alterar o texto antes.</p>
              </div>
            </div>
            <div className="dsb">
              <div className="dsw">
                {[
                  ['d30', '15 dias antes', 'Lembrete amigável de aproximação ao fim do prazo'],
                  ['d7', '7 dias antes', 'Pede uma data de recolha'],
                  ['d0', 'No dia em que termina', 'Aviso de prazo terminado'],
                  ['sem', 'Todas as semanas depois', 'Até os cavaletes voltarem'],
                ].map(([k, tTitle, sDesc]) => (
                  <label key={k} className="switch">
                    <span>
                      <b style={{ display: 'block' }}>{tTitle}</b>
                      <span className="muted" style={{ fontSize: '0.9rem' }}>{sDesc}</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={auto[k]}
                      onChange={e => setAuto(prev => ({ ...prev, [k]: e.target.checked }))}
                      aria-label={tTitle}
                    />
                  </label>
                ))}
              </div>
              <div className="note" style={{ marginTop: '16px' }}>
                <Icon name="info" />
                <span>Esta semana seguem <b>{autoCount} emails automáticos</b>. Recebe uma cópia de cada um.</span>
              </div>
            </div>
          </section>

          {/* 4. Conta */}
          <section className="dsec">
            <div className="dsh">
              <span className="dsi"><Icon name="user" /></span>
              <div>
                <h2>Conta</h2>
                <p>Os seus dados de sessão no escritório da Vidraria Mortágua.</p>
              </div>
            </div>
            <div className="dsb">
              <div className="dgrid3">
                <div className="dtile ro">
                  <span className="dtt">
                    <small>Nome e Perfil</small>
                    <b>{currentUser} · Escritório</b>
                  </span>
                </div>
                <div className="dtile ro">
                  <span className="dtt">
                    <small>Email de Trabalho</small>
                    <b>{currentUser.toLowerCase().replace(/[^a-z]/g, '')}@vidrariamortagua.pt</b>
                  </span>
                </div>
                <div className="dtile ro">
                  <span className="dtt">
                    <small>Telemóvel</small>
                    <b>{currentUser === 'Cristiana' ? '912 000 302' : '912 000 303'}</b>
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </>
    );
  }

  return null;
}

function renderMovRow(m, obras, openModal, openObra, openEmpresa) {
  const o = obras.find(x => x.id === m.obraId);
  const isE = m.tipo === 'entrega';

  // Ícones da imagem enviada pelo utilizador:
  // Entrega: fundo azul claro, seta diagonal para cima à direita (↗)
  // Recolha: fundo verde claro, seta diagonal para baixo à esquerda (↙)
  const movIcon = isE ? (
    <span className="mov-ico-pill is-ent" title="Entrega">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
        <line x1="7" y1="17" x2="17" y2="7" />
        <polyline points="7 7 17 7 17 17" />
      </svg>
    </span>
  ) : (
    <span className="mov-ico-pill is-rec" title="Recolha">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
        <line x1="17" y1="7" x2="7" y2="17" />
        <polyline points="17 17 7 17 7 7" />
      </svg>
    </span>
  );

  const motText = m.motorista ? `Sr. ${cleanPerson(m.motorista)}` : 'Sem motorista';

  // No meio do card: as 3 confirmações
  const middleConfirmations = isE ? (
    <div className="steps3">
      <span className="st done">
        <span className="c"><Icon name="check" /></span>Vidraria {m.qtd}
      </span>
      <span className={`st ${m.qtdMot != null ? 'done' : ''}`}>
        <span className="c">{m.qtdMot != null && <Icon name="check" />}</span>
        Motorista{m.qtdMot != null ? ' ' + m.qtdMot : ''}
      </span>
      <span className={`st ${m.estado === 'divergencia' ? 'bad' : m.estado === 'entregue' ? 'done' : ''}`}>
        <span className="c">
          {m.estado === 'divergencia' ? <Icon name="alert" /> : m.estado === 'entregue' ? <Icon name="check" /> : null}
        </span>
        Cliente{m.qtdCli != null ? ' ' + m.qtdCli : ''}
      </span>
    </div>
  ) : (
    <div className="steps3">
      <span className={`st ${m.estado === 'concluida' ? 'done' : ''}`}>
        <span className="c">{m.estado === 'concluida' ? <Icon name="check" /> : <Icon name="clock" />}</span>
        {m.estado === 'concluida' ? `Recolhidos ${m.qtd}` : `A recolher ${m.qtd}`}
      </span>
    </div>
  );

  // Na direita: tag tipo "entregue", "Na logística", "a caminho" etc
  const statusTag = () => {
    switch (m.estado) {
      case 'entregue':
        return <span className="mov-status-tag is-ok"><Icon name="check" />Entregue</span>;
      case 'concluida':
        return <span className="mov-status-tag is-ok"><Icon name="check" />Recolhida</span>;
      case 'por_atribuir':
        return <span className="mov-status-tag is-warn"><Icon name="clock" />Na logística</span>;
      case 'em_viagem':
        return <span className="mov-status-tag is-info"><Icon name="truck" />A caminho</span>;
      case 'agendada':
        return <span className="mov-status-tag is-info"><Icon name="cal" />Marcada</span>;
      case 'divergencia':
        return <span className="mov-status-tag is-bad"><Icon name="alert" />Divergência</span>;
      case 'pendente':
        return <span className="mov-status-tag is-warn"><Icon name="clock" />Pedido pendente</span>;
      default:
        return <span className="mov-status-tag is-mut">{m.estado || 'Pendente'}</span>;
    }
  };

  const dtStr = formatMovDate(m.data);

  return (
    <div
      key={m.id}
      className={`mrow ${isE ? 'is-ent' : 'is-rec'}`}
      onClick={() => openModal({ type: 'mov', id: m.id })}
    >
      <div className="mrow-left">
        {movIcon}
        <div className="mrow-info">
          <div className="mrow-line1">
            <b className="mrow-guia">{m.guia}</b>
            {m.data && (
              <>
                <span className="mrow-sep">·</span>
                <span className="mrow-date">{dtStr}</span>
              </>
            )}
            <span className="mrow-sep">·</span>
            <span className="mrow-mot">{motText}</span>
          </div>
          <div className="mrow-line2">
            <button
              type="button"
              className="mrow-obra-link"
              onClick={e => {
                e.stopPropagation();
                if (o) openObra(o.id);
              }}
            >
              {o?.nome || 'Obra sem nome'}
            </button>
            {o?.empresa && (
              <>
                <span className="mrow-sep">-</span>
                <span
                  className="mrow-emp"
                  onClick={e => {
                    e.stopPropagation();
                    if (o) openEmpresa(o.empresa);
                  }}
                >
                  {o.empresa}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mrow-mid">
        {middleConfirmations}
      </div>

      <div className="mrow-right">
        {statusTag()}
      </div>
    </div>
  );
}
