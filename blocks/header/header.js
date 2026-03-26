import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const isDesktop = window.matchMedia('(min-width: 900px)');

function closeAllDropdowns(navSections) {
  navSections.querySelectorAll('.nav-primary > ul > li').forEach((li) => {
    li.setAttribute('aria-expanded', 'false');
  });
}

function toggleMenu(nav, forceExpanded = null) {
  const expanded = forceExpanded !== null
    ? !forceExpanded
    : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
}

function buildUtilityBar(section) {
  const utility = document.createElement('div');
  utility.className = 'nav-utility';

  const inner = document.createElement('div');
  inner.className = 'nav-utility-inner';

  const links = document.createElement('div');
  links.className = 'nav-utility-links';
  const ul = section.querySelector('ul');
  if (ul) links.append(ul);

  inner.append(links);
  utility.append(inner);
  return utility;
}

function buildPrimaryNav(section) {
  const primary = document.createElement('div');
  primary.className = 'nav-primary';

  const ul = section.querySelector(':scope > .default-content-wrapper > ul');
  if (!ul) return primary;

  // Mark items with children as nav-drop and add chevrons
  ul.querySelectorAll(':scope > li').forEach((li) => {
    const subUl = li.querySelector(':scope > ul');
    if (subUl) {
      li.classList.add('nav-drop');
      li.setAttribute('aria-expanded', 'false');

      // First child link is section landing — mark it with home icon
      const firstChild = subUl.querySelector(':scope > li:first-child > a');
      if (firstChild) {
        firstChild.classList.add('nav-section-home');
      }

      // Mark second-level items that have children
      subUl.querySelectorAll(':scope > li').forEach((childLi) => {
        if (childLi.querySelector(':scope > ul')) {
          childLi.classList.add('has-children');
        }
      });

      // Desktop: click on top-level item toggles dropdown
      li.addEventListener('click', (e) => {
        if (isDesktop.matches && e.target.closest('a') === null) {
          const wasExpanded = li.getAttribute('aria-expanded') === 'true';
          closeAllDropdowns(primary);
          li.setAttribute('aria-expanded', wasExpanded ? 'false' : 'true');
        }
      });
    }
  });

  // Mobile: sub-items with children expand on click
  ul.querySelectorAll('li.has-children').forEach((li) => {
    const toggle = li.querySelector(':scope > a');
    if (toggle) {
      toggle.addEventListener('click', (e) => {
        if (!isDesktop.matches) {
          e.preventDefault();
          const wasExpanded = li.getAttribute('aria-expanded') === 'true';
          li.setAttribute('aria-expanded', wasExpanded ? 'false' : 'true');
        }
      });
    }
  });

  primary.append(ul);
  return primary;
}

function buildSearchButton() {
  const btn = document.createElement('button');
  btn.className = 'nav-search-btn';
  btn.setAttribute('aria-label', 'Search');
  btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
  return btn;
}

export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  let navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  // When serving content pages locally, resolve nav from content directory
  if (!navMeta && window.location.pathname.startsWith('/content/')) {
    navPath = '/content/nav';
  }
  const fragment = await loadFragment(navPath);

  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  // Nav sections: [0]=brand, [1]=utility, [2]=primary sections, [3]=tools
  const sections = [...nav.children];
  const brandSection = sections[0];
  const utilitySection = sections[1];
  const primarySection = sections[2];
  // sections[3] = tools (currently unused)

  // Build utility bar
  const utilityBar = buildUtilityBar(utilitySection);

  // Build brand
  if (brandSection) {
    brandSection.className = 'nav-brand';
    const brandLink = brandSection.querySelector('.button');
    if (brandLink) {
      brandLink.className = '';
      brandLink.closest('.button-container').className = '';
    }
  }

  // Build primary navigation
  const primaryNav = buildPrimaryNav(primarySection);

  // Build tools
  const navTools = document.createElement('div');
  navTools.className = 'nav-tools';
  navTools.append(buildSearchButton());

  // Build hamburger
  const hamburger = document.createElement('div');
  hamburger.className = 'nav-hamburger';
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
    <span class="nav-hamburger-icon"></span>
  </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav));

  // Assemble nav
  nav.textContent = '';
  nav.setAttribute('aria-expanded', 'false');

  const mainBar = document.createElement('div');
  mainBar.className = 'nav-main-bar';
  mainBar.append(hamburger, brandSection, primaryNav, navTools);

  nav.append(utilityBar, mainBar);

  // Close dropdowns on escape
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') {
      closeAllDropdowns(primaryNav);
      if (!isDesktop.matches) toggleMenu(nav, false);
    }
  });

  // Close dropdowns on click outside
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) closeAllDropdowns(primaryNav);
  });

  // Responsive handling
  toggleMenu(nav, isDesktop.matches);
  isDesktop.addEventListener('change', () => {
    toggleMenu(nav, isDesktop.matches);
    closeAllDropdowns(primaryNav);
  });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
