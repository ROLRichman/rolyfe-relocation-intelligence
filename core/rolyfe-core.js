/*
===========================================================
RO’Lyfe Relocation Intelligence Center™
CORE ORCHESTRATOR
File: /core/rolyfe-core.js

Purpose:
    Master orchestration layer for the RO’Lyfe Intelligence
    architecture.

Core Flow:

    LOCATION
        ↓
    DATA ROUTER
        ↓
    INTELLIGENCE
        ↓
    OPPORTUNITY
        ↓
    RO’LYFE CORE STATE
        ↓
    UI / AI / PROPERTY / BUSINESS / CAPITAL

Architecture:

    location-engine.js
           ↓
    data-router.js
           ↓
    intelligence-engine.js
           ↓
    opportunity-engine.js
           ↓
    rolyfe-core.js

Design Principles:
    - Modular
    - Browser-first
    - No framework required
    - 50-state ready
    - PA-first
    - Data-driven
    - AI-ready
    - Property-ready
    - Capital-ready
    - Business-ready
    - No universal "best location" declaration
===========================================================
*/

(function (global) {
    "use strict";

    const VERSION = "1.0.0";

    const ENGINE_NAME = "RO’Lyfe Core";

    const PIPELINE = [
        "location",
        "data",
        "intelligence",
        "opportunity",
        "property",
        "capital",
        "business",
        "automation"
    ];

    const REQUIRED_ENGINES = [
        "ROlyfeDataRouter",
        "ROlyfeIntelligenceEngine",
        "ROlyfeOpportunityEngine"
    ];

    const OPTIONAL_ENGINES = [
        "ROlyfeLocationEngine"
    ];

    /*
    ===========================================================
    DEFAULT STATE
    ===========================================================
    */

    const DEFAULT_STATE = {
        initialized: false,

        version: VERSION,

        status: "idle",

        timestamp: null,

        location: null,

        preferences: {},

        weights: {},

        routerData: null,

        intelligence: null,

        opportunity: null,

        aiContext: null,

        pipeline: {
            currentStage: null,
            completed: [],
            remaining: PIPELINE.slice()
        },

        coverage: {
            location: 0,
            intelligence: 0,
            opportunity: 0
        },

        errors: [],

        warnings: []
    };

    /*
    ===========================================================
    INTERNAL STATE
    ===========================================================
    */

    let state = clone(DEFAULT_STATE);

    const subscribers = [];

    /*
    ===========================================================
    UTILITY FUNCTIONS
    ===========================================================
    */

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

    function now() {
        return new Date().toISOString();
    }

    function isObject(value) {
        return value !== null &&
            typeof value === "object" &&
            !Array.isArray(value);
    }

    function merge(base, incoming) {
        const result = isObject(base) ? clone(base) : {};

        if (!isObject(incoming)) {
            return result;
        }

        Object.keys(incoming).forEach(function (key) {
            const value = incoming[key];

            if (
                isObject(value) &&
                isObject(result[key])
            ) {
                result[key] = merge(result[key], value);
            } else {
                result[key] = clone(value);
            }
        });

        return result;
    }

    function safeNumber(value, fallback) {
        const number = Number(value);

        return Number.isFinite(number)
            ? number
            : (fallback || 0);
    }

    function unique(values) {
        return Array.from(
            new Set(
                (values || []).filter(Boolean)
            )
        );
    }

    /*
    ===========================================================
    ENGINE ACCESS
    ===========================================================
    */

    function getEngine(name) {
        return global[name] || null;
    }

    function getDataRouter() {
        return getEngine("ROlyfeDataRouter");
    }

    function getIntelligenceEngine() {
        return getEngine("ROlyfeIntelligenceEngine");
    }

    function getOpportunityEngine() {
        return getEngine("ROlyfeOpportunityEngine");
    }

    function getLocationEngine() {
        return getEngine("ROlyfeLocationEngine");
    }

    /*
    ===========================================================
    DEPENDENCY CHECK
    ===========================================================
    */

    function checkDependencies() {
        const available = [];
        const missing = [];

        REQUIRED_ENGINES.forEach(function (name) {
            if (getEngine(name)) {
                available.push(name);
            } else {
                missing.push(name);
            }
        });

        const optionalMissing = [];

        OPTIONAL_ENGINES.forEach(function (name) {
            if (!getEngine(name)) {
                optionalMissing.push(name);
            }
        });

        return {
            ready: missing.length === 0,

            required: {
                available: available,
                missing: missing
            },

            optional: {
                available: OPTIONAL_ENGINES.filter(function (name) {
                    return !!getEngine(name);
                }),

                missing: optionalMissing
            }
        };
    }

    /*
    ===========================================================
    EVENT SYSTEM
    ===========================================================
    */

    function subscribe(callback) {
        if (typeof callback !== "function") {
            return function () {};
        }

        subscribers.push(callback);

        return function unsubscribe() {
            const index = subscribers.indexOf(callback);

            if (index !== -1) {
                subscribers.splice(index, 1);
            }
        };
    }

    function emit(eventName, payload) {
        const event = {
            name: eventName,
            timestamp: now(),
            state: getState(),
            payload: clone(payload)
        };

        subscribers.slice().forEach(function (callback) {
            try {
                callback(event);
            } catch (error) {
                console.error(
                    "RO’Lyfe Core subscriber error:",
                    error
                );
            }
        });

        return event;
    }

    /*
    ===========================================================
    PIPELINE MANAGEMENT
    ===========================================================
    */

    function setPipelineStage(stage) {
        state.pipeline.currentStage = stage;

        if (
            stage &&
            !state.pipeline.completed.includes(stage)
        ) {
            state.pipeline.completed.push(stage);
        }

        state.pipeline.remaining = PIPELINE.filter(function (item) {
            return !state.pipeline.completed.includes(item);
        });
    }

    function resetPipeline() {
        state.pipeline = {
            currentStage: null,
            completed: [],
            remaining: PIPELINE.slice()
        };
    }

    /*
    ===========================================================
    STATE MANAGEMENT
    ===========================================================
    */

    function getState() {
        return clone(state);
    }

    function getLocation() {
        return clone(state.location);
    }

    function getRouterData() {
        return clone(state.routerData);
    }

    function getIntelligence() {
        return clone(state.intelligence);
    }

    function getOpportunity() {
        return clone(state.opportunity);
    }

    function getAIContext() {
        return clone(state.aiContext);
    }

    function setLocation(location) {
        state.location = merge(
            state.location || {},
            location || {}
        );

        state.timestamp = now();

        emit("location:set", state.location);

        return getLocation();
    }

    function setPreferences(preferences) {
        state.preferences = merge(
            state.preferences || {},
            preferences || {}
        );

        state.timestamp = now();

        emit(
            "preferences:set",
            state.preferences
        );

        return clone(state.preferences);
    }

    function setWeights(weights) {
        state.weights = merge(
            state.weights || {},
            weights || {}
        );

        state.timestamp = now();

        emit(
            "weights:set",
            state.weights
        );

        return clone(state.weights);
    }

    /*
    ===========================================================
    LOCATION NORMALIZATION
    ===========================================================
    */

    function normalizeLocation(input) {
        if (!input) {
            return {};
        }

        if (typeof input === "string") {
            return {
                query: input
            };
        }

        if (!isObject(input)) {
            return {};
        }

        const location = clone(input);

        /*
        Accept common aliases so the core can receive data
        from forms, search fields, URL parameters, or future APIs.
        */

        if (!location.state && location.stateCode) {
            location.state = location.stateCode;
        }

        if (!location.state && location.state_code) {
            location.state = location.state_code;
        }

        if (!location.city && location.cityName) {
            location.city = location.cityName;
        }

        if (!location.zip && location.zipCode) {
            location.zip = location.zipCode;
        }

        if (!location.country && location.countryCode) {
            location.country = location.countryCode;
        }

        return location;
    }

    /*
    ===========================================================
    LOCATION ENGINE ADAPTER
    ===========================================================
    */

    function processLocation(input) {
        const normalized = normalizeLocation(input);

        const locationEngine = getLocationEngine();

        /*
        If the location engine exposes a normalizer or resolver,
        use it. Otherwise preserve the normalized input.
        */

        if (locationEngine) {

            try {
                if (
                    typeof locationEngine.normalize === "function"
                ) {
                    return locationEngine.normalize(normalized);
                }

                if (
                    typeof locationEngine.resolve === "function"
                ) {
                    return locationEngine.resolve(normalized);
                }

                if (
                    typeof locationEngine.parse === "function"
                ) {
                    return locationEngine.parse(normalized);
                }
            } catch (error) {
                state.warnings.push(
                    "Location engine processing failed; using normalized location."
                );
            }
        }

        return normalized;
    }

    /*
    ===========================================================
    DATA ROUTER
    ===========================================================
    */

    function buildRouterData(location, options) {
        const router = getDataRouter();

        if (!router) {
            throw new Error(
                "ROlyfeDataRouter is required but was not found."
            );
        }

        const routerOptions = merge(
            options || {},
            {
                location: location
            }
        );

        let result = null;

        if (
            typeof router.buildLocationData === "function"
        ) {
            result = router.buildLocationData(routerOptions);
        } else if (
            typeof router.route === "function"
        ) {
            result = router.route(routerOptions);
        } else if (
            typeof router.getLocationData === "function"
        ) {
            result = router.getLocationData(routerOptions);
        } else {
            throw new Error(
                "ROlyfeDataRouter does not expose a supported location-data method."
            );
        }

        return result;
    }

    /*
    ===========================================================
    INTELLIGENCE PROCESSOR
    ===========================================================
    */

    function buildIntelligence(routerData, location, options) {
        const engine = getIntelligenceEngine();

        if (!engine) {
            throw new Error(
                "ROlyfeIntelligenceEngine is required but was not found."
            );
        }

        let result = null;

        /*
        Preferred path:
            Intelligence Engine already knows how to consume
            the Data Router.
        */

        if (
            typeof engine.buildFromRouter === "function"
        ) {
            result = engine.buildFromRouter(
                merge(
                    options || {},
                    {
                        location: location,
                        routerData: routerData
                    }
                )
            );
        }

        /*
        Fallback:
            Build an intelligence profile directly.
        */

        if (
            !result &&
            typeof engine.ingestLocation === "function"
        ) {
            result = engine.ingestLocation(
                location,
                routerData
            );
        }

        if (
            !result &&
            typeof engine.createProfile === "function"
        ) {
            result = engine.createProfile(location);

            if (
                result &&
                typeof engine.ingestLocation === "function"
            ) {
                result = engine.ingestLocation(
                    location,
                    routerData
                );
            }
        }

        if (!result) {
            throw new Error(
                "ROlyfeIntelligenceEngine could not build an intelligence profile."
            );
        }

        return result;
    }

    /*
    ===========================================================
    OPPORTUNITY PROCESSOR
    ===========================================================
    */

    function buildOpportunity(
        intelligence,
        preferences,
        weights
    ) {
        const engine = getOpportunityEngine();

        if (!engine) {
            throw new Error(
                "ROlyfeOpportunityEngine is required but was not found."
            );
        }

        let result = null;

        if (
            typeof engine.analyze === "function"
        ) {
            result = engine.analyze(
                intelligence,
                preferences || {},
                weights || {}
            );
        }

        if (
            !result &&
            typeof engine.buildFromIntelligence === "function"
        ) {
            result = engine.buildFromIntelligence(
                intelligence,
                preferences || {},
                weights || {}
            );
        }

        if (
            !result &&
            typeof engine.createProfile === "function"
        ) {
            result = engine.createProfile(intelligence);
        }

        if (!result) {
            throw new Error(
                "ROlyfeOpportunityEngine could not build an opportunity profile."
            );
        }

        return result;
    }

    /*
    ===========================================================
    AI CONTEXT
    ===========================================================
    */

    function buildAIContext() {
        const intelligence = state.intelligence;
        const opportunity = state.opportunity;

        let context = null;

        if (
            opportunity &&
            opportunity.aiContext
        ) {
            context = clone(
                opportunity.aiContext
            );
        }

        if (
            !context &&
            opportunity &&
            opportunity.analysis &&
            opportunity.analysis.aiContext
        ) {
            context = clone(
                opportunity.analysis.aiContext
            );
        }

        if (!context) {
            context = {
                system: ENGINE_NAME,

                version: VERSION,

                purpose:
                    "Interpret location, housing, risk, incentive, business, property, capital, and opportunity data.",

                location:
                    clone(state.location),

                preferences:
                    clone(state.preferences),

                intelligence:
                    clone(intelligence),

                opportunity:
                    clone(opportunity)
            };
        }

        /*
        Always attach the current shared state.
        */

        context.rolyfe = {
            version: VERSION,

            location:
                clone(state.location),

            pipeline:
                clone(state.pipeline),

            preferences:
                clone(state.preferences),

            weights:
                clone(state.weights),

            coverage:
                clone(state.coverage)
        };

        state.aiContext = context;

        return clone(context);
    }

    /*
    ===========================================================
    COVERAGE
    ===========================================================
    */

    function calculateCoverage() {

        const intelligence =
            state.intelligence || {};

        const opportunity =
            state.opportunity || {};

        const intelligenceCoverage =
            intelligence.coverage ||
            intelligence.metrics &&
            intelligence.metrics.coverage ||
            0;

        const opportunityCoverage =
            opportunity.metrics &&
            (
                opportunity.metrics.dataCoverage ||
                opportunity.metrics.opportunityCoverage
            ) ||
            opportunity.coverage ||
            0;

        state.coverage = {
            location:
                state.location ? 100 : 0,

            intelligence:
                safeNumber(
                    intelligenceCoverage,
                    state.intelligence ? 1 : 0
                ) <= 1
                    ? safeNumber(intelligenceCoverage, 0) * 100
                    : safeNumber(intelligenceCoverage, 0),

            opportunity:
                safeNumber(
                    opportunityCoverage,
                    state.opportunity ? 1 : 0
                ) <= 1
                    ? safeNumber(opportunityCoverage, 0) * 100
                    : safeNumber(opportunityCoverage, 0)
        };

        return clone(state.coverage);
    }

    /*
    ===========================================================
    MAIN ANALYSIS PIPELINE
    ===========================================================
    */

    function analyzeLocation(options) {

        const opts = isObject(options)
            ? clone(options)
            : {
                location: options
            };

        state.status = "analyzing";

        state.timestamp = now();

        state.errors = [];

        state.warnings = [];

        resetPipeline();

        emit("analysis:start", opts);

        try {

            /*
            ---------------------------------------------------
            1. LOCATION
            ---------------------------------------------------
            */

            setPipelineStage("location");

            const locationInput =
                opts.location ||
                opts.query ||
                opts.address ||
                opts.zip ||
                opts.city ||
                opts.state ||
                state.location;

            const location =
                processLocation(locationInput);

            state.location = merge(
                state.location || {},
                location || {}
            );

            /*
            ---------------------------------------------------
            2. DATA
            ---------------------------------------------------
            */

            setPipelineStage("data");

            const routerData =
                opts.routerData ||
                buildRouterData(
                    state.location,
                    opts
                );

            state.routerData =
                clone(routerData);

            /*
            ---------------------------------------------------
            3. INTELLIGENCE
            ---------------------------------------------------
            */

            setPipelineStage("intelligence");

            const intelligence =
                opts.intelligence ||
                buildIntelligence(
                    routerData,
                    state.location,
                    opts
                );

            state.intelligence =
                clone(intelligence);

            /*
            ---------------------------------------------------
            4. OPPORTUNITY
            ---------------------------------------------------
            */

            setPipelineStage("opportunity");

            const opportunity =
                opts.opportunity ||
                buildOpportunity(
                    intelligence,
                    opts.preferences ||
                    state.preferences,
                    opts.weights ||
                    state.weights
                );

            state.opportunity =
                clone(opportunity);

            /*
            ---------------------------------------------------
            5. PROPERTY
            ---------------------------------------------------
            */

            setPipelineStage("property");

            /*
            Property intelligence is currently carried inside
            the Intelligence / Opportunity layers.

            A dedicated property engine can plug into this stage
            later without changing the main pipeline.
            */

            /*
            ---------------------------------------------------
            6. CAPITAL
            ---------------------------------------------------
            */

            setPipelineStage("capital");

            /*
            Capital intelligence remains data-driven for now.
            Funding connectors can attach here later.
            */

            /*
            ---------------------------------------------------
            7. BUSINESS
            ---------------------------------------------------
            */

            setPipelineStage("business");

            /*
            Business intelligence is already represented inside
            the Intelligence and Opportunity engines.
            */

            /*
            ---------------------------------------------------
            8. AUTOMATION
            ---------------------------------------------------
            */

            setPipelineStage("automation");

            calculateCoverage();

            buildAIContext();

            state.status = "complete";

            state.initialized = true;

            state.timestamp = now();

            emit(
                "analysis:complete",
                {
                    location:
                        state.location,

                    coverage:
                        state.coverage,

                    pipeline:
                        state.pipeline
                }
            );

            return getAnalysis();

        } catch (error) {

            state.status = "error";

            state.timestamp = now();

            state.errors.push({
                message:
                    error.message ||
                    String(error),

                stage:
                    state.pipeline.currentStage,

                timestamp:
                    now()
            });

            emit(
                "analysis:error",
                state.errors[state.errors.length - 1]
            );

            return getAnalysis();
        }
    }

    /*
    ===========================================================
    ANALYSIS RESULT
    ===========================================================
    */

    function getAnalysis() {

        return {
            engine: ENGINE_NAME,

            version: VERSION,

            status: state.status,

            timestamp: state.timestamp,

            location:
                clone(state.location),

            preferences:
                clone(state.preferences),

            weights:
                clone(state.weights),

            routerData:
                clone(state.routerData),

            intelligence:
                clone(state.intelligence),

            opportunity:
                clone(state.opportunity),

            aiContext:
                clone(state.aiContext),

            pipeline:
                clone(state.pipeline),

            coverage:
                clone(state.coverage),

            errors:
                clone(state.errors),

            warnings:
                clone(state.warnings)
        };
    }

    /*
    ===========================================================
    CURRENT LOCATION ANALYSIS
    ===========================================================
    */

    function analyzeCurrentLocation(options) {

        /*
        Browser geolocation must be explicitly requested by the
        calling application. The core does not automatically
        request location permission during initialization.
        */

        if (
            typeof navigator === "undefined" ||
            !navigator.geolocation
        ) {
            return Promise.reject(
                new Error(
                    "Browser geolocation is not available."
                )
            );
        }

        return new Promise(function (resolve, reject) {

            navigator.geolocation.getCurrentPosition(
                function (position) {

                    const coordinates = {
                        latitude:
                            position.coords.latitude,

                        longitude:
                            position.coords.longitude,

                        accuracy:
                            position.coords.accuracy
                    };

                    const result =
                        analyzeLocation(
                            merge(
                                options || {},
                                {
                                    location:
                                        coordinates
                                }
                            )
                        );

                    resolve(result);
                },

                function (error) {

                    reject(
                        new Error(
                            "Unable to obtain browser location: " +
                            error.message
                        )
                    );
                },

                {
                    enableHighAccuracy: false,

                    timeout: 10000,

                    maximumAge: 300000
                }
            );
        });
    }

    /*
    ===========================================================
    PREFERENCE-DRIVEN ANALYSIS
    ===========================================================
    */

    function analyzeWithPreferences(
        location,
        preferences,
        weights
    ) {

        setPreferences(
            preferences || {}
        );

        setWeights(
            weights || {}
        );

        return analyzeLocation({
            location: location,

            preferences:
                preferences ||
                state.preferences,

            weights:
                weights ||
                state.weights
        });
    }

    /*
    ===========================================================
    ENGINE STATUS
    ===========================================================
    */

    function getStatus() {

        const dependencies =
            checkDependencies();

        return {
            engine:
                ENGINE_NAME,

            version:
                VERSION,

            initialized:
                state.initialized,

            status:
                state.status,

            dependencies:
                dependencies,

            pipeline:
                clone(state.pipeline),

            coverage:
                clone(state.coverage),

            errors:
                clone(state.errors),

            warnings:
                clone(state.warnings)
        };
    }

    /*
    ===========================================================
    RESET
    ===========================================================
    */

    function reset() {

        state = clone(DEFAULT_STATE);

        emit(
            "core:reset",
            {}
        );

        return getState();
    }

    /*
    ===========================================================
    INITIALIZATION
    ===========================================================
    */

    function initialize(options) {

        const opts =
            isObject(options)
                ? options
                : {};

        const dependencies =
            checkDependencies();

        state.initialized =
            dependencies.ready;

        state.status =
            dependencies.ready
                ? "ready"
                : "dependency_error";

        state.timestamp =
            now();

        if (
            dependencies.optional.missing.length
        ) {
            state.warnings.push(
                "Optional engine(s) unavailable: " +
                dependencies.optional.missing.join(", ")
            );
        }

        if (
            !dependencies.ready
        ) {
            state.errors.push({
                message:
                    "Required RO’Lyfe core dependencies are missing.",

                missing:
                    dependencies.required.missing,

                timestamp:
                    now()
            });
        }

        if (opts.preferences) {
            setPreferences(
                opts.preferences
            );
        }

        if (opts.weights) {
            setWeights(
                opts.weights
            );
        }

        emit(
            "core:initialized",
            {
                ready:
                    dependencies.ready,

                dependencies:
                    dependencies
            }
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
            getAnalysis(),
            null,
            2
        );
    }

    /*
    ===========================================================
    IMPORT STATE
    ===========================================================
    */

    function importState(input) {

        let incoming = input;

        if (typeof incoming === "string") {

            try {
                incoming =
                    JSON.parse(incoming);
            } catch (error) {
                throw new Error(
                    "Invalid RO’Lyfe Core state JSON."
                );
            }
        }

        if (!isObject(incoming)) {
            throw new Error(
                "RO’Lyfe Core state must be an object."
            );
        }

        state = merge(
            state,
            incoming
        );

        state.timestamp =
            now();

        emit(
            "core:state-imported",
            state
        );

        return getState();
    }

    /*
    ===========================================================
    SHARED RO’LYFE CONTEXT
    ===========================================================
    */

    function buildSharedContext() {

        return {
            rolyfe: {
                engine:
                    ENGINE_NAME,

                version:
                    VERSION
            },

            location:
                clone(state.location),

            preferences:
                clone(state.preferences),

            weights:
                clone(state.weights),

            intelligence:
                clone(state.intelligence),

            opportunity:
                clone(state.opportunity),

            coverage:
                clone(state.coverage),

            pipeline:
                clone(state.pipeline),

            ai:
                clone(state.aiContext)
        };
    }

    /*
    ===========================================================
    DOMAIN ACCESSORS
    ===========================================================
    */

    function getDomain(domain) {

        const opportunity =
            state.opportunity || {};

        const intelligence =
            state.intelligence || {};

        switch (domain) {

            case "location":
                return clone(
                    state.location
                );

            case "housing":
                return clone(
                    intelligence.housing ||
                    opportunity.housing ||
                    null
                );

            case "climate":
                return clone(
                    intelligence.climate ||
                    opportunity.climate ||
                    null
                );

            case "weather":
                return clone(
                    intelligence.weather ||
                    null
                );

            case "risk":
            case "hazards":
                return clone(
                    intelligence.hazards ||
                    opportunity.risk ||
                    null
                );

            case "incentives":
                return clone(
                    intelligence.incentives ||
                    opportunity.incentives ||
                    null
                );

            case "business":
                return clone(
                    intelligence.business ||
                    opportunity.business ||
                    null
                );

            case "property":
                return clone(
                    intelligence.property ||
                    opportunity.property ||
                    null
                );

            case "capital":
                return clone(
                    intelligence.capital ||
                    opportunity.capital ||
                    null
                );

            case "opportunity":
                return clone(
                    opportunity
                );

            case "costOfLiving":
            case "cost":
                return clone(
                    intelligence.costOfLiving ||
                    opportunity.costOfLiving ||
                    null
                );

            default:
                return null;
        }
    }

    /*
    ===========================================================
    QUICK SUMMARY
    ===========================================================
    */

    function getSummary() {

        const intelligence =
            state.intelligence || {};

        const opportunity =
            state.opportunity || {};

        return {

            location:
                clone(state.location),

            status:
                state.status,

            coverage:
                clone(state.coverage),

            executiveSummary:
                intelligence.analysis &&
                intelligence.analysis.executiveSummary
                    ? intelligence.analysis.executiveSummary
                    : null,

            opportunitySummary:
                opportunity.summary ||
                opportunity.analysis &&
                opportunity.analysis.summary ||
                null,

            metrics:
                opportunity.metrics ||
                null,

            nextActions:
                opportunity.nextActions ||
                null
        };
    }

    /*
    ===========================================================
    PUBLIC API
    ===========================================================
    */

    const API = {

        name:
            ENGINE_NAME,

        version:
            VERSION,

        pipeline:
            PIPELINE.slice(),

        initialize:
            initialize,

        reset:
            reset,

        analyze:
            analyzeLocation,

        analyzeLocation:
            analyzeLocation,

        analyzeCurrentLocation:
            analyzeCurrentLocation,

        analyzeWithPreferences:
            analyzeWithPreferences,

        buildAIContext:
            buildAIContext,

        buildSharedContext:
            buildSharedContext,

        checkDependencies:
            checkDependencies,

        getStatus:
            getStatus,

        getState:
            getState,

        getAnalysis:
            getAnalysis,

        getSummary:
            getSummary,

        getDomain:
            getDomain,

        getLocation:
            getLocation,

        getRouterData:
            getRouterData,

        getIntelligence:
            getIntelligence,

        getOpportunity:
            getOpportunity,

        getAIContext:
            getAIContext,

        setLocation:
            setLocation,

        setPreferences:
            setPreferences,

        setWeights:
            setWeights,

        serialize:
            serialize,

        importState:
            importState,

        subscribe:
            subscribe,

        emit:
            emit
    };

    /*
    ===========================================================
    GLOBAL EXPORT
    ===========================================================
    */

    global.ROlyfeCore =
        API;

    /*
    Support environments that expose globalThis.
    */

    if (
        typeof globalThis !== "undefined"
    ) {
        globalThis.ROlyfeCore =
            API;
    }

    /*
    Auto-initialize dependency state only.
    It does NOT automatically request location permission,
    perform network requests, or run a location analysis.
    */

    initialize();

})(typeof window !== "undefined" ? window : globalThis);
