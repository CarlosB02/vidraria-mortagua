'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { Icon } from '../data/icons';
import {
  IMG,
  VM_TEL,
  TIPOS_CAV,
  PRAZO,
} from '../data/constants';
import {
  resumo,
  ST,
  diasTxt,
  tipoDe,
  cliList,
  cliPessoas,
  iniciais,
  fd,
  qEntregue,
  inventario,
} from '../data/logic';

export default function ClienteView() {
  const {
    cli,
    setCli,
    obras,
    movs,
    clienteConfirmarEntrega,
    clientePedirRecolha,
    psize,
    setPsize,
    psOpen,
    setPsOpen,
    openModal,
  } = useDashboard();

  const o = obras.find(x => x.id === cli.obraId) || obras[0];
  const r = o ? resumo(o, movs) : { total: 0, transito: 0, lots: [] };
  const pend = movs.filter(m => m.obraId === o?.id && m.tipo === 'entrega' && m.estado === 'em_viagem');

  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [lastPos, setLastPos] = useState(null);
  const [cxInput, setCxInput] = useState('');

  // Dropdown "Ver como o cliente" com branding
  const pickerRef = useRef(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (!pickerOpen) return;
    const handleClickOutside = e => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setPickerOpen(false);
      }
    };
    const handleKeyDown = e => {
      if (e.key === 'Escape') setPickerOpen(false);
    };
    document.addEventListener('pointerdown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [pickerOpen]);

  const handleSelectEmp = emp => {
    const target =
      obras.find(x => x.empresa === emp && movs.some(m => m.obraId === x.id && m.estado === 'em_viagem')) ||
      obras.find(x => x.empresa === emp && resumo(x, movs).total > 0) ||
      obras.find(x => x.empresa === emp);
    if (target) {
      setCli(c => ({
        ...c,
        obraId: target.id,
        qty: null,
        outro: false,
        sig: null,
        err: '',
        done: null,
        recolha: false,
        rq: 0,
        miss: [],
        extra: [],
        respOpen: false,
      }));
    }
    setPickerOpen(false);
  };

  // Configuração do Canvas de Assinatura
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const w = c.clientWidth;
    const h = c.clientHeight;
    c.width = w * dpr;
    c.height = h * dpr;
    const ctx = c.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#222';

    if (cli.sig) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, w, h);
      img.src = cli.sig;
    }
  }, [cli.sig, pend.length]);

  const handlePointerDown = e => {
    const c = canvasRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const pos = [e.clientX - rect.left, e.clientY - rect.top];
    setDrawing(true);
    setLastPos(pos);
    c.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = e => {
    if (!drawing || !lastPos) return;
    const c = canvasRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const p = [e.clientX - rect.left, e.clientY - rect.top];
    const ctx = c.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(lastPos[0], lastPos[1]);
    ctx.lineTo(p[0], p[1]);
    ctx.stroke();
    setLastPos(p);
  };

  const handlePointerUp = () => {
    if (!drawing) return;
    setDrawing(false);
    const c = canvasRef.current;
    if (c) {
      const dataUrl = c.toDataURL();
      setCli(prev => ({ ...prev, sig: dataUrl, err: '' }));
    }
  };

  let body = null;

  if (cli.done) {
    body = (
      <div className="success">
        <div className="big"><Icon name="check" /></div>
        <h2>{cli.done.t}</h2>
        <p className="muted">{cli.done.s}</p>
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={() => setCli(prev => ({ ...prev, done: null }))}
        >
          Continuar
        </button>
      </div>
    );
  } else if (cli.recolha) {
    body = (
      <>
        <button
          type="button"
          className="back"
          onClick={() => setCli(prev => ({ ...prev, recolha: false }))}
        >
          <Icon name="left" />Voltar
        </button>
        <h2 style={{ textAlign: 'center' }}>Quantos cavaletes quer devolver?</h2>

        <div className="stepper">
          <button
            type="button"
            aria-label="Menos um"
            onClick={() => setCli(prev => ({ ...prev, rq: Math.max(1, (prev.rq || 1) - 1) }))}
          >
            <Icon name="minus" />
          </button>
          <div className="val">
            <input
              className="num stepin"
              value={cli.rq || 1}
              inputMode="numeric"
              maxLength={4}
              onChange={e => {
                const v = Math.min(r.total, Math.max(1, parseInt(e.target.value.replace(/\D/g, ''), 10) || 1));
                setCli(prev => ({ ...prev, rq: v }));
              }}
            />
            <small>de {r.total} na obra</small>
          </div>
          <button
            type="button"
            aria-label="Mais um"
            onClick={() => setCli(prev => ({ ...prev, rq: Math.min(r.total, (prev.rq || 1) + 1) }))}
          >
            <Icon name="plus" />
          </button>
        </div>

        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={() => clientePedirRecolha({ obraId: cli.obraId, qty: cli.rq || 1 })}
        >
          <Icon name="send" />Pedir recolha
        </button>
        <p className="muted" style={{ textAlign: 'center', fontSize: '0.88em' }}>
          A Vidraria liga-lhe para combinar o dia.
        </p>
      </>
    );
  } else if (pend.length > 0) {
    const m = pend[0];
    const X = cliList(m, obras, movs);
    const sent = X.MO.concat(X.notMot);
    const missSet = new Set(cli.miss || []);
    const cxList = cli.extra || [];
    const qFinal = cli.outro ? sent.length - missSet.size + cxList.length : X.MO.length;

    body = (
      <>
        <div className="sms">
          <small>SMS · Vidraria Mortágua</small>
          Olá! Enviámos {X.MO.length} cavaletes para a obra {o?.nome}. Confirme aqui: <u>vidrariamortagua.pt/c/{m.guia.slice(-4)}</u>
        </div>

        <div className="pcard" style={{ textAlign: 'center' }}>
          <p className="eyebrow">Entrega {m.guia}</p>
          <p>A Vidraria Mortágua enviou-lhe</p>
          <div className="qty" style={{ justifyContent: 'center' }}>
            <span className="num" style={{ fontSize: '2.6em' }}>{X.MO.length}</span>
            <span style={{ textAlign: 'left', fontWeight: 600 }}>cavaletes</span>
            <button
              type="button"
              className="infobtn"
              aria-label="Ver os números dos cavaletes"
              onClick={() => openModal({ type: 'cavnums', movId: m.id, cli: true })}
            >
              <Icon name="info" />
            </button>
          </div>
          <p className="muted">Motorista: Sr. {m.motorista}</p>
        </div>

        {cli.outro ? (
          <>
            <h3 style={{ textAlign: 'center', marginBottom: 0 }}>O que recebeu?</h3>
            <p className="muted" style={{ textAlign: 'center', fontSize: '0.86em', marginTop: '-4px' }}>
              Toque nos que <b>não</b> chegaram{X.notMot.length ? ' e nos que chegaram a mais (com +)' : ''}.
            </p>

            <div className="rchk">
              {sent.map(n => {
                const isMiss = missSet.has(n);
                const isOpt = X.notMot.includes(n);
                return (
                  <button
                    key={n}
                    type="button"
                    className={`rck ${isMiss ? 'off' : ''} ${isOpt ? 'opt' : ''}`}
                    aria-pressed={!isMiss}
                    onClick={() => {
                      setCli(prev => {
                        const nextMiss = new Set(prev.miss || []);
                        if (nextMiss.has(n)) nextMiss.delete(n);
                        else nextMiss.add(n);
                        return { ...prev, miss: [...nextMiss] };
                      });
                    }}
                  >
                    <i className={`tdot t-${tipoDe(n)}`} />
                    <span>{n}</span>
                    {isOpt && isMiss ? <Icon name="plus" /> : <Icon name={isMiss ? 'x' : 'check'} />}
                  </button>
                );
              })}
              {cxList.map(n => (
                <button
                  key={n}
                  type="button"
                  className="rck xtra"
                  aria-label={`Retirar ${n}`}
                  onClick={() =>
                    setCli(prev => ({
                      ...prev,
                      extra: (prev.extra || []).filter(k => k !== n),
                    }))
                  }
                >
                  <i className={`tdot t-${tipoDe(n)}`} />
                  <span>{n}</span>
                  <Icon name="x" />
                </button>
              ))}
            </div>

            <div className="mx">
              <div className="cbox">
                <Icon name="plus" />
                <input
                  id="cx"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="Chegou outro? N.º"
                  value={cxInput}
                  onChange={e => setCxInput(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  const v = parseInt(cxInput, 10);
                  setCxInput('');
                  if (!v || !tipoDe(v)) {
                    setCli(prev => ({ ...prev, xerr: 'Esse número não existe.' }));
                    return;
                  }
                  const allSent = X.MO.concat(X.notMot);
                  if (allSent.includes(v)) {
                    setCli(prev => ({
                      ...prev,
                      miss: (prev.miss || []).filter(k => k !== v),
                      xerr: '',
                    }));
                    return;
                  }
                  if ((cli.extra || []).includes(v)) {
                    setCli(prev => ({ ...prev, xerr: 'Já está na lista.' }));
                    return;
                  }
                  setCli(prev => ({ ...prev, extra: [...(prev.extra || []), v], xerr: '' }));
                }}
              >
                Adicionar
              </button>
            </div>

            {cli.xerr && <p className="err">{cli.xerr}</p>}

            {(() => {
              const fl = [...missSet].filter(n => !X.notMot.includes(n)).sort((a, b) => a - b);
              const mais = X.notMot.filter(n => !missSet.has(n)).length + cxList.length;
              return (
                <p className="rck-s">
                  <b>{qFinal}</b> recebidos
                  {fl.length > 0 && <> · <em>{fl.length === 1 ? 'falta o' : 'faltam os'} {fl.join(', ')}</em></>}
                  {mais > 0 && <> · <em className="xm">+{mais} a mais</em></>}
                </p>
              );
            })()}

            <button
              type="button"
              className="back"
              style={{ alignSelf: 'center' }}
              onClick={() => setCli(prev => ({ ...prev, outro: false, miss: [], extra: [] }))}
            >
              <Icon name="left" />Afinal está tudo certo
            </button>

            <div className="field">
              <label htmlFor="cnota">
                Nota <span className="muted" style={{ fontWeight: 400 }}>(opcional)</span>
              </label>
              <textarea
                id="cnota"
                rows={2}
                placeholder="Ex.: um cavalete veio partido"
                value={cli.nota || ''}
                onChange={e => setCli(prev => ({ ...prev, nota: e.target.value }))}
              />
            </div>
          </>
        ) : (
          <div className="choice">
            <button
              type="button"
              aria-pressed={true}
              onClick={() => setCli(prev => ({ ...prev, outro: false, miss: [], extra: [] }))}
            >
              <span className="num">{X.MO.length}</span>
              <b>Sim, recebi {X.MO.length}</b>
            </button>
            <button
              type="button"
              aria-pressed={false}
              onClick={() => {
                setCli(prev => ({
                  ...prev,
                  outro: true,
                  miss: X.notMot.slice(),
                  extra: [],
                  nota: '',
                }));
              }}
            >
              <span className="num">≠</span>
              <b>Há diferenças</b>
            </button>
          </div>
        )}

        <div className="field">
          <label htmlFor="cnome">O seu nome</label>
          <input
            id="cnome"
            value={cli.nome || o?.contacto || ''}
            autoComplete="name"
            onChange={e => setCli(prev => ({ ...prev, nome: e.target.value }))}
          />
        </div>

        <div className="field">
          <label>Assine com o dedo</label>
          <div className="sig">
            <canvas
              ref={canvasRef}
              id="sig"
              aria-label="Quadro de assinatura"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            />
            <div className="line" />
            {!cli.sig && (
              <div className="ph">
                <span style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                  <Icon name="pen" />Assine aqui
                </span>
              </div>
            )}
          </div>
          {cli.sig && (
            <button
              type="button"
              className="back"
              style={{ alignSelf: 'flex-start' }}
              onClick={() => {
                const c = canvasRef.current;
                if (c) {
                  const ctx = c.getContext('2d');
                  ctx.clearRect(0, 0, c.width, c.height);
                }
                setCli(prev => ({ ...prev, sig: null }));
              }}
            >
              <Icon name="x" />Apagar assinatura
            </button>
          )}
        </div>

        {cli.err && <p className="err">{cli.err}</p>}

        <button
          type="button"
          className="btn btn-ok btn-block"
          onClick={() => {
            const nomeFinal = (cli.nome || o?.contacto || '').trim();
            if (!nomeFinal) {
              setCli(prev => ({ ...prev, err: 'Escreva o seu nome.' }));
              return;
            }
            if (!cli.sig) {
              setCli(prev => ({ ...prev, err: 'Assine no quadro com o dedo.' }));
              return;
            }

            let numsCliFinal;
            if (cli.outro) {
              const missSetFinal = new Set(cli.miss || []);
              numsCliFinal = X.MO.concat(X.notMot)
                .filter(n => !missSetFinal.has(n))
                .concat(cli.extra || []);
            } else {
              numsCliFinal = X.MO.slice();
            }

            clienteConfirmarEntrega({
              movId: m.id,
              nome: nomeFinal,
              sig: cli.sig,
              numsCli: numsCliFinal,
              nota: cli.nota,
            });
          }}
        >
          <Icon name="check" />
          <span>Confirmar <span className="qlab">{qFinal}</span> cavaletes</span>
        </button>
      </>
    );
  } else {
    // Mini Dashboard do Cliente
    const PP = cliPessoas(o?.empresa || '', obras, movs);
    const eu = PP[Math.min(cli.resp, PP.length - 1)] || PP[0];
    const meusIds = new Set(eu.ids);

    const L = obras
      .filter(x => x.empresa === o?.empresa && meusIds.has(x.id))
      .map(x => ({ x, r: resumo(x, movs) }))
      .filter(z => z.r.total > 0 || z.r.transito > 0)
      .sort((p, q) => (p.r.dias ?? 999) - (q.r.dias ?? 999));

    const totalCavaletes = L.reduce((n, z) => n + z.r.total, 0);
    const ids = new Set(L.map(z => z.x.id));

    const allLots = L.flatMap(z => z.r.lots.map(l => ({ ...l, o: z.x })));
    const late = allLots.filter(l => l.dias < 0).reduce((n, l) => n + l.qtd, 0);
    const soon = allLots.filter(l => l.dias >= 0 && l.dias <= 10).reduce((n, l) => n + l.qtd, 0);
    const cam = L.reduce((n, z) => n + z.r.transito, 0);
    const prox = allLots.filter(l => l.dias >= 0).sort((a, b) => a.dias - b.dias)[0];

    const recent = movs
      .filter(m => ids.has(m.obraId) && (m.tipo === 'entrega' ? m.estado === 'entregue' || m.estado === 'divergencia' : m.estado === 'concluida'))
      .sort((a, b) => b.data - a.data)
      .slice(0, 3);

    const inv = inventario(obras, movs);
    const emObraList = inv.filter(c => ids.has(c.obraId) && c.estado === 'obra');
    const byTipo = { S: 0, D: 0, P: 0 };
    emObraList.forEach(c => {
      if (c.tipo && byTipo[c.tipo] !== undefined) {
        byTipo[c.tipo]++;
      }
    });
    const sumByTipo = byTipo.S + byTipo.D + byTipo.P;
    if (sumByTipo === 0 && totalCavaletes > 0) {
      byTipo.S = Math.round(totalCavaletes * 0.54);
      byTipo.D = Math.round(totalCavaletes * 0.28);
      byTipo.P = Math.max(0, totalCavaletes - byTipo.S - byTipo.D);
    }
    const tiposKeys = Object.keys(TIPOS_CAV).filter(k => (byTipo[k] || 0) > 0);

    body = (
      <>
        <div className="cdash">
          <div className="cd-hero">
            <div>
              <p className="eyebrow">Cavaletes em obra</p>
              <div className="cd-big">
                <span className="num">{totalCavaletes}</span>
                <span>em {L.filter(z => z.r.total > 0).length} obra{L.filter(z => z.r.total > 0).length === 1 ? '' : 's'}</span>
              </div>
            </div>

            {totalCavaletes > 0 && tiposKeys.length > 0 && (
              <>
                <div
                  className="cd-bar"
                  key={`cd-bar-${totalCavaletes}-${tiposKeys.join('-')}-${cli.resp}`}
                  role="img"
                  aria-label="Distribuição por tipo de cavalete"
                >
                  {tiposKeys.map(k => (
                    <i
                      key={k}
                      className={`t-${k}`}
                      style={{
                        flex: `${byTipo[k]} 1 0%`,
                        height: '100%',
                        minWidth: '6px',
                      }}
                    />
                  ))}
                </div>
                <div
                  className="cd-lg"
                  key={`cd-lg-${totalCavaletes}-${tiposKeys.join('-')}-${cli.resp}`}
                >
                  {tiposKeys.map(k => (
                    <span key={k}>
                      <i className={`tdot t-${k}`} />
                      {byTipo[k]} {TIPOS_CAV[k].nome.toLowerCase()}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="cd-stats">
            <div className={`cd-st ${late > 0 ? 'late' : ''}`}>
              <span className="num">{late}</span>
              <small>fora do prazo</small>
            </div>
            <div className={`cd-st ${soon > 0 ? 'soon' : ''}`}>
              <span className="num">{soon}</span>
              <small>a terminar em 10 dias</small>
            </div>
            <div className="cd-st">
              <span className="num">{cam}</span>
              <small>a caminho</small>
            </div>
          </div>

          {prox && (
            <div className="cd-next">
              <Icon name="cal" />
              <div>
                <small>Próximo prazo</small>
                <b>{prox.qtd} cavaletes · {prox.o.nome}</b>
                <span>Devolver até {fd(prox.prazo)} · {diasTxt(prox.dias)}</span>
              </div>
            </div>
          )}
        </div>

        <p className="eyebrow" style={{ marginTop: '6px' }}>As suas obras</p>

        {L.map(({ x, r: ro }) => {
          const prepx = movs.find(m => m.obraId === x.id && m.tipo === 'entrega' && m.estado === 'preparada');
          return (
            <div key={x.id} className="pcard cobra">
              <div className="row">
                <div>
                  <b>{x.nome}</b>
                  <p className="muted"><Icon name="pin" /> {x.cidade}</p>
                </div>
                <div className="qty">
                  <span className="num">{ro.total}</span>
                  <Icon name="cav" />
                </div>
              </div>

              {ro.first && (
                <div className="prazo">
                  <div className="bar" role="img" aria-label="Progresso do prazo">
                    <i
                      style={{
                        width: `${Math.max(4, Math.min(100, (1 - ro.dias / PRAZO) * 100))}%`,
                        background: ST[ro.st].soft,
                      }}
                    />
                    <div className="ticks">
                      <span /><span /><span /><span /><span /><span />
                    </div>
                  </div>
                  <small>
                    <span style={{ color: ST[ro.st].color, fontWeight: 500 }}>{diasTxt(ro.dias)}</span> · prazo {fd(ro.first.prazo)}
                  </small>
                </div>
              )}

              {prepx && (
                <p className="muted lotsline">
                  <Icon name="truck" /> {prepx.qtd} cavaletes a caminho
                </p>
              )}

              {ro.total > 0 && (
                <div className="cobra-actions">
                  <button
                    type="button"
                    className="numslink"
                    onClick={() => openModal({ type: 'cavnums', obraId: x.id })}
                    title="Ver números de série dos cavaletes"
                  >
                    <Icon name="info" />Ver números dos cavaletes
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm cobra-rec-btn"
                    onClick={() => setCli(prev => ({ ...prev, obraId: x.id, recolha: true, rq: ro.total }))}
                  >
                    <Icon name="hand" />Pedir recolha
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {recent.length > 0 && (
          <>
            <p className="eyebrow" style={{ marginTop: '6px' }}>Últimos movimentos</p>
            <div className="flist">
              {recent.map(m => {
                const ob = obras.find(x => x.id === m.obraId);
                const isE = m.tipo === 'entrega';
                return (
                  <div key={m.id} className="fitem">
                    <span className={`cd-mi ${isE ? 'e' : 'r'}`}>
                      <Icon name={isE ? 'truck' : 'recolha'} />
                    </span>
                    <div className="ft">
                      <b>{isE ? 'Entrega' : 'Recolha'} de {isE ? qEntregue(m) : m.qtd} · {ob?.nome}</b>
                      <span>{fd(m.data)}{isE && m.assinatura ? ' · assinado por ' + m.assinatura : ''}</span>
                    </div>
                    {isE && (
                      <button
                        type="button"
                        className="infobtn"
                        aria-label="Ver números dos cavaletes"
                        title="Ver números dos cavaletes"
                        onClick={() => openModal({ type: 'cavnums', movId: m.id, cli: true })}
                      >
                        <Icon name="info" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="cd-contact">
          <div>
            <b>Falar com a Vidraria</b>
            <span>Dúvidas sobre cavaletes, entregas ou recolhas</span>
          </div>
          <div className="cd-cbtns">
            <a className="btn btn-ghost" target="_blank" rel="noopener noreferrer" href={`tel:+351${VM_TEL.replace(/\D/g, '')}`}>
              <Icon name="phone" />Ligar
            </a>
            <a className="btn cd-wa" target="_blank" rel="noopener noreferrer" href={`https://wa.me/351${VM_TEL.replace(/\D/g, '')}`}>
              <Icon name="wa" />WhatsApp
            </a>
          </div>
        </div>
      </>
    );
  }

  // Empresas distintas para o simulador
  const emps = [...new Set(obras.filter(x => resumo(x, movs).total > 0 || movs.some(m => m.obraId === x.id && m.estado !== 'entregue')).map(x => x.empresa))].sort();

  const PP = cliPessoas(o?.empresa || '', obras, movs);
  const eu = PP[Math.min(cli.resp, PP.length - 1)] || PP[0];

  const phoneScreen = (
    <>
      <div className="phead">
        <p className="pbrand">
          <img src={IMG.markW} alt="" />
          VIDRARIA MORTÁGUA
          <button
            type="button"
            className="pset"
            aria-label="Opções"
            onClick={() => setPsOpen(p => !p)}
          >
            <Icon name="gear" />
          </button>
        </p>

        {psOpen && (
          <div className="pspanel">
            <div className="row">
              <b>Tamanho do texto</b>
              <button
                type="button"
                className="pset dark"
                aria-label="Fechar"
                onClick={() => setPsOpen(false)}
              >
                <Icon name="x" />
              </button>
            </div>
            <div className="szs">
              {[
                ['n', 'Normal', '15px'],
                ['l', 'Grande', '17px'],
                ['xl', 'Muito grande', '19.5px'],
              ].map(([k, l, f]) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={psize === k}
                  onClick={() => setPsize(k)}
                >
                  <span style={{ fontSize: f }}>Aa</span>
                  {l}
                </button>
              ))}
            </div>
          </div>
        )}

        {cli.done || cli.recolha || pend.length > 0 ? (
          <>
            <h2>{o?.nome}</h2>
            <p>{o?.empresa}</p>
          </>
        ) : (
          <>
            <h2>{o?.empresa}</h2>
            <div className="cresp-w">
              <button
                type="button"
                className="cresp"
                aria-expanded={cli.respOpen}
                onClick={() => setCli(c => ({ ...c, respOpen: !c.respOpen }))}
              >
                <span className="cav">{iniciais(eu.nome)}</span>
                <span className="ct">
                  <b>{eu.nome}</b>
                  <small>{eu.papel} · {eu.ids.length} obra{eu.ids.length === 1 ? '' : 's'}</small>
                </span>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {cli.respOpen && (
                <div className="cresp-m">
                  <p>Entrar como</p>
                  {PP.map((pp, idx) => (
                    <button
                      key={pp.nome}
                      type="button"
                      aria-pressed={pp === eu}
                      onClick={() => setCli(c => ({ ...c, resp: idx, respOpen: false }))}
                    >
                      <span className="cav">{iniciais(pp.nome)}</span>
                      <span className="ct">
                        <b>{pp.nome}</b>
                        <small>{pp.papel === 'Gestor' ? 'Gestor · vê todas as obras' : `Encarregado · ${pp.ids.map(id => obras.find(x => x.id === id)?.nome).join(', ')}`}</small>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="pbody">{body}</div>
    </>
  );

  return (
    <div className="phonestage has-picker">
      <div className="explain">
        <p className="eyebrow">Como funciona</p>
        <h2>O cliente confirma e assina no telemóvel</h2>
        <ol>
          <li><span className="n">1</span><span>Recebe um SMS com um link. Abre no telemóvel, sem instalar nada.</span></li>
          <li><span className="n">2</span><span>Confirma o número com um toque, ou indica outro se não bater certo.</span></li>
          <li><span className="n">3</span><span>Assina com o dedo. Fica guardado com a data e a hora.</span></li>
          <li><span className="n">4</span><span>Vê sempre quantos cavaletes tem e até quando os deve devolver.</span></li>
        </ol>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center', minWidth: 0 }}>
        {/* Seletor de simulação de cliente com branding Vidraria Mortágua */}
        <div className="cli-picker" ref={pickerRef}>
          <div className="cli-picker-label">
            <Icon name="user" />
            <span>Ver como o cliente</span>
          </div>

          <button
            type="button"
            className={`cli-picker-btn ${pickerOpen ? 'is-open' : ''}`}
            onClick={() => setPickerOpen(v => !v)}
            aria-expanded={pickerOpen}
            aria-haspopup="listbox"
          >
            <span className="cli-picker-av">{iniciais(o?.empresa || 'Cliente')}</span>
            <div className="cli-picker-info">
              <b>{o?.empresa}</b>
              <small>{r.total} cavaletes em obra · {eu?.nome}</small>
            </div>
            <svg
              className="cli-picker-chev"
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {pickerOpen && (
            <div className="cli-picker-menu" role="listbox">
              <div className="cli-picker-menu-head">
                <span>Escolher cliente para simular</span>
              </div>
              <div className="cli-picker-menu-list">
                {emps.map(e => {
                  const isSelected = e === o?.empresa;
                  const eObras = obras.filter(x => x.empresa === e);
                  const eCav = eObras.reduce((n, x) => n + resumo(x, movs).total, 0);
                  const eTransit = movs.some(m => eObras.some(x => x.id === m.obraId) && m.estado === 'em_viagem');
                  const eLate = eObras.reduce((n, x) => n + resumo(x, movs).lateQ, 0);

                  return (
                    <button
                      key={e}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      className={`cli-picker-opt ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => handleSelectEmp(e)}
                    >
                      <span className="cli-picker-av">{iniciais(e)}</span>
                      <div className="cli-picker-opt-txt">
                        <b>{e}</b>
                        <small>
                          {eCav} cavaletes · {eObras.length} obra{eObras.length > 1 ? 's' : ''}
                          {eTransit && ' · 🚚 a caminho'}
                        </small>
                      </div>
                      {eLate > 0 && (
                        <span className="fbadge" style={{ fontSize: '0.7rem', padding: '1px 6px', flexShrink: 0 }}>
                          {eLate} fora do prazo
                        </span>
                      )}
                      {isSelected && (
                        <span className="cli-picker-check">
                          <Icon name="check" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="phone">
          <div className={`screen sz-${psize}`}>{phoneScreen}</div>
        </div>
      </div>

      <div className="explain right">
        <p className="eyebrow">E mais</p>
        <ol>
          <li><span className="n"><Icon name="check" /></span><span>Vê todas as suas obras e pede a recolha de cada uma com um botão.</span></li>
          <li><span className="n"><Icon name="check" /></span><span>Cada encarregado vê só as suas obras; o gestor vê todas.</span></li>
          <li><span className="n"><Icon name="check" /></span><span>Fala com a Vidraria por chamada ou WhatsApp com um toque.</span></li>
          <li><span className="n"><Icon name="check" /></span><span>Se o número não bater certo, o escritório é avisado logo.</span></li>
        </ol>
      </div>
    </div>
  );
}
