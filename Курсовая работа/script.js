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

  function trackEvent(eventName, parameters = {}) {
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, parameters);
    }
  }

  // Сохраняем только реально переданные UTM.
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
        field.value = params.get(name) ||
          sessionStorage.getItem(name) || "";
      }
    });
  }

  // Генерация уникального идентификатора заявки.
  function createRequestId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return "req-" + Date.now() + "-" +
      Math.random().toString(36).slice(2);
  }

  // Отслеживание кнопок.
  document.querySelectorAll("[data-track]").forEach((element) => {
    element.addEventListener("click", () => {
      trackEvent(element.dataset.track, {
        button_name: element.dataset.track,
        page_section: element.closest("section")?.className || "unknown"
      });
    });
  });

  // Отслеживание контактов и мессенджеров.
  document.querySelectorAll("a[href]").forEach((link) => {
    link.addEventListener("click", () => {
      const href = link.href.toLowerCase();

      if (/tel:|mailto:/.test(href)) {
        trackEvent("contact_click", {
          button_name: link.textContent.trim().slice(0, 50)
        });
      }

      if (/wa\.me|whatsapp|t\.me|telegram|viber/.test(href)) {
        let messenger = "other";
        if (/wa\.me|whatsapp/.test(href)) messenger = "whatsapp";
        if (/t\.me|telegram/.test(href)) messenger = "telegram";
        if (/viber/.test(href)) messenger = "viber";

        trackEvent("messenger_click", { messenger });
      }

      if (/instagram|vk\.com|facebook|youtube/.test(href)) {
        trackEvent("social_click", {
          social_network: href.includes("instagram") ? "instagram" :
            href.includes("vk.com") ? "vk" :
            href.includes("youtube") ? "youtube" : "facebook"
        });
      }
    });
  });

  // Отправка заявок.
  document.querySelectorAll("form[data-lead-form]").forEach((form) => {
    const submitButton = form.querySelector('[type="submit"]');
    const status = form.querySelector(".success") ||
      form.querySelector("[data-form-status]") ||
      form.querySelector("#status");

    fillUtmFields(form);

    form.addEventListener("input", () => {
      if (!form.dataset.formStarted) {
        form.dataset.formStarted = "true";
        trackEvent("form_start", {
          form_id: form.id || "lead_form"
        });
      }
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      fillUtmFields(form);

      const phone = form.querySelector('[name="phone"]');
      const digits = (phone?.value || "").replace(/\D/g, "");

      if (!phone || digits.length < 10 || digits.length > 15) {
        if (phone) {
          phone.setCustomValidity("Введите корректный номер телефона");
          phone.reportValidity();
          phone.addEventListener("input", () => {
            phone.setCustomValidity("");
          }, { once: true });
        }

        trackEvent("form_error", {
          field_name: "phone",
          error_type: "invalid_phone"
        });
        return;
      }

      if (!form.reportValidity()) {
        trackEvent("form_error", {
          field_name: "form",
          error_type: "validation_error"
        });
        return;
      }

      const formData = new FormData(form);
      const data = {};

      formData.forEach((value, key) => {
        data[key] = String(value);
      });

      utmNames.forEach((name) => {
        data[name] = params.get(name) ||
          sessionStorage.getItem(name) || "";
      });

      data.page_url = window.location.href;
      data.request_id = createRequestId();

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.dataset.originalText = submitButton.textContent;
        submitButton.textContent = "Отправляем...";
     
