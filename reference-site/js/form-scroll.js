/* Мобильная версия: ссылки на #contacts прокручивают прямо к форме заявки,
   а не к началу блока контактов (на мобильном форма расположена ниже). */
(function () {
  var mq = window.matchMedia('(max-width: 880px)');
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href="#contacts"]');
    if (!a || !mq.matches) return;
    var form = document.getElementById('leadForm');
    if (!form) return;
    e.preventDefault();
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    form.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    if (history.replaceState) history.replaceState(null, '', '#contacts');
  });
})();
