// Small, editable React components using the runtime and factual data in index.html.
export function createStorefrontEnhancements(React, content, asset) {
  const h = React.createElement;
  const localAsset = path => asset(path) || new URL(path.replace(/^\/+/, ''), import.meta.url).href;

  function useReducedMotion() {
    const [reduced, setReduced] = React.useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
    React.useEffect(() => {
      const query = matchMedia('(prefers-reduced-motion: reduce)');
      const update = () => setReduced(query.matches);
      query.addEventListener('change', update);
      return () => query.removeEventListener('change', update);
    }, []);
    return reduced;
  }

  function useInView(ref) {
    const [visible, setVisible] = React.useState(false);
    React.useEffect(() => {
      const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
      observer.observe(ref.current);
      return () => observer.disconnect();
    }, []);
    return visible;
  }

  function TeamGallery() {
    const reduced = useReducedMotion();
    const root = React.useRef(null);
    const visible = useInView(root);
    const [index, setIndex] = React.useState(0);
    const [paused, setPaused] = React.useState(false);
    const [hovered, setHovered] = React.useState(false);
    const [focused, setFocused] = React.useState(false);
    React.useEffect(() => {
      if (reduced || paused || hovered || focused || !visible) return;
      const timer = setInterval(() => {
        if (!document.hidden) setIndex(value => (value + 1) % content.gallery.length);
      }, 6500);
      return () => clearInterval(timer);
    }, [reduced, paused, hovered, focused, visible]);
    const select = next => { setPaused(true); setIndex(next); };
    return h('section', {
      className: 'gs-gallery', id: 'teams', ref: root, 'aria-labelledby': 'gs-gallery-title',
      onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false),
      onFocusCapture: () => setFocused(true),
      onBlurCapture: event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }
    },
    h('div', { className: 'gs-section-heading' },
      h('div', null, h('p', { className: 'gs-eyebrow' }, 'Команды в нашей экипировке'), h('h2', { id: 'gs-gallery-title' }, 'В игре.')),
      h('div', { className: 'gs-gallery-controls', 'aria-label': 'Управление фотографиями' },
        h('button', { type: 'button', onClick: () => select((index + 4) % 5), 'aria-label': 'Предыдущее фото' }, '←'),
        h('button', { type: 'button', className: 'gs-pause', disabled: reduced, 'aria-pressed': paused || reduced,
          onClick: () => setPaused(value => !value) }, reduced ? 'Без автосмены' : paused ? 'Продолжить' : 'Пауза'),
        h('button', { type: 'button', onClick: () => select((index + 1) % 5), 'aria-label': 'Следующее фото' }, '→'))),
    h('div', { className: 'gs-gallery-layout' },
      h('div', { className: 'gs-gallery-caption', 'aria-live': paused || reduced ? 'polite' : 'off', 'aria-atomic': true },
        h('span', { className: 'gs-photo-number' }, `0${index + 1}`, h('small', null, ' / 05')),
        h('h3', null, content.gallery[index].alt)),
      h('div', { className: 'gs-gallery-stage' }, content.gallery.map((photo, position) =>
        h('img', { key: photo.image, src: localAsset(photo.image), alt: photo.alt,
          className: position === index ? 'is-current' : '', 'aria-hidden': position !== index,
          loading: 'lazy', decoding: 'async' })))),
    h('div', { className: 'gs-gallery-dots', 'aria-label': 'Выбрать фото' }, content.gallery.map((photo, position) =>
      h('button', { key: photo.image, type: 'button', 'aria-label': `Фото ${position + 1}: ${photo.alt}`,
        'aria-pressed': position === index, onClick: () => select(position) }, h('span', null)))));
  }

  function ReviewColumns() {
    const reduced = useReducedMotion();
    const root = React.useRef(null);
    const visible = useInView(root);
    const dialog = React.useRef(null);
    const [selected, setSelected] = React.useState(null);
    const [paused, setPaused] = React.useState(false);
    const [hovered, setHovered] = React.useState(false);
    const [focused, setFocused] = React.useState(false);
    React.useEffect(() => {
      if (selected !== null && !dialog.current.open) dialog.current.showModal();
    }, [selected]);
    const close = () => { dialog.current.close(); setSelected(null); };
    const groups = [[0, 3], [1, 4], [2]];
    const cards = (ids, duplicate) => h('div', { className: 'gs-review-group', 'aria-hidden': duplicate || undefined },
      ids.map(id => {
        const review = content.reviews[id];
        return h('button', { type: 'button', className: 'gs-review-card', key: id, tabIndex: duplicate ? -1 : 0,
          'aria-label': `Полный отзыв: ${review.name}`, onClick: () => setSelected(id) },
          h('img', { src: localAsset(review.image), alt: '', loading: 'lazy', width: 40, height: 40 }),
          h('span', { className: 'gs-review-quote' }, review.text),
          h('span', { className: 'gs-review-name' }, review.name),
          h('span', { className: 'gs-review-more', 'aria-hidden': true }, 'Читать'));
      }));
    return h('section', { className: 'gs-reviews', ref: root, 'aria-labelledby': 'gs-reviews-title' },
      h('div', { className: 'gs-section-heading' },
        h('div', null, h('p', { className: 'gs-eyebrow' }, 'Об опыте сотрудничества'), h('h2', { id: 'gs-reviews-title' }, 'Слово командам.')),
        h('button', { type: 'button', className: 'gs-review-pause', disabled: reduced, 'aria-pressed': paused || reduced,
          onClick: () => setPaused(value => !value) }, reduced ? 'Без анимации' : paused ? 'Продолжить движение' : 'Приостановить')),
      h('div', { className: 'gs-review-window', 'data-paused': paused || reduced || hovered || focused || selected !== null || !visible,
        onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false),
        onFocusCapture: () => setFocused(true),
        onBlurCapture: event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }
      }, groups.map((ids, column) => h('div', { className: 'gs-review-column', key: column },
        h('div', { className: 'gs-review-track' }, cards(ids, false), cards(ids, true), cards(ids, true))))),
      h('dialog', { className: 'gs-review-dialog', ref: dialog, 'aria-labelledby': 'gs-full-review-title', onClose: () => setSelected(null),
        onClick: event => { if (event.target === event.currentTarget) { const box = event.currentTarget.getBoundingClientRect();
          if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) close(); } }
      }, h('button', { className: 'gs-review-close', type: 'button', onClick: close, 'aria-label': 'Закрыть отзыв', autoFocus: true }, '×'),
      selected !== null && h(React.Fragment, null,
        h('img', { src: localAsset(content.reviews[selected].image), alt: '', width: 64, height: 64 }),
        h('h3', { id: 'gs-full-review-title' }, content.reviews[selected].name),
        h('blockquote', null, content.reviews[selected].text),
        selected >= 2 && h('a', { href: localAsset(['/reference-site/img/reviews/mirazh.jpg', '/reference-site/img/reviews/neftekhimik.jpg', '/reference-site/img/reviews/ssh5.jpg'][selected - 2]), target: '_blank', rel: 'noopener' }, 'Посмотреть письмо команды ↗'))));
  }

  function ScrollReveals() {
    const reduced = useReducedMotion();
    React.useEffect(() => {
      const targets = document.querySelectorAll('.wholesale-intro, .volume-panel, .catalog-heading, .lab-title, .print-disclosure, .gs-section-heading, .route-title, .route-section li, .footer-call');
      if (reduced) { targets.forEach(node => node.classList.remove('gs-reveal')); return; }
      const observer = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-revealed'); observer.unobserve(entry.target); }
      }), { threshold: 0.12 });
      targets.forEach(node => {
        if (node.getBoundingClientRect().top > innerHeight) { node.classList.add('gs-reveal'); observer.observe(node); }
      });
      return () => { observer.disconnect(); targets.forEach(node => node.classList.remove('gs-reveal')); };
    }, [reduced]);
    return null;
  }
  return { TeamGallery, ReviewColumns, ScrollReveals };
}
