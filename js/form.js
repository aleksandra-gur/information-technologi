/* form.js — форма заявки на contacts.html: проверка полей, UTM-метки, отправка в Apps Script */
(function () {
  'use strict';

  // Адрес веб-приложения Apps Script (Развернуть → Веб-приложение → URL). Пусто — приёмник ещё не подключён
  var ENDPOINT = 'https://script.google.com/macros/s/AKfycby0ztH3QwfkSjsrsbbj0VkKqG1pRKxUOKL0NwSoLBm8cDF7f9dha3YSCHpZ3qDDH_b_IQ/exec';

  var form = document.getElementById('lead-form');
  if (!form) return;
  var els = form.elements; // поля формы по атрибуту name

  var LEAD_TYPES = ['fitting', 'workshop'];
  var METALS = ['silver', 'gold585', 'unknown'];
  var WIDTHS = ['2', '3', '4', '5', '6'];
  var submitBtn = document.getElementById('f-submit');
  var statusBox = document.getElementById('form-status');
  var widthBox = document.getElementById('field-width');
  var analytics = window.ogrankaAnalytics;
  var prices = window.ogrankaPrices;

  function storage(key) {
    try { return sessionStorage.getItem(key); } catch (e) { return null; }
  }

  /* ---------- Номер заявки: REQ- + UUID ---------- */
  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = crypto.getRandomValues(new Uint8Array(1))[0] % 16;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }
  els.request_id.value = 'REQ-' + uuid();

  /* ---------- UTM-метки: из адреса страницы или из sessionStorage ---------- */
  function readUtm() {
    var saved = {};
    try { saved = JSON.parse(storage('ogranka_utm')) || {}; } catch (e) { saved = {}; }
    var query = new URLSearchParams(window.location.search);
    function pick(key) { return (query.get(key) || saved[key] || '').slice(0, 200); }
    return {
      utm_source: pick('utm_source') || 'direct',
      utm_medium: pick('utm_medium') || 'none',
      utm_campaign: pick('utm_campaign') || 'not_set',
      utm_content: pick('utm_content') || 'not_set'
    };
  }
  var utm = readUtm();
  Object.keys(utm).forEach(function (key) { els[key].value = utm[key]; });

  /* ---------- Параметры из конструктора и калькулятора размера ---------- */
  // contacts.html?lead_type=fitting&metal=gold585&width_mm=3&ring_size=17.5
  var params = new URLSearchParams(window.location.search);
  function prefill(field, value) {
    var option = value && els[field].querySelector('option[value="' + value + '"]');
    if (option) els[field].value = value;
  }
  prefill('lead_type', params.get('lead_type'));
  prefill('metal', params.get('metal'));
  prefill('width_mm', params.get('width_mm'));
  prefill('ring_size', params.get('ring_size') || storage('ogranka_ring_size'));

  // Мастер-класс: серебро включено, ширину не выбирают
  function syncLeadType() {
    var isWorkshop = els.lead_type.value === 'workshop';
    widthBox.hidden = isWorkshop;
    if (isWorkshop) {
      els.width_mm.value = '';
      if (els.metal.value === 'unknown') els.metal.value = 'silver';
    }
  }
  els.lead_type.addEventListener('change', syncLeadType);
  syncLeadType();

  /* ---------- Проверка полей ---------- */
  // +7 (900) 123-45-67, 8 900 123 45 67, 9001234567 → +79001234567
  function normalizePhone(value) {
    var digits = value.replace(/\D/g, '');
    if (digits.length === 11 && (digits[0] === '7' || digits[0] === '8')) return '+7' + digits.slice(1);
    if (digits.length === 10) return '+7' + digits;
    return value.trim();
  }

  function validate() {
    var errors = [];
    var name = els.name.value.trim();
    var phone = normalizePhone(els.phone.value);
    var email = els.email.value.trim();
    var size = els.ring_size.value;

    if (LEAD_TYPES.indexOf(els.lead_type.value) === -1) errors.push({ field: 'lead_type', type: 'required', text: 'Выберите примерку или мастер-класс' });

    if (!name) errors.push({ field: 'name', type: 'required', text: 'Введите имя' });
    else if (name.length < 2 || name.length > 60) errors.push({ field: 'name', type: 'length', text: 'Имя — от 2 до 60 символов' });

    if (!els.phone.value.trim()) errors.push({ field: 'phone', type: 'required', text: 'Введите номер телефона' });
    else if (!/^\+7\d{10}$/.test(phone)) errors.push({ field: 'phone', type: 'format', text: 'Номер в формате +7 и 10 цифр, например +7 900 123-45-67' });

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.push({ field: 'email', type: 'format', text: 'Проверьте e-mail: пример — name@mail.ru' });

    if (METALS.indexOf(els.metal.value) === -1) errors.push({ field: 'metal', type: 'required', text: 'Выберите металл' });
    if (els.width_mm.value && WIDTHS.indexOf(els.width_mm.value) === -1) errors.push({ field: 'width_mm', type: 'format', text: 'Ширина — от 2 до 6 мм' });
    if (size && !(Number(size) >= 14 && Number(size) <= 23 && Number(size) * 2 % 1 === 0)) errors.push({ field: 'ring_size', type: 'format', text: 'Размер — от 14 до 23 с шагом 0,5' });
    if (!els.consent.checked) errors.push({ field: 'consent', type: 'consent', text: 'Без согласия на обработку данных мы не сможем принять заявку' });

    return errors;
  }

  function showError(field, text) {
    var box = document.getElementById('err-' + field);
    els[field].setAttribute('aria-invalid', 'true');
    box.textContent = text;
    box.hidden = false;
  }

  function clearError(field) {
    els[field].removeAttribute('aria-invalid');
    document.getElementById('err-' + field).hidden = true;
  }

  ['lead_type', 'name', 'phone', 'email', 'metal', 'width_mm', 'ring_size', 'consent'].forEach(function (field) {
    var eventName = els[field].tagName === 'SELECT' || els[field].type === 'checkbox' ? 'change' : 'input';
    els[field].addEventListener(eventName, function () { clearError(field); });
  });

  function setSending(isSending) {
    submitBtn.disabled = isSending;
    submitBtn.textContent = isSending ? 'Отправляем…' : 'Отправить заявку';
  }

  function serverFail(message) {
    statusBox.textContent = message;
    statusBox.hidden = false;
    analytics.track('form_error', { field_name: 'form', error_type: 'server' });
    setSending(false);
  }

  // Ценность заявки для GA4: мастер-класс — цена за человека;
  // примерка — цена пары из конструктора или базовая цена пары по металлу и ширине
  function leadValue(data) {
    if (data.lead_type === 'workshop') return prices.WORKSHOP_PERSON;
    var build = null;
    try { build = JSON.parse(storage('ogranka_build')); } catch (e) { build = null; }
    if (build && build.metal === data.metal && String(build.width) === data.width_mm) return build.pair;
    if (data.metal !== 'unknown' && data.width_mm) return prices.calc(data.metal, Number(data.width_mm), 'none', false).pair;
    return 0;
  }

  /* ---------- Отправка ---------- */
  form.addEventListener('submit', function (event) {
    event.preventDefault(); // без перезагрузки страницы
    analytics.trackFormSubmit(form.id);
    statusBox.hidden = true;

    var errors = validate();
    if (errors.length) {
      errors.forEach(function (err) {
        showError(err.field, err.text);
        analytics.track('form_error', { field_name: err.field, error_type: err.type });
      });
      els[errors[0].field].focus();
      return;
    }

    var data = {
      request_id: els.request_id.value,
      name: els.name.value.trim(),
      phone: normalizePhone(els.phone.value),
      email: els.email.value.trim(),
      lead_type: els.lead_type.value,
      metal: els.metal.value,
      width_mm: els.lead_type.value === 'workshop' ? '' : els.width_mm.value,
      ring_size: els.ring_size.value,
      utm_source: els.utm_source.value,
      utm_medium: els.utm_medium.value,
      utm_campaign: els.utm_campaign.value,
      utm_content: els.utm_content.value,
      consent: true
    };

    if (!ENDPOINT) {
      serverFail('Приём заявок ещё не подключён. Позвоните нам: +7 (900) 525-25-52.');
      return;
    }

    setSending(true);
    // text/plain — «простой» запрос, Apps Script принимает его без CORS-ошибки
    fetch(ENDPOINT, { method: 'POST', body: JSON.stringify(data) })
      .then(function (response) { return response.json(); })
      .then(function (answer) {
        if (answer.ok === true) {
          try { sessionStorage.setItem('ogranka_request_id', data.request_id); } catch (e) { /* не страшно */ }
          analytics.track('generate_lead', {
            lead_type: data.lead_type,
            lead_metal: data.metal,
            value: leadValue(data),
            currency: 'RUB'
          }, function () {
            window.location.href = 'thanks.html';
          });
        } else {
          serverFail('Заявка не отправлена (' + (answer.error || 'ошибка') + '). Проверьте поля или позвоните: +7 (900) 525-25-52.');
        }
      })
      .catch(function () {
        serverFail('Не удалось связаться с сервером. Проверьте интернет и попробуйте ещё раз или позвоните: +7 (900) 525-25-52.');
      });
  });
})();
