/* analytics.js — все вызовы gtag('event', ...) сайта «Огранка».
   Кнопки и ссылки описываются атрибутами data-event и data-* в HTML,
   а этот файл находит их и отправляет событие в Google Analytics 4.
   Другие скрипты (конструктор, форма, калькулятор) вызывают window.ogrankaAnalytics.track(). */
(function () {
  'use strict';

  // Включите (true), если автоматическое событие form_submit не приходит в DebugView
  var MANUAL_FORM_SUBMIT = false;

  // Режим отладки выключен. Для снимков DebugView откройте сайт с ?debug_mode=1 —
  // до закрытия вкладки к каждому событию добавится debug_mode: true
  var debug = false;
  try {
    if (/[?&]debug_mode=1\b/.test(window.location.search)) sessionStorage.setItem('ogranka_debug', '1');
    debug = sessionStorage.getItem('ogranka_debug') === '1';
  } catch (e) { debug = false; }

  // Параметры, которые разрешено брать из data-атрибутов (имя в snake_case)
  var ALLOWED_PARAMS = [
    'button_name', 'page_section', 'contact_type', 'messenger', 'network',
    'promo_code', 'item_id', 'metal', 'style', 'width_mm', 'stone'
  ];

  // Отправить событие в GA4. callback вызывается после отправки (или через 1,2 с)
  function track(eventName, params, callback) {
    var data = {};
    Object.keys(params || {}).forEach(function (key) {
      var value = params[key];
      if (value === undefined || value === null || value === '') return;
      if (typeof value === 'number' || Array.isArray(value)) data[key] = value; // числа и items — как есть
      else data[key] = String(value).slice(0, 100); // значение не длиннее 100 символов
    });
    if (debug) data.debug_mode = true;

    if (typeof callback === 'function') {
      var called = false;
      var finish = function () {
        if (!called) { called = true; callback(); }
      };
      data.event_callback = finish;
      setTimeout(finish, 1200); // если GA заблокирован, всё равно продолжаем
    }

    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, data);
    } else if (data.event_callback) {
      data.event_callback();
    }
  }

  // data-button-name="hero_fitting" → { button_name: "hero_fitting" }
  function paramsFromElement(el) {
    var params = {};
    Object.keys(el.dataset).forEach(function (key) {
      var snake = key.replace(/[A-Z]/g, function (letter) { return '_' + letter.toLowerCase(); });
      if (ALLOWED_PARAMS.indexOf(snake) !== -1) params[snake] = el.dataset[key];
    });
    return params;
  }

  // view_item: рекомендованное событие GA4 с массивом items
  function viewItem(el) {
    var price = Number(el.dataset.price) || 0;
    track('view_item', {
      currency: 'RUB',
      value: price,
      items: [{
        item_id: el.dataset.itemId,
        item_name: el.dataset.itemName,
        item_category: el.dataset.itemCategory,
        item_variant: el.dataset.itemVariant,
        price: price,
        quantity: 1
      }]
    });
  }

  // Один обработчик кликов на весь документ: работает и для кнопок, созданных скриптом
  document.addEventListener('click', function (event) {
    var el = event.target.closest('[data-event]');
    if (!el || el.disabled) return;
    if (el.dataset.event === 'view_item') viewItem(el);
    else track(el.dataset.event, paramsFromElement(el));
  });

  // Событие открытия страницы: <body data-page-event="workshop_view" data-page-section="...">
  var pageEvent = document.body.dataset.pageEvent;
  if (pageEvent) track(pageEvent, { page_section: document.body.dataset.pageSection });

  // form_submit вручную — только если автоматический не работает
  function trackFormSubmit(formId) {
    if (MANUAL_FORM_SUBMIT) track('form_submit', { form_id: formId });
  }

  // Доступ для других скриптов: catalog.js, constructor.js, engraving.js, ring-size.js, form.js
  window.ogrankaAnalytics = { track: track, viewItem: viewItem, trackFormSubmit: trackFormSubmit };
})();
