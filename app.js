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
    document.title = page.dataset.title
      ? page.dataset.title + " · A Squared Services"
      : "A Squared Services";
    $$(".tab").forEach((tab) => {
      if (tab.getAttribute("href") === "#" + page.id) tab.setAttribute("aria-current", "page");
      else tab.removeAttribute("aria-current");
    });

    if (target && target !== page) {
      const details = $("details", target);
      if (details) details.open = true;
      target.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
    }
  }

  // ------------------------------------------------ Filling in the page

  // Every [data-price="fall.pricePerBag"] shows that price from config.js.
  $$("[data-price]").forEach((el) => {
    const value = lookup(el.dataset.price);
    if (typeof value === "number") el.textContent = money(value);
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
      options: C.paymentMethods.map((m) => ({ value: m })),
    }),
    snowfall: () => ({
      name: "Snowfall",
      checked: 0,
      options: C.winter.snowfall.map((o) => ({
        value: o.label,
        note: o.extra ? "+" + percent(o.extra) : "No extra",
      })),
    }),
    driveway: (plain) => ({
      name: "Driveway",
      checked: plain ? -1 : 1,
      options: C.winter.driveway.map((o) => ({
        value: o.label,
        note: plain ? "" : o.price ? money(o.price) : "$0",
      })),
    }),
    sidewalk: (plain) => ({
      name: "Sidewalk",
      checked: plain ? -1 : 0,
      options: C.winter.sidewalk.map((o) => ({
        value: o.label,
        note: plain ? "" : o.price ? "+" + money(o.price) : "$0",
      })),
    }),
  };

  // Turns <div data-choices="driveway"> into a row of pill-shaped radio buttons.
  $$("[data-choices]").forEach((group) => {
    const set = choiceSets[group.dataset.choices](group.hasAttribute("data-plain"));
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
        };
      }
      const snowCost = base * snowfall.extra;
      const subtotal = base + snowCost;
      const melt = C.winter.snowMelt;
      const meltCost = f["Snow melt"].checked ? (subtotal > melt.freeOver ? 0 : melt.price) : null;

      const lines = [];
      if (driveway && driveway.price) lines.push(["Driveway (" + driveway.label + ")", money(driveway.price)]);
      if (sidewalk && sidewalk.price) lines.push(["Sidewalk", money(sidewalk.price)]);
      lines.push(["Snowfall " + snowfall.label + " (+" + percent(snowfall.extra) + ")", money(snowCost)]);
      lines.push(["Paths to your door", "Free"]);
      if (meltCost !== null) lines.push(["Snow melt", meltCost ? money(meltCost) : "Free"]);
      return {
        lines,
        total: money(subtotal + (meltCost || 0)),
        note: "The final price depends on how much snow actually falls.",
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
        lines: [["Winter Season Pass", money(C.seasonPass.price)]],
        totalLabel: "Total",
        total: money(C.seasonPass.price),
        note: "Covers every snowstorm this winter. We'll reach out to confirm.",
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
        row.append(dt, dd);
        return row;
      })
    );
    $(".summary-total span", form).textContent = est.totalLabel || "Estimated total";
    const total = $(".summary-total strong", form);
    total.textContent = est.total;
    total.classList.toggle("is-text", Boolean(est.isText));
    $(".summary-note", form).textContent = est.note || "";
    return est;
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

    if (!f.Phone.value.trim() && !f.Email.value.trim()) {
      f.Phone.setCustomValidity("Please give us a phone number or an email.");
      f.Phone.reportValidity();
      return;
    }

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
      if (event.target.name === "Phone" || event.target.name === "Email") {
        form.elements.Phone.setCustomValidity("");
      }
      renderEstimate(form);
    };
    form.addEventListener("input", update);
    form.addEventListener("change", update);
    form.addEventListener("submit", submit);
    renderEstimate(form);
  });

  renderContact();
  window.addEventListener("hashchange", showPage);
  showPage();
})();
