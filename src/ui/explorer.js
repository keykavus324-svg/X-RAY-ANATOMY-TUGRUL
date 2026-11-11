import { STRUCTURES, LAYERS } from '../data/structures.js';

/** Anatomy library: searchable list + detail card. */
export function initExplorer({ onHighlight, onHover, t, getLang }) {
  const listEl = document.getElementById('structList');
  const cardEl = document.getElementById('structCard');
  const searchEl = document.getElementById('search');
  const filterEl = document.getElementById('layerFilter');
  const countEl = document.getElementById('structCount');

  let query = '';
  let layer = 'all';
  let activeId = null;

  const text = (s) => s[getLang()] || s.tr;

  function matches(s) {
    if (layer !== 'all' && s.layer !== layer) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    const lang = getLang();
    return (
      s.id.includes(q)
      || s.latin.toLowerCase().includes(q)
      || s[lang].name.toLowerCase().includes(q)
      || s[lang].desc.toLowerCase().includes(q)
      || s.tr.name.toLowerCase().includes(q)
      || s.en.name.toLowerCase().includes(q)
    );
  }

  function renderList() {
    const items = STRUCTURES.filter(matches);
    listEl.innerHTML = '';
    for (const s of items) {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.id = s.id;
      btn.className = s.id === activeId ? 'on' : '';
      btn.innerHTML = `<i style="--c:${LAYERS[s.layer].color}"></i><span>${text(s).name}</span>`;
      btn.addEventListener('click', () => select(s.id));
      btn.addEventListener('mouseenter', () => onHover?.(s.id));
      btn.addEventListener('mouseleave', () => onHover?.(null));
      li.appendChild(btn);
      listEl.appendChild(li);
    }
    if (countEl) countEl.textContent = t('anatomy.count', { n: items.length });
    if (!items.length) {
      listEl.innerHTML = `<li class="no-hits">${getLang() === 'tr' ? 'Sonuç yok.' : 'No matches.'}</li>`;
    }
  }

  function renderCard() {
    const s = STRUCTURES.find((x) => x.id === activeId);
    if (!s) {
      cardEl.innerHTML = `<p class="empty">${t('anatomy.empty')}</p>`;
      return;
    }
    const copy = text(s);
    cardEl.innerHTML = `
      <p class="latin">${s.latin}</p>
      <h3>${copy.name}</h3>
      <p class="body">${copy.desc}</p>
      <div class="meta">
        <span>${t('anatomy.layer')} · ${LAYERS[s.layer][getLang()]}</span>
        <span>${s.id}</span>
      </div>
      <button class="show-btn" type="button">${t('anatomy.showIn3d')}</button>`;
    cardEl.querySelector('.show-btn')?.addEventListener('click', () => onHighlight?.(s.id));
  }

  function select(id) {
    activeId = id;
    renderList();
    renderCard();
    onHighlight?.(id);
  }

  searchEl?.addEventListener('input', () => {
    query = searchEl.value.trim();
    renderList();
  });
  filterEl?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-filter]');
    if (!btn) return;
    layer = btn.dataset.filter;
    filterEl.querySelectorAll('[data-filter]').forEach((b) => b.classList.toggle('on', b === btn));
    renderList();
  });

  function refresh() {
    renderList();
    renderCard();
    if (searchEl) searchEl.setAttribute('placeholder', t('search.ph'));
    filterEl?.querySelectorAll('[data-filter]').forEach((b) => {
      b.textContent = t(`filter.${b.dataset.filter}`);
    });
  }

  refresh();
  return { refresh, select, clear: () => { activeId = null; renderList(); renderCard(); } };
}
