'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { Icon } from '../data/icons';
import {
  TODAY,
  IMG,
  MOTORISTAS,
  MOT_TEL,
  TOWNS,
  TIPOS_CAV,
  isoD,
  addDays,
} from '../data/constants';
import {
  inventario,
  tipoDe,
  cavEstado,
  resLists,
  cliList,
  fd,
  fdl,
  parseIso,
  norm,
  esc,
  emailTpl,
} from '../data/logic';

export default function ModalLayer() {
  const {
    modal,
    closeModal,
    obras,
    movs,
    pedidos,
    criarEntrega,
    registarRecolha,
    marcarRecolhaLogistica,
    atribuirMotoristaRecolha,
    resolverDivergencia,
    enviarEmailLembrete,
    adicionarPessoa,
    openModal,
    motoristasList,
    showToast,
  } = useDashboard();

  // Estados locais para modais específicos
  const [novaState, setNovaState] = useState(null);
  const [atribState, setAtribState] = useState(null);
  const [emailState, setEmailState] = useState(null);
  const [addPState, setAddPState] = useState({ papel: 'Motorista', nome: '', tel: '', err: '' });
  const [resolverSub, setResolverSub] = useState(null);

  const prevRef = useRef(null);

  // Inicialização ao abrir modal
  useEffect(() => {
    if (!modal) {
      setNovaState(null);
      setAtribState(null);
      setEmailState(null);
      setResolverSub(null);
      return;
    }

    if (modal.type === 'nova') {
      const inv = inventario(obras, movs);
      setNovaState({
        obraId: modal.obraId || null,
        q: '',
        nova: null,
        nums: modal.nums || [],
        cq: '',
        date: isoD(TODAY),
        calOpen: false,
        calM: null,
        mot: null,
        mq: '',
        err: '',
        _inv: inv,
      });
    } else if (modal.type === 'email') {
      const o = obras.find(x => x.id === modal.obraId);
      const tplKey = modal.tpl || 'amigavel';
      const tpl = o ? emailTpl(o, tplKey, movs) : { sub: '', body: '' };
      setEmailState({
        obraId: modal.obraId,
        tpl: tplKey,
        to: o?.email || '',
        sub: tpl.sub,
        body: tpl.body,
      });
    } else if (modal.type === 'atrib') {
      const m = movs.find(x => x.id === modal.movId);
      let d = new Date(TODAY);
      do {
        d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
      } while (d.getDay() === 0 || d.getDay() === 6);

      setAtribState({
        movId: modal.movId,
        date: m && m.estado === 'agendada' ? isoD(m.data) : isoD(d),
        calOpen: false,
        calM: null,
        mot: m ? m.motorista : null,
        mq: '',
        err: '',
      });
    }
  }, [modal, obras, movs]);

  // Ajuste do scale da folha A4 no preview
  useEffect(() => {
    if (modal?.type === 'mrec') {
      const w = prevRef.current;
      if (!w) return;
      const k = w.clientWidth / 794;
      const inner = w.querySelector('.fprev-in');
      if (inner) inner.style.transform = `scale(${k})`;
      w.style.height = `${561 * k}px`;
    }
  }, [modal]);

  if (!modal) return null;

  const printFolha = (p, rec) => {
    let a = document.getElementById('print-area');
    if (!a) {
      a = document.createElement('div');
      a.id = 'print-area';
      document.body.appendChild(a);
    }
    a.innerHTML = `
      <div class="fs-page">
        ${renderFolhaViaHtml(p, rec, 'Via do cliente', obras, movs)}
        <div class="fs-cut"><span>✂</span></div>
        ${renderFolhaViaHtml(p, rec, 'Via da Vidraria Mortágua', obras, movs)}
      </div>`;
    try {
      window.print();
    } catch {
      showToast('A impressão não está disponível nesta janela.');
    }
  };

  // Renderização condicional dos modais
  return (
    <>
      <div
        className="overlay"
        data-act="bg"
        onClick={(e) => {
          if (e.target === e.currentTarget) closeModal();
        }}
      >
        <div className="modal" role="dialog" aria-modal="true">
          {/* ================= MODAL NOVA ENTREGA ================= */}
          {modal.type === 'nova' && novaState && (
            <>
              <div className="mh">
                <h2>Nova entrega</h2>
                <button type="button" className="iconbtn" aria-label="Fechar" onClick={closeModal}>
                  <Icon name="x" />
                </button>
              </div>
              <div className="mb">
                <div className="field">
                  <label htmlFor="n-oq">Para que obra?</label>
                  {novaState.obraId ? (
                    (() => {
                      const sel = obras.find(o => o.id === novaState.obraId);
                      return (
                        <div className="selobra">
                          <span className="mic"><Icon name="obra" /></span>
                          <div>
                            <b>{sel?.nome}</b>
                            <span>{sel?.empresa} · {sel?.cidade}</span>
                          </div>
                          <button
                            type="button"
                            className="linkbtn"
                            onClick={() => setNovaState(s => ({ ...s, obraId: null, nova: null }))}
                          >
                            Alterar
                          </button>
                        </div>
                      );
                    })()
                  ) : novaState.nova ? (
                    <div className="newobra">
                      <div className="nh">
                        <span className="pill tone-ok"><Icon name="plus" />Obra nova</span>
                        <button
                          type="button"
                          className="linkbtn"
                          onClick={() => setNovaState(s => ({ ...s, nova: null }))}
                        >
                          Escolher obra existente
                        </button>
                      </div>
                      <div className="g2">
                        <div className="field">
                          <label htmlFor="no-nome">Nome da obra</label>
                          <input
                            id="no-nome"
                            value={novaState.nova.nome}
                            placeholder="Ex.: Edifício Rio Dão"
                            onChange={e => setNovaState(s => ({ ...s, nova: { ...s.nova, nome: e.target.value } }))}
                          />
                        </div>
                        <div className="field">
                          <label htmlFor="no-emp">Cliente (empresa)</label>
                          <input
                            id="no-emp"
                            value={novaState.nova.empresa}
                            placeholder="Escreva ou escolha"
                            onChange={e => setNovaState(s => ({ ...s, nova: { ...s.nova, empresa: e.target.value } }))}
                          />
                        </div>
                        <div className="field">
                          <label htmlFor="no-cid">Localidade</label>
                          <input
                            id="no-cid"
                            value={novaState.nova.cidade}
                            placeholder="Ex.: Viseu"
                            onChange={e => setNovaState(s => ({ ...s, nova: { ...s.nova, cidade: e.target.value } }))}
                          />
                        </div>
                        <div className="field">
                          <label htmlFor="no-mor">Morada</label>
                          <input
                            id="no-mor"
                            value={novaState.nova.morada}
                            placeholder="Rua, n.º"
                            onChange={e => setNovaState(s => ({ ...s, nova: { ...s.nova, morada: e.target.value } }))}
                          />
                        </div>
                        <div className="field">
                          <label htmlFor="no-con">Responsável na obra</label>
                          <input
                            id="no-con"
                            value={novaState.nova.contacto}
                            placeholder="Nome"
                            onChange={e => setNovaState(s => ({ ...s, nova: { ...s.nova, contacto: e.target.value } }))}
                          />
                        </div>
                        <div className="field">
                          <label htmlFor="no-tel">Telemóvel</label>
                          <input
                            id="no-tel"
                            inputMode="numeric"
                            maxLength={15}
                            value={novaState.nova.tel}
                            placeholder="Recebe o SMS de confirmação"
                            onChange={e => setNovaState(s => ({ ...s, nova: { ...s.nova, tel: e.target.value } }))}
                          />
                        </div>
                        <div className="field" style={{ gridColumn: '1/-1' }}>
                          <label htmlFor="no-mail">Email</label>
                          <input
                            id="no-mail"
                            inputMode="email"
                            value={novaState.nova.email}
                            placeholder="Para os lembretes do prazo"
                            onChange={e => setNovaState(s => ({ ...s, nova: { ...s.nova, email: e.target.value } }))}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="cbox">
                        <Icon name="search" />
                        <input
                          id="n-oq"
                          autoComplete="off"
                          placeholder="Escreva o nome da obra, cliente ou localidade"
                          value={novaState.q}
                          onChange={e => setNovaState(s => ({ ...s, q: e.target.value }))}
                        />
                      </div>
                      <div className="cbox-list">
                        {(() => {
                          const nq = norm(novaState.q.trim());
                          const list = nq
                            ? obras.filter(o => norm(o.nome + ' ' + o.empresa + ' ' + o.cidade).includes(nq)).slice(0, 6)
                            : [];
                          return (
                            <>
                              {list.map(o => (
                                <button
                                  key={o.id}
                                  type="button"
                                  className="cbox-i"
                                  onClick={() => setNovaState(s => ({ ...s, obraId: o.id, nova: null, err: '' }))}
                                >
                                  <b>{o.nome}</b>
                                  <span>{o.empresa} · {o.cidade}</span>
                                </button>
                              ))}
                              <button
                                type="button"
                                className="cbox-i new"
                                onClick={() =>
                                  setNovaState(s => ({
                                    ...s,
                                    nova: {
                                      nome: s.q.trim(),
                                      empresa: '',
                                      cidade: '',
                                      morada: '',
                                      contacto: '',
                                      tel: '',
                                      email: '',
                                    },
                                    obraId: null,
                                    err: '',
                                  }))
                                }
                              >
                                <Icon name="plus" />
                                <span>
                                  {novaState.q.trim()
                                    ? `Criar obra nova "${novaState.q.trim()}"`
                                    : 'Criar obra nova'}
                                </span>
                              </button>
                            </>
                          );
                        })()}
                      </div>
                    </>
                  )}
                </div>

                <div className="nrow">
                  {/* Data de envio com calendário customizado */}
                  <div className="field">
                    <label>Data de envio</label>
                    <button
                      type="button"
                      className={`calbtn ${novaState.calOpen ? 'open' : ''}`}
                      onClick={() => setNovaState(s => ({ ...s, calOpen: !s.calOpen, calM: null }))}
                      aria-expanded={novaState.calOpen}
                    >
                      <span className="calic"><Icon name="cal" /></span>
                      <span className="calv">
                        {(() => {
                          const d = parseIso(novaState.date);
                          const k = Math.round((d - TODAY) / 864e5);
                          const relText = k === 0 ? 'Hoje' : k === 1 ? 'Amanhã' : k === -1 ? 'Ontem' : ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'][d.getDay()];
                          return (
                            <>
                              <b>{relText}</b>
                              <span>{d.getDate()} {['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'][d.getMonth()]} {d.getFullYear()}</span>
                            </>
                          );
                        })()}
                      </span>
                      <svg className="calch" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </button>

                    {novaState.calOpen && (
                      <div className="calpop">
                        {(() => {
                          const base = novaState.calM ? parseIso(novaState.calM) : parseIso(novaState.date);
                          const y = base.getFullYear();
                          const mo = base.getMonth();
                          const first = new Date(y, mo, 1);
                          const off = (first.getDay() + 6) % 7;
                          const nDays = new Date(y, mo + 1, 0).getDate();
                          const tIso = isoD(TODAY);

                          return (
                            <>
                              <div className="calhd">
                                <button
                                  type="button"
                                  className="calnav"
                                  onClick={() =>
                                    setNovaState(s => {
                                      const b = s.calM ? parseIso(s.calM) : parseIso(s.date);
                                      return { ...s, calM: isoD(new Date(b.getFullYear(), b.getMonth() - 1, 1)) };
                                    })
                                  }
                                >
                                  <Icon name="left" />
                                </button>
                                <b>{['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'][mo]} <span>{y}</span></b>
                                <button
                                  type="button"
                                  className="calnav"
                                  onClick={() =>
                                    setNovaState(s => {
                                      const b = s.calM ? parseIso(s.calM) : parseIso(s.date);
                                      return { ...s, calM: isoD(new Date(b.getFullYear(), b.getMonth() + 1, 1)) };
                                    })
                                  }
                                >
                                  <Icon name="right" />
                                </button>
                              </div>
                              <div className="calwd">
                                {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((x, idx) => (
                                  <span key={idx}>{x}</span>
                                ))}
                              </div>
                              <div className="calgrid">
                                {Array.from({ length: off }).map((_, i) => (
                                  <span key={'empty-' + i} />
                                ))}
                                {Array.from({ length: nDays }).map((_, i) => {
                                  const dayNum = i + 1;
                                  const thisIso = isoD(new Date(y, mo, dayNum));
                                  const isSel = thisIso === novaState.date;
                                  const isToday = thisIso === tIso;
                                  const isWk = (off + i) % 7 > 4;
                                  return (
                                    <button
                                      key={dayNum}
                                      type="button"
                                      className={`cd ${isSel ? 'sel' : ''} ${isToday ? 'today' : ''} ${isWk ? 'wk' : ''}`}
                                      onClick={() =>
                                        setNovaState(s => ({
                                          ...s,
                                          date: thisIso,
                                          calOpen: false,
                                          calM: null,
                                          err: '',
                                        }))
                                      }
                                    >
                                      {dayNum}
                                    </button>
                                  );
                                })}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Motorista */}
                  <div className="field">
                    <label htmlFor="n-mq">Motorista</label>
                    {novaState.mot ? (
                      <button
                        type="button"
                        className="calbtn"
                        onClick={() => setNovaState(s => ({ ...s, mot: null, mq: '' }))}
                        aria-label="Alterar motorista"
                      >
                        <span className="calic"><Icon name="truck" /></span>
                        <span className="calv">
                          <b>Sr. {novaState.mot}</b>
                          <span>{MOT_TEL[novaState.mot] || 'Motorista'}</span>
                        </span>
                        <svg className="calch" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </button>
                    ) : (
                      <>
                        <div className="cbox">
                          <Icon name="search" />
                          <input
                            id="n-mq"
                            autoComplete="off"
                            placeholder="Escreva o nome do motorista"
                            value={novaState.mq}
                            onChange={e => setNovaState(s => ({ ...s, mq: e.target.value }))}
                          />
                        </div>
                        <div className="cbox-list">
                          {(() => {
                            const nq = norm(novaState.mq.trim());
                            const list = (nq
                              ? motoristasList.filter(m => norm(m).includes(nq))
                              : motoristasList
                            ).slice(0, 3);
                            if (!list.length) {
                              return <div className="cbox-empty">Nenhum motorista com esse nome.</div>;
                            }
                            return list.map(m => (
                              <button
                                key={m}
                                type="button"
                                className="cbox-i"
                                onClick={() => setNovaState(s => ({ ...s, mot: m, mq: '', err: '' }))}
                              >
                                <b>Sr. {m}</b>
                              </button>
                            ));
                          })()}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Cavaletes a enviar */}
                <div className="field">
                  <label htmlFor="n-cq">Cavaletes a enviar</label>
                  <div className="picker2">
                    <div className="pk-top">
                      <div className="pk-count">
                        <span className="num">{novaState.nums.length}</span>
                        <span>
                          cavalete{novaState.nums.length === 1 ? '' : 's'}
                          <small>
                            {(() => {
                              const selCavs = novaState.nums.map(n => novaState._inv.find(c => c.n === n)).filter(Boolean);
                              const cnt = k => selCavs.filter(c => c.tipo === k).length;
                              const parts = Object.keys(TIPOS_CAV)
                                .filter(k => cnt(k))
                                .map(k => `${cnt(k)} ${(cnt(k) > 1 ? TIPOS_CAV[k].nome : TIPOS_CAV[k].um).toLowerCase()}`);
                              return parts.length ? parts.join(' · ') : 'nenhum escolhido';
                            })()}
                          </small>
                        </span>
                      </div>
                      {novaState.nums.length ? (
                        <div className="pk-tags">
                          {novaState.nums.map(n => {
                            const c = novaState._inv.find(x => x.n === n);
                            if (!c) return null;
                            const isOff = c.estado !== 'fabrica';
                            return (
                              <span
                                key={n}
                                className={`ctag t${c.tipo} ${isOff ? 'warn' : ''}`}
                                title={c.estado === 'fabrica' ? 'Na fábrica' : 'Fora da fábrica'}
                              >
                                <b>{c.n}</b>
                                <small>{TIPOS_CAV[c.tipo]?.um}</small>
                                {isOff && <Icon name="alert" />}
                                <button
                                  type="button"
                                  aria-label={`Retirar ${c.n}`}
                                  onClick={() =>
                                    setNovaState(s => ({
                                      ...s,
                                      nums: s.nums.filter(x => x !== n),
                                    }))
                                  }
                                >
                                  <Icon name="x" />
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="pk-empty">Pesquise abaixo pelo número de cada cavalete que vai sair.</p>
                      )}
                    </div>

                    <div className="cbox">
                      <Icon name="search" />
                      <input
                        id="n-cq"
                        autoComplete="off"
                        inputMode="numeric"
                        placeholder="Escreva o número, ex.: 1001"
                        value={novaState.cq}
                        onChange={e => setNovaState(s => ({ ...s, cq: e.target.value.replace(/\D/g, '') }))}
                      />
                    </div>

                    {/* Resultados de cavaletes */}
                    {novaState.cq && (
                      <div className="cres">
                        {(() => {
                          const qNum = novaState.cq;
                          const matches = novaState._inv.filter(c => String(c.n).startsWith(qNum)).slice(0, 5);
                          if (!matches.length) {
                            return <p className="muted" style={{ fontSize: '0.9rem', padding: '8px 2px' }}>Nenhum cavalete com esse número.</p>;
                          }
                          return matches.map(c => {
                            const [t, i, l] = cavEstado(c);
                            const on = novaState.nums.includes(c.n);
                            return (
                              <div key={c.n} className={`cr ${c.estado !== 'fabrica' ? 'off' : ''}`}>
                                <span className={`crn t${c.tipo}`}>
                                  <b>{c.n}</b>
                                  <small>{TIPOS_CAV[c.tipo]?.um}</small>
                                </span>
                                <span className="crl">
                                  <span className={`pill tone-${t}`}>
                                    <Icon name={i} />
                                    {l}
                                  </span>
                                  <span className="muted">
                                    {c.obraId ? obras.find(o => o.id === c.obraId)?.nome : 'Mortágua'}
                                  </span>
                                </span>
                                {on ? (
                                  <span className="cr-on">
                                    <Icon name="check" />Adicionado
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    className="btn btn-soft btn-sm"
                                    onClick={() =>
                                      setNovaState(s => ({
                                        ...s,
                                        nums: [...s.nums, c.n],
                                        cq: '',
                                        err: '',
                                      }))
                                    }
                                  >
                                    <Icon name="plus" />Adicionar
                                  </button>
                                )}
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>
                </div>

                {novaState.err && <p className="err">{novaState.err}</p>}

                <div className="note">
                  <Icon name="info" />
                  <span>O motorista recebe um SMS com a carga. O prazo de 6 meses começa quando o cliente assinar.</span>
                </div>
              </div>

              <div className="mf">
                <button type="button" className="btn btn-ghost" onClick={closeModal}>
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    const mot = novaState.mot;
                    const oid = novaState.obraId;
                    const N = novaState.nova;

                    if (!oid && !N) {
                      setNovaState(s => ({ ...s, err: 'Escolha uma obra ou crie uma nova.' }));
                      return;
                    }
                    if (!novaState.nums.length) {
                      setNovaState(s => ({ ...s, err: 'Escolha os cavaletes a enviar.' }));
                      return;
                    }
                    if (N && (!N.nome.trim() || !N.empresa.trim() || !N.cidade.trim())) {
                      setNovaState(s => ({ ...s, err: 'Preencha pelo menos o nome da obra, o cliente e a localidade.' }));
                      return;
                    }
                    if (N && N.tel && N.tel.length < 9) {
                      setNovaState(s => ({ ...s, err: 'O número de telemóvel tem de ter pelo menos 9 dígitos.' }));
                      return;
                    }
                    if (!mot) {
                      setNovaState(s => ({ ...s, err: 'Escolha o motorista.' }));
                      return;
                    }

                    criarEntrega({
                      obraId: oid,
                      novaObraData: N,
                      nums: novaState.nums,
                      mot,
                      date: novaState.date,
                    });
                  }}
                >
                  <Icon name="send" />
                  Enviar ao motorista
                </button>
              </div>
            </>
          )}

          {/* ================= MODAL EMAIL ================= */}
          {modal.type === 'email' && emailState && (
            <>
              {(() => {
                const o = obras.find(x => x.id === emailState.obraId);
                return (
                  <>
                    <div className="mh">
                      <h2>Email para {o?.empresa}</h2>
                      <button type="button" className="iconbtn" aria-label="Fechar" onClick={closeModal}>
                        <Icon name="x" />
                      </button>
                    </div>
                    <div className="mb">
                      <div className="chips">
                        {[
                          ['amigavel', 'Lembrete amigável'],
                          ['terminado', 'Prazo terminado'],
                          ['recolha', 'Marcar recolha'],
                        ].map(([k, l]) => (
                          <button
                            key={k}
                            type="button"
                            className="chip"
                            aria-pressed={emailState.tpl === k}
                            onClick={() => {
                              const tpl = emailTpl(o, k, movs);
                              setEmailState(s => ({ ...s, tpl: k, sub: tpl.sub, body: tpl.body }));
                            }}
                          >
                            {l}
                          </button>
                        ))}
                      </div>
                      <div className="field">
                        <label htmlFor="e-to">Para</label>
                        <input
                          id="e-to"
                          value={emailState.to}
                          onChange={e => setEmailState(s => ({ ...s, to: e.target.value }))}
                        />
                      </div>
                      <div className="field">
                        <label htmlFor="e-sub">Assunto</label>
                        <input
                          id="e-sub"
                          value={emailState.sub}
                          onChange={e => setEmailState(s => ({ ...s, sub: e.target.value }))}
                        />
                      </div>
                      <div className="field">
                        <label htmlFor="e-body">Mensagem</label>
                        <textarea
                          id="e-body"
                          value={emailState.body}
                          onChange={e => setEmailState(s => ({ ...s, body: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="mf">
                      <button type="button" className="btn btn-ghost" onClick={closeModal}>
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => enviarEmailLembrete(emailState.obraId)}
                      >
                        <Icon name="send" />
                        Enviar email
                      </button>
                    </div>
                  </>
                );
              })()}
            </>
          )}

          {/* ================= MODAL RESOLVER DIFERENÇA ================= */}
          {modal.type === 'resolver' && (
            <>
              {(() => {
                const m = movs.find(x => x.id === modal.id);
                if (!m) return null;
                const o = obras.find(x => x.id === m.obraId);
                const X = resLists(m, obras, movs);
                const cnt = [X.V.length, X.MO.length, X.C.length];
                const maj = cnt.find((c, i) => cnt.indexOf(c) !== i);
                const pl = (n, a, b) => (n > 1 ? b : a);

                const tA = [
                  X.falta.length ? 'O cliente enganou-se' : '',
                  X.mais.length ? `${X.mais.join(', ')} não ${pl(X.mais.length, 'seguiu', 'seguiram')}` : '',
                ]
                  .filter(Boolean)
                  .join(' · ');

                const tB = [
                  X.falta.length ? `${X.falta.join(', ')} ${pl(X.falta.length, 'volta', 'voltam')} ao stock da fábrica` : '',
                  X.mais.length ? `${X.mais.join(', ')} ${pl(X.mais.length, 'passa', 'passam')} para a obra` : '',
                ]
                  .filter(Boolean)
                  .join(' · ');

                return (
                  <>
                    <div className="mh">
                      <div>
                        <p className="eyebrow">{m.guia} · {fd(m.data)}</p>
                        <h2>Resolver diferença</h2>
                        <p className="muted" style={{ fontSize: '0.9rem' }}>{o?.nome} · {o?.empresa}</p>
                      </div>
                      <button type="button" className="iconbtn" aria-label="Fechar" onClick={closeModal}>
                        <Icon name="x" />
                      </button>
                    </div>

                    <div className="mb">
                      <div className="rblks">
                        {/* Vidraria */}
                        <div className={`rblk ${maj != null && X.V.length !== maj ? 'bad' : ''}`}>
                          <div className="rbh">
                            <span className="rbi"><Icon name="factory" /></span>
                            <b>Vidraria</b>
                            <button
                              type="button"
                              className="rbn"
                              aria-label="Ver os números"
                              onClick={() => setResolverSub('v')}
                            >
                              <Icon name="cav" />
                            </button>
                          </div>
                          <span className="num">{X.V.length}</span>
                          <small>registou</small>
                        </div>

                        {/* Motorista */}
                        <div className={`rblk ${maj != null && X.MO.length !== maj ? 'bad' : ''}`}>
                          <div className="rbh">
                            <span className="rbi"><Icon name="truck" /></span>
                            <b>Motorista</b>
                            <button
                              type="button"
                              className="rbn"
                              aria-label="Ver os números"
                              onClick={() => setResolverSub('mo')}
                            >
                              <Icon name="cav" />
                            </button>
                          </div>
                          <span className="num">{X.MO.length}</span>
                          <small>carregou</small>
                        </div>

                        {/* Cliente */}
                        <div className={`rblk ${maj != null && X.C.length !== maj ? 'bad' : ''}`}>
                          <div className="rbh">
                            <span className="rbi"><Icon name="user" /></span>
                            <b>Cliente</b>
                            <button
                              type="button"
                              className="rbn"
                              aria-label="Ver os números"
                              onClick={() => setResolverSub('c')}
                            >
                              <Icon name="cav" />
                            </button>
                          </div>
                          <span className="num">{X.C.length}</span>
                          <small>assinou</small>
                        </div>
                      </div>

                      {/* Mensagens de explicação da diferença */}
                      {X.falta.length > 0 && (
                        <div className="rdiff miss">
                          <Icon name="alert" />
                          <div>
                            <b>{X.falta.length} {pl(X.falta.length, 'cavalete', 'cavaletes')} em falta no cliente</b>
                            <span className="cnums">
                              {X.falta.map(n => (
                                <span key={n} className="cnum">{n}</span>
                              ))}
                            </span>
                          </div>
                        </div>
                      )}

                      {X.mais.length > 0 && (
                        <div className="rdiff extra">
                          <Icon name="plus" />
                          <div>
                            <b>{X.mais.length} {pl(X.mais.length, 'cavalete', 'cavaletes')} a mais do que a Vidraria registou</b>
                            <span className="cnums">
                              {X.mais.map(n => (
                                <span key={n} className="cnum">{n}</span>
                              ))}
                            </span>
                            <small>
                              {pl(X.mais.length, 'Está registado', 'Estão registados')} na fábrica. Se {pl(X.mais.length, 'seguiu', 'seguiram')} mesmo, o stock é corrigido.
                            </small>
                          </div>
                        </div>
                      )}

                      {m.notaCli && (
                        <div className="cnote">
                          <Icon name="pen" />
                          <div>
                            <small>Nota do cliente · {m.assinatura || ''}</small>
                            <p>"{m.notaCli}"</p>
                          </div>
                        </div>
                      )}

                      <p className="muted" style={{ fontSize: '0.9rem' }}>
                        Depois de confirmar com o cliente, escolha o que aconteceu. Fica registado quem decidiu e quando.
                      </p>

                      <div className="choice">
                        <button
                          type="button"
                          onClick={() => resolverDivergencia({ movId: m.id, pickOption: 'A' })}
                        >
                          <span className="num">{X.V.length}</span>
                          <b>Foram {X.V.length}</b>
                          <span className="muted">{tA}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => resolverDivergencia({ movId: m.id, pickOption: 'B' })}
                        >
                          <span className="num">{X.C.length}</span>
                          <b>Foram {X.C.length}</b>
                          <span className="muted">{tB}</span>
                        </button>
                      </div>
                    </div>

                    <div className="mf">
                      <button type="button" className="btn btn-ghost" onClick={closeModal}>
                        Decidir mais tarde
                      </button>
                    </div>
                  </>
                );
              })()}
            </>
          )}

          {/* ================= MODAL DETALHES DE MOVIMENTO ================= */}
          {modal.type === 'mov' && (
            <>
              {(() => {
                const m = movs.find(x => x.id === modal.id);
                if (!m) return null;
                const o = obras.find(x => x.id === m.obraId);
                const isE = m.tipo === 'entrega';
                return (
                  <>
                    <div className="mh">
                      <div>
                        <p className="eyebrow">{isE ? 'Entrega' : 'Recolha'}</p>
                        <h2>{m.qtd} cavaletes</h2>
                      </div>
                      <button type="button" className="iconbtn" aria-label="Fechar" onClick={closeModal}>
                        <Icon name="x" />
                      </button>
                    </div>
                    <div className="mb">
                      <dl className="kv mkv">
                        <dt>Guia</dt><dd>{m.guia}</dd>
                        <dt>Data</dt><dd>{fdl(m.data)}</dd>
                        <dt>Obra</dt><dd>{o?.nome} · {o?.cidade}</dd>
                        <dt>Cliente</dt><dd>{o?.empresa}</dd>
                        <dt>Motorista</dt><dd>Sr. {m.motorista || '—'}</dd>
                        {isE ? (
                          <>
                            <dt>Enviados pela Vidraria</dt><dd>{m.qtd}</dd>
                            <dt>Confirmados pelo motorista</dt><dd>{m.qtdMot ?? '—'}</dd>
                            <dt>Confirmados pelo cliente</dt><dd>{m.qtdCli ?? '—'}</dd>
                            {m.assinatura && <><dt>Assinado por</dt><dd>{m.assinatura}</dd></>}
                            <dt>Devolver até</dt><dd>{fd(addMonths(m.data, 6))}</dd>
                          </>
                        ) : (
                          <>
                            <dt>Cavaletes recolhidos</dt><dd>{m.qtd}</dd>
                          </>
                        )}
                      </dl>
                    </div>
                    <div className="mf">
                      {m.estado === 'divergencia' && (
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => openModal({ type: 'resolver', id: m.id })}
                        >
                          Resolver diferença
                        </button>
                      )}
                      <button type="button" className="btn btn-ghost" onClick={closeModal}>
                        Fechar
                      </button>
                    </div>
                  </>
                );
              })()}
            </>
          )}

          {/* ================= MODAL NÚMEROS DE CAVALETES ================= */}
          {modal.type === 'cavnums' && (
            <>
              {(() => {
                const inv = inventario(obras, movs);
                let list = [];
                let title = '';
                let sub = '';

                if (modal.cli && modal.movId) {
                  const m = movs.find(x => x.id === modal.movId);
                  const o = obras.find(x => x.id === m?.obraId);
                  const X = cliList(m, obras, movs);
                  list = X.MO.map(n => ({ n, tipo: tipoDe(n) }));
                  title = `${X.MO.length} cavaletes enviados`;
                  sub = `${o?.nome} · ${m?.guia}`;
                } else if (modal.movId) {
                  const m = movs.find(x => x.id === modal.movId);
                  const o = obras.find(x => x.id === m?.obraId);
                  list = inv.filter(c => c.movId === m?.id);
                  title = `${list.length} cavaletes`;
                  sub = `${o?.nome} · ${m?.guia}`;
                } else if (modal.obraId) {
                  const o = obras.find(x => x.id === modal.obraId);
                  list = inv.filter(c => c.obraId === o?.id && c.estado === 'obra');
                  title = `${list.length} cavaletes na obra`;
                  sub = o?.nome || '';
                }

                const by = {};
                list.forEach(c => {
                  (by[c.tipo] = by[c.tipo] || []).push(c.n);
                });
                const ks = Object.keys(TIPOS_CAV).filter(k => by[k]);

                return (
                  <>
                    <div className="mh">
                      <div>
                        <p className="eyebrow">Números dos cavaletes</p>
                        <h2>{title}</h2>
                        <p className="muted" style={{ fontSize: '0.9rem' }}>{sub}</p>
                      </div>
                      <button type="button" className="iconbtn" aria-label="Fechar" onClick={closeModal}>
                        <Icon name="x" />
                      </button>
                    </div>
                    <div className="mb" style={{ paddingBottom: '22px' }}>
                      <div className="cnv">
                        {ks.length > 1 && (
                          <div className="cnv-bar">
                            {ks.map(k => (
                              <i key={k} className={`t-${k}`} style={{ flex: by[k].length }} />
                            ))}
                          </div>
                        )}
                        {ks.map(k => (
                          <div key={k} className="cng">
                            <div className="cng-h">
                              <span className={`tdot t-${k}`} />
                              <b>{TIPOS_CAV[k].nome}</b>
                            </div>
                            <div className="cgrid">
                              {[...by[k]].sort((a, b) => a - b).map(n => (
                                <span key={n} className="cchip">{n}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()}
            </>
          )}

          {/* ================= MODAL REGISTAR RECOLHA RÁPIDA ================= */}
          {modal.type === 'recolha' && (
            <>
              {(() => {
                const o = obras.find(x => x.id === modal.obraId);
                const r = o ? resumo(o, movs) : { total: 0 };
                return (
                  <>
                    <div className="mh">
                      <h2>Registar recolha</h2>
                      <button type="button" className="iconbtn" aria-label="Fechar" onClick={closeModal}>
                        <Icon name="x" />
                      </button>
                    </div>
                    <div className="mb">
                      <p><b>{o?.nome}</b> tem {r.total} cavaletes.</p>
                      <div className="stepper">
                        <button
                          type="button"
                          aria-label="Menos um"
                          onClick={() => setModal(m => ({ ...m, qty: Math.max(1, (m.qty || 1) - 1) }))}
                        >
                          <Icon name="minus" />
                        </button>
                        <div className="val">
                          <input
                            className="num stepin"
                            value={modal.qty || 1}
                            inputMode="numeric"
                            maxLength={4}
                            onChange={e => {
                              const v = Math.min(r.total, Math.max(1, parseInt(e.target.value.replace(/\D/g, ''), 10) || 1));
                              setModal(m => ({ ...m, qty: v }));
                            }}
                          />
                          <small>cavaletes recolhidos</small>
                        </div>
                        <button
                          type="button"
                          aria-label="Mais um"
                          onClick={() => setModal(m => ({ ...m, qty: Math.min(r.total, (m.qty || 1) + 1) }))}
                        >
                          <Icon name="plus" />
                        </button>
                      </div>
                    </div>
                    <div className="mf">
                      <button type="button" className="btn btn-ghost" onClick={closeModal}>
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => registarRecolha({ obraId: modal.obraId, qty: modal.qty || 1 })}
                      >
                        <Icon name="check" />
                        <span>Registar {modal.qty || 1} cavaletes</span>
                      </button>
                    </div>
                  </>
                );
              })()}
            </>
          )}

          {/* ================= MODAL ADICIONAR PESSOA (ADMIN) ================= */}
          {modal.type === 'addp' && (
            <>
              <div className="mh">
                <h2>Adicionar pessoa</h2>
                <button type="button" className="iconbtn" aria-label="Fechar" onClick={closeModal}>
                  <Icon name="x" />
                </button>
              </div>
              <div className="mb">
                <div className="field">
                  <label>Função</label>
                  <div className="chips">
                    {['Motorista', 'Escritório', 'Logística', 'Administração'].map(k => (
                      <button
                        key={k}
                        type="button"
                        className="chip"
                        aria-pressed={addPState.papel === k}
                        onClick={() => setAddPState(s => ({ ...s, papel: k }))}
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="g2">
                  <div className="field">
                    <label htmlFor="ap-nome">Nome</label>
                    <input
                      id="ap-nome"
                      value={addPState.nome}
                      placeholder="Nome e apelido"
                      onChange={e => setAddPState(s => ({ ...s, nome: e.target.value }))}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="ap-tel">Telemóvel</label>
                    <input
                      id="ap-tel"
                      inputMode="numeric"
                      maxLength={15}
                      value={addPState.tel}
                      placeholder="Recebe o acesso por SMS"
                      onChange={e => setAddPState(s => ({ ...s, tel: e.target.value }))}
                    />
                  </div>
                </div>
                {addPState.err && <p className="err">{addPState.err}</p>}
              </div>
              <div className="mf">
                <button type="button" className="btn btn-ghost" onClick={closeModal}>
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    const n = addPState.nome.trim();
                    const t = addPState.tel.trim();
                    if (!n || t.length < 9) {
                      setAddPState(s => ({ ...s, err: 'Preencha o nome e um telemóvel com 9 dígitos.' }));
                      return;
                    }
                    adicionarPessoa({ papel: addPState.papel, nome: n, tel: t });
                  }}
                >
                  <Icon name="plus" />
                  Adicionar
                </button>
              </div>
            </>
          )}

          {/* ================= MODAL MARCAR RECOLHA (FOLHA A4 LOGÍSTICA) ================= */}
          {modal.type === 'mrec' && (
            <>
              {(() => {
                const p = pedidos.find(x => x.id === modal.pid);
                if (!p) return null;
                const o = obras.find(x => x.id === p.obraId);
                return (
                  <>
                    <div className="mh">
                      <div>
                        <p className="eyebrow">Pedido de recolha</p>
                        <h2>Marcar recolha</h2>
                      </div>
                      <button type="button" className="iconbtn" aria-label="Fechar" onClick={closeModal}>
                        <Icon name="x" />
                      </button>
                    </div>
                    <div className="mb">
                      <div className="selobra">
                        <span className="mic"><Icon name="hand" /></span>
                        <div>
                          <b>{p.qtd} cavaletes · {o?.nome}</b>
                          <span>{o?.empresa} · {o?.cidade}</span>
                        </div>
                      </div>

                      <div className="field">
                        <label>Folha de recolha</label>
                        <div className="fprev" ref={prevRef}>
                          <div className="fprev-in">
                            <FolhaRecolhaVia p={p} rec={{}} via="Via do cliente" obras={obras} movs={movs} />
                          </div>
                        </div>
                        <ol className="fsteps">
                          <li><span><b>Imprimir</b> a folha (A4, duas vias com tracejado para rasgar)</span></li>
                          <li><span>A folha segue para a <b>logística</b>, que a põe numa carga</span></li>
                          <li><span>Depois, em <b>Movimentos</b>, atribui-se o motorista e a data</span></li>
                        </ol>
                      </div>
                    </div>
                    <div className="mf">
                      <button type="button" className="btn btn-ghost" onClick={closeModal}>
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => {
                          printFolha(p, {});
                          marcarRecolhaLogistica(p.id);
                        }}
                      >
                        <Icon name="print" />
                        Imprimir e enviar para logística
                      </button>
                    </div>
                  </>
                );
              })()}
            </>
          )}

          {/* ================= MODAL ATRIBUIR MOTORISTA E DATA (LOGÍSTICA) ================= */}
          {modal.type === 'atrib' && atribState && (
            <>
              {(() => {
                const m = movs.find(x => x.id === atribState.movId);
                const o = obras.find(x => x.id === m?.obraId);
                return (
                  <>
                    <div className="mh">
                      <div>
                        <p className="eyebrow">Recolha {m?.guia}</p>
                        <h2>Motorista e data</h2>
                      </div>
                      <button type="button" className="iconbtn" aria-label="Fechar" onClick={closeModal}>
                        <Icon name="x" />
                      </button>
                    </div>
                    <div className="mb">
                      <div className="selobra">
                        <span className="mic"><Icon name="recolha" /></span>
                        <div>
                          <b>{m?.qtd} cavaletes · {o?.nome}</b>
                          <span>{o?.empresa} · {o?.cidade}</span>
                        </div>
                      </div>

                      <div className="nrow">
                        <div className="field">
                          <label>Data da recolha</label>
                          <button
                            type="button"
                            className={`calbtn ${atribState.calOpen ? 'open' : ''}`}
                            onClick={() => setAtribState(s => ({ ...s, calOpen: !s.calOpen, calM: null }))}
                          >
                            <span className="calic"><Icon name="cal" /></span>
                            <span className="calv">
                              {(() => {
                                const d = parseIso(atribState.date);
                                const k = Math.round((d - TODAY) / 864e5);
                                const relText = k === 0 ? 'Hoje' : k === 1 ? 'Amanhã' : k === -1 ? 'Ontem' : ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'][d.getDay()];
                                return (
                                  <>
                                    <b>{relText}</b>
                                    <span>{d.getDate()} {['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'][d.getMonth()]} {d.getFullYear()}</span>
                                  </>
                                );
                              })()}
                            </span>
                            <svg className="calch" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <path d="m6 9 6 6 6-6" />
                            </svg>
                          </button>

                          {atribState.calOpen && (
                            <div className="calpop">
                              {(() => {
                                const base = atribState.calM ? parseIso(atribState.calM) : parseIso(atribState.date);
                                const y = base.getFullYear();
                                const mo = base.getMonth();
                                const first = new Date(y, mo, 1);
                                const off = (first.getDay() + 6) % 7;
                                const nDays = new Date(y, mo + 1, 0).getDate();
                                const tIso = isoD(TODAY);

                                return (
                                  <>
                                    <div className="calhd">
                                      <button
                                        type="button"
                                        className="calnav"
                                        onClick={() =>
                                          setAtribState(s => {
                                            const b = s.calM ? parseIso(s.calM) : parseIso(s.date);
                                            return { ...s, calM: isoD(new Date(b.getFullYear(), b.getMonth() - 1, 1)) };
                                          })
                                        }
                                      >
                                        <Icon name="left" />
                                      </button>
                                      <b>{['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'][mo]} <span>{y}</span></b>
                                      <button
                                        type="button"
                                        className="calnav"
                                        onClick={() =>
                                          setAtribState(s => {
                                            const b = s.calM ? parseIso(s.calM) : parseIso(s.date);
                                            return { ...s, calM: isoD(new Date(b.getFullYear(), b.getMonth() + 1, 1)) };
                                          })
                                        }
                                      >
                                        <Icon name="right" />
                                      </button>
                                    </div>
                                    <div className="calwd">
                                      {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((x, idx) => (
                                        <span key={idx}>{x}</span>
                                      ))}
                                    </div>
                                    <div className="calgrid">
                                      {Array.from({ length: off }).map((_, i) => (
                                        <span key={'empty-' + i} />
                                      ))}
                                      {Array.from({ length: nDays }).map((_, i) => {
                                        const dayNum = i + 1;
                                        const thisIso = isoD(new Date(y, mo, dayNum));
                                        const isSel = thisIso === atribState.date;
                                        const isToday = thisIso === tIso;
                                        const isWk = (off + i) % 7 > 4;
                                        return (
                                          <button
                                            key={dayNum}
                                            type="button"
                                            className={`cd ${isSel ? 'sel' : ''} ${isToday ? 'today' : ''} ${isWk ? 'wk' : ''}`}
                                            onClick={() =>
                                              setAtribState(s => ({
                                                ...s,
                                                date: thisIso,
                                                calOpen: false,
                                                calM: null,
                                                err: '',
                                              }))
                                            }
                                          >
                                            {dayNum}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          )}
                        </div>

                        <div className="field">
                          <label htmlFor="n-mq">Motorista</label>
                          {atribState.mot ? (
                            <button
                              type="button"
                              className="calbtn"
                              onClick={() => setAtribState(s => ({ ...s, mot: null, mq: '' }))}
                            >
                              <span className="calic"><Icon name="truck" /></span>
                              <span className="calv">
                                <b>Sr. {atribState.mot}</b>
                                <span>{MOT_TEL[atribState.mot] || 'Motorista'}</span>
                              </span>
                              <svg className="calch" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="m6 9 6 6 6-6" />
                              </svg>
                            </button>
                          ) : (
                            <>
                              <div className="cbox">
                                <Icon name="search" />
                                <input
                                  id="n-mq"
                                  autoComplete="off"
                                  placeholder="Escreva o nome do motorista"
                                  value={atribState.mq}
                                  onChange={e => setAtribState(s => ({ ...s, mq: e.target.value }))}
                                />
                              </div>
                              <div className="cbox-list">
                                {(() => {
                                  const nq = norm(atribState.mq.trim());
                                  const list = (nq
                                    ? motoristasList.filter(m => norm(m).includes(nq))
                                    : motoristasList
                                  ).slice(0, 3);
                                  return list.map(m => (
                                    <button
                                      key={m}
                                      type="button"
                                      className="cbox-i"
                                      onClick={() => setAtribState(s => ({ ...s, mot: m, mq: '', err: '' }))}
                                    >
                                      <b>Sr. {m}</b>
                                    </button>
                                  ));
                                })()}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {atribState.err && <p className="err">{atribState.err}</p>}
                    </div>

                    <div className="mf">
                      <button type="button" className="btn btn-ghost" onClick={closeModal}>
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => {
                          if (!atribState.mot) {
                            setAtribState(s => ({ ...s, err: 'Escolha o motorista.' }));
                            return;
                          }
                          atribuirMotoristaRecolha({
                            movId: atribState.movId,
                            motorista: atribState.mot,
                            date: atribState.date,
                          });
                        }}
                      >
                        <Icon name="send" />
                        Enviar ao motorista
                      </button>
                    </div>
                  </>
                );
              })()}
            </>
          )}
        </div>
      </div>

      {/* Sub-modal do Resolver Diferença para inspecionar os números */}
      {resolverSub && modal.type === 'resolver' && (
        <div
          className="overlay ov2"
          onClick={e => {
            if (e.target === e.currentTarget) setResolverSub(null);
          }}
        >
          <div className="modal msub" role="dialog" aria-modal="true">
            {(() => {
              const m = movs.find(x => x.id === modal.id);
              if (!m) return null;
              const X = resLists(m, obras, movs);
              const L = { v: X.V, mo: X.MO, c: X.C }[resolverSub] || [];
              const lab = {
                v: 'Registados pela Vidraria',
                mo: 'Carregados pelo motorista',
                c: 'Assinados pelo cliente',
              }[resolverSub];

              const by = {};
              L.forEach(n => {
                const tp = tipoDe(n);
                (by[tp] = by[tp] || []).push(n);
              });
              const ks = Object.keys(TIPOS_CAV).filter(k => by[k]);
              const miss = new Set(X.falta);
              const extra = new Set(X.mais);

              return (
                <>
                  <div className="mh">
                    <div>
                      <p className="eyebrow">{lab}</p>
                      <h2>{L.length} cavaletes</h2>
                    </div>
                    <button type="button" className="iconbtn" aria-label="Fechar" onClick={() => setResolverSub(null)}>
                      <Icon name="x" />
                    </button>
                  </div>
                  <div className="mb" style={{ paddingBottom: '20px' }}>
                    <div className="cnv">
                      {ks.length > 1 && (
                        <div className="cnv-bar">
                          {ks.map(k => (
                            <i key={k} className={`t-${k}`} style={{ flex: by[k].length }} />
                          ))}
                        </div>
                      )}
                      {ks.map(k => (
                        <div key={k} className="cng">
                          <div className="cng-h">
                            <span className={`tdot t-${k}`} />
                            <b>{TIPOS_CAV[k].nome}</b>
                          </div>
                          <div className="cgrid">
                            {[...by[k]].sort((a, b) => a - b).map(n => {
                              const isMiss = miss.has(n);
                              const isExtra = extra.has(n);
                              return (
                                <span
                                  key={n}
                                  className={`cchip ${isMiss ? 'miss' : isExtra ? 'extra' : ''}`}
                                >
                                  {n}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                      {(X.falta.length > 0 || X.mais.length > 0) && (
                        <div className="cnv-lg">
                          {X.falta.length > 0 && <span><i className="cchip miss" />Em falta no cliente</span>}
                          {X.mais.length > 0 && <span><i className="cchip extra" />Não registado pela Vidraria</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </>
  );
}

// Componente para a via de impressão da Folha de Recolha
function FolhaRecolhaVia({ p, rec, via, obras, movs }) {
  const o = obras.find(x => x.id === p.obraId);
  const r = o ? resumo(o, movs) : { total: 0 };
  const d = rec.data ? fd(parseIso(rec.data)) : '____ / ____ / ________';

  return (
    <div className="fs-via">
      <div className="fs-hd">
        <img src={IMG.logo} alt="Vidraria Mortágua" />
        <div className="fs-ttl">
          <span className="fs-tag">{via}</span>
          <h1>Guia de recolha de cavaletes</h1>
          <p>N.º <b>{(p.movId && (movs.find(x => x.id === p.movId) || {}).guia) || p.guia || '—'}</b></p>
        </div>
      </div>
      <div className="fs-cols">
        <div className="fs-box">
          <h2>Cliente e obra</h2>
          <div className="fs-kv"><span>Cliente</span><b>{o?.empresa}</b></div>
          <div className="fs-kv"><span>Obra</span><b>{o?.nome}</b></div>
          <div className="fs-kv"><span>Morada</span><b>{o?.morada}, {o?.cidade}</b></div>
          <div className="fs-kv"><span>Responsável</span><b>{o?.contacto} · {o?.tel}</b></div>
        </div>
        <div className="fs-box">
          <h2>Recolha</h2>
          <div className="fs-kv"><span>Data marcada</span><b>{d}</b></div>
          <div className="fs-kv"><span>Motorista</span><b>{rec.mot ? 'Sr. ' + rec.mot : ''}</b></div>
          <div className="fs-kv"><span>Pedido do cliente</span><b>{p.qtd} cavaletes · {fd(p.data)}</b></div>
          <div className="fs-kv"><span>Registados na obra</span><b>{r.total} cavaletes</b></div>
        </div>
      </div>
      <div className="fs-cols fs-fill">
        <div className="fs-qty">
          <span>Cavaletes recolhidos</span>
          <div className="fs-qbox" />
        </div>
        <div className="fs-nums">
          <span>N.º dos cavaletes recolhidos</span>
          <i /><i /><i />
        </div>
      </div>
      <div className="fs-obs">
        <span>Observações</span>
        <i /><i />
      </div>
      <div className="fs-sig">
        <div><i /><span>Assinatura do cliente / responsável</span></div>
        <div><i /><span>Assinatura do motorista</span></div>
        <div className="fs-sd"><i /><span>Data e hora</span></div>
      </div>
      <p className="fs-ft">
        Vidraria Mortágua — vidros & espelhos, S.A. · Os cavaletes são propriedade da Vidraria Mortágua e devem ser devolvidos no prazo de 6 meses.
      </p>
    </div>
  );
}

function renderFolhaViaHtml(p, rec, via, obras, movs) {
  const o = obras.find(x => x.id === p.obraId);
  const r = o ? resumo(o, movs) : { total: 0 };
  const d = rec.data ? fd(parseIso(rec.data)) : '____ / ____ / ________';

  return `
    <div class="fs-via">
      <div class="fs-hd">
        <img src="${IMG.logo}" alt="Vidraria Mortágua" />
        <div class="fs-ttl">
          <span class="fs-tag">${via}</span>
          <h1>Guia de recolha de cavaletes</h1>
          <p>N.º <b>${(p.movId && (movs.find(x => x.id === p.movId) || {}).guia) || p.guia || '—'}</b></p>
        </div>
      </div>
      <div class="fs-cols">
        <div class="fs-box">
          <h2>Cliente e obra</h2>
          <div class="fs-kv"><span>Cliente</span><b>${esc(o?.empresa || '')}</b></div>
          <div class="fs-kv"><span>Obra</span><b>${esc(o?.nome || '')}</b></div>
          <div class="fs-kv"><span>Morada</span><b>${esc((o?.morada || '') + ', ' + (o?.cidade || ''))}</b></div>
          <div class="fs-kv"><span>Responsável</span><b>${esc((o?.contacto || '') + ' · ' + (o?.tel || ''))}</b></div>
        </div>
        <div class="fs-box">
          <h2>Recolha</h2>
          <div class="fs-kv"><span>Data marcada</span><b>${d}</b></div>
          <div class="fs-kv"><span>Motorista</span><b>${rec.mot ? 'Sr. ' + esc(rec.mot) : ''}</b></div>
          <div class="fs-kv"><span>Pedido do cliente</span><b>${p.qtd} cavaletes · ${fd(p.data)}</b></div>
          <div class="fs-kv"><span>Registados na obra</span><b>${r.total} cavaletes</b></div>
        </div>
      </div>
      <div class="fs-cols fs-fill">
        <div class="fs-qty">
          <span>Cavaletes recolhidos</span>
          <div class="fs-qbox"></div>
        </div>
        <div class="fs-nums">
          <span>N.º dos cavaletes recolhidos</span>
          <i></i><i></i><i></i>
        </div>
      </div>
      <div class="fs-obs">
        <span>Observações</span>
        <i></i><i></i>
      </div>
      <div class="fs-sig">
        <div><i></i><span>Assinatura do cliente / responsável</span></div>
        <div><i></i><span>Assinatura do motorista</span></div>
        <div class="fs-sd"><i></i><span>Data e hora</span></div>
      </div>
      <p class="fs-ft">
        Vidraria Mortágua — vidros & espelhos, S.A. · Os cavaletes são propriedade da Vidraria Mortágua e devem ser devolvidos no prazo de 6 meses.
      </p>
    </div>`;
}
