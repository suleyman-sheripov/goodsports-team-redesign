/* Предпросмотр отзывов: клик по карточке открывает скан письма */
(function () {
  var cards = document.querySelectorAll('.review[data-review]');
  if (!cards.length) return;
  var modal = document.createElement('div');
  modal.className = 'rv-modal';
  modal.hidden = true;
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.innerHTML =
    '<div class="rv-box"><button type="button" class="rv-close" aria-label="Закрыть">&times;</button><img alt="Скан отзыва" /><a class="rv-pdf" target="_blank" rel="noopener">Открыть PDF</a></div>';
  document.body.appendChild(modal);
  var img = modal.querySelector('img');
  var pdf = modal.querySelector('.rv-pdf');
  var last = null;

  function open(card) {
    var id = card.getAttribute('data-review');
    img.src = 'img/reviews/' + id + '.jpg';
    pdf.href = 'docs/reviews/' + id + '.pdf';
    modal.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    last = card;
    modal.querySelector('.rv-close').focus();
  }
  function close() {
    modal.hidden = true;
    img.removeAttribute('src');
    document.documentElement.style.overflow = '';
    if (last) last.focus();
  }
  cards.forEach(function (c) {
    c.addEventListener('click', function () { open(c); });
    c.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(c); }
    });
  });
  modal.addEventListener('click', function (e) {
    if (e.target === modal || e.target.classList.contains('rv-close')) close();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modal.hidden) close();
  });
})();
