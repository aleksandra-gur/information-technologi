# «Огранка» — сайт ювелирной мастерской

Курсовой проект по дисциплине **ОП.03 «Информационные технологии»**, ТЗ-25/2026.

**Исполнитель:** Гурняк Александра  
**Группа:** 9/2-РПО-25/3

## Проект

- **Сайт:** [ogranka.vercel.app](https://ogranka.vercel.app/)
- **Репозиторий:** [information-technologi](https://github.com/aleksandra-gur/information-technologi)
- **Google Таблица заявок:** [Ogranka — Leads](https://docs.google.com/spreadsheets/d/1gGxW4NPZy1Jje3vyyhhl-iZ9qCr3vMAf8Kw2TtwhhpU/edit)
- **DataLens:** [ОГРАНКА — аналитика заявок](https://datalens.yandex/6hmnsmye8ykap?_share_link=public)
- **GA4:** `G-37574R54DC`
- **Telegram:** [@ogranka_sait_bot](https://t.me/ogranka_sait_bot) — визуальный прототип, без автоматической обработки команд.

## Функциональность сайта

- Каталог из 18 моделей колец с фильтрами и просмотром изображений.
- Конструктор кольца с выбором параметров и предварительным расчётом стоимости.
- Раздел гравировки с предварительным просмотром.
- Калькулятор и таблица размеров.
- Страницы мастер-класса, контактов, благодарности и политики конфиденциальности.
- Адаптивная вёрстка.
- Форма заявки с проверкой полей и UTM-метками.

## Интеграции

- **Google Apps Script + Google Sheets:** приём и хранение заявок. Отправка формы проверена пользователем.
- **GA4:** подключение проверено в отчёте реального времени; во время проверки отображались 1 активный пользователь за 30 минут и события `first_visit`, `page_view`, `scroll`, `session_start`. Событие отправки заявки `generate_lead` отдельно не подтверждено.
- **Yandex DataLens:** создан дашборд по данным заявок.
- **Telegram:** оформлен демонстрационный профиль и меню. Бот не является полноценной автоматизацией.
- **Социальные публикации:** не создавались.

## Материалы

| Материал | Ссылка |
|---|---|
| Бланк сдачи и чек-лист | [kursovaya.md](kursovaya.md) |
| Описание проекта | [docs/opisanie.md](docs/opisanie.md) |
| Аналитическая записка | [docs/report.md](docs/report.md) |
| Технический аудит | [docs/status-audit.md](docs/status-audit.md) |
| Сценарии приёмки | [docs/acceptance.md](docs/acceptance.md) |
| События GA4 | [docs/events.md](docs/events.md) |
| UTM-реестр | [docs/utm.csv](docs/utm.csv) |
| Тексты публикаций (заготовки) | [docs/posts.md](docs/posts.md) |
| Журнал работы с нейросетью | [docs/prompts.md](docs/prompts.md) |
| Инструкция по сервисам | [docs/setup.md](docs/setup.md) |
| Схема проекта | [docs/scheme.svg](docs/scheme.svg) |
| Скриншоты | [screenshots/](screenshots/) |
| Презентация PPTX | [presentation/Ogranka_prezentaciya_final.pptx](presentation/Ogranka_prezentaciya_final.pptx) |
| PDF-версия слайдов | Пока не добавлена; требуется экспортировать из PPTX |
| PDF со скриншотами | [screenshots/скриншоты.pdf](screenshots/скриншоты.pdf) — отдельный сборник, не экспорт слайдов |
| План презентации и текст выступления | [presentation/prezentaciya.md](presentation/prezentaciya.md) |
| Афиша PDF | [docs/afisha.pdf](docs/afisha.pdf) |
| QR-код | [docs/qr-u-12.png](docs/qr-u-12.png) |
| Таблица размеров PDF | [files/ring-size-table.pdf](files/ring-size-table.pdf) |

## Технологии

HTML, CSS, JavaScript, Google Analytics 4, Google Apps Script, Google Sheets, Yandex DataLens, Vercel.

## Структура проекта

- `index.html`, `rings.html`, `constructor.html` и остальные HTML-файлы — страницы сайта.
- `css/` — стили.
- `js/` — логика каталога, конструктора, аналитики, формы и калькулятора размера.
- `img/` — изображения сайта и карточек изделий.
- `apps-script/` — серверный обработчик заявок.
- `docs/` — описание, аналитика, инструкции и вспомогательные материалы.
- `screenshots/` — собранные подтверждающие снимки.
- `presentation/` — презентация и материалы к защите.

