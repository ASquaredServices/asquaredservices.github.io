// A Squared Services: page tabs, price estimates, and sending the forms.
// Prices and settings live in config.js.

(function () {
  "use strict";

  const C = window.A2_CONFIG;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const money = (n) => "$" + (Number.isInteger(n) ? n : n.toFixed(2));
  const percent = (x) => Math.round(x * 100) + "%";
  const lookup = (path) => path.split(".").reduce((obj, key) => (obj == null ? obj : obj[key]), C);

  // ---------------------------------------------------------------- Tabs

  const pages = $$(".page");

  function showPage() {
    const id = decodeURIComponent(location.hash.slice(1));
    const target = id ? document.getElementById(id) : null;
    const page = (target && target.closest(".page")) || pages[0];

    pages.forEach((p) => p.classList.toggle("active", p === page));
    document.body.dataset.theme = page.dataset.theme;
    document.title = page.dataset.title ? page.dataset.title + " · A² Services" : "A² Services";
    $$(".tab").forEach((tab) => {
      if (tab.getAttribute("href") === "#" + page.id) tab.setAttribute("aria-current", "page");
      else tab.removeAttribute("aria-current");
    });

    if (target && target !== page) {
      const details = $("details", target);
      if (details) details.open = true;
      target.scrollIntoView();
      // Flash the section, since the page may not move at all if it's
      // already on screen (like Contact at the bottom of the home page).
      target.classList.remove("flash");
      void target.offsetWidth; // restarts the animation
      target.classList.add("flash");
    } else {
      window.scrollTo(0, 0);
    }
  }

  // Tapping a link to where you already are (like "Contact" twice) doesn't
  // change the address, so the browser does nothing. Handle it here.
  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (link && link.hash === location.hash) {
      event.preventDefault();
      showPage();
    }
  });

  // ------------------------------------------------ Filling in the page

  // Every [data-price="fall.pricePerBag"] shows that price from config.js,
  // and every [data-text="seasonPass.season"] shows that text.
  $$("[data-price]").forEach((el) => {
    const value = lookup(el.dataset.price);
    if (typeof value === "number") el.textContent = money(value);
  });
  $$("[data-text]").forEach((el) => {
    const value = lookup(el.dataset.text);
    if (value != null) el.textContent = value;
  });

  function renderContact() {
    const links = [];
    if (C.contact.phone) {
      const a = document.createElement("a");
      a.href = "tel:" + C.contact.phone.replace(/[^\d+]/g, "");
      a.textContent = C.contact.phone;
      links.push(a);
    }
    if (C.contact.email) {
      const a = document.createElement("a");
      a.href = "mailto:" + C.contact.email;
      a.textContent = C.contact.email;
      links.push(a);
    }
    if (!links.length) return;
    $$("[data-contact]").forEach((el) => {
      el.replaceChildren();
      links.forEach((link, i) => {
        if (i) el.append(document.createElement("br"));
        el.append(link.cloneNode(true));
      });
    });
  }

  function contactSentence() {
    const ways = [C.contact.phone, C.contact.email].filter(Boolean);
    return ways.length ? " You can also reach us at " + ways.join(" or ") + "." : "";
  }

  const template = $("#contact-fields");
  $$("[data-contact-fields]").forEach((el) => el.replaceWith(template.content.cloneNode(true)));

  const choiceSets = {
    payment: () => ({
      name: "Payment",
      options: C.paymentMethods.map((m) => ({ value: m.name })),
    }),
    snowfall: () => ({
      name: "Snowfall",
      checked: 0,
      options: C.winter.snowfall.map((o) => ({
        value: o.label,
        note: o.extra === null ? "Price it on the day" : o.extra ? "+" + percent(o.extra) : "No extra",
      })),
    }),
    driveway: () => ({
      name: "Driveway",
      checked: 1,
      options: C.winter.driveway.map((o) => ({ value: o.label, note: money(o.price) })),
    }),
    sidewalk: () => ({
      name: "Sidewalk",
      checked: 0,
      options: C.winter.sidewalk.map((o) => ({ value: o.label, note: o.price ? "+" + money(o.price) : "$0" })),
    }),
  };

  // Turns <div data-choices="driveway"> into a row of pill-shaped radio buttons.
  $$("[data-choices]").forEach((group) => {
    const set = choiceSets[group.dataset.choices]();
    group.setAttribute("role", "radiogroup");
    set.options.forEach((opt, i) => {
      const label = document.createElement("label");
      label.className = "choice";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = set.name;
      input.value = opt.value;
      input.required = true;
      input.defaultChecked = i === set.checked;
      const box = document.createElement("span");
      const title = document.createElement("b");
      title.textContent = opt.value;
      box.append(title);
      if (opt.note) {
        const note = document.createElement("small");
        note.textContent = opt.note;
        box.append(note);
      }
      label.append(input, box);
      group.append(label);
    });
  });

  // Under the payment choices: a box for "Other" (which method?), and a
  // note that explains how to pay.
  $$('[data-choices="payment"]').forEach((group) => {
    const form = group.closest("form");
    const otherBox = document.createElement("label");
    otherBox.className = "field other-pay";
    otherBox.innerHTML = '<span>Which payment method would you like?</span>';
    const otherInput = document.createElement("input");
    otherInput.name = "Other payment";
    otherInput.placeholder = "For example: PayPal, Zelle, or check";
    otherBox.append(otherInput);
    const note = document.createElement("p");
    note.className = "pay-note";
    group.after(otherBox, note);
    const update = () => {
      const picked = C.paymentMethods.find((m) => m.name === form.elements.Payment.value);
      const other = Boolean(picked && picked.other);
      otherBox.hidden = !other;
      otherInput.disabled = !other; // disabled boxes aren't checked or sent
      otherInput.required = other;
      if (form.dataset.kind === "pass") {
        note.textContent = picked
          ? picked.passNote
          : "Paying with Venmo? Pay up front. Paying with cash? Pay at the first storm.";
      } else {
        note.textContent = picked ? picked.note : "You pay once the job is done.";
      }
    };
    group.addEventListener("change", update);
    form.addEventListener("reset", () => setTimeout(update));
    update();
  });

  const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
  $$('input[type="date"]').forEach((input) => (input.min = today));

  $$(".stepper").forEach((stepper) => {
    const input = $("input", stepper);
    input.max = C.fall.maxBags;
    $$("button", stepper).forEach((button) =>
      button.addEventListener("click", () => {
        const min = Number(input.min) || 1;
        const max = Number(input.max) || 99;
        const current = parseInt(input.value, 10) || min;
        input.value = Math.min(max, Math.max(min, current + Number(button.dataset.step)));
        input.dispatchEvent(new Event("input", { bubbles: true }));
      })
    );
  });

  if (!C.formEndpoint) $("[data-booking-notice]").hidden = false;

  // ------------------------------------------------------------ Estimates

  // Each returns the lines shown in the "Your estimate" box.
  const estimators = {
    fall(f) {
      const bags = Math.min(C.fall.maxBags, Math.max(1, parseInt(f.Bags.value, 10) || 1));
      const cost = bags * C.fall.pricePerBag;
      return {
        lines: [[bags + (bags === 1 ? " bag" : " bags") + " × " + money(C.fall.pricePerBag), money(cost)]],
        total: money(cost),
        note: "This is an estimate. We'll count the bags when we're done and confirm the final price.",
      };
    },

    winter(f) {
      const find = (list, label) => list.find((o) => o.label === label);
      const driveway = find(C.winter.driveway, f.Driveway.value);
      const sidewalk = find(C.winter.sidewalk, f.Sidewalk.value);
      const snowfall = find(C.winter.snowfall, f.Snowfall.value) || C.winter.snowfall[0];
      const base = (driveway ? driveway.price : 0) + (sidewalk ? sidewalk.price : 0);
      if (!base) {
        return {
          lines: [],
          total: "–",
          note: "Pick a driveway or sidewalk for us to shovel.",
          problem: "Please pick a driveway or sidewalk for us to shovel.",
          meltFree: false,
          subtotal: 0,
        };
      }
      // Snow melt is free once the order (before snow melt) reaches the limit.
      const wantsMelt = f["Snow melt"].checked;
      const withMelt = (subtotal) =>
        subtotal + (wantsMelt && subtotal < C.winter.snowMelt.freeFrom ? C.winter.snowMelt.price : 0);

      const lines = [];
      if (driveway && driveway.price) lines.push(["Driveway (" + driveway.label + ")", money(driveway.price)]);
      if (sidewalk && sidewalk.price) lines.push(["Sidewalk", money(sidewalk.price)]);

      // "Not sure": show the range from the least to the most snow.
      if (snowfall.extra === null) {
        const maxExtra = Math.max(...C.winter.snowfall.map((o) => o.extra || 0));
        const low = withMelt(base);
        const high = withMelt(base * (1 + maxExtra));
        lines.push(["Snowfall", "Measured on the day"]);
        lines.push(["Paths to your door", "Free"]);
        if (wantsMelt) lines.push(["Snow melt", base >= C.winter.snowMelt.freeFrom ? "Free" : "Depends on total"]);
        return {
          lines,
          totalLabel: "Estimated Range",
          total: low === high ? money(low) : money(low) + "–" + money(high),
          note: "On the day, we'll measure the snowfall and text or email you the final price.",
          meltFree: base >= C.winter.snowMelt.freeFrom,
          subtotal: base,
        };
      }

      const snowCost = base * snowfall.extra;
      const subtotal = base + snowCost;
      const meltFree = subtotal >= C.winter.snowMelt.freeFrom;
      lines.push(["Snowfall " + snowfall.label + " (+" + percent(snowfall.extra) + ")", money(snowCost)]);
      lines.push(["Paths to your door", "Free"]);
      if (wantsMelt) lines.push(["Snow melt", meltFree ? "Free" : money(C.winter.snowMelt.price)]);
      return {
        lines,
        total: money(withMelt(subtotal)),
        note: "On the day, we'll measure the actual snowfall and adjust the price to match.",
        meltFree,
        subtotal,
      };
    },

    spring(f) {
      return {
        lines: f.Watering.checked ? [["Watering", "Free"]] : [],
        totalLabel: "Total",
        total: "We'll send a quote",
        isText: true,
        note: "We'll text or email you a quote once we've looked at your request.",
      };
    },

    pass() {
      return {
        lines: [["Winter Season Pass (" + C.seasonPass.season + ")", money(C.seasonPass.price)]],
        totalLabel: "Total",
        total: money(C.seasonPass.price),
        note: "Covers every snowstorm of the " + C.seasonPass.season + " winter. Little to no snow? We'll refund part of it.",
      };
    },
  };

  function renderEstimate(form) {
    const est = estimators[form.dataset.kind](form.elements);
    $(".summary-lines", form).replaceChildren(
      ...est.lines.map(([name, value]) => {
        const row = document.createElement("div");
        row.className = "line";
        const dt = document.createElement("dt");
        dt.textContent = name;
        const dd = document.createElement("dd");
        dd.textContent = value;
        dd.classList.toggle("free", value === "Free");
        row.append(dt, dd);
        return row;
      })
    );
    $(".summary-total span", form).textContent = est.totalLabel || "Estimated Total";
    const total = $(".summary-total strong", form);
    total.textContent = est.total;
    total.classList.toggle("is-text", Boolean(est.isText));
    $(".summary-note", form).textContent = est.note || "";
    if ("meltFree" in est) renderSnowMelt(form, est);
    return est;
  }

  // Shows "FREE" on the snow melt add-on once the order is big enough.
  function renderSnowMelt(form, est) {
    const melt = C.winter.snowMelt;
    const badge = $("[data-melt-badge]", form);
    const message = $("[data-melt-message]", form);
    badge.closest(".addon").classList.toggle("is-free", est.meltFree);
    if (est.meltFree) {
      const oldPrice = document.createElement("s");
      oldPrice.textContent = money(melt.price);
      badge.replaceChildren(oldPrice, " FREE");
      message.textContent = "Your order is " + money(melt.freeFrom) + " or more, so snow melt is free!";
    } else {
      badge.textContent = money(melt.price);
      message.textContent =
        "Free on orders of " + money(melt.freeFrom) + " or more" +
        (est.subtotal ? " (yours is " + money(est.subtotal) + " so far)" : "") + ".";
    }
  }

  // ---------------------------------------------------------- Phone check

  const PHONE_MESSAGE = "Please enter a 10-digit phone number, like 617-555-0123.";

  // Accepts 617-555-0123, (617) 555 0123, 6175550123, +1 617 555 0123, etc.
  function phoneIsValid(value) {
    const digits = value.replace(/\D/g, "");
    return /^[\d\s().+-]+$/.test(value) && (digits.length === 10 || (digits.length === 11 && digits[0] === "1"));
  }

  // The form can't be sent until the phone is valid and there's a phone or an email.
  function checkContact(form) {
    const phone = form.elements.Phone;
    const value = phone.value.trim();
    let message = "";
    if (value && !phoneIsValid(value)) message = PHONE_MESSAGE;
    else if (!value && !form.elements.Email.value.trim()) message = "Please give us a phone number or an email.";
    phone.setCustomValidity(message);
  }

  function setupPhone(form) {
    const phone = form.elements.Phone;
    const error = $('[data-error-for="Phone"]', form);
    const showError = () => {
      const value = phone.value.trim();
      error.textContent = value && !phoneIsValid(value) ? PHONE_MESSAGE : "";
    };
    phone.addEventListener("change", () => {
      const value = phone.value.trim();
      if (phoneIsValid(value)) {
        const digits = value.replace(/\D/g, "").slice(-10);
        phone.value = digits.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
      }
      showError();
    });
    phone.addEventListener("invalid", showError);
    phone.addEventListener("input", () => {
      if (error.textContent) showError();
    });
  }

  // -------------------------------------------------------------- Sending

  function setStatus(form, message, type) {
    const status = $(".form-status", form);
    status.textContent = message || "";
    status.dataset.type = type || "";
  }

  function setHidden(form, name, value) {
    let input = form.elements.namedItem(name);
    if (!input) {
      input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      form.append(input);
    }
    input.value = value;
  }

  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const f = form.elements;

    const est = renderEstimate(form);
    if (est.problem) {
      setStatus(form, est.problem, "error");
      return;
    }
    setHidden(form, "Estimate", est.total);
    setHidden(form, "Estimate details", est.lines.map(([k, v]) => k + ": " + v).join("; "));

    if (!C.formEndpoint) {
      setStatus(form, "Online booking isn't switched on yet, so this request was not sent." + contactSentence(), "info");
      return;
    }

    const button = $('button[type="submit"]', form);
    button.disabled = true;
    button.textContent = "Sending…";
    setStatus(form, "");
    try {
      const response = await fetch(C.formEndpoint, { method: "POST", body: new FormData(form) });
      const result = await response.json();
      if (result.result !== "success") throw new Error(result.error || "Request failed");
      const firstName = f.Name.value.trim().split(/\s+/)[0];
      form.reset();
      checkContact(form);
      renderEstimate(form);
      setStatus(form, "Thanks" + (firstName ? ", " + firstName : "") + "! We got your request and will be in touch soon to confirm.", "success");
    } catch (err) {
      setStatus(form, "Sorry, something went wrong and your request wasn't sent. Please try again." + contactSentence(), "error");
    } finally {
      button.disabled = false;
      button.textContent = "Send request";
    }
  }

  $$("form.booking").forEach((form) => {
    const update = (event) => {
      if (event.target.name === "Phone" || event.target.name === "Email") checkContact(form);
      renderEstimate(form);
    };
    setupPhone(form);
    form.addEventListener("input", update);
    form.addEventListener("change", update);
    form.addEventListener("submit", submit);
    checkContact(form);
    renderEstimate(form);
  });

  renderContact();
  window.addEventListener("hashchange", showPage);
  showPage();
})();
