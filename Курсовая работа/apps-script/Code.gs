/**
 * Приёмник заявок «Огранка» — веб-приложение Google Apps Script.
 * Принимает заявку с формы сайта (POST, JSON) и дописывает строку в лист leads
 * таблицы «Ogranka — Leads». Ответ: {"ok": true} или {"ok": false, "error": "..."}.
 *
 * Установка (подробно — docs/setup.md, шаг 3):
 * 1. Таблица «Ogranka — Leads» → Расширения → Apps Script → вставить этот код.
 * 2. SPREADSHEET_ID можно не вписывать: без него берётся таблица, к которой привязан скрипт.
 * 3. Запустить setupSheet() один раз — создаст заголовки, списки и подсветку.
 * 4. Развернуть → Новое развёртывание → Веб-приложение:
 *    «Выполнять как: я», «Доступ: все». Полученный URL вставить в js/form.js (ENDPOINT).
 */

// ID таблицы «Ogranka — Leads» (проект Apps Script отдельный, не привязан к таблице)
const SPREADSHEET_ID = '1gGxW4NPZy1Jje3vyyhhl-iZ9qCr3vMAf8Kw2TtwhhpU';
const SHEET_NAME = 'leads';

const HEADERS = ['request_id', 'created_at', 'name', 'phone', 'email', 'lead_type', 'metal', 'width_mm',
  'ring_size', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'status'];
const LEAD_TYPES = ['fitting', 'workshop'];
const METALS = ['silver', 'gold585', 'unknown'];
const STATUSES = ['new', 'contacted', 'fitting', 'prepaid', 'issued', 'lost'];
const MAX_LENGTH = 200;

/* ---------------- Приём заявки ---------------- */

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); // две заявки одновременно не запишутся в одну строку

    const data = parseRequest_(e);
    const error = validate_(data);
    if (error) return json_({ ok: false, error: error });

    const sheet = getSheet_();
    if (isDuplicate_(sheet, data.request_id)) {
      return json_({ ok: false, error: 'duplicate_request_id' });
    }

    sheet.appendRow([
      data.request_id,
      new Date(),                                      // created_at ставит приёмник
      data.name,
      "'" + data.phone,                                // апостроф: «+7…» остаётся текстом, а не числом
      data.email,
      data.lead_type,
      data.metal,
      data.width_mm === '' ? '' : Number(data.width_mm),
      data.ring_size === '' ? '' : Number(data.ring_size),
      data.utm_source,
      data.utm_medium,
      data.utm_campaign,
      data.utm_content,
      'new'                                            // status из браузера игнорируется
    ]);
    return json_({ ok: true, request_id: data.request_id });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'server_error' });
  } finally {
    lock.releaseLock();
  }
}

// Проверка, что приёмник работает: открыть URL веб-приложения в браузере
function doGet() {
  return json_({ ok: true, service: 'ogranka-leads' });
}

/* ---------------- Вспомогательные функции ---------------- */

// Тело запроса: JSON (основной вариант) или обычные поля формы
function parseRequest_(e) {
  let raw = {};
  if (e && e.postData && e.postData.contents) {
    try {
      raw = JSON.parse(e.postData.contents);
    } catch (err) {
      raw = e.parameter || {};
    }
  } else if (e && e.parameter) {
    raw = e.parameter;
  }

  const text = function (key) {
    return raw[key] === undefined || raw[key] === null ? '' : String(raw[key]).trim();
  };

  const data = {
    request_id: text('request_id'),
    name: text('name'),
    phone: text('phone'),
    email: text('email'),
    lead_type: text('lead_type'),
    metal: text('metal'),
    width_mm: text('width_mm'),
    ring_size: text('ring_size').replace(',', '.'),
    utm_source: text('utm_source') || 'direct',
    utm_medium: text('utm_medium') || 'none',
    utm_campaign: text('utm_campaign') || 'not_set',
    utm_content: text('utm_content') || 'not_set',
    consent: raw.consent === true || raw.consent === 'true' || raw.consent === 'on'
  };
  if (data.lead_type === 'workshop') data.width_mm = ''; // для мастер-класса ширина пустая
  return data;
}

// Возвращает код ошибки или null, если заявка правильная
function validate_(d) {
  const fields = ['request_id', 'name', 'phone', 'email', 'lead_type', 'metal', 'width_mm', 'ring_size',
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
  for (let i = 0; i < fields.length; i++) {
    if (d[fields[i]].length > MAX_LENGTH) return fields[i] + '_too_long';
  }
  if (!d.request_id) return 'request_id_required';
  if (!/^REQ-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(d.request_id)) return 'request_id_format';
  if (!d.name) return 'name_required';
  if (d.name.length < 2 || d.name.length > 60) return 'name_length';
  if (!d.phone) return 'phone_required';
  if (!/^\+7\d{10}$/.test(d.phone)) return 'phone_format';
  if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) return 'email_format';
  if (LEAD_TYPES.indexOf(d.lead_type) === -1) return 'lead_type_invalid';
  if (METALS.indexOf(d.metal) === -1) return 'metal_invalid';
  if (d.width_mm !== '' && !/^[2-6]$/.test(d.width_mm)) return 'width_mm_invalid';
  if (d.ring_size !== '') {
    const size = Number(d.ring_size);
    if (!(size >= 14 && size <= 23) || (size * 2) % 1 !== 0) return 'ring_size_invalid';
  }
  if (!d.consent) return 'consent_required';
  return null;
}

function getSheet_() {
  const sheet = openSpreadsheet_().getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('Нет листа ' + SHEET_NAME + ': запустите setupSheet()');
  return sheet;
}

// Есть ли уже строка с таким request_id (ищем в столбце A целую ячейку)
function isDuplicate_(sheet, requestId) {
  const found = sheet.getRange('A:A').createTextFinder(requestId).matchEntireCell(true).findNext();
  return found !== null;
}

function openSpreadsheet_() {
  return SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* ---------------- Настройка таблицы (запустить один раз вручную) ---------------- */

function setupSheet() {
  const ss = openSpreadsheet_();
  ss.setSpreadsheetTimeZone('Europe/Moscow');
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  const rows = 1000;

  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold').setBackground('#F7F3EC');
  sheet.setFrozenRows(1);

  // Текстовый формат: «+79001234567» не превратится в число, «=...» — в формулу
  sheet.getRange(2, 1, rows, HEADERS.length).setNumberFormat('@');
  sheet.getRange(2, 2, rows, 1).setNumberFormat('yyyy-mm-dd hh:mm:ss'); // B created_at
  sheet.getRange(2, 8, rows, 1).setNumberFormat('0');                   // H width_mm
  sheet.getRange(2, 9, rows, 1).setNumberFormat('0.0');                 // I ring_size

  // Выпадающие списки: другое значение отклоняется
  const list = function (values) {
    return SpreadsheetApp.newDataValidation().requireValueInList(values, true).setAllowInvalid(false).build();
  };
  sheet.getRange(2, 6, rows, 1).setDataValidation(list(LEAD_TYPES));  // F lead_type
  sheet.getRange(2, 7, rows, 1).setDataValidation(list(METALS));      // G metal
  sheet.getRange(2, 14, rows, 1).setDataValidation(list(STATUSES));   // N status

  // Числа: ширина 2–6, размер 14–23
  sheet.getRange(2, 8, rows, 1).setDataValidation(SpreadsheetApp.newDataValidation()
    .requireNumberBetween(2, 6).setAllowInvalid(false).build());
  sheet.getRange(2, 9, rows, 1).setDataValidation(SpreadsheetApp.newDataValidation()
    .requireNumberBetween(14, 23).setAllowInvalid(false).build());

  // Условное форматирование
  const rules = [];
  // повторяющийся request_id — красным
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND($A2<>"",COUNTIF($A:$A,$A2)>1)')
    .setBackground('#F4C7C3').setFontColor('#B3261E')
    .setRanges([sheet.getRange('A2:A' + (rows + 1))]).build());
  // пустая обязательная ячейка в заполненной строке — жёлтым (email, width_mm, ring_size необязательны)
  const required = ['A', 'B', 'C', 'D', 'F', 'G', 'J', 'K', 'L', 'M', 'N'];
  required.forEach(function (col) {
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=AND(COUNTA($A2:$N2)>0,' + col + '2="")')
      .setBackground('#FFF2B3')
      .setRanges([sheet.getRange(col + '2:' + col + (rows + 1))]).build());
  });
  sheet.setConditionalFormatRules(rules);
  sheet.autoResizeColumns(1, HEADERS.length);
}

/* ---------------- Реестр UTM-ссылок (лист utm, раздел 5.3) ---------------- */

const UTM_SITE = 'https://ogranka.vercel.app';
const UTM_HEADERS = ['номер', 'канал', 'размещение', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content',
  'utm_term', 'страница', 'полная ссылка', 'короткая ссылка', 'адрес публикации', 'дата публикации', 'комментарий'];
// Без полной ссылки: её собирает формула в столбце J
const UTM_ROWS = [
    ['U-01', 'Instagram', 'ссылка в шапке профиля', 'instagram', 'social', 'wedding_2027', 'bio', 'wedding_rings', 'index.html', '', '', '', ''],
    ['U-02', 'Instagram', 'автоответ под Reel (ManyChat), ветка «РАЗМЕР»', 'instagram', 'social', 'wedding_2027', 'reel_casting_01', 'ring_size', 'ring-size.html', '', '', '', ''],
    ['U-03', 'Instagram', 'автоответ, ветка «САМИ»', 'instagram', 'social', 'workshop_2026', 'reel_casting_01_diy', 'workshop_diy', 'workshop.html', '', '', '', ''],
    ['U-04', 'Instagram', 'ссылка-стикер «Собери своё кольцо» в Stories', 'instagram', 'social', 'wedding_2027', 'stories_01', 'ring_constructor', 'constructor.html', '', '', '', 'content: первая сторис со стикером — stories_01 по правилу 5.1.4'],
    ['U-05', 'ВКонтакте', 'пост в сообществе', 'vk', 'social', 'wedding_2027', 'post_01', 'wedding_rings', 'rings.html', 'https://clck.ru/3WmEzE', '', '', ''],
    ['U-06', 'ВКонтакте', 'пост в группе свадебных организаторов', 'vk', 'referral', 'wedding_2027', 'wedding_group', 'ring_constructor', 'constructor.html', 'https://clck.ru/3WmEzF', '', '', 'campaign: пост приглашает пары на примерку к сезону 2027, как и вся кампания'],
    ['U-07', 'Telegram', 'пост в канале', 'telegram', 'social', 'wedding_2027', 'post_01', 'ring_constructor', 'constructor.html', 'https://clck.ru/3WmEzG', '', '', ''],
    ['U-08', 'Telegram', 'пост о мастер-классе', 'telegram', 'social', 'workshop_2026', 'post_02', 'workshop_diy', 'workshop.html', 'https://clck.ru/3WmEzH', '', '', 'content: второй пост канала — post_02, чтобы отличать его от U-07'],
    ['U-09', 'YouTube', 'описание видео «От воска до золота»', 'youtube', 'social', 'wedding_2027', 'video_casting_01', 'wedding_rings', 'rings.html', '', '', '', 'content: первое видео о литье колец'],
    ['U-10', 'Блогер 1', 'ссылка у свадебного блогера', 'anna_wedding', 'affiliate', 'wedding_2027', 'stories_01', 'ring_constructor', 'constructor.html', '', '', '', 'source: ник однокурсницы-блогера латиницей (заменить на настоящий); content — формат: сторис'],
    ['U-11', 'Блогер 2', 'ссылка у фотографа-партнёра', 'max_photo', 'affiliate', 'wedding_2027', 'post_01', 'wedding_rings', 'rings.html', '', '', '', 'source: ник однокурсника-фотографа (заменить на настоящий); content — формат: пост'],
    ['U-12', 'Футляры', 'QR-код на вкладыше в футляр', 'box_qr', 'qr', 'care_2027', 'jewelry_box', 'engraving', 'engraving.html', '', '', '', 'QR: docs/qr-u-12.png, афиша: docs/afisha.pdf']
];

/* Запустить один раз: создаёт лист utm. Полная ссылка (J) — формула из столбцов меток,
   адрес сайта — в ячейке P1. Короткие ссылки, адрес и дата публикации дальше заполняются вручную. */
function setupUtmSheet() {
  const ss = openSpreadsheet_();
  const sheet = ss.getSheetByName('utm') || ss.insertSheet('utm');
  sheet.clear();
  sheet.getRange(1, 1, 1, UTM_HEADERS.length).setValues([UTM_HEADERS]).setFontWeight('bold').setBackground('#F7F3EC');
  sheet.getRange('O1').setValue('адрес сайта');
  sheet.getRange('P1').setValue(UTM_SITE);
  sheet.setFrozenRows(1);

  const values = UTM_ROWS.map(function (r) { return r.slice(0, 9).concat([''], r.slice(9)); });
  sheet.getRange(2, 1, values.length, UTM_HEADERS.length).setNumberFormat('@').setValues(values);

  const formulas = values.map(function (r, i) {
    const n = i + 2;
    return ['=CONCATENATE($P$1,"/",I' + n + ',"?utm_source=",D' + n + ',"&utm_medium=",E' + n +
      ',"&utm_campaign=",F' + n + ',"&utm_content=",G' + n + ',"&utm_term=",H' + n + ')'];
  });
  sheet.getRange(2, 10, formulas.length, 1).setNumberFormat('General').setFormulas(formulas);
  sheet.autoResizeColumns(1, 9);
}

/* Ручная проверка приёмника из редактора: Выполнить → testDoPost.
   Первая отправка запишет строку, вторая с тем же request_id вернёт ошибку (испытание И-05). */
function testDoPost() {
  const body = {
    request_id: 'REQ-00000000-0000-4000-8000-000000000001', name: 'Тест редактора', phone: '+79001234567',
    email: '', lead_type: 'fitting', metal: 'gold585', width_mm: '3', ring_size: '17.5',
    utm_source: 'test', utm_medium: 'none', utm_campaign: 'not_set', utm_content: 'not_set', consent: true
  };
  const e = { postData: { contents: JSON.stringify(body) }, parameter: {} };
  console.log(doPost(e).getContent());
  console.log(doPost(e).getContent()); // ожидается duplicate_request_id
}
