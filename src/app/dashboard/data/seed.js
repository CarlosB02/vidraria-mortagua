import {
  TODAY,
  addDays,
  isoD,
  MOTORISTAS,
  FABRICA,
  TOWNS,
  EMPRESAS,
  TIPOS,
  SUF,
  RUAS,
  NOMES
} from './constants.js';

function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const slug = s =>
  s.toLowerCase()
   .normalize('NFD')
   .replace(/[\u0300-\u036f]/g, '')
   .replace(/[^a-z]+/g, '')
   .slice(0, 14);

export function generateSeedData() {
  const R = rng(20261001);
  const pick = a => a[Math.floor(R() * a.length)];

  const obras = [];
  const movs = [];
  const pedidos = [];
  const lembretes = {};
  let mid = 1;
  const nm = () => 'm' + (mid++);

  function addObra(o) {
    o.id = 'o' + (obras.length + 1);
    obras.push(o);
    return o;
  }

  function entrega(obraId, data, qtd, opts = {}) {
    const m = Object.assign(
      {
        id: nm(),
        obraId,
        tipo: 'entrega',
        data,
        qtd,
        qtdMot: qtd,
        qtdCli: qtd,
        motorista: pick(MOTORISTAS),
        estado: 'entregue',
      },
      opts
    );
    if (m.assinatura === undefined) {
      const o = obras.find(x => x.id === obraId);
      m.assinatura = o.contacto;
    }
    movs.push(m);
    return m;
  }

  function devolucao(obraId, data, qtd, opts = {}) {
    const m = Object.assign(
      {
        id: nm(),
        obraId,
        tipo: 'recolha',
        data,
        qtd,
        motorista: pick(MOTORISTAS),
        estado: 'concluida',
      },
      opts
    );
    movs.push(m);
    return m;
  }

  // Obras com histórias para a demonstração
  const A = addObra({
    empresa: 'Construções Alves Pinto',
    nome: 'Edifício Mondego',
    morada: 'Av. Fernão de Magalhães',
    cidade: 'Coimbra',
    distrito: 'Coimbra',
    lat: 40.21,
    lon: -8.43,
    contacto: 'Eng. Rui Pinto',
    email: 'obras@alvespinto.pt',
    tel: '239 000 114',
  });
  entrega(A.id, addDays(TODAY, -79), 12, { motorista: 'António Marques' });
  entrega(A.id, addDays(TODAY, -29), 6, { motorista: 'Joaquim Duarte' });
  entrega(A.id, TODAY, 5, {
    qtdMot: null,
    qtdCli: null,
    motorista: 'António Marques',
    estado: 'preparada',
    assinatura: null,
    nova: true,
  });

  const B = addObra({
    empresa: 'Douro Edifica',
    nome: 'Hotel Ribeira',
    morada: 'Rua da Alfândega',
    cidade: 'Porto',
    distrito: 'Porto',
    lat: 41.14,
    lon: -8.62,
    contacto: 'Sr. Ricardo Lemos',
    email: 'compras@douroedifica.pt',
    tel: '220 000 391',
  });
  entrega(B.id, addDays(TODAY, -164), 20, { motorista: 'Manuel Pires' });
  {
    const L = [4901, 4902, 4903, 4904, 4905, 4906, 4907, 4908];
    entrega(B.id, addDays(TODAY, -3), 8, {
      qtdMot: 8,
      qtdCli: 6,
      motorista: 'Manuel Pires',
      estado: 'divergencia',
      assinatura: 'Sr. Ricardo Lemos',
      nums: L,
      numsMot: L.slice(),
      numsCli: L.slice(0, 6),
    });
  }

  const C = addObra({
    empresa: 'Construtora Vale do Dão',
    nome: 'Centro Escolar de Tondela',
    morada: 'Rua Dr. Simões de Carvalho',
    cidade: 'Tondela',
    distrito: 'Viseu',
    lat: 40.52,
    lon: -8.08,
    contacto: 'Eng.ª Marta Cardoso',
    email: 'geral@valedodao.pt',
    tel: '232 000 820',
  });
  entrega(C.id, addDays(TODAY, -205), 30, { motorista: 'Joaquim Duarte' });
  devolucao(C.id, addDays(TODAY, -59), 10, { motorista: 'Joaquim Duarte' });
  pedidos.push({ id: 'p1', obraId: C.id, qtd: 20, data: TODAY, estado: 'pendente' });
  {
    const mm = {
      id: nm(),
      obraId: B.id,
      tipo: 'recolha',
      data: addDays(TODAY, -2),
      qtd: 12,
      motorista: null,
      estado: 'por_atribuir',
      guia: 'GR-2026/1399',
      pid: 'p0',
    };
    movs.push(mm);
    pedidos.push({
      id: 'p0',
      obraId: B.id,
      qtd: 12,
      data: addDays(TODAY, -2),
      estado: 'logistica',
      guia: 'GR-2026/1399',
      movId: mm.id,
    });
  }

  const D = addObra({
    empresa: 'Construções Beira Alta',
    nome: 'Moradia Quinta do Sobral',
    morada: 'Rua da Fonte',
    cidade: 'Santa Comba Dão',
    distrito: 'Viseu',
    lat: 40.40,
    lon: -8.13,
    contacto: 'Sr. Fernando Silva',
    email: 'fsilva@beiraalta.pt',
    tel: '232 000 471',
  });
  entrega(D.id, TODAY, 3, {
    qtdMot: null,
    qtdCli: null,
    motorista: 'António Marques',
    estado: 'preparada',
    assinatura: null,
  });

  const E = addObra({
    empresa: 'Martins & Neves, Lda.',
    nome: 'Escritórios Parque das Nações',
    morada: 'Av. D. João II',
    cidade: 'Lisboa',
    distrito: 'Lisboa',
    lat: 38.76,
    lon: -9.10,
    contacto: 'Eng. Nuno Costa',
    email: 'nuno.costa@martinsneves.pt',
    tel: '210 000 552',
  });
  entrega(E.id, addDays(TODAY, -148), 24, { motorista: 'Manuel Pires' });
  entrega(E.id, addDays(TODAY, -1), 10, {
    qtdMot: 10,
    qtdCli: null,
    motorista: 'Joaquim Duarte',
    estado: 'em_viagem',
    assinatura: null,
  });
  {
    const L = [2801, 2802, 2803, 2804, 2805, 2806, 2807];
    const X = L.concat([2815]);
    entrega(E.id, addDays(TODAY, -2), 7, {
      qtdMot: 8,
      qtdCli: 8,
      motorista: 'Joaquim Duarte',
      estado: 'divergencia',
      assinatura: 'Eng. Nuno Costa',
      nums: L,
      numsMot: X,
      numsCli: X.slice(),
    });
  }

  // Restantes obras
  const plan = [
    205, 230, 190, 215,
    150, 162, 168, 175, 158, 171,
    128, 140, 135, 146, 122,
    ...Array.from({ length: 22 }, () => 10 + Math.floor(R() * 105))
  ];

  plan.forEach((age, i) => {
    const t = TOWNS[i % TOWNS.length];
    const emp = EMPRESAS[i % EMPRESAS.length];
    const o = addObra({
      empresa: emp,
      nome: `${pick(TIPOS)} ${SUF[(i * 5) % SUF.length]}`,
      morada: pick(RUAS),
      cidade: t[0],
      distrito: t[3],
      lat: t[1] + (R() - 0.5) * 0.04,
      lon: t[2] + (R() - 0.5) * 0.02 + (t[2] < -9.1 ? 0.09 : t[2] < -8.75 ? 0.05 : 0),
      contacto: pick(NOMES),
      email: `obras@${slug(emp)}.pt`,
      tel: `2${Math.floor(10 + R() * 89)} 000 ${Math.floor(100 + R() * 899)}`,
    });
    const d0 = addDays(TODAY, -age);
    const q0 = 8 + Math.floor(R() * 34);
    entrega(o.id, d0, q0);
    const extra = Math.floor(R() * 3);
    for (let k = 0; k < extra; k++) {
      const a2 = Math.max(3, Math.floor(age * (0.2 + R() * 0.6)));
      entrega(o.id, addDays(TODAY, -a2), 6 + Math.floor(R() * 28));
    }
    if (R() < 0.45) {
      const ad = Math.floor(age * R() * 0.7);
      devolucao(o.id, addDays(TODAY, -ad), Math.max(2, Math.floor(q0 * (0.25 + R() * 0.4))));
    }
  });

  // Agenda do motorista de demonstração
  {
    const AM = 'António Marques';
    const ag = (o, dd, q, pid, ped) => {
      const mm = {
        id: nm(),
        obraId: o.id,
        tipo: 'recolha',
        data: addDays(TODAY, dd),
        qtd: q,
        motorista: AM,
        estado: 'agendada',
        pid,
      };
      movs.push(mm);
      pedidos.push({
        id: pid,
        obraId: o.id,
        qtd: q,
        data: addDays(TODAY, ped),
        estado: 'agendado',
        dataRec: isoD(addDays(TODAY, dd)),
        mot: AM,
        movId: mm.id,
      });
    };
    ag(E, 0, 8, 'p3', -3);
    const cand = obras.filter(o => ![A, B, C, D, E].includes(o));
    ag(cand[3], 2, 10, 'p4', -2);
    ag(cand[9], 4, 6, 'p5', -1);
    entrega(cand[5].id, addDays(TODAY, 1), 12, {
      qtdMot: null,
      qtdCli: null,
      motorista: AM,
      estado: 'preparada',
      assinatura: null,
    });
    entrega(cand[12].id, addDays(TODAY, 3), 7, {
      qtdMot: null,
      qtdCli: null,
      motorista: AM,
      estado: 'preparada',
      assinatura: null,
    });
  }

  // Guias numeradas por data
  movs
    .slice()
    .sort((a, b) => a.data - b.data)
    .forEach((m, i) => {
      m.guia = (m.tipo === 'entrega' ? 'GE' : 'GR') + '-2026/' + String(1180 + i).padStart(4, '0');
    });

  // Ajustes em obras específicas
  [7, 19].forEach(i => {
    if (obras[i]) {
      obras[i].empresa = 'Construções Alves Pinto';
      obras[i].email = 'obras@alvespinto.pt';
    }
  });

  // Unicidade de nomes
  const seen = new Set();
  let k = 0;
  obras.forEach(o => {
    if (seen.has(o.nome)) {
      const base = o.nome.split(' ')[0] === o.nome
        ? o.nome
        : o.nome.replace(/ (Bela Vista|Horizonte|Monte Verde|do Parque|Miradouro|Nova Era|Vale Formoso|Santa Luzia|Alto da Serra|do Rio|Jardins do Lago|Sol Nascente|Atlântico|Quinta das Rosas|São Bento|Encosta Azul|Largo Novo)$/, '');
      while (seen.has(base + ' ' + SUF[k % SUF.length])) k++;
      o.nome = base + ' ' + SUF[k % SUF.length];
    }
    seen.add(o.nome);
  });

  return { obras, movs, pedidos, lembretes, nextMid: mid };
}
