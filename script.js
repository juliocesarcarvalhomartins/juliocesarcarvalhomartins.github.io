const root = document.documentElement;
const themeButton = document.querySelector('.theme-toggle');
const themeIcon = document.querySelector('.theme-icon');

function setTheme(theme) {
  root.dataset.theme = theme;
  themeIcon.textContent = theme === 'dark' ? '☀' : '☾';
  themeButton.setAttribute('aria-label', theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro');
}

setTheme(localStorage.getItem('portfolio-theme') || 'dark');
themeButton.addEventListener('click', () => {
  const nextTheme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  setTheme(nextTheme);
  localStorage.setItem('portfolio-theme', nextTheme);
});

const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('.nav-menu');
menuButton.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
});
menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  menu.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
}));

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const reveals = document.querySelectorAll('.reveal');
if (reducedMotion || !('IntersectionObserver' in window)) {
  reveals.forEach(item => item.classList.add('visible'));
} else {
  const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  }), { threshold: 0.12 });
  reveals.forEach(item => revealObserver.observe(item));
}

const sections = document.querySelectorAll('main section[id]');
const navLinks = document.querySelectorAll('.nav-menu a');
const sectionObserver = new IntersectionObserver(entries => entries.forEach(entry => {
  if (!entry.isIntersecting) return;
  navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
}), { rootMargin: '-35% 0px -55%' });
sections.forEach(section => sectionObserver.observe(section));

const filterButtons = document.querySelectorAll('.filter');
const projectCards = document.querySelectorAll('.project-card');
filterButtons.forEach(button => button.addEventListener('click', () => {
  const selected = button.dataset.filter;
  filterButtons.forEach(item => item.classList.toggle('active', item === button));
  projectCards.forEach(card => {
    const categories = card.dataset.category.split(' ');
    card.classList.toggle('hidden', selected !== 'all' && !categories.includes(selected));
  });
}));

// Apresentação profissional do projeto Sistema de Chamados.
const helpDeskCard = document.querySelector('.project-card[data-category="database"]');
if (helpDeskCard) {
  const description = helpDeskCard.querySelector('.project-body > p');
  if (description) {
    description.textContent = 'Sistema de Help Desk com banco de dados relacional em MySQL 8.0. Estrutura com 8 tabelas para gerenciar funcionários, chamados, categorias, prioridades, status, técnicos e atendimentos.';
  }

  const status = helpDeskCard.querySelector('.project-status');
  if (status) status.textContent = '8 tabelas • 7 relacionamentos FK • 11 consultas SQL';

  const body = helpDeskCard.querySelector('.project-body');
  if (body) {
    const oldLink = body.querySelector('.project-link');
    if (oldLink) oldLink.remove();

    const detailsLink = document.createElement('a');
    detailsLink.className = 'project-link';
    detailsLink.href = 'sistema-de-chamados.html';
    detailsLink.innerHTML = 'Ver projeto completo <span>↗</span>';
    body.appendChild(detailsLink);

    const githubLink = document.createElement('a');
    githubLink.className = 'project-link';
    githubLink.href = 'https://github.com/juliocesarcarvalhomartins/sistema-de-chamados-helpdesk';
    githubLink.target = '_blank';
    githubLink.rel = 'noreferrer';
    githubLink.innerHTML = 'Ver no GitHub <span>↗</span>';
    body.appendChild(githubLink);
  }
}

document.querySelector('#contact-form').addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const subject = encodeURIComponent(`Contato pelo portfólio — ${data.get('name')}`);
  const body = encodeURIComponent(`Nome: ${data.get('name')}\nE-mail: ${data.get('email')}\n\n${data.get('message')}`);
  window.location.href = `mailto:julio.martins2324@gmail.com?subject=${subject}&body=${body}`;
});

document.querySelector('#year').textContent = new Date().getFullYear();
