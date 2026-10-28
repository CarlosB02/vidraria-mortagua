'use client';

import React, { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { Icon } from '../data/icons';
import {
  TODAY,
  DIAS,
  MESES,
  MESES_L,
  IMG,
  isoD,
  addDays,
} from '../data/constants';
import {
  resumo,
  diasTxt,
  tipoDe,
  sentNums,
  freeNums,
  parseIso,
} from '../data/logic';

export default function MotoristaView() {
  const {
    mot,
    setMot,
    obras,
    movs,
    pedidos,
    motoristaConfirmarCarga,
    motoristaConfirmarRecolha,
    setViewState,
    psize,
    setPsize,
    psOpen,
    setPsOpen,
  } = useDashboard();

  const [xqInput, setXqInput] = useState('');

  const todas = movs
    .filter(m => m.tipo === 'entrega' && m.estado === 'preparada' && m.motorista === mot.nome)
    .sort((a, b) => a.data - b.data);

  const minhas = todas.filter(m => m.data <= TODAY);
  const futE = todas.filter(m => m.data > TODAY);
  const viagem = movs.filter(m => m.tipo === 'entrega' && m.estado === 'em_viagem' && m.motorista === mot.nome);

  const DS = ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'];

  // Sub-ecrãs
  let screenContent = null;

  if (mot.done) {
    screenContent = (
      <div className="success">
        <div className="big"><Icon name="check" /></div>
        <h2>{mot.done.t}</h2>
        <p className="muted">{mot.done.s}</p>
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={() => setMot(m => ({ ...m, done: null }))}
        >
          Voltar ao início
        </button>
        {mot.done.cli && (
          <button
            type="button"
            className="btn btn-ghost btn-block"
            onClick={() => setViewState('cliente')}
          >
            <Icon name="phone" />Ver o que o cliente recebe
          </button>
        )}
      </div>
    );
  } else if (mot.conf) {
    const m = movs.find(x => x.id === mot.conf);
    const o = obras.find(x => x.id === m?.obraId);
    const numsList = m?.nums || [];
    const chkSet = new Set(mot.chk || []);
    const extraList = mot.extra || [];
    const totalCount = chkSet.size + extraList.length;
    const faltam = numsList.filter(k => !chkSet.has(k));

    screenContent = (
      <>
        <button
          type="button"
          className="back"
          onClick={() => setMot(prev => ({ ...prev, conf: null }))}
        >
          <Icon name="left" />Voltar
        </button>

        <div className="pcard">
          <p className="eyebrow">{m?.guia}</p>
          <h2>{o?.nome}</h2>
          <p className="muted"><Icon name="pin" /> {o?.morada}, {o?.cidade}</p>
        </div>

        <h2 style={{ textAlign: 'center', margin: '6px 0 0' }}>Confira os cavaletes</h2>
        <p className="muted" style={{ textAlign: 'center', fontSize: '0.86em', marginTop: '-4px' }}>
          Toque em cada um à medida que o carrega.
        </p>

        <div className="mprog">
          <span
            style={{
              width: `${numsList.length ? Math.min(100, (chkSet.size / numsList.length) * 100) : 0}%`,
            }}
          />
        </div>
        <p className="rck-s">
          <b>{chkSet.size}</b> de {numsList.length} carregados
          {extraList.length > 0 && <em className="xm"> · +{extraList.length} a mais</em>}
        </p>

        <div className="rchk">
          {numsList.map(k => {
            const isChecked = chkSet.has(k);
            return (
              <button
                key={k}
                type="button"
                className={`rck mk ${isChecked ? '' : 'todo'}`}
                aria-pressed={isChecked}
                onClick={() => {
                  setMot(prev => {
                    const nextChk = new Set(prev.chk || []);
                    if (nextChk.has(k)) nextChk.delete(k);
                    else nextChk.add(k);
                    return { ...prev, chk: [...nextChk], xerr: '' };
                  });
                }}
              >
                <i className={`tdot t-${tipoDe(k)}`} />
                <span>{k}</span>
                {isChecked && <Icon name="check" />}
              </button>
            );
          })}
          {extraList.map(k => (
            <button
              key={k}
              type="button"
              className="rck xtra"
              aria-label={`Retirar ${k}`}
              onClick={() => {
                setMot(prev => ({
                  ...prev,
                  extra: (prev.extra || []).filter(x => x !== k),
                }));
              }}
            >
              <i className={`tdot t-${tipoDe(k)}`} />
              <span>{k}</span>
              <Icon name="x" />
            </button>
          ))}
        </div>

        <div className="mx">
          <div className="cbox">
            <Icon name="plus" />
            <input
              id="mx"
              inputMode="numeric"
              maxLength={4}
              placeholder="Carregou outro? N.º"
              value={xqInput}
              onChange={e => setXqInput(e.target.value.replace(/\D/g, ''))}
            />
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              const v = parseInt(xqInput, 10);
              setXqInput('');
              if (!v || !tipoDe(v)) {
                setMot(prev => ({ ...prev, xerr: 'Esse número não existe.' }));
                return;
              }
              if (numsList.includes(v)) {
                setMot(prev => {
                  const nextChk = new Set(prev.chk || []);
                  nextChk.add(v);
                  return { ...prev, chk: [...nextChk], xerr: '' };
                });
                return;
              }
              if (extraList.includes(v)) {
                setMot(prev => ({ ...prev, xerr: 'Já está na lista.' }));
                return;
              }
              setMot(prev => ({ ...prev, extra: [...(prev.extra || []), v], xerr: '' }));
            }}
          >
            Adicionar
          </button>
        </div>

        {mot.xerr && <p className="err">{mot.xerr}</p>}

        {faltam.length > 0 && chkSet.size > 0 && (
          <div className="note" style={{ background: 'var(--warn-soft)', color: 'var(--warn)' }}>
            <Icon name="alert" />
            <span>
              Ainda faltam <b>{faltam.length}</b>: {faltam.join(', ')}. Se confirmar assim, o escritório é avisado da diferença.
            </span>
          </div>
        )}

        {extraList.length > 0 && (
          <div className="note" style={{ background: 'var(--warn-soft)', color: 'var(--warn)' }}>
            <Icon name="alert" />
            <span>
              {extraList.join(', ')} {extraList.length > 1 ? 'não estão registados' : 'não está registado'} nesta entrega. O escritório é avisado.
            </span>
          </div>
        )}

        <button
          type="button"
          className="btn btn-ok btn-xl btn-block"
          disabled={totalCount === 0}
          onClick={() => {
            if (!m) return;
            const finalNumsMot = numsList.filter(k => chkSet.has(k)).concat(extraList);
            motoristaConfirmarCarga({ movId: m.id, numsMot: finalNumsMot });
          }}
        >
          <Icon name="check" />
          <span>Confirmar {totalCount} cavaletes</span>
        </button>
      </>
    );
  } else if (mot.rec) {
    const o = obras.find(x => x.id === mot.rec.obraId);
    const r = o ? resumo(o, movs) : { total: 0 };

    screenContent = (
      <>
        <button
          type="button"
          className="back"
          onClick={() => setMot(prev => ({ ...prev, rec: null }))}
        >
          <Icon name="left" />Voltar
        </button>

        <div className="pcard">
          <p className="eyebrow">Recolha</p>
          <h2>{o?.nome}</h2>
          <p className="muted">{o?.empresa} · {r.total} cavaletes na obra</p>
        </div>

        <h2 style={{ textAlign: 'center', marginTop: '6px' }}>Quantos cavaletes recolheu?</h2>

        <div className="stepper">
          <button
            type="button"
            aria-label="Menos um"
            onClick={() =>
              setMot(prev => ({
                ...prev,
                qty: Math.max(1, (prev.qty || 1) - 1),
              }))
            }
          >
            <Icon name="minus" />
          </button>
          <div className="val">
            <input
              className="num stepin"
              value={mot.qty || 1}
              inputMode="numeric"
              maxLength={4}
              onChange={e => {
                const v = Math.min(r.total, Math.max(1, parseInt(e.target.value.replace(/\D/g, ''), 10) || 1));
                setMot(prev => ({ ...prev, qty: v }));
              }}
            />
            <small>cavaletes</small>
          </div>
          <button
            type="button"
            aria-label="Mais um"
            onClick={() =>
              setMot(prev => ({
                ...prev,
                qty: Math.min(r.total, (prev.qty || 1) + 1),
              }))
            }
          >
            <Icon name="plus" />
          </button>
        </div>

        <button
          type="button"
          className="btn btn-ok btn-xl btn-block"
          onClick={() => {
            motoristaConfirmarRecolha({
              obraId: mot.rec.obraId,
              pid: mot.rec.pid,
              qty: mot.qty || 1,
              motoristaNome: mot.nome,
            });
          }}
        >
          <Icon name="check" />
          <span>Confirmar recolha de {mot.qty || 1}</span>
        </button>
      </>
    );
  } else if (mot.tab === 'levar') {
    screenContent = (
      <>
        <p className="eyebrow">Entregas de hoje</p>
        {minhas.length === 0 ? (
          <div className="pcard" style={{ textAlign: 'center' }}>
            <p className="muted">Não há cargas por confirmar.</p>
            <p className="muted" style={{ fontSize: '0.88em' }}>Crie uma no escritório com "Nova entrega".</p>
          </div>
        ) : (
          minhas.map(m => {
            const o = obras.find(x => x.id === m.obraId);
            return (
              <div key={m.id} className="pcard pgrad">
                <div className="row">
                  <div>
                    <b style={{ fontSize: '1.05em' }}>{o?.nome}</b>
                    <p className="muted"><Icon name="pin" /> {o?.cidade}</p>
                  </div>
                  <div className="qty">
                    <span className="num">{m.qtd}</span>
                    <Icon name="cav" />
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-xl btn-block"
                  onClick={() => {
                    let nums = m.nums;
                    if (!nums || !nums.length) {
                      const L = sentNums(m, obras, movs);
                      nums = L.length ? L : freeNums(m.qtd, [], obras, movs);
                      m.nums = nums;
                    }
                    setMot(prev => ({
                      ...prev,
                      conf: m.id,
                      qty: m.qtd,
                      chk: [],
                      extra: [],
                      xq: '',
                      xerr: '',
                    }));
                  }}
                >
                  <Icon name="truck" />Confirmar carga
                </button>
              </div>
            );
          })
        )}

        {futE.length > 0 && (
          <>
            <p className="eyebrow" style={{ marginTop: '10px' }}>Próximas entregas</p>
            <div className="flist">
              {futE.map(m => {
                const o = obras.find(x => x.id === m.obraId);
                const d = m.data;
                return (
                  <div key={m.id} className="fitem">
                    <span className="fdate">
                      <small>{DS[d.getDay()]}</small>
                      <b>{d.getDate()}</b>
                      <small>{MESES[d.getMonth()].replace('.', '')}</small>
                    </span>
                    <div className="ft">
                      <b>{o?.nome}</b>
                      <span>{o?.cidade}</span>
                    </div>
                    <span className="fq">
                      <b className="num">{m.qtd}</b>
                      <Icon name="cav" />
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {viagem.length > 0 && (
          <>
            <p className="eyebrow" style={{ marginTop: '8px' }}>A caminho</p>
            {viagem.map(m => {
              const o = obras.find(x => x.id === m.obraId);
              return (
                <div key={m.id} className="pcard pgrad">
                  <div className="row">
                    <div>
                      <b>{o?.nome}</b>
                      <p className="muted">{m.qtdMot} cavaletes · à espera da assinatura do cliente</p>
                    </div>
                    <Icon name="clock" />
                  </div>
                </div>
              );
            })}
          </>
        )}
      </>
    );
  } else {
    // Separador "recolher"
    const ag = pedidos
      .filter(p => p.estado === 'agendado' && (!p.mot || p.mot === mot.nome))
      .sort((a, b) => (a.dataRec || '').localeCompare(b.dataRec || ''));
    const tdIso = isoD(TODAY);
    const ps = ag.filter(p => (p.dataRec || '') <= tdIso);
    const futR = ag.filter(p => (p.dataRec || '') > tdIso);

    screenContent = (
      <>
        <p className="eyebrow">Recolhas de hoje</p>
        {ps.length === 0 ? (
          <p className="muted">Sem recolhas para hoje.</p>
        ) : (
          ps.map(p => {
            const o = obras.find(x => x.id === p.obraId);
            return (
              <div key={p.id} className="pcard">
                <div className="row">
                  <div>
                    <b style={{ fontSize: '1.05em' }}>{o?.nome}</b>
                    <p className="muted"><Icon name="pin" /> {o?.cidade}</p>
                  </div>
                  <div className="qty">
                    <span className="num">{p.qtd}</span>
                    <Icon name="cav" />
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-xl btn-block"
                  onClick={() => {
                    const r = o ? resumo(o, movs) : { total: p.qtd };
                    setMot(prev => ({
                      ...prev,
                      rec: { obraId: o.id, pid: p.id },
                      qty: Math.min(p.qtd, r.total),
                    }));
                  }}
                >
                  <Icon name="recolha" />Registar recolha
                </button>
              </div>
            );
          })
        )}

        {futR.length > 0 && (
          <>
            <p className="eyebrow" style={{ marginTop: '10px' }}>Próximas recolhas</p>
            <div className="flist">
              {futR.map(p => {
                const o = obras.find(x => x.id === p.obraId);
                const d = parseIso(p.dataRec);
                return (
                  <div key={p.id} className="fitem">
                    <span className="fdate">
                      <small>{DS[d.getDay()]}</small>
                      <b>{d.getDate()}</b>
                      <small>{MESES[d.getMonth()].replace('.', '')}</small>
                    </span>
                    <div className="ft">
                      <b>{o?.nome}</b>
                      <span>{o?.cidade}</span>
                    </div>
                    <span className="fq">
                      <b className="num">{p.qtd}</b>
                      <Icon name="cav" />
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </>
    );
  }

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
            onClick={() => setPsOpen(o => !o)}
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

        <h2>Olá, Sr. {mot.nome.split(' ')[0]}</h2>
        <p>{DIAS[TODAY.getDay()]}, {TODAY.getDate()} de {MESES_L[TODAY.getMonth()]}</p>
      </div>

      <div className="pbody">{screenContent}</div>

      <div className="ptabs">
        <button
          type="button"
          aria-pressed={mot.tab === 'levar'}
          onClick={() => setMot(m => ({ ...m, tab: 'levar', conf: null, rec: null, done: null }))}
        >
          <Icon name="truck" />Entrega
        </button>
        <button
          type="button"
          aria-pressed={mot.tab === 'recolher'}
          onClick={() => setMot(m => ({ ...m, tab: 'recolher', conf: null, rec: null, done: null }))}
        >
          <Icon name="recolha" />Recolher
        </button>
      </div>
    </>
  );

  return (
    <div className="phonestage">
      <div className="explain">
        <p className="eyebrow">Como funciona</p>
        <h2>O motorista confirma tudo com um toque</h2>
        <ol>
          <li><span className="n">1</span><span>Recebe um link por SMS. Não instala nada e não precisa de palavra-passe.</span></li>
          <li><span className="n">2</span><span>Vê a carga do dia já preenchida pelo escritório.</span></li>
          <li><span className="n">3</span><span>Confere os cavaletes um a um, pelo número. Se faltar ou sobrar algum, o escritório é avisado.</span></li>
          <li><span className="n">4</span><span>O cliente recebe logo a confirmação para assinar.</span></li>
        </ol>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center', minWidth: 0 }}>
        <div className="phone">
          <div className={`screen sz-${psize}`}>{phoneScreen}</div>
        </div>
      </div>

      <div className="explain right">
        <p className="eyebrow">Experimente</p>
        <ol>
          <li><span className="n">1</span><span>Toque em "Confirmar carga" no Edifício Mondego.</span></li>
          <li><span className="n">2</span><span>Toque em cada um dos 5 cavaletes e confirme.</span></li>
          <li><span className="n">3</span><span>Passe para o ecrã do Cliente para assinar.</span></li>
        </ol>
      </div>
    </div>
  );
}
