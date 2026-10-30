'use client';

import React, { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { Icon } from '../data/icons';
import {
  TODAY,
  DIAS,
  FROTA,
  TIPOS_CAV,
  MESES_L,
  fdl,
  fd,
  isoD,
  addDays,
} from '../data/constants';
import {
  totals,
  resumo,
  inventario,
  clientesStats,
  atividade,
  cliPessoas,
  mesesTxt,
  iniciais,
  norm,
  esc,
  fmtN,
  fmtEUR,
  rel,
  resLists,
  tipoDe,
  parseIso,
} from '../data/logic';
import MapaPortugal from './MapaPortugal';
import EscritorioView from './EscritorioView';

export default function AdminView() {
  const {
    page,
    setPageState,
    setObraId,
    openEmpresa,
    setOg,
    setOgSel,
    setFiltro,
    setQ,
    obras,
    movs,
    pedidos,
    lembretes,
    auto,
    fin,
    updateFinanca,
    af,
    setAf,
    alim,
    setAlim,
    pq,
    setPq,
    plim,
    setPlim,
    motoristasList,
    staffList,
    acessoMap,
    toggleAcesso,
    openModal,
    currentUser,
  } = useDashboard();

  const [ar, setAr] = useState({ k: '30', open: false, m: null, de: null, ate: null });
  const [aq, setAq] = useState('');

  const t = totals(obras, movs);
  const inv = inventario(obras, movs);

  const invCounts = () => {
    const c = { fab: 0, cam: 0, ok: 0, late: 0 };
    inv.forEach(x => {
      if (x.estado === 'fabrica') c.fab++;
      else if (x.estado === 'caminho') c.cam++;
      else if (x.dias < 0) c.late++;
      else c.ok++;
    });
    c.inv = inv;
    return c;
  };
  const c = invCounts();

  const ageBar = d => {
    const w = Math.min(100, (d / 80) * 100);
    const col = d > 60 ? 'var(--late)' : d > 50 ? 'var(--warn)' : d > 30 ? 'var(--info)' : 'var(--ok)';
    return (
      <span className="agebar">
        <i style={{ width: `${w}%`, background: col }} />
        <b style={{ left: `${(60 / 80) * 100}%` }} />
      </span>
    );
  };

  const rankList = (L, start) => (
    <div className="rlist">
      {L.map((e, i) => (
        <div key={e.emp} className="rrow">
          <span className={`rk${start + i <= 3 ? ' top' : ''}`}>{start + i}</span>
          <div className="rt">
            <b>{e.emp}</b>
            <span>
              {e.obras} obra{e.obras > 1 ? 's' : ''} · {fmtN(e.q)} cavaletes
              {e.late > 0 && <> · <em>{fmtN(e.late)} fora do prazo</em></>}
            </span>
          </div>
          <div className="rv">
            {ageBar(e.avg)}
            <span><b>{mesesTxt(e.avg)}</b> em média</span>
          </div>
        </div>
      ))}
    </div>
  );

  // ================= PÁGINA PAINEL =================
  if (page === 'inicio') {
    const okNoPrazo = Math.max(0, t.emObra - t.late);
    const parts = [
      { l: 'Na fábrica', v: t.fabrica, col: 'var(--ok)' },
      { l: 'Em obra, dentro do prazo', v: okNoPrazo, col: 'var(--info)' },
      { l: 'Em obra, fora do prazo', v: t.late, col: 'var(--late)' },
      { l: 'A caminho', v: t.transito, col: 'var(--warn)' },
    ];

    const tipos = Object.entries(TIPOS_CAV).map(([k, T]) => {
      const L = c.inv.filter(x => x.tipo === k);
      return { k, T, n: L.length, fab: L.filter(x => x.estado === 'fabrica').length };
    });

    const topClientes = clientesStats(obras, movs).slice(0, 5);

    // Donut SVG
    const donutR = 70;
    const donutC = 2 * Math.PI * donutR;
    const validParts = parts.filter(p => p.v > 0);
    let accumAngle = 0;
    const slices = validParts.map(p => {
      const pct = p.v / (FROTA || 1);
      const len = pct * donutC;
      const angle = accumAngle;
      accumAngle += pct * 360;
      const g = validParts.length > 1 ? Math.min(3.5, len * 0.15) : 0;
      return {
        ...p,
        angle,
        dash: Math.max(0, len - g),
      };
    });

    return (
      <div key={`adm-${page}`} className="admin-page-anim">
        <div className="pagehead home">
          <div>
            <p className="date">{DIAS[TODAY.getDay()]}, {fdl(TODAY)}</p>
            <h1 className="ph">
              <span className="phi"><Icon name="home" /></span>
              <span>{new Date().getHours() < 13 ? 'Bom dia' : new Date().getHours() < 20 ? 'Boa tarde' : 'Boa noite'}, Sr. Nuno</span>
            </h1>
          </div>
        </div>

        <div className="kpis">
          <div className="kpi">
            <span className="top"><Icon name="factory" />Na fábrica</span>
            <span className="kvr">
              <span className="v num">{fmtN(t.fabrica)}</span>
              <small>de {fmtN(FROTA)}</small>
            </span>
          </div>
          <button
            type="button"
            className="kpi"
            onClick={() => {
              setPageState('obras');
              window.scrollTo(0, 0);
            }}
          >
            <span className="top"><Icon name="obra" />Em obras</span>
            <span className="kvr">
              <span className="v num">{fmtN(t.emObra)}</span>
              <small>{obras.filter(o => resumo(o, movs).total > 0).length} obras</small>
            </span>
          </button>
          <div className="kpi">
            <span className="top"><Icon name="truck" />A caminho</span>
            <span className="kvr">
              <span className="v num">{fmtN(t.transito)}</span>
              <small>por confirmar</small>
            </span>
          </div>
          <button
            type="button"
            className="kpi late"
            onClick={() => {
              setPageState('obras');
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
              <h2>Onde estão os cavaletes</h2>
            </div>
            <div className="card-b">
              <div className="dwrap">
                <svg viewBox="0 0 180 180" className="donut" role="img" aria-label="Distribuição dos cavaletes">
                  <circle r={donutR} cx="90" cy="90" fill="none" stroke="var(--surface-2)" strokeWidth="22" />
                  {slices.map(s => (
                    <circle
                      key={s.l}
                      r={donutR}
                      cx="90"
                      cy="90"
                      fill="none"
                      stroke={s.col}
                      strokeWidth="22"
                      strokeDasharray={`${s.dash.toFixed(2)} ${donutC.toFixed(2)}`}
                      strokeDashoffset="0"
                      transform={`rotate(${(s.angle - 90).toFixed(2)} 90 90)`}
                    >
                      <title>{s.l}: {fmtN(s.v)} ({Math.round((s.v / FROTA) * 100)}%)</title>
                    </circle>
                  ))}
                  <text x="90" y="86" textAnchor="middle" className="dn-v">{fmtN(FROTA)}</text>
                  <text x="90" y="106" textAnchor="middle" className="dn-l">cavaletes</text>
                </svg>

                <div className="dleg">
                  {parts.map(p => (
                    <div key={p.l} className="dl">
                      <i style={{ background: p.col }} />
                      <span>{p.l}</span>
                      <b className="num">{fmtN(p.v)}</b>
                      <small>{Math.round((p.v / FROTA) * 100)}%</small>
                    </div>
                  ))}
                </div>
              </div>

              <div className="dtipos">
                {tipos.map(x => (
                  <div key={x.k}>
                    <div className="dth">
                      <span className={`tdot t-${x.k}`} />
                      <b>{x.T.nome}</b>
                      <span className="muted">{fmtN(x.fab)} livres de {fmtN(x.n)}</span>
                    </div>
                    <span className="dtb">
                      <i style={{ width: `${(x.fab / x.n) * 100}%` }} />
                    </span>
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
      </div>
    );
  }

  // ================= PÁGINA OBRAS =================
  if (page === 'obras') {
    return <EscritorioView />;
  }

  // ================= PÁGINA MAPA =================
  if (page === 'mapa') {
    return <EscritorioView />;
  }

  // ================= PÁGINA CLIENTES =================
  if (page === 'clientes') {
    const L = clientesStats(obras, movs);
    const bons = L.slice().sort((a, b) => a.avg - b.avg).slice(0, 5);
    const lateE = L.filter(e => e.late > 0).length;
    const avgAll = Math.round(
      L.reduce((n, e) => n + e.avg * e.q, 0) / L.reduce((n, e) => n + e.q, 0)
    );

    return (
      <div key={`adm-${page}`} className="admin-page-anim">
        <div className="pagehead">
          <div>
            <h1 className="ph">
              <span className="phi"><Icon name="rank" /></span>
              <span>Clientes</span>
            </h1>
          </div>
        </div>

        <div className="kpis k3">
          <div className="kpi">
            <span className="top"><Icon name="user" />Clientes com cavaletes</span>
            <span className="kvr"><span className="v num">{L.length}</span></span>
          </div>
          <div className="kpi">
            <span className="top"><Icon name="clock" />Tempo médio em obra</span>
            <span className="kvr"><span className="v num">{mesesTxt(avgAll)}</span></span>
          </div>
          <div className="kpi late">
            <span className="top"><Icon name="alert" />Com cavaletes fora do prazo</span>
            <span className="kvr"><span className="v num">{lateE}</span><small>clientes</small></span>
          </div>
        </div>

        <div className="grid2" style={{ marginTop: '18px' }}>
          <section className="card">
            <div className="card-h">
              <h2><Icon name="alert" /> Os que mais demoram</h2>
            </div>
            <div className="card-b">{rankList(L.slice(0, 5), 1)}</div>
          </section>

          <section className="card">
            <div className="card-h">
              <h2><Icon name="check" /> Os mais cumpridores</h2>
            </div>
            <div className="card-b">
              <div className="rlist">
                {bons.map((e, i) => (
                  <div key={e.emp} className="rrow">
                    <span className="rk good">{i + 1}</span>
                    <div className="rt">
                      <b>{e.emp}</b>
                      <span>{e.obras} obra{e.obras > 1 ? 's' : ''} · {fmtN(e.q)} cavaletes</span>
                    </div>
                    <div className="rv">
                      {ageBar(e.avg)}
                      <span><b>{mesesTxt(e.avg)}</b> em média</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <section className="card" style={{ marginTop: '18px' }}>
          <div className="card-h">
            <h2>Ranking completo</h2>
            <span className="muted" style={{ fontSize: '0.85rem' }}>
              Ordenado pelo tempo médio que os cavaletes ficam na obra · a linha marca os 6 meses
            </span>
          </div>
          <div className="card-b">
            <div className="tablewrap">
              <table className="cavt rtab">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Cliente</th>
                    <th>Obras</th>
                    <th>Em obra</th>
                    <th>Fora do prazo</th>
                    <th>Maior atraso</th>
                    <th>Tempo médio em obra</th>
                  </tr>
                </thead>
                <tbody>
                  {L.map((e, i) => (
                    <tr
                      key={e.emp}
                      className="click"
                      onClick={() => {
                        if (openEmpresa) {
                          openEmpresa(e.emp);
                        } else {
                          setPageState('obras');
                          setOg('empresa');
                          setOgSel(e.emp);
                          setFiltro('todas');
                          setQ('');
                          setObraId(null);
                        }
                        window.scrollTo(0, 0);
                      }}
                    >
                      <td data-l="#"><span className={`rk${i < 3 ? ' top' : ''}`}>{i + 1}</span></td>
                      <td data-l="Cliente"><b>{e.emp}</b></td>
                      <td data-l="Obras" className="num">{e.obras}</td>
                      <td data-l="Em obra" className="num">{fmtN(e.q)}</td>
                      <td data-l="Fora do prazo">
                        {e.late > 0 ? (
                          <span className="pill tone-late">{fmtN(e.late)} · {e.pct}%</span>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td data-l="Maior atraso">{e.maxLate ? `${e.maxLate} dias` : '—'}</td>
                      <td data-l="Tempo médio">
                        <div className="rv">
                          {ageBar(e.avg)}
                          <span><b>{mesesTxt(e.avg)}</b></span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ================= PÁGINA FINANCEIRO =================
  if (page === 'financeiro') {
    const val = x => fin.v[x.tipo] || 0;
    const totVal = c.inv.reduce((n, x) => n + val(x), 0);
    const emObraVal = c.inv.filter(x => x.estado === 'obra').reduce((n, x) => n + val(x), 0);
    const riscoVal = c.inv.filter(x => x.estado === 'obra' && x.dias < 0).reduce((n, x) => n + val(x), 0);
    const lateCavs = c.inv.filter(x => x.estado === 'obra' && x.dias < 0);
    const cobranca = lateCavs.reduce((n, x) => n + Math.ceil(-x.dias / 30) * fin.taxa, 0);

    const perdas = movs
      .filter(m => m.estado === 'divergencia')
      .reduce((n, m) => n + resLists(m, obras, movs).falta.reduce((s, k) => s + (fin.v[tipoDe(k)] || 0), 0), 0);

    const byE = {};
    lateCavs.forEach(x => {
      const o = obras.find(ob => ob.id === x.obraId);
      if (!o) return;
      const e = (byE[o.empresa] = byE[o.empresa] || { emp: o.empresa, q: 0, v: 0, c: 0 });
      e.q++;
      e.v += val(x);
      e.c += Math.ceil(-x.dias / 30) * fin.taxa;
    });
    const topE = Object.values(byE).sort((a, b) => b.v - a.v).slice(0, 6);
    const mxVal = topE[0] ? topE[0].v : 1;

    return (
      <div key={`adm-${page}`} className="admin-page-anim">
        <div className="pagehead">
          <div>
            <h1 className="ph">
              <span className="phi"><Icon name="euro" /></span>
              <span>Financeiro</span>
            </h1>
          </div>
          <span className="pill tone-warn"><Icon name="info" />Simulação · valores a confirmar</span>
        </div>

        <div className="kpis fin">
          <div className="kpi">
            <span className="top"><Icon name="cav" />Valor do parque</span>
            <span className="kvr"><span className="v num">{fmtEUR(totVal)}</span></span>
            <small className="muted">{fmtN(FROTA)} cavaletes</small>
          </div>
          <div className="kpi">
            <span className="top"><Icon name="obra" />Valor em obras</span>
            <span className="kvr"><span className="v num">{fmtEUR(emObraVal)}</span></span>
            <small className="muted">{Math.round((emObraVal / totVal) * 100)}% do parque fora da fábrica</small>
          </div>
          <div className="kpi late">
            <span className="top"><Icon name="alert" />Em risco (fora do prazo)</span>
            <span className="kvr"><span className="v num">{fmtEUR(riscoVal)}</span></span>
            <small className="muted">{fmtN(lateCavs.length)} cavaletes</small>
          </div>
          <div className="kpi">
            <span className="top"><Icon name="diff" />Perdas por diferenças</span>
            <span className="kvr"><span className="v num">{fmtEUR(perdas)}</span></span>
            <small className="muted">por resolver</small>
          </div>
        </div>

        <div className="grid2" style={{ marginTop: '18px' }}>
          <section className="card fin-hl">
            <div className="card-h">
              <h2>Cobrança por atraso</h2>
            </div>
            <div className="card-b">
              <p className="muted" style={{ fontSize: '0.9rem' }}>
                Se cobrassem <b>{fmtEUR(fin.taxa)}</b> por cavalete, por cada mês (ou parte) além dos 60 dias:
              </p>
              <p className="fin-big num">{fmtEUR(cobranca)}</p>
              <p className="muted" style={{ fontSize: '0.85rem' }}>
                a faturar hoje, sobre {fmtN(lateCavs.length)} cavaletes fora do prazo.
              </p>
            </div>
          </section>

          <section className="card">
            <div className="card-h">
              <h2>Pressupostos</h2>
            </div>
            <div className="card-b">
              <div className="fin-in">
                {Object.entries(TIPOS_CAV).map(([k, T]) => (
                  <label key={k}>
                    <span><i className={`tdot t-${k}`} />Valor de um cavalete {T.um.toLowerCase()}</span>
                    <span className="eur">
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={fin.v[k]}
                        onChange={e => updateFinanca(k, Math.max(0, parseInt(e.target.value, 10) || 0))}
                      />
                      €
                    </span>
                  </label>
                ))}
                <label>
                  <span><Icon name="clock" />Taxa de atraso por cavalete / mês</span>
                  <span className="eur">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={fin.taxa}
                      onChange={e => updateFinanca('taxa', Math.max(0, parseInt(e.target.value, 10) || 0))}
                    />
                    €
                  </span>
                </label>
              </div>
            </div>
          </section>
        </div>

        <section className="card" style={{ marginTop: '18px' }}>
          <div className="card-h">
            <h2>Valor em risco por cliente</h2>
          </div>
          <div className="card-b">
            {topE.length === 0 ? (
              <p className="muted">Nenhum cavalete fora do prazo.</p>
            ) : (
              <div className="rlist">
                {topE.map(e => (
                  <div key={e.emp} className="rrow">
                    <div className="rt">
                      <b>{e.emp}</b>
                      <span>{fmtN(e.q)} cavaletes fora do prazo · cobrança possível {fmtEUR(e.c)}</span>
                    </div>
                    <div className="rv">
                      <span className="agebar">
                        <i style={{ width: `${(e.v / mxVal) * 100}%`, background: 'var(--late)' }} />
                      </span>
                      <span><b>{fmtEUR(e.v)}</b></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }

  // ================= PÁGINA ATIVIDADE =================
  if (page === 'atividade') {
    const arRange = () => {
      const t = TODAY;
      const d = n => addDays(t, -n);
      if (ar.k === 'hoje') return [t, t, 'Hoje'];
      if (ar.k === '7') return [d(6), t, 'Últimos 7 dias'];
      if (ar.k === '30') return [d(29), t, 'Últimos 30 dias'];
      if (ar.k === 'mes') return [new Date(t.getFullYear(), t.getMonth(), 1), t, 'Este mês'];
      if (ar.k === 'pers' && ar.de) {
        const a = parseIso(ar.de);
        const b = ar.ate ? parseIso(ar.ate) : a;
        return [a, b, ar.ate && ar.ate !== ar.de ? `${fd(a)} – ${fd(b)}` : fd(a)];
      }
      return [null, null, 'Desde sempre'];
    };

    const arCal = () => {
      const v = parseIso(ar.m || isoD(TODAY));
      const y = v.getFullYear();
      const mo = v.getMonth();
      const off = (new Date(y, mo, 1).getDay() + 6) % 7;
      const n = new Date(y, mo + 1, 0).getDate();
      const t = isoD(TODAY);

      const blanks = Array.from({ length: off }, (_, i) => <span key={`b-${i}`} />);
      const days = [];
      for (let d = 1; d <= n; d++) {
        const iso = isoD(new Date(y, mo, d));
        const fut = iso > t;
        const a = ar.k === 'pers' && ar.de;
        const b = ar.ate || ar.de;
        const sel = a && (iso === ar.de || iso === b);
        const inr = a && iso > ar.de && iso < b;
        days.push(
          <button
            key={iso}
            type="button"
            className={`cd${sel ? ' sel' : ''}${inr ? ' inr' : ''}${iso === t ? ' today' : ''}`}
            disabled={fut}
            onClick={() => {
              if (!ar.de || (ar.de && ar.ate)) {
                setAr(prev => ({ ...prev, k: 'pers', de: iso, ate: null }));
              } else {
                if (iso < ar.de) {
                  setAr(prev => ({ ...prev, k: 'pers', de: iso, ate: prev.de, open: false }));
                } else {
                  setAr(prev => ({ ...prev, k: 'pers', ate: iso, open: false }));
                }
              }
            }}
          >
            {d}
          </button>
        );
      }

      return (
        <div className="arcal">
          <div className="calhd">
            <button
              type="button"
              className="calnav"
              aria-label="Mês anterior"
              onClick={() => setAr(prev => ({ ...prev, m: isoD(new Date(y, mo - 1, 1)) }))}
            >
              <Icon name="left" />
            </button>
            <b>{MESES_L[mo]} <span>{y}</span></b>
            <button
              type="button"
              className="calnav"
              aria-label="Mês seguinte"
              onClick={() => setAr(prev => ({ ...prev, m: isoD(new Date(y, mo + 1, 1)) }))}
            >
              <Icon name="right" />
            </button>
          </div>
          <div className="calwd">
            {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((x, i) => <span key={i}>{x}</span>)}
          </div>
          <div className="calgrid">
            {blanks}
            {days}
          </div>
          <p className="ar-hint">{ar.k === 'pers' && ar.de && !ar.ate ? 'Escolha o último dia' : 'Escolha o primeiro dia'}</p>
        </div>
      );
    };

    const [r0, r1, rl] = arRange();
    const all = atividade(obras, movs, pedidos, currentUser, lembretes, auto).filter(
      e => !r0 || (e.d >= r0 && e.d <= r1)
    );
    const f = af === 'sis' ? 'todos' : af || 'todos';
    const qn = norm((aq || '').trim());
    const L0 = f === 'todos' ? all : all.filter(e => e.g === f);
    const L = qn ? L0.filter(e => norm([e.quem, e.papel, e.titulo, e.desc, e.guia || '', e.obra].join(' ')).includes(qn)) : L0;
    const shown = L.slice(0, alim);

    return (
      <div key={`adm-${page}`} className="admin-page-anim">
        <div className="pagehead">
          <div>
            <h1 className="ph">
              <span className="phi"><Icon name="clock" /></span>
              <span>Registo de Atividades</span>
            </h1>
          </div>
        </div>

        <div className="atbar atbox">
          <span className="atl-lab">Filtrar por</span>
          <div className="atseg">
            {[
              ['todos', 'Todos', ''],
              ['esc', 'Escritório', 'monitor'],
              ['mot', 'Motoristas', 'truck'],
              ['cli', 'Clientes', 'user'],
            ].map(([k, l, i]) => (
              <button
                key={k}
                type="button"
                className={`atsb g-${k}`}
                aria-pressed={f === k}
                onClick={() => {
                  setAf(k);
                  setAlim(25);
                }}
              >
                {i && <Icon name={i} />}
                {l}
              </button>
            ))}
          </div>

          <div className="arw" style={{ position: 'relative' }}>
            <button
              type="button"
              className={`arbtn${ar.open ? ' open' : ''}`}
              aria-expanded={ar.open}
              onClick={() => setAr(prev => ({ ...prev, open: !prev.open }))}
            >
              <Icon name="cal" />
              <span>{rl}</span>
              <svg className="calch" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {ar.open && (
              <div className="arpop">
                <div className="arpre">
                  {[
                    ['hoje', 'Hoje'],
                    ['7', 'Últimos 7 dias'],
                    ['30', 'Últimos 30 dias'],
                    ['mes', 'Este mês'],
                    ['tudo', 'Desde sempre'],
                  ].map(([k, l]) => (
                    <button
                      key={k}
                      type="button"
                      aria-pressed={ar.k === k}
                      onClick={() => {
                        setAr(prev => ({ ...prev, k, open: false, de: null, ate: null }));
                      }}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                {arCal()}
              </div>
            )}
          </div>

          <div className="atq cbox">
            <Icon name="search" />
            <input
              id="aq"
              placeholder="Pesquisar guia, pessoa…"
              value={aq}
              onChange={e => setAq(e.target.value)}
              autoComplete="off"
            />
          </div>
        </div>

        <section className="card">
          <div className="card-b">
            <div className="atl">
              {shown.length === 0 ? (
                <p className="muted" style={{ padding: '18px 0', textAlign: 'center' }}>
                  Sem atividade neste período.
                </p>
              ) : (
                shown.map((e, idx) => {
                  const hh = String(Math.floor(e.mi / 60)).padStart(2, '0');
                  const mm = String(e.mi % 60).padStart(2, '0');
                  return (
                    <div key={idx} className={`atl-i g-${e.g}`}>
                      <span className="atl-dot" />
                      <article className="atl-c">
                        <header>
                          <span className="atl-tag">{e.quem} ({e.papel})</span>
                          <b>{e.titulo}</b>
                          <time dateTime={`${isoD(e.d)}T${hh}:${mm}`}>
                            <Icon name="clock" />
                            <span>{fd(e.d)}</span>
                            <b>{hh}:{mm}</b>
                          </time>
                        </header>
                        <p>{e.desc}</p>
                        <footer>
                          {e.guia && <span className="atl-code">{e.guia}</span>}
                          <span>Obra: <b>{e.obra}</b></span>
                          {e.q > 0 && <span>· <b>{e.q} cavaletes</b></span>}
                        </footer>
                      </article>
                    </div>
                  );
                })
              )}
            </div>

            {L.length > shown.length && (
              <div className="more" style={{ display: 'flex', justifyContent: 'center', marginTop: '14px' }}>
                <span className="muted" style={{ fontSize: '0.88rem' }}>
                  A mostrar {shown.length} de {L.length}
                </span>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setAlim(l => l + 25)}
                >
                  <Icon name="plus" />Ver mais 25
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }

  return null;
}
