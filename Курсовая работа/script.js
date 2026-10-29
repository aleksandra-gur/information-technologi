
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz86c4_yTk6Hz718O1w-TeT8CZBPd62W_vad3i_dEXOiID5K9tBN2zyTqYNzjmhQ5LB/exec";

const GA_MEASUREMENT_ID = "G-37574R54DC";

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);

  const utmNames = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term"
  ];

  // Отправка события в GA4 без персональных данных.
  function trackEvent(eventName, parameters = {}) {
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, parameters);
    }
  }

  // Сохраняем UTM-метки между страницами.
  utmNames.forEach((name) => {
    const value = params.get(name);
    if (value) {
      sessionStorage.setItem(name, value);
    }
  });

  function fillUtmFields(form) {
    utmNames.forEach((name) => {
      const field = form.querySelector(`[name="${name}"]`);

      if (field) {
        field.value =
          sessionStorage.getItem(name) ||
          params.get(name) ||
          "";
      }
    });
  }

  // Отслеживаем клики по элементам с data-track.
  document.querySelectorAll("[data-track]").forEach((element) => {
    element.addEventListener("click", () => {
      trackEvent(element.dataset.track, {
        page_location: window.location.href
      });
    });
  });

  // Дополнительно отслеживаем переходы по основным ссылкам.
  document.querySelectorAll("a[href]").forEach((link) => {
    link.addEventListener("click", () => {
      const href = link.getAttribute("href") || "";

      if (
        href.includes("order.html") ||
        href.includes("contacts.html")
      ) {
        trackEvent("contact_link_click", {
          link_url: href,
          page_path: window.location.pathname
        });
      }
    });
  });

  // Отправка заявок в Google Sheets.
  document.querySelectorAll("form[data-lead-form], form").forEach((form) => {
    const submitButton = form.querySelector(
      'button[type="submit"], input[type="submit"]'
    );

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      fillUtmFields(form);

      const formData = new FormData(form);
      const data = {};

      formData.forEach((value, key) => {
        // Не отправляем поля согласия и другие checkbox в объект заявки.
        if (key !== "consent") {
          data[key] = String(value);
        }
      });

      utmNames.forEach((name) => {
        data[name] =
          data[name] || sessionStorage.getItem(name) || "";
      });

      data.page_url = window.location.href;

      const status =
        form.querySelector(".success") ||
        form.querySelector("#status") ||
        form.querySelector("[data-form-status]") ||
        document.querySelector("#status");

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.dataset.originalText =
          submitButton.textContent || "Отправить";
        submitButton.textContent = "Отправляем...";
      }

      if (status) {
        status.textContent = "Отправляем заявку...";
      }

      trackEvent("generate_lead", {
        form_id: form.id || "lead_form",
        page_path: window.location.pathname
      });

      try {
        await fetch(
          form.dataset.endpoint || APPS_SCRIPT_URL,
          {
            method: "POST",
            mode: "no-cors",
            headers: {
              "Content-Type": "text/plain;charset=utf-8"
            },
            body: JSON.stringify(data)
          }
        );

        if (status) {
          status.textContent =
            "Запрос отправлен. Проверьте, появилась ли заявка в таблице.";
        }

        // Не очищаем форму, чтобы введённые данные не потерялись,
        // если запись не появилась в таблице.
      } catch (error) {
        console.error("Ошибка отправки заявки:", error);

        if (status) {
          status.textContent =
            "Не удалось отправить заявку. Попробуйте ещё раз.";
        }

        trackEvent("lead_form_error", {
          page_path: window.location.pathname
        });
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent =
            submitButton.dataset.originalText || "Отправить";
        }
      }
    });
  });

  // Калькулятор стоимости кольца.
  const priceOutput = document.querySelector("[data-ring-price]");
  const material = document.querySelector("[name='material']");
  const width = document.querySelector("[name='width']");
  const stones = document.querySelector("[name='stones']");

  function updatePrice() {
    if (!priceOutput) return;

    const materialPrices = {
      silver: 5000,
      gold: 25000,
      platinum: 45000
    };

    const base = materialPrices[material?.value] || 5000;
    const widthValue = Number(width?.value || 3);
    const stonesValue = stones?.checked ? 8000 : 0;

    const price = Math.round(
      base * (widthValue / 3) + stonesValue
    );

    priceOutput.textContent =
      price.toLocaleString("ru-RU") + " ₽";
  }

  let priceEventSent = false;

  function trackPriceInteraction() {
    if (!priceEventSent) {
      trackEvent("ring_calculator_use");
      priceEventSent = true;
    }
  }

  [material, width, stones].forEach((element) => {
    element?.addEventListener("input", () => {
      updatePrice();
      trackPriceInteraction();
    });

    element?.addEventListener("change", () => {
      updatePrice();
      trackPriceInteraction();
    });
  });

  updatePrice();

  // Предпросмотр гравировки.
  const engravingInput = document.querySelector("[name='engraving']");
  const engravingPreview = document.querySelector(
    "[data-engraving-preview]"
  );

  function updateEngraving() {
    if (!engravingInput || !engravingPreview) return;

    engravingPreview.textContent =
      engravingInput.value || "Ваша надпись";
  }

  let engravingEventSent = false;

  engravingInput?.addEventListener("input", () => {
    updateEngraving();

    if (!engravingEventSent) {
      trackEvent("engraving_preview_use");
      engravingEventSent = true;
    }
  });

  updateEngraving();

  // Калькулятор размера кольца: отслеживаем использование,
  // если на странице есть соответствующие элементы.
  const sizeCalculator = document.querySelector(
    "[data-size-calculator]"
  );

  if (sizeCalculator) {
    sizeCalculator.addEventListener("input", () => {
      if (!sizeCalculator.dataset.analyticsTracked) {
        trackEvent("ring_size_calculator_use");
        sizeCalculator.dataset.analyticsTracked = "true";
      }
    });
  }

  // Переключение мобильного меню, если кнопка есть на странице.
  const menuToggle = document.querySelector(".menu-toggle");
  const navigation = document.querySelector("nav");

  menuToggle?.addEventListener("click", () => {
    const isExpanded =
      menuToggle.getAttribute("aria-expanded") === "true";

    menuToggle.setAttribute("aria-expanded", String(!isExpanded));
    navigation?.classList.toggle("is-open", !isExpanded);

    trackEvent("mobile_menu_toggle", {
      menu_state: !isExpanded ? "open" : "closed"
    });
  });
});
