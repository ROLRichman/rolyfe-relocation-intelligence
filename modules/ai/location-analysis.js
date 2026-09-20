/*
 * ============================================================
 * RO’Lyfe Relocation Intelligence Center™
 * LOCATION ANALYSIS ENGINE
 * ============================================================
 *
 * FILE:
 *   /modules/ai/location-analysis.js
 *
 * VERSION:
 *   1.2.0
 *
 * PURPOSE:
 *   AI-ready location intelligence aggregation and analysis.
 *
 * ROLE:
 *   Location intelligence bridge between individual intelligence
 *   modules and the RO’Lyfe AI orchestration layer.
 *
 * ============================================================
 */

(function (window) {
  "use strict";

  const VERSION = "1.2.0";
  const MODULE_NAME = "ROlyfeLocationAnalysis";

  const DEFAULT_CONFIG = {
    autoInitialize: true,
    maxSignals: 30,
    maxFindings: 30,
    maxActions: 20,
    maxTradeoffs: 20,
    maxGaps: 20,
    persist: true,
    storageKey: "rolyfe_location_analysis_v1",
    includeSources: true
  };

  let config = Object.assign({}, DEFAULT_CONFIG);

  const PRIORITIES = [
    "climate",
    "weather",
    "risk",
    "housing",
    "costOfLiving",
    "incentives",
    "business",
    "opportunity",
    "property",
    "qualityOfLife"
  ];

  const RISK_TYPES = [
    "flood",
    "tornado",
    "hurricane",
    "tropical",
    "wildfire",
    "heat",
    "cold",
    "drought",
    "earthquake",
    "snow",
    "ice",
    "severeStorm",
    "wind"
  ];

  const DOMAIN_ORDER = [
    "lifestyle",
    "financial",
    "housing",
    "costOfLiving",
    "climate",
    "weather",
    "risk",
    "business",
    "incentives",
    "opportunity",
    "property"
  ];

  function createInitialState() {
    return {
      status: "idle",
      initialized: false,

      location: {
        query: "",
        name: "",
        city: "",
        county: "",
        state: "",
        stateCode: "",
        zip: "",
        country: "USA",
        latitude: null,
        longitude: null,
        level: "",
        source: ""
      },

      preferences: {
        priorities: [],
        budget: null,
        monthlyHousingBudget: null,
        maxHomePrice: null,
        maxRent: null,
        desiredClimate: "",
        avoidRisks: [],
        businessType: "",
        industry: "",
        propertyStrategy: "",
        homeownership: "",
        workMode: "",
        notes: ""
      },

      sourceData: {
        location: null,
        climate: null,
        weather: null,
        risk: null,
        housing: null,
        costOfLiving: null,
        incentives: null,
        business: null,
        opportunity: null,
        property: null,
        core: null
      },

      analysis: {
        lifestyle: {},
        financial: {},
        housing: {},
        costOfLiving: {},
        climate: {},
        weather: {},
        risk: {},
        business: {},
        incentives: {},
        opportunity: {},
        property: {}
      },

      signals: [],
      findings: [],
      tradeoffs: [],
      gaps: [],
      actions: [],

      fit: {
        overall: null,
        lifestyle: null,
        financial: null,
        housing: null,
        climate: null,
        weather: null,
        risk: null,
        business: null,
        incentives: null,
        opportunity: null,
        property: null,
        confidence: null,
        coverage: null
      },

      summary: {
        headline: "",
        overview: "",
        strengths: [],
        considerations: [],
        nextSteps: []
      },

      aiContext: {},

      metadata: {
        version: VERSION,
        createdAt: null,
        updatedAt: null,
        analyzedAt: null,
        sourceCount: 0,
        dataCoverage: 0
      }
    };
  }

  let state = createInitialState();
  const subscribers = {};

  function now() {
    return new Date().toISOString();
  }

  function text(value, fallback) {
    if (value === null || value === undefined) {
      return fallback !== undefined ? fallback : "";
    }

    const result = String(value).trim();

    return result || (
      fallback !== undefined
        ? fallback
        : ""
    );
  }

  function number(value, fallback) {
    const parsed = Number(value);

    return Number.isFinite(parsed)
      ? parsed
      : (
        fallback !== undefined
          ? fallback
          : null
      );
  }

  function array(value) {
    return Array.isArray(value)
      ? value
      : [];
  }

  function clone(value) {
    try {
      return JSON.parse(
        JSON.stringify(value)
      );
    } catch (error) {
      return value;
    }
  }

  function unique(values) {
    return Array.from(
      new Set(
        array(values)
          .filter(function (value) {
            return (
              value !== null &&
              value !== undefined &&
              String(value).trim() !== ""
            );
          })
          .map(function (value) {
            return String(value).trim();
          })
      )
    );
  }

  function clamp(value, min, max) {
    const parsed = number(value, min);

    return Math.min(
      max,
      Math.max(min, parsed)
    );
  }

  function average(values) {
    const valid = array(values)
      .map(function (value) {
        return number(value, null);
      })
      .filter(function (value) {
        return value !== null;
      });

    if (!valid.length) {
      return null;
    }

    return valid.reduce(
      function (sum, value) {
        return sum + value;
      },
      0
    ) / valid.length;
  }

  function meaningful(value) {
    if (
      value === null ||
      value === undefined
    ) {
      return false;
    }

    if (typeof value === "string") {
      return value.trim() !== "";
    }

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    if (typeof value === "object") {
      return Object.keys(value).length > 0;
    }

    return true;
  }

  function get(object, path, fallback) {
    if (!object || !path) {
      return fallback;
    }

    const parts = String(path).split(".");
    let current = object;

    for (
      let i = 0;
      i < parts.length;
      i += 1
    ) {
      if (
        current === null ||
        current === undefined ||
        !Object.prototype.hasOwnProperty.call(
          current,
          parts[i]
        )
      ) {
        return fallback;
      }

      current = current[parts[i]];
    }

    return current === undefined
      ? fallback
      : current;
  }

  function normalizeScore(value, fallback) {
    const parsed = number(
      value,
      fallback
    );

    if (
      parsed === null ||
      parsed === undefined
    ) {
      return null;
    }

    if (
      parsed >= 0 &&
      parsed <= 1
    ) {
      return Math.round(
        parsed * 100
      );
    }

    return clamp(
      Math.round(parsed),
      0,
      100
    );
  }

  function emit(eventName, payload) {
    const listeners =
      subscribers[eventName] || [];

    listeners.forEach(
      function (handler) {
        try {
          handler(payload);
        } catch (error) {
          console.warn(
            MODULE_NAME +
            ": subscriber error",
            error
          );
        }
      }
    );
  }

  /* ============================================================
   * LOCATION
   * ============================================================ */

  function determineLocationLevel(location) {
    const source = location || {};

    if (
      meaningful(source.property) ||
      meaningful(source.propertyId) ||
      meaningful(source.address)
    ) {
      return "property";
    }

    if (
      meaningful(source.zip) ||
      meaningful(source.zipCode) ||
      meaningful(source.postalCode)
    ) {
      return "zip";
    }

    if (
      meaningful(source.city) ||
      meaningful(source.cityName)
    ) {
      return "city";
    }

    if (
      meaningful(source.county) ||
      meaningful(source.countyName)
    ) {
      return "county";
    }

    if (
      meaningful(source.state) ||
      meaningful(source.stateName) ||
      meaningful(source.stateCode)
    ) {
      return "state";
    }

    return "";
  }

  function normalizeLocation(input) {
    const source = input || {};

    return {
      query: text(
        source.query ||
        source.search ||
        source.address ||
        source.name
      ),

      name: text(
        source.name ||
        source.city ||
        source.locationName
      ),

      city: text(
        source.city ||
        source.cityName
      ),

      county: text(
        source.county ||
        source.countyName
      ),

      state: text(
        source.state ||
        source.stateName
      ),

      stateCode: text(
        source.stateCode ||
        source.state_abbreviation ||
        source.abbreviation
      ).toUpperCase(),

      zip: text(
        source.zip ||
        source.zipCode ||
        source.postalCode
      ),

      country: text(
        source.country,
        "USA"
      ),

      latitude: number(
        source.latitude !== undefined
          ? source.latitude
          : source.lat,
        null
      ),

      longitude: number(
        source.longitude !== undefined
          ? source.longitude
          : source.lng !== undefined
            ? source.lng
            : source.lon,
        null
      ),

      level:
        source.level ||
        determineLocationLevel(source),

      source: text(
        source.source
      )
    };
  }

  function setLocation(location) {
    state.location =
      normalizeLocation(
        Object.assign(
          {},
          state.location,
          location || {}
        )
      );

    state.sourceData.location =
      clone(state.location);

    state.metadata.updatedAt = now();

    emit(
      "locationChanged",
      getLocation()
    );

    return getLocation();
  }

  function getLocation() {
    return clone(
      state.location
    );
  }

  /* ============================================================
   * PREFERENCES
   * ============================================================ */

  function normalizePriorities(input) {
    return unique(
      array(input)
        .filter(function (item) {
          return PRIORITIES.indexOf(
            String(item).trim()
          ) !== -1;
        })
    );
  }

  function normalizePreferences(input) {
    const source = input || {};

    return {
      priorities:
        normalizePriorities(
          source.priorities ||
          source.priority ||
          []
        ),

      budget:
        number(
          source.budget,
          null
        ),

      monthlyHousingBudget:
        number(
          source.monthlyHousingBudget ||
          source.monthlyRentBudget ||
          source.monthlyHousing,
          null
        ),

      maxHomePrice:
        number(
          source.maxHomePrice ||
          source.homePriceBudget,
          null
        ),

      maxRent:
        number(
          source.maxRent ||
          source.rentBudget,
          null
        ),

      desiredClimate:
        text(
          source.desiredClimate ||
          source.climate
        ),

      avoidRisks:
        unique(
          array(
            source.avoidRisks ||
            source.riskAvoidance ||
            []
          )
        ),

      businessType:
        text(
          source.businessType
        ),

      industry:
        text(
          source.industry
        ),

      propertyStrategy:
        text(
          source.propertyStrategy ||
          source.strategy
        ),

      homeownership:
        text(
          source.homeownership ||
          source.homeOwnership
        ),

      workMode:
        text(
          source.workMode
        ),

      notes:
        text(
          source.notes
        )
    };
  }

  function setPreferences(preferences) {
    state.preferences =
      normalizePreferences(
        Object.assign(
          {},
          state.preferences,
          preferences || {}
        )
      );

    state.metadata.updatedAt = now();

    emit(
      "preferencesChanged",
      getPreferences()
    );

    return getPreferences();
  }

  function getPreferences() {
    return clone(
      state.preferences
    );
  }

  /* ============================================================
   * SOURCE DATA
   * ============================================================ */

  function normalizeSourceData(data) {
    const source = data || {};

    return {
      location:
        source.location || null,

      climate:
        source.climate || null,

      weather:
        source.weather || null,

      risk:
        source.risk || null,

      housing:
        source.housing || null,

      costOfLiving:
        source.costOfLiving ||
        source.cost_of_living ||
        source.cost ||
        null,

      incentives:
        source.incentives || null,

      business:
        source.business || null,

      opportunity:
        source.opportunity || null,

      property:
        source.property || null,

      core:
        source.core || null
    };
  }

  function setSourceData(data) {
    state.sourceData =
      Object.assign(
        {},
        state.sourceData,
        normalizeSourceData(data)
      );

    if (
      meaningful(
        state.sourceData.location
      )
    ) {
      state.location =
        normalizeLocation(
          Object.assign(
            {},
            state.location,
            state.sourceData.location
          )
        );
    }

    state.metadata.updatedAt = now();

    emit(
      "sourceDataChanged",
      getSourceData()
    );

    return getSourceData();
  }

  function getSourceData() {
    return clone(
      state.sourceData
    );
  }

  /* ============================================================
   * MODULE BRIDGE
   * ============================================================ */

  const MODULE_ALIASES = {
    climate: [
      "ROlyfeClimate",
      "ROLYFE_CLIMATE"
    ],

    weather: [
      "ROlyfeWeather",
      "ROLYFE_WEATHER"
    ],

    risk: [
      "ROlyfeRisk",
      "ROLYFE_RISK"
    ],

    housing: [
      "ROlyfeHousing",
      "ROLYFE_HOUSING"
    ],

    incentives: [
      "ROlyfeIncentives",
      "ROLYFE_INCENTIVES"
    ],

    business: [
      "ROlyfeBusiness",
      "ROLYFE_BUSINESS"
    ],

    opportunity: [
      "ROlyfeOpportunity",
      "ROLYFE_OPPORTUNITY",
      "ROlyfeOpportunityEngine"
    ],

    property: [
      "ROlyfePropertyAnalysis",
      "ROLYFE_PROPERTY_ANALYSIS"
    ],

    core: [
      "ROlyfeCore",
      "ROLYFE_CORE"
    ]
  };

  function getModule(name) {
    const candidates =
      MODULE_ALIASES[name] || [];

    for (
      let i = 0;
      i < candidates.length;
      i += 1
    ) {
      if (
        window[candidates[i]]
      ) {
        return window[candidates[i]];
      }
    }

    return null;
  }

  function safelyGetProfile(
    module,
    fallback
  ) {
    if (!module) {
      return fallback || null;
    }

    try {
      if (
        typeof module.getProfile ===
        "function"
      ) {
        return module.getProfile();
      }

      if (
        typeof module.getResult ===
        "function"
      ) {
        return module.getResult();
      }

      if (
        typeof module.getAnalysis ===
        "function"
      ) {
        return module.getAnalysis();
      }

      if (
        typeof module.getState ===
        "function"
      ) {
        const result =
          module.getState();

        return (
          result &&
          result.profile
        )
          ? result.profile
          : result;
      }
    } catch (error) {
      console.warn(
        MODULE_NAME +
        ": module read failed",
        error
      );
    }

    return fallback || null;
  }

  function collectAvailableModules() {
    const available = {};

    Object.keys(
      MODULE_ALIASES
    ).forEach(
      function (name) {
        available[name] =
          Boolean(
            getModule(name)
          );
      }
    );

    return available;
  }

  function collectCoreContext() {
    const core =
      getModule("core");

    if (!core) {
      return state.sourceData.core ||
        null;
    }

    try {
      if (
        typeof core.buildSharedContext ===
        "function"
      ) {
        return core.buildSharedContext();
      }

      if (
        typeof core.getAIContext ===
        "function"
      ) {
        return core.getAIContext();
      }

      if (
        typeof core.getAnalysis ===
        "function"
      ) {
        return core.getAnalysis();
      }

      if (
        typeof core.getState ===
        "function"
      ) {
        return core.getState();
      }
    } catch (error) {
      console.warn(
        MODULE_NAME +
        ": core context unavailable",
        error
      );
    }

    return state.sourceData.core ||
      null;
  }

  /* ============================================================
   * DOMAIN ANALYSIS
   * ============================================================ */

  function analyzeClimate() {
    const source =
      state.sourceData.climate ||
      safelyGetProfile(
        getModule("climate"),
        {}
      ) ||
      {};

    const profile =
      source.profile ||
      source;

    return {
      available:
        meaningful(source),

      temperature:
        get(
          profile,
          "temperature",
          null
        ),

      precipitation:
        get(
          profile,
          "precipitation",
          null
        ),

      seasons:
        array(
          get(
            profile,
            "seasons",
            []
          )
        ),

      comfortScore:
        normalizeScore(
          get(
            profile,
            "comfortScore",
            get(
              profile,
              "score",
              null
            )
          ),
          null
        ),

      summary:
        text(
          get(
            profile,
            "summary",
            ""
          )
        ),

      source:
        source
    };
  }

  function analyzeWeather() {
    const source =
      state.sourceData.weather ||
      safelyGetProfile(
        getModule("weather"),
        {}
      ) ||
      {};

    const profile =
      source.profile ||
      source;

    const alerts =
      array(
        get(
          profile,
          "alerts",
          []
        )
      );

    return {
      available:
        meaningful(source),

      current:
        get(
          profile,
          "current",
          {}
        ) || {},

      forecast:
        array(
          get(
            profile,
            "forecast",
            []
          )
        ),

      alerts:
        alerts,

      alertCount:
        alerts.length,

      conditions:
        get(
          profile,
          "conditions",
          null
        ),

      summary:
        get(
          profile,
          "summary",
          {}
        ),

      live:
        Boolean(
          get(
            profile,
            "metadata.live",
            false
          )
        ),

      source:
        source
    };
  }

  function analyzeRisk() {
    const source =
      state.sourceData.risk ||
      safelyGetProfile(
        getModule("risk"),
        {}
      ) ||
      {};

    const profile =
      source.profile ||
      source;

    const exposures = {};

    RISK_TYPES.forEach(
      function (riskType) {
        const value =
          get(
            profile,
            riskType,
            get(
              profile,
              "risks." +
              riskType,
              null
            )
          );

        if (
          meaningful(value)
        ) {
          exposures[riskType] =
            value;
        }
      }
    );

    const scores =
      Object.keys(exposures)
        .map(function (key) {
          const value =
            exposures[key];

          return normalizeScore(
            value &&
            typeof value ===
              "object"
              ? (
                value.score ||
                value.level
              )
              : value,
            null
          );
        })
        .filter(function (value) {
          return value !== null;
        });

    return {
      available:
        meaningful(source),

      exposures:
        exposures,

      overallScore:
        normalizeScore(
          get(
            profile,
            "overallScore",
            get(
              profile,
              "score",
              average(scores)
            )
          ),
          null
        ),

      hazardCount:
        Object.keys(exposures).length,

      alerts:
        array(
          get(
            profile,
            "alerts",
            []
          )
        ),

      summary:
        text(
          get(
            profile,
            "summary",
            ""
          )
        ),

      source:
        source
    };
  }

  function analyzeHousing() {
    const source =
      state.sourceData.housing ||
      safelyGetProfile(
        getModule("housing"),
        {}
      ) ||
      {};

    const profile =
      source.profile ||
      source;

    const medianHomePrice =
      number(
        get(
          profile,
          "medianHomePrice",
          get(
            profile,
            "median.homePrice",
            null
          )
        ),
        null
      );

    const medianRent =
      number(
        get(
          profile,
          "medianRent",
          get(
            profile,
            "median.rent",
            null
          )
        ),
        null
      );

    const medianIncome =
      number(
        get(
          profile,
          "medianHouseholdIncome",
          get(
            profile,
            "medianIncome",
            null
          )
        ),
        null
      );

    const priceToIncome =
      medianHomePrice &&
      medianIncome
        ? medianHomePrice /
          medianIncome
        : null;

    const monthlyBudget =
      state.preferences
        .monthlyHousingBudget;

    const rentBurden =
      monthlyBudget &&
      medianRent
        ? medianRent /
          monthlyBudget
        : null;

    return {
      available:
        meaningful(source),

      medianHomePrice:
        medianHomePrice,

      medianRent:
        medianRent,

      averageHomePrice:
        number(
          get(
            profile,
            "averageHomePrice",
            null
          ),
          null
        ),

      pricePerSquareFoot:
        number(
          get(
            profile,
            "pricePerSquareFoot",
            null
          ),
          null
        ),

      medianHouseholdIncome:
        medianIncome,

      homeownershipRate:
        number(
          get(
            profile,
            "homeownershipRate",
            null
          ),
          null
        ),

      vacancyRate:
        number(
          get(
            profile,
            "vacancyRate",
            null
          ),
          null
        ),

      inventory:
        number(
          get(
            profile,
            "inventory",
            null
          ),
          null
        ),

      daysOnMarket:
        number(
          get(
            profile,
            "daysOnMarket",
            null
          ),
          null
        ),

      priceToIncome:
        priceToIncome,

      rentToBudgetRatio:
        rentBurden,

      affordabilityScore:
        normalizeScore(
          get(
            profile,
            "affordabilityScore",
            null
          ),
          null
        ),

      summary:
        text(
          get(
            profile,
            "summary",
            ""
          )
        ),

      source:
        source
    };
  }

  function analyzeCostOfLiving() {
    const source =
      state.sourceData.costOfLiving ||
      {};

    const profile =
      source.profile ||
      source;

    return {
      available:
        meaningful(source),

      overall:
        number(
          get(
            profile,
            "overall",
            get(
              profile,
              "index",
              get(
                profile,
                "costOfLivingIndex",
                null
              )
            )
          ),
          null
        ),

      housing:
        number(
          get(
            profile,
            "housing",
            get(
              profile,
              "housingIndex",
              null
            )
          ),
          null
        ),

      utilities:
        number(
          get(
            profile,
            "utilities",
            get(
              profile,
              "utilitiesIndex",
              null
            )
          ),
          null
        ),

      transportation:
        number(
          get(
            profile,
            "transportation",
            get(
              profile,
              "transportationIndex",
              null
            )
          ),
          null
        ),

      groceries:
        number(
          get(
            profile,
            "groceries",
            get(
              profile,
              "groceriesIndex",
              null
            )
          ),
          null
        ),

      healthcare:
        number(
          get(
            profile,
            "healthcare",
            get(
              profile,
              "healthcareIndex",
              null
            )
          ),
          null
        ),

      medianIncome:
        number(
          get(
            profile,
            "medianIncome",
            null
          ),
          null
        ),

      purchasingPower:
        number(
          get(
            profile,
            "purchasingPower",
            null
          ),
          null
        ),

      summary:
        text(
          get(
            profile,
            "summary",
            ""
          )
        ),

      source:
        source
    };
  }

  function analyzeIncentives() {
    const source =
      state.sourceData.incentives ||
      safelyGetProfile(
        getModule("incentives"),
        {}
      ) ||
      {};

    const profile =
      source.profile ||
      source;

    const programs =
      array(
        get(
          profile,
          "programs",
          []
        )
      );

    const matches =
      array(
        get(
          profile,
          "matches",
          []
        )
      );

    return {
      available:
        meaningful(source),

      programs:
        programs,

      programCount:
        programs.length,

      matchedPrograms:
        matches,

      matchCount:
        matches.length,

      summary:
        text(
          get(
            profile,
            "summary",
            ""
          )
        ),

      source:
        source
    };
  }

  function analyzeBusiness() {
    const source =
      state.sourceData.business ||
      safelyGetProfile(
        getModule("business"),
        {}
      ) ||
      {};

    const profile =
      source.profile ||
      source;

    const matches =
      array(
        get(
          profile,
          "matches",
          []
        )
      );

    return {
      available:
        meaningful(source),

      economicData:
        get(
          profile,
          "economicData",
          {}
        ),

      businessReadiness:
        normalizeScore(
          get(
            profile,
            "businessReadiness",
            null
          ),
          null
        ),

      economicCoverage:
        normalizeScore(
          get(
            profile,
            "economicCoverage",
            null
          ),
          null
        ),

      fundingCoverage:
        normalizeScore(
          get(
            profile,
            "fundingCoverage",
            null
          ),
          null
        ),

      incentiveCoverage:
        normalizeScore(
          get(
            profile,
            "incentiveCoverage",
            null
          ),
          null
        ),

      industryCoverage:
        normalizeScore(
          get(
            profile,
            "industryCoverage",
            null
          ),
          null
        ),

      matches:
        matches,

      matchCount:
        matches.length,

      summary:
        text(
          get(
            profile,
            "summary",
            ""
          )
        ),

      source:
        source
    };
  }

  function analyzeOpportunity() {
    const source =
      state.sourceData.opportunity ||
      safelyGetProfile(
        getModule("opportunity"),
        {}
      ) ||
      {};

    const profile =
      source.profile ||
      source;

    return {
      available:
        meaningful(source),

      score:
        normalizeScore(
          get(
            profile,
            "score",
            get(
              profile,
              "opportunityScore",
              null
            )
          ),
          null
        ),

      categories:
        array(
          get(
            profile,
            "categories",
            []
          )
        ),

      realEstate:
        get(
          profile,
          "realEstate",
          {}
        ),

      business:
        get(
          profile,
          "business",
          {}
        ),

      development:
        get(
          profile,
          "development",
          {}
        ),

      summary:
        text(
          get(
            profile,
            "summary",
            ""
          )
        ),

      source:
        source
    };
  }

  function analyzeProperty() {
    const source =
      state.sourceData.property ||
      safelyGetProfile(
        getModule("property"),
        {}
      ) ||
      {};

    const profile =
      source.profile ||
      source;

    return {
      available:
        meaningful(source),

      address:
        text(
          get(
            profile,
            "property.address",
            get(
              profile,
              "address",
              ""
            )
          )
        ),

      financial:
        get(
          profile,
          "financial",
          {}
        ),

      market:
        get(
          profile,
          "market",
          {}
        ),

      physical:
        get(
          profile,
          "physical",
          {}
        ),

      risk:
        get(
          profile,
          "risk",
          {}
        ),

      summary:
        text(
          get(
            profile,
            "summary",
            ""
          )
        ),

      source:
        source
    };
  }

  /* ============================================================
   * FINANCIAL / LIFESTYLE
   * ============================================================ */

  function buildFinancialAnalysis(
    housing,
    costOfLiving
  ) {
    const homePrice =
      number(
        housing.medianHomePrice,
        null
      );

    const income =
      number(
        housing.medianHouseholdIncome,
        costOfLiving.medianIncome
      );

    const rent =
      number(
        housing.medianRent,
        null
      );

    const monthlyBudget =
      number(
        state.preferences
          .monthlyHousingBudget,
        null
      );

    const housingBudgetRatio =
      monthlyBudget &&
      rent
        ? rent / monthlyBudget
        : null;

    let costScore = null;

    if (
      costOfLiving.overall !== null
    ) {
      costScore =
        clamp(
          100 -
          (
            costOfLiving.overall -
            100
          ),
          0,
          100
        );
    }

    return {
      available:
        housing.available ||
        costOfLiving.available,

      homePrice:
        homePrice,

      rent:
        rent,

      income:
        income,

      priceToIncome:
        housing.priceToIncome,

      housingBudget:
        monthlyBudget,

      housingBudgetRatio:
        housingBudgetRatio,

      costOfLivingIndex:
        costOfLiving.overall,

      costScore:
        costScore,

      purchasingPower:
        costOfLiving.purchasingPower,

      affordabilityScore:
        housing.affordabilityScore,

      summary:
        costOfLiving.summary ||
        housing.summary ||
        ""
    };
  }

  function analyzeLifestyle() {
    return {
      priorityCount:
        state.preferences
          .priorities.length,

      priorities:
        clone(
          state.preferences
            .priorities
        ),

      desiredClimate:
        state.preferences
          .desiredClimate,

      workMode:
        state.preferences
          .workMode,

      homeownership:
        state.preferences
          .homeownership,

      qualityOfLife:
        get(
          state.sourceData,
          "climate.qualityOfLife",
          null
        ),

      notes:
        state.preferences.notes
    };
  }

  /* ============================================================
   * FIT ENGINE
   * ============================================================ */

  function calculateHousingFit(
    housing
  ) {
    if (
      !housing ||
      !housing.available
    ) {
      return null;
    }

    const scores = [];

    if (
      housing.affordabilityScore !== null
    ) {
      scores.push(
        housing.affordabilityScore
      );
    }

    if (
      state.preferences.maxHomePrice &&
      housing.medianHomePrice
    ) {
      scores.push(
        housing.medianHomePrice <=
        state.preferences.maxHomePrice
          ? 85
          : 45
      );
    }

    if (
      state.preferences.maxRent &&
      housing.medianRent
    ) {
      scores.push(
        housing.medianRent <=
        state.preferences.maxRent
          ? 85
          : 45
      );
    }

    if (
      !scores.length &&
      housing.priceToIncome
    ) {
      if (
        housing.priceToIncome <= 3
      ) {
        scores.push(85);
      } else if (
        housing.priceToIncome <= 5
      ) {
        scores.push(65);
      } else {
        scores.push(40);
      }
    }

    return average(scores);
  }

  function calculateClimateFit(
    climate
  ) {
    if (
      !climate ||
      !climate.available
    ) {
      return null;
    }

    return climate.comfortScore;
  }

  function calculateWeatherFit(
    weather
  ) {
    if (
      !weather ||
      !weather.available
    ) {
      return null;
    }

    return weather.alertCount > 0
      ? 45
      : 75;
  }

  function calculateRiskFit(
    risk
  ) {
    if (
      !risk ||
      !risk.available ||
      risk.overallScore === null
    ) {
      return null;
    }

    return clamp(
      100 -
      risk.overallScore,
      0,
      100
    );
  }

  function calculateBusinessFit(
    business
  ) {
    if (
      !business ||
      !business.available
    ) {
      return null;
    }

    const scores = [
      business.businessReadiness,
      business.economicCoverage,
      business.fundingCoverage,
      business.incentiveCoverage,
      business.industryCoverage
    ].filter(function (value) {
      return value !== null;
    });

    return scores.length
      ? average(scores)
      : null;
  }

  function calculateIncentiveFit(
    incentives
  ) {
    if (
      !incentives ||
      !incentives.available
    ) {
      return null;
    }

    if (
      incentives.matchCount > 0
    ) {
      return clamp(
        50 +
        incentives.matchCount * 10,
        0,
        100
      );
    }

    if (
      incentives.programCount > 0
    ) {
      return 60;
    }

    return 35;
  }

  function calculateOpportunityFit(
    opportunity
  ) {
    if (
      !opportunity ||
      !opportunity.available
    ) {
      return null;
    }

    return opportunity.score;
  }

  function calculatePropertyFit(
    property
  ) {
    if (
      !property ||
      !property.available
    ) {
      return null;
    }

    const scores = [];

    const cashFlow =
      number(
        get(
          property,
          "financial.cashFlow",
          null
        ),
        null
      );

    const capRate =
      number(
        get(
          property,
          "financial.capRate",
          null
        ),
        null
      );

    if (
      cashFlow !== null
    ) {
      scores.push(
        cashFlow >= 0
          ? 75
          : 35
      );
    }

    if (
      capRate !== null
    ) {
      scores.push(
        clamp(
          capRate * 10,
          0,
          100
        )
      );
    }

    return average(scores);
  }

  function calculatePriorityWeight(
    domain
  ) {
    if (
      !state.preferences
        .priorities.length
    ) {
      return 1;
    }

    return state.preferences
      .priorities
      .indexOf(domain) !== -1
      ? 1.5
      : 1;
  }

  function calculateOverallFit(
    fit
  ) {
    const values = [];
    const weights = [];

    Object.keys(fit).forEach(
      function (domain) {
        if (
          domain === "overall" ||
          domain === "confidence" ||
          domain === "coverage"
        ) {
          return;
        }

        if (
          fit[domain] === null ||
          fit[domain] === undefined
        ) {
          return;
        }

        values.push(
          fit[domain]
        );

        weights.push(
          calculatePriorityWeight(
            domain
          )
        );
      }
    );

    if (!values.length) {
      return null;
    }

    let numerator = 0;
    let denominator = 0;

    values.forEach(
      function (value, index) {
        numerator +=
          value *
          weights[index];

        denominator +=
          weights[index];
      }
    );

    return denominator
      ? Math.round(
        numerator /
        denominator
      )
      : null;
  }

  function calculateCoverage(
    analysis
  ) {
    const domains =
      DOMAIN_ORDER.filter(
        function (domain) {
          return (
            domain !== "lifestyle" &&
            domain !== "financial"
          );
        }
      );

    const available =
      domains.filter(
        function (domain) {
          return Boolean(
            analysis[domain] &&
            analysis[domain].available
          );
        }
      ).length;

    return domains.length
      ? Math.round(
        (
          available /
          domains.length
        ) * 100
      )
      : 0;
  }

  function calculateConfidence(
    coverage,
    gapCount
  ) {
    return clamp(
      coverage -
      Math.min(
        30,
        gapCount * 5
      ),
      0,
      100
    );
  }

  /* ============================================================
   * SIGNALS
   * ============================================================ */

  function buildSignals(
    analysis
  ) {
    const signals = [];

    function add(
      type,
      domain,
      message,
      value,
      severity
    ) {
      signals.push({
        id:
          type +
          "-" +
          domain +
          "-" +
          signals.length,

        type:
          type,

        domain:
          domain,

        message:
          message,

        value:
          value !== undefined
            ? value
            : null,

        severity:
          severity || "info"
      });
    }

    const housing =
      analysis.housing;

    if (
      housing.medianHomePrice
    ) {
      add(
        "housing",
        "housing",
        "Median home price data is available for this location.",
        housing.medianHomePrice,
        "info"
      );
    }

    if (
      housing.medianRent
    ) {
      add(
        "housing",
        "housing",
        "Rental pricing data is available.",
        housing.medianRent,
        "info"
      );
    }

    if (
      housing.priceToIncome !== null
    ) {
      add(
        "affordability",
        "housing",
        "A home-price-to-income relationship can be evaluated.",
        housing.priceToIncome,
        housing.priceToIncome <= 3
          ? "positive"
          : housing.priceToIncome <= 5
            ? "info"
            : "caution"
      );
    }

    const cost =
      analysis.costOfLiving;

    if (
      cost.overall !== null
    ) {
      add(
        "cost",
        "costOfLiving",
        "Cost-of-living index data is available.",
        cost.overall,
        cost.overall <= 100
          ? "positive"
          : "caution"
      );
    }

    const climate =
      analysis.climate;

    if (
      climate.available
    ) {
      add(
        "climate",
        "climate",
        "Climate profile is available for analysis.",
        climate.comfortScore,
        "info"
      );
    }

    const weather =
      analysis.weather;

    if (
      weather.alertCount > 0
    ) {
      add(
        "alert",
        "weather",
        "Active weather alerts are present and should be checked separately from long-term climate.",
        weather.alertCount,
        "caution"
      );
    }

    const risk =
      analysis.risk;

    if (
      risk.hazardCount > 0
    ) {
      add(
        "risk",
        "risk",
        "Multiple hazard categories are available for review.",
        risk.hazardCount,
        "info"
      );
    }

    const business =
      analysis.business;

    if (
      business.matchCount > 0
    ) {
      add(
        "business",
        "business",
        "Business-program matches are available based on the current profile.",
        business.matchCount,
        "positive"
      );
    }

    const incentives =
      analysis.incentives;

    if (
      incentives.matchCount > 0
    ) {
      add(
        "incentive",
        "incentives",
        "Potential incentive matches were identified.",
        incentives.matchCount,
        "positive"
      );
    }

    const opportunity =
      analysis.opportunity;

    if (
      opportunity.score !== null
    ) {
      add(
        "opportunity",
        "opportunity",
        "An opportunity profile is available for this location.",
        opportunity.score,
        "info"
      );
    }

    if (
      analysis.property.available
    ) {
      add(
        "property",
        "property",
        "Property-level intelligence is available.",
        null,
        "info"
      );
    }

    return signals.slice(
      0,
      config.maxSignals
    );
  }

  /* ============================================================
   * FINDINGS / TRADEOFFS / GAPS / ACTIONS
   * ============================================================ */

  function buildFindings(
    analysis
  ) {
    const findings = [];

    function add(
      domain,
      title,
      message,
      type
    ) {
      findings.push({
        id:
          "finding-" +
          findings.length,

        domain:
          domain,

        title:
          title,

        message:
          message,

        type:
          type || "observation"
      });
    }

    const housing =
      analysis.housing;

    if (
      housing.priceToIncome !== null
    ) {
      if (
        housing.priceToIncome <= 3
      ) {
        add(
          "housing",
          "Housing affordability signal",
          "The available home-price-to-income relationship is relatively moderate.",
          "positive"
        );
      } else if (
        housing.priceToIncome <= 5
      ) {
        add(
          "housing",
          "Housing affordability requires review",
          "The home-price-to-income relationship should be evaluated against actual income and financing assumptions.",
          "caution"
        );
      } else {
        add(
          "housing",
          "Housing affordability pressure",
          "The available home-price-to-income relationship is relatively high and warrants closer financial analysis.",
          "caution"
        );
      }
    }

    if (
      analysis.costOfLiving.overall !== null
    ) {
      add(
        "costOfLiving",
        "Cost-of-living context",
        "Cost-of-living data should be compared with housing, income, taxes, and purchasing power.",
        "observation"
      );
    }

    if (
      analysis.weather.alertCount > 0
    ) {
      add(
        "weather",
        "Current conditions require attention",
        "The available weather data contains active alerts.",
        "caution"
      );
    }

    if (
      analysis.risk.hazardCount > 0
    ) {
      add(
        "risk",
        "Hazard profile available",
        "Multiple hazard dimensions are available and should be considered separately.",
        "observation"
      );
    }

    if (
      analysis.business.matchCount > 0
    ) {
      add(
        "business",
        "Business opportunity data",
        "Potential business-program matches are available based on the current profile.",
        "positive"
      );
    }

    if (
      analysis.incentives.programCount > 0
    ) {
      add(
        "incentives",
        "Incentive ecosystem detected",
        "Programs exist in the available data, but eligibility and funding status must be verified.",
        "observation"
      );
    }

    return findings.slice(
      0,
      config.maxFindings
    );
  }

  function buildTradeoffs(
    analysis
  ) {
    const tradeoffs = [];

    function add(
      domain,
      title,
      benefit,
      consideration
    ) {
      tradeoffs.push({
        id:
          "tradeoff-" +
          tradeoffs.length,

        domain:
          domain,

        title:
          title,

        benefit:
          benefit,

        consideration:
          consideration
      });
    }

    if (
      analysis.housing.medianHomePrice &&
      analysis.costOfLiving.overall !== null
    ) {
      add(
        "financial",
        "Housing vs overall cost",
        "Housing and cost-of-living can be evaluated together.",
        "A lower overall cost index does not automatically mean housing is affordable for the specific user."
      );
    }

    if (
      analysis.climate.available &&
      analysis.risk.available
    ) {
      add(
        "climate",
        "Climate vs hazard exposure",
        "Climate preferences can be evaluated alongside hazard exposure.",
        "A preferred climate does not eliminate local weather or disaster risks."
      );
    }

    if (
      analysis.business.available &&
      analysis.housing.available
    ) {
      add(
        "business",
        "Opportunity vs housing",
        "Business opportunity can be compared with housing costs.",
        "A strong business environment may come with higher housing or operating costs."
      );
    }

    if (
      analysis.incentives.matchCount > 0
    ) {
      add(
        "incentives",
        "Incentives vs eligibility",
        "Potential programs may improve the economics of a move or project.",
        "A program match is not a guarantee of eligibility or funding."
      );
    }

    if (
      analysis.property.available
    ) {
      add(
        "property",
        "Property economics vs location",
        "Property-level economics can be examined inside the broader location context.",
        "A promising property does not automatically make the surrounding location a strong relocation fit."
      );
    }

    return tradeoffs.slice(
      0,
      config.maxTradeoffs
    );
  }

  function buildGaps(
    analysis
  ) {
    const gaps = [];

    function add(
      domain,
      message,
      importance
    ) {
      gaps.push({
        id:
          "gap-" +
          gaps.length,

        domain:
          domain,

        message:
          message,

        importance:
          importance || "medium"
      });
    }

    if (
      !analysis.housing.available
    ) {
      add(
        "housing",
        "Housing data is not currently available.",
        "high"
      );
    }

    if (
      !analysis.costOfLiving.available
    ) {
      add(
        "costOfLiving",
        "Cost-of-living data is incomplete.",
        "medium"
      );
    }

    if (
      !analysis.climate.available
    ) {
      add(
        "climate",
        "Climate data is not currently available.",
        "medium"
      );
    }

    if (
      !analysis.weather.available
    ) {
      add(
        "weather",
        "Live or recent weather data is not currently available.",
        "medium"
      );
    }

    if (
      !analysis.risk.available
    ) {
      add(
        "risk",
        "Hazard exposure data is not currently available.",
        "high"
      );
    }

    if (
      !analysis.business.available
    ) {
      add(
        "business",
        "Business/economic intelligence is incomplete.",
        "medium"
      );
    }

    if (
      !analysis.incentives.available
    ) {
      add(
        "incentives",
        "Relocation/business incentive data is incomplete.",
        "low"
      );
    }

    if (
      !analysis.opportunity.available
    ) {
      add(
        "opportunity",
        "Opportunity data is not currently available.",
        "medium"
      );
    }

    if (
      !state.location.name &&
      !state.location.city &&
      !state.location.state
    ) {
      add(
        "location",
        "A target location has not been fully specified.",
        "high"
      );
    }

    if (
      !state.preferences.priorities.length
    ) {
      add(
        "preferences",
        "No user priorities have been supplied, so interpretation remains general.",
        "medium"
      );
    }

    return gaps.slice(
      0,
      config.maxGaps
    );
  }

  function buildActions(
    analysis,
    gaps
  ) {
    const actions = [];

    function add(
      domain,
      action,
      priority
    ) {
      actions.push({
        id:
          "action-" +
          actions.length,

        domain:
          domain,

        action:
          action,

        priority:
          priority || "medium"
      });
    }

    if (
      !analysis.housing.available
    ) {
      add(
        "housing",
        "Load housing data for the target location.",
        "high"
      );
    }

    if (
      !analysis.risk.available
    ) {
      add(
        "risk",
        "Load hazard and disaster exposure data before making a property or relocation decision.",
        "high"
      );
    }

    if (
      !analysis.weather.available
    ) {
      add(
        "weather",
        "Check current and near-term weather separately from long-term climate.",
        "medium"
      );
    }

    if (
      !analysis.business.available
    ) {
      add(
        "business",
        "Define the business type and industry to improve economic-program matching.",
        "medium"
      );
    }

    if (
      analysis.incentives.matchCount > 0
    ) {
      add(
        "incentives",
        "Verify program eligibility, deadlines, funding status, and application requirements.",
        "high"
      );
    }

    if (
      !state.preferences.priorities.length
    ) {
      add(
        "preferences",
        "Set decision priorities so the AI can interpret tradeoffs around your actual goals.",
        "high"
      );
    }

    if (
      analysis.property.available
    ) {
      add(
        "property",
        "Run property-level financial, market, physical, and risk analysis before committing capital.",
        "high"
      );
    }

    if (
      gaps.length
    ) {
      add(
        "data",
        "Resolve the highest-impact data gaps before treating the analysis as decision-ready.",
        "high"
      );
    }

    return actions.slice(
      0,
      config.maxActions
    );
  }

  /* ============================================================
   * SUMMARY
   * ============================================================ */

  function buildSummary(
    analysis,
    fit,
    tradeoffs,
    gaps,
    actions
  ) {
    const locationName =
      state.location.name ||
      state.location.city ||
      state.location.county ||
      state.location.state ||
      "this location";

    const strengths = [];

    if (
      fit.housing !== null &&
      fit.housing >= 70
    ) {
      strengths.push(
        "Housing data indicates a potentially workable affordability profile."
      );
    }

    if (
      fit.business !== null &&
      fit.business >= 70
    ) {
      strengths.push(
        "Business and economic opportunity signals are available."
      );
    }

    if (
      fit.incentives !== null &&
      fit.incentives >= 70
    ) {
      strengths.push(
        "Potential incentive or program opportunities are present."
      );
    }

    if (
      fit.opportunity !== null &&
      fit.opportunity >= 70
    ) {
      strengths.push(
        "The opportunity layer contains useful signals for further analysis."
      );
    }

    const considerations = [];

    tradeoffs.forEach(
      function (tradeoff) {
        if (
          tradeoff.consideration
        ) {
          considerations.push(
            tradeoff.consideration
          );
        }
      }
    );

    gaps.slice(
      0,
      5
    ).forEach(
      function (gap) {
        considerations.push(
          gap.message
        );
      }
    );

    return {
      headline:
        "Location intelligence profile for " +
        locationName,

      overview:
        "RO’Lyfe analyzed " +
        locationName +
        " across location, housing, cost, climate, weather, risk, business, incentives, opportunity, and property layers where data was available.",

      strengths:
        unique(strengths),

      considerations:
        unique(
          considerations
        ),

      nextSteps:
        actions.slice(
          0,
          5
        ).map(
          function (item) {
            return item.action;
          }
        )
    };
  }

  /* ============================================================
   * AI CONTEXT
   * ============================================================ */

  function buildAIContext() {
    const context = {
      module:
        MODULE_NAME,

      version:
        VERSION,

      purpose:
        "Provide structured location intelligence for AI interpretation.",

      location:
        clone(state.location),

      preferences:
        clone(state.preferences),

      analysis:
        clone(state.analysis),

      fit:
        clone(state.fit),

      signals:
        clone(state.signals),

      findings:
        clone(state.findings),

      tradeoffs:
        clone(state.tradeoffs),

      gaps:
        clone(state.gaps),

      actions:
        clone(state.actions),

      summary:
        clone(state.summary),

      sources:
        config.includeSources
          ? clone(state.sourceData)
          : undefined,

      guardrails: [
        "Do not declare a universal best location.",
        "Use the user's stated priorities when interpreting fit.",
        "Distinguish current weather from long-term climate.",
        "Distinguish hazard exposure from active weather conditions.",
        "Do not treat program matches as guaranteed eligibility.",
        "Do not treat business opportunity signals as guaranteed outcomes.",
        "Do not invent missing data.",
        "Identify important data gaps.",
        "Use dates and source periods when available.",
        "Property-level economics should be evaluated separately from general relocation fit.",
        "Financial calculations are analytical context, not financial advice."
      ]
    };

    state.aiContext =
      context;

    emit(
      "aiContextBuilt",
      clone(context)
    );

    return clone(context);
  }

  function getAIContext() {
    return clone(
      state.aiContext &&
      Object.keys(
        state.aiContext
      ).length
        ? state.aiContext
        : buildAIContext()
    );
  }

  function buildSharedContext() {
    return {
      module:
        MODULE_NAME,

      version:
        VERSION,

      location:
        clone(state.location),

      preferences:
        clone(state.preferences),

      analysis:
        clone(state.analysis),

      fit:
        clone(state.fit),

      signals:
        clone(state.signals),

      findings:
        clone(state.findings),

      tradeoffs:
        clone(state.tradeoffs),

      gaps:
        clone(state.gaps),

      actions:
        clone(state.actions),

      summary:
        clone(state.summary),

      aiContext:
        getAIContext()
    };
  }

  /* ============================================================
   * MAIN ANALYSIS
   * ============================================================ */

  function analyze(options) {
    const opts =
      options || {};

    state.status =
      "analyzing";

    if (
      opts.location
    ) {
      setLocation(
        opts.location
      );
    }

    if (
      opts.preferences
    ) {
      setPreferences(
        opts.preferences
      );
    }

    if (
      opts.data
    ) {
      setSourceData(
        opts.data
      );
    }

    if (
      opts.core
    ) {
      state.sourceData.core =
        opts.core;
    }

    const lifestyle =
      analyzeLifestyle();

    const housing =
      analyzeHousing();

    const costOfLiving =
      analyzeCostOfLiving();

    const climate =
      analyzeClimate();

    const weather =
      analyzeWeather();

    const risk =
      analyzeRisk();

    const business =
      analyzeBusiness();

    const incentives =
      analyzeIncentives();

    const opportunity =
      analyzeOpportunity();

    const property =
      analyzeProperty();

    const financial =
      buildFinancialAnalysis(
        housing,
        costOfLiving
      );

    state.analysis = {
      lifestyle:
        lifestyle,

      financial:
        financial,

      housing:
        housing,

      costOfLiving:
        costOfLiving,

      climate:
        climate,

      weather:
        weather,

      risk:
        risk,

      business:
        business,

      incentives:
        incentives,

      opportunity:
        opportunity,

      property:
        property
    };

    state.signals =
      buildSignals(
        state.analysis
      );

    state.findings =
      buildFindings(
        state.analysis
      );

    state.tradeoffs =
      buildTradeoffs(
        state.analysis
      );

    state.gaps =
      buildGaps(
        state.analysis
      );

    state.actions =
      buildActions(
        state.analysis,
        state.gaps
      );

    const fit = {
      overall:
        null,

      lifestyle:
        75,

      financial:
        average([
          financial.costScore,
          housing.affordabilityScore
        ]),

      housing:
        calculateHousingFit(
          housing
        ),

      climate:
        calculateClimateFit(
          climate
        ),

      weather:
        calculateWeatherFit(
          weather
        ),

      risk:
        calculateRiskFit(
          risk
        ),

      business:
        calculateBusinessFit(
          business
        ),

      incentives:
        calculateIncentiveFit(
          incentives
        ),

      opportunity:
        calculateOpportunityFit(
          opportunity
        ),

      property:
        calculatePropertyFit(
          property
        ),

      confidence:
        null,

      coverage:
        null
    };

    fit.coverage =
      calculateCoverage(
        state.analysis
      );

    fit.confidence =
      calculateConfidence(
        fit.coverage,
        state.gaps.length
      );

    fit.overall =
      calculateOverallFit(
        fit
      );

    state.fit =
      fit;

    state.summary =
      buildSummary(
        state.analysis,
        state.fit,
        state.tradeoffs,
        state.gaps,
        state.actions
      );

    state.aiContext =
      buildAIContext();

    state.metadata.sourceCount =
      countSources();

    state.metadata.dataCoverage =
      fit.coverage;

    state.metadata.analyzedAt =
      now();

    state.metadata.updatedAt =
      now();

    state.status =
      "ready";

    state.initialized =
      true;

    persist();

    emit(
      "analysisComplete",
      getResult()
    );

    return getResult();
  }

  function analyzeFromCore() {
    const context =
      collectCoreContext();

    if (context) {
      state.sourceData.core =
        context;
    }

    return analyze({
      core:
        context
    });
  }

  /* ============================================================
   * STATE
   * ============================================================ */

  function countSources() {
    return Object.keys(
      state.sourceData
    ).filter(
      function (key) {
        return meaningful(
          state.sourceData[key]
        );
      }
    ).length;
  }

  function configure(options) {
    config =
      Object.assign(
        {},
        config,
        options || {}
      );

    state.metadata.updatedAt =
      now();

    return getConfig();
  }

  function getConfig() {
    return clone(config);
  }

  function getState() {
    return clone(state);
  }

  function getStatus() {
    return {
      module:
        MODULE_NAME,

      version:
        VERSION,

      status:
        state.status,

      initialized:
        state.initialized,

      location:
        clone(state.location),

      analysisReady:
        state.status === "ready",

      coverage:
        state.fit.coverage,

      confidence:
        state.fit.confidence,

      signalCount:
        state.signals.length,

      findingCount:
        state.findings.length,

      tradeoffCount:
        state.tradeoffs.length,

      gapCount:
        state.gaps.length,

      actionCount:
        state.actions.length,

      sourceCount:
        state.metadata.sourceCount,

      updatedAt:
        state.metadata.updatedAt,

      analyzedAt:
        state.metadata.analyzedAt
    };
  }

  function getResult() {
    return {
      status:
        state.status,

      location:
        clone(state.location),

      preferences:
        clone(state.preferences),

      analysis:
        clone(state.analysis),

      fit:
        clone(state.fit),

      signals:
        clone(state.signals),

      findings:
        clone(state.findings),

      tradeoffs:
        clone(state.tradeoffs),

      gaps:
        clone(state.gaps),

      actions:
        clone(state.actions),

      summary:
        clone(state.summary),

      aiContext:
        getAIContext(),

      metadata:
        clone(state.metadata)
    };
  }

  function getAnalysis() {
    return clone(
      state.analysis
    );
  }

  function getFit() {
    return clone(
      state.fit
    );
  }

  function getSignals() {
    return clone(
      state.signals
    );
  }

  function getFindings() {
    return clone(
      state.findings
    );
  }

  function getTradeoffs() {
    return clone(
      state.tradeoffs
    );
  }

  function getGaps() {
    return clone(
      state.gaps
    );
  }

  function getActions() {
    return clone(
      state.actions
    );
  }

  function getSummary() {
    return clone(
      state.summary
    );
  }

  function getProfile() {
    return {
      location:
        clone(state.location),

      preferences:
        clone(state.preferences),

      analysis:
        clone(state.analysis),

      fit:
        clone(state.fit),

      signals:
        clone(state.signals),

      findings:
        clone(state.findings),

      tradeoffs:
        clone(state.tradeoffs),

      gaps:
        clone(state.gaps),

      actions:
        clone(state.actions),

      summary:
        clone(state.summary)
    };
  }

  /* ============================================================
   * PERSISTENCE
   * ============================================================ */

  function persist() {
    if (
      !config.persist ||
      !window.localStorage
    ) {
      return false;
    }

    try {
      window.localStorage.setItem(
        config.storageKey,
        JSON.stringify({
          version:
            VERSION,

          config:
            clone(config),

          state:
            clone(state)
        })
      );

      return true;
    } catch (error) {
      console.warn(
        MODULE_NAME +
        ": persistence failed",
        error
      );

      return false;
    }
  }

  function restore() {
    if (
      !config.persist ||
      !window.localStorage
    ) {
      return false;
    }

    try {
      const raw =
        window.localStorage.getItem(
          config.storageKey
        );

      if (!raw) {
        return false;
      }

      const saved =
        JSON.parse(raw);

      if (
        !saved ||
        !saved.state
      ) {
        return false;
      }

      const defaults =
        createInitialState();

      state =
        Object.assign(
          defaults,
          saved.state
        );

      state.metadata =
        Object.assign(
          {},
          defaults.metadata,
          saved.state.metadata || {}
        );

      state.location =
        Object.assign(
          {},
          defaults.location,
          saved.state.location || {}
        );

      state.preferences =
        Object.assign(
          {},
          defaults.preferences,
          saved.state.preferences || {}
        );

      state.sourceData =
        Object.assign(
          {},
          defaults.sourceData,
          saved.state.sourceData || {}
        );

      state.analysis =
        Object.assign(
          {},
          defaults.analysis,
          saved.state.analysis || {}
        );

      state.fit =
        Object.assign(
          {},
          defaults.fit,
          saved.state.fit || {}
        );

      state.summary =
        Object.assign(
          {},
          defaults.summary,
          saved.state.summary || {}
        );

      state.signals =
        array(
          saved.state.signals
        );

      state.findings =
        array(
          saved.state.findings
        );

      state.tradeoffs =
        array(
          saved.state.tradeoffs
        );

      state.gaps =
        array(
          saved.state.gaps
        );

      state.actions =
        array(
          saved.state.actions
        );

      state.aiContext =
        saved.state.aiContext ||
        {};

      return true;
    } catch (error) {
      console.warn(
        MODULE_NAME +
        ": restore failed",
        error
      );

      return false;
    }
  }

  function clearPersistence() {
    if (
      !window.localStorage
    ) {
      return false;
    }

    try {
      window.localStorage.removeItem(
        config.storageKey
      );

      return true;
    } catch (error) {
      console.warn(
        MODULE_NAME +
        ": clear persistence failed",
        error
      );

      return false;
    }
  }

  /* ============================================================
   * RESET / SERIALIZATION
   * ============================================================ */

  function reset(options) {
    const opts =
      options || {};

    state =
      createInitialState();

    if (
      opts.keepLocation
    ) {
      state.location =
        normalizeLocation(
          opts.location ||
          {}
        );
    }

    if (
      opts.keepPreferences
    ) {
      state.preferences =
        normalizePreferences(
          opts.preferences ||
          {}
        );
    }

    state.metadata.updatedAt =
      now();

    if (
      opts.clearPersistence !== false
    ) {
      clearPersistence();
    }

    emit(
      "reset",
      getState()
    );

    return getState();
  }

  function serialize() {
    return JSON.stringify(
      getResult(),
      null,
      2
    );
  }

  /* ============================================================
   * SUBSCRIPTIONS
   * ============================================================ */

  function subscribe(
    eventName,
    handler
  ) {
    if (
      typeof handler !== "function"
    ) {
      return function () {};
    }

    if (
      !subscribers[eventName]
    ) {
      subscribers[eventName] =
        [];
    }

    subscribers[eventName].push(
      handler
    );

    return function unsubscribe() {
      const list =
        subscribers[eventName] ||
        [];

      const index =
        list.indexOf(
          handler
        );

      if (index !== -1) {
        list.splice(
          index,
          1
        );
      }
    };
  }

  /* ============================================================
   * INITIALIZATION
   * ============================================================ */

  function initialize(options) {
    const requested =
      clone(options || {});

    if (
      config.persist
    ) {
      restore();
    }

    if (
      Object.keys(requested).length
    ) {
      config =
        Object.assign(
          {},
          config,
          requested
        );
    }

    state.metadata.version =
      VERSION;

    state.metadata.createdAt =
      state.metadata.createdAt ||
      now();

    state.metadata.updatedAt =
      now();

    state.initialized =
      true;

    if (
      state.status === "idle"
    ) {
      state.status =
        "initialized";
    }

    persist();

    emit(
      "initialized",
      getStatus()
    );

    return getStatus();
  }

  /* ============================================================
   * PUBLIC API
   * ============================================================ */

  const api = {
    VERSION:
      VERSION,

    NAME:
      MODULE_NAME,

    initialize:
      initialize,

    configure:
      configure,

    getConfig:
      getConfig,

    reset:
      reset,

    analyze:
      analyze,

    analyzeFromCore:
      analyzeFromCore,

    setLocation:
      setLocation,

    getLocation:
      getLocation,

    setPreferences:
      setPreferences,

    getPreferences:
      getPreferences,

    setSourceData:
      setSourceData,

    getSourceData:
      getSourceData,

    collectAvailableModules:
      collectAvailableModules,

    getState:
      getState,

    getStatus:
      getStatus,

    getResult:
      getResult,

    getProfile:
      getProfile,

    getAnalysis:
      getAnalysis,

    getFit:
      getFit,

    getSignals:
      getSignals,

    getFindings:
      getFindings,

    getTradeoffs:
      getTradeoffs,

    getGaps:
      getGaps,

    getActions:
      getActions,

    getSummary:
      getSummary,

    buildAIContext:
      buildAIContext,

    getAIContext:
      getAIContext,

    buildSharedContext:
      buildSharedContext,

    persist:
      persist,

    restore:
      restore,

    clearPersistence:
      clearPersistence,

    serialize:
      serialize,

    subscribe:
      subscribe
  };

  /* ============================================================
   * GLOBAL EXPORT
   * ============================================================ */

  window.ROlyfeLocationAnalysis =
    api;

  window.ROLYFE_LOCATION_ANALYSIS =
    api;

  /* ============================================================
   * AUTO INITIALIZATION
   * ============================================================ */

  if (
    config.autoInitialize
  ) {
    try {
      initialize();
    } catch (error) {
      console.error(
        MODULE_NAME +
        ": auto initialization failed",
        error
      );
    }
  }

})(window);
