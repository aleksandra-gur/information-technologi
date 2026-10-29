/* catalog.js — каталог rings.html: фильтр, карточка модели, фото крупно */
(function () {
  'use strict';

  var form = document.getElementById('ring-filter');
  if (!form) return;
  var cards = document.querySelectorAll('.ring-card');
  var count = document.getElementById('filter-count');
  var empty = document.getElementById('ring-empty');
  var analytics = window.ogrankaAnalytics;

  /* ---------- Фильтр: металл, стиль, ширина ---------- */
  function current() {
    return { metal: form.elements.metal.value, style: form.elements.style.value, width: form.elements.width.value };
  }

  function applyFilter() {
    var f = current();
    var shown = 0;
    cards.forEach(function (card) {
      var visible = (f.metal === 'all' || card.dataset.metal === f.metal) &&
        (f.style === 'all' || card.dataset.style === f.style) &&
        (f.width === 'all' || card.dataset.width === f.width);
      card.hidden = !visible;
      if (visible) shown += 1;
    });
    count.textContent = 'Показано моделей: ' + shown;
    empty.hidden = shown > 0;
  }

  function sendFilter() {
    var f = current();
    analytics.track('ring_filter', { metal: f.metal, style: f.style, width_mm: f.width });
  }

  form.addEventListener('change', function () {
    applyFilter();
    sendFilter();
  });
  form.addEventListener('reset', function () {
    setTimeout(function () { applyFilter(); sendFilter(); }, 0); // значения сбрасываются после события reset
  });
  form.addEventListener('submit', function (event) { event.preventDefault(); });

  /* ---------- Подробнее о модели: открытие карточки = view_item ---------- */
  function openDetails(btn, send) {
    var details = document.getElementById(btn.getAttribute('aria-controls'));
    var isOpen = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!isOpen));
    btn.textContent = isOpen ? 'Подробнее о модели' : 'Скрыть подробности';
    details.hidden = isOpen;
    if (!isOpen && send) analytics.viewItem(btn);
  }

  document.querySelectorAll('.details-btn').forEach(function (btn) {
    btn.addEventListener('click', function () { openDetails(btn, true); });
  });

  // Переход с главной по ссылке rings.html#R-06: карточка уже открыта (view_item отправлен на главной)
  var target = window.location.hash && document.getElementById(window.location.hash.slice(1));
  if (target && target.classList.contains('ring-card')) {
    openDetails(target.querySelector('.details-btn'), false);
    target.scrollIntoView();
  }

  /* ---------- Фото крупно (gallery_view отправляет analytics.js по data-event) ---------- */
  var lightbox = document.getElementById('lightbox');
  var bigImg = document.getElementById('lightbox-img');
  var caption = document.getElementById('lightbox-caption');
  document.querySelectorAll('.photo-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var small = btn.querySelector('img');
      bigImg.src = btn.dataset.full;
      bigImg.alt = small.alt;
      caption.textContent = small.alt;
      if (typeof lightbox.showModal === 'function') lightbox.showModal();
      else window.open(btn.dataset.full, '_blank');
    });
  });
  document.getElementById('lightbox-close').addEventListener('click', function () { lightbox.close(); });
  lightbox.addEventListener('click', function (event) { if (event.target === lightbox) lightbox.close(); });
})();
