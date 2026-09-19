/*
============================================================
RO’LYFE RELOCATION INTELLIGENCE
AI ADVISOR / DECISION PLANNING ENGINE
============================================================

File:
    /modules/ai/advisor.js

Version:
    1.1.0

Purpose:
    Planning, intent classification, domain selection,
    contextual interpretation, local response generation,
    and decision-support orchestration for RO’Lyfe AI.

Architecture:

    USER
      ↓
    AI.JS
      ↓
    ADVISOR
      ↓
    LOCATION ANALYSIS
      ↓
    DOMAIN INTELLIGENCE
      ↓
    STRUCTURED CONTEXT
      ↓
    AI.JS RESPONSE

IMPORTANT:

    AI.JS is the master AI orchestration layer.

    ADVISOR does NOT recursively call AI.JS.

    ADVISOR:
      - classifies questions
      - determines intent
      - determines analysis mode
      - selects intelligence domains
      - gathers structured context
      - identifies signals
      - identifies gaps
      - identifies tradeoffs
      - creates actions
      - creates local decision-support responses
      - prepares AI-ready context

    AI.JS:
      - owns AI request orchestration
      - owns remote endpoint communication
      - owns conversation management
      - owns final AI request/response pipeline

SECURITY:

    No production AI/API secret belongs in this browser file.

============================================================
*/

(function (global) {
    "use strict";

    const VERSION = "1.1.0";
    const MODULE_NAME = "ROlyfeAdvisor";

    const DEFAULT_CONFIG = {
        autoInitialize: true,

        persist: true,

        storageKey:
            "rolyfe_advisor_v1",

        maxDomains:
            12,

        maxQuestions:
            8,

        maxActions:
            10,

        maxSignals:
            20,

        maxGaps:
            15,

        maxTradeoffs:
            15,

        defaultIntent:
            "general",

        defaultMode:
            "overview",

        includeSources:
            true,

        includeGaps:
            true,

        includeTradeoffs:
            true,

        includeActions:
            true,

        localFallback:
            true
    };

    let config =
        Object.assign(
            {},
            DEFAULT_CONFIG
        );

    let state =
        createInitialState();

    const listeners = [];

    /* ======================================================
       CONSTANTS
    ====================================================== */

    const INTENTS = {
        RELOCATION:
            "relocation",

        COMPARE:
            "compare",

        CLIMATE:
            "climate",

        WEATHER:
            "weather",

        RISK:
            "risk",

        HOUSING:
            "housing",

        COST:
            "cost",

        INCENTIVES:
            "incentives",

        BUSINESS:
            "business",

        PROPERTY:
            "property",

        OPPORTUNITY:
            "opportunity",

        GENERAL:
            "general"
    };

    const MODES = {
        OVERVIEW:
            "overview",

        DEEP_DIVE:
            "deep_dive",

        COMPARISON:
            "comparison",

        NEXT_STEPS:
            "next_steps",

        PROPERTY_CONTEXT:
            "property_context",

        BUSINESS_CONTEXT:
            "business_context"
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
        "property",
        "opportunity"
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
            "weather",
            "climate"
        ],

        housing: [
            "location",
            "housing",
            "costOfLiving",
            "risk"
        ],

        cost: [
            "location",
            "costOfLiving",
            "housing",
            "business"
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
            "opportunity",
            "costOfLiving"
        ],

        property: [
            "location",
            "property",
            "housing",
            "risk",
            "climate",
            "weather",
            "incentives",
            "business",
            "opportunity"
        ],

        opportunity: [
            "location",
            "opportunity",
            "business",
            "property",
            "incentives",
            "housing"
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
            "property",
            "opportunity"
        ]
    };

    const KEYWORDS = {
        relocation: [
            "move",
            "relocate",
            "relocation",
            "live",
            "living",
            "moving",
            "where should",
            "where can i live"
        ],

        compare: [
            "compare",
            "versus",
            "vs",
            "difference",
            "which location",
            "between"
        ],

        climate: [
            "climate",
            "hot",
            "cold",
            "snow",
            "rain",
            "humidity",
            "temperature",
            "season"
        ],

        weather: [
            "weather",
            "forecast",
            "today",
            "tonight",
            "tomorrow",
            "storm",
            "temperature now"
        ],

        risk: [
            "risk",
            "hazard",
            "flood",
            "tornado",
            "hurricane",
            "wildfire",
            "earthquake",
            "drought",
            "disaster",
            "insurance risk"
        ],

        housing: [
            "house",
            "home",
            "housing",
            "rent",
            "rental",
            "mortgage",
            "home price",
            "home prices",
            "property price",
            "afford"
        ],

        cost: [
            "cost",
            "cost of living",
            "tax",
            "taxes",
            "expense",
            "expenses",
            "utilities",
            "budget"
        ],

        incentives: [
            "grant",
            "grants",
            "incentive",
            "incentives",
            "tax credit",
            "abatement",
            "rebate",
            "program",
            "funding program"
        ],

        business: [
            "business",
            "company",
            "startup",
            "entrepreneur",
            "industry",
            "job",
            "jobs",
            "workforce",
            "employer"
        ],

        property: [
            "property",
            "real estate",
            "investment property",
            "deal",
            "arv",
            "rehab",
            "flip",
            "cash flow",
            "cap rate",
            "rental property"
        ],

        opportunity: [
            "opportunity",
            "growth",
            "development",
            "investment",
            "potential",
            "market",
            "build"
        ]
    };

    const RESPONSE_SECTIONS = {
        relocation: [
            "location",
            "housing",
            "climate",
            "risk",
            "opportunity",
            "nextSteps"
        ],

        compare: [
            "comparison",
            "tradeoffs",
            "gaps",
            "nextSteps"
        ],

        climate: [
            "climate",
            "weather",
            "risk",
            "tradeoffs",
            "nextSteps"
        ],

        weather: [
            "weather",
            "risk",
            "nextSteps"
        ],

        risk: [
            "risk",
            "weather",
            "tradeoffs",
            "nextSteps"
        ],

        housing: [
            "housing",
            "costOfLiving",
            "risk",
            "nextSteps"
        ],

        cost: [
            "costOfLiving",
            "housing",
            "business",
            "nextSteps"
        ],

        incentives: [
            "incentives",
            "business",
            "gaps",
            "nextSteps"
        ],

        business: [
            "business",
            "incentives",
            "opportunity",
            "nextSteps"
        ],

        property: [
            "property",
            "housing",
            "risk",
            "business",
            "opportunity",
            "nextSteps"
        ],

        opportunity: [
            "opportunity",
            "business",
            "property",
            "incentives",
            "nextSteps"
        ],

        general: [
            "location",
            "signals",
            "tradeoffs",
            "gaps",
            "nextSteps"
        ]
    };

    /* ======================================================
       INITIAL STATE
    ====================================================== */

    function createInitialState() {
        return {
            status:
                "idle",

            initialized:
                false,

            config:
                clone(
                    config
                ),

            location:
                null,

            preferences:
                {},

            lastQuestion:
                "",

            lastIntent:
                "general",

            lastMode:
                "overview",

            plan: {
                intent:
                    "general",

                mode:
                    "overview",

                domains:
                    [],

                sections:
                    [],

                question:
                    "",

                confidence:
                    0
            },

            context: {
                location:
                    null,

                preferences:
                    {},

                plan:
                    null,

                signals:
                    [],

                findings:
                    [],

                tradeoffs:
                    [],

                gaps:
                    [],

                actions:
                    [],

                sources:
                    [],

                domains:
                    {},

                summary:
                    "",

                generatedAt:
                    null
            },

            response:
                null,

            history:
                [],

            metadata: {
                version:
                    VERSION,

                createdAt:
                    null,

                updatedAt:
                    null,

                requestCount:
                    0
            }
        };
    }

    /* ======================================================
       HELPERS
    ====================================================== */

    function now() {
        return new Date().toISOString();
    }

    function safeString(
        value,
        fallback = ""
    ) {
        if (
            value === null ||
            value === undefined
        ) {
            return fallback;
        }

        return String(
            value
        ).trim();
    }

    function normalizeText(
        value
    ) {
        return safeString(
            value
        )
            .toLowerCase()
            .replace(
                /\s+/g,
                " "
            );
    }

    function number(
        value,
        fallback = 0
    ) {
        const n =
            Number(
                value
            );

        return Number.isFinite(
            n
        )
            ? n
            : fallback;
    }

    function clamp(
        value,
        min = 0,
        max = 100
    ) {
        return Math.min(
            max,
            Math.max(
                min,
                number(
                    value,
                    min
                )
            )
        );
    }

    function array(
        value
    ) {
        if (
            Array.isArray(
                value
            )
        ) {
            return value;
        }

        if (
            value === null ||
            value === undefined
        ) {
            return [];
        }

        return [
            value
        ];
    }

    function unique(
        values
    ) {
        return [
            ...new Set(
                array(
                    values
                ).filter(
                    Boolean
                )
            )
        ];
    }

    function limit(
        values,
        max
    ) {
        return array(
            values
        ).slice(
            0,
            max
        );
    }

    function clone(
        value
    ) {
        try {
            return JSON.parse(
                JSON.stringify(
                    value
                )
            );
        } catch (
            error
        ) {
            return value;
        }
    }

    function emit(
        eventName,
        detail = {}
    ) {
        const event = {
            event:
                eventName,

            module:
                MODULE_NAME,

            version:
                VERSION,

            timestamp:
                now(),

            detail:
                clone(
                    detail
                )
        };

        listeners
            .slice()
            .forEach(
                listener => {
                    try {
                        listener(
                            event
                        );
                    } catch (
                        error
                    ) {
                        console.warn(
                            `[${MODULE_NAME}] Listener error`,
                            error
                        );
                    }
                }
            );

        if (
            typeof window !==
                "undefined" &&
            typeof window.dispatchEvent ===
                "function" &&
            typeof CustomEvent !==
                "undefined"
        ) {
            try {
                window.dispatchEvent(
                    new CustomEvent(
                        `rolyfe:advisor:${eventName}`,
                        {
                            detail:
                                event
                        }
                    )
                );
            } catch (
                error
            ) {
                /* Browser event is optional. */
            }
        }

        if (
            eventName !==
            "stateChanged"
        ) {
            emitStateChanged(
                eventName,
                detail
            );
        }
    }

    function emitStateChanged(
        sourceEvent,
        detail = {}
    ) {
        const event = {
            event:
                "stateChanged",

            module:
                MODULE_NAME,

            version:
                VERSION,

            timestamp:
                now(),

            detail: {
                sourceEvent,

                status:
                    state.status,

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

                ...clone(
                    detail
                )
            }
        };

        listeners
            .slice()
            .forEach(
                listener => {
                    try {
                        if (
                            listener.__rolyfeStateListener
                        ) {
                            listener(
                                event
                            );
                        }
                    } catch (
                        error
                    ) {
                        console.warn(
                            `[${MODULE_NAME}] State listener error`,
                            error
                        );
                    }
                }
            );

        if (
            typeof window !==
                "undefined" &&
            typeof window.dispatchEvent ===
                "function" &&
            typeof CustomEvent !==
                "undefined"
        ) {
            try {
                window.dispatchEvent(
                    new CustomEvent(
                        "rolyfe:advisor:stateChanged",
                        {
                            detail:
                                event
                        }
                    )
                );
            } catch (
                error
            ) {
                /* Optional browser event. */
            }
        }
    }

    /* ======================================================
       PERSISTENCE
    ====================================================== */

    function persist() {
        if (
            !config.persist ||
            typeof localStorage ===
                "undefined"
        ) {
            return false;
        }

        try {
            localStorage.setItem(
                config.storageKey,
                JSON.stringify(
                    {
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

                        plan:
                            state.plan,

                        context:
                            state.context,

                        response:
                            state.response,

                        history:
                            state.history,

                        metadata:
                            state.metadata
                    }
                )
            );

            return true;
        } catch (
            error
        ) {
            console.warn(
                `[${MODULE_NAME}] Persistence failed`,
                error
            );

            return false;
        }
    }

    function restore() {
        if (
            !config.persist ||
            typeof localStorage ===
                "undefined"
        ) {
            return false;
        }

        try {
            const raw =
                localStorage.getItem(
                    config.storageKey
                );

            if (
                !raw
            ) {
                return false;
            }

            const saved =
                JSON.parse(
                    raw
                );

            state =
                Object.assign(
                    createInitialState(),
                    state,
                    saved
                );

            state.config =
                clone(
                    config
                );

            emit(
                "restored"
            );

            return true;
        } catch (
            error
        ) {
            console.warn(
                `[${MODULE_NAME}] Restore failed`,
                error
            );

            return false;
        }
    }

    function clearPersistence() {
        if (
            typeof localStorage ===
                "undefined"
        ) {
            return false;
        }

        try {
            localStorage.removeItem(
                config.storageKey
            );

            return true;
        } catch (
            error
        ) {
            return false;
        }
    }

    /* ======================================================
       LOCATION
    ====================================================== */

    function setLocation(
        location = {}
    ) {
        state.location =
            clone(
                location
            );

        callModule(
            "ROlyfeLocationAnalysis",
            "setLocation",
            location
        );

        state.metadata.updatedAt =
            now();

        emit(
            "locationUpdated",
            {
                location:
                    clone(
                        location
                    )
            }
        );

        persist();

        return clone(
            state.location
        );
    }

    function getLocation() {
        if (
            state.location
        ) {
            return clone(
                state.location
            );
        }

        return clone(
            callModule(
                "ROlyfeLocationAnalysis",
                "getLocation"
            )
        );
    }

    /* ======================================================
       PREFERENCES
    ====================================================== */

    function setPreferences(
        preferences = {}
    ) {
        state.preferences =
            Object.assign(
                {},
                state.preferences,
                clone(
                    preferences
                )
            );

        callModule(
            "ROlyfeLocationAnalysis",
            "setPreferences",
            preferences
        );

        state.metadata.updatedAt =
            now();

        emit(
            "preferencesUpdated",
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

    /* ======================================================
       MODULE ACCESS
    ====================================================== */

    function getModule(
        name
    ) {
        try {
            return (
                global[name] ||
                null
            );
        } catch (
            error
        ) {
            return null;
        }
    }

    function callModule(
        moduleName,
        method,
        ...args
    ) {
        const module =
            getModule(
                moduleName
            );

        if (
            !module ||
            typeof module[
                method
            ] !==
                "function"
        ) {
            return null;
        }

        try {
            return module[
                method
            ](
                ...args
            );
        } catch (
            error
        ) {
            console.warn(
                `[${MODULE_NAME}] ${moduleName}.${method} failed`,
                error
            );

            return null;
        }
    }

    /* ======================================================
       QUESTION CLASSIFICATION
    ====================================================== */

    function scoreIntent(
        question,
        intent
    ) {
        const q =
            normalizeText(
                question
            );

        const keywords =
            KEYWORDS[
                intent
            ] ||
            [];

        let score =
            0;

        keywords.forEach(
            keyword => {
                if (
                    q.includes(
                        keyword
                    )
                ) {
                    score +=
                        keyword.length >=
                        8
                            ? 3
                            : 2;
                }
            }
        );

        return score;
    }

    function classifyQuestion(
        question = ""
    ) {
        const q =
            normalizeText(
                question
            );

        if (
            !q
        ) {
            return {
                intent:
                    config.defaultIntent,

                confidence:
                    0,

                matches:
                    []
            };
        }

        const scored =
            Object.keys(
                KEYWORDS
            )
                .map(
                    intent => ({
                        intent,

                        score:
                            scoreIntent(
                                q,
                                intent
                            )
                    })
                )
                .filter(
                    item =>
                        item.score >
                        0
                )
                .sort(
                    (
                        a,
                        b
                    ) =>
                        b.score -
                        a.score
                );

        const top =
            scored[0];

        if (
            !top
        ) {
            return {
                intent:
                    config.defaultIntent,

                confidence:
                    0,

                matches:
                    []
            };
        }

        const second =
            scored[1];

        const confidence =
            second
                ? clamp(
                    (
                        top.score /
                        (
                            top.score +
                            second.score
                        )
                    ) *
                    100
                )
                : clamp(
                    top.score *
                    15
                );

        return {
            intent:
                top.intent,

            confidence:
                Math.round(
                    confidence
                ),

            matches:
                scored
        };
    }

    /* ======================================================
       MODE
    ====================================================== */

    function determineMode(
        question,
        intent
    ) {
        const q =
            normalizeText(
                question
            );

        if (
            intent ===
            INTENTS.COMPARE ||
            /compare|versus|\bvs\b|between/i.test(
                q
            )
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
            /next|what should i do|what do i need|steps|action/i
                .test(
                    q
                )
        ) {
            return MODES.NEXT_STEPS;
        }

        if (
            /deep|detailed|detail|everything|full analysis/i
                .test(
                    q
                )
        ) {
            return MODES.DEEP_DIVE;
        }

        return MODES.OVERVIEW;
    }

    /* ======================================================
       DOMAIN PLANNING
    ====================================================== */

    function getDomainsForIntent(
        intent,
        options = {}
    ) {
        let domains =
            INTENT_DOMAINS[
                intent
            ] ||
            INTENT_DOMAINS.general;

        if (
            options.includeDomains
        ) {
            domains =
                domains.concat(
                    array(
                        options.includeDomains
                    )
                );
        }

        if (
            options.excludeDomains
        ) {
            const excluded =
                new Set(
                    array(
                        options.excludeDomains
                    )
                );

            domains =
                domains.filter(
                    domain =>
                        !excluded.has(
                            domain
                        )
                );
        }

        return limit(
            unique(
                domains
            ),
            config.maxDomains
        );
    }

    function buildResponsePlan(
        question = "",
        options = {}
    ) {
        const classification =
            classifyQuestion(
                question
            );

        const intent =
            options.intent ||
            classification.intent ||
            config.defaultIntent;

        const mode =
            options.mode ||
            determineMode(
                question,
                intent
            );

        const domains =
            getDomainsForIntent(
                intent,
                options
            );

        const sections =
            RESPONSE_SECTIONS[
                intent
            ] ||
            RESPONSE_SECTIONS.general;

        const plan = {
            intent,

            mode,

            domains:
                limit(
                    domains,
                    config.maxDomains
                ),

            sections:
                unique(
                    sections
                ),

            question:
                safeString(
                    question
                ),

            confidence:
                classification.confidence
        };

        state.plan =
            clone(
                plan
            );

        state.lastIntent =
            intent;

        state.lastMode =
            mode;

        state.lastQuestion =
            safeString(
                question
            );

        emit(
            "planCreated",
            {
                plan:
                    clone(
                        plan
                    )
            }
        );

        return clone(
            plan
        );
    }

    /* ======================================================
       PROFILE ACCESS
    ====================================================== */

    function safelyGetProfile(
        module,
        preferredMethods = []
    ) {
        if (
            !module
        ) {
            return null;
        }

        for (
            const method of
                preferredMethods
        ) {
            if (
                typeof module[
                    method
                ] ===
                    "function"
            ) {
                try {
                    const result =
                        module[
                            method
                        ]();

                    if (
                        result !==
                        null &&
                        result !==
                        undefined
                    ) {
                        return result;
                    }
                } catch (
                    error
                ) {
                    /* Continue to next getter. */
                }
            }
        }

        return null;
    }

    function collectDomainContext(
        plan,
        options = {}
    ) {
        const domains =
            {};

        const moduleMap = {
            location:
                [
                    "ROlyfeLocationAnalysis",
                    [
                        "getResult",
                        "getAnalysis",
                        "getState"
                    ]
                ],

            climate:
                [
                    "ROlyfeClimate",
                    [
                        "getProfile",
                        "getResult",
                        "getAnalysis",
                        "getState"
                    ]
                ],

            weather:
                [
                    "ROlyfeWeather",
                    [
                        "getProfile",
                        "getResult",
                        "getAnalysis",
                        "getState"
                    ]
                ],

            risk:
                [
                    "ROlyfeRisk",
                    [
                        "getProfile",
                        "getResult",
                        "getAnalysis",
                        "getState"
                    ]
                ],

            housing:
                [
                    "ROlyfeHousing",
                    [
                        "getProfile",
                        "getResult",
                        "getAnalysis",
                        "getState"
                    ]
                ],

            costOfLiving:
                [
                    "ROlyfeCostOfLiving",
                    [
                        "getProfile",
                        "getResult",
                        "getAnalysis",
                        "getState"
                    ]
                ],

            incentives:
                [
                    "ROlyfeIncentives",
                    [
                        "getProfile",
                        "getResult",
                        "getAnalysis",
                        "getState"
                    ]
                ],

            business:
                [
                    "ROlyfeBusiness",
                    [
                        "getProfile",
                        "getResult",
                        "getAnalysis",
                        "getState"
                    ]
                ],

            property:
                [
                    "ROlyfePropertyAnalysis",
                    [
                        "getAnalysis",
                        "getResult",
                        "getState"
                    ]
                ],

            opportunity:
                [
                    "ROlyfeOpportunityEngine",
                    [
                        "getAnalysis",
                        "getResult",
                        "getState"
                    ]
                ]
        };

        plan.domains.forEach(
            domain => {
                const definition =
                    moduleMap[
                        domain
                    ];

                if (
                    !definition
                ) {
                    domains[
                        domain
                    ] = null;

                    return;
                }

                const module =
                    getModule(
                        definition[0]
                    );

                domains[
                    domain
                ] =
                    safelyGetProfile(
                        module,
                        definition[1]
                    );
            }
        );

        if (
            options.core
        ) {
            domains.core =
                clone(
                    options.core
                );
        }

        return domains;
    }

    /* ======================================================
       ARRAY EXTRACTION
    ====================================================== */

    function extractArray(
        source,
        keys
    ) {
        if (
            !source
        ) {
            return [];
        }

        for (
            const key of
                array(
                    keys
                )
        ) {
            if (
                Array.isArray(
                    source[
                        key
                    ]
                )
            ) {
                return source[
                    key
                ];
            }
        }

        return [];
    }

    /* ======================================================
       SIGNALS / GAPS / TRADEOFFS
    ====================================================== */

    function collectSignals(
        domains
    ) {
        const signals = [];

        Object.keys(
            domains
        ).forEach(
            domain => {
                const data =
                    domains[
                        domain
                    ];

                if (
                    !data
                ) {
                    return;
                }

                extractArray(
                    data,
                    [
                        "signals",
                        "findings"
                    ]
                ).forEach(
                    signal => {
                        if (
                            typeof signal ===
                            "string"
                        ) {
                            signals.push(
                                {
                                    domain,

                                    message:
                                        signal
                                }
                            );
                        } else {
                            signals.push(
                                Object.assign(
                                    {
                                        domain
                                    },
                                    signal
                                )
                            );
                        }
                    }
                );
            }
        );

        return limit(
            signals,
            config.maxSignals
        );
    }

    function collectGaps(
        domains
    ) {
        const gaps = [];

        Object.keys(
            domains
        ).forEach(
            domain => {
                const data =
                    domains[
                        domain
                    ];

                if (
                    !data
                ) {
                    return;
                }

                extractArray(
                    data,
                    [
                        "gaps",
                        "dataGaps"
                    ]
                ).forEach(
                    gap => {
                        if (
                            typeof gap ===
                            "string"
                        ) {
                            gaps.push(
                                {
                                    domain,

                                    message:
                                        gap
                                }
                            );
                        } else {
                            gaps.push(
                                Object.assign(
                                    {
                                        domain
                                    },
                                    gap
                                )
                            );
                        }
                    }
                );
            }
        );

        return limit(
            gaps,
            config.maxGaps
        );
    }

    function collectTradeoffs(
        domains
    ) {
        const tradeoffs = [];

        Object.keys(
            domains
        ).forEach(
            domain => {
                const data =
                    domains[
                        domain
                    ];

                if (
                    !data
                ) {
                    return;
                }

                extractArray(
                    data,
                    [
                        "tradeoffs",
                        "tradeOffs"
                    ]
                ).forEach(
                    tradeoff => {
                        if (
                            typeof tradeoff ===
                            "string"
                        ) {
                            tradeoffs.push(
                                {
                                    domain,

                                    message:
                                        tradeoff
                                }
                            );
                        } else {
                            tradeoffs.push(
                                Object.assign(
                                    {
                                        domain
                                    },
                                    tradeoff
                                )
                            );
                        }
                    }
                );
            }
        );

        return limit(
            tradeoffs,
            config.maxTradeoffs
        );
    }

    /* ======================================================
       ACTIONS
    ====================================================== */

    function buildActions(
        domains,
        gaps = [],
        options = {}
    ) {
        const actions = [];

        Object.keys(
            domains
        ).forEach(
            domain => {
                const data =
                    domains[
                        domain
                    ];

                if (
                    !data
                ) {
                    return;
                }

                extractArray(
                    data,
                    [
                        "actions",
                        "nextActions"
                    ]
                ).forEach(
                    action => {
                        if (
                            typeof action ===
                            "string"
                        ) {
                            actions.push(
                                {
                                    domain,

                                    action
                                }
                            );
                        } else {
                            actions.push(
                                Object.assign(
                                    {
                                        domain
                                    },
                                    action
                                )
                            );
                        }
                    }
                );
            }
        );

        if (
            options.includeGapActions !==
            false
        ) {
            gaps.forEach(
                gap => {
                    const message =
                        safeString(
                            gap.message ||
                            gap.action
                        );

                    if (
                        message
                    ) {
                        actions.push(
                            {
                                type:
                                    "data-gap",

                                domain:
                                    gap.domain,

                                priority:
                                    gap.severity ||
                                    "medium",

                                action:
                                    `Resolve data gap: ${message}`
                            }
                        );
                    }
                }
            );
        }

        return limit(
            actions,
            config.maxActions
        );
    }

    /* ======================================================
       SOURCES
    ====================================================== */

    function collectSources(
        domains
    ) {
        const sources = [];

        Object.keys(
            domains
        ).forEach(
            domain => {
                const data =
                    domains[
                        domain
                    ];

                if (
                    !data
                ) {
                    return;
                }

                extractArray(
                    data,
                    [
                        "sources",
                        "source",
                        "references"
                    ]
                ).forEach(
                    source => {
                        sources.push(
                            typeof source ===
                            "string"
                                ? {
                                    domain,
                                    source
                                }
                                : Object.assign(
                                    {
                                        domain
                                    },
                                    source
                                )
                        );
                    }
                );
            }
        );

        return uniqueObjects(
            sources
        );
    }

    function uniqueObjects(
        values
    ) {
        const seen =
            new Set();

        const output =
            [];

        array(
            values
        ).forEach(
            value => {
                let key;

                try {
                    key =
                        JSON.stringify(
                            value
                        );
                } catch (
                    error
                ) {
                    key =
                        String(
                            value
                        );
                }

                if (
                    seen.has(
                        key
                    )
                ) {
                    return;
                }

                seen.add(
                    key
                );

                output.push(
                    value
                );
            }
        );

        return output;
    }

    /* ======================================================
       SUMMARY
    ====================================================== */

    function buildSummary(
        location,
        plan,
        signals,
        tradeoffs,
        gaps,
        actions
    ) {
        const locationLabel =
            formatLocation(
                location
            );

        const parts = [];

        parts.push(
            `RO’Lyfe analyzed ${locationLabel} using the ${plan.intent} decision path.`
        );

        if (
            plan.domains.length
        ) {
            parts.push(
                `Active intelligence layers: ${plan.domains.join(
                    ", "
                )}.`
            );
        }

        if (
            signals.length
        ) {
            parts.push(
                `${signals.length} intelligence signal(s) were identified.`
            );
        }

        if (
            tradeoffs.length
        ) {
            parts.push(
                `${tradeoffs.length} tradeoff(s) should be examined.`
            );
        }

        if (
            gaps.length
        ) {
            parts.push(
                `${gaps.length} information gap(s) remain.`
            );
        }

        if (
            actions.length
        ) {
            parts.push(
                `${actions.length} next action(s) are available.`
            );
        }

        return parts.join(
            " "
        );
    }

    /* ======================================================
       ADVISOR CONTEXT
    ====================================================== */

    function buildAdvisorContext(
        question = "",
        options = {}
    ) {
        const plan =
            options.plan ||
            buildResponsePlan(
                question,
                options
            );

        const domains =
            options.domains ||
            collectDomainContext(
                plan,
                options
            );

        const signals =
            collectSignals(
                domains
            );

        const gaps =
            config.includeGaps
                ? collectGaps(
                    domains
                )
                : [];

        const tradeoffs =
            config.includeTradeoffs
                ? collectTradeoffs(
                    domains
                )
                : [];

        const actions =
            config.includeActions
                ? buildActions(
                    domains,
                    gaps,
                    options
                )
                : [];

        const sources =
            config.includeSources
                ? collectSources(
                    domains
                )
                : [];

        const summary =
            buildSummary(
                state.location,
                plan,
                signals,
                tradeoffs,
                gaps,
                actions
            );

        const context = {
            location:
                clone(
                    state.location
                ),

            preferences:
                clone(
                    state.preferences
                ),

            plan:
                clone(
                    plan
                ),

            domains:
                clone(
                    domains
                ),

            signals:
                clone(
                    signals
                ),

            findings:
                clone(
                    signals
                ),

            tradeoffs:
                clone(
                    tradeoffs
                ),

            gaps:
                clone(
                    gaps
                ),

            actions:
                clone(
                    actions
                ),

            sources:
                clone(
                    sources
                ),

            summary,

            generatedAt:
                now()
        };

        state.context =
            clone(
                context
            );

        state.actions =
            clone(
                actions
            );

        state.metadata.updatedAt =
            now();

        emit(
            "contextBuilt",
            {
                context:
                    clone(
                        context
                    )
            }
        );

        persist();

        return clone(
            context
        );
    }

    /* ======================================================
       INSTRUCTIONS
    ====================================================== */

    function buildInstructions(
        options = {}
    ) {
        return [
            "You are the RO’Lyfe Relocation Intelligence Advisor.",

            "Interpret structured intelligence rather than inventing data.",

            "Use the user's stated priorities.",

            "Do not assume a universal best location.",

            "Distinguish facts, calculated signals, estimates, and missing data.",

            "Distinguish climate from current weather.",

            "Distinguish hazard exposure from active weather events.",

            "Do not treat program matches as guaranteed eligibility or funding.",

            "Explain important tradeoffs.",

            "Identify missing information.",

            "Use the generated actions to identify practical next steps.",

            "For property analysis, do not represent estimated returns as guaranteed.",

            "For business analysis, distinguish current economic data from forecasts.",

            "For housing analysis, distinguish market statistics from individual affordability.",

            "The final decision remains with the user."
        ].join(
            "\n"
        );
    }

    /* ======================================================
       RESPONSE TEMPLATE
    ====================================================== */

    function buildFollowUpQuestions(
        plan,
        context
    ) {
        const questions = [];

        switch (
            plan.intent
        ) {
            case INTENTS.RELOCATION:
                questions.push(
                    "What is your monthly housing budget?",
                    "Which climate conditions matter most to you?",
                    "How important is lower disaster risk?",
                    "Are you prioritizing employment, business, or real estate opportunity?"
                );
                break;

            case INTENTS.HOUSING:
                questions.push(
                    "Are you looking to rent or buy?",
                    "What monthly housing payment fits your budget?",
                    "What property type are you considering?"
                );
                break;

            case INTENTS.BUSINESS:
                questions.push(
                    "What type of business are you building?",
                    "Are you starting, expanding, or relocating?",
                    "How important are grants, loans, or tax incentives?"
                );
                break;

            case INTENTS.PROPERTY:
                questions.push(
                    "What is the purchase price?",
                    "What is your estimated ARV?",
                    "What is the rehab budget?",
                    "What exit strategy are you considering?"
                );
                break;

            case INTENTS.RISK:
                questions.push(
                    "Which hazard concerns you most?",
                    "Are you evaluating the location for living, business, or property?"
                );
                break;

            case INTENTS.COMPARE:
                questions.push(
                    "Which two or more locations should be compared?",
                    "What factors should receive the most weight?"
                );
                break;

            default:
                questions.push(
                    "What decision are you trying to make?",
                    "Which factors matter most to you?"
                );
        }

        return limit(
            questions,
            config.maxQuestions
        );
    }

    function getSectionContent(
        section,
        context
    ) {
        switch (
            section
        ) {
            case "location":
                return context.location;

            case "climate":
                return context.domains.climate;

            case "weather":
                return context.domains.weather;

            case "risk":
                return context.domains.risk;

            case "housing":
                return context.domains.housing;

            case "costOfLiving":
                return context.domains.costOfLiving;

            case "incentives":
                return context.domains.incentives;

            case "business":
                return context.domains.business;

            case "property":
                return context.domains.property;

            case "opportunity":
                return context.domains.opportunity;

            case "comparison":
            case "tradeoffs":
                return context.tradeoffs;

            case "gaps":
                return context.gaps;

            case "nextSteps":
                return context.actions;

            case "signals":
                return context.signals;

            default:
                return null;
        }
    }

    function buildLocalSections(
        plan,
        context
    ) {
        return plan.sections.map(
            section => ({
                id:
                    section,

                title:
                    formatSectionTitle(
                        section
                    ),

                content:
                    clone(
                        getSectionContent(
                            section,
                            context
                        )
                    )
            })
        );
    }

    function formatSectionTitle(
        section
    ) {
        const labels = {
            location:
                "Location",

            climate:
                "Climate",

            weather:
                "Current Weather",

            risk:
                "Risk",

            housing:
                "Housing",

            costOfLiving:
                "Cost of Living",

            incentives:
                "Incentives",

            business:
                "Business",

            property:
                "Property",

            opportunity:
                "Opportunity",

            comparison:
                "Comparison",

            tradeoffs:
                "Tradeoffs",

            gaps:
                "Information Gaps",

            signals:
                "Key Signals",

            nextSteps:
                "Next Steps"
        };

        return (
            labels[
                section
            ] ||
            section
        );
    }

    /* ======================================================
       LOCAL RESPONSE
    ====================================================== */

    function buildLocalDirectAnswer(
        question,
        plan,
        context
    ) {
        const locationLabel =
            formatLocation(
                context.location
            );

        const firstSignal =
            context.signals[0];

        let answer =
            `Based on the available RO’Lyfe intelligence, ${locationLabel} is being analyzed through the ${plan.intent} lens.`;

        if (
            firstSignal &&
            firstSignal.message
        ) {
            answer +=
                ` One notable signal is: ${firstSignal.message}`;
        }

        if (
            context.gaps.length
        ) {
            answer +=
                ` There is still information to verify before making a location decision.`;
        }

        return answer;
    }

    function generateLocalResponse(
        question = "",
        options = {}
    ) {
        const context =
            options.context ||
            buildAdvisorContext(
                question,
                options
            );

        const plan =
            context.plan;

        const followUpQuestions =
            buildFollowUpQuestions(
                plan,
                context
            );

        const directAnswer =
            buildLocalDirectAnswer(
                question,
                plan,
                context
            );

        const response = {
            mode:
                "local",

            title:
                `RO’Lyfe ${formatIntent(
                    plan.intent
                )} Analysis`,

            directAnswer,

            summary:
                context.summary,

            sections:
                buildLocalSections(
                    plan,
                    context
                ),

            signals:
                clone(
                    context.signals
                ),

            tradeoffs:
                clone(
                    context.tradeoffs
                ),

            gaps:
                clone(
                    context.gaps
                ),

            actions:
                clone(
                    context.actions
                ),

            followUpQuestions,

            sources:
                clone(
                    context.sources
                ),

            disclaimer:
                "RO’Lyfe intelligence is decision-support information. Verify current data, eligibility, costs, risks, property facts, and program requirements before acting.",

            text:
                buildPlainTextResponse(
                    directAnswer,
                    context,
                    followUpQuestions
                ),

            context:
                clone(
                    context
                )
        };

        state.response =
            clone(
                response
            );

        emit(
            "responseBuilt",
            {
                response:
                    clone(
                        response
                    )
            }
        );

        persist();

        return clone(
            response
        );
    }

    function buildPlainTextResponse(
        directAnswer,
        context,
        followUpQuestions
    ) {
        const lines = [
            directAnswer,
            "",
            context.summary
        ];

        if (
            context.signals.length
        ) {
            lines.push(
                "",
                "Key signals:"
            );

            context.signals
                .slice(
                    0,
                    6
                )
                .forEach(
                    signal => {
                        const message =
                            safeString(
                                signal.message ||
                                signal.title ||
                                signal.text
                            );

                        if (
                            message
                        ) {
                            lines.push(
                                `• ${message}`
                            );
                        }
                    }
                );
        }

        if (
            context.tradeoffs.length
        ) {
            lines.push(
                "",
                "Tradeoffs:"
            );

            context.tradeoffs
                .slice(
                    0,
                    5
                )
                .forEach(
                    tradeoff => {
                        const message =
                            safeString(
                                tradeoff.message ||
                                tradeoff.title ||
                                tradeoff.text
                            );

                        if (
                            message
                        ) {
                            lines.push(
                                `• ${message}`
                            );
                        }
                    }
                );
        }

        if (
            context.gaps.length
        ) {
            lines.push(
                "",
                "Information gaps:"
            );

            context.gaps
                .slice(
                    0,
                    5
                )
                .forEach(
                    gap => {
                        const message =
                            safeString(
                                gap.message ||
                                gap.title ||
                                gap.text
                            );

                        if (
                            message
                        ) {
                            lines.push(
                                `• ${message}`
                            );
                        }
                    }
                );
        }

        if (
            context.actions.length
        ) {
            lines.push(
                "",
                "Next actions:"
            );

            context.actions
                .slice(
                    0,
                    6
                )
                .forEach(
                    action => {
                        const message =
                            safeString(
                                action.action ||
                                action.message ||
                                action.title
                            );

                        if (
                            message
                        ) {
                            lines.push(
                                `• ${message}`
                            );
                        }
                    }
                );
        }

        if (
            followUpQuestions.length
        ) {
            lines.push(
                "",
                "You may also want to ask:"
            );

            followUpQuestions
                .slice(
                    0,
                    4
                )
                .forEach(
                    question => {
                        lines.push(
                            `• ${question}`
                        );
                    }
                );
        }

        return lines.join(
            "\n"
        );
    }

    function formatIntent(
        intent
    ) {
        return safeString(
            intent,
            "general"
        )
            .replace(
                /_/g,
                " "
            )
            .replace(
                /\b\w/g,
                letter =>
                    letter.toUpperCase()
            );
    }

    /* ======================================================
       ANALYZE
    ====================================================== */

    function analyze(
        options = {}
    ) {
        const question =
            safeString(
                options.question ||
                state.lastQuestion
            );

        state.status =
            "analyzing";

        state.metadata.requestCount +=
            question
                ? 1
                : 0;

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

        const plan =
            buildResponsePlan(
                question,
                options
            );

        const domains =
            collectDomainContext(
                plan,
                options
            );

        const context =
            buildAdvisorContext(
                question,
                Object.assign(
                    {},
                    options,
                    {
                        plan,
                        domains
                    }
                )
            );

        state.status =
            "ready";

        state.metadata.updatedAt =
            now();

        persist();

        emit(
            "analysisComplete",
            {
                plan:
                    clone(
                        plan
                    ),

                context:
                    clone(
                        context
                    )
            }
        );

        return {
            plan:
                clone(
                    plan
                ),

            context:
                clone(
                    context
                )
        };
    }

    /* ======================================================
       ASK / ANSWER
    ====================================================== */

    function ask(
        question = "",
        options = {}
    ) {
        const q =
            safeString(
                question
            );

        if (
            !q
        ) {
            return generateLocalResponse(
                "Analyze the selected location.",
                options
            );
        }

        /*
            IMPORTANT:
            Advisor no longer delegates to AI.JS.

            This prevents:

                AI.JS
                  ↓
                Advisor
                  ↓
                AI.JS
                  ↓
                Advisor
                  ↓
                recursion

            AI.JS may call Advisor.analyze()
            or Advisor.ask() as a local/context
            provider.
        */

        const analysis =
            analyze(
                Object.assign(
                    {},
                    options,
                    {
                        question:
                            q
                    }
                )
            );

        const response =
            generateLocalResponse(
                q,
                Object.assign(
                    {},
                    options,
                    {
                        context:
                            analysis.context
                    }
                )
            );

        addHistory(
            "user",
            q
        );

        addHistory(
            "assistant",
            response.text,
            {
                response
            }
        );

        state.response =
            clone(
                response
            );

        state.metadata.updatedAt =
            now();

        persist();

        return response;
    }

    function answer(
        question = "",
        options = {}
    ) {
        return ask(
            question,
            options
        );
    }

    /* ======================================================
       SPECIALIZED ANALYSIS
    ====================================================== */

    function analyzeRelocation(
        options = {}
    ) {
        return analyze(
            Object.assign(
                {},
                options,
                {
                    intent:
                        INTENTS.RELOCATION
                }
            )
        );
    }

    function analyzeComparison(
        options = {}
    ) {
        return analyze(
            Object.assign(
                {},
                options,
                {
                    intent:
                        INTENTS.COMPARE,

                    mode:
                        MODES.COMPARISON
                }
            )
        );
    }

    function analyzeProperty(
        options = {}
    ) {
        return analyze(
            Object.assign(
                {},
                options,
                {
                    intent:
                        INTENTS.PROPERTY,

                    mode:
                        MODES.PROPERTY_CONTEXT
                }
            )
        );
    }

    function analyzeBusiness(
        options = {}
    ) {
        return analyze(
            Object.assign(
                {},
                options,
                {
                    intent:
                        INTENTS.BUSINESS,

                    mode:
                        MODES.BUSINESS_CONTEXT
                }
            )
        );
    }

    function analyzeRisk(
        options = {}
    ) {
        return analyze(
            Object.assign(
                {},
                options,
                {
                    intent:
                        INTENTS.RISK
                }
            )
        );
    }

    /* ======================================================
       AI CONTEXT
    ====================================================== */

    function buildAIContext(
        question = "",
        options = {}
    ) {
        const analysis =
            analyze(
                Object.assign(
                    {},
                    options,
                    {
                        question
                    }
                )
            );

        return {
            module:
                MODULE_NAME,

            version:
                VERSION,

            role:
                "advisor-context-and-decision-planning",

            instructions:
                buildInstructions(
                    options
                ),

            location:
                clone(
                    state.location
                ),

            preferences:
                clone(
                    state.preferences
                ),

            plan:
                clone(
                    analysis.plan
                ),

            context:
                clone(
                    analysis.context
                ),

            response:
                clone(
                    state.response
                ),

            history:
                clone(
                    state.history
                ),

            guardrails: [
                "Do not invent missing data.",
                "Do not declare a universal best location.",
                "Use stated user priorities.",
                "Explain tradeoffs.",
                "Identify data gaps.",
                "Verify current incentives and eligibility.",
                "Distinguish climate from weather.",
                "Distinguish hazard exposure from active events.",
                "Treat property estimates as estimates.",
                "Keep final decision authority with the user."
            ],

            generatedAt:
                now()
        };
    }

    function buildSharedContext() {
        return {
            module:
                MODULE_NAME,

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

    /* ======================================================
       HISTORY
    ====================================================== */

    function addHistory(
        role,
        content,
        metadata = {}
    ) {
        state.history.push(
            {
                role:
                    safeString(
                        role
                    ),

                content:
                    safeString(
                        content
                    ),

                metadata:
                    clone(
                        metadata
                    ),

                timestamp:
                    now()
            }
        );

        if (
            state.history.length >
            20
        ) {
            state.history =
                state.history.slice(
                    -20
                );
        }

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
        state.history =
            [];

        state.metadata.updatedAt =
            now();

        persist();

        emit(
            "historyCleared"
        );

        return [];
    }

    /* ======================================================
       CONFIGURATION
    ====================================================== */

    function configure(
        options = {}
    ) {
        config =
            Object.assign(
                {},
                config,
                options
            );

        state.config =
            clone(
                config
            );

        state.metadata.updatedAt =
            now();

        persist();

        emit(
            "configured",
            {
                config:
                    clone(
                        config
                    )
            }
        );

        return getConfig();
    }

    function getConfig() {
        return clone(
            config
        );
    }

    /* ======================================================
       STATE / STATUS
    ====================================================== */

    function getState() {
        return clone(
            state
        );
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
                clone(
                    state.location
                ),

            intent:
                state.lastIntent,

            mode:
                state.lastMode,

            domains:
                clone(
                    state.plan.domains
                ),

            signalCount:
                state.context.signals.length,

            tradeoffCount:
                state.context.tradeoffs.length,

            gapCount:
                state.context.gaps.length,

            actionCount:
                state.context.actions.length,

            updatedAt:
                state.metadata.updatedAt
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

    function getResult() {
        return clone(
            state.response ||
            state.context
        );
    }

    function getIntent() {
        return state.lastIntent;
    }

    function getMode() {
        return state.lastMode;
    }

    /* ======================================================
       RESET
    ====================================================== */

    function reset(
        options = {}
    ) {
        const keepLocation =
            options.keepLocation !==
            false;

        const keepPreferences =
            options.keepPreferences !==
            false;

        const oldLocation =
            clone(
                state.location
            );

        const oldPreferences =
            clone(
                state.preferences
            );

        state =
            createInitialState();

        if (
            keepLocation
        ) {
            state.location =
                oldLocation;
        }

        if (
            keepPreferences
        ) {
            state.preferences =
                oldPreferences;
        }

        state.metadata.createdAt =
            now();

        state.metadata.updatedAt =
            now();

        if (
            options.clearStorage
        ) {
            clearPersistence();
        } else {
            persist();
        }

        emit(
            "reset"
        );

        return getState();
    }

    /* ======================================================
       SUBSCRIBE
    ====================================================== */

    function subscribe(
        eventName,
        handler
    ) {
        /*
            Compatibility modes:

            subscribe(handler)

            OR

            subscribe(
                "planCreated",
                handler
            )

            The single-function form listens
            to all advisor state events.
        */

        if (
            typeof eventName ===
            "function"
        ) {
            const listener =
                eventName;

            listener.__rolyfeStateListener =
                true;

            listeners.push(
                listener
            );

            return function unsubscribe() {
                const index =
                    listeners.indexOf(
                        listener
                    );

                if (
                    index !==
                    -1
                ) {
                    listeners.splice(
                        index,
                        1
                    );
                }
            };
        }

        if (
            typeof handler !==
                "function"
        ) {
            return function () {};
        }

        const wrapped =
            event => {
                if (
                    event.event ===
                    eventName
                ) {
                    handler(
                        event
                    );
                }
            };

        listeners.push(
            wrapped
        );

        return function unsubscribe() {
            const index =
                listeners.indexOf(
                    wrapped
                );

            if (
                index !==
                -1
            ) {
                listeners.splice(
                    index,
                    1
                );
            }
        };
    }

    /* ======================================================
       SERIALIZATION
    ====================================================== */

    function serialize() {
        return JSON.stringify(
            getState(),
            null,
            2
        );
    }

    /* ======================================================
       LOCATION FORMATTER
    ====================================================== */

    function formatLocation(
        location
    ) {
        if (
            !location
        ) {
            return "the selected location";
        }

        const parts = [
            location.address,
            location.city,
            location.county,
            location.stateName ||
                location.state,
            location.zip
        ].filter(
            Boolean
        );

        return parts.length
            ? parts.join(
                ", "
            )
            : "the selected location";
    }

    /* ======================================================
       INITIALIZATION
    ====================================================== */

    function initialize(
        options = {}
    ) {
        configure(
            options
        );

        if (
            config.persist
        ) {
            restore();
        }

        state.metadata.createdAt =
            state.metadata.createdAt ||
            now();

        state.metadata.updatedAt =
            now();

        state.config =
            clone(
                config
            );

        state.status =
            "initialized";

        state.initialized =
            true;

        if (
            state.location
        ) {
            callModule(
                "ROlyfeLocationAnalysis",
                "setLocation",
                state.location
            );
        }

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
        }

        emit(
            "initialized",
            {
                version:
                    VERSION
            }
        );

        return getStatus();
    }

    /* ======================================================
       PUBLIC API
    ====================================================== */

    const api = {

        VERSION,

        NAME:
            MODULE_NAME,

        INTENTS:
            clone(
                INTENTS
            ),

        MODES:
            clone(
                MODES
            ),

        initialize,

        configure,

        getConfig,

        reset,

        setLocation,

        getLocation,

        setPreferences,

        getPreferences,

        scoreIntent,

        classifyQuestion,

        determineMode,

        getDomainsForIntent,

        buildResponsePlan,

        collectDomainContext,

        collectSignals,

        collectGaps,

        collectTradeoffs,

        buildActions,

        collectSources,

        buildAdvisorContext,

        buildInstructions,

        buildFollowUpQuestions,

        buildLocalSections,

        generateLocalResponse,

        analyze,

        ask,

        answer,

        analyzeRelocation,

        analyzeComparison,

        analyzeProperty,

        analyzeBusiness,

        analyzeRisk,

        buildAIContext,

        buildSharedContext,

        getPlan,

        getContext,

        getResponse,

        getResult,

        getIntent,

        getMode,

        getState,

        getStatus,

        addHistory,

        getHistory,

        clearHistory,

        persist,

        restore,

        clearPersistence,

        serialize,

        subscribe
    };

    /* ======================================================
       GLOBAL EXPORTS
    ====================================================== */

    global.ROlyfeAdvisor =
        api;

    global.ROLYFE_ADVISOR =
        api;

    /* ======================================================
       AUTO INITIALIZE
    ====================================================== */

    if (
        config.autoInitialize
    ) {
        if (
            typeof document !==
                "undefined"
        ) {
            if (
                document.readyState ===
                "loading"
            ) {
                document.addEventListener(
                    "DOMContentLoaded",
                    function () {
                        initialize();
                    },
                    {
                        once:
                            true
                    }
                );
            } else {
                initialize();
            }
        } else {
            initialize();
        }
    }

})(typeof window !== "undefined"
    ? window
    : globalThis);
