# События Google Analytics 4 — «Огранка»

Идентификатор потока: `G-37574R54DC`  
Адрес сайта: https://ogranka.vercel.app/

## Автоматически собираемые события

| Событие | Назначение |
|---|---|
| `page_view` | Просмотр страницы |
| `scroll` | Прокрутка страницы |
| `click` | Нажатие на внешнюю ссылку |
| `file_download` | Скачивание файла |
| `form_start` | Начало заполнения формы |
| `form_submit` | Отправка формы |

## Пользовательские события

| Событие | Назначение | Основные параметры |
|---|---|---|
| `generate_lead` | Успешная заявка | `lead_type`, `request_id` |
| `cta_click` | Нажатие главной кнопки | `button_name`, `page_section` |
| `ring_filter` | Применение фильтра колец | `metal`, `width_mm` |
| `view_item` | Просмотр модели | `item_id`, `item_name` |
| `ring_build` | Изменение параметров кольца | `metal`, `width_mm`, `ring_size`, `total_price` |
| `engraving_preview` | Предпросмотр гравировки | `font`, `text_length` |
| `ring_size_calc` | Расчёт размера кольца | `ring_size`, `method` |
| `workshop_view` | Просмотр мастер-класса | `workshop_name` |
| `contact_click` | Нажатие на телефон или контакт | `button_name` |
| `messenger_click` | Переход в мессенджер | `messenger` |
| `social_click` | Переход в социальную сеть | `social_network` |
| `form_error` | Ошибка заполнения формы | `field_name`, `error_type` |
| `promo_copy` | Копирование промокода | `promo_code` |
| `gallery_view` | Просмотр галереи | `item_id`, `image_index` |

## Проверка

Наличие события в этой таблице описывает план аналитики. Фактическая работа каждого события должна быть проверена в GA4 DebugView или Realtime. Параметры необходимо сверить с реализацией сайта.

