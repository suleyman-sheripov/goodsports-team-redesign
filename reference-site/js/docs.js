/* Разрешительные документы: просмотр PDF во всплывающем окне */
(function () {
  var btns = document.querySelectorAll('.doc-thumb[data-doc]');
  if (!btns.length) return;
  var last = null;
  var docs = [
    { t: 'FN — свидетельство на товарный знак', u: 'docs/fn-trademark-certificate.pdf', i: 'img/docs/fn-full.jpg' },
    { t: 'KELME — разрешительное письмо', u: 'docs/kelme-permission-letter.pdf', i: 'img/docs/kelme-full.jpg' }
  ];
  var modal = document.createElement('div');
  modal.className = 'dc-modal';
  modal.hidden = true;
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.innerHTML =
    '<div class="dc-box"><button type="button" class="dc-close" aria-label="Закрыть">&times;</button>' +
    '<div class="dc-tabs" role="tablist"></div><div class="dc-scroll"><img class="dc-frame" alt="Документ" /></div>' +
    '<a class="dc-open" target="_blank" rel="noopener">Открыть PDF</a></div>';
  document.body.appendChild(modal);
  var tabs = modal.querySelector('.dc-tabs');
  var frame = modal.querySelector('.dc-frame');
  var link = modal.querySelector('.dc-open');
  docs.forEach(function (d, i) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'dc-tab'; b.setAttribute('role', 'tab'); b.textContent = d.t;
    b.addEventListener('click', function () { show(i); });
    tabs.appendChild(b);
  });
  function show(i) {
    Array.prototype.forEach.call(tabs.children, function (b, j) { b.setAttribute('aria-selected', j === i ? 'true' : 'false'); });
    frame.src = docs[i].i; frame.alt = docs[i].t;
    link.href = docs[i].u;
  }
  function open(i) { show(i); modal.hidden = false; document.documentElement.style.overflow = 'hidden'; modal.querySelector('.dc-close').focus(); }
  function close() { modal.hidden = true; frame.removeAttribute('src'); document.documentElement.style.overflow = ''; if (last) last.focus(); }
  btns.forEach(function (b) { b.addEventListener('click', function () { last = b; open(+b.getAttribute('data-doc')); }); });
  modal.addEventListener('click', function (e) { if (e.target === modal || e.target.classList.contains('dc-close')) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) close(); });
})();
