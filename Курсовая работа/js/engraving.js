/* engraving.js — предпросмотр гравировки: текст до 20 символов поверх изображения кольца */
(function () {
  'use strict';

  var form = document.getElementById('engrave-form');
  if (!form) return;
  var input = document.getElementById('engrave-text');
  var preview = document.getElementById('engrave-preview');
  var counter = document.getElementById('engrave-counter');
  var analytics = window.ogrankaAnalytics;
  var MAX = 20;
  var timer = null;

  function selectedFont() {
    return form.querySelector('input[name="font"]:checked');
  }

  // Сам текст в GA4 не передаём: в нём могут быть имена. Только шрифт и длина
  function send() {
    analytics.track('engraving_preview', { font_name: selectedFont().value, text_length: input.value.length });
  }

  function update() {
    var text = input.value.slice(0, MAX);
    preview.textContent = text;
    counter.textContent = text.length + ' из ' + MAX + ' символов';
  }

  input.addEventListener('input', function () {
    update();
    clearTimeout(timer);
    timer = setTimeout(send, 800); // одно событие, когда посетитель перестал печатать
  });

  form.addEventListener('change', function (event) {
    if (event.target.name !== 'font') return;
    preview.style.fontFamily = event.target.dataset.family;
    send();
  });

  form.addEventListener('submit', function (event) { event.preventDefault(); });
  update();
})();
