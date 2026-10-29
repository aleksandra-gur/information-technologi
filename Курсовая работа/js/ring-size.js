/* ring-size.js — калькулятор размера кольца: по длине нити или по диаметру своего кольца */
(function () {
  'use strict';

  var form = document.getElementById('size-calc');
  if (!form) return;
  var threadBox = document.getElementById('field-thread');
  var diameterBox = document.getElementById('field-diameter');
  var threadInput = document.getElementById('thread-length');
  var diameterInput = document.getElementById('ring-diameter');
  var result = document.getElementById('size-result');
  var cta = document.getElementById('size-cta');
  var analytics = window.ogrankaAnalytics;

  function method() {
    return form.querySelector('input[name="method"]:checked').value;
  }

  // Переключение способа: показываем нужное поле
  form.addEventListener('change', function (event) {
    if (event.target.name !== 'method') return;
    var isThread = method() === 'thread';
    threadBox.hidden = !isThread;
    diameterBox.hidden = isThread;
    result.hidden = true;
  });

  // «55,5» → 55.5; пусто или текст → NaN
  function readNumber(input) {
    return parseFloat(input.value.replace(',', '.'));
  }

  function roundHalf(value) {
    return Math.round(value * 2) / 2; // округление до 0,5
  }

  function show(html, isWarning) {
    result.innerHTML = html;
    result.classList.toggle('is-warning', isWarning);
    result.hidden = false;
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var m = method();
    var input = m === 'thread' ? threadInput : diameterInput;
    var value = readNumber(input);

    if (!(value > 0)) {
      input.setAttribute('aria-invalid', 'true');
      show(m === 'thread' ? 'Введите длину нити в миллиметрах, например 55.' : 'Введите диаметр кольца в миллиметрах, например 17,5.', true);
      input.focus();
      return;
    }
    input.removeAttribute('aria-invalid');

    // Размер = длина / 3,14 или размер = диаметр
    var size = roundHalf(m === 'thread' ? value / 3.14 : value);
    var sizeText = String(size).replace('.', ',');
    analytics.track('ring_size_calc', { method: m, ring_size: size });

    if (size < 14 || size > 23) {
      show('Получился размер ' + sizeText + '. Мы делаем кольца размеров от 14 до 23 — проверьте измерение или определим размер на примерке.', true);
      return;
    }

    // Результат передаётся в поле ring_size формы заявки
    var link = 'contacts.html?lead_type=fitting&ring_size=' + size;
    try { sessionStorage.setItem('ogranka_ring_size', String(size)); } catch (e) { /* передадим через ссылку */ }
    cta.href = link;
    show('Ваш размер: <strong>' + sizeText + '</strong><br><a href="' + link + '">Записаться на примерку с размером ' + sizeText + '</a>', false);
  });
})();
