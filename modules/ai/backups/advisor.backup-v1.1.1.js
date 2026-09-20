/* ============================================================
   RO’Lyfe Relocation Intelligence Center™
   AI Advisor / Decision-Support Orchestrator

   File:
   /modules/ai/advisor.js

   Version:
   1.1.1

   Change:
   - Fixed initialization persistence order.
   - Existing persisted advisor state is restored BEFORE
     explicit initialization options are applied.
   - Prevents startup configuration from overwriting saved
     location, preferences, context, or history.
   - Preserves the v1.1.0 public API and event model.

   Architecture:
   LOCATION
      ↓
   DOMAIN MODULES
      ↓
   LOCATION ANALYSIS
      ↓
   ADVISOR
      ↓
   AI.JS MASTER ORCHESTRATOR
      ↓
   AI LOCATION INTELLIGENCE UI

   Important:
   - Advisor does NOT recursively call AI.js.
   - Advisor is the decision-support/context layer.
   - AI.js remains the master AI orchestration layer.
   - No universal "best place" ranking.
   - Recommendations are preference-driven and evidence-based.
   - Missing data is surfaced rather than invented.

   Copyright:
   Root Of Lyfe LLC
   ============================================================ */

(function (window) {
    "use strict";

    /* ============================================================
       VERSION
       ============================================================ */

    const VERSION = "1.1.1";

    /* ============================================================
       DEFAULT CONFIGURATION
       ============================================================ */

    const DEFAULT_CONFIG = {
        autoInitialize: true,

        persist: true,

        storageKey: "rolyfe_advisor_v1",

        maxHistory: 20,

        maxSignals: 30,

        maxGaps: 20,

        maxTradeoffs: 20,

        maxActions: 20,

        maxSources: 40,

        maxResponseCharacters: 12000,

        defaultGeography: "state",

        defaultMode: "overview"
    };

    /* ============================================================
       INTENTS
       ============================================================ */

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

    /* ============================================================
       MODES
       ============================================================ */

    const MODES = {
        OVERVIEW: "overview",
        DEEP_DIVE: "deep_dive",
        COMPARISON: "comparison",
        NEXT_STEPS: "next_steps",
        PROPERTY_CONTEXT: "property_context",
        BUSINESS_CONTEXT: "business_context"
    };

    /* ============================================================
       DOMAIN ORDER
       ============================================================ */

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

    /* ============================================================
       INTENT → DOMAIN MAP
       ============================================================ */

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
            "climate",
            "weather",
            "risk",
            "housing",
            "costOfLiving",
            "incentives",
            "business",
            "opportunity",
            "property"
        ]
    };

    /* ============================================================
       KEYWORDS
       ============================================================ */

    const KEYWORDS = {
        relocation: [
            "move",
            "moving",
            "relocate",
            "relocation",
            "live",
            "living",
            "where should i live",
            "where can i live",
            "move to",
            "relocate to"
        ],

        compare: [
            "compare",
            "comparison",
            "versus",
            "vs",
            "between",
            "which location",
            "locations"
        ],

        climate: [
            "climate",
            "temperature",
            "hot",
            "cold",
            "warm",
            "cool",
            "humid",
            "humidity",
            "snow",
            "winter",
            "summer",
            "rain",
            "rainfall"
        ],

        weather: [
            "weather",
            "forecast",
            "today",
            "tonight",
            "tomorrow",
            "radar",
            "storm",
            "storms",
            "alert",
            "alerts"
        ],

        risk: [
            "risk",
            "danger",
            "hazard",
            "flood",
            "flooding",
            "tornado",
            "hurricane",
            "wildfire",
            "earthquake",
            "drought",
            "heat",
            "freeze",
            "disaster"
        ],

        housing: [
            "housing",
            "house",
            "home",
            "homes",
            "rent",
            "rental",
            "renting",
            "mortgage",
            "afford",
            "affordability",
            "property value",
            "home price"
        ],

        cost: [
            "cost",
            "cost of living",
            "expenses",
            "tax",
            "taxes",
            "income tax",
            "property tax",
            "utilities",
            "cheap",
            "expensive"
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
            "homebuyer",
            "down payment assistance"
        ],

        business: [
            "business",
            "businesses",
            "startup",
            "start a business",
            "company",
            "entrepreneur",
            "entrepreneurship",
            "jobs",
            "employment",
            "workforce",
            "industry",
            "funding"
        ],

        property: [
            "property",
            "deal",
            "real estate",
            "investment property",
            "flip",
            "rehab",
            "rehabilitation",
            "arv",
            "mao",
            "rental property",
            "cash flow"
        ],

        opportunity: [
            "opportunity",
            "opportunities",
            "growth",
            "development",
            "investment",
            "invest",
            "build",
            "development potential"
        ]
    };

    /* ============================================================
       RESPONSE SECTIONS
       ============================================================ */

    const RESPONSE_SECTIONS = [
        "summary",
        "signals",
        "tradeoffs",
        "gaps",
        "actions",
        "sources"
    ];

    /* ============================================================
       CONFIG
       ============================================================ */

    let config = Object.assign({}, DEFAULT_CONFIG);

    /* ============================================================
       STATE FACTORY
       ============================================================ */

    function createInitialState() {
        const timestamp = now();

        return {
            status: "idle",

            initialized: false,

            config: clone(config),

            location: null,

            preferences: {},

            lastQuestion: "",

            lastIntent: INTENTS.GENERAL,

            lastMode: MODES.OVERVIEW,

            plan: {
                intent: INTENTS.GENERAL,

                mode: MODES.OVERVIEW,

                domains: INTENT_DOMAINS.general.slice(),

                geography: config.defaultGeography,

                sections: RESPONSE_SECTIONS.slice()
            },

            context: {
                location: null,

                domains: {},

                signals: [],

                findings: [],

                tradeoffs: [],

                gaps: [],

                actions: [],

                sources: [],

                summary: "",

                plan: null,

                collectedAt: timestamp
            },

            response: null,

            history: [],

            metadata: {
                version: VERSION,

                createdAt: timestamp,

                updatedAt: timestamp,

                lastInitializedAt: null,

                analysisCount: 0,

                questionCount: 0
            }
        };
    }

    let state = createInitialState();

    /* ============================================================
       LISTENERS
       ============================================================ */

    const listeners = {
        initialized: [],
        configured: [],
        locationChanged: [],
        preferencesChanged: [],
        planCreated: [],
        contextBuilt: [],
        responseBuilt: [],
        historyChanged: [],
        stateChanged: [],
        reset: []
    };

    /* ============================================================
       BASIC HELPERS
       ============================================================ */

    function now() {
        return new Date().toISOString();
    }

    function text(value, fallback) {
        if (value === null || value === undefined) {
            return fallback !== undefined ? fallback : "";
        }

        return String(value);
    }

    function number(value, fallback) {
        const n = Number(value);

        return Number.isFinite(n)
            ? n
            : (fallback !== undefined ? fallback : null);
    }

    function array(value) {
        return Array.isArray(value) ? value : [];
    }

    function clone(value) {
        if (value === undefined || value === null) {
            return value;
        }

        try {
            return JSON.parse(JSON.stringify(value));
        } catch (error) {
            return value;
        }
    }

    function unique(values) {
        const seen = new Set();

        return array(values).filter(function (value) {
            const key =
                typeof value === "object"
                    ? JSON.stringify(value)
                    : String(value);

            if (seen.has(key)) {
                return false;
            }

            seen.add(key);

            return true;
        });
    }

    function uniqueObjects(values, max) {
        const output = [];
        const seen = new Set();

        array(values).forEach(function (item) {
            if (item === null || item === undefined) {
                return;
            }

            const normalized =
                typeof item === "object"
                    ? clone(item)
                    : { value: item };

            const key = JSON.stringify(normalized);

            if (seen.has(key)) {
                return;
            }

            seen.add(key);

            output.push(normalized);
        });

        return output.slice(0, max || output.length);
    }

    /* ============================================================
       EVENT SYSTEM
       ============================================================ */

    function emit(eventName, payload) {
        const eventListeners = listeners[eventName];

        if (!eventListeners) {
            return;
        }

        eventListeners.slice().forEach(function (listener) {
            try {
                listener(payload, getState());
            } catch (error) {
                console.warn(
                    "[RO’Lyfe Advisor] Listener error:",
                    eventName,
                    error
                );
            }
        });
    }

    function emitStateChanged(reason) {
        listeners.stateChanged.slice().forEach(function (listener) {
            try {
                listener(
                    {
                        reason: reason || "state_changed",
                        state: getState()
                    },
                    getState()
                );
            } catch (error) {
                console.warn(
                    "[RO’Lyfe Advisor] State listener error:",
                    error
                );
            }
        });
    }

    /* ============================================================
       PERSISTENCE
       ============================================================ */

    function canUseStorage() {
        if (!config.persist) {
            return false;
        }

        try {
            if (!window.localStorage) {
                return false;
            }

            const testKey = "__rolyfe_advisor_storage_test__";

            window.localStorage.setItem(testKey, "1");
            window.localStorage.removeItem(testKey);

            return true;
        } catch (error) {
            return false;
        }
    }

    function persist() {
        if (!config.persist || !canUseStorage()) {
            return false;
        }

        try {
            state.metadata.updatedAt = now();

            window.localStorage.setItem(
                config.storageKey,
                JSON.stringify({
                    version: VERSION,
                    state: clone(state)
                })
            );

            return true;
        } catch (error) {
            console.warn(
                "[RO’Lyfe Advisor] Persistence unavailable:",
                error
            );

            return false;
        }
    }

    function restore() {
        if (!config.persist || !canUseStorage()) {
            return false;
        }

        try {
            const raw = window.localStorage.getItem(
                config.storageKey
            );

            if (!raw) {
                return false;
            }

            const saved = JSON.parse(raw);

            if (!saved || !saved.state) {
                return false;
            }

            const restored = saved.state;

            state = Object.assign(
                createInitialState(),
                restored
            );

            state.config = Object.assign(
                {},
                config,
                restored.config || {}
            );

            config = Object.assign(
                {},
                config,
                restored.config || {}
            );

            state.config = clone(config);

            state.plan = Object.assign(
                createInitialState().plan,
                restored.plan || {}
            );

            state.context = Object.assign(
                createInitialState().context,
                restored.context || {}
            );

            state.metadata = Object.assign(
                createInitialState().metadata,
                restored.metadata || {}
            );

            state.metadata.version = VERSION;

            return true;
        } catch (error) {
            console.warn(
                "[RO’Lyfe Advisor] Restore failed:",
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
                config.storageKey
            );

            return true;
        } catch (error) {
            return false;
        }
    }

    /* ============================================================
       MODULE ACCESS
       ============================================================ */

    function getModule(name) {
        if (!name) {
            return null;
        }

        return (
            window[name] ||
            window[
                name.replace(/^ROlyfe/, "ROLYFE_").toUpperCase()
            ] ||
            null
        );
    }

    function callModule(moduleName, methodName) {
        const module = getModule(moduleName);

        if (
            !module ||
            typeof module[methodName] !== "function"
        ) {
            return null;
        }

        const args = Array.prototype.slice.call(
            arguments,
            2
        );

        try {
            return module[methodName].apply(module, args);
        } catch (error) {
            console.warn(
                "[RO’Lyfe Advisor] Module call failed:",
                moduleName,
                methodName,
                error
            );

            return null;
        }
    }

    /* ============================================================
       LOCATION
       ============================================================ */

    function setLocation(location) {
        if (!location) {
            state.location = null;

            state.metadata.updatedAt = now();

            persist();

            emit("locationChanged", null);

            emitStateChanged("location_cleared");

            return null;
        }

        if (typeof location === "string") {
            location = {
                name: location
            };
        }

        state.location = clone(location);

        state.metadata.updatedAt = now();

        callModule(
            "ROlyfeLocationAnalysis",
            "setLocation",
            state.location
        );

        callModule(
            "ROlyfeHousing",
            "setLocation",
            state.location
        );

        callModule(
            "ROlyfeBusiness",
            "setLocation",
            state.location
        );

        callModule(
            "ROlyfeIncentives",
            "setLocation",
            state.location
        );

        persist();

        emit("locationChanged", clone(state.location));

        emitStateChanged("location_changed");

        return clone(state.location);
    }

    function getLocation() {
        return clone(state.location);
    }

    /* ============================================================
       PREFERENCES
       ============================================================ */

    function setPreferences(preferences) {
        state.preferences = Object.assign(
            {},
            state.preferences || {},
            preferences || {}
        );

        state.metadata.updatedAt = now();

        callModule(
            "ROlyfeLocationAnalysis",
            "setPreferences",
            state.preferences
        );

        callModule(
            "ROlyfeHousing",
            "setPreferences",
            state.preferences
        );

        callModule(
            "ROlyfeBusiness",
            "setPreferences",
            state.preferences
        );

        callModule(
            "ROlyfeIncentives",
            "setPreferences",
            state.preferences
        );

        persist();

        emit(
            "preferencesChanged",
            clone(state.preferences)
        );

        emitStateChanged("preferences_changed");

        return clone(state.preferences);
    }

    function getPreferences() {
        return clone(state.preferences || {});
    }

    /* ============================================================
       INTENT CLASSIFICATION
       ============================================================ */

    function scoreIntent(question, intent) {
        const q = text(question).toLowerCase();

        const keywords = KEYWORDS[intent] || [];

        let score = 0;

        keywords.forEach(function (keyword) {
            if (q.indexOf(keyword.toLowerCase()) !== -1) {
                score += keyword.length > 5 ? 2 : 1;
            }
        });

        return score;
    }

    function classifyQuestion(question) {
        const q = text(question).trim();

        if (!q) {
            return INTENTS.GENERAL;
        }

        const scores = {};

        Object.keys(KEYWORDS).forEach(function (intent) {
            scores[intent] = scoreIntent(q, intent);
        });

        let bestIntent = INTENTS.GENERAL;
        let bestScore = 0;

        Object.keys(scores).forEach(function (intent) {
            if (scores[intent] > bestScore) {
                bestScore = scores[intent];
                bestIntent = intent;
            }
        });

        return bestIntent;
    }

    /* ============================================================
       MODE
       ============================================================ */

    function determineMode(intent, question) {
        const q = text(question).toLowerCase();

        if (
            intent === INTENTS.COMPARE ||
            q.indexOf("compare") !== -1 ||
            q.indexOf("versus") !== -1 ||
            q.indexOf(" vs ") !== -1
        ) {
            return MODES.COMPARISON;
        }

        if (intent === INTENTS.PROPERTY) {
            return MODES.PROPERTY_CONTEXT;
        }

        if (intent === INTENTS.BUSINESS) {
            return MODES.BUSINESS_CONTEXT;
        }

        if (
            q.indexOf("what should i do") !== -1 ||
            q.indexOf("next step") !== -1 ||
            q.indexOf("next steps") !== -1
        ) {
            return MODES.NEXT_STEPS;
        }

        if (
            q.indexOf("deep") !== -1 ||
            q.indexOf("detailed") !== -1 ||
            q.indexOf("full analysis") !== -1
        ) {
            return MODES.DEEP_DIVE;
        }

        return MODES.OVERVIEW;
    }

    /* ============================================================
       DOMAIN SELECTION
       ============================================================ */

    function getDomainsForIntent(intent) {
        return (
            INTENT_DOMAINS[intent] ||
            INTENT_DOMAINS.general
        ).slice();
    }

    /* ============================================================
       RESPONSE PLAN
       ============================================================ */

    function buildResponsePlan(question) {
        const intent = classifyQuestion(question);

        const mode = determineMode(
            intent,
            question
        );

        const domains = getDomainsForIntent(intent);

        const plan = {
            intent: intent,

            mode: mode,

            domains: domains,

            geography:
                state.location &&
                state.location.geography
                    ? state.location.geography
                    : config.defaultGeography,

            sections: RESPONSE_SECTIONS.slice(),

            createdAt: now()
        };

        state.lastIntent = intent;

        state.lastMode = mode;

        state.plan = plan;

        emit("planCreated", clone(plan));

        emitStateChanged("plan_created");

        return clone(plan);
    }

    /* ============================================================
       SAFE PROFILE ACCESS
       ============================================================ */

    function safelyGetProfile(
        moduleName,
        profileMethods
    ) {
        const module = getModule(moduleName);

        if (!module) {
            return null;
        }

        const methods = array(profileMethods);

        for (let i = 0; i < methods.length; i++) {
            const method = methods[i];

            if (typeof module[method] !== "function") {
                continue;
            }

            try {
                const result = module[method]();

                if (result !== undefined && result !== null) {
                    return clone(result);
                }
            } catch (error) {
                console.warn(
                    "[RO’Lyfe Advisor] Profile error:",
                    moduleName,
                    method,
                    error
                );
            }
        }

        return null;
    }

    /* ============================================================
       DOMAIN CONTEXT
       ============================================================ */

    function collectDomainContext(plan) {
        const domains = {};

        array(plan.domains).forEach(function (domain) {
            let moduleName = null;

            let methods = [];

            switch (domain) {
                case "location":
                    moduleName =
                        "ROlyfeLocationAnalysis";

                    methods = [
                        "getResult",
                        "getProfile",
                        "getAnalysis",
                        "getState"
                    ];
                    break;

                case "climate":
                    moduleName = "ROlyfeClimate";

                    methods = [
                        "getResult",
                        "getProfile",
                        "getSummary",
                        "getState"
                    ];
                    break;

                case "weather":
                    moduleName = "ROlyfeWeather";

                    methods = [
                        "getResult",
                        "getProfile",
                        "getSummary",
                        "getState"
                    ];
                    break;

                case "risk":
                    moduleName = "ROlyfeRisk";

                    methods = [
                        "getResult",
                        "getProfile",
                        "getSummary",
                        "getState"
                    ];
                    break;

                case "housing":
                    moduleName = "ROlyfeHousing";

                    methods = [
                        "getResult",
                        "getProfile",
                        "getSummary",
                        "getState"
                    ];
                    break;

                case "costOfLiving":
                    moduleName = "ROlyfeCostOfLiving";

                    methods = [
                        "getResult",
                        "getProfile",
                        "getSummary",
                        "getState"
                    ];
                    break;

                case "incentives":
                    moduleName = "ROlyfeIncentives";

                    methods = [
                        "getResult",
                        "getProfile",
                        "getSummary",
                        "getState"
                    ];
                    break;

                case "business":
                    moduleName = "ROlyfeBusiness";

                    methods = [
                        "getResult",
                        "getProfile",
                        "getSummary",
                        "getState"
                    ];
                    break;

                case "opportunity":
                    moduleName =
                        "ROlyfeOpportunityEngine";

                    methods = [
                        "getResult",
                        "getProfile",
                        "getSummary",
                        "getState"
                    ];
                    break;

                case "property":
                    moduleName =
                        "ROlyfePropertyAnalysis";

                    methods = [
                        "getResult",
                        "getProfile",
                        "getSummary",
                        "getState"
                    ];
                    break;

                default:
                    break;
            }

            if (!moduleName) {
                return;
            }

            const profile = safelyGetProfile(
                moduleName,
                methods
            );

            if (profile) {
                domains[domain] = profile;
            }
        });

        return domains;
    }

    /* ============================================================
       ARRAY EXTRACTION
       ============================================================ */

    function extractArray(source, keys) {
        if (!source || typeof source !== "object") {
            return [];
        }

        for (let i = 0; i < keys.length; i++) {
            const value = source[keys[i]];

            if (Array.isArray(value)) {
                return value;
            }
        }

        return [];
    }

    /* ============================================================
       SIGNAL COLLECTION
       ============================================================ */

    function collectSignals(domains) {
        const signals = [];

        Object.keys(domains || {}).forEach(function (domain) {
            const source = domains[domain];

            extractArray(source, [
                "signals",
                "keySignals",
                "indicators"
            ]).forEach(function (signal) {
                if (typeof signal === "string") {
                    signals.push({
                        domain: domain,
                        text: signal
                    });
                } else {
                    signals.push(
                        Object.assign(
                            {
                                domain: domain
                            },
                            clone(signal)
                        )
                    );
                }
            });
        });

        return uniqueObjects(
            signals,
            config.maxSignals
        );
    }

    /* ============================================================
       GAP COLLECTION
       ============================================================ */

    function collectGaps(domains) {
        const gaps = [];

        Object.keys(domains || {}).forEach(function (domain) {
            const source = domains[domain];

            extractArray(source, [
                "gaps",
                "dataGaps",
                "missingData"
            ]).forEach(function (gap) {
                if (typeof gap === "string") {
                    gaps.push({
                        domain: domain,
                        text: gap
                    });
                } else {
                    gaps.push(
                        Object.assign(
                            {
                                domain: domain
                            },
                            clone(gap)
                        )
                    );
                }
            });
        });

        return uniqueObjects(
            gaps,
            config.maxGaps
        );
    }

    /* ============================================================
       TRADEOFF COLLECTION
       ============================================================ */

    function collectTradeoffs(domains) {
        const tradeoffs = [];

        Object.keys(domains || {}).forEach(function (domain) {
            const source = domains[domain];

            extractArray(source, [
                "tradeoffs",
                "tradeOffs",
                "considerations"
            ]).forEach(function (tradeoff) {
                if (typeof tradeoff === "string") {
                    tradeoffs.push({
                        domain: domain,
                        text: tradeoff
                    });
                } else {
                    tradeoffs.push(
                        Object.assign(
                            {
                                domain: domain
                            },
                            clone(tradeoff)
                        )
                    );
                }
            });
        });

        return uniqueObjects(
            tradeoffs,
            config.maxTradeoffs
        );
    }

    /* ============================================================
       ACTION BUILDER
       ============================================================ */

    function buildActions(
        plan,
        signals,
        gaps,
        tradeoffs
    ) {
        const actions = [];

        if (!state.location) {
            actions.push({
                priority: "high",
                action: "Set a target location before making a location-specific decision.",
                reason: "The advisor needs a geography to connect the intelligence layers."
            });
        }

        if (!state.preferences ||
            Object.keys(state.preferences).length === 0) {
            actions.push({
                priority: "medium",
                action: "Add decision priorities such as affordability, climate, risk, business, housing, or incentives.",
                reason: "Preference data makes the analysis more relevant to the user's actual goals."
            });
        }

        if (gaps.length) {
            actions.push({
                priority: "medium",
                action: "Verify the missing or incomplete data before making a final decision.",
                reason: "The current analysis contains information gaps."
            });
        }

        if (
            plan.intent === INTENTS.INCENTIVES
        ) {
            actions.push({
                priority: "high",
                action: "Verify program eligibility, deadlines, funding availability, and current program rules.",
                reason: "Program matching is not a guarantee of eligibility or funding."
            });
        }

        if (
            plan.intent === INTENTS.PROPERTY
        ) {
            actions.push({
                priority: "high",
                action: "Validate property-level financial assumptions before committing capital.",
                reason: "Property outcomes depend on actual acquisition, financing, rehab, holding, and exit costs."
            });
        }

        if (
            plan.intent === INTENTS.BUSINESS
        ) {
            actions.push({
                priority: "high",
                action: "Validate current business programs, financing terms, workforce conditions, and local requirements.",
                reason: "Business opportunity data can change over time."
            });
        }

        if (
            plan.intent === INTENTS.RISK
        ) {
            actions.push({
                priority: "high",
                action: "Separate long-term hazard exposure from current weather conditions and active alerts.",
                reason: "Risk and current weather answer different questions."
            });
        }

        if (
            signals.length &&
            actions.length < config.maxActions
        ) {
            actions.push({
                priority: "low",
                action: "Use the strongest signals as the starting point for deeper research.",
                reason: "Signals identify areas that deserve further validation."
            });
        }

        if (
            tradeoffs.length &&
            actions.length < config.maxActions
        ) {
            actions.push({
                priority: "medium",
                action: "Review the tradeoffs before making a location decision.",
                reason: "Location decisions generally involve competing priorities."
            });
        }

        return uniqueObjects(
            actions,
            config.maxActions
        );
    }

    /* ============================================================
       SOURCE COLLECTION
       ============================================================ */

    function collectSources(domains) {
        const sources = [];

        Object.keys(domains || {}).forEach(function (domain) {
            const source = domains[domain];

            extractArray(source, [
                "sources",
                "references",
                "sourceList"
            ]).forEach(function (item) {
                if (typeof item === "string") {
                    sources.push({
                        domain: domain,
                        source: item
                    });
                } else {
                    sources.push(
                        Object.assign(
                            {
                                domain: domain
                            },
                            clone(item)
                        )
                    );
                }
            });
        });

        return uniqueObjects(
            sources,
            config.maxSources
        );
    }

    /* ============================================================
       SUMMARY
       ============================================================ */

    function buildSummary(
        plan,
        signals,
        tradeoffs,
        gaps
    ) {
        const locationName =
            state.location &&
            (
                state.location.name ||
                state.location.city ||
                state.location.state ||
                state.location.zip
            );

        let summary =
            "RO’Lyfe is analyzing the selected location across " +
            plan.domains.length +
            " intelligence layer" +
            (plan.domains.length === 1 ? "" : "s") +
            ".";

        if (locationName) {
            summary =
                "RO’Lyfe analyzed " +
                text(locationName) +
                " across " +
                plan.domains.length +
                " intelligence layers.";
        }

        if (signals.length) {
            summary +=
                " The analysis identified " +
                signals.length +
                " signal" +
                (signals.length === 1 ? "" : "s") +
                ".";
        }

        if (tradeoffs.length) {
            summary +=
                " There are " +
                tradeoffs.length +
                " tradeoff" +
                (tradeoffs.length === 1 ? "" : "s") +
                " to consider.";
        }

        if (gaps.length) {
            summary +=
                " " +
                gaps.length +
                " data gap" +
                (gaps.length === 1 ? "" : "s") +
                " should be verified.";
        }

        return summary;
    }

    /* ============================================================
       ADVISOR CONTEXT
       ============================================================ */

    function buildAdvisorContext(plan) {
        const domains = collectDomainContext(plan);

        const signals = collectSignals(domains);

        const gaps = collectGaps(domains);

        const tradeoffs = collectTradeoffs(domains);

        const actions = buildActions(
            plan,
            signals,
            gaps,
            tradeoffs
        );

        const sources = collectSources(domains);

        const summary = buildSummary(
            plan,
            signals,
            tradeoffs,
            gaps
        );

        const context = {
            location: clone(state.location),

            preferences: clone(state.preferences),

            plan: clone(plan),

            domains: domains,

            signals: signals,

            findings: [],

            tradeoffs: tradeoffs,

            gaps: gaps,

            actions: actions,

            sources: sources,

            summary: summary,

            collectedAt: now(),

            guardrails: [
                "Do not declare a universal best location.",
                "Use user preferences when interpreting fit.",
                "Distinguish long-term climate from current weather.",
                "Distinguish hazard exposure from active events.",
                "Do not invent missing data.",
                "Identify relevant geography and time period.",
                "Verify incentive eligibility and funding availability.",
                "Do not treat a program match as a guarantee.",
                "Explain tradeoffs rather than hiding them.",
                "Property analysis must use actual property-level assumptions."
            ]
        };

        state.context = context;

        emit("contextBuilt", clone(context));

        emitStateChanged("context_built");

        return clone(context);
    }

    /* ============================================================
       AI INSTRUCTIONS
       ============================================================ */

    function buildInstructions() {
        return [
            "You are the RO’Lyfe Location Intelligence Advisor.",
            "Your role is to help interpret structured location intelligence.",
            "Do not declare a universal best place to live, invest, or build.",
            "Use the user's stated priorities and constraints.",
            "Explain documented differences and tradeoffs.",
            "Do not invent missing data.",
            "Identify geography and time period when relevant.",
            "Separate climate from weather.",
            "Separate hazard exposure from active weather events.",
            "Treat incentives as potential matches, not guarantees.",
            "Tell the user when eligibility or funding must be verified.",
            "For property analysis, distinguish assumptions from verified facts.",
            "For business analysis, distinguish opportunity signals from guaranteed outcomes.",
            "Use concise, practical decision-support language."
        ].join(" ");
    }

    /* ============================================================
       FOLLOW-UP QUESTIONS
       ============================================================ */

    function buildFollowUpQuestions(
        plan,
        context
    ) {
        const questions = [];

        switch (plan.intent) {
            case INTENTS.RELOCATION:
                questions.push(
                    "What monthly housing budget should I use?",
                    "Should climate or lower hazard exposure carry more weight?",
                    "Are you moving for lifestyle, work, business, or investment?"
                );
                break;

            case INTENTS.COMPARE:
                questions.push(
                    "Which two or more locations should be compared?",
                    "What matters most: housing cost, climate, risk, business, or incentives?"
                );
                break;

            case INTENTS.HOUSING:
                questions.push(
                    "Are you looking to rent or buy?",
                    "What monthly housing budget should be used?"
                );
                break;

            case INTENTS.BUSINESS:
                questions.push(
                    "What type of business are you evaluating?",
                    "Are you looking for startup funding, incentives, customers, workforce, or operating cost advantages?"
                );
                break;

            case INTENTS.PROPERTY:
                questions.push(
                    "What is the property purchase price?",
                    "What is the expected ARV or current market value?",
                    "What are the estimated rehab and financing costs?"
                );
                break;

            case INTENTS.RISK:
                questions.push(
                    "Which hazards matter most to you?",
                    "Are you evaluating long-term exposure or current conditions?"
                );
                break;

            case INTENTS.INCENTIVES:
                questions.push(
                    "Are you looking for homeowner, relocation, business, or development incentives?",
                    "What state, county, city, or ZIP should be evaluated?"
                );
                break;

            default:
                questions.push(
                    "What location are you evaluating?",
                    "What matters most in your decision?"
                );
                break;
        }

        return unique(
            questions.filter(Boolean)
        ).slice(0, 6);
    }

    /* ============================================================
       SECTION BUILDER
       ============================================================ */

    function buildResponseSections(
        plan,
        context
    ) {
        return {
            summary: context.summary,

            signals: context.signals,

            tradeoffs: context.tradeoffs,

            gaps: context.gaps,

            actions: context.actions,

            sources: context.sources
        };
    }

    /* ============================================================
       LOCAL RESPONSE ENGINE
       ============================================================ */

    function generateLocalResponse(
        question,
        plan,
        context
    ) {
        const sections = buildResponseSections(
            plan,
            context
        );

        let directAnswer = context.summary;

        if (!state.location) {
            directAnswer =
                "I can analyze the location, but I need a target location first.";
        }

        if (
            state.location &&
            plan.intent === INTENTS.RELOCATION
        ) {
            directAnswer =
                "I can evaluate this location for relocation using housing, climate, weather, risk, incentives, business, and opportunity data. The fit should be interpreted against your priorities rather than as a universal ranking.";
        }

        if (
            plan.intent === INTENTS.COMPARE
        ) {
            directAnswer =
                "I can compare locations across the selected intelligence layers and show where the differences and tradeoffs appear.";
        }

        if (
            plan.intent === INTENTS.PROPERTY
        ) {
            directAnswer =
                "I can connect property-level information with location, housing, risk, business, and opportunity intelligence. Property financial assumptions should be verified before capital is committed.";
        }

        if (
            plan.intent === INTENTS.BUSINESS
        ) {
            directAnswer =
                "I can evaluate the business environment using economic, industry, workforce, incentive, housing, and opportunity signals. Program matches are not guarantees of eligibility or funding.";
        }

        const response = {
            version: VERSION,

            mode: "local",

            title: "RO’Lyfe Location Intelligence",

            question: question,

            intent: plan.intent,

            modeType: plan.mode,

            directAnswer: directAnswer,

            summary: context.summary,

            sections: sections,

            signals: context.signals,

            tradeoffs: context.tradeoffs,

            gaps: context.gaps,

            actions: context.actions,

            followUpQuestions:
                buildFollowUpQuestions(
                    plan,
                    context
                ),

            disclaimer:
                "RO’Lyfe provides informational decision support. Data, incentives, financing terms, property assumptions, and program eligibility should be independently verified before making financial, real-estate, relocation, or business decisions.",

            instructions: buildInstructions(),

            generatedAt: now()
        };

        state.response = response;

        emit(
            "responseBuilt",
            clone(response)
        );

        emitStateChanged("response_built");

        return clone(response);
    }

    /* ============================================================
       ANALYZE
       ============================================================ */

    function analyze(question, options) {
        options = options || {};

        const q = text(question).trim();

        state.status = "analyzing";

        state.lastQuestion = q;

        state.metadata.analysisCount += 1;

        if (options.location) {
            setLocation(options.location);
        }

        if (options.preferences) {
            setPreferences(options.preferences);
        }

        const plan = buildResponsePlan(q);

        const context = buildAdvisorContext(plan);

        const response = generateLocalResponse(
            q,
            plan,
            context
        );

        state.status = "ready";

        state.metadata.updatedAt = now();

        persist();

        emitStateChanged("analysis_complete");

        return clone(response);
    }

    /* ============================================================
       ASK
       ============================================================ */

    function ask(question, options) {
        options = options || {};

        const q = text(question).trim();

        if (!q) {
            return generateLocalResponse(
                "",
                state.plan,
                state.context
            );
        }

        state.metadata.questionCount += 1;

        const response = analyze(
            q,
            options
        );

        addHistory({
            question: q,

            response: clone(response),

            intent: state.lastIntent,

            mode: state.lastMode,

            location: clone(state.location),

            timestamp: now()
        });

        return response;
    }

    /* ============================================================
       ANSWER ALIAS
       ============================================================ */

    function answer(question, options) {
        return ask(question, options);
    }

    /* ============================================================
       SPECIALIZED ANALYSIS
       ============================================================ */

    function analyzeRelocation(options) {
        options = options || {};

        return analyze(
            options.question ||
            "Analyze this location for relocation.",
            {
                location:
                    options.location ||
                    state.location,

                preferences:
                    options.preferences ||
                    state.preferences
            }
        );
    }

    function analyzeComparison(options) {
        options = options || {};

        return analyze(
            options.question ||
            "Compare these locations.",
            {
                location:
                    options.location ||
                    state.location,

                preferences:
                    options.preferences ||
                    state.preferences
            }
        );
    }

    function analyzeProperty(options) {
        options = options || {};

        if (options.property) {
            callModule(
                "ROlyfePropertyAnalysis",
                "setProperty",
                options.property
            );
        }

        return analyze(
            options.question ||
            "Analyze this property in its location context.",
            {
                location:
                    options.location ||
                    state.location,

                preferences:
                    options.preferences ||
                    state.preferences
            }
        );
    }

    function analyzeBusiness(options) {
        options = options || {};

        return analyze(
            options.question ||
            "Analyze the business opportunity in this location.",
            {
                location:
                    options.location ||
                    state.location,

                preferences:
                    options.preferences ||
                    state.preferences
            }
        );
    }

    function analyzeRisk(options) {
        options = options || {};

        return analyze(
            options.question ||
            "Analyze the location risk profile.",
            {
                location:
                    options.location ||
                    state.location,

                preferences:
                    options.preferences ||
                    state.preferences
            }
        );
    }

    /* ============================================================
       AI CONTEXT
       ============================================================ */

    function buildAIContext() {
        return {
            version: VERSION,

            role:
                "RO’Lyfe Location Intelligence Advisor",

            instructions:
                buildInstructions(),

            location:
                clone(state.location),

            preferences:
                clone(state.preferences),

            plan:
                clone(state.plan),

            context:
                clone(state.context),

            response:
                clone(state.response),

            history:
                clone(state.history),

            generatedAt: now()
        };
    }

    /* ============================================================
       SHARED CONTEXT
       ============================================================ */

    function buildSharedContext() {
        return {
            advisor: buildAIContext(),

            location:
                clone(state.location),

            preferences:
                clone(state.preferences),

            plan:
                clone(state.plan),

            context:
                clone(state.context)
        };
    }

    /* ============================================================
       HISTORY
       ============================================================ */

    function addHistory(entry) {
        state.history = array(state.history);

        state.history.push(
            clone(entry)
        );

        if (
            state.history.length >
            config.maxHistory
        ) {
            state.history =
                state.history.slice(
                    -config.maxHistory
                );
        }

        persist();

        emit(
            "historyChanged",
            clone(state.history)
        );

        emitStateChanged("history_changed");
    }

    function getHistory() {
        return clone(state.history);
    }

    function clearHistory() {
        state.history = [];

        persist();

        emit(
            "historyChanged",
            []
        );

        emitStateChanged("history_cleared");

        return true;
    }

    /* ============================================================
       CONFIGURATION
       ============================================================ */

    function configure(options) {
        options = options || {};

        config = Object.assign(
            {},
            config,
            options
        );

        state.config = clone(config);

        state.metadata.updatedAt = now();

        persist();

        emit(
            "configured",
            clone(config)
        );

        emitStateChanged("configured");

        return clone(config);
    }

    function getConfig() {
        return clone(config);
    }

    /* ============================================================
       STATUS
       ============================================================ */

    function getState() {
        return clone(state);
    }

    function getStatus() {
        return {
            version: VERSION,

            status: state.status,

            initialized: state.initialized,

            location: clone(state.location),

            intent: state.lastIntent,

            mode: state.lastMode,

            domains:
                state.plan &&
                state.plan.domains
                    ? state.plan.domains.slice()
                    : [],

            historyCount:
                array(state.history).length,

            analysisCount:
                number(
                    state.metadata.analysisCount,
                    0
                ),

            questionCount:
                number(
                    state.metadata.questionCount,
                    0
                ),

            updatedAt:
                state.metadata.updatedAt
        };
    }

    function getResult() {
        return clone(
            state.response ||
            state.context ||
            null
        );
    }

    function getPlan() {
        return clone(state.plan);
    }

    function getContext() {
        return clone(state.context);
    }

    function getResponse() {
        return clone(state.response);
    }

    /* ============================================================
       RESET
       ============================================================ */

    function reset(options) {
        options = options || {};

        const preserveLocation =
            options.preserveLocation !== false;

        const preservePreferences =
            options.preservePreferences !== false;

        const preservedLocation =
            preserveLocation
                ? clone(state.location)
                : null;

        const preservedPreferences =
            preservePreferences
                ? clone(state.preferences)
                : {};

        state = createInitialState();

        state.location =
            preservedLocation;

        state.preferences =
            preservedPreferences;

        state.metadata.updatedAt = now();

        if (options.clearPersistence) {
            clearPersistence();
        } else {
            persist();
        }

        emit(
            "reset",
            getState()
        );

        emitStateChanged("reset");

        return getState();
    }

    /* ============================================================
       SUBSCRIBE
       ============================================================ */

    function subscribe(
        eventName,
        handler
    ) {
        /*
         * Supports:
         *
         * subscribe(handler)
         *
         * subscribe("eventName", handler)
         */

        if (
            typeof eventName === "function"
        ) {
            handler = eventName;

            eventName = "stateChanged";
        }

        if (
            typeof handler !== "function"
        ) {
            return function () {};
        }

        if (
            !listeners[eventName]
        ) {
            listeners[eventName] = [];
        }

        listeners[eventName].push(
            handler
        );

        return function unsubscribe() {
            const list =
                listeners[eventName];

            if (!list) {
                return;
            }

            const index =
                list.indexOf(handler);

            if (index !== -1) {
                list.splice(
                    index,
                    1
                );
            }
        };
    }

    /* ============================================================
       SERIALIZATION
       ============================================================ */

    function serialize() {
        return JSON.stringify(
            {
                version: VERSION,

                state: clone(state),

                config: clone(config)
            },
            null,
            2
        );
    }

    /* ============================================================
       INITIALIZATION
       ============================================================ */

    function initialize(options) {
        /*
         * IMPORTANT v1.1.1 FIX
         *
         * Previous flow:
         *
         * initialize()
         *    ↓
         * configure()
         *    ↓
         * persist()
         *    ↓
         * restore()
         *
         * This could overwrite the previously saved state
         * before restore() had a chance to read it.
         *
         * Correct flow:
         *
         * initialize()
         *    ↓
         * restore()
         *    ↓
         * apply explicit options
         *    ↓
         * persist()
         *
         * localStorage is specifically designed to persist
         * data across page loads/browser sessions, so startup
         * must never destroy the saved advisor state before
         * restoration occurs.
         */

        options = options || {};

        const requestedConfig =
            clone(options);

        /*
         * STEP 1
         * Restore persisted state FIRST.
         */
        if (config.persist) {
            restore();
        }

        /*
         * STEP 2
         * Apply explicit initialization options AFTER
         * persisted state has been restored.
         *
         * This lets a caller intentionally override saved
         * configuration without destroying saved state first.
         */
        if (
            Object.keys(
                requestedConfig
            ).length
        ) {
            config = Object.assign(
                {},
                config,
                requestedConfig
            );

            state.config =
                clone(config);
        }

        /*
         * STEP 3
         * Restore state metadata safely.
         */
        state.metadata =
            Object.assign(
                {},
                createInitialState().metadata,
                state.metadata || {}
            );

        state.metadata.version =
            VERSION;

        state.metadata.createdAt =
            state.metadata.createdAt ||
            now();

        state.metadata.updatedAt =
            now();

        state.metadata.lastInitializedAt =
            now();

        /*
         * STEP 4
         * Mark advisor ready.
         */
        state.status =
            "initialized";

        state.initialized =
            true;

        /*
         * STEP 5
         * Reconnect restored location to
         * location-aware modules.
         */
        if (state.location) {
            callModule(
                "ROlyfeLocationAnalysis",
                "setLocation",
                state.location
            );

            callModule(
                "ROlyfeHousing",
                "setLocation",
                state.location
            );

            callModule(
                "ROlyfeBusiness",
                "setLocation",
                state.location
            );

            callModule(
                "ROlyfeIncentives",
                "setLocation",
                state.location
            );
        }

        /*
         * STEP 6
         * Reconnect restored preferences.
         */
        if (
            state.preferences &&
            Object.keys(
                state.preferences
            ).length
        ) {
            callModule(
                "ROlyfeLocationAnalysis",
                "setPreferences",
                state.preferences
            );

            callModule(
                "ROlyfeHousing",
                "setPreferences",
                state.preferences
            );

            callModule(
                "ROlyfeBusiness",
                "setPreferences",
                state.preferences
            );

            callModule(
                "ROlyfeIncentives",
                "setPreferences",
                state.preferences
            );
        }

        /*
         * STEP 7
         * Persist only AFTER restore + configuration
         * + module synchronization are complete.
         */
        persist();

        emit(
            "initialized",
            {
                version: VERSION,

                restored:
                    Boolean(
                        state.location ||
                        (
                            state.history &&
                            state.history.length
                        )
                    )
            }
        );

        emitStateChanged(
            "initialized"
        );

        return getStatus();
    }

    /* ============================================================
       PUBLIC API
       ============================================================ */

    const API = {
        VERSION: VERSION,

        version: VERSION,

        initialize: initialize,

        configure: configure,

        getConfig: getConfig,

        setLocation: setLocation,

        getLocation: getLocation,

        setPreferences: setPreferences,

        getPreferences: getPreferences,

        classifyQuestion: classifyQuestion,

        determineMode: determineMode,

        getDomainsForIntent:
            getDomainsForIntent,

        buildResponsePlan:
            buildResponsePlan,

        analyze: analyze,

        ask: ask,

        answer: answer,

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

        buildAIContext:
            buildAIContext,

        buildSharedContext:
            buildSharedContext,

        getState: getState,

        getStatus: getStatus,

        getResult: getResult,

        getPlan: getPlan,

        getContext: getContext,

        getResponse: getResponse,

        getHistory: getHistory,

        clearHistory: clearHistory,

        reset: reset,

        persist: persist,

        restore: restore,

        clearPersistence:
            clearPersistence,

        subscribe: subscribe,

        serialize: serialize
    };

    /* ============================================================
       GLOBAL EXPORTS
       ============================================================ */

    window.ROlyfeAdvisor = API;

    window.ROLYFE_ADVISOR = API;

    /* ============================================================
       AUTO INITIALIZATION
       ============================================================ */

    if (
        DEFAULT_CONFIG.autoInitialize
    ) {
        try {
            initialize();
        } catch (error) {
            console.error(
                "[RO’Lyfe Advisor] Initialization failed:",
                error
            );
        }
    }

})(window);
