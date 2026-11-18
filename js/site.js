/* ==========================================================
   GET DEBATING: shared behaviour for every page.
   You should not need to edit this file.
   ========================================================== */

(function () {
  "use strict";

  var settings = window.SITE_SETTINGS || {};

  function isPlaceholder(value) {
    return !value || /^\[.*\]$/.test(value);
  }

  /* 1. Fill links from js/settings.js ---------------------- */
  document.querySelectorAll("[data-link]").forEach(function (el) {
    var key = el.getAttribute("data-link");
    var value = settings[key];
    if (key === "email") {
      if (value) { el.textContent = value; }
      if (!isPlaceholder(value)) { el.setAttribute("href", "mailto:" + value); }
    } else if (!isPlaceholder(value)) {
      el.setAttribute("href", value);
    }
  });

  /* 2. Mobile menu ----------------------------------------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.textContent = open ? "Close" : "Menu";
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.textContent = "Menu";
        toggle.focus();
      }
    });
  }

  /* 3. Forms ------------------------------------------------
     Every <form data-form="Name"> is checked, then sent to the
     form service address in js/settings.js. */
  function showError(input, show) {
    var id = input.id + "-error";
    var message = document.getElementById(id);
    if (show && !message) {
      message = document.createElement("p");
      message.id = id;
      message.className = "field__error";
      message.textContent = input.type === "email"
        ? "Enter a valid email address."
        : "Please fill this in.";
      (input.closest(".newsletter__row") || input).insertAdjacentElement("afterend", message);
    }
    if (message) { message.hidden = !show; }
    input.setAttribute("aria-invalid", show ? "true" : "false");
    if (show) { input.setAttribute("aria-describedby", id); }
  }

  document.querySelectorAll("form[data-form]").forEach(function (form) {
    form.setAttribute("novalidate", "");
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var status = form.querySelector(".form-status");
      var firstBad = null;

      form.querySelectorAll("input[required], select[required], textarea[required]").forEach(function (input) {
        if (input.type === "radio") { return; }
        var bad = !input.checkValidity();
        showError(input, bad);
        if (bad && !firstBad) { firstBad = input; }
      });
      if (firstBad) {
        status.textContent = "Some details are missing. Check the marked fields.";
        firstBad.focus();
        return;
      }

      var endpoint = settings.formEndpoint;
      if (isPlaceholder(endpoint)) {
        status.textContent = "This form is not connected yet, so nothing was sent. (Site owner: add a form service address in js/settings.js.)";
        return;
      }

      status.textContent = "Sending…";
      var data = new FormData(form);
      data.append("form", form.getAttribute("data-form"));
      fetch(endpoint, { method: "POST", body: data, headers: { Accept: "application/json" } })
        .then(function (response) {
          if (!response.ok) { throw new Error("Form service refused the submission"); }
          form.reset();
          status.textContent = form.getAttribute("data-success") || "Thank you. We have your details and will be in touch.";
        })
        .catch(function () {
          status.textContent = "Sorry, that did not send. Please try again" +
            (isPlaceholder(settings.email) ? "." : ", or email " + settings.email + ".");
        });
    });
  });

  /* "Ask about this programme" links tick the matching option in the form */
  document.querySelectorAll("[data-programme]").forEach(function (link) {
    link.addEventListener("click", function () {
      var wanted = link.getAttribute("data-programme");
      document.querySelectorAll('input[name="programme"]').forEach(function (radio) {
        radio.checked = radio.value === wanted;
      });
    });
  });

  /* Links from other pages, such as schools.html?programme=ongoing#consultation,
     tick the choice whose label starts with the word after "programme=". */
  var fromLink = new URLSearchParams(window.location.search).get("programme");
  if (fromLink) {
    fromLink = fromLink.trim().toLowerCase();
    var ticked = false;
    document.querySelectorAll('input[name="programme"]').forEach(function (radio) {
      if (!ticked && fromLink && radio.value.toLowerCase().indexOf(fromLink) === 0) {
        radio.checked = true;
        ticked = true;
      }
    });
  }

  /* 4. Blog posts written as plain text ---------------------
     Blank line = new paragraph.  "## " = subheading.  "- " = bullet.
     **bold**  and  [link text](https://address)  also work. */
  function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function inline(text) {
    return escapeHtml(text)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2">$1</a>');
  }
  document.querySelectorAll("[data-plain-text]").forEach(function (box) {
    var out = [], paragraph = [], bullets = [];
    function flush() {
      if (paragraph.length) { out.push("<p>" + inline(paragraph.join(" ")) + "</p>"); paragraph = []; }
      if (bullets.length) {
        out.push("<ul>" + bullets.map(function (b) { return "<li>" + inline(b) + "</li>"; }).join("") + "</ul>");
        bullets = [];
      }
    }
    box.textContent.replace(/\r/g, "").split("\n").forEach(function (raw) {
      var line = raw.trim();
      if (!line) { flush(); }
      else if (/^##\s+/.test(line)) { flush(); out.push("<h2>" + inline(line.replace(/^##\s+/, "")) + "</h2>"); }
      else if (/^[-•]\s+/.test(line)) { if (paragraph.length) { flush(); } bullets.push(line.replace(/^[-•]\s+/, "")); }
      else { if (bullets.length) { flush(); } paragraph.push(line); }
    });
    flush();
    box.innerHTML = out.join("");
    box.classList.add("is-formatted");
  });

  /* 5. Current year in the footer -------------------------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
