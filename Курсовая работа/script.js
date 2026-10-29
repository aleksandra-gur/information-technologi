
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz86c4_yTk6Hz718O1w-TeT8CZBPd62W_vad3i_dEXOiID5K9tBN2zyTqYNzjmhQ5LB/exec";
const GA_MEASUREMENT_ID = "G-37574R54DC";

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const utmNames = [
    "utm_source", "utm_medium", "utm_campaign",
    "utm_content", "utm_term"
  ];

  function trackEvent(name, data = {}) {
    if (typeof window.gtag === "function") {
      window.gtag("event", name, data);
    }
  }

  utmNames.forEach((name) => {
    const value = params.get(name);
    if (value) sessionStorage.setItem(name, value);
  });

  function getUtm(name) {
    return params.get(name) || sessionStorage.getItem(name) || "";
  }

  function fillUtmFields(form) {
    utmNames.forEach((name) => {
      const field = form.querySelector(`[name="${name}"]`);
      if (field) field.value = getUtm(name);
    });
  }

  function createRequestId() {
    return window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : "req-" + Date.now() + "-" + Math.random().toString(36).slice(2);
  }

  document.querySelectorAll("[data-track]").forEach((element) => {
    element.addEventListener("click", () => {
      trackEvent(element.dataset.track, {
        button_name: element.dataset.track,
        page_section: element.closest("section")?.className || "unknown"
      });
    });
  });

  document.querySelectorAll("a[href]").forEach((link) => {
    link.addEventListener("click", () => {
      const href = link.href.toLowerCase();

      if (/^(tel:|mailto:)/.test(href)) {
        trackEvent("contact_click", {
          button_name: link.textContent.trim().slice(0, 50)
        });
      }

      if (/wa\.me|whatsapp|t\.me|telegram|viber/.test(href)) {
        const messenger = /wa\.me|whatsapp/.test(href) ? "whatsapp" :
          /t\.me|telegram/.test(href) ? "telegram" :
          /viber/.test(href) ? "viber" : "other";
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

  document.querySelectorAll("form[data-lead-form]").forEach((form) => {
    const submitButton = form.querySelector('[type="submit"]');
    const status = form.querySelector(".success") ||
      form.querySelector("[data-form-status]") ||
      form.querySelector("#status");

    fillUtmFields(form);

    form.addEventListener("input", () => {
      if (!form.dataset.formStarted) {
        form.dataset.formStarted = "true";
        trackEvent("form_start", { form_id: form.id || "lead_form" });
      }
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      fillUtmFields(form);

      if (!form.reportValidity()) {
        trackEvent("form_error", {
          field_name: "form",
          error_type: "validation_error"
        });
        return;
      }

      const phone = form.querySelector('[name="phone"]');
      const digits = (phone?.value || "").replace(/\D/g, "");

      if (!phone || digits.length < 10 || digits.length > 15) {
        if (phone) {
          phone.setCustomValidity("Введите корректный номер телефона");
          phone.reportValidity();
          phone.addEventListener("input", () => phone.setCustomValidity(""), { once: true });
        }
        trackEvent("form_error", {
          field_name: "phone",
          error_type: "invalid_phone"
        });
        return;
      }

      const formData = new FormData(form);
      const data = {};

      formData.forEach((value, key) => {
        data[key] = String(value);
      });

      // Явно собираем основные поля независимо от структуры FormData.
      data.name = form.querySelector('[name="name"]')?.value.trim() || "";
      data.phone = phone.value.trim();
      data.email = form.querySelector('[name="email"]')?.value.trim() || "";
      data.service = form.querySelector('[name="service"]')?.value || "";
      data.message = form.querySelector('[name="message"], [name="comment"]')?.value || "";

      utmNames.forEach((name) => {
        data[name] = getUtm(name);
      });

      data.page_url = window.location.href;
      data.request_id = createRequestId();

      if (!data.name) {
        trackEvent("form_error", {
          field_name: "name",
          error_type: "required"
        });
        form.querySelector('[name="name"]')?.focus();
        return;
      }

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.dataset.originalText = submitButton.textContent;
        submitButton.textContent = "Отправляем...";
      }

      if (status) status.textContent = "Отправляем заявку…";

      try {
        const body = new URLSearchParams();
        Object.entries(data).forEach(([key, value]) => {
          body.append(key, String(value ?? ""));
        });

        await fetch(APPS_SCRIPT_URL, {
          method: "POST",
          mode: "no-cors",
          body
        });

        trackEvent("form_submit", {
          form_id: form.id || "lead_form"
        });

        trackEvent("generate_lead", {
          lead_type: data.service || "consultation",
          request_id: data.request_id
        });

        if (status) {
          status.textContent = "Заявка отправлена. Мы свяжемся с вами!";
        } else {
          alert("Заявка отправлена. Мы свяжемся с вами!");
        }

        form.reset();
        fillUtmFields(form);

      } catch (error) {
        console.error("Ошибка отправки заявки:", error);
        trackEvent("form_error", {
          field_name: "form",
          error_type: "network_error"
        });

        if (status) {
          status.textContent = "Не удалось отправить заявку. Попробуйте ещё раз.";
        } else {
          alert("Не удалось отправить заявку. Попробуйте ещё раз.");
        }
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = submitButton.dataset.originalText || "Отправить заявку";
        }
      }
    });
  });
});
