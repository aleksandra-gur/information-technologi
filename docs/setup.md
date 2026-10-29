# Пошаговая инструкция: что сделать в своих аккаунтах

Код сайта, приёмник, реестр и документы уже готовы. Ниже — то, что можно сделать только в ваших аккаунтах (GitHub, Vercel, Google, соцсети, ManyChat, DataLens). Порядок совпадает с этапами раздела 9 ТЗ.

Каждый раз, когда меняете файлы, делайте коммит с понятным сообщением — в ТЗ нужно не меньше 10 коммитов.

---

## 0. Что заменить в коде

Ищите по всему проекту (VS Code: `Ctrl+Shift+H` — «Заменить в файлах»):

| Найти | Заменить на | Где |
|---|---|---|
| `G-XXXXXXXXXX` | идентификатор ресурса GA4 «ОГРАНКА — сайт» (шаг 2) | все 10 HTML-файлов |
| `var ENDPOINT = '';` | `var ENDPOINT = 'https://script.google.com/macros/s/…/exec';` — URL веб-приложения (шаг 3) | `js/form.js` |
| `https://www.instagram.com/ogranka_jewelry/`, `https://vk.com/ogranka_jewelry`, `https://t.me/ogranka_jewelry`, `https://www.youtube.com/@ogranka_jewelry` | адреса созданных вами страниц мастерской | подвал всех страниц, thanks.html |
| `https://aleksandra-gur.github.io/information-technologi/%D0%9A%D1%83%D1%80%D1%81%D0%BE%D0%B2%D0%B0%D1%8F%20%D1%80%D0%B0%D0%B1%D0%BE%D1%82%D0%B0` | новый адрес сайта, если он поменяется | все HTML (canonical, og:url, og:image), `docs/utm.csv` |
| `anna_wedding`, `max_photo` | ники двух однокурсников латиницей | `docs/utm.csv`, лист `utm` |

Если адрес сайта получился другим, пересоздайте QR-код, афишу и реестр: `python tools/make_files.py <папка репозитория> https://ваш-адрес.vercel.app` (папка `tools` лежит рядом с репозиторием; нужен Python с `pip install qrcode reportlab pillow`).

---

## 1. Этап «Сайт» (день 4): GitHub и Vercel

1. github.com → **New repository** → имя `tz-25-yuvelirnaya-masterskaya-ogranka`, **Public**, без README и .gitignore → Create.
2. В папке репозитория (история коммитов уже есть):
   ```bash
   git remote add origin https://github.com/<ваш-логин>/tz-25-yuvelirnaya-masterskaya-ogranka.git
   git push -u origin main
   ```
3. vercel.com → войти через GitHub → **Add New → Project** → импортировать репозиторий. Framework Preset: **Other**, Build Command и Output Directory — пусто. **Deploy**.
   - Если Vercel заблокировал аккаунт (как в ТЗ-02): включите GitHub Pages (**Settings → Pages → Deploy from a branch → main / root**) — сайт будет по адресу `https://<логин>.github.io/tz-25-yuvelirnaya-masterskaya-ogranka/` и тоже обновляется после каждого push. Все ссылки на сайте относительные, поэтому он работает и там; замените адрес по шагу 0 и укажите замену в README.
4. Адрес сайта впишите в `README.md`.
5. Lighthouse: Chrome → главная на Vercel → F12 → **Lighthouse** → Device: **Mobile**, категории Performance, Accessibility, SEO → Analyze. Снимок → `screens/lighthouse/index-mobile.png`. Нужно: Performance ≥ 70, Accessibility ≥ 90, SEO ≥ 90.

---

## 2. Этап «Аналитика» (день 8): GA4

1. analytics.google.com → **Admin → Create → Property**: название `ОГРАНКА — сайт`, часовой пояс **(GMT+03:00) Moscow**, валюта **Russian Ruble (RUB)**.
2. **Data streams → Web**: адрес сайта на Vercel. В **Enhanced measurement** включено всё, в том числе **Form interactions** и **File downloads**.
3. Скопируйте **Measurement ID** `G-…` и замените `G-XXXXXXXXXX` во всех HTML-файлах. Коммит, push.
4. **Admin → Custom definitions → Create custom dimension**, Scope: **Event**, 7 штук: `button_name`, `page_section`, `metal`, `width_mm`, `ring_size`, `lead_type`, `messenger`. Dimension name и Event parameter — одинаковые.
5. **Key events:** отметьте `generate_lead`, `contact_click`, `messenger_click`. Больше ничего; если GA4 сам отметил `purchase` — снимите.
6. **DebugView:** откройте сайт с `?debug_mode=1` в адресе (например `…/index.html?debug_mode=1`) — все события из `analytics.js` пойдут в отладку до закрытия вкладки. Для автоматических событий включите расширение Chrome **Google Analytics Debugger**. **Admin → DebugView**: вызовите по очереди все 20 событий (`docs/events.md`), раскройте параметры, снимок → `screens/ga4/<имя_события>.png`, например `screens/ga4/ring_filter.png`.
   - Если `form_submit` не приходит, поставьте `MANUAL_FORM_SUBMIT = true` в `js/analytics.js`.
   - `generate_lead` придёт только после шага 3.
7. Доступ Заказчику: **Admin → Property access management → Add users** → e-mail Заказчика, роль **Viewer**. Впишите e-mail в README.

---

## 3. Этап «Заявки» (день 11): Google Таблица и Apps Script

1. Google Таблицы → новая таблица **Ogranka — Leads**.
2. **Расширения → Apps Script** → вставьте весь `apps-script/Code.gs` → сохраните. `SPREADSHEET_ID` можно оставить пустым: скрипт возьмёт эту таблицу.
3. Функция **setupSheet** → **Выполнить** → разрешите доступ. Появится лист `leads`: 14 заголовков, выпадающие списки `lead_type`, `metal`, `status` (new, contacted, fitting, prepaid, issued, lost), проверка чисел `width_mm` 2–6 и `ring_size` 14–23, подсветка пустых обязательных ячеек (жёлтым) и повторного `request_id` (красным).
4. Проверка: функция **testDoPost** → Выполнить. В журнале первый ответ `{"ok":true…}`, второй — `duplicate_request_id` (это и есть испытание И-05). Тестовую строку удалите.
5. **Развернуть → Новое развёртывание → Веб-приложение**. Выполнять как: **я**; доступ: **все**. URL `…/exec` вставьте в `js/form.js` в `ENDPOINT`. Коммит, push.
   - После правок кода: **Развернуть → Управление развёртываниями → карандаш → Версия: новая** — URL не меняется.
6. Отправьте заявку с сайта: строка с метками и `status = new` появится через 1–2 секунды, сайт откроет thanks.html с номером заявки.
7. **Настройки доступа** таблицы: e-mail Заказчика → **Читатель**.
8. Статусы (6.4): одну тестовую заявку проведите `new → contacted → fitting → prepaid → issued`, другую закройте `lost`.

### Лист `utm` (реестр ссылок)

1. **Файл → Импорт → Загрузить** `docs/utm.csv` → **Вставить новый лист** → переименуйте в `utm`.
2. В `P1` впишите адрес сайта без слэша в конце.
3. В `J2` вставьте формулу и протяните до `J13`:
   ```
   =СЦЕПИТЬ($P$1;"/";I2;"?utm_source=";D2;"&utm_medium=";E2;"&utm_campaign=";F2;"&utm_content=";G2;"&utm_term=";H2)
   ```
4. Короткие ссылки для ВКонтакте и Telegram (U-05…U-08): vk.cc (vk.com/cc) или clck.ru. После перехода в адресной строке — все пять меток; снимок → `screens/utm/short-u-05.png` и т. д.
5. По мере публикаций заполняйте «адрес публикации» и «дату публикации». В конце: **Файл → Скачать → CSV** → замените `docs/utm.csv`.

---

## 4. Этап «Каналы» (день 15): соцсети и ManyChat

1. Создайте от имени мастерской (не личные страницы): профессиональный Instagram (Автор или Бизнес), сообщество ВКонтакте, Telegram-канал, YouTube-канал. Если соцсеть недоступна — Дзен, TikTok или Pinterest, замену укажите в реестре.
2. Сначала ссылка в реестре, потом публикация. Тексты публикаций — `docs/posts.md`.
3. Два однокурсника публикуют U-10 и U-11 у себя и переходят по ним; их ники — в `utm_source`.
4. **Проверка ссылки (5.5):** публикация в инкогнито или с другого телефона → нажать ссылку → снимок адресной строки с метками (`screens/utm/u-01.png`…) → GA4 **Realtime**: Session source = ваш `utm_source` → для U-01, U-05, U-07, U-09, U-10, U-11, U-12 отправить заявку с именем «Тест U-05» и т. п.
5. Через 24–48 часов: **Reports → Acquisition → Traffic acquisition**, Session source / medium — не меньше 6 пар. Снимок → `screens/utm/traffic-acquisition.png`.

### ManyChat (раздел 7)

1. manychat.com → подключить профессиональный Instagram. Опубликуйте Reel «Как мы отливаем кольцо: от воска до золота».
2. **Automation → New Automation**, имя `IG · Wedding 2027 · Casting Reel`.
3. Триггер: **User comments on your Post or Reel → Specific Post or Reel** → этот Reel → **Keywords: РАЗМЕР**.
4. **Reply to comment** — три варианта:
   - Отправили инструкцию в личные сообщения 💍
   - Проверьте директ — размер можно узнать дома
   - Готово! Инструкция и промокод уже в сообщениях
5. **Send DM:** «Здравствуйте! Это «Огранка». Как узнать размер кольца дома за 2 минуты — по кнопке ниже. Там же промокод на примерку.» + кнопка **Узнать размер** → полная ссылка U-02.
6. Вторая ветка: ключевое слово **САМИ** → «Мастер-класс «Сделай кольцо сам»: как проходит, цена и расписание — по кнопке ниже.» + кнопка **Мастер-класс** → ссылка U-03.
7. **Set Live.** Со второго аккаунта комментарии `РАЗМЕР` и `САМИ` с паузой не меньше 2 минут. Снимки каждого шага → `screens/instagram/`. Сообщение может прийти в «Запросы».
8. Кнопка в сообщении → заявка → в таблице `utm_source=instagram` и нужный `utm_content`, в Realtime — `generate_lead`.

---

## 5. Этап «Отчёты» (день 19)

Период — **Custom**: от первой проверки до дня сдачи. Снимки — `screens/reports/` и `screens/explore/` под именами из ТЗ.

**Reports (8.1):** snapshot + Compare → Preceding period; User acquisition (First user source / medium); Traffic acquisition (Session source / medium + Secondary dimension Session campaign → `traffic-campaign.png`; Session manual ad content → `traffic-content.png`); Engagement → Landing page + Session source; Pages and screens (Views, Active users, Average engagement time); Events (generate_lead, cta_click, ring_filter, view_item, ring_build); Key events по Session source / medium; Tech → Device category. Два сравнения в Traffic acquisition (`Session source exactly matches instagram` и `(direct)`) → `comparison.png`. **Share this report → Download file → CSV** → `docs/reports/traffic-acquisition.csv`.

**Library:** коллекция «ОГРАНКА» + отчёт «Кампания wedding_2027» (Session source / medium, Session campaign, Session manual ad content; Sessions, Engagement rate, Key events) → **Publish**. Снимок `library.png`.

**Explore (8.2):** названия начинаются с «ОГРАНКА ·». Сегменты «Instagram Sessions» и «Direct Sessions». Свободная форма (фильтр кампания wedding_2027, вторая вкладка с сегментами) → CSV `docs/reports/free-form.csv`; Воронка page_view → ring_filter → cta_click → form_start → generate_lead (Open, копия Closed, Breakdown Session source, третья вкладка Device category, сегменты); Воронка со временем (form_start в течение 10 минут после cta_click); Путь от ring-size.html, 3 шага по Page title; Обратный путь к generate_lead, 3 шага по Event name. На снимках виден значок качества данных.

**Атрибуция и оповещение (8.3):** Admin → **Attribution settings** — модель и окно в записку. Custom insight: ежедневно, сегмент Session source = instagram, Sessions уменьшились больше чем на 50 %, e-mail — ваш. Снимок `custom-insight.png`.

**DataLens (8.4):**
1. Данные свободной формы → листы `ga4_traffic` (дата, source, medium, campaign, content, сеансы, активные пользователи) и `ga4_leads` (дата, source, campaign, generate_lead) в таблице «Ogranka — Leads». Без служебных строк и «Общий итог». `(direct)` → `direct`, `(not set)` → `not_set`, `(none)` → `none`.
2. **Подключение Google Sheets** → датасеты GA4 (ga4_traffic + ga4_leads) и Заявки (лист `leads`, поля name, phone, email скрыть).
3. Дашборд **«ОГРАНКА — wedding_2027»**, 3 вкладки:
   - **Трафик:** индикаторы «Сеансы», «Активные пользователи», «generate_lead»; линия сеансов по дням; таблица источников и кампаний; селекторы периода и источника.
   - **Заявки:** «Всего заявок» (COUNTD(request_id)), «Новые» (status = new), «Изделие выдано» (status = issued); столбчатая по статусам; заявки по источникам и по дням; селектор статуса.
   - **Кампании:** сеансы и generate_lead из GA4, заявки из таблицы, заявки issued — связи только по source, campaign и дате.
   На каждой вкладке закреплённый селектор периода меняет все виджеты.
4. Доступ к воркбуку — **Просмотр** для Заказчика, без публичной ссылки. Снимки → `screens/datalens/`.

Затем заполните `docs/report.md`.

---

## 6. Сдача (день 21)

- Отладка выключена: в `gtag('config', …)` нет `debug_mode`, в `analytics.js` режим включается только адресом с `?debug_mode=1`.
- `README.md`: все ссылки, `G-…`, e-mail Заказчика, строки «Не получилось» и «Нейросеть использовалась для».
- Снимки на месте, `docs/utm.csv` и `docs/report.md` актуальны. Подготовка к испытаниям — `docs/acceptance.md`.
