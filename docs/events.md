# Таблица событий GA4

Все вызовы `gtag('event', …)` — одна строка: `js/analytics.js:46` (функция `track`).
Кнопки описаны атрибутами `data-event` и `data-*` в HTML; `analytics.js` ловит клик и отправляет событие.
Скрипты страниц вызывают `window.ogrankaAnalytics.track(…)`. Ниже — где срабатывает каждое событие (файл:строка; «+N» — ещё N таких же элементов на странице).

Имя, телефон, e-mail и текст гравировки в GA4 не передаются.

## Автоматические (расширенная статистика, без кода)

| № | Событие | Когда | Параметры (пример) |
|---|---|---|---|
| 1 | `page_view` | Открытие любой страницы | page_location: `https://…/rings.html`, page_title: `Каталог обручальных колец…` |
| 2 | `scroll` | Прокрутка страницы до 90 % | percent_scrolled: `90` |
| 3 | `click` | Переход по внешней ссылке (Telegram, WhatsApp, соцсети) | link_url: `https://t.me/ogranka_manager`, outbound: `true` |
| 4 | `file_download` | Скачивание таблицы размеров `files/ring-size-table.pdf` | file_name: `/files/ring-size-table.pdf`, file_extension: `pdf` |
| 5 | `form_start` | Первое взаимодействие с формой `lead-form` | form_id: `lead-form` |
| 6 | `form_submit` | Отправка формы `lead-form` | form_id: `lead-form` |

## Запрограммированные

| № | Событие | Тип | Когда | Где отправляется | Параметры (пример) |
|---|---|---|---|---|---|
| 7 | `generate_lead` | ключевое, рекоменд. | Приёмник ответил `ok: true` | `js/form.js:193` | lead_type: `fitting`, lead_metal: `gold585`, value: `55000`, currency: `RUB` |
| 8 | `cta_click` | своё | Клик по кнопке заявки/конструктора | `index.html:77` (+2), `rings.html:128` (+18), `constructor.html:122`, `engraving.html:100`, `workshop.html:109`, `ring-size.html:163`, `contacts.html:163`; обработчик `js/analytics.js:80` | button_name: `hero_fitting`, page_section: `hero` |
| 9 | `ring_filter` | своё | Изменение фильтра каталога | `js/catalog.js:33` | metal: `gold585`, style: `stone`, width_mm: `all` |
| 10 | `view_item` | рекоменд. | Открытие карточки модели: «Подробнее о модели» в каталоге или карточка на главной | `js/catalog.js:52`, `index.html:93` (+5); функция `js/analytics.js:63` | currency: `RUB`, value: `44300`, items: `[{item_id: R-16, item_name: С бриллиантом 3, item_category: stone, item_variant: gold585, price: 44300}]` |
| 11 | `ring_build` | своё | Изменение параметров в конструкторе | `js/constructor.js:75` | metal: `gold585`, width_mm: `3`, stone: `none`, total_price: `27500` |
| 12 | `engraving_preview` | своё | Изменение текста (через 0,8 с после ввода) или шрифта гравировки | `js/engraving.js:20` | font_name: `marck_script`, text_length: `18` |
| 13 | `ring_size_calc` | своё | Нажата «Рассчитать размер» и введено число | `js/ring-size.js:60` | method: `thread`, ring_size: `17.5` |
| 14 | `workshop_view` | своё | Открытие страницы мастер-класса | `workshop.html` (атрибут `data-page-event` у `<body>`); `js/analytics.js:89` | page_section: `workshop_page` |
| 15 | `contact_click` | ключевое, своё | Клик по телефону или e-mail | `index.html:60` (+2), `rings.html:61` (+2), `constructor.html:62` (+2), `engraving.html:62` (+2), `workshop.html:60` (+2), `ring-size.html:61` (+2), `contacts.html:62` (+4), `thanks.html:60` (+2), `privacy.html:60` (+2), `404.html:60` (+2) | contact_type: `phone` / `email`, page_section: `header` |
| 16 | `messenger_click` | ключевое, своё | Клик по Telegram или WhatsApp | `contacts.html:172` (+1) | messenger: `telegram` / `whatsapp` |
| 17 | `social_click` | своё | Клик по соцсети в подвале или на thanks.html | `index.html:237` (+3), `rings.html:542` (+3), `constructor.html:143` (+3), `engraving.html:119` (+3), `workshop.html:128` (+3), `ring-size.html:182` (+3), `contacts.html:202` (+3), `thanks.html:88` (+7), `privacy.html:120` (+3), `404.html:92` (+3) | network: `instagram`, page_section: `footer` / `thanks` |
| 18 | `form_error` | своё | Ошибка поля или ошибка приёмника | `js/form.js:134`, `js/form.js:159` | field_name: `phone`, error_type: `format` (`required`, `length`, `consent`, `server`) |
| 19 | `promo_copy` | по выбору, своё | Нажата «Скопировать» у промокода | `ring-size.html:150` | promo_code: `SIZE5` |
| 20 | `gallery_view` | по выбору, своё | Открытие фото модели крупно | `rings.html:111` (+17) | item_id: `R-16` |

## Значения button_name

| button_name | Страница | Кнопка |
|---|---|---|
| `hero_fitting` | index.html | Записаться на примерку |
| `hero_constructor` | index.html | Рассчитать цену |
| `teaser_constructor` | index.html | Собрать кольцо |
| `catalog_constructor` | rings.html | Собрать в конструкторе |
| `catalog_bottom_constructor` | rings.html | Собрать в конструкторе |
| `constructor_fitting` | constructor.html | Записаться на примерку |
| `engraving_constructor` | engraving.html | Рассчитать цену с гравировкой |
| `workshop_signup` | workshop.html | Записаться |
| `size_fitting` | ring-size.html | Записаться на примерку |
| `lead_form_send` | contacts.html | Отправить заявку |

## value в generate_lead

- Мастер-класс — 6 900 ₽ (цена за человека).
- Примерка — цена пары из конструктора, если металл и ширина в форме совпадают с собранным кольцом; иначе базовая цена пары по металлу и ширине (без камня и гравировки); если металл или ширина неизвестны — 0.

## Режим отладки (DebugView)

В коде отладка выключена. Для снимков откройте сайт с `?debug_mode=1` (например `…/rings.html?debug_mode=1`): до закрытия вкладки ко всем событиям из `analytics.js` добавится `debug_mode: true`. Автоматические события видны в DebugView через расширение Google Analytics Debugger.

## Пользовательские параметры (Admin → Custom definitions, Event scope)

| Параметр | Событие |
|---|---|
| button_name | cta_click |
| page_section | cta_click, social_click |
| metal | ring_filter, ring_build |
| width_mm | ring_build |
| ring_size | ring_size_calc |
| lead_type | generate_lead |
| messenger | messenger_click |
