/*
 * ============================================================
 * RO'Lyfe AI Intelligence Engine
 * ============================================================
 *
 * File:
 *   /modules/ai/ai.js
 *
 * Purpose:
 *   Central orchestration layer for the RO'Lyfe AI Intelligence
 *   module.
 *
 * Connects:
 *   Location
 *   Climate
 *   Risk
 *   Housing
 *   Property
 *   Financial
 *   Incentives
 *   Business
 *   Opportunity
 *   Advisor
 *
 * This file is intentionally modular.
 *
 * Version: 1.0.0
 * Status: LIVE
 * ============================================================
 */

(function (window) {
  "use strict";

  var VERSION = "1.0.0";

  var MODULE_NAME = "ROlyfeAI";

  var STORAGE_KEY = "rolyfe_ai_intelligence_state_v1";

  var EMPTY_STATE = {
    status: "ready",

    request: {
      location: null,
      purpose: null,
      preferences: null
    },

    location: null,

    intelligence: {
      location: null,
      climate: null,
      risk: null,
      housing: null,
      property: null,
      financial: null,
      incentives: null,
      business: null,
      opportunity: null
    },

    analysis: {
      signals: [],
      findings: [],
      tradeoffs: [],
      gaps: [],
      actions: []
    },

    summary: {
      headline: "",
      overview: "",
      confidence: null
    },

    metadata: {
      version: VERSION,
      createdAt: null,
      updatedAt: null
    }
  };

  var state = clone(EMPTY_STATE);

  /*
   * ------------------------------------------------------------
   * BASIC HELPERS
   * ------------------------------------------------------------
   */

  function clone(value) {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (error) {
      return value;
    }
  }

  function now() {
    return new Date().toISOString();
  }

  function hasValue(value) {
    return (
      value !== undefined &&
      value !== null &&
      value !== ""
    );
  }

  function safeNumber(value, fallback) {
    var number = Number(value);

    return Number.isFinite(number)
      ? number
      : fallback;
  }

  function unique(values) {
    var output = [];

    (values || []).forEach(function (value) {
      if (!hasValue(value)) {
        return;
      }

      if (output.indexOf(value) === -1) {
        output.push(value);
      }
    });

    return output;
  }

  function safeCall(fn, fallback) {
    try {
      if (typeof fn === "function") {
        var result = fn();

        return result === undefined
          ? fallback
          : result;
      }
    } catch (error) {
      console.warn(
        "[RO'Lyfe AI]",
        error
      );
    }

    return fallback;
  }

  function getGlobal(names) {
    for (var i = 0; i < names.length; i++) {
      if (
        window[names[i]] !== undefined &&
        window[names[i]] !== null
      ) {
        return window[names[i]];
      }
    }

    return null;
  }

  /*
   * ------------------------------------------------------------
   * STATE MANAGEMENT
   * ------------------------------------------------------------
   */

  function resetState() {
    state = clone(EMPTY_STATE);

    state.metadata.createdAt = now();
    state.metadata.updatedAt = now();

    return getState();
  }

  function getState() {
    return clone(state);
  }

  function updateState(patch) {
    if (!patch || typeof patch !== "object") {
      return getState();
    }

    Object.keys(patch).forEach(function (key) {
      if (
        patch[key] &&
        typeof patch[key] === "object" &&
        !Array.isArray(patch[key]) &&
        state[key] &&
        typeof state[key] === "object" &&
        !Array.isArray(state[key])
      ) {
        state[key] = Object.assign(
          {},
          state[key],
          patch[key]
        );
      } else {
        state[key] = patch[key];
      }
    });

    state.metadata.updatedAt = now();

    persist();

    return getState();
  }

  function persist() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(state)
      );
    } catch (error) {
      console.warn(
        "[RO'Lyfe AI] Unable to persist state.",
        error
      );
    }
  }

  function restore() {
    try {
      var saved = localStorage.getItem(
        STORAGE_KEY
      );

      if (!saved) {
        return false;
      }

      var parsed = JSON.parse(saved);

      if (
        parsed &&
        typeof parsed === "object"
      ) {
        state = Object.assign(
          clone(EMPTY_STATE),
          parsed
        );

        state.metadata = Object.assign(
          {},
          clone(EMPTY_STATE.metadata),
          parsed.metadata || {}
        );

        return true;
      }

    } catch (error) {
      console.warn(
        "[RO'Lyfe AI] Unable to restore state.",
        error
      );
    }

    return false;
  }

  /*
   * ------------------------------------------------------------
   * REQUEST MANAGEMENT
   * ------------------------------------------------------------
   */

  function setRequest(request) {
    request = request || {};

    state.request = {
      location: hasValue(request.location)
        ? request.location
        : state.request.location,

      purpose: hasValue(request.purpose)
        ? request.purpose
        : state.request.purpose,

      preferences: hasValue(request.preferences)
        ? request.preferences
        : state.request.preferences
    };

    state.metadata.updatedAt = now();

    persist();

    return clone(state.request);
  }

  function setLocation(location) {
    state.location =
      typeof location === "object"
        ? clone(location)
        : {
            query: location
          };

    state.request.location =
      typeof location === "string"
        ? location
        : (
            location &&
            (
              location.query ||
              location.city ||
              location.state ||
              location.zip
            )
          ) || state.request.location;

    state.metadata.updatedAt = now();

    persist();

    return clone(state.location);
  }

  function setPurpose(purpose) {
    state.request.purpose = purpose || null;

    state.metadata.updatedAt = now();

    persist();

    return state.request.purpose;
  }

  function setPreferences(preferences) {
    state.request.preferences =
      typeof preferences === "object"
        ? clone(preferences)
        : preferences || null;

    state.metadata.updatedAt = now();

    persist();

    return clone(state.request.preferences);
  }

  /*
   * ------------------------------------------------------------
   * MODULE DISCOVERY
   * ------------------------------------------------------------
   */

  function discoverModules() {

    return {
      ai: !!getGlobal([
        "ROlyfeAI"
      ]),

      advisor: !!getGlobal([
        "ROlyfeAdvisor",
        "ROLYFE_ADVISOR"
      ]),

      location: !!getGlobal([
        "ROlyfeLocationAnalysis",
        "ROlyfeLocationEngine",
        "ROLYFE_LOCATION_ANALYSIS"
      ]),

      property: !!getGlobal([
        "ROlyfePropertyAnalysis",
        "ROLYFE_PROPERTY_ANALYSIS"
      ]),

      housing: !!getGlobal([
        "ROlyfeHousing",
        "ROlyfeHousingEngine"
      ]),

      climate: !!getGlobal([
        "ROlyfeClimate",
        "ROlyfeClimateEngine"
      ]),

      weather: !!getGlobal([
        "ROlyfeWeather",
        "ROlyfeWeatherEngine"
      ]),

      risk: !!getGlobal([
        "ROlyfeRisk",
        "ROlyfeRiskEngine"
      ]),

      incentives: !!getGlobal([
        "ROlyfeIncentives",
        "ROlyfeIncentiveEngine"
      ]),

      business: !!getGlobal([
        "ROlyfeBusiness",
        "ROlyfeBusinessEngine"
      ]),

      opportunity: !!getGlobal([
        "ROlyfeOpportunityEngine",
        "ROlyfeOpportunity"
      ]),

      core: !!getGlobal([
        "ROlyfeCore",
        "ROLYFE_CORE"
      ])
    };
  }

  /*
   * ------------------------------------------------------------
   * ENGINE STATUS
   * ------------------------------------------------------------
   */

  function getStatus() {

    var modules = discoverModules();

    var loaded = 0;
    var total = 0;

    Object.keys(modules).forEach(function (key) {

      if (key === "ai") {
        return;
      }

      total++;

      if (modules[key]) {
        loaded++;
      }
    });

    return {
      name: MODULE_NAME,
      version: VERSION,
      status: state.status,
      loadedModules: loaded,
      totalModules: total,
      modules: modules,
      initialized: true,
      timestamp: now()
    };
  }

  /*
   * ------------------------------------------------------------
   * GENERIC ENGINE EXECUTION
   * ------------------------------------------------------------
   */

  function callEngine(
    engineNames,
    methodNames,
    payload
  ) {

    var engine = getGlobal(
      engineNames
    );

    if (!engine) {
      return null;
    }

    for (
      var i = 0;
      i < methodNames.length;
      i++
    ) {

      var method =
        engine[methodNames[i]];

      if (typeof method !== "function") {
        continue;
      }

      try {

        return method.call(
          engine,
          payload
        );

      } catch (error) {

        console.warn(
          "[RO'Lyfe AI] Engine method failed:",
          methodNames[i],
          error
        );

      }
    }

    return null;
  }

  /*
   * ------------------------------------------------------------
   * LOCATION INTELLIGENCE
   * ------------------------------------------------------------
   */

  function collectLocationIntelligence(
    location,
    preferences
  ) {

    var payload = {
      location: location,
      preferences: preferences
    };

    var result = callEngine(
      [
        "ROlyfeLocationAnalysis",
        "ROlyfeLocationEngine",
        "ROLYFE_LOCATION_ANALYSIS"
      ],
      [
        "analyze",
        "analyzeLocation",
        "getAnalysis",
        "evaluate",
        "run"
      ],
      payload
    );

    return result || {
      status: "awaiting_data",
      input: clone(payload)
    };
  }

  /*
   * ------------------------------------------------------------
   * PROPERTY INTELLIGENCE
   * ------------------------------------------------------------
   */

  function collectPropertyIntelligence(
    property
  ) {

    if (!property) {
      return {
        status: "missing_property",
        message:
          "A property record is required for property-level analysis."
      };
    }

    var result = callEngine(
      [
        "ROlyfePropertyAnalysis",
        "ROLYFE_PROPERTY_ANALYSIS"
      ],
      [
        "analyzeProperty",
        "analyze",
        "checkDeal",
        "evaluate"
      ],
      property
    );

    return result || {
      status: "awaiting_data",
      input: clone(property)
    };
  }

  /*
   * ------------------------------------------------------------
   * SUPPORTING INTELLIGENCE
   * ------------------------------------------------------------
   */

  function collectSupportingIntelligence(
    location,
    property,
    preferences
  ) {

    var payload = {
      location: location,
      property: property || null,
      preferences: preferences
    };

    return {

      climate:
        callEngine(
          [
            "ROlyfeClimate",
            "ROlyfeClimateEngine"
          ],
          [
            "analyze",
            "analyzeLocation",
            "getAnalysis",
            "evaluate"
          ],
          payload
        ),

      weather:
        callEngine(
          [
            "ROlyfeWeather",
            "ROlyfeWeatherEngine"
          ],
          [
            "analyze",
            "getCurrent",
            "getForecast"
          ],
          payload
        ),

      risk:
        callEngine(
          [
            "ROlyfeRisk",
            "ROlyfeRiskEngine"
          ],
          [
            "analyze",
            "analyzeLocation",
            "getAnalysis",
            "evaluate"
          ],
          payload
        ),

      housing:
        callEngine(
          [
            "ROlyfeHousing",
            "ROlyfeHousingEngine"
          ],
          [
            "analyze",
            "analyzeMarket",
            "getAnalysis",
            "evaluate"
          ],
          payload
        ),

      incentives:
        callEngine(
          [
            "ROlyfeIncentives",
            "ROlyfeIncentiveEngine"
          ],
          [
            "analyze",
            "find",
            "getPrograms",
            "evaluate"
          ],
          payload
        ),

      business:
        callEngine(
          [
            "ROlyfeBusiness",
            "ROlyfeBusinessEngine"
          ],
          [
            "analyze",
            "analyzeMarket",
            "getAnalysis",
            "evaluate"
          ],
          payload
        ),

      opportunity:
        callEngine(
          [
            "ROlyfeOpportunityEngine",
            "ROlyfeOpportunity"
          ],
          [
            "analyze",
            "find",
            "evaluate",
            "run"
          ],
          payload
        )
    };
  }

  /*
   * ------------------------------------------------------------
   * SIGNAL GENERATION
   * ------------------------------------------------------------
   */

  function buildSignals(
    location,
    purpose,
    preferences
  ) {

    var signals = [];

    if (hasValue(location)) {
      signals.push(
        "Location supplied for intelligence analysis."
      );
    }

    if (hasValue(purpose)) {
      signals.push(
        "Primary objective: " +
        purpose +
        "."
      );
    }

    if (hasValue(preferences)) {
      signals.push(
        "User-defined priorities supplied."
      );
    }

    if (
      state.intelligence.location &&
      state.intelligence.location.status ===
        "awaiting_data"
    ) {
      signals.push(
        "Location engine is awaiting structured location data."
      );
    }

    if (
      state.intelligence.property &&
      state.intelligence.property.status ===
        "missing_property"
    ) {
      signals.push(
        "Property-level analysis requires a property record."
      );
    }

    return unique(signals);
  }

  /*
   * ------------------------------------------------------------
   * FINDINGS
   * ------------------------------------------------------------
   */

  function buildFindings() {

    var findings = [];

    var intelligence =
      state.intelligence;

    Object.keys(intelligence).forEach(
      function (key) {

        var item =
          intelligence[key];

        if (!item) {
          return;
        }

        if (
          item.status ===
          "awaiting_data"
        ) {
          findings.push(
            key.charAt(0).toUpperCase() +
            key.slice(1) +
            " intelligence is ready for data integration."
          );
        }

        if (
          item.status ===
          "missing_property"
        ) {
          findings.push(
            "Property intelligence is waiting for property-level inputs."
          );
        }
      }
    );

    return unique(findings);
  }

  /*
   * ------------------------------------------------------------
   * TRADEOFFS
   * ------------------------------------------------------------
   */

  function buildTradeoffs() {

    var tradeoffs = [];

    var preferences =
      state.request.preferences;

    if (hasValue(preferences)) {
      tradeoffs.push(
        "User priorities should be compared across housing, climate, risk and opportunity rather than evaluated independently."
      );
    }

    if (
      state.request.purpose ===
      "Investment"
    ) {
      tradeoffs.push(
        "Investment analysis should distinguish relocation suitability from property economics."
      );
    }

    if (
      state.request.purpose ===
      "Business"
    ) {
      tradeoffs.push(
        "Business opportunity should be considered alongside housing costs, workforce and local risk."
      );
    }

    return unique(tradeoffs);
  }

  /*
   * ------------------------------------------------------------
   * DATA GAPS
   * ------------------------------------------------------------
   */

  function buildGaps() {

    var gaps = [];

    if (!hasValue(
      state.request.location
    )) {
      gaps.push(
        "Location is missing."
      );
    }

    if (!hasValue(
      state.request.purpose
    )) {
      gaps.push(
        "Primary purpose is missing."
      );
    }

    if (
      !state.intelligence.location
    ) {
      gaps.push(
        "Location intelligence has not been collected."
      );
    }

    if (
      !state.intelligence.climate
    ) {
      gaps.push(
        "Climate intelligence has not been collected."
      );
    }

    if (
      !state.intelligence.risk
    ) {
      gaps.push(
        "Risk intelligence has not been collected."
      );
    }

    if (
      !state.intelligence.housing
    ) {
      gaps.push(
        "Housing intelligence has not been collected."
      );
    }

    return unique(gaps);
  }

  /*
   * ------------------------------------------------------------
   * RECOMMENDED ACTIONS
   * ------------------------------------------------------------
   */

  function buildActions() {

    var actions = [];

    if (
      state.request.location
    ) {
      actions.push(
        "Collect structured location data."
      );
    }

    actions.push(
      "Compare housing and cost-of-living conditions."
    );

    actions.push(
      "Evaluate climate and disaster exposure."
    );

    actions.push(
      "Review incentives and local economic opportunity."
    );

    if (
      state.request.purpose ===
      "Property" ||
      state.request.purpose ===
      "Investment"
    ) {
      actions.push(
        "Run property-level analysis when property data is available."
      );
    }

    return unique(actions);
  }

  /*
   * ------------------------------------------------------------
   * SUMMARY
   * ------------------------------------------------------------
   */

  function buildSummary() {

    var location =
      state.request.location ||
      "selected location";

    var purpose =
      state.request.purpose ||
      "research";

    var gaps =
      state.analysis.gaps || [];

    var headline =
      "RO'Lyfe Intelligence prepared for " +
      location;

    var overview =
      "The intelligence layer has received a " +
      purpose.toLowerCase() +
      " request and is organizing location, housing, climate, risk and opportunity data.";

    var confidence =
      gaps.length === 0
        ? "high"
        : gaps.length <= 3
          ? "moderate"
          : "developing";

    return {
      headline: headline,
      overview: overview,
      confidence: confidence
    };
  }

  /*
   * ------------------------------------------------------------
   * MAIN ANALYSIS
   * ------------------------------------------------------------
   */

  function analyze(options) {

    options = options || {};

    var location =
      options.location ||
      state.request.location;

    var purpose =
      options.purpose ||
      state.request.purpose;

    var preferences =
      options.preferences ||
      state.request.preferences;

    var property =
      options.property ||
      null;

    setRequest({
      location: location,
      purpose: purpose,
      preferences: preferences
    });

    if (location) {
      setLocation(location);
    }

    state.status = "analyzing";

    /*
     * Location
     */
    state.intelligence.location =
      collectLocationIntelligence(
        location,
        preferences
      );

    /*
     * Property
     */
    state.intelligence.property =
      collectPropertyIntelligence(
        property
      );

    /*
     * Supporting engines
     */
    var supporting =
      collectSupportingIntelligence(
        location,
        property,
        preferences
      );

    state.intelligence.climate =
      supporting.climate;

    state.intelligence.risk =
      supporting.risk;

    state.intelligence.housing =
      supporting.housing;

    state.intelligence.incentives =
      supporting.incentives;

    state.intelligence.business =
      supporting.business;

    state.intelligence.opportunity =
      supporting.opportunity;

    /*
     * Analysis layer
     */
    state.analysis.signals =
      buildSignals(
        location,
        purpose,
        preferences
      );

    state.analysis.findings =
      buildFindings();

    state.analysis.tradeoffs =
      buildTradeoffs();

    state.analysis.gaps =
      buildGaps();

    state.analysis.actions =
      buildActions();

    state.summary =
      buildSummary();

    state.status = "complete";

    state.metadata.updatedAt = now();

    persist();

    return getState();
  }

  /*
   * ------------------------------------------------------------
   * LOCATION-ONLY ANALYSIS
   * ------------------------------------------------------------
   */

  function analyzeLocation(
    location,
    options
  ) {

    options = options || {};

    return analyze({
      location:
        location ||
        options.location,

      purpose:
        options.purpose ||
        state.request.purpose,

      preferences:
        options.preferences ||
        state.request.preferences,

      property:
        options.property ||
        null
    });
  }

  /*
   * ------------------------------------------------------------
   * PROPERTY ANALYSIS
   * ------------------------------------------------------------
   */

  function analyzeProperty(
    property,
    options
  ) {

    options = options || {};

    return analyze({
      location:
        options.location ||
        state.request.location,

      purpose:
        options.purpose ||
        state.request.purpose ||
        "Property",

      preferences:
        options.preferences ||
        state.request.preferences,

      property:
        property
    });
  }

  /*
   * ------------------------------------------------------------
   * ADVISOR CONTEXT
   * ------------------------------------------------------------
   */

  function getAdvisorContext() {

    return {
      request: clone(
        state.request
      ),

      location: clone(
        state.location
      ),

      intelligence: clone(
        state.intelligence
      ),

      analysis: clone(
        state.analysis
      ),

      summary: clone(
        state.summary
      ),

      metadata: clone(
        state.metadata
      )
    };
  }

  /*
   * ------------------------------------------------------------
   * INITIALIZATION
   * ------------------------------------------------------------
   */

  function initialize() {

    restore();

    if (
      !state.metadata.createdAt
    ) {
      state.metadata.createdAt =
        now();
    }

    state.metadata.version =
      VERSION;

    state.metadata.updatedAt =
      now();

    state.status = "ready";

    persist();

    return getStatus();
  }

  /*
   * ------------------------------------------------------------
   * PUBLIC API
   * ------------------------------------------------------------
   */

  var API = {

    name: MODULE_NAME,

    version: VERSION,

    initialize: initialize,

    getStatus: getStatus,

    getState: getState,

    reset: resetState,

    persist: persist,

    restore: restore,

    setRequest: setRequest,

    setLocation: setLocation,

    setPurpose: setPurpose,

    setPreferences: setPreferences,

    analyze: analyze,

    analyzeLocation: analyzeLocation,

    analyzeProperty: analyzeProperty,

    getAdvisorContext: getAdvisorContext,

    discoverModules: discoverModules,

    getEngineStatus: getStatus
  };

  /*
   * ------------------------------------------------------------
   * GLOBAL EXPORTS
   * ------------------------------------------------------------
   */

  window.ROlyfeAI = API;

  window.ROLYFE_AI = API;

  /*
   * ------------------------------------------------------------
   * INITIALIZE
   * ------------------------------------------------------------
   */

  initialize();

})(window);
