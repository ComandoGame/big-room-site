/* ============================================
   BIG-ROOM — Lógica do frontend (v1 demo)
   Tudo simulado no navegador com localStorage.
   Depois trocamos por API real.
============================================ */

const MAX_SLOTS = 10;

// ---------------- ESTADO MOCK ----------------
const estado = {
  slots: [],          // [{id,status:'livre'|'ocupado'|'reservado',jogador}]
  fila: [],           // [{nome, tempo}]
  usuario: null,
  ping: 35
};

function carregarEstado() {
  const s = localStorage.getItem('bigroom_estado');
  if (s) Object.assign(estado, JSON.parse(s));
  if (estado.slots.length !== MAX_SLOTS) inicializarSlots();
}
function salvarEstado() {
  localStorage.setItem('bigroom_estado', JSON.stringify(estado));
}
function inicializarSlots() {
  estado.slots = Array.from({ length: MAX_SLOTS }, (_, i) => ({
    id: i + 1,
    status: 'livre',
    jogador: null
  }));
  // coloca 2 ocupados e 1 reservado para parecer real
  estado.slots[0].status = 'ocupado';
  estado.slots[0].jogador = 'LucasGamer';
  estado.slots[1].status = 'ocupado';
  estado.slots[1].jogador = 'PedroX';
  estado.slots[2].status = 'reservado';
  estado.slots[2].jogador = 'Ana';
  salvarEstado();
}

// ---------------- RENDERIZAR FILA ----------------
function renderizarFila() {
  const grid = document.getElementById('filaGrid');
  if (!grid) return;
  grid.innerHTML = '';
  estado.slots.forEach(slot => {
    const div = document.createElement('div');
    div.className = `slot ${slot.status}`;
    div.innerHTML = `
      <div style="font-weight:600">#${slot.id}</div>
      <div style="font-size:.7rem;margin-top:.3rem">${
        slot.status === 'livre' ? 'Livre' :
        slot.status === 'reservado' ? 'Reservado' : slot.jogador
      }</div>
    `;
    grid.appendChild(div);
  });

  // Status card
  const livres = estado.slots.filter(s => s.status === 'livre').length;
  document.getElementById('vagasCount').textContent = `${livres} / ${MAX_SLOTS}`;
  document.getElementById('filaCount').textContent = estado.fila.length;
  document.getElementById('pingVal').textContent = `~${estado.ping} ms`;

  // Status online
  const online = estado.slots.some(s => s.status !== 'livre');
  document.getElementById('serverStatus').textContent = online ? 'Servidor ONLINE' : 'Servidor OFFLINE';
  document.getElementById('serverDot').className = 'dot' + (online ? ' online' : '');

  // Minha posição
  if (estado.usuario && estado.fila.some(f => f.nome === estado.usuario.nome)) {
    const pos = estado.fila.findIndex(f => f.nome === estado.usuario.nome) + 1;
    document.getElementById('minhaPosicao').textContent = `${pos}º da fila`;
  } else {
    document.getElementById('minhaPosicao').textContent = estado.usuario ? 'Fora da fila' : 'Faça login';
  }

  document.getElementById('tempoMedio').textContent = `~${estado.fila.length * 3} min`;
}

// ---------------- AÇÕES ----------------
function entrarNaFila() {
  if (!estado.usuario) {
    alert('Crie uma conta ou entre primeiro 😉');
    abrirModal('login');
    return;
  }
  if (estado.fila.some(f => f.nome === estado.usuario.nome)) {
    alert('Você já está na fila!');
    return;
  }
  estado.fila.push({ nome: estado.usuario.nome, tempo: Date.now() });
  salvarEstado();
  renderizarFila();
  alert(`Você entrou na fila! Posição: ${estado.fila.length}º`);
}

// Simular fila andando (a cada 15s tira 1 jogador da fila e coloca em slot)
function simularFila() {
  setInterval(() => {
    if (estado.fila.length === 0) return;
    const slotLivre = estado.slots.find(s => s.status === 'livre');
    if (!slotLivre) return;
    const jogador = estado.fila.shift();
    slotLivre.status = 'ocupado';
    slotLivre.jogador = jogador.nome;
    salvarEstado();
    renderizarFila();
  }, 15000);
}

// ---------------- LOGIN / MODAL ----------------
let modoModal = 'login';
function abrirModal(modo) {
  modoModal = modo;
  document.getElementById('modalTitulo').textContent = modo === 'login' ? 'Entrar' : 'Criar conta';
  document.getElementById('modalBg').classList.add('ativo');
}
function fecharModal() {
  document.getElementById('modalBg').classList.remove('ativo');
}

function configurarAuth() {
  const form = document.getElementById('formAuth');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nome = document.getElementById('inpNome').value || document.getElementById('inpEmail').value.split('@')[0];
    estado.usuario = { nome };
    salvarEstado();
    fecharModal();
    atualizarNavbar();
    renderizarFila();
    alert(`Bem-vindo, ${nome}!`);
  });

  document.getElementById('btnLogin').onclick = (e) => { e.preventDefault(); abrirModal('login'); };
  document.getElementById('btnCadastro').onclick = (e) => { e.preventDefault(); abrirModal('cadastro'); };
  document.getElementById('fecharModal').onclick = fecharModal;
  document.getElementById('modalBg').onclick = (e) => { if (e.target.id === 'modalBg') fecharModal(); };
}

function atualizarNavbar() {
  const btnL = document.getElementById('btnLogin');
  const btnC = document.getElementById('btnCadastro');
  if (estado.usuario) {
    btnL.textContent = estado.usuario.nome;
    btnL.onclick = (e) => { e.preventDefault(); if (confirm('Sair da conta?')) { estado.usuario = null; salvarEstado(); atualizarNavbar(); renderizarFila(); } };
    btnC.style.display = 'none';
  } else {
    btnL.textContent = 'Entrar';
    btnC.style.display = 'inline-block';
  }
}

// ---------------- BOTÕES DE PLANO ----------------
function configurarPlanos() {
  document.querySelectorAll('[data-plano]').forEach(btn => {
    btn.addEventListener('click', () => {
      const plano = btn.dataset.plano;
      const precos = { teste: 'Grátis', '30min': 'R$ 3,00', '1h': 'R$ 5,00', '5h': 'R$ 20,00' };
      if (!estado.usuario) { abrirModal('cadastro'); return; }
      alert(`Plano "${plano}" — ${precos[plano]}\n\nCheckout real virá na v2 (Stripe/Mercado Pago).`);
    });
  });
}

// ---------------- INICIALIZAÇÃO ----------------
document.addEventListener('DOMContentLoaded', () => {
  carregarEstado();
  if (!estado.slots.length) inicializarSlots();
  renderizarFila();
  configurarAuth();
  configurarPlanos();
  atualizarNavbar();
  document.getElementById('btnEntrarFila').onclick = entrarNaFila;
  simularFila();

  // Atualiza ping fake
  setInterval(() => {
    estado.ping = 30 + Math.floor(Math.random() * 15);
    document.getElementById('pingVal').textContent = `~${estado.ping} ms`;
  }, 5000);
});