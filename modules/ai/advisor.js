/*
===========================================================
RO'Lyfe Relocation Intelligence Center™
MODULE: /modules/ai/advisor.js
VERSION: 1.2.0

PURPOSE
-----------------------------------------------------------
RO'Lyfe Advisor planning and response-intelligence layer.

v1.2.0 PROPERTY INTELLIGENCE UPGRADE

Architecture:

PROPERTY
   ↓
LOCATION
   ↓
HOUSING
   ↓
RISK
   ↓
FINANCIALS
   ↓
COMPARABLES
   ↓
AI CONTEXT
   ↓
ADVISOR
   ↓
ROlyfeAI

IMPORTANT
-----------------------------------------------------------
This module does not contain an API key.

This module does not replace:
- location-analysis.js
- ai.js
- climate.js
- weather.js
- risk.js
- housing.js
- incentives.js
- business.js
- property-analysis.js

The Advisor orchestrates intelligence. It does not invent
property, market, financing, incentive, climate, weather,
risk, or financial data.

===========================================================
*/

(function (window) {
    "use strict";

    const VERSION = "1.2.0";

    const DEFAULT_CONFIG = {
        autoInitialize: true,
        persist: true,
        storageKey: "rolyfe_advisor_v1",

        maxDomains: 12,
        maxQuestions: 8,
        maxActions: 10,
        maxSignals: 30,
        maxGaps: 20,
        maxTradeoffs: 20,
        maxSources: 40,
        maxHistory: 20,
        maxResponseCharacters: 12000,

        defaultIntent: "general",
        defaultMode: "overview",
        defaultGeography: "state",

        includeSources: true,
        includeGaps: true,
        includeTradeoffs: true,
        includeActions: true,

        localFallback: true
    };

    const INTENTS = {
        RELOCATION: "relocation",
        COMPARE: "compare",
        CLIMATE: "climate",
        WEATHER: "weather",
        RISK: "risk",
        HOUSING: "housing",
        COST: "cost",
        INCENTIVES: "incentives",
        BUSINESS: "business",
        PROPERTY: "property",
        OPPORTUNITY: "opportunity",
        GENERAL: "general"
    };

    const MODES = {
        OVERVIEW: "overview",
        DEEP_DIVE: "deep_dive",
        COMPARISON: "comparison",
        NEXT_STEPS: "next_steps",
        PROPERTY_CONTEXT: "property_context",
        BUSINESS_CONTEXT: "business_context"
    };

    const DOMAIN_ORDER = [
        "location",
        "climate",
        "weather",
        "risk",
        "housing",
        "costOfLiving",
        "incentives",
        "business",
        "opportunity",
        "property"
    ];

    const INTENT_DOMAINS = {
        relocation: [
            "location",
            "climate",
            "weather",
            "risk",
            "housing",
            "costOfLiving",
            "incentives",
            "business",
            "opportunity"
        ],

        compare: [
            "location",
            "climate",
            "weather",
            "risk",
            "housing",
            "costOfLiving",
            "incentives",
            "business",
            "opportunity"
        ],

        climate: [
            "location",
            "climate",
            "weather",
            "risk"
        ],

        weather: [
            "location",
            "weather",
            "risk"
        ],

        risk: [
            "location",
            "risk",
            "climate",
            "weather"
        ],

        housing: [
            "location",
            "housing",
            "costOfLiving",
            "risk",
            "opportunity"
        ],

        cost: [
            "location",
            "costOfLiving",
            "housing",
            "business",
            "incentives"
        ],

        incentives: [
            "location",
            "incentives",
            "business",
            "housing"
        ],

        business: [
            "location",
            "business",
            "incentives",
            "costOfLiving",
            "opportunity"
        ],

        property: [
            "location",
            "property",
            "housing",
            "risk",
            "climate",
            "business",
            "opportunity"
        ],

        opportunity: [
            "location",
            "opportunity",
            "business",
            "housing",
            "incentives",
            "property"
        ],

        general: [
            "location",
            "housing",
            "costOfLiving",
            "climate",
            "weather",
            "risk",
            "incentives",
            "business",
            "opportunity",
            "property"
        ]
    };

    const KEYWORDS = {
        relocation: [
            "move",
            "moving",
            "relocate",
            "relocation",
            "where should i live",
            "where should i move",
            "new state",
            "new city",
            "leave",
            "relocating",
            "migration"
        ],

        compare: [
            "compare",
            "versus",
            "vs",
            "difference",
            "which one",
            "between",
            "both",
            "better for"
        ],

        climate: [
            "climate",
            "weather pattern",
            "temperature",
            "temperatures",
            "humidity",
            "rain",
            "rainfall",
            "snow",
            "winter",
            "summer",
            "hot",
            "cold",
            "dry",
            "humid"
        ],

        weather: [
            "weather today",
            "weather now",
            "forecast",
            "today",
            "tonight",
            "tomorrow",
            "this week",
            "storm",
            "storms",
            "alert",
            "warning"
        ],

        risk: [
            "risk",
            "hazard",
            "flood",
            "flooding",
            "tornado",
            "hurricane",
            "wildfire",
            "earthquake",
            "drought",
            "disaster",
            "insurance risk",
            "severe weather"
        ],

        housing: [
            "housing",
            "home price",
            "home prices",
            "rent",
            "rental",
            "renting",
            "mortgage",
            "house",
            "homes",
            "property tax",
            "housing market",
            "affordable housing"
        ],

        cost: [
            "cost of living",
            "cost",
            "living expenses",
            "expenses",
            "taxes",
            "tax",
            "utilities",
            "groceries",
            "income tax",
            "sales tax"
        ],

        incentives: [
            "incentive",
            "incentives",
            "relocation program",
            "relocation programs",
            "grant",
            "grants",
            "rebate",
            "rebates",
            "tax credit",
            "tax credits",
            "homebuyer program",
            "assistance",
            "programs"
        ],

        business: [
            "business",
            "businesses",
            "startup",
            "start a business",
            "entrepreneur",
            "entrepreneurship",
            "company",
            "companies",
            "jobs",
            "employment",
            "work",
            "industry",
            "industries"
        ],

        property: [
            "property",
            "real estate",
            "investment property",
            "rental property",
            "flip",
            "flipping",
            "rehab",
            "rehabilitation",
            "arv",
            "mao",
            "cash flow",
            "purchase price",
            "asking price",
            "after repair value",
            "repair cost",
            "renovation",
            "lot",
            "land",
            "building",
            "duplex",
            "triplex",
            "fourplex",
            "multifamily",
            "single family"
        ],

        opportunity: [
            "opportunity",
            "opportunities",
            "invest",
            "investment",
            "investing",
            "development",
            "growth",
            "potential",
            "economic opportunity",
            "real estate opportunity"
        ]
    };

    const RESPONSE_SECTIONS = {
        overview: [
            "direct_answer",
            "location_context",
            "key_factors",
            "tradeoffs",
            "data_gaps",
            "next_steps"
        ],

        deep_dive: [
            "direct_answer",
            "location_context",
            "climate",
            "weather",
            "risk",
            "housing",
            "cost",
            "incentives",
            "business",
            "opportunity",
            "tradeoffs",
            "data_gaps",
            "next_steps"
        ],

        comparison: [
            "comparison_scope",
            "location_context",
            "shared_factors",
            "differences",
            "tradeoffs",
            "data_gaps",
            "next_steps"
        ],

        next_steps: [
            "current_position",
            "priority_actions",
            "verification_items",
            "follow_up_questions"
        ],

        property_context: [
            "property_context",
            "location_context",
            "housing",
            "risk",
            "cost",
            "business",
            "opportunity",
            "financial_context",
            "comparables",
            "tradeoffs",
            "verification_items",
            "next_steps"
        ],

        business_context: [
            "business_context",
            "economic_environment",
            "incentives",
            "cost",
            "workforce",
            "opportunity",
            "tradeoffs",
            "verification_items",
            "next_steps"
        ]
    };

    const state = {
        status: "idle",
        initialized: false,

        config: Object.assign({}, DEFAULT_CONFIG),

        location: null,
        preferences: {},

        lastQuestion: "",
        lastIntent: INTENTS.GENERAL,
        lastMode: MODES.OVERVIEW,

        plan: null,
        context: null,
        response: null,

        property: null,
        propertyContext: null,

        history: [],

        metadata: {
            version: VERSION,
            createdAt: null,
            updatedAt: null
        }
    };

    const listeners = {};

    /*
    ===========================================================
    BASIC HELPERS
    ===========================================================
    */

    function now() {
        return new Date().toISOString();
    }

    function safeString(value, fallback) {
        if (value === null || value === undefined) {
            return fallback || "";
        }

        return String(value);
    }

    function number(value, fallback) {
        const parsed = Number(value);

        return Number.isFinite(parsed)
            ? parsed
            : fallback || 0;
    }

    function array(value) {
        return Array.isArray(value) ? value : [];
    }

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function unique(values) {
        return Array.from(
            new Set(
                array(values).filter(Boolean)
            )
        );
    }

    function uniqueObjects(values, key) {
        const seen = new Set();
        const output = [];

        array(values).forEach(function (item) {
            if (!item) {
                return;
            }

            const value =
                typeof item === "string"
                    ? item
                    : item[key] || JSON.stringify(item);

            if (seen.has(value)) {
                return;
            }

            seen.add(value);
            output.push(item);
        });

        return output;
    }

    function limit(values, max) {
        return array(values).slice(0, max);
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

    function normalizeText(text) {
        return safeString(text, "")
            .toLowerCase()
            .replace(/[^\w\s$.-]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    function emit(eventName, payload) {
        const handlers =
            listeners[eventName] || [];

        handlers.forEach(function (handler) {
            try {
                handler(payload);
            } catch (error) {
                console.warn(
                    "[ROlyfeAdvisor] Listener error:",
                    error
                );
            }
        });

        if (
            typeof window.dispatchEvent ===
            "function"
        ) {
            try {
                window.dispatchEvent(
                    new CustomEvent(
                        "rolyfe:advisor:" +
                        eventName,
                        {
                            detail: payload
                        }
                    )
                );
            } catch (error) {}
        }
    }

    function subscribe(eventName, handler) {
        if (typeof handler !== "function") {
            return function () {};
        }

        if (!listeners[eventName]) {
            listeners[eventName] = [];
        }

        listeners[eventName].push(handler);

        return function unsubscribe() {
            const index =
                listeners[eventName].indexOf(
                    handler
                );

            if (index !== -1) {
                listeners[eventName].splice(
                    index,
                    1
                );
            }
        };
    }

    /*
    ===========================================================
    MODULE DISCOVERY
    ===========================================================
    */

    function getModule(name) {
        const registry = {
            locationAnalysis:
                window.ROlyfeLocationAnalysis ||
                window.ROLYFE_LOCATION_ANALYSIS,

            propertyAnalysis:
                window.ROlyfePropertyAnalysis ||
                window.ROLYFE_PROPERTY_ANALYSIS,

            climate:
                window.ROlyfeClimate ||
                window.ROLYFE_CLIMATE,

            weather:
                window.ROlyfeWeather ||
                window.ROLYFE_WEATHER,

            risk:
                window.ROlyfeRisk ||
                window.ROLYFE_RISK,

            housing:
                window.ROlyfeHousing ||
                window.ROLYFE_HOUSING,

            costOfLiving:
                window.ROlyfeCostOfLiving ||
                window.ROLYFE_COST_OF_LIVING,

            incentives:
                window.ROlyfeIncentives ||
                window.ROLYFE_INCENTIVES,

            business:
                window.ROlyfeBusiness ||
                window.ROLYFE_BUSINESS,

            opportunity:
                window.ROlyfeOpportunityEngine ||
                window.ROLYFE_OPPORTUNITY_ENGINE,

            core:
                window.ROlyfeCore ||
                window.ROLYFE_CORE
        };

        return registry[name] || null;
    }

    function callModule(
        moduleName,
        methodName
    ) {
        const module =
            getModule(moduleName);

        if (
            !module ||
            typeof module[methodName] !==
                "function"
        ) {
            return null;
        }

        const args =
            Array.prototype.slice.call(
                arguments,
                2
            );

        try {
            return clone(
                module[methodName].apply(
                    module,
                    args
                )
            );
        } catch (error) {
            return null;
        }
    }

    function safelyGetProfile(module) {
        if (!module) {
            return null;
        }

        const getters = [
            "getResult",
            "getProfile",
            "getAnalysis",
            "getSummary",
            "getState",
            "getContext"
        ];

        for (
            let i = 0;
            i < getters.length;
            i++
        ) {
            const method =
                getters[i];

            if (
                typeof module[method] ===
                "function"
            ) {
                try {
                    const result =
                        module[method]();

                    if (result) {
                        return clone(result);
                    }
                } catch (error) {}
            }
        }

        return null;
    }

    /*
    ===========================================================
    PERSISTENCE
    ===========================================================
    */

    function canUseStorage() {
        try {
            return !!window.localStorage;
        } catch (error) {
            return false;
        }
    }

    function persist() {
        if (
            !state.config.persist ||
            !canUseStorage()
        ) {
            return false;
        }

        try {
            const payload = {
                location:
                    state.location,

                preferences:
                    state.preferences,

                lastQuestion:
                    state.lastQuestion,

                lastIntent:
                    state.lastIntent,

                lastMode:
                    state.lastMode,

                property:
                    state.property,

                propertyContext:
                    state.propertyContext,

                plan:
                    state.plan,

                context:
                    state.context,

                response:
                    state.response,

                history:
                    limit(
                        state.history,
                        state.config.maxHistory
                    ),

                metadata:
                    state.metadata
            };

            window.localStorage.setItem(
                state.config.storageKey,
                JSON.stringify(payload)
            );

            return true;
        } catch (error) {
            console.warn(
                "[ROlyfeAdvisor] Persistence failed:",
                error
            );

            return false;
        }
    }

    function restore() {
        if (
            !state.config.persist ||
            !canUseStorage()
        ) {
            return false;
        }

        try {
            const raw =
                window.localStorage.getItem(
                    state.config.storageKey
                );

            if (!raw) {
                return false;
            }

            const saved =
                JSON.parse(raw);

            state.location =
                saved.location ||
                null;

            state.preferences =
                saved.preferences ||
                {};

            state.lastQuestion =
                saved.lastQuestion ||
                "";

            state.lastIntent =
                saved.lastIntent ||
                INTENTS.GENERAL;

            state.lastMode =
                saved.lastMode ||
                MODES.OVERVIEW;

            state.property =
                saved.property ||
                null;

            state.propertyContext =
                saved.propertyContext ||
                null;

            state.plan =
                saved.plan ||
                null;

            state.context =
                saved.context ||
                null;

            state.response =
                saved.response ||
                null;

            state.history =
                array(saved.history);

            if (saved.metadata) {
                state.metadata =
                    Object.assign(
                        {},
                        state.metadata,
                        saved.metadata
                    );
            }

            return true;
        } catch (error) {
            console.warn(
                "[ROlyfeAdvisor] Restore failed:",
                error
            );

            return false;
        }
    }

    function clearPersistence() {
        if (!canUseStorage()) {
            return false;
        }

        try {
            window.localStorage.removeItem(
                state.config.storageKey
            );

            return true;
        } catch (error) {
            return false;
        }
    }

    /*
    ===========================================================
    LOCATION / PREFERENCE STATE
    ===========================================================
    */

    function setLocation(location) {
        state.location =
            clone(location);

        const locationModule =
            getModule(
                "locationAnalysis"
            );

        if (
            locationModule &&
            typeof locationModule.setLocation ===
                "function"
        ) {
            try {
                locationModule.setLocation(
                    clone(location)
                );
            } catch (error) {}
        }

        [
            "housing",
            "business",
            "incentives"
        ].forEach(function (name) {
            const module =
                getModule(name);

            if (
                module &&
                typeof module.setLocation ===
                    "function"
            ) {
                try {
                    module.setLocation(
                        clone(location)
                    );
                } catch (error) {}
            }
        });

        emit("locationChanged", {
            location:
                clone(state.location)
        });

        persist();

        return clone(
            state.location
        );
    }

    function getLocation() {
        return clone(
            state.location
        );
    }

    function setPreferences(
        preferences
    ) {
        state.preferences =
            Object.assign(
                {},
                state.preferences,
                preferences || {}
            );

        [
            "locationAnalysis",
            "housing",
            "business",
            "incentives"
        ].forEach(function (name) {
            const module =
                getModule(name);

            if (
                module &&
                typeof module.setPreferences ===
                    "function"
            ) {
                try {
                    module.setPreferences(
                        clone(
                            state.preferences
                        )
                    );
                } catch (error) {}
            }
        });

        emit(
            "preferencesChanged",
            {
                preferences:
                    clone(
                        state.preferences
                    )
            }
        );

        persist();

        return clone(
            state.preferences
        );
    }

    function getPreferences() {
        return clone(
            state.preferences
        );
    }

    /*
    ===========================================================
    PROPERTY STATE
    ===========================================================
    */

    function setProperty(property) {
        state.property =
            clone(property);

        const module =
            getModule(
                "propertyAnalysis"
            );

        if (module) {
            if (
                typeof module.setProperty ===
                "function"
            ) {
                try {
                    module.setProperty(
                        clone(property)
                    );
                } catch (error) {}
            } else if (
                typeof module.ingestProperty ===
                "function"
            ) {
                try {
                    module.ingestProperty(
                        clone(property)
                    );
                } catch (error) {}
            }
        }

        if (
            property &&
            (
                property.city ||
                property.state ||
                property.zip ||
                property.address
            )
        ) {
            setLocation({
                address:
                    property.address ||
                    "",
                city:
                    property.city ||
                    "",
                state:
                    property.state ||
                    "",
                zip:
                    property.zip ||
                    "",
                county:
                    property.county ||
                    "",
                lat:
                    property.lat,
                lon:
                    property.lon
            });
        }

        state.propertyContext =
            buildPropertyContext(
                property
            );

        emit(
            "propertyChanged",
            clone(state.property)
        );

        persist();

        return clone(
            state.property
        );
    }

    function getProperty() {
        return clone(
            state.property
        );
    }

    function getPropertyContext() {
        return clone(
            state.propertyContext
        );
    }

    /*
    ===========================================================
    PROPERTY INTELLIGENCE
    ===========================================================
    */

    function extractFromModule(
        module,
        methods
    ) {
        if (!module) {
            return null;
        }

        for (
            let i = 0;
            i < methods.length;
            i++
        ) {
            const method =
                methods[i];

            if (
                typeof module[method] ===
                "function"
            ) {
                try {
                    const result =
                        module[method]();

                    if (
                        result !==
                        undefined &&
                        result !== null
                    ) {
                        return clone(
                            result
                        );
                    }
                } catch (error) {}
            }
        }

        return null;
    }

    function collectPropertyLayer() {
        const module =
            getModule(
                "propertyAnalysis"
            );

        if (!module) {
            return {
                available: false
            };
        }

        const result =
            safelyGetProfile(
                module
            ) || {};

        const summary =
            extractFromModule(
                module,
                [
                    "getSummary"
                ]
            );

        const signals =
            extractFromModule(
                module,
                [
                    "getSignals"
                ]
            );

        const findings =
            extractFromModule(
                module,
                [
                    "getFindings"
                ]
            );

        const tradeoffs =
            extractFromModule(
                module,
                [
                    "getTradeoffs"
                ]
            );

        const gaps =
            extractFromModule(
                module,
                [
                    "getGaps"
                ]
            );

        const actions =
            extractFromModule(
                module,
                [
                    "getActions"
                ]
            );

        const sources =
            extractFromModule(
                module,
                [
                    "getSources"
                ]
            );

        const comparables =
            extractFromModule(
                module,
                [
                    "getComparables"
                ]
            );

        return {
            available: true,
            result: result,
            summary: summary,
            signals: signals,
            findings: findings,
            tradeoffs: tradeoffs,
            gaps: gaps,
            actions: actions,
            sources: sources,
            comparables: comparables
        };
    }

    function buildPropertyContext(
        property
    ) {
        const layer =
            collectPropertyLayer();

        const propertyData =
            clone(
                property ||
                state.property ||
                null
            );

        const context = {
            available:
                !!propertyData ||
                layer.available,

            property:
                propertyData,

            financials: {},

            comparables:
                layer.comparables || [],

            analysis:
                layer.result || null,

            summary:
                layer.summary || null,

            signals:
                array(layer.signals),

            findings:
                array(layer.findings),

            tradeoffs:
                array(layer.tradeoffs),

            gaps:
                array(layer.gaps),

            actions:
                array(layer.actions),

            sources:
                array(layer.sources),

            location:
                clone(
                    state.location
                ),

            linkedDomains: {
                location: null,
                housing: null,
                risk: null,
                climate: null,
                weather: null,
                business: null,
                opportunity: null
            },

            verification: {
                propertyLevelDataRequired:
                    true,

                financingMustBeVerified:
                    true,

                taxesMustBeVerified:
                    true,

                insuranceMustBeVerified:
                    true,

                zoningMustBeVerified:
                    true,

                permitsMustBeVerified:
                    true,

                arvMustBeSupported:
                    true
            },

            generatedAt: now()
        };

        if (propertyData) {
            context.financials = {
                askingPrice:
                    propertyData.askingPrice,

                purchasePrice:
                    propertyData.purchasePrice,

                currentValue:
                    propertyData.currentValue,

                arv:
                    propertyData.arv,

                rent:
                    propertyData.rent,

                rehab:
                    propertyData.rehab,

                holdingMonths:
                    propertyData.holdingMonths,

                holdingCost:
                    propertyData.holdingCost,

                financingCost:
                    propertyData.financingCost,

                closingCosts:
                    propertyData.closingCosts,

                sellingCosts:
                    propertyData.sellingCosts,

                assignmentFee:
                    propertyData.assignmentFee,

                downPayment:
                    propertyData.downPayment,

                interestRate:
                    propertyData.interestRate,

                loanAmount:
                    propertyData.loanAmount
            };
        }

        return context;
    }

    function collectLinkedDomainContext(
        domains
    ) {
        const context = {};

        const mapping = {
            location:
                "locationAnalysis",

            climate:
                "climate",

            weather:
                "weather",

            risk:
                "risk",

            housing:
                "housing",

            costOfLiving:
                "costOfLiving",

            incentives:
                "incentives",

            business:
                "business",

            opportunity:
                "opportunity"
        };

        array(domains).forEach(
            function (domain) {
                const moduleName =
                    mapping[domain];

                if (!moduleName) {
                    return;
                }

                const module =
                    getModule(
                        moduleName
                    );

                if (!module) {
                    return;
                }

                const profile =
                    safelyGetProfile(
                        module
                    );

                if (profile) {
                    context[domain] =
                        profile;
                }
            }
        );

        return context;
    }

    /*
    ===========================================================
    QUESTION CLASSIFICATION
    ===========================================================
    */

    function scoreIntent(
        question,
        intent
    ) {
        const text =
            normalizeText(
                question
            );

        const words =
            KEYWORDS[intent] ||
            [];

        let score = 0;

        words.forEach(
            function (keyword) {
                const normalized =
                    normalizeText(
                        keyword
                    );

                if (!normalized) {
                    return;
                }

                if (
                    text.indexOf(
                        normalized
                    ) !== -1
                ) {
                    score +=
                        normalized.indexOf(
                            " "
                        ) !== -1
                            ? 3
                            : 1;
                }
            }
        );

        return score;
    }

    function classifyQuestion(
        question,
        options
    ) {
        options =
            options || {};

        const text =
            safeString(
                question,
                ""
            ).trim();

        if (!text) {
            return {
                intent:
                    INTENTS.GENERAL,

                confidence: 0,

                scores: {}
            };
        }

        const scores = {};

        Object.keys(
            KEYWORDS
        ).forEach(
            function (intent) {
                scores[intent] =
                    scoreIntent(
                        text,
                        intent
                    );
            }
        );

        if (
            /\b(compare|versus|vs\.?|between)\b/i.test(
                text
            )
        ) {
            scores.compare =
                (scores.compare || 0) +
                5;
        }

        if (
            /\b(arv|mao|rehab|flip|cash flow|investment property|purchase price)\b/i.test(
                text
            )
        ) {
            scores.property =
                (scores.property || 0) +
                6;
        }

        let winner =
            INTENTS.GENERAL;

        let highest = 0;

        Object.keys(
            scores
        ).forEach(
            function (intent) {
                if (
                    scores[intent] >
                    highest
                ) {
                    highest =
                        scores[intent];

                    winner =
                        intent;
                }
            }
        );

        const total =
            Object.keys(scores)
                .reduce(
                    function (
                        sum,
                        key
                    ) {
                        return (
                            sum +
                            scores[key]
                        );
                    },
                    0
                );

        let confidence = 0;

        if (highest > 0) {
            confidence =
                clamp(
                    highest /
                        Math.max(
                            total,
                            1
                        ),
                    0,
                    1
                );
        }

        if (
            options.preferredIntent
        ) {
            const preferred =
                safeString(
                    options.preferredIntent,
                    ""
                );

            if (
                Object.values(
                    INTENTS
                ).indexOf(
                    preferred
                ) !== -1
            ) {
                winner =
                    preferred;

                confidence = 1;
            }
        }

        return {
            intent:
                winner,

            confidence:
                Number(
                    confidence.toFixed(
                        3
                    )
                ),

            scores:
                scores,

            question:
                text
        };
    }

    /*
    ===========================================================
    MODE
    ===========================================================
    */

    function determineMode(
        intent,
        question,
        options
    ) {
        options =
            options || {};

        if (
            options.mode &&
            Object.values(
                MODES
            ).indexOf(
                options.mode
            ) !== -1
        ) {
            return options.mode;
        }

        const text =
            normalizeText(
                question
            );

        if (
            intent ===
            INTENTS.COMPARE
        ) {
            return MODES.COMPARISON;
        }

        if (
            intent ===
            INTENTS.PROPERTY
        ) {
            return MODES.PROPERTY_CONTEXT;
        }

        if (
            intent ===
            INTENTS.BUSINESS
        ) {
            return MODES.BUSINESS_CONTEXT;
        }

        if (
            /\b(step|steps|what should i do|next|now what|how do i proceed)\b/i.test(
                text
            )
        ) {
            return MODES.NEXT_STEPS;
        }

        if (
            /\b(all|everything|deep dive|full analysis|complete analysis|detailed)\b/i.test(
                text
            )
        ) {
            return MODES.DEEP_DIVE;
        }

        return MODES.OVERVIEW;
    }

    /*
    ===========================================================
    DOMAIN SELECTION
    ===========================================================
    */

    function getDomainsForIntent(
        intent,
        preferences
    ) {
        let domains =
            (
                INTENT_DOMAINS[intent] ||
                INTENT_DOMAINS.general
            ).slice();

        preferences =
            preferences || {};

        if (
            preferences.priorities
        ) {
            const priorities =
                Array.isArray(
                    preferences.priorities
                )
                    ? preferences.priorities
                    : [
                        preferences.priorities
                    ];

            priorities.forEach(
                function (priority) {
                    const normalized =
                        normalizeText(
                            priority
                        );

                    if (
                        normalized.indexOf(
                            "housing"
                        ) !== -1 ||
                        normalized.indexOf(
                            "home"
                        ) !== -1 ||
                        normalized.indexOf(
                            "rent"
                        ) !== -1
                    ) {
                        domains.push(
                            "housing"
                        );
                    }

                    if (
                        normalized.indexOf(
                            "business"
                        ) !== -1 ||
                        normalized.indexOf(
                            "job"
                        ) !== -1
                    ) {
                        domains.push(
                            "business"
                        );
                    }

                    if (
                        normalized.indexOf(
                            "risk"
                        ) !== -1 ||
                        normalized.indexOf(
                            "safety"
                        ) !== -1
                    ) {
                        domains.push(
                            "risk"
                        );
                    }

                    if (
                        normalized.indexOf(
                            "weather"
                        ) !== -1 ||
                        normalized.indexOf(
                            "climate"
                        ) !== -1
                    ) {
                        domains.push(
                            "climate",
                            "weather"
                        );
                    }

                    if (
                        normalized.indexOf(
                            "investment"
                        ) !== -1 ||
                        normalized.indexOf(
                            "real estate"
                        ) !== -1
                    ) {
                        domains.push(
                            "property",
                            "opportunity"
                        );
                    }
                }
            );
        }

        return limit(
            unique(domains),
            state.config.maxDomains
        );
    }

    /*
    ===========================================================
    RESPONSE PLAN
    ===========================================================
    */

    function buildResponsePlan(
        question,
        options
    ) {
        options =
            options || {};

        const classification =
            classifyQuestion(
                question,
                options
            );

        const intent =
            classification.intent;

        const mode =
            determineMode(
                intent,
                question,
                options
            );

        const domains =
            getDomainsForIntent(
                intent,
                state.preferences
            );

        const sections =
            RESPONSE_SECTIONS[mode] ||
            RESPONSE_SECTIONS.overview;

        const requiresLiveData =
            intent ===
                INTENTS.WEATHER ||
            /\b(today|now|current|tonight|tomorrow|this week|alert|warning)\b/i.test(
                question
            );

        const requiresVerification =
            intent ===
                INTENTS.INCENTIVES ||
            intent ===
                INTENTS.BUSINESS ||
            intent ===
                INTENTS.PROPERTY ||
            intent ===
                INTENTS.OPPORTUNITY;

        const propertyMode =
            intent ===
            INTENTS.PROPERTY;

        const plan = {
            intent:
                intent,

            confidence:
                classification.confidence,

            mode:
                mode,

            question:
                safeString(
                    question,
                    ""
                ),

            geography:
                state.config
                    .defaultGeography,

            domains:
                domains,

            sections:
                sections,

            dataRequirements: {
                location:
                    true,

                climate:
                    domains.indexOf(
                        "climate"
                    ) !== -1,

                weather:
                    domains.indexOf(
                        "weather"
                    ) !== -1,

                risk:
                    domains.indexOf(
                        "risk"
                    ) !== -1,

                housing:
                    domains.indexOf(
                        "housing"
                    ) !== -1,

                costOfLiving:
                    domains.indexOf(
                        "costOfLiving"
                    ) !== -1,

                incentives:
                    domains.indexOf(
                        "incentives"
                    ) !== -1,

                business:
                    domains.indexOf(
                        "business"
                    ) !== -1,

                opportunity:
                    domains.indexOf(
                        "opportunity"
                    ) !== -1,

                property:
                    domains.indexOf(
                        "property"
                    ) !== -1
            },

            requirements: {
                requiresLiveData:
                    requiresLiveData,

                requiresVerification:
                    requiresVerification,

                distinguishClimateFromWeather:
                    true,

                identifyDataGaps:
                    true,

                identifyTradeoffs:
                    true,

                avoidUniversalRanking:
                    true,

                propertyRequiresPropertyData:
                    propertyMode,

                verifyFinancialAssumptions:
                    propertyMode,

                verifyComparableEvidence:
                    propertyMode
            },

            followUpQuestions:
                buildFollowUpQuestions(
                    intent,
                    state.preferences
                ),

            createdAt:
                now()
        };

        state.plan =
            plan;

        state.lastQuestion =
            safeString(
                question,
                ""
            );

        state.lastIntent =
            intent;

        state.lastMode =
            mode;

        emit(
            "planCreated",
            clone(plan)
        );

        persist();

        return clone(plan);
    }

    /*
    ===========================================================
    FOLLOW-UP QUESTIONS
    ===========================================================
    */

    function buildFollowUpQuestions(
        intent,
        preferences
    ) {
        preferences =
            preferences || {};

        const questions = [];

        switch (intent) {
            case INTENTS.RELOCATION:
                questions.push(
                    "What matters most: housing cost, climate, taxes, risk, business opportunity, or incentives?",
                    "Are you looking at a state, county, city, or ZIP code?",
                    "Are you renting, buying, investing, or building?",
                    "What monthly housing budget should be used?"
                );
                break;

            case INTENTS.COMPARE:
                questions.push(
                    "Which two or more locations should be compared?",
                    "What factors should receive the most attention?",
                    "Is the move primarily personal, business-related, or investment-related?"
                );
                break;

            case INTENTS.HOUSING:
                questions.push(
                    "Are you renting or buying?",
                    "What monthly or purchase budget should be used?",
                    "Are you looking for a primary residence or investment property?"
                );
                break;

            case INTENTS.BUSINESS:
                questions.push(
                    "What type of business or industry?",
                    "Are you starting, relocating, or expanding?",
                    "How much capital or investment are you considering?"
                );
                break;

            case INTENTS.PROPERTY:
                questions.push(
                    "What is the property address or ZIP?",
                    "What are the purchase price, estimated rehab, and ARV?",
                    "What is the intended exit: resale, rental, refinance, or hold?",
                    "What financing structure are you considering?",
                    "Are comparable sales available?"
                );
                break;

            case INTENTS.INCENTIVES:
                questions.push(
                    "Are you looking for relocation, homebuyer, business, or investment incentives?",
                    "What location are you considering?",
                    "What is your intended use of the property or program?"
                );
                break;

            default:
                questions.push(
                    "What location are you evaluating?",
                    "What is the main goal: live, move, invest, build, or start a business?",
                    "What factors matter most to you?"
                );
        }

        if (
            preferences.budget ||
            preferences.monthlyBudget ||
            preferences.purchaseBudget
        ) {
            return questions.filter(
                function (question) {
                    return (
                        question.indexOf(
                            "budget"
                        ) === -1
                    );
                }
            );
        }

        return limit(
            unique(questions),
            state.config.maxQuestions
        );
    }

    /*
    ===========================================================
    DOMAIN CONTEXT
    ===========================================================
    */

    function collectDomainContext(
        domains
    ) {
        const context = {};

        const mapping = {
            location:
                "locationAnalysis",

            climate:
                "climate",

            weather:
                "weather",

            risk:
                "risk",

            housing:
                "housing",

            costOfLiving:
                "costOfLiving",

            incentives:
                "incentives",

            business:
                "business",

            opportunity:
                "opportunity"
        };

        array(domains).forEach(
            function (domain) {
                const moduleName =
                    mapping[domain];

                if (!moduleName) {
                    return;
                }

                const module =
                    getModule(
                        moduleName
                    );

                if (!module) {
                    return;
                }

                const profile =
                    safelyGetProfile(
                        module
                    );

                if (profile) {
                    context[domain] =
                        profile;
                }
            }
        );

        if (
            domains.indexOf(
                "property"
            ) !== -1
        ) {
            context.property =
                buildPropertyContext(
                    state.property
                );
        }

        return context;
    }

    /*
    ===========================================================
    ARRAY EXTRACTION
    ===========================================================
    */

    function extractArray(
        source,
        keys
    ) {
        if (
            !source ||
            typeof source !==
                "object"
        ) {
            return [];
        }

        const result = [];

        array(keys).forEach(
            function (key) {
                if (
                    Array.isArray(
                        source[key]
                    )
                ) {
                    result.push.apply(
                        result,
                        source[key]
                    );
                }
            }
        );

        return result;
    }

    function collectSignals(
        domainContext
    ) {
        const signals = [];

        Object.keys(
            domainContext
        ).forEach(
            function (domain) {
                const profile =
                    domainContext[
                        domain
                    ];

                const values =
                    extractArray(
                        profile,
                        [
                            "signals",
                            "findings",
                            "indicators",
                            "highlights"
                        ]
                    );

                values.forEach(
                    function (item) {
                        if (
                            typeof item ===
                            "string"
                        ) {
                            signals.push({
                                domain:
                                    domain,

                                text:
                                    item
                            });
                        } else if (
                            item &&
                            typeof item ===
                                "object"
                        ) {
                            signals.push(
                                Object.assign(
                                    {
                                        domain:
                                            domain
                                    },
                                    item
                                )
                            );
                        }
                    }
                );
            }
        );

        return limit(
            uniqueObjects(
                signals,
                "text"
            ),
            state.config.maxSignals
        );
    }

    function collectGaps(
        domainContext
    ) {
        const gaps = [];

        Object.keys(
            domainContext
        ).forEach(
            function (domain) {
                const profile =
                    domainContext[
                        domain
                    ];

                const values =
                    extractArray(
                        profile,
                        [
                            "gaps",
                            "dataGaps",
                            "missingData",
                            "limitations"
                        ]
                    );

                values.forEach(
                    function (item) {
                        if (
                            typeof item ===
                            "string"
                        ) {
                            gaps.push({
                                domain:
                                    domain,

                                text:
                                    item
                            });
                        } else if (
                            item &&
                            typeof item ===
                                "object"
                        ) {
                            gaps.push(
                                Object.assign(
                                    {
                                        domain:
                                            domain
                                    },
                                    item
                                )
                            );
                        }
                    }
                );
            }
        );

        return limit(
            uniqueObjects(
                gaps,
                "text"
            ),
            state.config.maxGaps
        );
    }

    function collectTradeoffs(
        domainContext
    ) {
        const tradeoffs = [];

        Object.keys(
            domainContext
        ).forEach(
            function (domain) {
                const profile =
                    domainContext[
                        domain
                    ];

                const values =
                    extractArray(
                        profile,
                        [
                            "tradeoffs",
                            "considerations",
                            "constraints"
                        ]
                    );

                values.forEach(
                    function (item) {
                        if (
                            typeof item ===
                            "string"
                        ) {
                            tradeoffs.push({
                                domain:
                                    domain,

                                text:
                                    item
                            });
                        } else if (
                            item &&
                            typeof item ===
                                "object"
                        ) {
                            tradeoffs.push(
                                Object.assign(
                                    {
                                        domain:
                                            domain
                                    },
                                    item
                                )
                            );
                        }
                    }
                );
            }
        );

        return limit(
            uniqueObjects(
                tradeoffs,
                "text"
            ),
            state.config.maxTradeoffs
        );
    }

    function collectSources(
        domainContext
    ) {
        const sources = [];

        Object.keys(
            domainContext
        ).forEach(
            function (domain) {
                const profile =
                    domainContext[
                        domain
                    ];

                const values =
                    extractArray(
                        profile,
                        [
                            "sources",
                            "references",
                            "sourceList"
                        ]
                    );

                values.forEach(
                    function (item) {
                        if (
                            typeof item ===
                            "string"
                        ) {
                            sources.push({
                                domain:
                                    domain,

                                source:
                                    item
                            });
                        } else if (
                            item &&
                            typeof item ===
                                "object"
                        ) {
                            sources.push(
                                Object.assign(
                                    {
                                        domain:
                                            domain
                                    },
                                    item
                                )
                            );
                        }
                    }
                );
            }
        );

        return limit(
            uniqueObjects(
                sources,
                "source"
            ),
            state.config.maxSources
        );
    }

    /*
    ===========================================================
    ACTION ENGINE
    ===========================================================
    */

    function buildActions(
        intent,
        domainContext,
        gaps,
        preferences
    ) {
        const actions = [];

        function addAction(
            priority,
            action,
            reason,
            domain
        ) {
            actions.push({
                priority:
                    priority,

                action:
                    action,

                reason:
                    reason,

                domain:
                    domain ||
                    null
            });
        }

        if (!state.location) {
            addAction(
                "high",
                "Set the target location.",
                "Location-specific intelligence cannot be interpreted reliably without a geographic target.",
                "location"
            );
        }

        if (
            intent ===
                INTENTS.PROPERTY &&
            !state.property
        ) {
            addAction(
                "high",
                "Provide the property details.",
                "Property-level analysis requires property data.",
                "property"
            );
        }

        if (
            gaps.length &&
            state.config.includeGaps
        ) {
            addAction(
                "high",
                "Resolve the most important missing data before making a major decision.",
                "The current analysis contains information gaps.",
                "data"
            );
        }

        switch (intent) {
            case INTENTS.RELOCATION:
                addAction(
                    "high",
                    "Define the move priorities.",
                    "Location fit depends on the user's actual priorities.",
                    "location"
                );

                addAction(
                    "medium",
                    "Compare housing, climate, risk, incentives, and business conditions together.",
                    "Relocation decisions are multi-factor decisions.",
                    "comparison"
                );
                break;

            case INTENTS.HOUSING:
                addAction(
                    "high",
                    "Validate current housing costs and available inventory.",
                    "Housing conditions can change over time.",
                    "housing"
                );

                addAction(
                    "medium",
                    "Check property-level taxes, insurance, hazard exposure, and financing assumptions.",
                    "Area-level averages may not represent an individual property.",
                    "property"
                );
                break;

            case INTENTS.BUSINESS:
                addAction(
                    "high",
                    "Verify current business programs and eligibility.",
                    "Program availability and eligibility can change.",
                    "business"
                );

                addAction(
                    "medium",
                    "Evaluate labor, operating costs, customer base, and industry conditions.",
                    "Business opportunity depends on more than incentives.",
                    "business"
                );
                break;

            case INTENTS.PROPERTY:
                addAction(
                    "high",
                    "Validate property-level financial assumptions.",
                    "A location profile is not a substitute for property underwriting.",
                    "property"
                );

                addAction(
                    "high",
                    "Check property-specific flood, insurance, zoning, and permitting factors.",
                    "Area-level risk data may not capture parcel-level conditions.",
                    "risk"
                );

                addAction(
                    "medium",
                    "Validate comparable properties supporting the ARV or market assumptions.",
                    "Comparable evidence should support material valuation assumptions.",
                    "comparables"
                );

                addAction(
                    "medium",
                    "Verify financing, holding, closing, selling, and contingency assumptions.",
                    "Deal economics depend on actual transaction costs and financing terms.",
                    "financials"
                );
                break;

            case INTENTS.INCENTIVES:
                addAction(
                    "high",
                    "Verify the program directly with the administering organization.",
                    "Program rules, funding, deadlines, and eligibility can change.",
                    "incentives"
                );
                break;

            case INTENTS.RISK:
                addAction(
                    "high",
                    "Separate long-term hazard exposure from current weather conditions.",
                    "Climate risk and active weather are different information layers.",
                    "risk"
                );
                break;

            default:
                addAction(
                    "medium",
                    "Identify the decision you are trying to make.",
                    "The advisor can produce more useful analysis when the goal is defined.",
                    "location"
                );
        }

        if (
            preferences &&
            preferences.timeline
        ) {
            addAction(
                "medium",
                "Align the analysis with the intended timeline.",
                "Market, weather, incentives, and housing conditions are time-sensitive.",
                "timeline"
            );
        }

        return limit(
            actions,
            state.config.maxActions
        );
    }

    /*
    ===========================================================
    ADVISOR CONTEXT
    ===========================================================
    */

    function buildAdvisorContext(
        question,
        options
    ) {
        options =
            options || {};

        const plan =
            state.plan ||
            buildResponsePlan(
                question,
                options
            );

        const domainContext =
            collectDomainContext(
                plan.domains
            );

        const propertyContext =
            plan.domains.indexOf(
                "property"
            ) !== -1
                ? buildPropertyContext(
                    state.property
                )
                : null;

        const signals =
            collectSignals(
                domainContext
            );

        const gaps =
            collectGaps(
                domainContext
            );

        const tradeoffs =
            collectTradeoffs(
                domainContext
            );

        const actions =
            buildActions(
                plan.intent,
                domainContext,
                gaps,
                state.preferences
            );

        const sources =
            collectSources(
                domainContext
            );

        const context = {
            advisor: {
                version:
                    VERSION,

                role:
                    "RO'Lyfe Location Intelligence Advisor",

                intent:
                    plan.intent,

                mode:
                    plan.mode,

                confidence:
                    plan.confidence
            },

            question:
                plan.question,

            location:
                clone(
                    state.location
                ),

            preferences:
                clone(
                    state.preferences
                ),

            property:
                clone(
                    state.property
                ),

            propertyContext:
                propertyContext,

            plan:
                clone(plan),

            domains:
                domainContext,

            signals:
                signals,

            findings:
                propertyContext
                    ? array(
                        propertyContext.findings
                    )
                    : [],

            tradeoffs:
                tradeoffs,

            gaps:
                gaps,

            actions:
                actions,

            sources:
                sources,

            responseSections:
                plan.sections,

            guardrails: {
                noUniversalBest:
                    true,

                noInventedData:
                    true,

                identifyMissingData:
                    true,

                distinguishClimateFromWeather:
                    true,

                distinguishHazardFromActiveEvent:
                    true,

                verifyPrograms:
                    true,

                identifyTimePeriod:
                    true,

                identifyGeography:
                    true,

                explainTradeoffs:
                    true,

                propertyRequiresPropertyData:
                    true,

                propertyRequiresPropertyLevelVerification:
                    true,

                financialAssumptionsRequireValidation:
                    true,

                comparableEvidenceRequiresValidation:
                    true
            },

            metadata: {
                generatedAt:
                    now(),

                version:
                    VERSION
            }
        };

        state.context =
            context;

        state.propertyContext =
            propertyContext;

        emit(
            "contextBuilt",
            clone(context)
        );

        return clone(context);
    }

    /*
    ===========================================================
    AI INSTRUCTIONS
    ===========================================================
    */

    function buildInstructions(
        plan,
        options
    ) {
        options =
            options || {};

        const mode =
            plan &&
            plan.mode
                ? plan.mode
                : MODES.OVERVIEW;

        const intent =
            plan &&
            plan.intent
                ? plan.intent
                : INTENTS.GENERAL;

        const lines = [
            "You are the RO'Lyfe Location Intelligence Advisor.",
            "",
            "Use the structured intelligence supplied by the RO'Lyfe system.",
            "",
            "Do not invent missing data.",
            "Do not treat incomplete data as complete.",
            "Do not declare a universal best state, city, county, ZIP code, or property.",
            "Use the user's stated goals and preferences when interpreting fit.",
            "Explain meaningful tradeoffs instead of hiding them.",
            "Distinguish long-term climate from current weather.",
            "Distinguish hazard exposure from an active weather event.",
            "Identify the geography being discussed.",
            "Identify the time period when data is time-sensitive.",
            "Treat incentives as programs requiring eligibility and current verification.",
            "Do not treat an incentive match as a guarantee.",
            "Do not treat area-level housing data as property-level underwriting.",
            "Do not represent RO'Lyfe as a lender, insurer, realtor, government agency, or program administrator.",
            "",
            "PROPERTY INTELLIGENCE RULES",
            "When property data is supplied, connect property information to location, housing, risk, business, opportunity, financial, and comparable-sale context.",
            "Do not manufacture ARV, rent, rehab, financing, taxes, insurance, zoning, permit, or comparable-sale values.",
            "Clearly identify assumptions versus verified facts.",
            "Property-level decisions require property-level verification.",
            "Financial outputs are decision-support information and are not funding guarantees.",
            "",
            "Current intent: " +
                intent,

            "Current response mode: " +
                mode,

            "",
            "Preferred response structure:",
            "1. Direct answer",
            "2. Relevant evidence from supplied data",
            "3. Important tradeoffs",
            "4. Missing information or verification items",
            "5. Practical next steps",
            "",
            "Keep the answer useful, transparent, and decision-support oriented."
        ];

        return lines.join(
            "\n"
        );
    }

    /*
    ===========================================================
    RESPONSE TEMPLATE
    ===========================================================
    */

    function buildResponseTemplate(
        plan
    ) {
        const sections =
            plan &&
            plan.sections
                ? plan.sections
                : RESPONSE_SECTIONS.overview;

        return {
            title:
                "RO'Lyfe Location Intelligence Advisor",

            version:
                VERSION,

            intent:
                plan &&
                plan.intent
                    ? plan.intent
                    : INTENTS.GENERAL,

            mode:
                plan &&
                plan.mode
                    ? plan.mode
                    : MODES.OVERVIEW,

            sections:
                sections.map(
                    function (section) {
                        return {
                            id:
                                section,

                            title:
                                formatSectionTitle(
                                    section
                                ),

                            required:
                                [
                                    "direct_answer",
                                    "comparison_scope",
                                    "property_context",
                                    "business_context"
                                ].indexOf(
                                    section
                                ) !== -1
                        };
                    }
                )
        };
    }

    function formatSectionTitle(
        section
    ) {
        const titles = {
            direct_answer:
                "Direct Answer",

            location_context:
                "Location Context",

            key_factors:
                "Key Factors",

            tradeoffs:
                "Tradeoffs",

            data_gaps:
                "Data Gaps",

            next_steps:
                "Next Steps",

            climate:
                "Climate",

            weather:
                "Current Weather",

            risk:
                "Risk",

            housing:
                "Housing",

            cost:
                "Cost of Living",

            incentives:
                "Incentives & Programs",

            business:
                "Business & Economic Conditions",

            opportunity:
                "Opportunity",

            comparison_scope:
                "Comparison Scope",

            shared_factors:
                "Shared Factors",

            differences:
                "Key Differences",

            current_position:
                "Current Position",

            priority_actions:
                "Priority Actions",

            verification_items:
                "Verification Items",

            follow_up_questions:
                "Follow-Up Questions",

            property_context:
                "Property Context",

            financial_context:
                "Financial Context",

            comparables:
                "Comparable Properties",

            business_context:
                "Business Context",

            economic_environment:
                "Economic Environment",

            workforce:
                "Workforce"
        };

        return (
            titles[section] ||
            safeString(
                section,
                ""
            )
                .replace(
                    /([A-Z])/g,
                    " $1"
                )
                .replace(
                    /^./,
                    function (char) {
                        return char.toUpperCase();
                    }
                )
        );
    }

    /*
    ===========================================================
    LOCAL RESPONSE
    ===========================================================
    */

    function generateLocalResponse(
        question,
        context
    ) {
        context =
            context ||
            state.context ||
            {};

        const plan =
            context.plan ||
            state.plan ||
            buildResponsePlan(
                question
            );

        const location =
            context.location ||
            state.location ||
            {};

        const locationName =
            location.name ||
            location.city ||
            location.county ||
            location.state ||
            "the selected location";

        const response = {
            title:
                "RO'Lyfe Location Intelligence Advisor",

            version:
                VERSION,

            summary:
                "The advisor is using the available RO'Lyfe location intelligence for " +
                locationName +
                ".",

            intent:
                plan.intent,

            mode:
                plan.mode,

            directAnswer:
                buildLocalDirectAnswer(
                    plan,
                    locationName,
                    context
                ),

            signals:
                limit(
                    context.signals ||
                        [],
                    state.config.maxSignals
                ),

            findings:
                limit(
                    context.findings ||
                        [],
                    state.config.maxSignals
                ),

            tradeoffs:
                limit(
                    context.tradeoffs ||
                        [],
                    state.config.maxTradeoffs
                ),

            gaps:
                limit(
                    context.gaps ||
                        [],
                    state.config.maxGaps
                ),

            actions:
                limit(
                    context.actions ||
                        [],
                    state.config.maxActions
                ),

            sources:
                limit(
                    context.sources ||
                        [],
                    state.config.maxSources
                ),

            property:
                clone(
                    context.property
                ),

            propertyContext:
                clone(
                    context.propertyContext
                ),

            followUpQuestions:
                limit(
                    plan.followUpQuestions ||
                        [],
                    state.config.maxQuestions
                ),

            sections:
                buildLocalSections(
                    plan,
                    context
                ),

            disclaimer:
                "RO'Lyfe provides decision-support intelligence. Verify current data, program eligibility, property conditions, financing, taxes, insurance, zoning, comparable sales, and other material facts before acting.",

            generatedAt:
                now()
        };

        state.response =
            response;

        emit(
            "responseBuilt",
            clone(response)
        );

        persist();

        return clone(
            response
        );
    }

    function buildLocalDirectAnswer(
        plan,
        locationName,
        context
    ) {
        const signalCount =
            array(
                context.signals
            ).length;

        const gapCount =
            array(
                context.gaps
            ).length;

        if (
            plan.intent ===
            INTENTS.COMPARE
        ) {
            return (
                "This request is structured as a location comparison. " +
                "The current analysis should compare the requested locations " +
                "across the relevant dimensions rather than treating one " +
                "location as universally superior."
            );
        }

        if (
            plan.intent ===
            INTENTS.PROPERTY
        ) {
            const property =
                context.property ||
                {};

            const address =
                property.address ||
                property.city ||
                locationName;

            return (
                "This is a property-oriented analysis for " +
                address +
                ". The Advisor can connect the property to location, housing, " +
                "risk, financial, comparable, business, and opportunity intelligence. " +
                "Property-level assumptions still require verification."
            );
        }

        if (
            plan.intent ===
            INTENTS.BUSINESS
        ) {
            return (
                "This request is business-oriented. " +
                "The Advisor should connect economic conditions, business programs, " +
                "industry conditions, operating costs, workforce, and opportunity " +
                "with the user's specific business model."
            );
        }

        if (signalCount > 0) {
            return (
                "RO'Lyfe found " +
                signalCount +
                " relevant intelligence signal(s) for " +
                locationName +
                ". The analysis should focus on the signals most relevant " +
                "to your stated priorities."
            );
        }

        if (gapCount > 0) {
            return (
                "The current location profile has information gaps. " +
                "Additional location-specific data should be gathered before " +
                "making a major relocation or investment decision."
            );
        }

        return (
            "The advisor has created a structured analysis plan for " +
            locationName +
            ". More specific preferences or location data will make the analysis more useful."
        );
    }

    function buildLocalSections(
        plan,
        context
    ) {
        const sections = {};

        array(
            plan.sections
        ).forEach(
            function (section) {
                sections[section] = {
                    title:
                        formatSectionTitle(
                            section
                        ),

                    content:
                        getSectionContent(
                            section,
                            context
                        )
                };
            }
        );

        return sections;
    }

    function getSectionContent(
        section,
        context
    ) {
        switch (section) {
            case "tradeoffs":
                return (
                    context.tradeoffs ||
                    []
                );

            case "data_gaps":
                return (
                    context.gaps ||
                    []
                );

            case "next_steps":
                return (
                    context.actions ||
                    []
                );

            case "follow_up_questions":
                return (
                    context.plan &&
                    context.plan.followUpQuestions
                ) || [];

            case "key_factors":
                return (
                    context.signals ||
                    []
                );

            case "property_context":
                return (
                    context.propertyContext ||
                    {}
                );

            case "financial_context":
                return (
                    context.propertyContext &&
                    context.propertyContext.financials
                ) || {};

            case "comparables":
                return (
                    context.propertyContext &&
                    context.propertyContext.comparables
                ) || [];

            case "location_context":
                return (
                    context.location ||
                    {}
                );

            default:
                return [];
        }
    }

    /*
    ===========================================================
    ANALYSIS
    ===========================================================
    */

    function analyze(
        question,
        options
    ) {
        options =
            options || {};

        state.status =
            "analyzing";

        try {
            if (
                options.location
            ) {
                setLocation(
                    options.location
                );
            }

            if (
                options.preferences
            ) {
                setPreferences(
                    options.preferences
                );
            }

            if (
                options.property
            ) {
                setProperty(
                    options.property
                );
            }

            const plan =
                buildResponsePlan(
                    question,
                    options
                );

            const context =
                buildAdvisorContext(
                    question,
                    options
                );

            const result = {
                plan:
                    plan,

                context:
                    context,

                instructions:
                    buildInstructions(
                        plan,
                        options
                    ),

                responseTemplate:
                    buildResponseTemplate(
                        plan
                    )
            };

            state.status =
                "ready";

            state.metadata.updatedAt =
                now();

            emit(
                "analysisComplete",
                clone(result)
            );

            persist();

            return clone(
                result
            );
        } catch (error) {
            state.status =
                "error";

            emit(
                "error",
                {
                    operation:
                        "analyze",

                    error:
                        error.message
                }
            );

            return {
                error: true,
                message:
                    error.message
            };
        }
    }

    /*
    ===========================================================
    ASK / ANSWER
    ===========================================================
    */

    function ask(
        question,
        options
    ) {
        options =
            options || {};

        const analysis =
            analyze(
                question,
                options
            );

        if (analysis.error) {
            return analysis;
        }

        const ai =
            window.ROlyfeAI ||
            window.ROLYFE_AI;

        if (
            options.useAI !== false &&
            ai &&
            typeof ai.ask ===
                "function" &&
            !options.fromAI &&
            !options.fromAdvisor
        ) {
            return ai.ask(
                question,
                Object.assign(
                    {},
                    options,
                    {
                        advisorAnalysis:
                            analysis,

                        fromAdvisor:
                            true
                    }
                )
            );
        }

        return generateLocalResponse(
            question,
            analysis.context
        );
    }

    function answer(
        question,
        options
    ) {
        return ask(
            question,
            options
        );
    }

    /*
    ===========================================================
    SPECIALIZED HELPERS
    ===========================================================
    */

    function analyzeRelocation(
        question,
        options
    ) {
        options =
            Object.assign(
                {},
                options || {},
                {
                    preferredIntent:
                        INTENTS.RELOCATION
                }
            );

        return analyze(
            question ||
                "Help me analyze this relocation decision.",
            options
        );
    }

    function analyzeComparison(
        question,
        options
    ) {
        options =
            Object.assign(
                {},
                options || {},
                {
                    preferredIntent:
                        INTENTS.COMPARE,

                    mode:
                        MODES.COMPARISON
                }
            );

        return analyze(
            question ||
                "Compare these locations.",
            options
        );
    }

    function analyzeProperty(
        question,
        options
    ) {
        options =
            Object.assign(
                {},
                options || {},
                {
                    preferredIntent:
                        INTENTS.PROPERTY,

                    mode:
                        MODES.PROPERTY_CONTEXT
                }
            );

        if (
            options.property
        ) {
            setProperty(
                options.property
            );
        }

        return analyze(
            question ||
                "Analyze this property in its location context.",
            options
        );
    }

    function analyzeBusiness(
        question,
        options
    ) {
        options =
            Object.assign(
                {},
                options || {},
                {
                    preferredIntent:
                        INTENTS.BUSINESS,

                    mode:
                        MODES.BUSINESS_CONTEXT
                }
            );

        return analyze(
            question ||
                "Analyze this location for business opportunity.",
            options
        );
    }

    function analyzeRisk(
        question,
        options
    ) {
        options =
            Object.assign(
                {},
                options || {},
                {
                    preferredIntent:
                        INTENTS.RISK
                }
            );

        return analyze(
            question ||
                "Analyze the location risk profile.",
            options
        );
    }

    /*
    ===========================================================
    AI CONTEXT
    ===========================================================
    */

    function buildAIContext(
        question,
        options
    ) {
        const analysis =
            analyze(
                question ||
                    state.lastQuestion,
                options || {}
            );

        if (analysis.error) {
            return analysis;
        }

        return {
            version:
                VERSION,

            advisor: {
                version:
                    VERSION,

                role:
                    "RO'Lyfe Location Intelligence Advisor",

                intent:
                    analysis.plan.intent,

                mode:
                    analysis.plan.mode,

                confidence:
                    analysis.plan.confidence
            },

            instructions:
                analysis.instructions,

            location:
                clone(
                    state.location
                ),

            preferences:
                clone(
                    state.preferences
                ),

            property:
                clone(
                    state.property
                ),

            propertyContext:
                clone(
                    state.propertyContext
                ),

            plan:
                clone(
                    analysis.plan
                ),

            context:
                clone(
                    analysis.context
                ),

            responseTemplate:
                analysis.responseTemplate
        };
    }

    function buildSharedContext() {
        return {
            module:
                "advisor",

            version:
                VERSION,

            status:
                state.status,

            location:
                clone(
                    state.location
                ),

            preferences:
                clone(
                    state.preferences
                ),

            property:
                clone(
                    state.property
                ),

            propertyContext:
                clone(
                    state.propertyContext
                ),

            plan:
                clone(
                    state.plan
                ),

            context:
                clone(
                    state.context
                ),

            response:
                clone(
                    state.response
                ),

            metadata:
                clone(
                    state.metadata
                )
        };
    }

    /*
    ===========================================================
    HISTORY
    ===========================================================
    */

    function addHistory(
        question,
        result
    ) {
        state.history.push({
            question:
                safeString(
                    question,
                    ""
                ),

            intent:
                state.lastIntent,

            mode:
                state.lastMode,

            result:
                clone(result),

            createdAt:
                now()
        });

        state.history =
            state.history.slice(
                -state.config.maxHistory
            );

        persist();

        emit(
            "historyChanged",
            clone(
                state.history
            )
        );

        return clone(
            state.history
        );
    }

    function getHistory() {
        return clone(
            state.history
        );
    }

    function clearHistory() {
        state.history = [];

        persist();

        emit(
            "historyChanged",
            []
        );

        return true;
    }

    /*
    ===========================================================
    CONFIGURATION
    ===========================================================
    */

    function configure(
        options
    ) {
        if (
            !options ||
            typeof options !==
                "object"
        ) {
            return clone(
                state.config
            );
        }

        state.config =
            Object.assign(
                {},
                state.config,
                options
            );

        emit(
            "configured",
            clone(
                state.config
            )
        );

        persist();

        return clone(
            state.config
        );
    }

    function getConfig() {
        return clone(
            state.config
        );
    }

    /*
    ===========================================================
    GETTERS
    ===========================================================
    */

    function getState() {
        return {
            status:
                state.status,

            initialized:
                state.initialized,

            location:
                clone(
                    state.location
                ),

            preferences:
                clone(
                    state.preferences
                ),

            lastQuestion:
                state.lastQuestion,

            lastIntent:
                state.lastIntent,

            lastMode:
                state.lastMode,

            property:
                clone(
                    state.property
                ),

            propertyContext:
                clone(
                    state.propertyContext
                ),

            plan:
                clone(
                    state.plan
                ),

            context:
                clone(
                    state.context
                ),

            response:
                clone(
                    state.response
                ),

            history:
                clone(
                    state.history
                ),

            metadata:
                clone(
                    state.metadata
                )
        };
    }

    function getStatus() {
        return {
            module:
                "ROlyfeAdvisor",

            version:
                VERSION,

            status:
                state.status,

            initialized:
                state.initialized,

            intent:
                state.lastIntent,

            mode:
                state.lastMode,

            hasLocation:
                !!state.location,

            hasProperty:
                !!state.property,

            hasPropertyContext:
                !!state.propertyContext,

            hasPlan:
                !!state.plan,

            hasContext:
                !!state.context
        };
    }

    function getPlan() {
        return clone(
            state.plan
        );
    }

    function getContext() {
        return clone(
            state.context
        );
    }

    function getResponse() {
        return clone(
            state.response
        );
    }

    function getIntent() {
        return state.lastIntent;
    }

    function getMode() {
        return state.lastMode;
    }

    /*
    ===========================================================
    RESET
    ===========================================================
    */

    function reset(options) {
        options =
            options || {};

        const keepLocation =
            options.keepLocation;

        const keepPreferences =
            options.keepPreferences;

        const keepHistory =
            options.keepHistory;

        const location =
            keepLocation
                ? clone(
                    state.location
                )
                : null;

        const preferences =
            keepPreferences
                ? clone(
                    state.preferences
                )
                : {};

        const history =
            keepHistory
                ? clone(
                    state.history
                )
                : [];

        state.status =
            "idle";

        state.location =
            location;

        state.preferences =
            preferences;

        state.lastQuestion =
            "";

        state.lastIntent =
            INTENTS.GENERAL;

        state.lastMode =
            MODES.OVERVIEW;

        state.property =
            null;

        state.propertyContext =
            null;

        state.plan =
            null;

        state.context =
            null;

        state.response =
            null;

        state.history =
            history;

        if (
            options.clearPersistence
        ) {
            clearPersistence();
        } else {
            persist();
        }

        emit(
            "reset",
            getState()
        );

        return getState();
    }

    /*
    ===========================================================
    INITIALIZATION
    ===========================================================
    */

    function initialize(
        options
    ) {
        /*
        IMPORTANT:
        Restore saved state FIRST.
        Explicit initialization options are
        applied AFTER restoration.
        */

        if (
            state.initialized
        ) {
            return getStatus();
        }

        restore();

        if (
            options &&
            typeof options ===
                "object"
        ) {
            state.config =
                Object.assign(
                    {},
                    state.config,
                    options
                );

            if (
                options.location
            ) {
                state.location =
                    clone(
                        options.location
                    );
            }

            if (
                options.preferences
            ) {
                state.preferences =
                    Object.assign(
                        {},
                        state.preferences,
                        options.preferences
                    );
            }

            if (
                options.property
            ) {
                state.property =
                    clone(
                        options.property
                    );
            }
        }

        state.metadata.createdAt =
            state.metadata.createdAt ||
            now();

        state.initialized =
            true;

        state.status =
            "ready";

        state.metadata.version =
            VERSION;

        state.metadata.updatedAt =
            now();

        /*
        Reconnect the current state to
        supporting intelligence modules.
        */

        if (
            state.location
        ) {
            setLocation(
                state.location
            );
        }

        if (
            Object.keys(
                state.preferences
            ).length
        ) {
            setPreferences(
                state.preferences
            );
        }

        if (
            state.property
        ) {
            state.propertyContext =
                buildPropertyContext(
                    state.property
                );
        }

        persist();

        emit(
            "initialized",
            getStatus()
        );

        emit(
            "stateChanged",
            getState()
        );

        return getStatus();
    }

    /*
    ===========================================================
    SERIALIZATION
    ===========================================================
    */

    function serialize() {
        return JSON.stringify(
            buildSharedContext()
        );
    }

    /*
    ===========================================================
    PUBLIC API
    ===========================================================
    */

    const Advisor = {
        VERSION:
            VERSION,

        version:
            VERSION,

        INTENTS:
            INTENTS,

        MODES:
            MODES,

        DOMAIN_ORDER:
            DOMAIN_ORDER,

        initialize:
            initialize,

        configure:
            configure,

        getConfig:
            getConfig,

        setLocation:
            setLocation,

        getLocation:
            getLocation,

        setPreferences:
            setPreferences,

        getPreferences:
            getPreferences,

        setProperty:
            setProperty,

        getProperty:
            getProperty,

        getPropertyContext:
            getPropertyContext,

        classifyQuestion:
            classifyQuestion,

        determineMode:
            determineMode,

        getDomainsForIntent:
            getDomainsForIntent,

        buildResponsePlan:
            buildResponsePlan,

        buildAdvisorContext:
            buildAdvisorContext,

        buildAIContext:
            buildAIContext,

        buildSharedContext:
            buildSharedContext,

        buildInstructions:
            buildInstructions,

        buildResponseTemplate:
            buildResponseTemplate,

        analyze:
            analyze,

        ask:
            ask,

        answer:
            answer,

        analyzeRelocation:
            analyzeRelocation,

        analyzeComparison:
            analyzeComparison,

        analyzeProperty:
            analyzeProperty,

        analyzeBusiness:
            analyzeBusiness,

        analyzeRisk:
            analyzeRisk,

        generateLocalResponse:
            generateLocalResponse,

        addHistory:
            addHistory,

        getHistory:
            getHistory,

        clearHistory:
            clearHistory,

        getState:
            getState,

        getStatus:
            getStatus,

        getPlan:
            getPlan,

        getContext:
            getContext,

        getResponse:
            getResponse,

        getIntent:
            getIntent,

        getMode:
            getMode,

        reset:
            reset,

        persist:
            persist,

        restore:
            restore,

        clearPersistence:
            clearPersistence,

        subscribe:
            subscribe,

        serialize:
            serialize
    };

    /*
    ===========================================================
    GLOBAL EXPORTS
    ===========================================================
    */

    window.ROlyfeAdvisor =
        Advisor;

    window.ROLYFE_ADVISOR =
        Advisor;

    /*
    ===========================================================
    AUTO INITIALIZE
    ===========================================================
    */

    function boot() {
        if (
            !state.config.autoInitialize
        ) {
            return;
        }

        initialize();
    }

    if (
        document.readyState ===
            "complete" ||
        document.readyState ===
            "interactive"
    ) {
        setTimeout(
            boot,
            0
        );
    } else {
        document.addEventListener(
            "DOMContentLoaded",
            boot,
            {
                once: true
            }
        );
    }

})(window);
