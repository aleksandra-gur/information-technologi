/* main.js — общий код для всех страниц: меню, UTM-метки, промокод, номер заявки */
(function () {
  'use strict';

  /* ---------- Мобильное меню ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
      toggle.querySelector('.visually-hidden').textContent = isOpen ? 'Закрыть меню' : 'Открыть меню';
    });
  }

  /* ---------- UTM-метки: запоминаем источник на время визита ---------- */
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  var query = new URLSearchParams(window.location.search);
  var hasUtm = UTM_KEYS.some(function (key) { return query.get(key); });
  if (hasUtm) {
    var utm = {};
    UTM_KEYS.forEach(function (key) { utm[key] = (query.get(key) || '').slice(0, 200); });
    try {
      sessionStorage.setItem('ogranka_utm', JSON.stringify(utm)); // новые метки заменяют старые
    } catch (e) { /* sessionStorage недоступен — метки прочитает форма из адреса */ }
  }

  /* ---------- Копирование промокода ---------- */
  var copyBtn = document.getElementById('promo-copy');
  if (copyBtn) {
    var status = document.getElementById('promo-status');
    copyBtn.addEventListener('click', function () {
      var code = copyBtn.dataset.promoCode;
      var done = function () { status.textContent = 'Промокод ' + code + ' скопирован'; };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(code).then(done, function () { status.textContent = 'Скопируйте вручную: ' + code; });
      } else {
        var area = document.createElement('textarea');
        area.value = code;
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        area.remove();
        done();
      }
    });
  }

  /* ---------- Номер заявки на странице «Спасибо» ---------- */
  var idBox = document.getElementById('request-id');
  if (idBox) {
    var savedId = null;
    try { savedId = sessionStorage.getItem('ogranka_request_id'); } catch (e) { savedId = null; }
    if (savedId) {
      idBox.textContent = savedId;
    } else {
      idBox.textContent = 'Номер не найден';
      document.getElementById('request-note').innerHTML = 'Номер появляется после отправки формы на странице <a href="contacts.html">«Запись и контакты»</a>.';
    }
  }
})();
