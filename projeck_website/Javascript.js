// Theme preference: keep the site usable even when storage is unavailable.
const themeToggle = document.getElementById('theme-toggle');
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
let savedTheme = null;

try {
  const preference = localStorage.getItem('gsetia-theme');
  if (preference === 'light' || preference === 'dark') savedTheme = preference;
} catch {
  // Private browsing or local-file restrictions may disable storage.
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const isDark = theme === 'dark';
  themeToggle.setAttribute('aria-pressed', String(isDark));
  themeToggle.setAttribute('aria-label', isDark ? 'Aktifkan tema terang' : 'Aktifkan tema gelap');
  document.querySelector('meta[name="theme-color"]').content = isDark ? '#1a1d18' : '#f7f7f2';
}

applyTheme(savedTheme || (systemTheme.matches ? 'dark' : 'light'));
themeToggle.hidden = false;
themeToggle.addEventListener('click', () => {
  savedTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(savedTheme);
  try {
    localStorage.setItem('gsetia-theme', savedTheme);
  } catch {
    // The selected theme still works for the current visit.
  }
});

systemTheme.addEventListener('change', event => {
  if (!savedTheme) applyTheme(event.matches ? 'dark' : 'light');
});

// A collapsible mobile menu; all links remain visible without JavaScript.
const mobileLayout = window.matchMedia('(max-width: 900px)');
const menuToggle = document.getElementById('menu-toggle');
const sidebarContent = document.getElementById('sidebar-content');
const navigationLinks = [...document.querySelectorAll('.nav-link')];

function setMenu(open) {
  sidebarContent.hidden = mobileLayout.matches && !open;
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Tutup navigasi' : 'Buka navigasi');
  menuToggle.querySelector('use').setAttribute('href', open ? '#icon-close' : '#icon-menu');
}

function syncMenuLayout() {
  menuToggle.hidden = !mobileLayout.matches;
  // Return focus before hiding a menu that may contain the active control.
  if (mobileLayout.matches && sidebarContent.contains(document.activeElement)) menuToggle.focus();
  if (!mobileLayout.matches && document.activeElement === menuToggle) navigationLinks[0].focus();
  setMenu(false);
}

syncMenuLayout();
mobileLayout.addEventListener('change', syncMenuLayout);
menuToggle.addEventListener('click', () => setMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && mobileLayout.matches && !sidebarContent.hidden) {
    setMenu(false);
    menuToggle.focus();
  }
});

function setActiveSection(id) {
  navigationLinks.forEach(link => {
    const active = link.hash === `#${id}`;
    link.classList.toggle('is-active', active);
    if (active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', () => {
    const target = document.getElementById(link.hash.slice(1));
    if (!target) return;
    if (mobileLayout.matches && !sidebarContent.hidden) setMenu(false);
    if (target.matches('section')) setActiveSection(target.id);
    // Move keyboard focus to the destination after closing the mobile menu.
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });
});

// Keep the section indicator aligned with the current reading position.
const sections = [...document.querySelectorAll('main > section[id]')];
let scrollQueued = false;

function updateActiveSection() {
  const readingLine = window.innerHeight * 0.35;
  let current = sections[0];
  sections.forEach(section => {
    if (section.getBoundingClientRect().top <= readingLine) current = section;
  });
  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
    current = sections[sections.length - 1];
  }
  setActiveSection(current.id);
  scrollQueued = false;
}

function queueSectionUpdate() {
  if (scrollQueued) return;
  scrollQueued = true;
  window.requestAnimationFrame(updateActiveSection);
}

window.addEventListener('scroll', queueSectionUpdate, { passive: true });
window.addEventListener('resize', queueSectionUpdate);
window.addEventListener('hashchange', queueSectionUpdate);
updateActiveSection();
document.getElementById('year').textContent = new Date().getFullYear();
