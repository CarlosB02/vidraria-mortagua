'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { generateSeedData } from '../data/seed.js';
import {
  TODAY,
  MOTORISTAS,
  STAFF,
  MOT_TEL,
  CLIENTE_DEMO,
  PRAZO,
  isoD,
  addDays,
  addMonths,
} from '../data/constants.js';
import {
  tipoDe,
  inventario,
  resumo,
  cliList,
  resLists,
  sameSet,
} from '../data/logic.js';

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  // Inicialização determinística de dados
  const [data, setData] = useState(() => generateSeedData());
  const { obras, movs, pedidos, lembretes } = data;

  // Estado geral
  const [view, setViewState] = useState('escritorio');
  const [page, setPageState] = useState('inicio');
  const [obraId, setObraId] = useState(null);
  const [emp, setEmp] = useState(null);
  const [empFrom, setEmpFrom] = useState(null);
  const [ohist, setOhist] = useState([]);

  // Navegação com histórico (Ficha de Obra / Ficha de Empresa)
  const openObra = useCallback((id) => {
    setOhist(prev => [...prev, { page, obraId, emp, empFrom }]);
    setObraId(id);
    setEmp(null);
    setPageState('obras');
    window.scrollTo(0, 0);
  }, [page, obraId, emp, empFrom]);

  const openEmpresa = useCallback((empName) => {
    setOhist(prev => [...prev, { page, obraId, emp, empFrom }]);
    setEmp(empName);
    setEmpFrom(obraId);
    setObraId(null);
    setPageState('obras');
    window.scrollTo(0, 0);
  }, [page, obraId, emp, empFrom]);

  const goBack = useCallback(() => {
    setOhist(prev => {
      if (!prev.length) {
        setObraId(null);
        setEmp(null);
        setEmpFrom(null);
        return [];
      }
      const next = [...prev];
      const last = next.pop();
      setObraId(last.obraId || null);
      setEmp(last.emp || null);
      setEmpFrom(last.empFrom || null);
      if (last.page) setPageState(last.page);
      window.scrollTo(0, 0);
      return next;
    });
  }, []);

  // Filtros escritório
  const [filtro, setFiltro] = useState('todas');
  const [q, setQ] = useState('');
  const [og, setOg] = useState('distrito');
  const [ogSel, setOgSel] = useState(null);
  const [mapf, setMapf] = useState('todas');
  const [mlim, setMlim] = useState(10);

  // Preferências
  const [osize, setOsize] = useState('n');
  const [theme, setTheme] = useState('auto');
  const [psize, setPsize] = useState('n');
  const [psOpen, setPsOpen] = useState(false);
  const [auto, setAuto] = useState({ d30: true, d7: true, d0: true, sem: false });
  const [currentUser] = useState('Cristiana');

  // Inventário cavaletes
  const [cav, setCav] = useState({ tipo: 'todos', est: 'todos', q: '', lim: 20 });

  // Motorista
  const [mot, setMot] = useState({
    nome: 'António Marques',
    tab: 'levar',
    conf: null,
    qty: 0,
    chk: [],
    extra: [],
    xq: '',
    xerr: '',
    rec: null,
    done: null,
  });

  // Cliente
  const [cli, setCli] = useState({
    resp: 0,
    respOpen: false,
    obraId: 'o1',
    qty: null,
    outro: false,
    nome: '',
    sig: null,
    err: '',
    done: null,
    recolha: false,
    rq: 0,
    miss: [],
    extra: [],
    xq: '',
    xerr: '',
    nota: '',
  });

  // Financeiro e Acessos Admin
  const [fin, setFin] = useState({ v: { S: 180, D: 320, P: 120 }, taxa: 5 });
  const [af, setAf] = useState('todos');
  const [alim, setAlim] = useState(25);
  const [pq, setPq] = useState('');
  const [plim, setPlim] = useState(8);
  const [motoristasList, setMotoristasList] = useState([...MOTORISTAS]);
  const [staffList, setStaffList] = useState([...STAFF]);
  const [acessoMap, setAcessoMap] = useState({});

  // Modais e Toasts
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  // Sincronização de preferências visuais
  useEffect(() => {
    const root = document.querySelector('.vm-dashboard');
    if (!root) return;
    root.classList.remove('sz-l', 'sz-xl');
    if (osize !== 'n') root.classList.add('sz-' + osize);
    if (theme === 'auto') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', theme);
    }
  }, [osize, theme]);

  // Toast helper
  const showToast = useCallback((msg) => {
    setToast(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 3600);
  }, []);

  const openModal = useCallback((m) => {
    setModal(m);
  }, []);

  const closeModal = useCallback(() => {
    setModal(null);
  }, []);

  // Mutações de Dados

  // TODO: API - Criar nova entrega no backend
  const criarEntrega = useCallback(({ obraId: selObraId, novaObraData, nums, mot: motNome, date }) => {
    let finalObraId = selObraId;
    let nextObras = [...obras];

    if (novaObraData) {
      const novaId = 'o' + (nextObras.length + 1);
      const nova = {
        id: novaId,
        nome: novaObraData.nome.trim(),
        empresa: novaObraData.empresa.trim(),
        cidade: novaObraData.cidade.trim(),
        morada: novaObraData.morada.trim() || '—',
        distrito: novaObraData.cidade.trim(),
        lat: 40.397,
        lon: -8.232,
        contacto: novaObraData.contacto.trim() || '—',
        email: novaObraData.email.trim() || '—',
        tel: novaObraData.tel.trim() || '—',
      };
      nextObras.push(nova);
      finalObraId = novaId;
    }

    const dd = (date || '').split('-').map(Number);
    const dEnv = dd.length === 3 && dd[0] ? new Date(dd[0], dd[1] - 1, dd[2]) : TODAY;
    const newGuia = 'GE-2026/' + (1300 + movs.length + 1);

    const newMov = {
      id: 'm' + (movs.length + 100),
      obraId: finalObraId,
      tipo: 'entrega',
      data: dEnv,
      qtd: nums.length,
      nums: [...nums],
      qtdMot: null,
      qtdCli: null,
      motorista: motNome,
      estado: 'preparada',
      assinatura: null,
      nova: true,
      guia: newGuia,
      por: currentUser,
    };

    setData(prev => ({
      ...prev,
      obras: nextObras,
      movs: [newMov, ...prev.movs],
    }));

    setMot(m => ({ ...m, nome: motNome }));
    closeModal();
    showToast(
      novaObraData
        ? `Obra criada e entrega enviada ao Sr. ${motNome.split(' ')[0]}.`
        : `Entrega criada. SMS enviado ao Sr. ${motNome.split(' ')[0]}.`
    );
  }, [obras, movs, currentUser, closeModal, showToast]);

  // TODO: API - Registar recolha no backend
  const registarRecolha = useCallback(({ obraId: targetObraId, qty }) => {
    const newMov = {
      id: 'm' + (movs.length + 100),
      obraId: targetObraId,
      tipo: 'recolha',
      data: TODAY,
      qtd: qty,
      motorista: 'Joaquim Duarte',
      estado: 'concluida',
      guia: 'GR-2026/' + (1300 + movs.length + 1),
      por: currentUser,
    };
    setData(prev => ({
      ...prev,
      movs: [newMov, ...prev.movs],
    }));
    closeModal();
    showToast(`Recolha de ${qty} cavaletes registada.`);
  }, [movs, currentUser, closeModal, showToast]);

  // TODO: API - Marcar recolha e enviar folha para logística
  const marcarRecolhaLogistica = useCallback((pedidoId) => {
    const pedido = pedidos.find(p => p.id === pedidoId);
    if (!pedido) return;
    const guia = pedido.guia || 'GR-2026/' + (1400 + pedidos.length + 1);

    const newMov = {
      id: 'm' + (movs.length + 100),
      obraId: pedido.obraId,
      tipo: 'recolha',
      data: TODAY,
      qtd: pedido.qtd,
      motorista: null,
      estado: 'por_atribuir',
      guia,
      pid: pedido.id,
      por: currentUser,
    };

    setData(prev => ({
      ...prev,
      movs: [newMov, ...prev.movs],
      pedidos: prev.pedidos.map(p =>
        p.id === pedidoId ? { ...p, estado: 'logistica', movId: newMov.id, guia } : p
      ),
    }));

    closeModal();
    showToast('Folha enviada para a logística. Falta atribuir o motorista em Movimentos.');
  }, [pedidos, movs, currentUser, closeModal, showToast]);

  // TODO: API - Atribuir motorista e data a recolha da logística
  const atribuirMotoristaRecolha = useCallback(({ movId, motorista, date }) => {
    const dd = (date || '').split('-').map(Number);
    const dRec = dd.length === 3 && dd[0] ? new Date(dd[0], dd[1] - 1, dd[2]) : TODAY;

    setData(prev => ({
      ...prev,
      movs: prev.movs.map(m =>
        m.id === movId ? { ...m, motorista, data: dRec, estado: 'agendada' } : m
      ),
      pedidos: prev.pedidos.map(p =>
        p.movId === movId ? { ...p, estado: 'agendado', dataRec: date, mot: motorista } : p
      ),
    }));

    setMot(m => ({ ...m, nome: motorista }));
    closeModal();
    showToast(`Recolha enviada ao telemóvel do Sr. ${motorista.split(' ')[0]}.`);
  }, [closeModal, showToast]);

  // TODO: API - Resolver divergência entre contagens
  const resolverDivergencia = useCallback(({ movId, pickOption }) => {
    setData(prev => {
      const mov = prev.movs.find(m => m.id === movId);
      if (!mov) return prev;
      const X = resLists(mov, prev.obras, prev.movs);
      const chosenList = (pickOption === 'A' ? X.V : X.C).slice();
      const resolvido = {
        d: TODAY,
        por: currentUser,
        q: chosenList.length,
        volta: pickOption === 'B' ? X.falta.length : 0,
        mais: pickOption === 'B' ? X.mais.length : 0,
        cli: pickOption === 'A',
      };

      return {
        ...prev,
        movs: prev.movs.map(m => {
          if (m.id !== movId) return m;
          return {
            ...m,
            nums: chosenList,
            numsMot: [...chosenList],
            numsCli: [...chosenList],
            qtd: chosenList.length,
            qtdMot: chosenList.length,
            qtdCli: chosenList.length,
            estado: 'entregue',
            resolvido,
          };
        }),
      };
    });

    closeModal();
    showToast('Diferença resolvida e stock atualizado.');
  }, [closeModal, showToast, currentUser]);

  // TODO: API - Motorista confirmar carga
  const motoristaConfirmarCarga = useCallback(({ movId, numsMot }) => {
    setData(prev => {
      const mov = prev.movs.find(m => m.id === movId);
      if (!mov) return prev;
      const obra = prev.obras.find(o => o.id === mov.obraId);

      const updatedMov = {
        ...mov,
        numsMot: [...numsMot],
        qtdMot: numsMot.length,
        estado: 'em_viagem',
      };

      if (obra && obra.empresa === CLIENTE_DEMO) {
        setCli(c => ({
          ...c,
          obraId: obra.id,
          qty: null,
          outro: false,
          sig: null,
          done: null,
          miss: [],
          extra: [],
        }));
      }

      return {
        ...prev,
        movs: prev.movs.map(m => (m.id === movId ? updatedMov : m)),
      };
    });

    const mov = movs.find(m => m.id === movId);
    const obra = mov ? obras.find(o => o.id === mov.obraId) : null;
    const nomeCont = obra ? obra.contacto : 'O cliente';
    const nomeObra = obra ? obra.nome : '';

    setMot(m => ({
      ...m,
      conf: null,
      done: {
        t: `${numsMot.length} cavaletes confirmados`,
        s: `Boa viagem! ${nomeCont} vai receber um SMS para confirmar a receção no ${nomeObra}.`,
        cli: true,
      },
    }));
  }, [movs, obras]);

  // TODO: API - Motorista confirmar recolha
  const motoristaConfirmarRecolha = useCallback(({ obraId: rObraId, pid, qty, motoristaNome }) => {
    setData(prev => {
      const pedido = pid ? prev.pedidos.find(p => p.id === pid) : null;
      const mv = pedido && pedido.movId ? prev.movs.find(m => m.id === pedido.movId) : null;

      let nextMovs = [...prev.movs];
      let nextPedidos = [...prev.pedidos];

      if (mv) {
        nextMovs = nextMovs.map(m =>
          m.id === mv.id ? { ...m, data: TODAY, qtd: qty, estado: 'concluida', motorista: motoristaNome } : m
        );
      } else {
        const newMov = {
          id: 'm' + (nextMovs.length + 100),
          obraId: rObraId,
          tipo: 'recolha',
          data: TODAY,
          qtd: qty,
          motorista: motoristaNome,
          estado: 'concluida',
          guia: 'GR-2026/' + (1300 + nextMovs.length + 1),
        };
        nextMovs.unshift(newMov);
      }

      if (pid) {
        nextPedidos = nextPedidos.map(p =>
          p.id === pid ? { ...p, estado: 'concluido' } : p
        );
      }

      return { ...prev, movs: nextMovs, pedidos: nextPedidos };
    });

    const obra = obras.find(o => o.id === rObraId);
    setMot(m => ({
      ...m,
      rec: null,
      done: {
        t: `Recolha de ${qty} registada`,
        s: `O escritório já vê os cavaletes do ${obra ? obra.nome : ''} a caminho da fábrica.`,
      },
    }));
  }, [obras]);

  // TODO: API - Cliente assinar e confirmar receção
  const clienteConfirmarEntrega = useCallback(({ movId, nome, sig, numsCli, nota }) => {
    setData(prev => {
      const mov = prev.movs.find(m => m.id === movId);
      if (!mov) return prev;
      const ok = sameSet(numsCli, mov.nums || []) && sameSet(mov.numsMot || [], mov.nums || []);

      return {
        ...prev,
        movs: prev.movs.map(m => {
          if (m.id !== movId) return m;
          return {
            ...m,
            numsCli: [...numsCli],
            qtdCli: numsCli.length,
            assinatura: nome,
            notaCli: nota || '',
            estado: ok ? 'entregue' : 'divergencia',
          };
        }),
      };
    });

    const mov = movs.find(m => m.id === movId);
    const obra = mov ? obras.find(o => o.id === mov.obraId) : null;
    const r = obra ? resumo(obra, movs) : { total: numsCli.length };

    const ok = mov ? sameSet(numsCli, mov.nums || []) && sameSet(mov.numsMot || [], mov.nums || []) : false;

    setCli(c => ({
      ...c,
      done: {
        t: 'Obrigado!',
        s: ok
          ? `Fica registado: recebeu ${numsCli.length} cavaletes. Tem agora ${r.total} na obra. Devolver estes até ${fd(addDays(TODAY, PRAZO))}.`
          : `Registámos ${numsCli.length} cavaletes. A Vidraria foi avisada da diferença e vai contactá-lo.`,
      },
      sig: null,
      qty: null,
      outro: false,
      miss: [],
      extra: [],
      nota: '',
      err: '',
    }));
  }, [movs, obras]);

  // TODO: API - Cliente pedir recolha
  const clientePedirRecolha = useCallback(({ obraId: targetObraId, qty }) => {
    const newPedido = {
      id: 'p' + (pedidos.length + 10),
      obraId: targetObraId,
      qtd: qty,
      data: TODAY,
      estado: 'pendente',
    };

    setData(prev => ({
      ...prev,
      pedidos: [...prev.pedidos, newPedido],
    }));

    setCli(c => ({
      ...c,
      recolha: false,
      done: {
        t: 'Pedido enviado',
        s: `A Vidraria Mortágua vai buscar ${qty} cavaletes e liga-lhe para combinar o dia.`,
      },
    }));
  }, [pedidos.length]);

  // TODO: API - Registar envio de email
  const enviarEmailLembrete = useCallback((targetObraId) => {
    setData(prev => ({
      ...prev,
      lembretes: {
        ...prev.lembretes,
        [targetObraId]: TODAY,
      },
    }));
    closeModal();
    showToast('Email enviado (simulação). Fica registado no histórico da obra.');
  }, [closeModal, showToast]);

  // Adicionar pessoa (staff ou motorista)
  const adicionarPessoa = useCallback(({ papel, nome, tel }) => {
    if (papel === 'Motorista') {
      setMotoristasList(prev => [...prev, nome]);
      MOT_TEL[nome] = tel;
    } else {
      setStaffList(prev => [...prev, { nome, papel, tel, ativo: true }]);
    }
    closeModal();
    showToast(
      papel === 'Motorista'
        ? `${nome} já aparece na lista de motoristas.`
        : `${nome} adicionado. Recebe o acesso por SMS.`
    );
  }, [closeModal, showToast]);

  // Alternar acesso (Admin)
  const toggleAcesso = useCallback((id) => {
    setAcessoMap(prev => {
      const nextVal = prev[id] === false ? true : false;
      showToast(nextVal ? 'Acesso ativado.' : 'Acesso desativado.');
      return { ...prev, [id]: nextVal };
    });
  }, [showToast]);

  // Atualizar pressupostos financeiros
  const updateFinanca = useCallback((key, value) => {
    setFin(prev => {
      if (key === 'taxa') return { ...prev, taxa: value };
      return { ...prev, v: { ...prev.v, [key]: value } };
    });
  }, []);

  const value = {
    // Dados reativos
    obras,
    movs,
    pedidos,
    lembretes,
    // Navegação e vista
    view,
    setViewState,
    page,
    setPageState,
    obraId,
    setObraId,
    emp,
    setEmp,
    empFrom,
    setEmpFrom,
    ohist,
    openObra,
    openEmpresa,
    goBack,
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
    // Preferências
    osize,
    setOsize,
    theme,
    setTheme,
    psize,
    setPsize,
    psOpen,
    setPsOpen,
    auto,
    setAuto,
    currentUser,
    // Cavaletes inventário
    cav,
    setCav,
    // Motorista & Cliente
    mot,
    setMot,
    cli,
    setCli,
    // Admin
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
    adicionarPessoa,
    // Modais & Toasts
    modal,
    openModal,
    closeModal,
    toast,
    showToast,
    // Mutações
    criarEntrega,
    registarRecolha,
    marcarRecolhaLogistica,
    atribuirMotoristaRecolha,
    resolverDivergencia,
    motoristaConfirmarCarga,
    motoristaConfirmarRecolha,
    clienteConfirmarEntrega,
    clientePedirRecolha,
    enviarEmailLembrete,
  };

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
