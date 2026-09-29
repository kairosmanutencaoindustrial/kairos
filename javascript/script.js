const mobileQuery = window.matchMedia('(max-width:860px)');
let toastTimer;

function showView(id){
  document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active', v.id===id));
  document.querySelectorAll('.nav-item[data-view], .profile-btn[data-view]').forEach(b=>b.classList.toggle('active', b.dataset.view===id));
  closeMenu();
  window.scrollTo(0,0);
}

function toast(msg, isError){
  let t = document.getElementById('toast');
  if(!t){
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast';
    t.setAttribute('role','status');
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.toggle('error', !!isError);
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>t.classList.remove('show'), 2600);
}

function openMenu(){
  document.getElementById('sidebar').classList.add('open');
  document.querySelector('.scrim').classList.add('show');
  document.body.classList.add('menu-open');
  const burger = document.querySelector('.burger');
  burger.setAttribute('aria-expanded','true');
  burger.setAttribute('aria-label','Fechar menu');
}

function closeMenu(){
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.remove('open');
  sidebar.style.removeProperty('transform');
  sidebar.style.removeProperty('transition');
  document.querySelector('.scrim').classList.remove('show');
  document.body.classList.remove('menu-open');
  const burger = document.querySelector('.burger');
  burger.setAttribute('aria-expanded','false');
  burger.setAttribute('aria-label','Abrir menu');
}

function buildMobileMenu(){
  const sidebar = document.getElementById('sidebar');
  const logo = sidebar.querySelector('.logo');

  const bar = document.createElement('header');
  bar.className = 'topbar';
  bar.innerHTML =
    '<button class="burger" type="button" aria-label="Abrir menu" aria-expanded="false" aria-controls="sidebar"><span></span><span></span><span></span></button>' +
    '<img class="topbar-logo" src="' + logo.src + '" alt="KAIROS">' +
    '<button class="top-avatar js-initials" type="button" aria-label="Abrir área do usuário"></button>';
  document.querySelector('.app').prepend(bar);

  const scrim = document.createElement('div');
  scrim.className = 'scrim';
  document.body.appendChild(scrim);

  bar.querySelector('.burger').addEventListener('click', ()=>{
    sidebar.classList.contains('open') ? closeMenu() : openMenu();
  });
  bar.querySelector('.top-avatar').addEventListener('click', ()=>showView('usuario'));
  scrim.addEventListener('click', closeMenu);
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeMenu(); });
  mobileQuery.addEventListener('change', e=>{ if(!e.matches) closeMenu(); });

  sidebar.querySelectorAll('.nav-item, .nav-label, .sidebar-div, .profile-btn').forEach((el,i)=>el.style.setProperty('--i', i));

  // Navegação por toque: deixa o navegador rolar o menu normalmente.
  // O fechamento continua disponível pelo botão, pelo overlay e pelo ESC.
  sidebar.addEventListener('click', e=>{
    const item = e.target.closest('.nav-item, .profile-btn');
    if(item && mobileQuery.matches) closeMenu();
  });
}

const CONFIG_KEY = 'kairos-config';
const PROFILE_KEY = 'kairos-perfil';
let configDefaults = {};

function readSettings(){
  const data = {};
  document.querySelectorAll('#configuracoes [data-setting]').forEach(el=>{
    const key = el.dataset.setting;
    if(el.type === 'checkbox') data[key] = el.checked;
    else if(el.classList.contains('choice-row')){
      const sel = el.querySelector('.sel-blue');
      data[key] = sel ? sel.dataset.value : null;
    } else data[key] = el.value;
  });
  return data;
}

function applySettings(data){
  document.querySelectorAll('#configuracoes [data-setting]').forEach(el=>{
    const key = el.dataset.setting;
    if(!(key in data)) return;
    if(el.type === 'checkbox') el.checked = !!data[key];
    else if(el.classList.contains('choice-row')){
      el.querySelectorAll('.choice-btn').forEach(b=>b.classList.toggle('sel-blue', b.dataset.value === data[key]));
    } else el.value = data[key];
  });
  updateAlertSummary();
}

function updateAlertSummary(){
  const boxes = document.querySelectorAll('#configuracoes input[type=checkbox]');
  const on = [...boxes].filter(b=>b.checked).length;
  document.getElementById('alertas-qtd').textContent = on + ' de ' + boxes.length + ' alertas';
  document.getElementById('alertas-barra').style.width = (on / boxes.length * 100) + '%';
}

function saveSettings(){
  try{ localStorage.setItem(CONFIG_KEY, JSON.stringify(readSettings())); }catch(e){}
  toast('Configurações salvas');
}

function resetSettings(){
  applySettings(configDefaults);
  try{ localStorage.removeItem(CONFIG_KEY); }catch(e){}
  toast('Configurações restauradas para o padrão');
}

function initials(name){
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if(!parts.length) return '?';
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length-1][0] : '';
  return (first + last).toUpperCase();
}

function applyProfile(p){
  document.querySelectorAll('.js-name').forEach(el=>el.textContent = p.nome);
  document.querySelectorAll('.js-first').forEach(el=>el.textContent = p.nome.trim().split(/\s+/)[0]);
  document.querySelectorAll('.js-initials').forEach(el=>el.textContent = initials(p.nome));
  document.querySelectorAll('.js-email').forEach(el=>el.textContent = p.email);
  document.querySelectorAll('.js-phone').forEach(el=>el.textContent = p.telefone);
  document.getElementById('perfil-nome').value = p.nome;
  document.getElementById('perfil-email').value = p.email;
  document.getElementById('perfil-telefone').value = p.telefone;
}

function saveProfile(){
  const p = {
    nome: document.getElementById('perfil-nome').value.trim(),
    email: document.getElementById('perfil-email').value.trim(),
    telefone: document.getElementById('perfil-telefone').value.trim()
  };
  if(!p.nome){ toast('Digite seu nome para salvar', true); return; }
  if(!p.email || p.email.indexOf('@') < 1){ toast('Digite um e-mail válido', true); return; }
  applyProfile(p);
  try{ localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); }catch(e){}
  toast('Seus dados foram salvos');
}

function changePassword(){
  const atual = document.getElementById('senha-atual');
  const nova = document.getElementById('senha-nova');
  const repita = document.getElementById('senha-repita');
  if(!atual.value || !nova.value || !repita.value){ toast('Preencha os três campos de senha', true); return; }
  if(nova.value.length < 6){ toast('A nova senha precisa ter pelo menos 6 caracteres', true); return; }
  if(nova.value !== repita.value){ toast('As senhas novas não são iguais', true); return; }
  atual.value = nova.value = repita.value = '';
  toast('Senha alterada com sucesso');
}

function signOut(){
  toast('Você saiu da conta');
}


const THEME_KEY = 'kairos-theme';
function applyTheme(theme){
  document.documentElement.dataset.theme = theme;
  const btn = document.getElementById('themeToggle');
  if(btn){
    const dark = theme === 'dark';
    btn.setAttribute('aria-label', dark ? 'Ativar modo claro' : 'Ativar modo escuro');
    const icon = btn.querySelector('#themeIconImg');
    if(icon){
      icon.src = dark ? 'assets/icon-sol.png' : 'assets/icon-lua.png';
      icon.alt = dark ? 'Sol' : 'Lua';
    }
    const label = btn.querySelector('.theme-label');
    if(label) label.textContent = dark ? 'Modo claro' : 'Modo escuro';
  }
}
function toggleTheme(){
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  try{ localStorage.setItem(THEME_KEY, next); }catch(e){}
}
const savedTheme = (()=>{ try{return localStorage.getItem(THEME_KEY);}catch(e){return null;} })();
applyTheme(savedTheme === 'dark' ? 'dark' : 'light');
document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);

buildMobileMenu();

configDefaults = readSettings();
try{
  const savedConfig = JSON.parse(localStorage.getItem(CONFIG_KEY));
  if(savedConfig) applySettings(savedConfig);
  const savedProfile = JSON.parse(localStorage.getItem(PROFILE_KEY));
  if(savedProfile) applyProfile(savedProfile);
}catch(e){}
updateAlertSummary();
document.querySelectorAll('.js-initials').forEach(el=>{ if(!el.textContent.trim()) el.textContent = 'OR'; });

document.querySelectorAll('#configuracoes input[type=checkbox]').forEach(b=>b.addEventListener('change', updateAlertSummary));
document.querySelectorAll('#configuracoes .choice-row').forEach(row=>{
  row.addEventListener('click', e=>{
    const btn = e.target.closest('.choice-btn');
    if(!btn) return;
    row.querySelectorAll('.choice-btn').forEach(b=>b.classList.toggle('sel-blue', b === btn));
  });
});
