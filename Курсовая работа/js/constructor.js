/* constructor.js — конструктор кольца: расчёт цены за кольцо и за пару, событие ring_build */
(function () {
  'use strict';

  var form = document.getElementById('builder');
  if (!form) return;
  var prices = window.ogrankaPrices;
  var analytics = window.ogrankaAnalytics;
  var els = form.elements;

  var STONE_NAME = { none: 'без камня', cz: 'фианит', diamond: 'бриллиант 0,05 карата' };

  // Отметить радиокнопку по значению, если такое значение есть
  function setRadio(name, value) {
    var input = form.querySelector('input[name="' + name + '"][value="' + value + '"]');
    if (input) input.checked = true;
  }

  /* ---------- Параметры из ссылки: constructor.html?model=R-05&metal=silver&width=6&stone=none ---------- */
  var query = new URLSearchParams(window.location.search);
  ['metal', 'width', 'stone'].forEach(function (name) {
    if (query.get(name)) setRadio(name, query.get(name));
  });
  if (query.get('engraving') === '1') els.engraving.checked = true;
  var model = query.get('model');
  if (/^R-(0[1-9]|1[0-8])$/.test(model || '')) {
    var note = document.getElementById('model-note');
    note.textContent = 'Основа — модель ' + model + ' из каталога. Параметры можно изменить.';
    note.hidden = false;
  }

  /* ---------- Расчёт и вывод итога ---------- */
  function line(label, value) {
    var li = document.createElement('li');
    var left = document.createElement('span');
    var right = document.createElement('span');
    left.textContent = label;
    right.textContent = prices.rub(value);
    li.append(left, right);
    return li;
  }

  function render() {
    var build = {
      metal: els.metal.value,
      width: Number(els.width.value),
      stone: els.stone.value,
      engraving: els.engraving.checked
    };
    var p = prices.calc(build.metal, build.width, build.stone, build.engraving);
    var weightText = String(p.weight).replace('.', ',');

    document.getElementById('total-lines').replaceChildren(
      line('Металл: ' + weightText + ' г × ' + prices.rub(p.gramPrice), p.metalCost),
      line('Работа', p.work),
      line('Камень: ' + STONE_NAME[build.stone], p.stoneCost),
      line('Гравировка: ' + (build.engraving ? 'да' : 'нет'), p.engravingCost)
    );
    document.getElementById('price-ring').textContent = prices.rub(p.ring);
    document.getElementById('price-pair').textContent = prices.rub(p.pair);

    // Кнопка записи передаёт металл и ширину в форму заявки
    document.getElementById('builder-cta').href = 'contacts.html?lead_type=fitting&metal=' + build.metal + '&width_mm=' + build.width;

    build.ring = p.ring;
    build.pair = p.pair;
    try { sessionStorage.setItem('ogranka_build', JSON.stringify(build)); } catch (e) { /* не страшно */ }
    return build;
  }

  render();

  form.addEventListener('change', function () {
    var build = render();
    analytics.track('ring_build', {
      metal: build.metal,
      width_mm: build.width,
      stone: build.stone,
      total_price: build.ring // цена одного кольца, ₽
    });
  });
  form.addEventListener('submit', function (event) { event.preventDefault(); });
})();
