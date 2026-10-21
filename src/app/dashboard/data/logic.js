import {
  TODAY,
  FROTA,
  TIPOS_CAV,
  MESES,
  MESES_L,
  addMonths,
  diffDays,
} from './constants.js';

export const ST = {
  late: { label: 'Prazo terminado', tone: 'late', icon: 'alert', color: 'var(--late)', soft: 'var(--late-bar)' },
  soon: { label: 'Termina em breve', tone: 'warn', icon: 'clock', color: 'var(--warn)', soft: 'var(--warn-bar)' },
  watch: { label: 'A acompanhar', tone: 'info', icon: 'clock', color: 'var(--info)', soft: 'var(--info-bar)' },
  ok: { label: 'Dentro do prazo', tone: 'ok', icon: 'check', color: 'var(--ok)', soft: 'var(--ok-bar)' },
  vazia: { label: 'Sem cavaletes', tone: 'mut', icon: 'check', color: 'var(--muted)', soft: 'var(--line)' },
};

export const qEntregue = m => m.qtdCli ?? m.qtd;

export function lots(o, movs) {
  const ent = movs
    .filter(m => m.obraId === o.id && m.tipo === 'entrega' && (m.estado === 'entregue' || m.estado === 'divergencia'))
    .sort((a, b) => a.data - b.data);
  let dev = movs
    .filter(m => m.obraId === o.id && m.tipo === 'recolha' && m.estado === 'concluida')
    .reduce((s, m) => s + m.qtd, 0);
  const out = [];
  for (const m of ent) {
    let q = qEntregue(m);
    const used = Math.min(q, dev);
    dev -= used;
    q -= used;
    if (q > 0) {
      const prazo = addMonths(m.data, 6);
      out.push({ mov: m, data: m.data, qtd: q, prazo, dias: diffDays(prazo, TODAY) });
    }
  }
  return out;
}

export function stFor(d, dias) {
  if (dias < 0) return 'late';
  if (TODAY >= addMonths(d, 5)) return 'soon';
  if (TODAY >= addMonths(d, 3)) return 'watch';
  return 'ok';
}

export function resumo(o, movs) {
  const L = lots(o, movs);
  const total = L.reduce((s, l) => s + l.qtd, 0);
  const first = L[0];
  const dias = first ? first.dias : null;
  let st = 'vazia';
  if (total > 0) {
    st = stFor(first.data, dias);
  }
  const transito = movs
    .filter(m => m.obraId === o.id && m.tipo === 'entrega' && (m.estado === 'preparada' || m.estado === 'em_viagem'))
    .reduce((s, m) => s + (m.qtdMot ?? m.qtd), 0);
  const lateQ = L.filter(l => l.dias < 0).reduce((s, l) => s + l.qtd, 0);
  return { lots: L, total, first, dias, st, transito, lateQ };
}

export function totals(obras, movs) {
  let emObra = 0,
    transito = 0,
    late = 0,
    lateObras = 0,
    soonObras = 0;
  obras.forEach(o => {
    const r = resumo(o, movs);
    emObra += r.total;
    transito += r.transito;
    late += r.lateQ;
    if (r.st === 'late') lateObras++;
    if (r.st === 'soon') soonObras++;
  });
  return { emObra, transito, fabrica: FROTA - emObra - transito, late, lateObras, soonObras };
}

export function diasTxt(d) {
  if (d === null) return '';
  if (d < 0) return `terminou há ${-d} dia${d === -1 ? '' : 's'}`;
  if (d === 0) return 'termina hoje';
  return `faltam ${d} dia${d === 1 ? '' : 's'}`;
}

export function tipoDe(n) {
  for (const k in TIPOS_CAV) {
    const T = TIPOS_CAV[k];
    if (n >= T.ini && n <= T.fim) return k;
  }
  return null;
}

function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function inventario(obras, movs) {
  const pools = {};
  for (const k in TIPOS_CAV) {
    pools[k] = [];
    for (let n = TIPOS_CAV[k].ini; n <= TIPOS_CAV[k].fim; n++) pools[k].push(n);
  }
  const out = [];
  const used = new Set();
  const isTransit = m => m.estado === 'preparada' || m.estado === 'em_viagem';

  const lotQ = {};
  obras.forEach(o =>
    resumo(o, movs).lots.forEach(l => {
      lotQ[l.mov.id] = { q: l.qtd, l, o };
    })
  );

  movs
    .filter(m => m.tipo === 'entrega' && m.nums && m.nums.length)
    .forEach(m => {
      if (isTransit(m)) {
        (m.numsMot || m.nums).forEach(n => {
          used.add(n);
          out.push({ n, tipo: tipoDe(n), estado: 'caminho', obraId: m.obraId, desde: m.data, dias: null, movId: m.id });
        });
      } else if (lotQ[m.id]) {
        const { q, l, o } = lotQ[m.id];
        (m.numsCli || m.nums).slice(0, q).forEach(n => {
          used.add(n);
          out.push({ n, tipo: tipoDe(n), estado: 'obra', obraId: o.id, desde: l.data, dias: l.dias, movId: m.id });
        });
      }
    });

  for (const k in pools) pools[k] = pools[k].filter(n => !used.has(n));

  const take = (k, q, base) => {
    const order = [k, ...Object.keys(TIPOS_CAV).filter(x => x !== k)];
    let left = q;
    for (const t of order) {
      while (left > 0 && pools[t].length) {
        out.push(Object.assign({ n: pools[t].shift(), tipo: t }, base));
        left--;
      }
    }
  };

  obras.forEach(o => {
    const w = rng(parseInt(o.id.slice(1), 10) * 7919);
    const ws = [0.35 + w() * 0.4, 0.15 + w() * 0.35, 0.1 + w() * 0.3];
    const sum = ws[0] + ws[1] + ws[2];
    const split = (q, base) => {
      const s1 = Math.round((q * ws[0]) / sum),
        d1 = Math.round((q * ws[1]) / sum),
        p1 = Math.max(0, q - s1 - d1);
      take('S', s1, base);
      take('D', d1, base);
      take('P', p1, base);
    };
    resumo(o, movs).lots.forEach(l => {
      if (l.mov.nums && l.mov.nums.length) return;
      split(l.qtd, { estado: 'obra', obraId: o.id, desde: l.data, dias: l.dias, movId: l.mov.id });
    });
    movs
      .filter(m => m.obraId === o.id && m.tipo === 'entrega' && isTransit(m) && !(m.nums && m.nums.length))
      .forEach(m => split(m.qtdMot ?? m.qtd, { estado: 'caminho', obraId: o.id, desde: m.data, dias: null, movId: m.id }));
  });

  for (const k in pools) {
    pools[k].forEach(n => out.push({ n, tipo: k, estado: 'fabrica', obraId: null, desde: null, dias: null }));
  }

  return out.sort((a, b) => a.n - b.n);
}

export function cavByNum(n, obras, movs) {
  return inventario(obras, movs).find(c => c.n === n) || null;
}

export function cavEstado(c) {
  if (c.estado === 'fabrica') return ['ok', 'factory', 'Na fábrica'];
  if (c.estado === 'caminho') return ['warn', 'truck', 'A caminho'];
  return c.dias < 0 ? ['late', 'alert', 'Fora do prazo'] : ['info', 'obra', 'Em obra'];
}

export function ranges(ns) {
  ns = ns.slice().sort((a, b) => a - b);
  const out = [];
  let a = null,
    b = null;
  ns.forEach(n => {
    if (a === null) {
      a = b = n;
    } else if (n === b + 1) {
      b = n;
    } else {
      out.push([a, b]);
      a = b = n;
    }
  });
  if (a !== null) out.push([a, b]);
  return out;
}

export function sentNums(m, obras, movs) {
  if (m.numsMot && m.numsMot.length) return m.numsMot.slice();
  if (m.nums && m.nums.length) return m.nums.slice();
  return inventario(obras, movs)
    .filter(c => c.movId === m.id)
    .map(c => c.n)
    .sort((a, b) => a - b);
}

export function cliList(m, obras, movs) {
  const V = m.nums && m.nums.length ? m.nums.slice() : sentNums(m, obras, movs);
  const MO = m.numsMot || V;
  const extra = MO.filter(n => !V.includes(n));
  return { V, MO, all: V.concat(extra), notMot: V.filter(n => !MO.includes(n)), extra };
}

export const sameSet = (a, b) => a.length === b.length && a.every(n => b.includes(n));

export function resLists(m, obras, movs) {
  const V = m.nums || [];
  const MO = m.numsMot || V;
  const C = m.numsCli || MO;
  const sV = new Set(V);
  const sC = new Set(C);
  return { V, MO, C, falta: V.filter(n => !sC.has(n)), mais: C.filter(n => !sV.has(n)) };
}

export function freeNums(k, excl, obras, movs) {
  const x = new Set(excl);
  return inventario(obras, movs)
    .filter(c => c.estado === 'fabrica' && !x.has(c.n))
    .slice(0, k)
    .map(c => c.n);
}

export function fitNums(base, q, obras, movs) {
  return q <= base.length ? base.slice(0, q) : base.concat(freeNums(q - base.length, base, obras, movs));
}

export function clientesStats(obras, movs) {
  const by = {};
  obras.forEach(o => {
    const r = resumo(o, movs);
    if (!r.total) return;
    const e = (by[o.empresa] = by[o.empresa] || {
      emp: o.empresa,
      obras: 0,
      q: 0,
      late: 0,
      age: 0,
      maxLate: 0,
      dist: o.distrito,
    });
    e.obras++;
    r.lots.forEach(l => {
      const a = diffDays(TODAY, l.data);
      e.q += l.qtd;
      e.age += a * l.qtd;
      if (l.dias < 0) {
        e.late += l.qtd;
        e.maxLate = Math.max(e.maxLate, -l.dias);
      }
    });
  });
  return Object.values(by)
    .map(e => ({
      ...e,
      avg: Math.round(e.age / e.q),
      pct: Math.round((e.late / e.q) * 100),
    }))
    .sort((a, b) => b.avg - a.avg || b.late - a.late);
}

export function atividade(obras, movs, pedidos, currentUser) {
  const ev = [];
  const porDe = m =>
    m.por || (m.nova ? currentUser : ['João Santos', 'Ana Ferreira'][parseInt(m.id.slice(1), 10) % 2]);

  movs.forEach(m => {
    const o = obras.find(x => x.id === m.obraId);
    if (!o) return;
    if (m.tipo === 'entrega') {
      ev.push({
        d: m.data,
        o: 0,
        quem: porDe(m),
        g: 'esc',
        t: `registou a entrega <b>${m.guia}</b> de ${m.qtd} cavaletes para ${esc(o.nome)}`,
        ic: 'plus',
      });
      if (m.qtdMot != null) {
        ev.push({
          d: m.data,
          o: 1,
          quem: 'Sr. ' + m.motorista,
          g: 'mot',
          t: `confirmou a carga de ${m.qtdMot} cavaletes · ${m.guia}`,
          ic: 'truck',
        });
      }
      if (m.assinatura) {
        ev.push({
          d: m.data,
          o: 2,
          quem: m.assinatura,
          g: 'cli',
          t: `assinou a receção de ${m.qtdCli} cavaletes em ${esc(o.nome)}`,
          ic: 'pen',
        });
      }
    } else {
      if (m.estado === 'concluida') {
        ev.push({
          d: m.data,
          o: 1,
          quem: 'Sr. ' + m.motorista,
          g: 'mot',
          t: `registou a recolha de ${m.qtd} cavaletes em ${esc(o.nome)}`,
          ic: 'recolha',
        });
      } else if (m.motorista) {
        ev.push({
          d: m.data,
          o: 0,
          quem: porDe(m),
          g: 'esc',
          t: `marcou a recolha <b>${m.guia}</b> com o Sr. ${esc(m.motorista)}`,
          ic: 'cal',
        });
      }
    }
  });

  pedidos.forEach(p => {
    const o = obras.find(x => x.id === p.obraId);
    if (!o) return;
    ev.push({
      d: p.data,
      o: 3,
      quem: o.contacto,
      g: 'cli',
      t: `pediu a recolha de ${p.qtd} cavaletes em ${esc(o.nome)}`,
      ic: 'hand',
    });
  });

  return ev.filter(e => e.d <= TODAY).sort((a, b) => b.d - a.d || b.o - a.o);
}

export function cliPessoas(emp, obras, movs) {
  const ob = obras.filter(x => x.empresa === emp && (resumo(x, movs).total > 0 || resumo(x, movs).transito > 0));
  const g = {
    nome: emp === 'Construções Alves Pinto' ? 'Eng. Paulo Alves Pinto' : 'Gestor da empresa',
    papel: 'Gestor',
    ids: ob.map(x => x.id),
  };
  const by = {};
  obras
    .filter(x => x.empresa === emp)
    .forEach(x => {
      if (x.contacto && x.contacto !== '—') {
        (by[x.contacto] = by[x.contacto] || []).push(x.id);
      }
    });
  return [g, ...Object.entries(by).map(([nome, ids]) => ({ nome, papel: 'Encarregado', ids }))];
}

export const norm = t =>
  String(t)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export const esc = s =>
  String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export const fmtN = n => n.toLocaleString('pt-PT');

export const fmtEUR = n => Math.round(n).toLocaleString('pt-PT') + ' €';

export const fd = d => `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`;

export const fdl = d => `${d.getDate()} de ${MESES_L[d.getMonth()]} de ${d.getFullYear()}`;

export const rel = d => {
  const n = diffDays(d, TODAY);
  if (n === 0) return 'hoje';
  if (n === -1) return 'ontem';
  if (n < 0) return `há ${-n} dias`;
  return `daqui a ${n} dias`;
};

export function parseIso(v) {
  const d = (v || '').split('-').map(Number);
  return d.length === 3 && d[0] ? new Date(d[0], d[1] - 1, d[2]) : new Date(TODAY);
}

export const mesesTxt = d => {
  const m = d / 30.4;
  return m < 1 ? `${d} dias` : `${m.toFixed(1).replace('.', ',')} meses`;
};

export function iniciais(n) {
  return n
    .replace(/^(Eng\.ª|Eng\.|Sr\.ª|Sr\.)\s*/, '')
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function emailTpl(o, k, movs) {
  const r = resumo(o, movs);
  const l = r.first;
  const subs = {
    amigavel: `Cavaletes da Vidraria Mortágua — ${o.nome}`,
    terminado: `Prazo de devolução terminado — cavaletes em ${o.nome}`,
    recolha: `Recolha de cavaletes — ${o.nome}`,
  };
  const head = `Bom dia ${o.contacto},\n\nEsperamos que a obra ${o.nome} esteja a correr bem.\n\n`;
  const lotsTxt = r.lots
    .map(x => `  • ${x.qtd} cavaletes entregues a ${fd(x.data)} — devolver até ${fd(x.prazo)}`)
    .join('\n');
  const foot = `\n\nCom os melhores cumprimentos,\nVidraria Mortágua\n232 000 000 · geral@vidrariamortagua.pt`;
  const bodies = {
    amigavel: `${head}Segundo os nossos registos, estão nessa obra ${r.total} cavaletes da Vidraria Mortágua:\n${lotsTxt}\n\nO prazo de 6 meses dos mais antigos ${
      l.dias < 0 ? 'já terminou' : 'termina a ' + fd(l.prazo)
    }. Quando já não precisarem deles, basta responder a este email e passamos a recolher na próxima volta pela vossa zona.`,
    terminado: `${head}O prazo de 6 meses dos ${l.qtd} cavaletes entregues a ${fd(l.data)} terminou a ${fd(
      l.prazo
    )}.\n\nNo total, estão nessa obra ${r.total} cavaletes:\n${lotsTxt}\n\nPedimos que nos indiquem, até ao final da próxima semana, um dia para a recolha.`,
    recolha: `${head}Vamos ter um camião na zona de ${o.cidade} nos próximos dias e gostaríamos de recolher os ${r.total} cavaletes que estão na obra.\n\nPodem indicar-nos o melhor dia e hora? Basta responder a este email.`,
  };
  return { sub: subs[k], body: bodies[k] + foot };
}
