'use client';

import React from 'react';
import { useDashboard } from '../context/DashboardContext';
import { Icon } from '../data/icons';
import {
  TODAY,
  DIAS,
  MESES,
  MESES_L,
  FROTA,
  TIPOS_CAV,
  fdl,
  fd,
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
} from '../data/logic';
import MapaPortugal from './MapaPortugal';

export default function EscritorioView() {
  const {
    page,
    obraId,
    setObraId,
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

  // ================= PÁGINA INÍCIO =================
  if (page === 'inicio') {
    const items = [];

    movs
      .filter(m => m.estado === 'divergencia')
      .forEach(m => {
        const o = obras.find(x => x.id === m.obraId);
        items.push({
          tone: 'warn',
          icon: 'diff',
          t: `Diferença na entrega ${m.guia}`,
          s: `${o?.nome} · enviámos ${m.qtd}, o cliente confirmou ${m.qtdCli}`,
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
      .filter(p => p.estado === 'pendente')
      .forEach(p => {
        const o = obras.find(x => x.id === p.obraId);
        items.push({
          tone: 'info',
          icon: 'hand',
          t: `Pedido de recolha · ${p.qtd} cavaletes`,
          s: `${o?.nome}, ${o?.cidade}`,
          action: () => {
            setObraId(o?.id);
            setPageState('obras');
          },
          btn: (
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
        t: `${o.nome} · ${r.first?.qtd} cavaletes`,
        s: `${diasTxt(r.dias)}${lembretes[o.id] ? ' · lembrete enviado ' + rel(lembretes[o.id]) : ''}`,
        action: () => {
          setObraId(o.id);
          setPageState('obras');
        },
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
            <Icon name="mail" />
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
              <span>{saudacao}, {currentUser.split(' ')[0]}</span>
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
              <h2>Precisa da sua atenção</h2>
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
                    <span className={`ic tone-${a.tone}`}><Icon name={a.icon} /></span>
                    <div className="t">
                      <b>{a.t}</b>
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
            >
              <MapaPortugal preview />
            </div>
          </section>
        </div>
      </>
    );
  }

  // ================= PÁGINA OBRAS =================
  if (page === 'obras') {
    if (obraId) {
      const o = obras.find(x => x.id === obraId);
      if (!o) return null;
      const r = resumo(o, movs);
      const hist = movs.filter(m => m.obraId === o.id).sort((a, b) => b.data - a.data);

      return (
        <>
          <button type="button" className="back" onClick={() => setObraId(null)}>
            <Icon name="left" />Voltar às obras
          </button>
          <div className="pagehead">
            <div>
              <p className="eyebrow">{o.empresa}</p>
              <h1 className="ph">
                <span className="phi"><Icon name="obra" /></span>
                <span>{o.nome}</span>
              </h1>
              <p className="muted"><Icon name="pin" /> {o.morada}, {o.cidade}</p>
            </div>
            {r.total > 0 && (
              <span className={`pill tone-${ST[r.st].tone}`}>
                <Icon name={ST[r.st].icon} />
                {ST[r.st].label}
              </span>
            )}
          </div>

          <div className="dgrid">
            <div className="stack">
              <section className="card">
                <div className="card-b" style={{ paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <p className="eyebrow">Cavaletes nesta obra</p>
                    <div className="bigcount">
                      <span className="num">{r.total}</span>
                      {r.transito > 0 && <span className="muted">+ {r.transito} a caminho</span>}
                    </div>
                  </div>

                  {/* Barra de prazo */}
                  {r.first ? (
                    <div className="prazo">
                      <div className="bar" role="img" aria-label="Progresso do prazo de 6 meses">
                        <i
                          style={{
                            width: `${Math.max(4, Math.min(100, (1 - r.dias / 183) * 100))}%`,
                            background: ST[r.st].soft,
                          }}
                        />
                        <div className="ticks">
                          <span /><span /><span /><span /><span /><span />
                        </div>
                      </div>
                      <small>
                        <span style={{ color: ST[r.st].color, fontWeight: 500 }}>{diasTxt(r.dias)}</span> · prazo {fd(r.first.prazo)}
                      </small>
                    </div>
                  ) : (
                    <div className="prazo"><small>Sem cavaletes na obra</small></div>
                  )}

                  <div className="actions">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => openModal({ type: 'nova', obraId: o.id, nums: [] })}
                    >
                      <Icon name="truck" />Nova entrega
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
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
              </section>

              <section className="card">
                <div className="card-h">
                  <h3>Contacto da obra</h3>
                </div>
                <div className="card-b">
                  <dl className="kv">
                    <dt>Responsável</dt><dd>{o.contacto}</dd>
                    <dt>Email</dt><dd>{o.email}</dd>
                    <dt>Telefone</dt>
                    <dd>
                      {/\d/.test(o.tel) ? (
                        <a className="tel-link" target="_blank" rel="noopener noreferrer" href={`tel:+351${o.tel.replace(/\D/g, '')}`}>
                          <Icon name="phone" />{o.tel}
                        </a>
                      ) : (
                        o.tel
                      )}
                    </dd>
                    {lembretes[o.id] && (
                      <>
                        <dt>Último lembrete</dt><dd>{fd(lembretes[o.id])}</dd>
                      </>
                    )}
                  </dl>
                </div>
              </section>
            </div>

            <div className="stack">
              {r.lots.length > 0 && (
                <section className="card">
                  <div className="card-h">
                    <h3>Prazo de cada entrega</h3>
                  </div>
                  <div className="card-b tablewrap">
                    <table className="lots">
                      <thead>
                        <tr>
                          <th>Entregue a</th>
                          <th style={{ textAlign: 'center' }}>Ainda na obra</th>
                          <th>Devolver até</th>
                          <th>Situação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {r.lots.map(l => {
                          const st = stFor(l.data, l.dias);
                          return (
                            <tr key={l.mov.id}>
                              <td data-l="Entregue a">{fd(l.data)}</td>
                              <td data-l="Ainda na obra" className="num" style={{ fontSize: '1.2rem', textAlign: 'center' }}>
                                <span className="qinfo">
                                  {l.qtd}
                                  <button
                                    type="button"
                                    className="infob"
                                    aria-label="Ver números dos cavaletes"
                                    onClick={() => openModal({ type: 'cavnums', movId: l.mov.id })}
                                  >
                                    <Icon name="info" />
                                  </button>
                                </span>
                              </td>
                              <td data-l="Devolver até">{fd(l.prazo)}</td>
                              <td data-l="Situação">
                                <span className={`pill tone-${ST[st].tone}`}>
                                  {diasTxt(l.dias)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              <section className="card">
                <div className="card-h">
                  <h3>Histórico</h3>
                </div>
                <div className="card-b">
                  <div className="timeline">
                    {hist.map(m => {
                      const isE = m.tipo === 'entrega';
                      const tone = m.estado === 'divergencia' ? 'warn' : isE ? 'info' : 'ok';
                      return (
                        <div key={m.id} className="tl tlc">
                          <span className={`ic tone-${tone}`}>
                            <Icon name={isE ? 'truck' : 'recolha'} />
                          </span>
                          <div className="tlb">
                            <b>{isE ? 'Entrega' : 'Recolha'} de {m.qtd} cavaletes</b>
                            <span className="muted">{fd(m.data)} · {m.guia}</span>
                          </div>
                          <div className="tlr">
                            <span className={`pill tone-${tone}`}>{m.estado}</span>
                            <button
                              type="button"
                              className="linkbtn"
                              onClick={() => openModal({ type: 'mov', id: m.id })}
                            >
                              Detalhes <Icon name="right" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </>
      );
    }

    // Modo pastas ou lista
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

    const baseList = obras
      .map(o => ({ o, r: resumo(o, movs) }))
      .filter(x => (x.r.total > 0 || x.r.transito > 0) && inGroup(x.o))
      .map(x => x.r);
    const countStatus = st => baseList.filter(r => r.st === st).length;

    const chips = [
      ['todas', 'Todas', baseList.length],
      ['late', 'Prazo terminado', countStatus('late')],
      ['soon', '5–6 meses', countStatus('soon')],
      ['watch', '3–5 meses', countStatus('watch')],
      ['ok', 'Menos de 3 meses', countStatus('ok')],
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
              <Icon name="plus" />Nova entrega
            </button>
          </div>
        </div>

        <div className="toolbar">
          <label className="search">
            <Icon name="search" />
            <input
              type="search"
              placeholder="Procurar por obra, cliente ou cidade"
              value={q}
              onChange={e => setQ(e.target.value)}
              aria-label="Procurar"
            />
          </label>
          <div className="ogseg" role="group" aria-label="Organizar por">
            {[
              ['distrito', 'pin', 'Por distrito', 'Distrito'],
              ['empresa', 'obra', 'Por empresa', 'Empresa'],
              ['todas', 'search', 'Todas as obras', 'Todas'],
            ].map(([k, iconN, l, sh]) => (
              <button
                key={k}
                type="button"
                aria-pressed={og === k}
                onClick={() => {
                  setOg(k);
                  setOgSel(null);
                  setFiltro('todas');
                }}
              >
                <Icon name={iconN} />
                <span className="lg">{l}</span>
                <span className="sh">{sh}</span>
              </button>
            ))}
          </div>
        </div>

        {isFolderView ? (
          <div className="folders">
            {folderList.map(([k, g], i) => {
              const tot = Math.max(1, g.cav);
              return (
                <button
                  key={k}
                  type="button"
                  className="folder"
                  style={{ '--d': `${Math.min(i, 14) * 25}ms` }}
                  onClick={() => {
                    setOgSel(k);
                    setFiltro('todas');
                    window.scrollTo(0, 0);
                  }}
                >
                  <span className="sheet" />
                  <span className="sheet s2" />
                  <span className="front">
                    <span className="fh">
                      <b>{k}</b>
                      {g.lateObras > 0 && (
                        <span className="fbadge"><Icon name="alert" />{g.lateObras}</span>
                      )}
                    </span>
                    <span className="fm"><span className="num">{g.cav}</span> cavaletes</span>
                    <span className="fs muted">
                      {g.n} obra{g.n > 1 ? 's' : ''}
                      {g.late > 0 && <> · <em>{g.late} fora do prazo</em></>}
                    </span>
                    <span className="fbar">
                      {['late', 'soon', 'watch', 'ok'].map(s =>
                        g.seg[s] ? (
                          <i
                            key={s}
                            style={{ width: `${(g.seg[s] / tot) * 100}%`, background: ST[s].soft }}
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
            {ogSel && og !== 'todas' && (
              <div className="crumb">
                <button
                  type="button"
                  className="linkbtn"
                  onClick={() => {
                    setOgSel(null);
                    setFiltro('todas');
                    setQ('');
                  }}
                >
                  <Icon name="left" />
                  {og === 'distrito' ? 'Distritos' : 'Empresas'}
                </button>
                <span>/</span>
                <b>{ogSel}</b>
              </div>
            )}

            <div className="chips" style={{ marginBottom: '16px' }} role="group" aria-label="Filtrar">
              {chips.map(([k, l, count]) => (
                <button
                  key={k}
                  type="button"
                  className="chip"
                  aria-pressed={filtro === k}
                  onClick={() => setFiltro(k)}
                >
                  {l} <span className="n">{count}</span>
                </button>
              ))}
            </div>

            <div className="olist">
              {filteredList.length === 0 ? (
                <div className="card" style={{ padding: '28px', textAlign: 'center' }}>
                  <p className="muted">Nenhuma obra encontrada.</p>
                </div>
              ) : (
                filteredList.map(({ o, r }) => (
                  <button
                    key={o.id}
                    type="button"
                    className="orow"
                    style={{ '--stripe': ST[r.st].soft }}
                    onClick={() => {
                      setObraId(o.id);
                      window.scrollTo(0, 0);
                    }}
                  >
                    <div className="who">
                      <b>{o.nome}</b>
                      <span>{o.empresa}</span>
                      <span><Icon name="pin" />{o.cidade}</span>
                    </div>
                    <div className="cnt">
                      <span className="num">{r.total}</span>
                      <small>cavaletes{r.transito ? ` · +${r.transito} a caminho` : ''}</small>
                    </div>
                    {/* Barra de prazo */}
                    {r.first ? (
                      <div className="prazo">
                        <div className="bar" role="img" aria-label="Prazo">
                          <i
                            style={{
                              width: `${Math.max(4, Math.min(100, (1 - r.dias / 183) * 100))}%`,
                              background: ST[r.st].soft,
                            }}
                          />
                          <div className="ticks">
                            <span /><span /><span /><span /><span /><span />
                          </div>
                        </div>
                        <small>
                          <span style={{ color: ST[r.st].color, fontWeight: 500 }}>{diasTxt(r.dias)}</span> · prazo {fd(r.first.prazo)}
                        </small>
                      </div>
                    ) : (
                      <div className="prazo"><small>Sem cavaletes na obra</small></div>
                    )}
                    <span className="chev muted"><Icon name="right" /></span>
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </>
    );
  }

  // ================= PÁGINA CAVALETES (INVENTÁRIO) =================
  if (page === 'cavaletes') {
    const inv = inventario(obras, movs);
    const cards = Object.entries(TIPOS_CAV).map(([k, T]) => {
      const L = inv.filter(c => c.tipo === k);
      const fab = L.filter(c => c.estado === 'fabrica').length;
      const obr = L.filter(c => c.estado === 'obra').length;
      const cam = L.filter(c => c.estado === 'caminho').length;
      const late = L.filter(c => c.estado === 'obra' && c.dias < 0).length;
      const tot = L.length;

      return (
        <button
          key={k}
          type="button"
          className="tcard"
          aria-pressed={cav.tipo === k}
          onClick={() => setCav(s => ({ ...s, tipo: s.tipo === k ? 'todos' : k, lim: 20 }))}
        >
          <span className="th">
            <span className={`tic t${k}`}><Icon name="cav" /></span>
            <span>
              <b>{T.nome}</b>
              <small>N.º {T.ini} – {T.fim}</small>
            </span>
            <span className="num tt">{fmtN(tot)}</span>
          </span>
          <span className="tbar">
            <i style={{ width: `${(fab / tot) * 100}%`, background: 'var(--ok-bar)' }} />
            <i style={{ width: `${(obr / tot) * 100}%`, background: 'var(--info-bar)' }} />
            <i style={{ width: `${(cam / tot) * 100}%`, background: 'var(--warn-bar)' }} />
          </span>
          <span className="tleg">
            <span><i style={{ background: 'var(--ok-bar)' }} />Fábrica <b>{fmtN(fab)}</b></span>
            <span><i style={{ background: 'var(--info-bar)' }} />Obras <b>{fmtN(obr)}</b></span>
            <span><i style={{ background: 'var(--warn-bar)' }} />A caminho <b>{fmtN(cam)}</b></span>
          </span>
          {late > 0 ? (
            <span className="tlate"><Icon name="alert" />{fmtN(late)} fora do prazo</span>
          ) : (
            <span className="tlate ok"><Icon name="check" />Nenhum fora do prazo</span>
          )}
        </button>
      );
    });

    const qNum = cav.q.trim();
    const filteredCav = inv.filter(c => {
      const matchTipo = cav.tipo === 'todos' || c.tipo === cav.tipo;
      const matchEst =
        cav.est === 'todos' ||
        (cav.est === 'late' ? c.estado === 'obra' && c.dias < 0 : c.estado === cav.est);
      const matchQ =
        !qNum ||
        (/^\d+$/.test(qNum)
          ? String(c.n).includes(qNum)
          : c.obraId &&
            norm(
              (obras.find(o => o.id === c.obraId)?.nome || '') +
                ' ' +
                (obras.find(o => o.id === c.obraId)?.empresa || '') +
                ' ' +
                (obras.find(o => o.id === c.obraId)?.cidade || '')
            ).includes(norm(qNum)));

      return matchTipo && matchEst && matchQ;
    });

    const shown = filteredCav.slice(0, cav.lim);

    const countEst = k =>
      k === 'todos'
        ? inv.filter(c => cav.tipo === 'todos' || c.tipo === cav.tipo).length
        : inv.filter(
            c =>
              (cav.tipo === 'todos' || c.tipo === cav.tipo) &&
              (k === 'late' ? c.estado === 'obra' && c.dias < 0 : c.estado === k)
          ).length;

    const estadoChips = [
      ['todos', 'Todos'],
      ['fabrica', 'Na fábrica'],
      ['obra', 'Em obra'],
      ['caminho', 'A caminho'],
      ['late', 'Fora do prazo'],
    ];

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
            <span className="pill tone-mut" style={{ fontSize: '0.95rem' }}>
              <Icon name="cav" />{fmtN(inv.length)} no total
            </span>
          </div>
        </div>

        <div className="tcards">{cards}</div>

        <section className="card">
          <div className="card-h">
            <h2>{cav.tipo === 'todos' ? 'Todos os cavaletes' : `Cavaletes ${TIPOS_CAV[cav.tipo].nome.toLowerCase()}`}</h2>
            {cav.tipo !== 'todos' && (
              <button
                type="button"
                className="linkbtn"
                onClick={() => setCav(s => ({ ...s, tipo: 'todos', lim: 20 }))}
              >
                <Icon name="x" />Ver todos os tipos
              </button>
            )}
          </div>
          <div className="card-b">
            <div className="toolbar">
              <label className="search">
                <Icon name="search" />
                <input
                  type="search"
                  placeholder="Procurar por número ou obra"
                  value={cav.q}
                  onChange={e => setCav(s => ({ ...s, q: e.target.value, lim: 20 }))}
                  aria-label="Procurar cavalete"
                />
              </label>
            </div>

            <div className="chips" style={{ marginBottom: '14px' }}>
              {estadoChips.map(([k, l]) => (
                <button
                  key={k}
                  type="button"
                  className="chip"
                  aria-pressed={cav.est === k}
                  onClick={() => setCav(s => ({ ...s, est: k, lim: 20 }))}
                >
                  {l} <span className="n">{fmtN(countEst(k))}</span>
                </button>
              ))}
            </div>

            {filteredCav.length === 0 ? (
              <p className="muted" style={{ padding: '20px 0', textAlign: 'center' }}>
                Nenhum cavalete encontrado.
              </p>
            ) : (
              <>
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
                      {shown.map(c => {
                        const o = c.obraId ? obras.find(x => x.id === c.obraId) : null;
                        const [tTone, iIcon, lLabel] = cavEstado(c);
                        return (
                          <tr
                            key={c.n}
                            className={o ? 'click' : ''}
                            onClick={() => {
                              if (o) {
                                setObraId(o.id);
                                setPageState('obras');
                                window.scrollTo(0, 0);
                              }
                            }}
                          >
                            <td data-l="N.º" className="num">{c.n}</td>
                            <td data-l="Tipo">{TIPOS_CAV[c.tipo].um}</td>
                            <td data-l="Estado">
                              <span className={`pill tone-${tTone}`}>
                                <Icon name={iIcon} />{lLabel}
                              </span>
                            </td>
                            <td data-l="Onde está">
                              {o ? (
                                <>
                                  <b>{o.nome}</b>
                                  <span className="muted"> · {o.cidade}</span>
                                </>
                              ) : (
                                <span className="muted">Fábrica · Mortágua</span>
                              )}
                            </td>
                            <td data-l="Desde">{c.desde ? fd(c.desde) : '—'}</td>
                            <td data-l="Prazo">
                              {c.estado === 'obra' ? (
                                <span style={{ color: ST[stFor(c.desde, c.dias)].color }}>
                                  {diasTxt(c.dias)}
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="more" style={{ display: 'flex', justifyContent: 'center', marginTop: '14px' }}>
                  <span className="muted" style={{ fontSize: '0.88rem' }}>
                    A mostrar {fmtN(shown.length)} de {fmtN(filteredCav.length)}
                  </span>
                  {filteredCav.length > shown.length && (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setCav(s => ({ ...s, lim: s.lim + 20 }))}
                    >
                      <Icon name="plus" />Ver mais {Math.min(20, filteredCav.length - shown.length)}
                    </button>
                  )}
                </div>
              </>
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
      const d = (dist[o.distrito] = dist[o.distrito] || { n: 0, obras: 0, late: 0 });
      d.n += r.total;
      d.obras++;
      if (r.st === 'late') d.late += r.lateQ;
    });

    const distList = Object.entries(dist).sort((a, b) => b[1].n - a[1].n);
    const maxVal = distList[0] ? distList[0][1].n : 1;

    const ch = [
      ['todas', 'Todas'],
      ['late', 'Prazo terminado'],
      ['soon', '5–6 meses'],
      ['watch', '3–5 meses'],
      ['ok', 'Menos de 3 meses'],
    ];

    return (
      <>
        <div className="pagehead">
          <div>
            <h1 className="ph">
              <span className="phi"><Icon name="pin" /></span>
              <span>Mapa</span>
            </h1>
          </div>
        </div>

        <div className="chips" style={{ marginBottom: '16px' }}>
          {ch.map(([k, l]) => (
            <button
              key={k}
              type="button"
              className="chip"
              aria-pressed={mapf === k}
              onClick={() => setMapf(k)}
            >
              {l}
            </button>
          ))}
        </div>

        <div className="grid2 mapgrid">
          <section className="card">
            <div className="card-b" style={{ paddingTop: '20px' }}>
              <MapaPortugal filter={mapf} />
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
                      setObraId(null);
                      setFiltro('todas');
                      setQ('');
                      setOg('distrito');
                      setOgSel(d);
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
                      <i style={{ width: `${(v.n / maxVal) * 100}%` }} />
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

  // ================= PÁGINA MOVIMENTOS =================
  if (page === 'entregas') {
    const aberto = m => (m.tipo === 'entrega' ? m.estado !== 'entregue' : m.estado !== 'concluida');
    const pend = movs
      .filter(aberto)
      .sort((a, b) => (a.estado === 'por_atribuir' ? -1 : 0) - (b.estado === 'por_atribuir' ? -1 : 0) || b.data - a.data);
    const done = movs.filter(m => !aberto(m)).sort((a, b) => b.data - a.data);
    const shown = done.slice(0, mlim);

    return (
      <>
        <div className="pagehead">
          <div>
            <h1 className="ph">
              <span className="phi"><Icon name="truck" /></span>
              <span>Movimentos</span>
            </h1>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => openModal({ type: 'nova', nums: [] })}
          >
            <Icon name="plus" />Nova entrega
          </button>
        </div>

        <section className="card">
          <div className="card-h">
            <h2>Por fechar</h2>
            <span className="pill tone-warn">{pend.length} por fechar</span>
          </div>
          <div className="card-b">
            {pend.length === 0 ? (
              <p className="muted">Está tudo fechado.</p>
            ) : (
              pend.map(m => renderMovRow(m, obras, openModal, setObraId, setPageState))
            )}
          </div>
        </section>

        <section className="card" style={{ marginTop: '18px' }}>
          <div className="card-h">
            <h2>Últimos movimentos</h2>
            <span className="muted" style={{ fontSize: '0.88rem' }}>
              A mostrar {shown.length} de {done.length}
            </span>
          </div>
          <div className="card-b">
            {shown.map(m => renderMovRow(m, obras, openModal, setObraId, setPageState))}
            {done.length > shown.length && (
              <div className="more" style={{ display: 'flex', justifyContent: 'center', marginTop: '14px' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setMlim(l => l + 10)}
                >
                  <Icon name="plus" />Ver mais {Math.min(10, done.length - shown.length)}
                </button>
              </div>
            )}
          </div>
        </section>
      </>
    );
  }

  // ================= PÁGINA ALERTAS =================
  if (page === 'alertas') {
    const rs = obras.map(o => ({ o, r: resumo(o, movs) })).filter(x => x.r.total > 0);
    const groupItems = k => rs.filter(x => x.r.st === k).sort((a, b) => a.r.dias - b.r.dias);

    const renderAlertGroup = (k, title) => {
      const list = groupItems(k);
      return (
        <div key={k}>
          <div className="group-h">
            <h2>{title}</h2>
            <span className={`n tone-${ST[k].tone}`}>{list.length}</span>
          </div>
          <section className="card">
            <div className="card-b" style={{ paddingTop: '8px' }}>
              {list.length === 0 ? (
                <p className="muted" style={{ paddingTop: '10px' }}>Nenhuma obra nesta situação.</p>
              ) : (
                <div className="alist">
                  {list.map(({ o, r }) => (
                    <div key={o.id} className="aitem">
                      <span className={`ic tone-${ST[r.st].tone}`}>
                        <Icon name={ST[r.st].icon} />
                      </span>
                      <div className="t">
                        <b>{o.nome} · {r.first?.qtd} cavaletes</b>
                        <span>
                          {o.empresa} · {o.cidade} · {diasTxt(r.dias)}
                          {lembretes[o.id] && (
                            <> · <b style={{ display: 'inline', color: 'var(--ok)' }}>lembrete enviado {rel(lembretes[o.id])}</b></>
                          )}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          setObraId(o.id);
                          setPageState('obras');
                          window.scrollTo(0, 0);
                        }}
                      >
                        Abrir
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() =>
                          openModal({
                            type: 'email',
                            obraId: o.id,
                            tpl: r.st === 'late' ? 'terminado' : 'amigavel',
                          })
                        }
                      >
                        <Icon name="mail" />Preparar email
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      );
    };

    return (
      <>
        <div className="pagehead">
          <div>
            <h1 className="ph">
              <span className="phi"><Icon name="bell" /></span>
              <span>Alertas</span>
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

        <div className="grid2">
          <div>
            {renderAlertGroup('late', 'Prazo terminado')}
            {renderAlertGroup('soon', 'Na obra há 5 a 6 meses')}
            {renderAlertGroup('watch', 'Na obra há 3 a 5 meses')}
          </div>
          <div>
            <div className="group-h">
              <h2>Pedidos de recolha</h2>
              <span className="n tone-info">{pedidos.filter(p => p.estado !== 'concluido').length}</span>
            </div>
            <section className="card">
              <div className="card-b" style={{ paddingTop: '8px' }}>
                <div className="alist">
                  {pedidos.length === 0 ? (
                    <p className="muted">Sem pedidos.</p>
                  ) : (
                    pedidos.map(p => {
                      const o = obras.find(x => x.id === p.obraId);
                      return (
                        <div key={p.id} className="aitem">
                          <span className="ic tone-info"><Icon name="hand" /></span>
                          <div className="t">
                            <b>{p.qtd} cavaletes · {o?.nome}</b>
                            <span>
                              Pedido {rel(p.data)} pelo cliente ·{' '}
                              {p.estado === 'pendente'
                                ? 'por marcar'
                                : p.estado === 'logistica'
                                ? 'na logística · falta o motorista'
                                : p.estado === 'agendado'
                                ? `recolha a ${fd(parseIso(p.dataRec))} · Sr. ${p.mot}`
                                : 'recolhido'}
                            </span>
                          </div>
                          {p.estado === 'pendente' ? (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => {
                                if (!p.guia) p.guia = 'GR-2026/' + (1400 + pedidos.indexOf(p) + 1);
                                openModal({ type: 'mrec', pid: p.id });
                              }}
                            >
                              Marcar
                            </button>
                          ) : (p.estado === 'logistica' || p.estado === 'agendado') ? (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => {
                                let a = document.getElementById('print-area');
                                if (!a) {
                                  a = document.createElement('div');
                                  a.id = 'print-area';
                                  document.body.appendChild(a);
                                }
                                a.innerHTML = `
                                  <div class="fs-page">
                                    <div class="fs-via">
                                      <div class="fs-hd">
                                        <img src="/dashboard/imagens/logo.png" alt="Vidraria Mortágua" />
                                        <div class="fs-ttl">
                                          <span class="fs-tag">Via do cliente</span>
                                          <h1>Guia de recolha de cavaletes</h1>
                                          <p>N.º <b>${p.guia || '—'}</b></p>
                                        </div>
                                      </div>
                                      <p style="padding: 20px 0;">Recolha de ${p.qtd} cavaletes para ${o?.nome}.</p>
                                    </div>
                                  </div>`;
                                try { window.print(); } catch {}
                              }}
                            >
                              <Icon name="print" />Imprimir
                            </button>
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </section>
          </div>
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
              <path stroke="#000" d="M0 0.5h7m1 0h1m1 0h3m1 0h7M0 1.5h1m5 0h1m3 0h1m1 0h1m1 0h1m5 0h1M0 2.5h1m1 0h3m1 0h1m2 0h1m2 0h1m1 0h1m1 0h3m1 0h1M0 3.5h1m1 0h3m1 0h1m1 0h4m2 0h1m1 0h3m1 0h1M0 4.5h1m1 0h3m1 0h1m1 0h2m2 0h1m1 0h1m1 0h3m1 0h1M0 5.5h1m5 0h1m1 0h2m1 0h1m2 0h1m5 0h1M0 6.5h7m1 0h1m1 0h1m1 0h1m1 0h7M8 7.5h1m2 0h2M0 8.5h1m3 0h1m1 0h4m1 0h1m1 0h5m2 0h1M1 9.5h1m1 0h1m1 0h1m1 0h2m1 0h3m2 0h1m1 0h1m2 0h1M0 10.5h1m1 0h2m2 0h3m2 0h1m2 0h5m1 0h1M0 11.5h1m2 0h3m1 0h1m1 0h2m2 0h2m1 0h1M4 12.5h1m1 0h1m2 0h2m1 0h3m2 0h1m1 0h1M8 13.5h3m1 0h3m3 0h1m1 0h1M0 14.5h7m1 0h3m1 0h2m3 0h1m1 0h2M0 15.5h1m5 0h1m3 0h3m2 0h1m1 0h1m1 0h2M0 16.5h1m1 0h3m1 0h1m1 0h4m2 0h3m1 0h3M0 17.5h1m1 0h3m1 0h1m3 0h3m6 0h2M0 18.5h1m1 0h3m1 0h1m3 0h2m2 0h3m1 0h1M0 19.5h1m5 0h1m6 0h2m3 0h1m1 0h1M0 20.5h7m1 0h1m1 0h1m1 0h4m2 0h3" />
            </svg>
            <div>
              <img className="brandline" src="/dashboard/imagens/logo.png" alt="Vidraria Mortágua" />
              <small>Cavalete duplo n.º</small>
              <b>3127</b>
              <small style={{ marginTop: '8px' }}>Propriedade da empresa. Devolver no prazo de 6 meses.</small>
            </div>
          </div>
        </section>

        <div className="compare">
          <div className="card">
            <h3>Papel e Excel (hoje)</h3>
            <ul>
              <li><Icon name="x" /><span>O 5 escrito à mão parece um 8</span></li>
              <li><Icon name="x" /><span>Três folhas com números diferentes</span></li>
              <li><Icon name="x" /><span>Prazos contados à mão, obra a obra</span></li>
            </ul>
          </div>
          <div className="card">
            <h3>Máquina de picagem</h3>
            <ul>
              <li><Icon name="x" /><span>Equipamento próprio para comprar e manter</span></li>
              <li><Icon name="x" /><span>Só lê onde a máquina está</span></li>
              <li><Icon name="check" /><span>Acaba com os erros de escrita</span></li>
            </ul>
          </div>
          <div className="card best">
            <h3>Etiqueta QR + telemóvel</h3>
            <ul>
              <li><Icon name="check" /><span>Usa o telemóvel que todos já têm</span></li>
              <li><Icon name="check" /><span>Funciona na fábrica e em qualquer obra</span></li>
              <li><Icon name="check" /><span>Data, hora e motorista registados sozinhos</span></li>
            </ul>
          </div>
        </div>
      </>
    );
  }

  // ================= PÁGINA DEFINIÇÕES =================
  if (page === 'definicoes') {
    const rs = obras.map(o => ({ o, r: resumo(o, movs) })).filter(x => x.r.total > 0);
    const autoCount = rs.filter(({ r }) => {
      const d = r.dias;
      return (
        (auto.d30 && d > 30 && d <= 37) ||
        (auto.d7 && d > 7 && d <= 14) ||
        (auto.d0 && d >= 0 && d <= 7) ||
        (auto.sem && d < 0)
      );
    }).length;

    const optBtn = (cur, val, label, preview) => (
      <button
        key={val}
        type="button"
        aria-pressed={cur === val}
        onClick={() => (cur === osize ? setOsize(val) : setTheme(val))}
      >
        {preview}
        {label}
      </button>
    );

    return (
      <>
        <div className="pagehead">
          <div>
            <h1 className="ph">
              <span className="phi"><Icon name="gear" /></span>
              <span>Definições</span>
            </h1>
            <p className="muted">Ajuste o sistema à sua maneira. Fica guardado na sua conta.</p>
          </div>
        </div>

        <div className="defs">
          <section className="card">
            <div className="card-h">
              <h2>Tamanho do texto</h2>
            </div>
            <div className="card-b">
              <p className="muted" style={{ marginBottom: '12px' }}>Aumente se lhe custar a ler. Muda em todos os ecrãs.</p>
              <div className="szs wide">
                {[
                  ['n', 'Normal', <span key="n" style={{ fontSize: '16px' }}>Aa</span>],
                  ['l', 'Grande', <span key="l" style={{ fontSize: '20px' }}>Aa</span>],
                  ['xl', 'Muito grande', <span key="xl" style={{ fontSize: '24px' }}>Aa</span>],
                ].map(([k, l, prev]) => optBtn(osize, k, l, prev))}
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-h">
              <h2>Aparência</h2>
            </div>
            <div className="card-b">
              <p className="muted" style={{ marginBottom: '12px' }}>Modo escuro é mais confortável à noite.</p>
              <div className="szs wide">
                {[
                  ['auto', 'Automático', <Icon key="auto" name="monitor" />],
                  ['light', 'Claro', <Icon key="light" name="sun" />],
                  ['dark', 'Escuro', <Icon key="dark" name="moon" />],
                ].map(([k, l, prev]) => optBtn(theme, k, l, prev))}
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-h">
              <h2>Conta</h2>
            </div>
            <div className="card-b">
              <dl className="kv">
                <dt>Nome</dt><dd>{currentUser}</dd>
                <dt>Email</dt><dd>joao.santos@vidrariamortagua.pt</dd>
                <dt>Perfil</dt><dd>Escritório</dd>
              </dl>
            </div>
          </section>

          <section className="card">
            <div className="card-h">
              <h2>Emails automáticos</h2>
            </div>
            <div className="card-b">
              <p className="muted" style={{ marginBottom: '6px' }}>
                Escolha quando o sistema envia sozinho um lembrete ao cliente. Pode sempre ler e alterar o texto antes.
              </p>
              {[
                ['d30', '30 dias antes', 'Lembrete amigável'],
                ['d7', '7 dias antes', 'Pede uma data de recolha'],
                ['d0', 'No dia em que termina', 'Aviso de prazo terminado'],
                ['sem', 'Todas as semanas depois', 'Até os cavaletes voltarem'],
              ].map(([k, tTitle, sDesc]) => (
                <label key={k} className="switch" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderTop: '1px solid var(--line)' }}>
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
              <div className="note" style={{ marginTop: '12px' }}>
                <Icon name="info" />
                <span>Esta semana seguem <b>{autoCount} emails automáticos</b>. Recebe uma cópia de cada um.</span>
              </div>
            </div>
          </section>
        </div>
      </>
    );
  }

  return null;
}

function renderMovRow(m, obras, openModal, setObraId, setPageState) {
  const o = obras.find(x => x.id === m.obraId);
  const isE = m.tipo === 'entrega';

  const status = isE ? (
    <div className="steps3">
      <span className="st done"><span className="c"><Icon name="check" /></span>Vidraria {m.qtd}</span>
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
  ) : m.estado === 'por_atribuir' ? (
    <span className="pill tone-warn"><Icon name="clock" />Na logística</span>
  ) : m.estado === 'agendada' ? (
    <span className="pill tone-info"><Icon name="cal" />Marcada · {fd(m.data)}</span>
  ) : (
    <div className="steps3">
      <span className="st done"><span className="c"><Icon name="check" /></span>Recolhidos {m.qtd}</span>
    </div>
  );

  const motT = m.motorista ? (
    isE || m.estado !== 'agendada' ? (
      <span className="m">Sr. {m.motorista}</span>
    ) : (
      <button
        type="button"
        className="mtag set"
        onClick={() => openModal({ type: 'atrib', movId: m.id })}
      >
        <Icon name="truck" />Sr. {m.motorista}
      </button>
    )
  ) : (
    <button
      type="button"
      className="mtag"
      onClick={() => openModal({ type: 'atrib', movId: m.id })}
    >
      <Icon name="plus" />Atribuir motorista
    </button>
  );

  return (
    <div key={m.id} className={`mrow ${isE ? 'is-ent' : 'is-rec'}`}>
      <span className="mic"><Icon name={isE ? 'truck' : 'recolha'} /></span>
      <div className="mcol">
        <b>{isE ? 'Entrega' : 'Recolha'} de {m.qtd} cavaletes</b>
        <span className="m">{m.guia}{m.estado === 'por_atribuir' ? '' : ' · ' + fd(m.data)}</span>
        {motT}
      </div>
      <div className="mcol">
        <button
          type="button"
          className="mlink"
          onClick={() => {
            if (o) {
              setObraId(o.id);
              setPageState('obras');
              window.scrollTo(0, 0);
            }
          }}
        >
          {o?.nome}
        </button>
        <span className="m">{o?.empresa} · {o?.cidade}</span>
      </div>
      <div className="mstat">
        {status}
        {m.estado === 'divergencia' && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => openModal({ type: 'resolver', id: m.id })}
          >
            Resolver diferença
          </button>
        )}
      </div>
    </div>
  );
}
