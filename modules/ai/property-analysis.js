/* ============================================================
   RO’Lyfe Relocation Intelligence Center™
   PROPERTY ANALYSIS ENGINE
   ------------------------------------------------------------
   File: /modules/ai/property-analysis.js
   Version: 1.0.0
   Status: LIVE
   Backup: /modules/ai/backups/property-analysis.backup-v1.0.0.js

   Purpose:
   Property-level intelligence aggregation layer.

   This module:
   - Normalizes property information
   - Connects property data to location intelligence
   - Connects property data to housing intelligence
   - Connects property data to climate / weather / risk
   - Connects property data to incentives / business opportunity
   - Calculates transparent deal-level metrics
   - Produces AI-ready property context
   - Supports comparable-property ingestion
   - Supports future Real Estate Command Center integration

   IMPORTANT:
   This is an intelligence layer.
   It is NOT a replacement for the RO’Lyfe
   Real Estate Command Center calculator.

   Guardrails:
   - Never invent property facts.
   - Never invent ARV.
   - Never invent financing.
   - Never invent rent.
   - Never represent estimated values as verified.
   - Never represent incentives as guaranteed.
   - Never represent risk information as verified without source data.
   - Distinguish supplied / estimated / calculated / external data.
   ============================================================ */

(function (window) {
  "use strict";

  var MODULE_NAME = "ROlyfePropertyAnalysis";
  var VERSION = "1.0.0";

  var DEFAULT_CONFIG = {
    autoInitialize: true,
    persist: true,
    storageKey: "rolyfe_property_analysis_v1",

    maxSignals: 40,
    maxFindings: 40,
    maxTradeoffs: 30,
    maxGaps: 30,
    maxActions: 30,
    maxComparableProperties: 25,
    maxSources: 40,

    currency: "USD",

    defaultHoldingMonths: 6,
    defaultSellingCostRate: 0.08,
    defaultContingencyRate: 0.10
  };

  var EMPTY_STATE = {
    status: "idle",
    initialized: false,

    property: null,
    location: null,
    preferences: {},

    sourceData: {
      property: null,
      location: null,
      housing: null,
      climate: null,
      weather: null,
      risk: null,
      incentives: null,
      business: null,
      opportunity: null,
      core: null
    },

    financial: {},
    market: {},
    physical: {},
    risk: {},
    analysis: {},

    signals: [],
    findings: [],
    tradeoffs: [],
    gaps: [],
    actions: [],
    sources: [],

    summary: {},
    aiContext: {},

    metadata: {
      module: MODULE_NAME,
      version: VERSION,
      createdAt: null,
      updatedAt: null,
      lastAnalysisAt: null
    }
  };

  var config = clone(DEFAULT_CONFIG);
  var state = clone(EMPTY_STATE);
  var listeners = [];

  /* ============================================================
     EVENTS
     ============================================================ */

  function subscribe(listener) {
    if (typeof listener !== "function") return function () {};

    listeners.push(listener);

    return function unsubscribe() {
      listeners = listeners.filter(function (item) {
        return item !== listener;
      });
    };
  }

  function emit(eventName, payload) {
    listeners.slice().forEach(function (listener) {
      try {
        listener({
          event: eventName,
          payload: payload || null,
          state: clone(state)
        });
      } catch (error) {
        console.warn(
          "[ROlyfePropertyAnalysis] Listener error:",
          error
        );
      }
    });
  }

  /* ============================================================
     HELPERS
     ============================================================ */

  function clone(value) {
    if (value === undefined) return undefined;

    try {
      return JSON.parse(JSON.stringify(value));
    } catch (error) {
      return value;
    }
  }

  function isObject(value) {
    return (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
    );
  }

  function hasValue(value) {
    return (
      value !== undefined &&
      value !== null &&
      value !== ""
    );
  }

  function number(value, fallback) {
    if (!hasValue(value)) {
      return fallback !== undefined ? fallback : null;
    }

    if (typeof value === "number") {
      return Number.isFinite(value)
        ? value
        : fallback !== undefined
          ? fallback
          : null;
    }

    var cleaned = String(value)
      .replace(/[$,%]/g, "")
      .replace(/,/g, "")
      .trim();

    var parsed = Number(cleaned);

    return Number.isFinite(parsed)
      ? parsed
      : fallback !== undefined
        ? fallback
        : null;
  }

  function firstValue() {
    for (var i = 0; i < arguments.length; i++) {
      if (hasValue(arguments[i])) {
        return arguments[i];
      }
    }

    return null;
  }

  function cap(array, limit) {
    return Array.isArray(array)
      ? array.slice(0, limit)
      : [];
  }

  function unique(array) {
    var seen = {};
    var result = [];

    (Array.isArray(array) ? array : []).forEach(function (item) {
      var key;

      try {
        key = JSON.stringify(item);
      } catch (error) {
        key = String(item);
      }

      if (!seen[key]) {
        seen[key] = true;
        result.push(item);
      }
    });

    return result;
  }

  function now() {
    return new Date().toISOString();
  }

  function safeCall(fn, fallback) {
    try {
      return typeof fn === "function"
        ? fn()
        : fallback;
    } catch (error) {
      return fallback;
    }
  }

  /* ============================================================
     MODULE ACCESS
     ============================================================ */

  function getModule(primaryName, fallbackName) {
    return (
      window[primaryName] ||
      (fallbackName ? window[fallbackName] : null) ||
      null
    );
  }

  function callModule(module, methodNames, args) {
    if (!module) return null;

    var methods = Array.isArray(methodNames)
      ? methodNames
      : [methodNames];

    for (var i = 0; i < methods.length; i++) {
      var method = methods[i];

      if (typeof module[method] === "function") {
        try {
          return module[method].apply(module, args || []);
        } catch (error) {
          console.warn(
            "[ROlyfePropertyAnalysis] Module call failed:",
            method,
            error
          );

          return null;
        }
      }
    }

    return null;
  }

  /* ============================================================
     PROPERTY NORMALIZATION
     ============================================================ */

  function normalizeProperty(input) {
    input = isObject(input) ? input : {};

    var property = {
      id: firstValue(input.id, input.propertyId, input.property_id),

      address: firstValue(
        input.address,
        input.street,
        input.propertyAddress
      ),

      city: firstValue(
        input.city,
        input.propertyCity
      ),

      state: firstValue(
        input.state,
        input.stateCode,
        input.propertyState
      ),

      zip: firstValue(
        input.zip,
        input.zipCode,
        input.postalCode
      ),

      county: firstValue(
        input.county,
        input.countyName
      ),

      country: firstValue(
        input.country,
        "US"
      ),

      type: firstValue(
        input.type,
        input.propertyType,
        input.property_type
      ),

      status: firstValue(
        input.status,
        input.listingStatus
      ),

      beds: number(
        firstValue(
          input.beds,
          input.bedrooms,
          input.bedroomCount
        )
      ),

      baths: number(
        firstValue(
          input.baths,
          input.bathrooms,
          input.bathroomCount
        )
      ),

      sqft: number(
        firstValue(
          input.sqft,
          input.squareFeet,
          input.livingArea
        )
      ),

      lot: number(
        firstValue(
          input.lot,
          input.lotSize,
          input.lotSquareFeet
        )
      ),

      yearBuilt: number(
        firstValue(
          input.yearBuilt,
          input.year_built
        )
      ),

      askingPrice: number(
        firstValue(
          input.askingPrice,
          input.listPrice,
          input.price
        )
      ),

      purchasePrice: number(
        firstValue(
          input.purchasePrice,
          input.purchase_price,
          input.contractPrice
        )
      ),

      currentValue: number(
        firstValue(
          input.currentValue,
          input.marketValue
        )
      ),

      arv: number(
        firstValue(
          input.arv,
          input.ARV,
          input.afterRepairValue,
          input.after_repair_value
        )
      ),

      rent: number(
        firstValue(
          input.rent,
          input.monthlyRent,
          input.marketRent
        )
      ),

      taxes: number(
        firstValue(
          input.taxes,
          input.propertyTaxes,
          input.annualTaxes
        )
      ),

      insurance: number(
        firstValue(
          input.insurance,
          input.annualInsurance
        )
      ),

      hoa: number(
        firstValue(
          input.hoa,
          input.hoaFee,
          input.monthlyHoa
        )
      ),

      rehab: number(
        firstValue(
          input.rehab,
          input.rehabCost,
          input.repairCost,
          input.renovationCost
        ),
        0
      ),

      holdingMonths: number(
        firstValue(
          input.holdingMonths,
          input.holdMonths
        )
      ),

      holdingCost: number(
        firstValue(
          input.holdingCost,
          input.holdingCosts,
          input.totalHoldingCost
        )
      ),

      financingCost: number(
        firstValue(
          input.financingCost,
          input.financeCost,
          input.loanCost
        ),
        0
      ),

      closingCosts: number(
        firstValue(
          input.closingCosts,
          input.closingCost,
          input.acquisitionCosts
        ),
        0
      ),

      sellingCosts: number(
        firstValue(
          input.sellingCosts,
          input.saleCosts,
          input dispositionCosts
        ),
        0
      ),

      assignmentFee: number(
        firstValue(
          input.assignmentFee,
          input.assignment_fee
        ),
        0
      ),

      downPayment: number(
        firstValue(
          input.downPayment,
          input.down_payment
        )
      ),

      interestRate: number(
        firstValue(
          input.interestRate,
          input.rate,
          input.interest
        )
      ),

      loanAmount: number(
        firstValue(
          input.loanAmount,
          input.loan_amount
        )
      ),

      source: firstValue(
        input.source,
        input.sourceName
      ),

      url: firstValue(
        input.url,
        input.listingUrl,
        input.propertyUrl
      ),

      lat: number(
        firstValue(
          input.lat,
          input.latitude
        )
      ),

      lon: number(
        firstValue(
          input.lon,
          input.lng,
          input.longitude
        )
      ),

      description: firstValue(
        input.description,
        input.notes
      ),

      raw: clone(input)
    };

    property.location = normalizeLocation(
      input.location || property
    );

    return property;
  }

  function normalizeLocation(input) {
    input = isObject(input) ? input : {};

    return {
      address: firstValue(
        input.address,
        input.street
      ),

      city: firstValue(
        input.city
      ),

      state: firstValue(
        input.state,
        input.stateCode
      ),

      zip: firstValue(
        input.zip,
        input.zipCode,
        input.postalCode
      ),

      county: firstValue(
        input.county,
        input.countyName
      ),

      country: firstValue(
        input.country,
        "US"
      ),

      lat: number(
        firstValue(
          input.lat,
          input.latitude
        )
      ),

      lon: number(
        firstValue(
          input.lon,
          input.lng,
          input.longitude
        )
      )
    };
  }

  function buildPropertyLocation(property) {
    if (!property) return null;

    return normalizeLocation({
      address: property.address,
      city: property.city,
      state: property.state,
      zip: property.zip,
      county: property.county,
      country: property.country,
      lat: property.lat,
      lon: property.lon
    });
  }

  /* ============================================================
     FINANCIAL ANALYSIS
     ============================================================ */

  function calculateHoldingCost(property, holdingMonths) {
    if (!property) return 0;

    if (hasValue(property.holdingCost)) {
      return number(property.holdingCost, 0);
    }

    var months = number(
      holdingMonths,
      config.defaultHoldingMonths
    );

    var monthlyTaxes = number(property.taxes, 0) / 12;
    var monthlyInsurance = number(property.insurance, 0) / 12;
    var monthlyHoa = number(property.hoa, 0);

    var monthlyCarry =
      monthlyTaxes +
      monthlyInsurance +
      monthlyHoa;

    return monthlyCarry * months;
  }

  function buildFinancialProfile(property) {
    property = property || {};

    var purchase = number(
      property.purchasePrice,
      number(property.askingPrice, 0)
    );

    var rehab = number(property.rehab, 0);
    var closing = number(property.closingCosts, 0);
    var financing = number(property.financingCost, 0);
    var selling = number(property.sellingCosts, 0);
    var assignment = number(property.assignmentFee, 0);

    var holdingMonths = number(
      property.holdingMonths,
      config.defaultHoldingMonths
    );

    var holdingCost = calculateHoldingCost(
      property,
      holdingMonths
    );

    var arv = number(property.arv);

    var totalProjectCost =
      purchase +
      rehab +
      closing +
      financing +
      holdingCost;

    var totalBasis = totalProjectCost;

    var estimatedProfit = null;

    if (hasValue(arv)) {
      estimatedProfit =
        arv -
        totalBasis -
        selling -
        assignment;
    }

    var profitMargin = null;

    if (
      hasValue(estimatedProfit) &&
      arv > 0
    ) {
      profitMargin =
        estimatedProfit / arv;
    }

    var equitySpread = null;

    if (
      hasValue(arv) &&
      hasValue(purchase)
    ) {
      equitySpread =
        arv - purchase;
    }

    var purchaseToARV = null;

    if (
      purchase > 0 &&
      hasValue(arv)
    ) {
      purchaseToARV =
        purchase / arv;
    }

    var rehabToARV = null;

    if (
      hasValue(rehab) &&
      hasValue(arv) &&
      arv > 0
    ) {
      rehabToARV =
        rehab / arv;
    }

    return {
      purchasePrice: purchase,
      rehab: rehab,
      closingCosts: closing,
      financingCost: financing,
      holdingCost: holdingCost,
      holdingMonths: holdingMonths,
      sellingCosts: selling,
      assignmentFee: assignment,

      arv: arv,

      totalProjectCost: totalProjectCost,
      totalBasis: totalBasis,

      estimatedProfit: estimatedProfit,
      profitMargin: profitMargin,

      equitySpread: equitySpread,
      purchaseToARV: purchaseToARV,
      rehabToARV: rehabToARV,

      monthlyRent: number(property.rent),
      annualTaxes: number(property.taxes),
      annualInsurance: number(property.insurance),
      monthlyHoa: number(property.hoa),

      status:
        hasValue(arv) &&
        purchase > 0
          ? "calculated"
          : "incomplete"
    };
  }

  /* ============================================================
     DOMAIN DATA COLLECTION
     ============================================================ */

  function collectLocationData(location) {
    var module = getModule(
      "ROlyfeLocationEngine",
      "ROLYFE_LOCATION_ENGINE"
    );

    var result = callModule(
      module,
      [
        "getProfile",
        "getLocation",
        "getState"
      ],
      []
    );

    return result || location || null;
  }

  function collectHousingData() {
    var module = getModule(
      "ROlyfeHousing",
      "ROLYFE_HOUSING"
    );

    return callModule(
      module,
      [
        "getProfile",
        "getResult",
        "getState"
      ],
      []
    );
  }

  function collectClimateData() {
    var module = getModule(
      "ROlyfeClimate",
      "ROLYFE_CLIMATE"
    );

    return callModule(
      module,
      [
        "getProfile",
        "getResult",
        "getState"
      ],
      []
    );
  }

  function collectWeatherData() {
    var module = getModule(
      "ROlyfeWeather",
      "ROLYFE_WEATHER"
    );

    return callModule(
      module,
      [
        "getProfile",
        "getResult",
        "getState"
      ],
      []
    );
  }

  function collectRiskData() {
    var module = getModule(
      "ROlyfeRisk",
      "ROLYFE_RISK"
    );

    return callModule(
      module,
      [
        "getProfile",
        "getResult",
        "getState"
      ],
      []
    );
  }

  function collectIncentiveData() {
    var module = getModule(
      "ROlyfeIncentives",
      "ROLYFE_INCENTIVES"
    );

    return callModule(
      module,
      [
        "getProfile",
        "getResult",
        "getState"
      ],
      []
    );
  }

  function collectBusinessData() {
    var module = getModule(
      "ROlyfeBusiness",
      "ROLYFE_BUSINESS"
    );

    return callModule(
      module,
      [
        "getProfile",
        "getResult",
        "getState",
        "getAnalysis"
      ],
      []
    );
  }

  function collectOpportunityData() {
    var module = getModule(
      "ROlyfeOpportunityEngine",
      "ROLYFE_OPPORTUNITY_ENGINE"
    );

    return callModule(
      module,
      [
        "getProfile",
        "getAnalysis",
        "getState"
      ],
      []
    );
  }

  function collectCoreData() {
    var module = getModule(
      "ROlyfeCore",
      "ROLYFE_CORE"
    );

    return callModule(
      module,
      [
        "buildSharedContext",
        "getAIContext",
        "getAnalysis"
      ],
      []
    );
  }

  function collectContext() {
    var property = state.property;

    var location =
      buildPropertyLocation(property) ||
      state.location;

    state.location = location;

    state.sourceData.location =
      collectLocationData(location);

    state.sourceData.housing =
      collectHousingData();

    state.sourceData.climate =
      collectClimateData();

    state.sourceData.weather =
      collectWeatherData();

    state.sourceData.risk =
      collectRiskData();

    state.sourceData.incentives =
      collectIncentiveData();

    state.sourceData.business =
      collectBusinessData();

    state.sourceData.opportunity =
      collectOpportunityData();

    state.sourceData.core =
      collectCoreData();

    return state.sourceData;
  }

  /* ============================================================
     PROPERTY INGESTION
     ============================================================ */

  function ingestProperty(input) {
    var property = normalizeProperty(input);

    state.property = property;

    state.location =
      buildPropertyLocation(property);

    state.sourceData.property =
      clone(property);

    state.financial =
      buildFinancialProfile(property);

    state.physical = {
      type: property.type,
      beds: property.beds,
      baths: property.baths,
      sqft: property.sqft,
      lot: property.lot,
      yearBuilt: property.yearBuilt,
      condition:
        firstValue(
          property.raw && property.raw.condition,
          property.raw && property.raw.propertyCondition
        )
    };

    state.status = "property_loaded";

    state.metadata.updatedAt = now();

    emit(
      "property:ingested",
      clone(property)
    );

    persist();

    return clone(property);
  }

  /* ============================================================
     SIGNAL ENGINE
     ============================================================ */

  function buildSignals() {
    var signals = [];

    var property = state.property || {};
    var financial = state.financial || {};
    var housing = state.sourceData.housing || {};
    var climate = state.sourceData.climate || {};
    var weather = state.sourceData.weather || {};
    var risk = state.sourceData.risk || {};
    var business = state.sourceData.business || {};
    var incentives = state.sourceData.incentives || {};

    if (hasValue(property.arv)) {
      signals.push({
        domain: "property",
        type: "positive",
        label: "ARV supplied",
        detail:
          "An after-repair value was supplied for analysis.",
        source: "user_input"
      });
    }

    if (
      hasValue(financial.estimatedProfit) &&
      financial.estimatedProfit > 0
    ) {
      signals.push({
        domain: "financial",
        type: "positive",
        label: "Positive estimated spread",
        detail:
          "The current inputs produce a positive calculated spread before unmodeled changes.",
        source: "calculated"
      });
    }

    if (
      hasValue(financial.estimatedProfit) &&
      financial.estimatedProfit < 0
    ) {
      signals.push({
        domain: "financial",
        type: "warning",
        label: "Negative estimated spread",
        detail:
          "Current inputs produce a negative calculated spread.",
        source: "calculated"
      });
    }

    if (
      hasValue(financial.rehabToARV) &&
      financial.rehabToARV >= 0.30
    ) {
      signals.push({
        domain: "financial",
        type: "warning",
        label: "High rehab intensity",
        detail:
          "Rehab represents 30% or more of supplied ARV.",
        source: "calculated"
      });
    }

    if (
      hasValue(financial.purchaseToARV) &&
      financial.purchaseToARV <= 0.65
    ) {
      signals.push({
        domain: "financial",
        type: "positive",
        label: "Purchase below supplied ARV",
        detail:
          "Purchase price is 65% or less of the supplied ARV.",
        source: "calculated"
      });
    }

    if (
      hasValue(property.yearBuilt) &&
      property.yearBuilt <=
        new Date().getFullYear() - 75
    ) {
      signals.push({
        domain: "property",
        type: "attention",
        label: "Older property",
        detail:
          "The supplied year built indicates a property at least 75 years old.",
        source: "user_input"
      });
    }

    if (
      housing &&
      isObject(housing.profile) &&
      hasValue(housing.profile.medianHomePrice)
    ) {
      signals.push({
        domain: "housing",
        type: "information",
        label: "Housing benchmark available",
        detail:
          "Housing profile contains a median home-price benchmark.",
        source: "housing_module"
      });
    }

    if (
      climate &&
      (hasValue(climate.climateZone) ||
        hasValue(climate.profile))
    ) {
      signals.push({
        domain: "climate",
        type: "information",
        label: "Climate context available",
        detail:
          "Climate information is available for the selected location.",
        source: "climate_module"
      });
    }

    if (
      weather &&
      Array.isArray(weather.alerts) &&
      weather.alerts.length
    ) {
      signals.push({
        domain: "weather",
        type: "warning",
        label: "Active weather alerts",
        detail:
          "The weather layer reports active alerts.",
        source: "weather_module"
      });
    }

    if (
      risk &&
      hasValue(
        risk.riskLevel ||
        risk.overallRisk ||
        risk.profile
      )
    ) {
      signals.push({
        domain: "risk",
        type: "attention",
        label: "Risk context available",
        detail:
          "Hazard information is available for this location.",
        source: "risk_module"
      });
    }

    if (
      incentives &&
      (
        Array.isArray(incentives.matches) ||
        Array.isArray(incentives.programs)
      )
    ) {
      signals.push({
        domain: "incentives",
        type: "information",
        label: "Incentive context available",
        detail:
          "Relocation or economic incentive information is available.",
        source: "incentives_module"
      });
    }

    if (
      business &&
      (
        Array.isArray(business.matches) ||
        Array.isArray(business.programs)
      )
    ) {
      signals.push({
        domain: "business",
        type: "information",
        label: "Business opportunity context available",
        detail:
          "Business or economic opportunity information is available.",
        source: "business_module"
      });
    }

    return cap(
      unique(signals),
      config.maxSignals
    );
  }

  /* ============================================================
     FINDINGS
     ============================================================ */

  function buildFindings() {
    var findings = [];

    var property = state.property || {};
    var financial = state.financial || {};

    if (
      hasValue(financial.arv) &&
      hasValue(financial.purchasePrice)
    ) {
      findings.push({
        domain: "financial",
        type: "spread",
        title: "Purchase-to-ARV relationship",
        detail:
          "The purchase price and supplied ARV can be evaluated together.",
        values: {
          purchasePrice:
            financial.purchasePrice,
          arv:
            financial.arv,
          purchaseToARV:
            financial.purchaseToARV
        }
      });
    }

    if (
      hasValue(financial.rehab) &&
      financial.rehab > 0
    ) {
      findings.push({
        domain: "financial",
        type: "rehab",
        title: "Rehab requirement identified",
        detail:
          "A rehabilitation budget was supplied and included in the project basis.",
        values: {
          rehab:
            financial.rehab,
          rehabToARV:
            financial.rehabToARV
        }
      });
    }

    if (
      hasValue(financial.estimatedProfit)
    ) {
      findings.push({
        domain: "financial",
        type: "profit_context",
        title: "Calculated profit context",
        detail:
          "Estimated profit is calculated from the supplied purchase, rehab, carrying, financing, selling, assignment, and ARV inputs.",
        values: {
          estimatedProfit:
            financial.estimatedProfit,
          profitMargin:
            financial.profitMargin
        }
      });
    }

    if (
      hasValue(property.yearBuilt) &&
      property.yearBuilt <=
        new Date().getFullYear() - 75
    ) {
      findings.push({
        domain: "property",
        type: "age",
        title: "Older-property due diligence",
        detail:
          "Age may justify additional inspection of major systems, structure, roof, electrical, plumbing, and deferred maintenance.",
        values: {
          yearBuilt:
            property.yearBuilt
        }
      });
    }

    var weather =
      state.sourceData.weather || {};

    if (
      Array.isArray(weather.alerts) &&
      weather.alerts.length
    ) {
      findings.push({
        domain: "weather",
        type: "active_alert",
        title: "Active weather context",
        detail:
          "Current weather alerts should be considered separately from long-term climate and geographic hazard exposure.",
        values: {
          alertCount:
            weather.alerts.length
        }
      });
    }

    var risk =
      state.sourceData.risk || {};

    if (
      hasValue(
        risk.riskLevel ||
        risk.overallRisk
      )
    ) {
      findings.push({
        domain: "risk",
        type: "risk_context",
        title: "Property risk context available",
        detail:
          "The risk module has supplied geographic hazard context.",
        values: {
          riskLevel:
            firstValue(
              risk.riskLevel,
              risk.overallRisk
            )
        }
      });
    }

    return cap(
      findings,
      config.maxFindings
    );
  }

  /* ============================================================
     TRADEOFFS
     ============================================================ */

  function buildTradeoffs() {
    var property = state.property || {};
    var financial = state.financial || {};

    var tradeoffs = [];

    if (
      hasValue(financial.arv) &&
      hasValue(financial.purchasePrice)
    ) {
      tradeoffs.push({
        domain: "financial",
        factor: "ARV vs purchase",
        upside:
          "A lower purchase-to-ARV ratio can create more room for project costs.",
        caution:
          "ARV must be supported by appropriate comparable sales and market evidence."
      });
    }

    if (
      hasValue(financial.rehab) &&
      financial.rehab > 0
    ) {
      tradeoffs.push({
        domain: "financial",
        factor: "Rehab",
        upside:
          "Rehabilitation can create value when scope and market demand support the projected ARV.",
        caution:
          "Actual construction cost, permitting, delays, and change orders can materially affect returns."
      });
    }

    if (
      hasValue(property.rent)
    ) {
      tradeoffs.push({
        domain: "housing",
        factor: "Rental potential",
        upside:
          "A supplied rent estimate allows future rental analysis.",
        caution:
          "Rent should be validated against current comparable rentals and actual property condition."
      });
    }

    if (
      state.sourceData.incentives
    ) {
      tradeoffs.push({
        domain: "incentives",
        factor: "Programs",
        upside:
          "Eligible programs may improve project economics.",
        caution:
          "Program availability and eligibility must be verified with the administering organization."
      });
    }

    if (
      state.sourceData.risk
    ) {
      tradeoffs.push({
        domain: "risk",
        factor: "Hazard exposure",
        upside:
          "Risk data can improve due diligence and planning.",
        caution:
          "Insurance, flood requirements, mitigation, and property-specific conditions require separate verification."
      });
    }

    return cap(
      unique(tradeoffs),
      config.maxTradeoffs
    );
  }

  /* ============================================================
     DATA GAPS
     ============================================================ */

  function buildGaps() {
    var property = state.property || {};
    var gaps = [];

    if (!hasValue(property.address)) {
      gaps.push({
        domain: "property",
        field: "address",
        importance: "high",
        message:
          "Property address is missing."
      });
    }

    if (!hasValue(property.type)) {
      gaps.push({
        domain: "property",
        field: "type",
        importance: "medium",
        message:
          "Property type is missing."
      });
    }

    if (!hasValue(property.purchasePrice) &&
        !hasValue(property.askingPrice)) {
      gaps.push({
        domain: "financial",
        field: "purchasePrice",
        importance: "high",
        message:
          "Purchase or asking price is missing."
      });
    }

    if (!hasValue(property.arv)) {
      gaps.push({
        domain: "financial",
        field: "arv",
        importance: "high",
        message:
          "ARV is missing."
      });
    }

    if (!hasValue(property.rehab)) {
      gaps.push({
        domain: "financial",
        field: "rehab",
        importance: "high",
        message:
          "Rehab estimate is missing."
      });
    }

    if (!hasValue(property.yearBuilt)) {
      gaps.push({
        domain: "property",
        field: "yearBuilt",
        importance: "medium",
        message:
          "Year built is missing."
      });
    }

    if (!hasValue(property.sqft)) {
      gaps.push({
        domain: "property",
        field: "sqft",
        importance: "medium",
        message:
          "Square footage is missing."
      });
    }

    if (!hasValue(property.beds)) {
      gaps.push({
        domain: "property",
        field: "beds",
        importance: "medium",
        message:
          "Bedroom count is missing."
      });
    }

    if (!hasValue(property.baths)) {
      gaps.push({
        domain: "property",
        field: "baths",
        importance: "medium",
        message:
          "Bathroom count is missing."
      });
    }

    if (!state.sourceData.housing) {
      gaps.push({
        domain: "housing",
        field: "housingData",
        importance: "medium",
        message:
          "Housing intelligence is not currently available."
      });
    }

    if (!state.sourceData.risk) {
      gaps.push({
        domain: "risk",
        field: "riskData",
        importance: "medium",
        message:
          "Risk intelligence is not currently available."
      });
    }

    if (!state.sourceData.climate) {
      gaps.push({
        domain: "climate",
        field: "climateData",
        importance: "low",
        message:
          "Climate intelligence is not currently available."
      });
    }

    return cap(
      gaps,
      config.maxGaps
    );
  }

  /* ============================================================
     ACTIONS
     ============================================================ */

  function buildActions() {
    var property = state.property || {};
    var actions = [];

    if (!hasValue(property.address)) {
      actions.push({
        priority: "high",
        domain: "property",
        action:
          "Add the complete property address."
      });
    }

    if (!hasValue(property.arv)) {
      actions.push({
        priority: "high",
        domain: "financial",
        action:
          "Add a supported ARV estimate using appropriate comparable sales."
      });
    }

    if (!hasValue(property.rehab)) {
      actions.push({
        priority: "high",
        domain: "financial",
        action:
          "Add a preliminary rehab scope and budget."
      });
    }

    actions.push({
      priority: "high",
      domain: "due_diligence",
      action:
        "Verify title, zoning, permits, taxes, insurance, utilities, and property condition."
    });

    actions.push({
      priority: "medium",
      domain: "market",
      action:
        "Validate ARV against current comparable properties."
    });

    actions.push({
      priority: "medium",
      domain: "construction",
      action:
        "Obtain contractor pricing and identify contingency requirements."
    });

    if (hasValue(property.url)) {
      actions.push({
        priority: "low",
        domain: "source",
        action:
          "Review the original property listing/source."
      });
    }

    var weather =
      state.sourceData.weather || {};

    if (
      Array.isArray(weather.alerts) &&
      weather.alerts.length
    ) {
      actions.push({
        priority: "high",
        domain: "weather",
        action:
          "Review active weather alerts before scheduling property activity."
      });
    }

    return cap(
      unique(actions),
      config.maxActions
    );
  }

  /* ============================================================
     MARKET ANALYSIS
     ============================================================ */

  function buildMarketAnalysis() {
    var housing =
      state.sourceData.housing || {};

    var profile =
      housing.profile ||
      housing.housingProfile ||
      housing;

    var property = state.property || {};

    var medianHomePrice =
      number(
        firstValue(
          profile.medianHomePrice,
          profile.median_home_price,
          profile.medianPrice
        )
      );

    var medianRent =
      number(
        firstValue(
          profile.medianRent,
          profile.median_rent,
          profile.medianMonthlyRent
        )
      );

    var priceToMedian = null;

    if (
      hasValue(property.purchasePrice) &&
      hasValue(medianHomePrice) &&
      medianHomePrice > 0
    ) {
      priceToMedian =
        property.purchasePrice /
        medianHomePrice;
    }

    var rentToPriceRatio = null;

    if (
      hasValue(property.rent) &&
      hasValue(property.purchasePrice) &&
      property.purchasePrice > 0
    ) {
      rentToPriceRatio =
        (property.rent * 12) /
        property.purchasePrice;
    }

    return {
      medianHomePrice:
        medianHomePrice,

      medianRent:
        medianRent,

      propertyPriceToMedian:
        priceToMedian,

      rentToPriceRatio:
        rentToPriceRatio,

      source:
        state.sourceData.housing
          ? "housing_module"
          : null
    };
  }

  /* ============================================================
     RISK ANALYSIS
     ============================================================ */

  function buildRiskAnalysis() {
    var risk =
      state.sourceData.risk || {};

    var weather =
      state.sourceData.weather || {};

    return {
      riskLevel:
        firstValue(
          risk.riskLevel,
          risk.overallRisk,
          risk.level
        ),

      hazards:
        cap(
          firstValue(
            risk.hazards,
            risk.hazardProfiles,
            []
          ),
          30
        ),

      activeWeatherAlerts:
        Array.isArray(weather.alerts)
          ? weather.alerts.length
          : 0,

      verificationRequired: true,

      sourceAvailable:
        !!state.sourceData.risk
    };
  }

  /* ============================================================
     OPPORTUNITY ANALYSIS
     ============================================================ */

  function buildOpportunityAnalysis() {
    var business =
      state.sourceData.business || {};

    var incentives =
      state.sourceData.incentives || {};

    var businessMatches =
      Array.isArray(business.matches)
        ? business.matches
        : [];

    var incentiveMatches =
      Array.isArray(incentives.matches)
        ? incentives.matches
        : [];

    var programs =
      Array.isArray(business.programs)
        ? business.programs
        : [];

    var incentivePrograms =
      Array.isArray(incentives.programs)
        ? incentives.programs
        : [];

    return {
      businessPrograms:
        cap(
          unique(
            businessMatches.concat(programs)
          ),
          30
        ),

      incentives:
        cap(
          unique(
            incentiveMatches.concat(
              incentivePrograms
            )
          ),
          30
        ),

      opportunityAvailable:
        !!(
          business ||
          incentives
        ),

      businessDataAvailable:
        !!state.sourceData.business,

      incentiveDataAvailable:
        !!state.sourceData.incentives
    };
  }

  /* ============================================================
     ANALYSIS BUILD
     ============================================================ */

  function buildAnalysis() {
    state.market =
      buildMarketAnalysis();

    state.risk =
      buildRiskAnalysis();

    state.analysis = {
      financial:
        clone(state.financial),

      market:
        clone(state.market),

      physical:
        clone(state.physical),

      risk:
        clone(state.risk),

      opportunity:
        buildOpportunityAnalysis()
    };

    return state.analysis;
  }

  /* ============================================================
     SUMMARY
     ============================================================ */

  function buildSummary() {
    var property = state.property || {};
    var financial = state.financial || {};

    return {
      property:
        firstValue(
          property.address,
          [
            property.city,
            property.state,
            property.zip
          ]
            .filter(Boolean)
            .join(", ")
        ),

      propertyType:
        property.type || null,

      purchasePrice:
        financial.purchasePrice,

      arv:
        financial.arv,

      rehab:
        financial.rehab,

      totalProjectCost:
        financial.totalProjectCost,

      estimatedProfit:
        financial.estimatedProfit,

      profitMargin:
        financial.profitMargin,

      dataCompleteness:
        state.gaps.length
          ? "incomplete"
          : "substantial",

      signalCount:
        state.signals.length,

      findingCount:
        state.findings.length,

      gapCount:
        state.gaps.length,

      actionCount:
        state.actions.length,

      disclaimer:
        "Property analysis is based on supplied and connected data. It is not an appraisal, inspection, legal opinion, tax opinion, lending approval, or guaranteed investment result."
    };
  }

  /* ============================================================
     SOURCES
     ============================================================ */

  function buildSources() {
    var sources = [];

    var property =
      state.property || {};

    if (property.url) {
      sources.push({
        type: "property",
        label: "Property source",
        url: property.url,
        source: property.source || "property_input"
      });
    }

    var weather =
      state.sourceData.weather;

    if (weather) {
      sources.push({
        type: "weather",
        label: "Weather intelligence",
        source: "weather_module"
      });
    }

    var housing =
      state.sourceData.housing;

    if (housing) {
      sources.push({
        type: "housing",
        label: "Housing intelligence",
        source: "housing_module"
      });
    }

    var climate =
      state.sourceData.climate;

    if (climate) {
      sources.push({
        type: "climate",
        label: "Climate intelligence",
        source: "climate_module"
      });
    }

    var risk =
      state.sourceData.risk;

    if (risk) {
      sources.push({
        type: "risk",
        label: "Risk intelligence",
        source: "risk_module"
      });
    }

    var incentives =
      state.sourceData.incentives;

    if (incentives) {
      sources.push({
        type: "incentives",
        label: "Incentive intelligence",
        source: "incentives_module"
      });
    }

    var business =
      state.sourceData.business;

    if (business) {
      sources.push({
        type: "business",
        label: "Business intelligence",
        source: "business_module"
      });
    }

    return cap(
      unique(sources),
      config.maxSources
    );
  }

  /* ============================================================
     AI CONTEXT
     ============================================================ */

  function buildAIContext() {
    var property =
      clone(state.property);

    var financial =
      clone(state.financial);

    var analysis =
      clone(state.analysis);

    return {
      module:
        MODULE_NAME,

      version:
        VERSION,

      property:
        property,

      location:
        clone(state.location),

      financial:
        financial,

      market:
        clone(state.market),

      physical:
        clone(state.physical),

      risk:
        clone(state.risk),

      analysis:
        analysis,

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

      sources:
        clone(state.sources),

      sourceData: {
        housing:
          clone(state.sourceData.housing),

        climate:
          clone(state.sourceData.climate),

        weather:
          clone(state.sourceData.weather),

        risk:
          clone(state.sourceData.risk),

        incentives:
          clone(state.sourceData.incentives),

        business:
          clone(state.sourceData.business),

        opportunity:
          clone(state.sourceData.opportunity)
      },

      guardrails: [
        "Do not invent missing property facts.",
        "Do not present estimated ARV as a verified appraisal.",
        "Do not treat calculated profit as guaranteed profit.",
        "Do not treat incentives as guaranteed eligibility or funding.",
        "Verify property condition, zoning, title, permits, taxes, insurance, utilities, and financing independently.",
        "Distinguish supplied, calculated, estimated, and externally sourced information.",
        "Current weather is separate from long-term climate and geographic hazard exposure."
      ]
    };
  }

  /* ============================================================
     SHARED CONTEXT
     ============================================================ */

  function buildSharedContext() {
    return {
      module:
        MODULE_NAME,

      version:
        VERSION,

      property:
        clone(state.property),

      location:
        clone(state.location),

      financial:
        clone(state.financial),

      analysis:
        clone(state.analysis),

      summary:
        clone(state.summary),

      signals:
        clone(state.signals),

      gaps:
        clone(state.gaps),

      actions:
        clone(state.actions),

      sources:
        clone(state.sources),

      aiContext:
        clone(state.aiContext)
    };
  }

  /* ============================================================
     MAIN ANALYSIS
     ============================================================ */

  function analyze(propertyInput, options) {
    options = isObject(options)
      ? options
      : {};

    if (propertyInput) {
      ingestProperty(propertyInput);
    }

    if (options.location) {
      setLocation(options.location);
    }

    if (options.preferences) {
      setPreferences(
        options.preferences
      );
    }

    if (!state.property) {
      state.status = "missing_property";
      state.metadata.updatedAt = now();

      emit("analysis:missing_property");

      return clone(state);
    }

    state.status = "analyzing";

    collectContext();

    state.financial =
      buildFinancialProfile(
        state.property
      );

    state.physical = {
      type:
        state.property.type,

      beds:
        state.property.beds,

      baths:
        state.property.baths,

      sqft:
        state.property.sqft,

      lot:
        state.property.lot,

      yearBuilt:
        state.property.yearBuilt
    };

    buildAnalysis();

    state.signals =
      buildSignals();

    state.findings =
      buildFindings();

    state.tradeoffs =
      buildTradeoffs();

    state.gaps =
      buildGaps();

    state.actions =
      buildActions();

    state.sources =
      buildSources();

    state.summary =
      buildSummary();

    state.aiContext =
      buildAIContext();

    state.status = "complete";

    state.metadata.lastAnalysisAt =
      now();

    state.metadata.updatedAt =
      now();

    persist();

    emit(
      "analysis:complete",
      clone(state.analysis)
    );

    return clone(state);
  }

  function analyzeProperty(
    propertyInput,
    options
  ) {
    return analyze(
      propertyInput,
      options
    );
  }

  /* ============================================================
     COMPARABLE PROPERTIES
     ============================================================ */

  function ingestComparables(properties) {
    var list =
      Array.isArray(properties)
        ? properties
        : [];

    state.metadata.updatedAt =
      now();

    state.sourceData.comparables =
      cap(
        list.map(function (item) {
          return normalizeProperty(item);
        }),
        config.maxComparableProperties
      );

    emit(
      "comparables:ingested",
      clone(
        state.sourceData.comparables
      )
    );

    persist();

    return clone(
      state.sourceData.comparables
    );
  }

  function getComparables() {
    return clone(
      state.sourceData.comparables || []
    );
  }

  function analyzeComparableSpread() {
    var comps =
      getComparables();

    if (!comps.length) {
      return {
        status: "no_comparables",
        count: 0,
        averagePrice: null,
        averageARV: null,
        averageSqft: null
      };
    }

    var prices = [];
    var arvs = [];
    var sqfts = [];

    comps.forEach(function (comp) {
      if (hasValue(comp.purchasePrice)) {
        prices.push(
          comp.purchasePrice
        );
      } else if (hasValue(comp.askingPrice)) {
        prices.push(
          comp.askingPrice
        );
      }

      if (hasValue(comp.arv)) {
        arvs.push(comp.arv);
      }

      if (hasValue(comp.sqft)) {
        sqfts.push(comp.sqft);
      }
    });

    function average(values) {
      if (!values.length) return null;

      return (
        values.reduce(
          function (sum, value) {
            return sum + value;
          },
          0
        ) / values.length
      );
    }

    return {
      status: "complete",
      count: comps.length,
      averagePrice:
        average(prices),
      averageARV:
        average(arvs),
      averageSqft:
        average(sqfts)
    };
  }

  /* ============================================================
     DEAL CHECK
     ============================================================ */

  function checkDeal(overrides) {
    var property =
      normalizeProperty(
        Object.assign(
          {},
          state.property || {},
          isObject(overrides)
            ? overrides
            : {}
        )
      );

    var financial =
      buildFinancialProfile(
        property
      );

    return {
      property:
        property,

      financial:
        financial,

      status:
        financial.status,

      estimatedProfit:
        financial.estimatedProfit,

      profitMargin:
        financial.profitMargin,

      purchaseToARV:
        financial.purchaseToARV,

      rehabToARV:
        financial.rehabToARV,

      disclaimer:
        "Calculated from supplied inputs. This is not a guarantee of investment performance."
    };
  }

  /* ============================================================
     LOCATION / PREFERENCES
     ============================================================ */

  function setLocation(location) {
    state.location =
      normalizeLocation(location);

    if (state.property) {
      state.property.location =
        clone(state.location);
    }

    state.metadata.updatedAt =
      now();

    persist();

    emit(
      "location:changed",
      clone(state.location)
    );

    return clone(state.location);
  }

  function getLocation() {
    return clone(
      state.location
    );
  }

  function setPreferences(preferences) {
    state.preferences =
      Object.assign(
        {},
        state.preferences || {},
        isObject(preferences)
          ? preferences
          : {}
      );

    state.metadata.updatedAt =
      now();

    persist();

    emit(
      "preferences:changed",
      clone(state.preferences)
    );

    return clone(
      state.preferences
    );
  }

  /* ============================================================
     GETTERS
     ============================================================ */

  function getProperty() {
    return clone(
      state.property
    );
  }

  function getFinancialProfile() {
    return clone(
      state.financial
    );
  }

  function getAnalysis() {
    return clone(
      state.analysis
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

  function getSources() {
    return clone(
      state.sources
    );
  }

  function getAIContext() {
    return clone(
      state.aiContext
    );
  }

  /* ============================================================
     CONFIGURATION
     ============================================================ */

  function configure(options) {
    if (!isObject(options)) {
      return getConfig();
    }

    config =
      Object.assign(
        {},
        config,
        options
      );

    return getConfig();
  }

  function getConfig() {
    return clone(config);
  }

  /* ============================================================
     PERSISTENCE
     ============================================================ */

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
          config:
            clone(config),

          state:
            clone(state)
        })
      );

      return true;
    } catch (error) {
      console.warn(
        "[ROlyfePropertyAnalysis] Persistence failed:",
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
      var raw =
        window.localStorage.getItem(
          config.storageKey
        );

      if (!raw) {
        return false;
      }

      var saved =
        JSON.parse(raw);

      if (
        saved &&
        isObject(saved.state)
      ) {
        state =
          Object.assign(
            {},
            clone(EMPTY_STATE),
            saved.state
          );
      }

      if (
        saved &&
        isObject(saved.config)
      ) {
        config =
          Object.assign(
            {},
            DEFAULT_CONFIG,
            saved.config
          );
      }

      return true;
    } catch (error) {
      console.warn(
        "[ROlyfePropertyAnalysis] Restore failed:",
        error
      );

      return false;
    }
  }

  /* ============================================================
     RESET
     ============================================================ */

  function reset() {
    state =
      clone(EMPTY_STATE);

    state.metadata.createdAt =
      now();

    state.metadata.updatedAt =
      now();

    persist();

    emit(
      "reset",
      null
    );

    return clone(state);
  }

  /* ============================================================
     INITIALIZATION
     ============================================================ */

  function initialize(options) {
    configure(options);

    restore();

    state.initialized = true;

    if (!state.metadata.createdAt) {
      state.metadata.createdAt =
        now();
    }

    state.metadata.updatedAt =
      now();

    if (state.status === "idle") {
      state.status = "ready";
    }

    emit(
      "initialized",
      {
        version: VERSION,
        status: state.status
      }
    );

    return clone(state);
  }

  /* ============================================================
     STATE / STATUS
     ============================================================ */

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

      hasProperty:
        !!state.property,

      hasLocation:
        !!state.location,

      signalCount:
        state.signals.length,

      gapCount:
        state.gaps.length,

      lastAnalysisAt:
        state.metadata.lastAnalysisAt
    };
  }

  function serialize() {
    return clone({
      module:
        MODULE_NAME,

      version:
        VERSION,

      config:
        config,

      state:
        state
    });
  }

  /* ============================================================
     PUBLIC API
     ============================================================ */

  var API = {
    VERSION: VERSION,
    MODULE_NAME: MODULE_NAME,

    initialize: initialize,

    configure: configure,
    getConfig: getConfig,

    reset: reset,

    analyze: analyze,
    analyzeProperty: analyzeProperty,

    ingestProperty: ingestProperty,

    setLocation: setLocation,
    getLocation: getLocation,

    setPreferences: setPreferences,

    getProperty: getProperty,

    getFinancialProfile:
      getFinancialProfile,

    getAnalysis:
      getAnalysis,

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

    getSources:
      getSources,

    getAIContext:
      getAIContext,

    buildAIContext:
      buildAIContext,

    buildSharedContext:
      buildSharedContext,

    ingestComparables:
      ingestComparables,

    getComparables:
      getComparables,

    analyzeComparableSpread:
      analyzeComparableSpread,

    checkDeal:
      checkDeal,

    getState:
      getState,

    getStatus:
      getStatus,

    subscribe:
      subscribe,

    serialize:
      serialize
  };

  /* ============================================================
     GLOBAL EXPORTS
     ============================================================ */

  window.ROlyfePropertyAnalysis =
    API;

  window.ROLYFE_PROPERTY_ANALYSIS =
    API;

  /* ============================================================
     AUTO INITIALIZATION
     ============================================================ */

  function boot() {
    if (
      config.autoInitialize !== false
    ) {
      initialize();
    }
  }

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      boot,
      {
        once: true
      }
    );
  } else {
    boot();
  }

})(window);
