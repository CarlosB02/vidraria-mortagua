'use client';

import React from 'react';
import { useDashboard } from '../context/DashboardContext';
import { Icon } from '../data/icons';
import {
  TODAY,
  DIAS,
  FROTA,
  TIPOS_CAV,
  fdl,
  fd,
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
} from '../data/logic';
import MapaPortugal from './MapaPortugal';
import EscritorioView from './EscritorioView';

export default function AdminView() {
  const {
    page,
    setPageState,
    setObraId,
    setOg,
    setOgSel,
    setFiltro,
    setQ,
    obras,
    movs,
    pedidos,
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
    const w = Math.min(100, (d / 240) * 100);
    const col = d > 180 ? 'var(--late)' : d > 150 ? 'var(--warn)' : d > 90 ? 'var(--info)' : 'var(--ok)';
    return (
      <span className="agebar">
        <i style={{ width: `${w}%`, background: col }} />
        <b style={{ left: `${(180 / 240) * 100}%` }} />
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
    const parts = [
      { l: 'Na fábrica', v: c.fab, col: 'var(--ok)' },
      { l: 'Em obra, dentro do prazo', v: c.ok, col: 'var(--info)' },
      { l: 'Em obra, fora do prazo', v: c.late, col: 'var(--late)' },
      { l: 'A caminho', v: c.cam, col: 'var(--warn)' },
    ];

    const tipos = Object.entries(TIPOS_CAV).map(([k, T]) => {
      const L = c.inv.filter(x => x.tipo === k);
      return { k, T, n: L.length, fab: L.filter(x => x.estado === 'fabrica').length };
    });

    const topClientes = clientesStats(obras, movs).slice(0, 5);

    // Donut SVG
    const donutR = 70;
    const donutC = 2 * Math.PI * donutR;
    let off = 0;

    return (
      <>
        <div className="pagehead home">
          <div>
            <p className="date">{DIAS[TODAY.getDay()]}, {fdl(TODAY)}</p>
            <h1 className="ph">
              <span className="phi"><Icon name="home" /></span>
              <span>{new Date().getHours() < 13 ? 'Bom dia' : new Date().getHours() < 20 ? 'Boa tarde' : 'Boa noite'}, Helena</span>
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
                  {parts
                    .filter(p => p.v > 0)
                    .map(p => {
                      const len = (p.v / FROTA) * donutC;
                      const g = Math.min(4, len * 0.4);
                      const currentOff = off;
                      off += len;
                      return (
                        <circle
                          key={p.l}
                          r={donutR}
                          cx="90"
                          cy="90"
                          fill="none"
                          stroke={p.col}
                          strokeWidth="22"
                          strokeDasharray={`${Math.max(0, len - g)} ${donutC}`}
                          strokeDashoffset={-currentOff}
                          transform="rotate(-90 90 90)"
                        >
                          <title>{p.l}: {fmtN(p.v)}</title>
                        </circle>
                      );
                    })}
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
            </div>
            <div className="card-b mapprev">
              <MapaPortugal preview />
            </div>
          </section>
        </div>

        <section className="card" style={{ marginTop: '18px' }}>
          <div className="card-h">
            <h2>Clientes que mais demoram a devolver</h2>
            <button
              type="button"
              className="linkbtn"
              onClick={() => {
                setPageState('clientes');
                window.scrollTo(0, 0);
              }}
            >
              Ver ranking <Icon name="right" />
            </button>
          </div>
          <div className="card-b">
            {rankList(topClientes, 1)}
          </div>
        </section>
      </>
    );
  }

  // ================= PÁGINA OBRAS =================
  if (page === 'obras') {
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
      <>
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
                        setPageState('obras');
                        setOg('empresa');
                        setOgSel(e.emp);
                        setFiltro('todas');
                        setQ('');
                        setObraId(null);
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
      </>
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
      <>
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
                Se cobrassem <b>{fmtEUR(fin.taxa)}</b> por cavalete, por cada mês (ou parte) além dos 6 meses:
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
      </>
    );
  }

  // ================= PÁGINA ATIVIDADE =================
  if (page === 'atividade') {
    const allEvents = atividade(obras, movs, pedidos, currentUser);
    const filteredEvents = af === 'todos' ? allEvents : allEvents.filter(e => e.g === af);
    const shownEvents = filteredEvents.slice(0, alim);

    const GMap = {
      esc: ['Escritório', 'info'],
      mot: ['Motorista', 'warn'],
      cli: ['Cliente', 'ok'],
    };

    let lastDay = '';

    return (
      <>
        <div className="pagehead">
          <div>
            <h1 className="ph">
              <span className="phi"><Icon name="clock" /></span>
              <span>Atividade</span>
            </h1>
          </div>
        </div>

        <div className="chips" style={{ marginBottom: '14px' }}>
          {[
            ['todos', 'Tudo'],
            ['esc', 'Escritório'],
            ['mot', 'Motoristas'],
            ['cli', 'Clientes'],
          ].map(([k, l]) => (
            <button
              key={k}
              type="button"
              className="chip"
              aria-pressed={af === k}
              onClick={() => {
                setAf(k);
                setAlim(25);
              }}
            >
              {l}
            </button>
          ))}
        </div>

        <section className="card">
          <div className="card-b">
            <div className="alog">
              {shownEvents.map((e, idx) => {
                const dayText = fd(e.d);
                const showHeader = dayText !== lastDay;
                lastDay = dayText;

                return (
                  <React.Fragment key={idx}>
                    {showHeader && (
                      <p className="alog-d">
                        {e.d.getTime() === TODAY.getTime() ? 'Hoje' : dayText}
                      </p>
                    )}
                    <div className="alog-i">
                      <span className={`cav g-${e.g}`}>{iniciais(e.quem)}</span>
                      <div>
                        <p>
                          <b>{e.quem}</b> <span dangerouslySetInnerHTML={{ __html: e.t }} />
                        </p>
                        <span className={`pill tone-${GMap[e.g][1]}`}>{GMap[e.g][0]}</span>
                      </div>
                      <span className="alog-ic"><Icon name={e.ic} /></span>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            <div className="more" style={{ display: 'flex', justifyContent: 'center', marginTop: '14px' }}>
              <span className="muted" style={{ fontSize: '0.88rem' }}>
                A mostrar {shownEvents.length} de {filteredEvents.length}
              </span>
              {filteredEvents.length > shownEvents.length && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setAlim(l => l + 25)}
                >
                  <Icon name="plus" />Ver mais 25
                </button>
              )}
            </div>
          </div>
        </section>
      </>
    );
  }

  // ================= PÁGINA ACESSOS / EQUIPA =================
  if (page === 'equipa') {
    const allEv = atividade(obras, movs, pedidos, currentUser);
    const lastSeen = n => {
      const e = allEv.find(x => x.quem === n || x.quem === 'Sr. ' + n);
      return e ? rel(e.d) : '—';
    };
    const countOps = n => allEv.filter(x => x.quem === n || x.quem === 'Sr. ' + n).length;

    const renderToggle = (id, label) => {
      const on = acessoMap[id] !== false;
      return (
        <button
          type="button"
          className="tgl"
          role="switch"
          aria-checked={on}
          aria-label={`Acesso de ${label}`}
          onClick={() => toggleAcesso(id)}
        >
          <i />
        </button>
      );
    };

    const renderRow = (id, n, papel, tone, sub) => (
      <div key={id} className={`prow ${acessoMap[id] === false ? 'off' : ''}`}>
        <span className={`cav g-${tone}`}>{iniciais(n)}</span>
        <div className="pt">
          <b>{n}</b>
          <span>{sub}</span>
        </div>
        <span className={`pill tone-${tone === 'esc' ? 'info' : tone === 'mot' ? 'warn' : 'ok'}`}>
          {papel}
        </span>
        <div className="pact">
          <b className="num">{countOps(n)}</b>
          <small>registos · {lastSeen(n)}</small>
        </div>
        {renderToggle(id, n)}
      </div>
    );

    const emps = [...new Set(obras.filter(o => resumo(o, movs).total > 0).map(o => o.empresa))].sort();
    const cl = emps.flatMap(e => cliPessoas(e, obras, movs).map(p => ({ ...p, emp: e })));
    const normPq = norm(pq.trim());
    const clFiltered = cl.filter(p => !normPq || norm(p.nome + ' ' + p.emp).includes(normPq));
    const shownCli = clFiltered.slice(0, plim);

    const totalInativos = Object.values(acessoMap).filter(v => v === false).length;
    const totalPessoas = staffList.length + motoristasList.length + cl.length;

    return (
      <>
        <div className="pagehead">
          <div>
            <h1 className="ph">
              <span className="phi"><Icon name="users" /></span>
              <span>Acessos</span>
            </h1>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => openModal({ type: 'addp' })}
          >
            <Icon name="plus" />Adicionar pessoa
          </button>
        </div>

        <div className="kpis">
          <div className="kpi">
            <span className="top"><Icon name="monitor" />Escritório</span>
            <span className="kvr"><span className="v num">{staffList.length}</span></span>
          </div>
          <div className="kpi">
            <span className="top"><Icon name="truck" />Motoristas</span>
            <span className="kvr"><span className="v num">{motoristasList.length}</span></span>
          </div>
          <div className="kpi">
            <span className="top"><Icon name="user" />Clientes</span>
            <span className="kvr">
              <span className="v num">{cl.length}</span>
              <small>{emps.length} empresas</small>
            </span>
          </div>
          <div className="kpi">
            <span className="top"><Icon name="check" />Ativos</span>
            <span className="kvr"><span className="v num">{totalPessoas - totalInativos}</span></span>
          </div>
        </div>

        <section className="card" style={{ marginTop: '18px' }}>
          <div className="card-h">
            <h2>Escritório</h2>
          </div>
          <div className="card-b">
            {staffList.map(p => renderRow('s:' + p.nome, p.nome, p.papel, 'esc', p.tel))}
          </div>
        </section>

        <section className="card" style={{ marginTop: '18px' }}>
          <div className="card-h">
            <h2>Motoristas</h2>
            <span className="muted" style={{ fontSize: '0.85rem' }}>
              Só aparecem aqui os motoristas que podem receber cargas
            </span>
          </div>
          <div className="card-b">
            {motoristasList.map((m, i) =>
              renderRow('m:' + m, m, 'Motorista', 'mot', MOT_TEL[m] || '—')
            )}
          </div>
        </section>

        <section className="card" style={{ marginTop: '18px' }}>
          <div className="card-h">
            <h2>Clientes</h2>
            <div className="cbox" style={{ minHeight: '40px', maxWidth: '280px' }}>
              <Icon name="search" />
              <input
                id="pq"
                placeholder="Procurar pessoa ou empresa"
                value={pq}
                onChange={e => {
                  setPq(e.target.value);
                  setPlim(8);
                }}
              />
            </div>
          </div>
          <div className="card-b">
            {shownCli.length === 0 ? (
              <p className="muted">Ninguém encontrado.</p>
            ) : (
              shownCli.map(p =>
                renderRow(
                  'c:' + p.emp + ':' + p.nome,
                  p.nome,
                  p.papel === 'Gestor' ? 'Gestor' : 'Encarregado',
                  'cli',
                  `${p.emp} · ${p.ids.length} obra${p.ids.length > 1 ? 's' : ''}`
                )
              )
            )}
            {clFiltered.length > shownCli.length && (
              <div className="more" style={{ display: 'flex', justifyContent: 'center', marginTop: '14px' }}>
                <span className="muted" style={{ fontSize: '0.88rem' }}>
                  A mostrar {shownCli.length} de {clFiltered.length}
                </span>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setPlim(l => l + 8)}
                >
                  <Icon name="plus" />Ver mais 8
                </button>
              </div>
            )}
          </div>
        </section>
      </>
    );
  }

  return null;
}
