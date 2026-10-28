'use client';

import React, { useState } from 'react';
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

  // Estado do accordion de alertas
  const [aOpen, setAOpen] = useState(null);

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
      .filter(p => p.estado === 'pendente')
      .forEach(p => {
        const o = obras.find(x => x.id === p.obraId);
        items.push({
          tone: 'info',
          icon: 'hand',
          t: `Pedido de recolha: ${p.qtd} cavaletes`,
          s: `${o?.nome} · ${o?.cidade} · pedido ${rel(p.data)}`,
          action: () => {
            if (o) openObra(o.id);
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
                        <span className={`aic tone-${a.tone}`}><Icon name={a.icon} /></span>
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
              <h2>Onde estão os cavaletes</h2>
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
            <div className="card-b mapprev">
              <MapaPortugal preview />
            </div>
          </section>
        </div>
      </>
    );
  }

  // ================= PÁGINA OBRAS =================
  if (page === 'obras') {
    // ---------------- FICHA DA EMPRESA ----------------
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

      H.sort(eh.ord === 'qtd' ? (a, b) => b.qtd - a.qtd : (a, b) => b.data - a.data);
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
                <span className="otb">{L.length}</span>
              </button>
            </div>
          )}

          <section className="ocard ohero">
            <div className="oh-top">
              <div>
                <p className="oh-emp">Ficha da empresa · NIF {I.nif}</p>
                <h1 className="oh-t">{emp}</h1>
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

            <div className="oh-con">
              <div className="oc-i">
                <small>Responsável</small>
                <span><Icon name="user" />{I.resp}</span>
              </div>
              <div className="oc-i">
                <small>Telefone</small>
                <span>
                  <Icon name="phone" />
                  <a className="tel-link" target="_blank" rel="noopener noreferrer" href={`tel:+351${I.tel.replace(/\D/g, '')}`}>
                    {I.tel}
                  </a>
                </span>
              </div>
              <div className="oc-i">
                <small>Telemóvel</small>
                <span>
                  <Icon name="phone" />
                  <a className="tel-link" target="_blank" rel="noopener noreferrer" href={`tel:+351${I.tm.replace(/\D/g, '')}`}>
                    {I.tm}
                  </a>
                </span>
              </div>
              <div className="oc-i">
                <small>Email</small>
                <span><Icon name="mail" />{I.email}</span>
              </div>
            </div>
          </section>

          <div className="ekpis">
            <div className="ekpi">
              <small>Cavaletes em posse</small>
              <span className="num">{fmtN(tot)}</span>
              <em>em {ativas.filter(x => x.r.total > 0).length} obra{ativas.filter(x => x.r.total > 0).length === 1 ? '' : 's'}</em>
            </div>
            <div className="ekpi">
              <small>A caminho</small>
              <span className="num">{fmtN(cam)}</span>
              <em>por confirmar</em>
            </div>
            <div className={`ekpi${late ? ' late' : ''}`}>
              <small>Prazo de {PRAZO} dias ultrapassado</small>
              <span className="num">{fmtN(late)}</span>
              <em>{late ? 'cavaletes fora do prazo' : 'nenhum fora do prazo'}</em>
            </div>
            <div className="ekpi wide">
              <small>Distribuição dos prazos</small>
              <span className="ebar">
                {['ok', 'watch', 'soon', 'late'].map(k =>
                  seg[k] ? (
                    <i key={k} style={{ flex: seg[k], background: ST[k].color }} title={`${seg[k]} cavaletes`} />
                  ) : null
                )}
              </span>
              <span className="elg">
                {[
                  ['ok', '< 30 dias'],
                  ['watch', '30–50'],
                  ['soon', '50–60'],
                  ['late', 'Terminado'],
                ].map(([k, l]) => (
                  <span key={k}>
                    <i style={{ background: ST[k].color }} />
                    {l} <b>{seg[k]}</b>
                  </span>
                ))}
              </span>
            </div>
          </div>

          <section className="ocard">
            <div className="oc-h">
              <div>
                <h2>Obras da empresa</h2>
                <p>Cada obra tem o seu responsável local e o seu prazo.</p>
              </div>
              <span className="oc-badge">{L.length} obra{L.length > 1 ? 's' : ''}</span>
            </div>
            <div className="eobras">
              {L.slice()
                .sort((a, b) => (a.r.dias ?? 999) - (b.r.dias ?? 999))
                .map(({ o, r }) => {
                  const used = r.first ? Math.min(1, Math.max(0, 1 - r.dias / PRAZO)) : 0;
                  return (
                    <article key={o.id} className="eob" style={{ '--c': r.total ? ST[r.st].color : 'var(--line)' }}>
                      <div className="eob-h">
                        <div>
                          <b>{o.nome}</b>
                          <span><Icon name="pin" />{o.morada}, {o.cidade}</span>
                        </div>
                        <div className="eob-n">
                          <span className="num">{r.total}</span>
                          <small>em obra{r.transito ? ` · +${r.transito} a caminho` : ''}</small>
                        </div>
                      </div>
                      <div className="eob-c">
                        <span><Icon name="user" />{o.contacto}</span>
                        {/\d/.test(o.tel) && (
                          <span>
                            <Icon name="phone" />
                            <a className="tel-link" target="_blank" rel="noopener noreferrer" href={`tel:+351${o.tel.replace(/\D/g, '')}`}>
                              {o.tel}
                            </a>
                          </span>
                        )}
                      </div>
                      {r.first ? (
                        <div className="prazo">
                          <div className="bar" role="img" aria-label={`${Math.round(used * 100)}% do prazo de 60 dias usado`}>
                            <i style={{ width: `${Math.max(4, used * 100)}%`, background: ST[r.st].soft }} />
                            <div className="ticks"><span /><span /><span /><span /><span /><span /></div>
                          </div>
                          <small>
                            <span style={{ color: ST[r.st].color, fontWeight: 500 }}>{diasTxt(r.dias)}</span> · prazo {fd(r.first.prazo)}
                          </small>
                        </div>
                      ) : (
                        <div className="prazo"><small>Sem cavaletes na obra</small></div>
                      )}
                      <button type="button" className="eob-go" onClick={() => openObra(o.id)}>
                        Abrir ficha desta obra
                        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14M13 6l6 6-6 6" />
                        </svg>
                      </button>
                    </article>
                  );
                })}
            </div>
          </section>

          <section className="ocard">
            <div className="oc-h">
              <div>
                <h2>Histórico de movimentos</h2>
                <p>Todas as guias de entrega e recolha com esta empresa.</p>
              </div>
              <span className="oc-sub">{H.length} movimento{H.length === 1 ? '' : 's'}</span>
            </div>

            <div className="ehfs">
              <label className="ehf">
                <span>Obra</span>
                <select value={eh.obra} onChange={e => { setEh(s => ({ ...s, obra: e.target.value })); setEhlim(15); }}>
                  <option value="">Todas as obras</option>
                  {L.map(x => (
                    <option key={x.o.id} value={x.o.id}>{x.o.nome}</option>
                  ))}
                </select>
              </label>

              <label className="ehf">
                <span>Data</span>
                <select value={eh.per} onChange={e => { setEh(s => ({ ...s, per: e.target.value })); setEhlim(15); }}>
                  <option value="">Sempre</option>
                  <option value="7">Últimos 7 dias</option>
                  <option value="30">Últimos 30 dias</option>
                  <option value="90">Últimos 90 dias</option>
                </select>
              </label>

              <label className="ehf">
                <span>Motorista</span>
                <select value={eh.mot} onChange={e => { setEh(s => ({ ...s, mot: e.target.value })); setEhlim(15); }}>
                  <option value="">Todos</option>
                  {mots.map(m => (
                    <option key={m} value={m}>Sr. {m}</option>
                  ))}
                </select>
              </label>

              <label className="ehf">
                <span>Estado</span>
                <select value={eh.est} onChange={e => { setEh(s => ({ ...s, est: e.target.value })); setEhlim(15); }}>
                  <option value="">Todos</option>
                  <option value="ass">Entregue e assinado</option>
                  <option value="pend">Por assinar</option>
                  <option value="dif">Com diferença</option>
                  <option value="rec">Recolhas</option>
                </select>
              </label>

              <label className="ehf">
                <span>Ordenar</span>
                <select value={eh.ord} onChange={e => setEh(s => ({ ...s, ord: e.target.value }))}>
                  <option value="rec">Mais recentes</option>
                  <option value="qtd">Maior quantidade</option>
                </select>
              </label>
            </div>

            <div className="ohist">
              {shownMovs.length === 0 ? (
                <p className="muted" style={{ padding: '14px 0', textAlign: 'center' }}>
                  Nenhum movimento com estes filtros.
                </p>
              ) : (
                shownMovs.map(m => {
                  const isE = m.tipo === 'entrega';
                  const o = obras.find(x => x.id === m.obraId);
                  const subParts = [
                    o?.nome,
                    m.motorista ? `Sr. ${m.motorista}` : '',
                    isE ? (m.assinatura ? `Assinado por ${m.assinatura}` : 'Por assinar') : '',
                  ].filter(Boolean);

                  return (
                    <div key={m.id} className={`oh-row ${isE ? 'is-e' : 'is-r'}`}>
                      <span className="oh-type">{isE ? 'Entrega' : 'Recolha'}</span>
                      <div className="oh-rt">
                        <b>
                          {isE ? qEntregue(m) : m.qtd} cavaletes <span className="atl-code">{m.guia}</span>
                          <small> · {fd(m.data)}</small>
                        </b>
                        <span>{subParts.join(' · ')}</span>
                      </div>
                      {movPill(m)}
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => openModal({ type: 'mov', id: m.id })}
                      >
                        Detalhes
                      </button>
                    </div>
                  );
                })
              )}
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

    // ---------------- FICHA DA OBRA ----------------
    if (obraId) {
      const o = obras.find(x => x.id === obraId);
      if (!o) return null;
      const r = resumo(o, movs);
      const hist = movs.filter(m => m.obraId === o.id).sort((a, b) => b.data - a.data);

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
              <span className="otb">{nEmp}</span>
            </button>
          </div>

          <section className="ocard ohero">
            <div className="oh-top">
              <div>
                <button
                  type="button"
                  className="oh-emp oh-empl"
                  onClick={() => openEmpresa(o.empresa)}
                >
                  {o.empresa}
                  <Icon name="right" />
                </button>
                <h1 className="oh-t">{o.nome}</h1>
                <p className="oh-a">
                  <Icon name="pin" />
                  {o.morada}, {o.cidade} · {o.distrito}
                </p>
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

            <div className="oh-mid">
              <div className="oh-cnt">
                <small>Cavaletes nesta obra</small>
                <span className="num">{r.total}</span>
                {r.transito ? <em>+ {r.transito} a caminho</em> : null}
              </div>
              <div className="oh-pz">
                <div className="oh-pzh">
                  <span>Prazo da entrega mais antiga ({PRAZO} dias)</span>
                  <b style={{ color: r.total ? ST[st].color : 'var(--muted)' }}>{prazoTxt}</b>
                </div>
                <div className="oh-bar">
                  <i style={{ width: `${f ? Math.max(3, used * 100) : 0}%`, background: col }} />
                </div>
                <div className="oh-pzf">
                  <span>{f ? `Data de envio: ${fd(f.data)}` : ''}</span>
                  <span>{f ? `Limite mais próximo: ${fd(f.prazo)}` : ''}</span>
                </div>
              </div>
            </div>

            <div className="oh-con">
              <div className="oc-i">
                <small>Responsável</small>
                <span><Icon name="user" />{o.contacto}</span>
              </div>
              <div className="oc-i">
                <small>Telemóvel</small>
                <span>
                  <Icon name="phone" />
                  {/\d/.test(o.tel) ? (
                    <a className="tel-link" target="_blank" rel="noopener noreferrer" href={`tel:+351${o.tel.replace(/\D/g, '')}`}>
                      {o.tel}
                    </a>
                  ) : (
                    o.tel
                  )}
                </span>
              </div>
              <div className="oc-i">
                <small>Email</small>
                <span><Icon name="mail" />{o.email}</span>
              </div>
              <div className="oc-i">
                <small>Último lembrete</small>
                <span><Icon name="cal" />{lembretes[o.id] ? fd(lembretes[o.id]) : 'Nenhum enviado'}</span>
              </div>
            </div>
          </section>

          {nLots > 0 && (
            <section className="ocard">
              <div className="oc-h">
                <div>
                  <h2>Prazos por entrega nesta obra</h2>
                  <p>As recolhas abatem primeiro no lote de entrega mais antigo.</p>
                </div>
                <span className="oc-badge">{nLots} lote{nLots > 1 ? 's' : ''} ativo{nLots > 1 ? 's' : ''}</span>
              </div>
              <div className="tablewrap">
                <table className="otab">
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
                          <td data-l="Guia"><span className="atl-code">{l.mov.guia}</span></td>
                          <td data-l="Data de entrega">{fd(l.data)}</td>
                          <td data-l="Cavaletes na obra">
                            <span className="qinfo">
                              <b>{l.qtd} cavaletes</b>
                              <button
                                type="button"
                                className="infob"
                                aria-label="Ver números dos cavaletes"
                                onClick={() => openModal({ type: 'cavnums', id: l.mov.id })}
                              >
                                <Icon name="info" />
                              </button>
                            </span>
                          </td>
                          <td data-l="Data limite">{fd(l.prazo)}</td>
                          <td data-l="Dias restantes" style={{ color: ST[s2].color, fontWeight: 500 }}>
                            {diasTxt(l.dias).replace(/^./, c => c.toUpperCase())}
                          </td>
                          <td data-l="Situação" style={{ textAlign: 'right' }}>
                            <span className="spill" style={{ '--c': ST[s2].color }}>
                              <i />
                              {ST[s2].label}
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

          <section className="ocard">
            <div className="oc-h">
              <div>
                <h2>Histórico de movimentos da obra</h2>
              </div>
              <span className="oc-sub">{hist.length} movimento{hist.length === 1 ? '' : 's'} registado{hist.length === 1 ? '' : 's'}</span>
            </div>
            <div className="ohist">
              {hist.map(m => {
                const isE = m.tipo === 'entrega';
                const subParts = [
                  m.motorista ? `Motorista: Sr. ${m.motorista}` : '',
                  isE && m.assinatura ? `Assinado por ${m.assinatura}` : '',
                ].filter(Boolean);

                return (
                  <div key={m.id} className={`oh-row ${isE ? 'is-e' : 'is-r'}`}>
                    <span className="oh-type">{isE ? 'Entrega' : 'Recolha'}</span>
                    <div className="oh-rt">
                      <b>
                        {isE ? qEntregue(m) : m.qtd} cavaletes <span className="atl-code">{m.guia}</span>
                        <small> · {fd(m.data)}</small>
                      </b>
                      <span>{subParts.join(' · ')}</span>
                    </div>
                    {movPill(m)}
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => openModal({ type: 'mov', id: m.id })}
                    >
                      Detalhes
                    </button>
                  </div>
                );
              })}
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

    const baseList = obras
      .map(o => ({ o, r: resumo(o, movs) }))
      .filter(x => (x.r.total > 0 || x.r.transito > 0) && inGroup(x.o))
      .map(x => x.r);
    const countStatus = st => baseList.filter(r => r.st === st).length;

    const chips = [
      ['todas', 'Todas', baseList.length],
      ['late', 'Prazo terminado', countStatus('late')],
      ['soon', '50–60 dias', countStatus('soon')],
      ['watch', '30–50 dias', countStatus('watch')],
      ['ok', '< 30 dias', countStatus('ok')],
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
              ['distrito', 'pin', 'Por distrito', 'Distrito'],
              ['empresa', 'obra', 'Por empresa', 'Empresa'],
              ['todas', 'search', 'Todas as obras', 'Todas'],
            ].map(([k, iconName, labelLg, labelSh]) => (
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
                <span className="lg">{labelLg}</span>
                <span className="sh">{labelSh}</span>
              </button>
            ))}
          </div>
        </div>

        {isFolderView ? (
          <div className="folders">
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
            {ogSel && og !== 'todas' && (
              <div className="crumb">
                <button
                  type="button"
                  className="linkbtn"
                  onClick={() => {
                    setOgSel(null);
                    setMlim(10);
                  }}
                >
                  <Icon name="left" />
                  {og === 'distrito' ? 'Distritos' : 'Empresas'}
                </button>
                <span>/</span>
                <b>{ogSel}</b>
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
            )}

            <div className="chips-seg" style={{ marginBottom: '16px' }} role="group" aria-label="Filtrar">
              {chips.map(([k, l, count]) => (
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
                  {l} <span className="n">{count}</span>
                </button>
              ))}
            </div>

            <div className="olist" id="olist">
              {filteredList.length === 0 ? (
                <div className="card" style={{ padding: '28px', textAlign: 'center' }}>
                  <p className="muted">Nenhuma obra encontrada.</p>
                </div>
              ) : (
                filteredList.slice(0, mlim).map(({ o, r }) => (
                  <div
                    key={o.id}
                    className="orow"
                    role="button"
                    tabIndex={0}
                    onClick={() => openObra(o.id)}
                  >
                    <div className="oleft">
                      <div className="oname">
                        <b>{o.nome}</b>
                        <span className="oloc">
                          <Icon name="pin" />
                          {o.morada}, {o.cidade}
                        </span>
                      </div>
                      <div className="ometa">
                        <span
                          className="oemp"
                          role="button"
                          tabIndex={0}
                          onClick={e => {
                            e.stopPropagation();
                            openEmpresa(o.empresa);
                          }}
                        >
                          {o.empresa}
                        </span>
                        {r.transito > 0 && <span className="otrn">+{r.transito} a caminho</span>}
                      </div>
                    </div>

                    <div className="omid">
                      {r.first ? (
                        <div className="prazo">
                          <div className="bar" role="img" aria-label="Prazo">
                            <i
                              style={{
                                width: `${Math.max(4, Math.min(100, (1 - r.dias / PRAZO) * 100))}%`,
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
                    </div>

                    <div className="oright">
                      <span className="onum num">{r.total}</span>
                      <small className="muted">cavaletes</small>
                    </div>

                    <span className="chev"><Icon name="right" /></span>
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

    const countTipo = k => (k === 'todos' ? inv.length : inv.filter(x => x.tipo === k).length);
    const countEst = k => (k === 'todos' ? inv.length : inv.filter(x => cavEstado(x) === k).length);

    const normCavQ = norm(cav.q.trim());
    const filteredCav = inv
      .filter(x => cav.tipo === 'todos' || x.tipo === cav.tipo)
      .filter(x => cav.est === 'todos' || cavEstado(x) === cav.est)
      .filter(x => !normCavQ || String(x.num).includes(normCavQ) || (x.obra && norm(x.obra.nome + ' ' + x.obra.empresa).includes(normCavQ)));

    const cFab = inv.filter(x => x.estado === 'fabrica').length;
    const cObra = inv.filter(x => x.estado === 'obra' && x.dias >= 0).length;
    const cLate = inv.filter(x => x.estado === 'obra' && x.dias < 0).length;
    const cCam = inv.filter(x => x.estado === 'caminho').length;

    return (
      <>
        <div className="pagehead">
          <div>
            <h1 className="ph">
              <span className="phi"><Icon name="cav" /></span>
              <span>Cavaletes</span>
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

        <div className="kpis">
          <div className="kpi">
            <span className="top"><Icon name="factory" />Na fábrica</span>
            <span className="kvr"><span className="v num">{fmtN(cFab)}</span></span>
          </div>
          <div className="kpi">
            <span className="top"><Icon name="obra" />Em obra</span>
            <span className="kvr"><span className="v num">{fmtN(cObra)}</span></span>
          </div>
          <div className="kpi">
            <span className="top"><Icon name="truck" />A caminho</span>
            <span className="kvr"><span className="v num">{fmtN(cCam)}</span></span>
          </div>
          <div className={`kpi${cLate > 0 ? ' late' : ''}`}>
            <span className="top"><Icon name="alert" />Fora do prazo</span>
            <span className="kvr"><span className="v num">{fmtN(cLate)}</span></span>
          </div>
        </div>

        <div className="toolbar" style={{ marginTop: '16px' }}>
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
          <div className="chips-seg" role="group" aria-label="Filtrar por tipo">
            {[['todos', 'Todos', countTipo('todos')], ...tipos.map(([k, v]) => [k, v.nome, countTipo(k)])].map(
              ([k, l, count]) => (
                <button
                  key={k}
                  type="button"
                  className="chip"
                  aria-pressed={cav.tipo === k}
                  onClick={() => setCav(s => ({ ...s, tipo: k, lim: 20 }))}
                >
                  {l} <span className="n">{count}</span>
                </button>
              )
            )}
          </div>
        </div>

        <div className="chips-seg" style={{ marginBottom: '16px' }} role="group" aria-label="Filtrar por estado">
          {[
            ['todos', 'Todos', countEst('todos')],
            ['fabrica', 'Na fábrica', countEst('fabrica')],
            ['obra', 'Em obra', countEst('obra')],
            ['caminho', 'A caminho', countEst('caminho')],
            ['late', 'Fora do prazo', countEst('late')],
          ].map(([k, l, count]) => (
            <button
              key={k}
              type="button"
              className="chip"
              aria-pressed={cav.est === k}
              onClick={() => setCav(s => ({ ...s, est: k, lim: 20 }))}
            >
              {l} <span className="n">{count}</span>
            </button>
          ))}
        </div>

        <section className="card">
          <div className="card-b">
            <div className="tablewrap">
              <table className="otab">
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Tipo</th>
                    <th>Estado</th>
                    <th>Localização / Obra</th>
                    <th>Desde</th>
                    <th style={{ textAlign: 'right' }}>Prazo</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCav.slice(0, cav.lim).map(c => {
                    const est = cavEstado(c);
                    const isLate = est === 'late';
                    return (
                      <tr key={c.num}>
                        <td data-l="Número"><span className="atl-code">{c.num}</span></td>
                        <td data-l="Tipo">{TIPOS_CAV[c.tipo]?.nome || c.tipo}</td>
                        <td data-l="Estado">
                          <span
                            className={`pill tone-${
                              est === 'fabrica' ? 'ok' : est === 'caminho' ? 'info' : isLate ? 'late' : 'warn'
                            }`}
                          >
                            {est === 'fabrica'
                              ? 'Na fábrica'
                              : est === 'caminho'
                              ? 'A caminho'
                              : isLate
                              ? 'Fora do prazo'
                              : 'Em obra'}
                          </span>
                        </td>
                        <td data-l="Localização / Obra">
                          {c.obra ? (
                            <button
                              type="button"
                              className="linkbtn"
                              style={{ textAlign: 'left' }}
                              onClick={() => openObra(c.obra.id)}
                            >
                              <b>{c.obra.nome}</b>
                              <span className="muted" style={{ display: 'block', fontSize: '0.85em' }}>
                                {c.obra.empresa} · {c.obra.cidade}
                              </span>
                            </button>
                          ) : (
                            <span className="muted">Fábrica de Mortágua</span>
                          )}
                        </td>
                        <td data-l="Desde">{c.data ? fd(c.data) : '—'}</td>
                        <td data-l="Prazo" style={{ textAlign: 'right' }}>
                          {c.dias != null ? (
                            <span style={{ color: isLate ? 'var(--late)' : 'inherit', fontWeight: isLate ? 600 : 400 }}>
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
              <div className="more" style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setCav(s => ({ ...s, lim: s.lim + 20 }))}
                >
                  <Icon name="plus" />
                  Ver mais ({filteredCav.length - cav.lim} restantes)
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

    const cnt = k => (k === 'todas' ? rs.length : rs.filter(x => x.r.st === k).length);
    const ch = [
      ['todas', 'Todas', ''],
      ['late', 'Terminado', 'var(--late)', ST.late.color],
      ['soon', '50–60 dias', 'var(--warn)', ST.soon.color],
      ['watch', '30–50 dias', 'var(--info)', ST.watch.color],
      ['ok', '< 30 dias', 'var(--ok)', ST.ok.color],
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
              <div className="mapbox" style={{ maxHeight: '560px' }}>
                <MapaPortugal filter={mapf} />
              </div>
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
                    <span className="chev"><Icon name="right" /></span>
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
              {movs.map(m => renderMovRow(m, obras, openModal, openObra, openEmpresa))}
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

    const groups = [
      {
        k: 'dif',
        t: 'Diferenças nas entregas',
        tone: 'warn',
        icon: 'diff',
        n: difs.length,
        sub: difs.length
          ? `${difs.length} entrega${difs.length > 1 ? 's' : ''} com números que não batem certo`
          : 'Tudo bate certo',
        items: difs.map(m => {
          const o = obras.find(x => x.id === m.obraId);
          return (
            <div key={m.id} className="aitem">
              <span className="ic tone-warn"><Icon name="diff" /></span>
              <div className="t">
                <b>Entrega {m.guia} · {o?.nome}</b>
                <span>
                  Vidraria {m.qtd} · motorista {m.qtdMot ?? '—'} · cliente {m.qtdCli ?? '—'}
                </span>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => openModal({ type: 'resolver', id: m.id })}
              >
                Resolver
              </button>
            </div>
          );
        }),
      },
      {
        k: 'ped',
        t: 'Pedidos de recolha',
        tone: 'info',
        icon: 'hand',
        n: nPend,
        sub:
          [
            nPend > 0 && `${nPend} por marcar`,
            nLog > 0 && `${nLog} na logística`,
            nAg > 0 && `${nAg} marcada${nAg > 1 ? 's' : ''}`,
          ]
            .filter(Boolean)
            .join(' · ') || 'Sem pedidos',
        items: peds.map(p => {
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
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    if (!p.guia) p.guia = 'GR-2026/' + (1400 + pedidos.indexOf(p) + 1);
                    openModal({ type: 'mrec', pid: p.id });
                  }}
                >
                  Marcar
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => window.print()}
                >
                  <Icon name="print" />Imprimir
                </button>
              )}
            </div>
          );
        }),
      },
      ...[
        ['late', 'Prazo terminado'],
        ['soon', 'Na obra há 50 a 60 dias'],
        ['watch', 'Na obra há 30 a 50 dias'],
      ].map(([k, label]) => {
        const L = g(k);
        return {
          k,
          t: label,
          tone: ST[k].tone,
          icon: ST[k].icon,
          n: L.length,
          sub: sumQ(L),
          items: L.map(({ o, r }) => (
            <div key={o.id} className="aitem">
              <span className={`ic tone-${ST[r.st].tone}`}><Icon name={ST[r.st].icon} /></span>
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
                onClick={() => openObra(o.id)}
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
                Preparar email
              </button>
            </div>
          )),
        };
      }),
    ];

    // Grupo aberto por omissão (o mais urgente)
    const activeGroupKey =
      aOpen !== null
        ? aOpen
        : groups.find(x => x.k === 'dif' && x.n > 0)?.k ||
          groups.find(x => x.k === 'late' && x.n > 0)?.k ||
          groups.find(x => x.n > 0)?.k ||
          'dif';

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

        <div className="acc">
          {groups.map(grp => {
            const isOpen = activeGroupKey === grp.k;
            return (
              <div key={grp.k} className="acc-g">
                <button
                  type="button"
                  className="acc-h"
                  aria-expanded={isOpen}
                  onClick={() => setAOpen(isOpen ? '' : grp.k)}
                >
                  <span className={`ic tone-${grp.tone}`}><Icon name={grp.icon} /></span>
                  <div>
                    <b>{grp.t}</b>
                    <span className="muted">{grp.sub}</span>
                  </div>
                  <span className="count">{grp.n}</span>
                  <svg
                    className={`chev${isOpen ? ' open' : ''}`}
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                {isOpen && (
                  <div className="acc-b">
                    {grp.items.length === 0 ? (
                      <p className="muted" style={{ padding: '16px 0', textAlign: 'center' }}>
                        Nenhum alerta nesta secção.
                      </p>
                    ) : (
                      grp.items
                    )}
                  </div>
                )}
              </div>
            );
          })}
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
            if (o) openObra(o.id);
          }}
        >
          {o?.nome}
        </button>
        <span
          className="m"
          style={{ cursor: 'pointer' }}
          onClick={() => {
            if (o) openEmpresa(o.empresa);
          }}
        >
          {o?.empresa} · {o?.cidade}
        </span>
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
