/* =========================================================
   RO'LYFE RELOCATION INTELLIGENCE CENTER™
   UI Controller
   File: /js/rolyfe-ui.js
   Version: 1.0.0

   PURPOSE
   ---------------------------------------------------------
   Presentation + interaction layer for the RO'Lyfe platform.

   This file intentionally does NOT replace:
   - AI engine
   - Advisor engine
   - Location Analysis
   - Property Analysis
   - Calculator engine
   - Calendar engine
   - Media engine
   - Funding router

   It provides:
   - UI state
   - AI welcome experience
   - floating AI control
   - modal/drawer handling
   - accordions
   - date/time
   - workflow progress
   - local session persistence
   - calculator/calendar launch hooks
   - safe integration with existing RO'Lyfe modules

   ========================================================= */

(function (window, document) {
  "use strict";

  /* =========================================================
     CONFIGURATION
     ========================================================= */

  const CONFIG = {
    version: "1.0.0",

    storageKey: "rolyfe-ui-state-v1",
    sessionKey: "rolyfe-ui-session-v1",

    welcomeDuration: 4800,

    timeRefresh: 1000,

    animationDuration: 220,

    mobileBreakpoint: 768,

    defaultState: {
      location: "",
      purpose: "",
      priorities: [],
      workflowStep: 1,
      aiOpened: false,
      welcomeSeen: false,
      lastUpdated: null
    }
  };


  /* =========================================================
     STATE
     ========================================================= */

  let state = loadState();

  let welcomeTimer = null;

  let activeModal = null;

  let activeDrawer = null;


  /* =========================================================
     DOM HELPERS
     ========================================================= */

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $$(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function exists(element) {
    return !!element;
  }


  /* =========================================================
     STORAGE
     ========================================================= */

  function loadState() {
    try {
      const raw = localStorage.getItem(CONFIG.storageKey);

      if (!raw) {
        return Object.assign({}, CONFIG.defaultState);
      }

      const parsed = JSON.parse(raw);

      return Object.assign(
        {},
        CONFIG.defaultState,
        parsed
      );
    } catch (error) {
      return Object.assign({}, CONFIG.defaultState);
    }
  }


  function saveState() {
    try {
      state.lastUpdated = new Date().toISOString();

      localStorage.setItem(
        CONFIG.storageKey,
        JSON.stringify(state)
      );
    } catch (error) {
      /* Storage may be unavailable. UI should continue working. */
    }

    updateSaveIndicators();
  }


  function sessionGet(key) {
    try {
      return sessionStorage.getItem(
        CONFIG.sessionKey + ":" + key
      );
    } catch (error) {
      return null;
    }
  }


  function sessionSet(key, value) {
    try {
      sessionStorage.setItem(
        CONFIG.sessionKey + ":" + key,
        String(value)
      );
    } catch (error) {
      /* Ignore unavailable session storage. */
    }
  }


  /* =========================================================
     PUBLIC STATE ACCESS
     ========================================================= */

  function getState() {
    return Object.assign({}, state);
  }


  function setState(updates) {
    if (!updates || typeof updates !== "object") {
      return;
    }

    state = Object.assign({}, state, updates);

    saveState();

    updateWorkflowProgress();
  }


  function resetState() {
    state = Object.assign({}, CONFIG.defaultState);

    try {
      localStorage.removeItem(CONFIG.storageKey);
    } catch (error) {
      /* Ignore. */
    }

    updateWorkflowProgress();
    updateSaveIndicators();
  }


  /* =========================================================
     DATE / TIME
     ========================================================= */

  function formatDate(date) {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(date);
  }


  function formatTime(date) {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit"
    }).format(date);
  }


  function updateClock() {
    const now = new Date();

    const dateText = formatDate(now);
    const timeText = formatTime(now);

    const dateTargets = [
      "[data-rolyfe-date]",
      "#rolyfe-date",
      "#current-date",
      ".current-date"
    ];

    const timeTargets = [
      "[data-rolyfe-time]",
      "#rolyfe-time",
      "#current-time",
      ".current-time"
    ];

    dateTargets.forEach(function (selector) {
      $$(selector).forEach(function (element) {
        element.textContent = dateText;
      });
    });

    timeTargets.forEach(function (selector) {
      $$(selector).forEach(function (element) {
        element.textContent = timeText;
      });
    });

    $$( "[data-rolyfe-datetime]" ).forEach(function (element) {
      element.textContent =
        dateText + " • " + timeText;
    });
  }


  function startClock() {
    updateClock();

    window.setInterval(
      updateClock,
      CONFIG.timeRefresh
    );
  }


  /* =========================================================
     SCROLL
     ========================================================= */

  function scrollToTarget(target) {
    if (!target) {
      return;
    }

    let element = null;

    if (typeof target === "string") {
      element = $(target) || byId(target.replace(/^#/, ""));
    } else {
      element = target;
    }

    if (!element) {
      return;
    }

    element.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }


  /* =========================================================
     MODAL SYSTEM
     ========================================================= */

  function createModal(title, content, options) {
    options = options || {};

    closeModal();

    const modal = document.createElement("div");

    modal.className =
      "rolyfe-modal" +
      (options.className
        ? " " + options.className
        : "");

    modal.setAttribute(
      "role",
      "dialog"
    );

    modal.setAttribute(
      "aria-modal",
      "true"
    );

    modal.innerHTML = `
      <div class="rolyfe-modal-backdrop" data-modal-close></div>

      <div class="rolyfe-modal-panel">
        <div class="rolyfe-modal-header">

          <div class="rolyfe-modal-title">
            ${escapeHTML(title || "RO'Lyfe")}
          </div>

          <button
            type="button"
            class="rolyfe-modal-close"
            aria-label="Close"
            data-modal-close
          >
            ×
          </button>

        </div>

        <div class="rolyfe-modal-body">
          ${content || ""}
        </div>

      </div>
    `;

    document.body.appendChild(modal);

    document.body.classList.add(
      "rolyfe-modal-open"
    );

    activeModal = modal;

    requestAnimationFrame(function () {
      modal.classList.add("is-open");
    });

    $$( "[data-modal-close]", modal ).forEach(
      function (button) {
        button.addEventListener(
          "click",
          closeModal
        );
      }
    );

    return modal;
  }


  function closeModal() {
    if (!activeModal) {
      return;
    }

    const modal = activeModal;

    modal.classList.remove("is-open");

    window.setTimeout(function () {
      if (modal && modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    }, CONFIG.animationDuration);

    activeModal = null;

    document.body.classList.remove(
      "rolyfe-modal-open"
    );
  }


  /* =========================================================
     DRAWER SYSTEM
     ========================================================= */

  function openDrawer(drawer) {
    if (!drawer) {
      return;
    }

    closeDrawer();

    activeDrawer = drawer;

    drawer.classList.add("is-open");

    drawer.setAttribute(
      "aria-hidden",
      "false"
    );

    document.body.classList.add(
      "rolyfe-drawer-open"
    );
  }


  function closeDrawer() {
    if (!activeDrawer) {
      return;
    }

    activeDrawer.classList.remove("is-open");

    activeDrawer.setAttribute(
      "aria-hidden",
      "true"
    );

    activeDrawer = null;

    document.body.classList.remove(
      "rolyfe-drawer-open"
    );
  }


  /* =========================================================
     ACCORDIONS
     ========================================================= */

  function initializeAccordions() {
    $$(
      "[data-rolyfe-accordion], .rolyfe-accordion"
    ).forEach(function (accordion) {

      const trigger =
        accordion.querySelector(
          "[data-accordion-trigger]"
        ) ||
        accordion.querySelector(
          "button"
        );

      const content =
        accordion.querySelector(
          "[data-accordion-content]"
        ) ||
        accordion.querySelector(
          ".rolyfe-accordion-content"
        );

      if (!trigger || !content) {
        return;
      }

      trigger.setAttribute(
        "aria-expanded",
        accordion.classList.contains("is-open")
          ? "true"
          : "false"
      );

      content.hidden =
        !accordion.classList.contains("is-open");

      trigger.addEventListener(
        "click",
        function () {

          const open =
            accordion.classList.toggle(
              "is-open"
            );

          trigger.setAttribute(
            "aria-expanded",
            open ? "true" : "false"
          );

          content.hidden = !open;
        }
      );
    });
  }


  /* =========================================================
     AI WELCOME EXPERIENCE
     ========================================================= */

  function findAIWidget() {
    return (
      byId("rolyfe-ai-widget") ||
      byId("ai-widget") ||
      $("[data-rolyfe-ai-widget]") ||
      $(".rolyfe-ai-widget")
    );
  }


  function findAIButton() {
    return (
      byId("rolyfe-ai-button") ||
      byId("ai-button") ||
      $("[data-rolyfe-ai]") ||
      $(".rolyfe-ai-button")
    );
  }


  function showAIWelcome() {
    const widget = findAIWidget();

    if (widget) {
      widget.classList.add("is-welcome");

      widget.classList.add("is-open");
    }

    const welcome =
      byId("rolyfe-ai-welcome") ||
      $("[data-rolyfe-ai-welcome]");

    if (welcome) {
      welcome.classList.add("is-visible");
    }

    if (welcomeTimer) {
      clearTimeout(welcomeTimer);
    }

    welcomeTimer = window.setTimeout(
      collapseAI,
      CONFIG.welcomeDuration
    );
  }


  function collapseAI() {
    const widget = findAIWidget();

    if (widget) {
      widget.classList.remove(
        "is-welcome"
      );
    }

    const welcome =
      byId("rolyfe-ai-welcome") ||
      $("[data-rolyfe-ai-welcome]");

    if (welcome) {
      welcome.classList.remove(
        "is-visible"
      );
    }

    state.welcomeSeen = true;

    saveState();
  }


  function openAI() {
    state.aiOpened = true;

    saveState();

    const widget = findAIWidget();

    if (widget) {
      widget.classList.add("is-open");
    }

    const aiPanel =
      byId("rolyfe-ai-panel") ||
      $("[data-rolyfe-ai-panel]");

    if (aiPanel) {
      aiPanel.classList.add(
        "is-open"
      );

      aiPanel.setAttribute(
        "aria-hidden",
        "false"
      );

      return;
    }

    /*
     * If a dedicated AI panel already exists on
     * the page, let the existing AI UI handle it.
     */
    const aiSection =
      byId("ai-advisor") ||
      byId("ai-section") ||
      $("[data-rolyfe-ai-section]");

    if (aiSection) {
      scrollToTarget(aiSection);
    }
  }


  function closeAI() {
    const widget = findAIWidget();

    if (widget) {
      widget.classList.remove(
        "is-open"
      );
    }

    const aiPanel =
      byId("rolyfe-ai-panel") ||
      $("[data-rolyfe-ai-panel]");

    if (aiPanel) {
      aiPanel.classList.remove(
        "is-open"
      );

      aiPanel.setAttribute(
        "aria-hidden",
        "true"
      );
    }
  }


  function initializeAI() {
    const button = findAIButton();

    if (button) {
      button.addEventListener(
        "click",
        function () {

          const widget = findAIWidget();

          if (
            widget &&
            widget.classList.contains("is-open")
          ) {
            closeAI();
          } else {
            openAI();
          }
        }
      );
    }

    $$(
      "[data-rolyfe-ai-open]"
    ).forEach(function (button) {
      button.addEventListener(
        "click",
        openAI
      );
    });

    $$(
      "[data-rolyfe-ai-close]"
    ).forEach(function (button) {
      button.addEventListener(
        "click",
        closeAI
      );
    });

    /*
     * First landing welcome.
     *
     * sessionStorage prevents the welcome animation
     * from appearing every time a user clicks around
     * during the same session.
     */
    const seenThisSession =
      sessionGet("welcome");

    if (
      !seenThisSession &&
      !state.welcomeSeen
    ) {
      sessionSet("welcome", "true");

      window.setTimeout(
        showAIWelcome,
        700
      );
    }
  }


  /* =========================================================
     PURPOSE / LOCATION / PRIORITY INPUTS
     ========================================================= */

  function initializeInputs() {

    $$(
      "[data-rolyfe-location]"
    ).forEach(function (input) {

      if (state.location) {
        input.value = state.location;
      }

      input.addEventListener(
        "input",
        function () {
          state.location =
            input.value.trim();

          saveState();
        }
      );
    });


    $$(
      "[data-rolyfe-purpose]"
    ).forEach(function (input) {

      if (
        input.value === state.purpose
      ) {
        input.checked = true;
      }

      input.addEventListener(
        "change",
        function () {

          if (input.checked) {
            state.purpose =
              input.value;

            saveState();

            updateWorkflowProgress();
          }
        }
      );
    });


    $$(
      "[data-rolyfe-priority]"
    ).forEach(function (input) {

      if (
        Array.isArray(state.priorities) &&
        state.priorities.includes(
          input.value
        )
      ) {
        input.checked = true;
      }

      input.addEventListener(
        "change",
        function () {

          const priorities =
            new Set(
              Array.isArray(state.priorities)
                ? state.priorities
                : []
            );

          if (input.checked) {
            priorities.add(
              input.value
            );
          } else {
            priorities.delete(
              input.value
            );
          }

          state.priorities =
            Array.from(priorities);

          saveState();

          updateWorkflowProgress();
        }
      );
    });
  }


  /* =========================================================
     WORKFLOW PROGRESS
     ========================================================= */

  function calculateWorkflowStep() {

    let completed = 0;

    if (state.location) {
      completed++;
    }

    if (state.purpose) {
      completed++;
    }

    if (
      Array.isArray(state.priorities) &&
      state.priorities.length
    ) {
      completed++;
    }

    if (state.aiOpened) {
      completed++;
    }

    if (completed === 0) {
      return 1;
    }

    if (completed === 1) {
      return 2;
    }

    if (completed === 2) {
      return 3;
    }

    if (completed === 3) {
      return 4;
    }

    return 5;
  }


  function updateWorkflowProgress() {

    state.workflowStep =
      calculateWorkflowStep();

    const step =
      state.workflowStep;

    $$(
      "[data-rolyfe-step]"
    ).forEach(function (element) {

      const value =
        parseInt(
          element.getAttribute(
            "data-rolyfe-step"
          ),
          10
        );

      element.classList.toggle(
        "is-active",
        value === step
      );

      element.classList.toggle(
        "is-complete",
        value < step
      );
    });


    $$(
      "[data-rolyfe-progress]"
    ).forEach(function (element) {

      const percent =
        Math.min(
          100,
          Math.max(
            0,
            ((step - 1) / 4) * 100
          )
        );

      element.style.width =
        percent + "%";
    });


    $$(
      "[data-rolyfe-progress-text]"
    ).forEach(function (element) {

      element.textContent =
        Math.round(
          ((step - 1) / 4) * 100
        ) + "%";
    });
  }


  /* =========================================================
     SAVE / RESUME
     ========================================================= */

  function hasSavedAnalysis() {
    return !!(
      state.location ||
      state.purpose ||
      (
        Array.isArray(state.priorities) &&
        state.priorities.length
      )
    );
  }


  function updateSaveIndicators() {

    const saved =
      hasSavedAnalysis();

    $$(
      "[data-rolyfe-saved-analysis]"
    ).forEach(function (element) {

      element.classList.toggle(
        "is-visible",
        saved
      );

      element.setAttribute(
        "aria-hidden",
        saved ? "false" : "true"
      );
    });


    $$(
      "[data-rolyfe-saved-location]"
    ).forEach(function (element) {
      element.textContent =
        state.location ||
        "Location not selected";
    });


    $$(
      "[data-rolyfe-saved-purpose]"
    ).forEach(function (element) {
      element.textContent =
        state.purpose ||
        "Purpose not selected";
    });


    $$(
      "[data-rolyfe-last-updated]"
    ).forEach(function (element) {

      if (!state.lastUpdated) {
        element.textContent =
          "Not saved yet";
        return;
      }

      const date =
        new Date(
          state.lastUpdated
        );

      element.textContent =
        "Updated " +
        formatDate(date);
    });
  }


  function resumeAnalysis() {

    if (state.location) {

      $$(
        "[data-rolyfe-location]"
      ).forEach(function (input) {
        input.value =
          state.location;
      });
    }

    if (state.purpose) {

      $$(
        "[data-rolyfe-purpose]"
      ).forEach(function (input) {

        input.checked =
          input.value ===
          state.purpose;
      });
    }

    if (
      Array.isArray(state.priorities)
    ) {

      $$(
        "[data-rolyfe-priority]"
      ).forEach(function (input) {

        input.checked =
          state.priorities.includes(
            input.value
          );
      });
    }

    updateWorkflowProgress();

    const workspace =
      byId("location-workspace") ||
      byId("location-intelligence") ||
      $("[data-rolyfe-workspace]");

    if (workspace) {
      scrollToTarget(workspace);
    }
  }


  /* =========================================================
     CALCULATOR LAUNCHER
     ========================================================= */

  function openStandardCalculator() {

    /*
     * First try the existing calculator engine.
     */

    if (
      window.ROlyfeCalculator &&
      typeof window.ROlyfeCalculator.open ===
        "function"
    ) {
      window.ROlyfeCalculator.open();

      return;
    }


    if (
      window.ROLYFE_CALCULATOR &&
      typeof window.ROLYFE_CALCULATOR.open ===
        "function"
    ) {
      window.ROLYFE_CALCULATOR.open();

      return;
    }


    /*
     * Otherwise expose a UI shell.
     */

    createModal(
      "RO'Lyfe Calculator",
      `
        <div class="rolyfe-calculator-shell">

          <div class="rolyfe-form-group">
            <label>Amount</label>
            <input
              type="number"
              id="rolyfe-standard-amount"
              placeholder="0"
              inputmode="decimal"
            />
          </div>

          <div class="rolyfe-form-group">
            <label>Rate %</label>
            <input
              type="number"
              id="rolyfe-standard-rate"
              placeholder="0"
              step="0.01"
              inputmode="decimal"
            />
          </div>

          <div class="rolyfe-form-group">
            <label>Term</label>
            <input
              type="number"
              id="rolyfe-standard-term"
              placeholder="12"
              value="12"
              inputmode="numeric"
            />
          </div>

          <button
            type="button"
            class="rolyfe-btn rolyfe-btn-primary"
            id="rolyfe-run-standard-calculator"
          >
            Calculate
          </button>

          <div
            class="rolyfe-calculator-result"
            id="rolyfe-standard-result"
          >
            Enter your numbers and calculate.
          </div>

        </div>
      `
    );


    const calculateButton =
      byId(
        "rolyfe-run-standard-calculator"
      );

    if (calculateButton) {
      calculateButton.addEventListener(
        "click",
        runStandardCalculator
      );
    }
  }


  function runStandardCalculator() {

    const amount =
      Number(
        byId(
          "rolyfe-standard-amount"
        )?.value || 0
      );

    const rate =
      Number(
        byId(
          "rolyfe-standard-rate"
        )?.value || 0
      );

    const term =
      Number(
        byId(
          "rolyfe-standard-term"
        )?.value || 12
      );

    const result =
      byId(
        "rolyfe-standard-result"
      );

    if (!result) {
      return;
    }

    if (
      amount <= 0 ||
      term <= 0
    ) {
      result.textContent =
        "Enter a valid amount and term.";

      return;
    }

    const monthlyRate =
      rate / 100 / 12;

    let payment = 0;

    if (monthlyRate === 0) {

      payment =
        amount / term;

    } else {

      payment =
        amount *
        (
          monthlyRate *
          Math.pow(
            1 + monthlyRate,
            term
          )
        ) /
        (
          Math.pow(
            1 + monthlyRate,
            term
          ) - 1
        );
    }

    result.innerHTML = `
      <strong>Estimated Payment</strong>
      <div class="rolyfe-result-number">
        ${formatCurrency(payment)}
      </div>
      <small>
        Illustrative calculation only.
      </small>
    `;
  }


  /* =========================================================
     3-TIER REAL ESTATE OFFER CALCULATOR
     ========================================================= */

  function openOfferCalculator() {

    if (
      window.ROlyfeCalculator &&
      typeof window.ROlyfeCalculator.openOfferCalculator ===
        "function"
    ) {
      window.ROlyfeCalculator.openOfferCalculator();

      return;
    }


    createModal(
      "3-Tier Real Estate Offer Calculator",
      `
        <div class="rolyfe-offer-calculator">

          <p class="rolyfe-muted">
            Enter an estimated ARV. RO'Lyfe will
            calculate three illustrative offer
            scenarios using the current platform
            defaults.
          </p>

          <div class="rolyfe-form-group">
            <label for="rolyfe-arv">
              After Repair Value (ARV)
            </label>

            <input
              id="rolyfe-arv"
              type="number"
              placeholder="395000"
              inputmode="decimal"
            />
          </div>

          <button
            type="button"
            class="rolyfe-btn rolyfe-btn-primary"
            id="rolyfe-calculate-offers"
          >
            Calculate 3 Offers
          </button>

          <div
            id="rolyfe-offer-results"
            class="rolyfe-offer-results"
          ></div>

        </div>
      `
    );


    const button =
      byId(
        "rolyfe-calculate-offers"
      );

    if (button) {
      button.addEventListener(
        "click",
        calculateThreeTierOffers
      );
    }
  }


  function calculateThreeTierOffers() {

    const arv =
      Number(
        byId(
          "rolyfe-arv"
        )?.value || 0
      );

    const output =
      byId(
        "rolyfe-offer-results"
      );

    if (!output) {
      return;
    }

    if (arv <= 0) {
      output.innerHTML = `
        <div class="rolyfe-alert">
          Enter a valid ARV first.
        </div>
      `;

      return;
    }


    const cash =
      arv * 0.50;

    const sellerCarry =
      arv * 0.65;

    const sellerFinance =
      arv * 0.75;


    output.innerHTML = `

      <div class="rolyfe-offer-grid">

        <article class="rolyfe-offer-card">

          <span class="rolyfe-offer-label">
            Tier 1
          </span>

          <h3>All Cash Offer</h3>

          <div class="rolyfe-offer-number">
            ${formatCurrency(cash)}
          </div>

          <p>
            50% of ARV
          </p>

        </article>


        <article class="rolyfe-offer-card">

          <span class="rolyfe-offer-label">
            Tier 2
          </span>

          <h3>Seller Carry</h3>

          <div class="rolyfe-offer-number">
            ${formatCurrency(sellerCarry)}
          </div>

          <p>
            65% of ARV
          </p>

          <p>
            5% down • 5% interest • 4-year term
          </p>

        </article>


        <article class="rolyfe-offer-card">

          <span class="rolyfe-offer-label">
            Tier 3
          </span>

          <h3>Seller Financing</h3>

          <div class="rolyfe-offer-number">
            ${formatCurrency(sellerFinance)}
          </div>

          <p>
            75% of ARV
          </p>

          <p>
            6% interest • 5-year balloon
          </p>

        </article>

      </div>

      <div class="rolyfe-alert">
        These are illustrative starting scenarios,
        not financing commitments or guaranteed
        deal values.
      </div>
    `;
  }


  /* =========================================================
     CALENDAR LAUNCHER
     ========================================================= */

  function openCalendar() {

    if (
      window.ROlyfeCalendar &&
      typeof window.ROlyfeCalendar.open ===
        "function"
    ) {
      window.ROlyfeCalendar.open();

      return;
    }


    if (
      window.ROLYFE_CALENDAR &&
      typeof window.ROLYFE_CALENDAR.open ===
        "function"
    ) {
      window.ROLYFE_CALENDAR.open();

      return;
    }


    createModal(
      "RO'Lyfe Calendar",
      `
        <div class="rolyfe-calendar-shell">

          <label for="rolyfe-calendar-date">
            Select a date
          </label>

          <input
            id="rolyfe-calendar-date"
            type="date"
          />

          <div class="rolyfe-calendar-actions">

            <button
              type="button"
              class="rolyfe-btn rolyfe-btn-primary"
              data-modal-close
            >
              Save Date
            </button>

          </div>

        </div>
      `
    );
  }


  /* =========================================================
     MEDIA
     ========================================================= */

  function openMedia() {

    const media =
      byId("media") ||
      byId("live-media") ||
      $("[data-rolyfe-media]");

    if (media) {
      scrollToTarget(media);

      return;
    }

    createModal(
      "RO'Lyfe Live Media",
      `
        <div class="rolyfe-media-modal">

          <p>
            Live news, weather and market
            intelligence can be accessed through
            the RO'Lyfe media center.
          </p>

          <div class="rolyfe-media-actions">

            <button
              type="button"
              class="rolyfe-btn"
              data-modal-close
            >
              Close
            </button>

          </div>

        </div>
      `
    );
  }


  /* =========================================================
     FUNDING
     ========================================================= */

  function openFunding() {

    const funding =
      byId("funding") ||
      byId("funding-center") ||
      $("[data-rolyfe-funding]");

    if (funding) {
      scrollToTarget(funding);

      return;
    }

    createModal(
      "RO'Lyfe Funding Center",
      `
        <div class="rolyfe-funding-modal">

          <p>
            Funding pathways can be routed based
            on your purpose, property and business
            profile.
          </p>

          <p class="rolyfe-muted">
            Funding decisions, terms and approval
            requirements are determined by the
            applicable funding provider.
          </p>

        </div>
      `
    );
  }


  /* =========================================================
     LEARN MORE / EXPLAINERS
     ========================================================= */

  const EXPLAINERS = {

    location: {
      title: "Location Intelligence",
      text:
        "RO'Lyfe examines a location as a complete environment rather than relying on a single metric. The platform can organize location, housing, cost, climate, risk, incentives and opportunity information so you can examine the tradeoffs."
    },

    climate: {
      title: "Climate Intelligence",
      text:
        "Climate intelligence helps you understand weather patterns, seasonal conditions and environmental considerations associated with a location."
    },

    risk: {
      title: "Risk Intelligence",
      text:
        "Risk intelligence organizes relevant disaster and environmental considerations such as flooding, severe weather and other location-specific risks. Results should be verified against authoritative sources before making major decisions."
    },

    property: {
      title: "Property Intelligence",
      text:
        "Property intelligence can organize property information, estimated financial inputs, deal assumptions, comparable information and potential tradeoffs for further review."
    },

    financial: {
      title: "Financial & Cost Intelligence",
      text:
        "Financial intelligence helps organize housing costs, relocation costs, financing assumptions and other inputs that can affect the economics of a move, property or business decision."
    },

    opportunity: {
      title: "Opportunity Intelligence",
      text:
        "Opportunity intelligence connects location analysis with incentives, business activity, funding pathways and other potential opportunities. Availability and qualification should always be independently verified."
    },

    ai: {
      title: "RO'Lyfe AI",
      text:
        "RO'Lyfe AI is the interpretation layer across the intelligence system. It helps organize information, identify gaps, surface tradeoffs and explain what additional information may be needed."
    }

  };


  function openExplainer(key) {

    const data =
      EXPLAINERS[key];

    if (!data) {
      return;
    }

    createModal(
      data.title,
      `
        <div class="rolyfe-explainer">

          <p>
            ${escapeHTML(data.text)}
          </p>

        </div>
      `
    );
  }


  function initializeExplainers() {

    $$(
      "[data-rolyfe-explain]"
    ).forEach(function (button) {

      button.addEventListener(
        "click",
        function () {

          openExplainer(
            button.getAttribute(
              "data-rolyfe-explain"
            )
          );

        }
      );
    });
  }


  /* =========================================================
     BUTTON ROUTING
     ========================================================= */

  function initializeActionButtons() {

    $$(
      "[data-rolyfe-action]"
    ).forEach(function (button) {

      button.addEventListener(
        "click",
        function () {

          const action =
            button.getAttribute(
              "data-rolyfe-action"
            );

          switch (action) {

            case "ai":
              openAI();
              break;

            case "calculator":
              openStandardCalculator();
              break;

            case "offer-calculator":
              openOfferCalculator();
              break;

            case "calendar":
              openCalendar();
              break;

            case "media":
              openMedia();
              break;

            case "funding":
              openFunding();
              break;

            case "resume":
              resumeAnalysis();
              break;

            case "close-modal":
              closeModal();
              break;

            case "close-drawer":
              closeDrawer();
              break;

            default:

              if (
                action &&
                action.charAt(0) === "#"
              ) {
                scrollToTarget(action);
              }

              break;
          }
        }
      );
    });
  }


  /* =========================================================
     NAVIGATION
     ========================================================= */

  function initializeNavigation() {

    $$(
      "a[href^='#']"
    ).forEach(function (link) {

      link.addEventListener(
        "click",
        function (event) {

          const href =
            link.getAttribute(
              "href"
            );

          if (
            !href ||
            href === "#"
          ) {
            return;
          }

          const target =
            $(href);

          if (!target) {
            return;
          }

          event.preventDefault();

          scrollToTarget(target);
        }
      );
    });
  }


  /* =========================================================
     MOBILE MENU
     ========================================================= */

  function initializeMobileMenu() {

    const toggle =
      byId("rolyfe-mobile-menu") ||
      $("[data-rolyfe-mobile-menu]");

    const menu =
      byId("rolyfe-nav") ||
      byId("main-nav") ||
      $("[data-rolyfe-nav]");

    if (!toggle || !menu) {
      return;
    }

    toggle.addEventListener(
      "click",
      function () {

        const open =
          menu.classList.toggle(
            "is-open"
          );

        toggle.setAttribute(
          "aria-expanded",
          open ? "true" : "false"
        );
      }
    );


    $$(
      "a",
      menu
    ).forEach(function (link) {

      link.addEventListener(
        "click",
        function () {

          menu.classList.remove(
            "is-open"
          );

          toggle.setAttribute(
            "aria-expanded",
            "false"
          );
        }
      );
    });
  }


  /* =========================================================
     KEYBOARD SUPPORT
     ========================================================= */

  function initializeKeyboard() {

    document.addEventListener(
      "keydown",
      function (event) {

        if (
          event.key === "Escape"
        ) {

          if (activeModal) {
            closeModal();
            return;
          }

          if (activeDrawer) {
            closeDrawer();
            return;
          }

          closeAI();
        }
      }
    );
  }


  /* =========================================================
     CLICK OUTSIDE AI
     ========================================================= */

  function initializeOutsideClick() {

    document.addEventListener(
      "click",
      function (event) {

        const widget =
          findAIWidget();

        if (
          !widget ||
          !widget.classList.contains(
            "is-open"
          )
        ) {
          return;
        }

        if (
          widget.contains(
            event.target
          )
        ) {
          return;
        }

        const clickedAITrigger =
          event.target.closest(
            "[data-rolyfe-ai], [data-rolyfe-ai-open]"
          );

        if (
          clickedAITrigger
        ) {
          return;
        }

        closeAI();
      }
    );
  }


  /* =========================================================
     ACCESSIBILITY
     ========================================================= */

  function initializeAccessibility() {

    $$(
      "[data-rolyfe-tooltip]"
    ).forEach(function (element) {

      const text =
        element.getAttribute(
          "data-rolyfe-tooltip"
        );

      if (!text) {
        return;
      }

      element.setAttribute(
        "title",
        text
      );

      element.setAttribute(
        "aria-label",
        text
      );
    });


    $$(
      "button"
    ).forEach(function (button) {

      if (
        !button.getAttribute(
          "type"
        )
      ) {
        button.setAttribute(
          "type",
          "button"
        );
      }
    });
  }


  /* =========================================================
     FORM HELPERS
     ========================================================= */

  function bindFormPersistence() {

    $$(
      "input[data-rolyfe-persist], textarea[data-rolyfe-persist], select[data-rolyfe-persist]"
    ).forEach(function (input) {

      const key =
        input.getAttribute(
          "data-rolyfe-persist"
        );

      if (!key) {
        return;
      }

      try {

        const saved =
          localStorage.getItem(
            "rolyfe-field-" + key
          );

        if (
          saved !== null &&
          !input.value
        ) {
          input.value =
            saved;
        }

      } catch (error) {
        /* Ignore. */
      }


      input.addEventListener(
        "input",
        function () {

          try {
            localStorage.setItem(
              "rolyfe-field-" + key,
              input.value
            );
          } catch (error) {
            /* Ignore. */
          }

        }
      );
    });
  }


  /* =========================================================
     ANALYSIS HANDOFF
     ========================================================= */

  function buildAnalysisContext() {

    return {
      location:
        state.location || "",

      purpose:
        state.purpose || "",

      priorities:
        Array.isArray(
          state.priorities
        )
          ? state.priorities.slice()
          : [],

      timestamp:
        new Date().toISOString()
    };
  }


  function handoffToAI() {

    const context =
      buildAnalysisContext();


    /*
     * Preferred master AI engine.
     */

    if (
      window.ROlyfeAI &&
      typeof window.ROlyfeAI.setLocation ===
        "function"
    ) {

      if (
        context.location
      ) {
        window.ROlyfeAI.setLocation(
          context.location
        );
      }

      if (
        typeof window.ROlyfeAI.setPreferences ===
          "function"
      ) {
        window.ROlyfeAI.setPreferences({
          purpose:
            context.purpose,

          priorities:
            context.priorities
        });
      }

      return true;
    }


    /*
     * Legacy/global aliases.
     */

    if (
      window.ROLYFE_AI &&
      typeof window.ROLYFE_AI.setLocation ===
        "function"
    ) {

      if (
        context.location
      ) {
        window.ROLYFE_AI.setLocation(
          context.location
        );
      }

      if (
        typeof window.ROLYFE_AI.setPreferences ===
          "function"
      ) {
        window.ROLYFE_AI.setPreferences({
          purpose:
            context.purpose,

          priorities:
            context.priorities
        });
      }

      return true;
    }


    return false;
  }


  function initializeAnalysisButtons() {

    $$(
      "[data-rolyfe-analyze]"
    ).forEach(function (button) {

      button.addEventListener(
        "click",
        function () {

          /*
           * Make sure latest form values are
           * captured before handing off.
           */

          $$(
            "[data-rolyfe-location]"
          ).forEach(function (input) {

            if (input.value.trim()) {
              state.location =
                input.value.trim();
            }

          });


          $$(
            "[data-rolyfe-purpose]"
          ).forEach(function (input) {

            if (input.checked) {
              state.purpose =
                input.value;
            }

          });


          state.aiOpened = true;

          saveState();

          const connected =
            handoffToAI();

          updateWorkflowProgress();

          if (!connected) {
            openAI();
          }

        }
      );
    });
  }


  /* =========================================================
     RESIZE / RESPONSIVE STATE
     ========================================================= */

  function updateResponsiveState() {

    const isMobile =
      window.innerWidth <=
      CONFIG.mobileBreakpoint;

    document.documentElement.classList.toggle(
      "rolyfe-mobile",
      isMobile
    );

    document.documentElement.classList.toggle(
      "rolyfe-desktop",
      !isMobile
    );
  }


  function initializeResponsive() {

    updateResponsiveState();

    window.addEventListener(
      "resize",
      updateResponsiveState
    );
  }


  /* =========================================================
     GLOBAL UI EVENTS
     ========================================================= */

  function initializeGlobalEvents() {

    document.addEventListener(
      "click",
      function (event) {

        const explainer =
          event.target.closest(
            "[data-rolyfe-explain]"
          );

        if (explainer) {
          return;
        }

        const close =
          event.target.closest(
            "[data-rolyfe-close]"
          );

        if (close) {

          closeModal();
          closeDrawer();
          closeAI();

        }
      }
    );
  }


  /* =========================================================
     SAFE HTML
     ========================================================= */

  function escapeHTML(value) {

    return String(value)
      .replace(
        /&/g,
        "&amp;"
      )
      .replace(
        /</g,
        "&lt;"
      )
      .replace(
        />/g,
        "&gt;"
      )
      .replace(
        /"/g,
        "&quot;"
      )
      .replace(
        /'/g,
        "&#039;"
      );
  }


  /* =========================================================
     FORMATTING
     ========================================================= */

  function formatCurrency(value) {

    return new Intl.NumberFormat(
      "en-US",
      {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0
      }
    ).format(
      Number(value) || 0
    );
  }


  /* =========================================================
     PUBLIC API
     ========================================================= */

  const ROlyfeUI = {

    version:
      CONFIG.version,

    config:
      CONFIG,

    init:
      initialize,

    getState:
      getState,

    setState:
      setState,

    resetState:
      resetState,

    saveState:
      saveState,

    openAI:
      openAI,

    closeAI:
      closeAI,

    showAIWelcome:
      showAIWelcome,

    collapseAI:
      collapseAI,

    openModal:
      createModal,

    closeModal:
      closeModal,

    openDrawer:
      openDrawer,

    closeDrawer:
      closeDrawer,

    openStandardCalculator:
      openStandardCalculator,

    openOfferCalculator:
      openOfferCalculator,

    openCalendar:
      openCalendar,

    openMedia:
      openMedia,

    openFunding:
      openFunding,

    openExplainer:
      openExplainer,

    scrollTo:
      scrollToTarget,

    resumeAnalysis:
      resumeAnalysis,

    buildAnalysisContext:
      buildAnalysisContext,

    handoffToAI:
      handoffToAI,

    updateClock:
      updateClock,

    updateWorkflowProgress:
      updateWorkflowProgress
  };


  /* =========================================================
     GLOBAL EXPORTS
     ========================================================= */

  window.ROlyfeUI =
    ROlyfeUI;

  window.ROLYFE_UI =
    ROlyfeUI;


  /* =========================================================
     INITIALIZATION
     ========================================================= */

  function initialize() {

    if (
      document.documentElement
        .hasAttribute(
          "data-rolyfe-ui-ready"
        )
    ) {
      return;
    }

    document.documentElement.setAttribute(
      "data-rolyfe-ui-ready",
      "true"
    );


    startClock();

    initializeAI();

    initializeInputs();

    initializeAccordions();

    initializeExplainers();

    initializeActionButtons();

    initializeAnalysisButtons();

    initializeNavigation();

    initializeMobileMenu();

    initializeKeyboard();

    initializeOutsideClick();

    initializeAccessibility();

    bindFormPersistence();

    initializeResponsive();

    initializeGlobalEvents();

    updateWorkflowProgress();

    updateSaveIndicators();


    /*
     * Give existing engines a chance to initialize
     * before attempting a handoff.
     */

    window.setTimeout(
      function () {

        if (
          state.location ||
          state.purpose
        ) {
          handoffToAI();
        }

      },
      100
    );
  }


  /* =========================================================
     DOM READY
     ========================================================= */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      initialize
    );

  } else {

    initialize();

  }


})(window, document);
