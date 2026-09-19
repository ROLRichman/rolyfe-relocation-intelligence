/*
===========================================================
RO’Lyfe Relocation Intelligence Center™
RELOCATION MODULE

File:
    /modules/relocation/relocation.js

Purpose:
    Application-facing controller for the relocation system.

Architecture:

    USER INPUT
        ↓
    RELOCATION MODULE
        ↓
    RO’LYFE CORE
        ↓
    LOCATION ENGINE
        ↓
    DATA ROUTER
        ↓
    INTELLIGENCE ENGINE
        ↓
    OPPORTUNITY ENGINE
        ↓
    RELOCATION RESULTS
        ↓
    UI / AI / PROPERTY / CAPITAL / BUSINESS

Principles:
    - PA-first
    - 50-state ready
    - Data-driven
    - Preference-aware
    - Tradeoff-aware
    - No universal "best location"
    - No forced ranking
    - AI-ready
    - Property-ready
    - Capital-ready
===========================================================
*/

(function (global) {
    "use strict";

    const VERSION = "1.0.0";

    const NAME = "RO’Lyfe Relocation Module";

    const DEFAULT_PREFERENCES = {
        climate: {
            priority: 1,
            preferred: [],
            avoid: []
        },

        housing: {
            priority: 1,
            preferred: [],
            avoid: []
        },

        costOfLiving: {
            priority: 1,
            preferred: [],
            avoid: []
        },

        incentives: {
            priority: 1,
            desired: true
        },

        risk: {
            priority: 1,
            preferred: [],
            avoid: []
        },

        business: {
            priority: 1,
            preferred: [],
            avoid: []
        },

        property: {
            priority: 1,
            preferred: [],
            avoid: []
        },

        capital: {
            priority: 1,
            desired: true
        },

        lifestyle: {
            priority: 1,
            preferred: [],
            avoid: []
        }
    };

    const DEFAULT_STATE = {
        initialized: false,

        status: "idle",

        timestamp: null,

        query: "",

        location: null,

        preferences: {},

        weights: {},

        analysis: null,

        results: [],

        summary: null,

        filters: {
            state: "",
            region: "",
            country: "US",
            level: "",
            maxResults: 10
        },

        errors: [],

        warnings: []
    };

    let state = clone(DEFAULT_STATE);

    const subscribers = [];

    /*
    ===========================================================
    UTILITY
    ===========================================================
    */

    function clone(value) {
        if (
            value === undefined ||
            value === null
        ) {
            return value;
        }

        try {
            return JSON.parse(
                JSON.stringify(value)
            );
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

        const result =
            isObject(base)
                ? clone(base)
                : {};

        if (!isObject(incoming)) {
            return result;
        }

        Object.keys(incoming).forEach(function (key) {

            const value =
                incoming[key];

            if (
                isObject(value) &&
                isObject(result[key])
            ) {
                result[key] =
                    merge(
                        result[key],
                        value
                    );
            } else {
                result[key] =
                    clone(value);
            }
        });

        return result;
    }

    function unique(values) {

        return Array.from(
            new Set(
                (values || [])
                    .filter(function (value) {
                        return (
                            value !== null &&
                            value !== undefined &&
                            value !== ""
                        );
                    })
            )
        );
    }

    function safeNumber(value, fallback) {

        const number =
            Number(value);

        return Number.isFinite(number)
            ? number
            : (
                fallback !== undefined
                    ? fallback
                    : 0
            );
    }

    function normalizeText(value) {

        if (
            value === null ||
            value === undefined
        ) {
            return "";
        }

        return String(value)
            .trim()
            .toLowerCase();
    }

    /*
    ===========================================================
    CORE ACCESS
    ===========================================================
    */

    function getCore() {

        return (
            global.ROlyfeCore ||
            null
        );
    }

    function requireCore() {

        const core =
            getCore();

        if (!core) {
            throw new Error(
                "ROlyfeCore is required by the relocation module."
            );
        }

        return core;
    }

    /*
    ===========================================================
    EVENTS
    ===========================================================
    */

    function subscribe(callback) {

        if (
            typeof callback !==
            "function"
        ) {
            return function () {};
        }

        subscribers.push(callback);

        return function unsubscribe() {

            const index =
                subscribers.indexOf(
                    callback
                );

            if (index !== -1) {
                subscribers.splice(
                    index,
                    1
                );
            }
        };
    }

    function emit(
        eventName,
        payload
    ) {

        const event = {

            name:
                eventName,

            timestamp:
                now(),

            payload:
                clone(payload),

            state:
                getState()
        };

        subscribers
            .slice()
            .forEach(function (callback) {

                try {
                    callback(event);
                } catch (error) {

                    console.error(
                        "RO’Lyfe Relocation subscriber error:",
                        error
                    );
                }

            });

        return event;
    }

    /*
    ===========================================================
    PREFERENCES
    ===========================================================
    */

    function createDefaultPreferences() {

        return clone(
            DEFAULT_PREFERENCES
        );
    }

    function normalizePreferences(
        preferences
    ) {

        const normalized =
            merge(
                createDefaultPreferences(),
                preferences || {}
            );

        Object.keys(
            normalized
        ).forEach(function (domain) {

            if (
                normalized[domain] &&
                normalized[domain].priority
            ) {

                normalized[domain].priority =
                    safeNumber(
                        normalized[domain].priority,
                        1
                    );
            }

        });

        return normalized;
    }

    function setPreferences(
        preferences
    ) {

        state.preferences =
            normalizePreferences(
                preferences
            );

        const core =
            getCore();

        if (
            core &&
            typeof core.setPreferences ===
            "function"
        ) {

            core.setPreferences(
                state.preferences
            );
        }

        state.timestamp =
            now();

        emit(
            "preferences:set",
            state.preferences
        );

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
    WEIGHTS
    ===========================================================
    */

    function buildWeights(
        preferences
    ) {

        const source =
            preferences ||
            state.preferences;

        const weights = {};

        Object.keys(
            source || {}
        ).forEach(function (domain) {

            const item =
                source[domain];

            if (
                isObject(item)
            ) {

                weights[domain] =
                    safeNumber(
                        item.priority,
                        1
                    );

            } else {

                weights[domain] =
                    safeNumber(
                        item,
                        1
                    );
            }

        });

        return weights;
    }

    function setWeights(
        weights
    ) {

        state.weights =
            merge(
                state.weights || {},
                weights || {}
            );

        const core =
            getCore();

        if (
            core &&
            typeof core.setWeights ===
            "function"
        ) {

            core.setWeights(
                state.weights
            );
        }

        state.timestamp =
            now();

        emit(
            "weights:set",
            state.weights
        );

        return clone(
            state.weights
        );
    }

    /*
    ===========================================================
    LOCATION INPUT
    ===========================================================
    */

    function normalizeLocation(
        location
    ) {

        if (
            typeof location ===
            "string"
        ) {

            return {
                query:
                    location
            };
        }

        if (
            !isObject(location)
        ) {
            return {};
        }

        const result =
            clone(location);

        if (
            !result.state &&
            result.stateCode
        ) {

            result.state =
                result.stateCode;
        }

        if (
            !result.city &&
            result.cityName
        ) {

            result.city =
                result.cityName;
        }

        if (
            !result.zip &&
            result.zipCode
        ) {

            result.zip =
                result.zipCode;
        }

        if (
            !result.country &&
            result.countryCode
        ) {

            result.country =
                result.countryCode;
        }

        return result;
    }

    function setLocation(
        location
    ) {

        state.location =
            normalizeLocation(
                location
            );

        state.timestamp =
            now();

        const core =
            getCore();

        if (
            core &&
            typeof core.setLocation ===
            "function"
        ) {

            core.setLocation(
                state.location
            );
        }

        emit(
            "location:set",
            state.location
        );

        return clone(
            state.location
        );
    }

    /*
    ===========================================================
    FILTERS
    ===========================================================
    */

    function setFilters(
        filters
    ) {

        state.filters =
            merge(
                state.filters,
                filters || {}
            );

        if (
            state.filters.maxResults
        ) {

            state.filters.maxResults =
                Math.max(
                    1,
                    safeNumber(
                        state.filters.maxResults,
                        10
                    )
                );
        }

        state.timestamp =
            now();

        emit(
            "filters:set",
            state.filters
        );

        return clone(
            state.filters
        );
    }

    function getFilters() {

        return clone(
            state.filters
        );
    }

    /*
    ===========================================================
    ANALYSIS EXTRACTION
    ===========================================================
    */

    function extractOpportunitySummary(
        opportunity
    ) {

        if (!opportunity) {
            return null;
        }

        return (
            opportunity.summary ||
            opportunity.analysis &&
            opportunity.analysis.summary ||
            opportunity.analysis ||
            null
        );
    }

    function extractMetrics(
        opportunity
    ) {

        if (!opportunity) {
            return {};
        }

        return clone(
            opportunity.metrics ||
            opportunity.analysis &&
            opportunity.analysis.metrics ||
            {}
        );
    }

    function extractNextActions(
        opportunity
    ) {

        if (!opportunity) {
            return [];
        }

        return clone(
            opportunity.nextActions ||
            opportunity.analysis &&
            opportunity.analysis.nextActions ||
            []
        );
    }

    /*
    ===========================================================
    RESULT BUILDING
    ===========================================================
    */

    function buildResult(
        analysis
    ) {

        const intelligence =
            analysis &&
            analysis.intelligence
                ? analysis.intelligence
                : {};

        const opportunity =
            analysis &&
            analysis.opportunity
                ? analysis.opportunity
                : {};

        const location =
            analysis &&
            analysis.location
                ? analysis.location
                : {};

        const metrics =
            extractMetrics(
                opportunity
            );

        return {

            id:
                buildLocationId(
                    location
                ),

            location:
                clone(location),

            status:
                analysis.status ||
                "available",

            summary:
                extractOpportunitySummary(
                    opportunity
                ),

            metrics:
                metrics,

            coverage:
                clone(
                    analysis.coverage ||
                    {}
                ),

            intelligence:
                clone(intelligence),

            opportunity:
                clone(opportunity),

            nextActions:
                extractNextActions(
                    opportunity
                ),

            tradeoffs:
                extractTradeoffs(
                    intelligence,
                    opportunity
                ),

            pathways:
                extractPathways(
                    opportunity
                )
        };
    }

    function buildLocationId(
        location
    ) {

        const parts = [
            location.country,
            location.state,
            location.county,
            location.city,
            location.zip
        ]
            .filter(Boolean)
            .map(function (value) {
                return normalizeText(value)
                    .replace(
                        /\s+/g,
                        "-"
                    );
            });

        return parts.join("-");
    }

    function extractTradeoffs(
        intelligence,
        opportunity
    ) {

        const tradeoffs = [];

        const sources = [
            intelligence.analysis,
            opportunity.analysis,
            opportunity.tradeoffs
        ];

        sources.forEach(function (
            source
        ) {

            if (!source) {
                return;
            }

            if (
                Array.isArray(
                    source.tradeoffs
                )
            ) {

                tradeoffs.push.apply(
                    tradeoffs,
                    source.tradeoffs
                );
            }

            if (
                Array.isArray(
                    source.gaps
                )
            ) {

                source.gaps.forEach(
                    function (gap) {

                        tradeoffs.push({
                            type:
                                "gap",

                            message:
                                typeof gap ===
                                "string"
                                    ? gap
                                    : gap.message ||
                                      gap.label ||
                                      "Data or capability gap identified."
                        });

                    }
                );
            }

        });

        return unique(
            tradeoffs.map(
                function (item) {

                    if (
                        typeof item ===
                        "string"
                    ) {
                        return item;
                    }

                    try {
                        return JSON.stringify(
                            item
                        );
                    } catch (error) {
                        return "";
                    }

                }
            )
        ).map(function (item) {

            try {
                return JSON.parse(
                    item
                );
            } catch (error) {
                return item;
            }

        });
    }

    function extractPathways(
        opportunity
    ) {

        if (!opportunity) {
            return [];
        }

        return clone(
            opportunity.pathways ||
            opportunity.opportunityPathways ||
            opportunity.analysis &&
            opportunity.analysis.pathways ||
            []
        );
    }

    /*
    ===========================================================
    RELOCATION SUMMARY
    ===========================================================
    */

    function buildSummary(
        analysis,
        result
    ) {

        const location =
            result.location || {};

        const metrics =
            result.metrics || {};

        const coverage =
            result.coverage || {};

        const nextActions =
            result.nextActions || [];

        return {

            location:
                clone(location),

            headline:
                buildHeadline(
                    location
                ),

            dataCoverage:
                safeNumber(
                    coverage.intelligence,
                    0
                ),

            opportunityCoverage:
                safeNumber(
                    coverage.opportunity,
                    0
                ),

            metrics:
                clone(metrics),

            availableDomains:
                identifyAvailableDomains(
                    analysis
                ),

            missingDomains:
                identifyMissingDomains(
                    analysis
                ),

            nextActions:
                clone(nextActions),

            tradeoffCount:
                result.tradeoffs
                    ? result.tradeoffs.length
                    : 0,

            pathwayCount:
                result.pathways
                    ? result.pathways.length
                    : 0
        };
    }

    function buildHeadline(
        location
    ) {

        const city =
            location.city;

        const stateCode =
            location.state;

        const country =
            location.country;

        if (
            city &&
            stateCode
        ) {

            return (
                "Relocation intelligence for " +
                city +
                ", " +
                stateCode
            );
        }

        if (stateCode) {

            return (
                "Relocation intelligence for " +
                stateCode
            );
        }

        if (country) {

            return (
                "Relocation intelligence for " +
                country
            );
        }

        return "RO’Lyfe relocation analysis";
    }

    /*
    ===========================================================
    DOMAIN COVERAGE
    ===========================================================
    */

    function identifyAvailableDomains(
        analysis
    ) {

        const available = [];

        const intelligence =
            analysis &&
            analysis.intelligence
                ? analysis.intelligence
                : {};

        const opportunity =
            analysis &&
            analysis.opportunity
                ? analysis.opportunity
                : {};

        const domains = [
            "climate",
            "weather",
            "hazards",
            "housing",
            "costOfLiving",
            "incentives",
            "business",
            "property",
            "capital",
            "opportunity"
        ];

        domains.forEach(function (
            domain
        ) {

            const value =
                intelligence[domain] ||
                opportunity[domain];

            if (
                hasMeaningfulData(
                    value
                )
            ) {

                available.push(
                    domain
                );
            }

        });

        return available;
    }

    function identifyMissingDomains(
        analysis
    ) {

        const available =
            identifyAvailableDomains(
                analysis
            );

        const domains = [
            "climate",
            "weather",
            "hazards",
            "housing",
            "costOfLiving",
            "incentives",
            "business",
            "property",
            "capital",
            "opportunity"
        ];

        return domains.filter(
            function (domain) {
                return !available.includes(
                    domain
                );
            }
        );
    }

    function hasMeaningfulData(
        value
    ) {

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return false;
        }

        if (
            Array.isArray(value)
        ) {

            return value.length > 0;
        }

        if (
            isObject(value)
        ) {

            return Object.keys(
                value
            ).length > 0;
        }

        return true;
    }

    /*
    ===========================================================
    MAIN ANALYSIS
    ===========================================================
    */

    function analyze(
        options
    ) {

        const opts =
            isObject(options)
                ? clone(options)
                : {
                    location:
                        options
                };

        state.status =
            "analyzing";

        state.timestamp =
            now();

        state.errors = [];

        state.warnings = [];

        emit(
            "analysis:start",
            opts
        );

        try {

            const location =
                normalizeLocation(
                    opts.location ||
                    opts.query ||
                    state.location
                );

            if (
                Object.keys(location)
                    .length === 0
            ) {

                throw new Error(
                    "A relocation location or query is required."
                );
            }

            setLocation(
                location
            );

            state.query =
                opts.query ||
                location.query ||
                "";

            /*
            ---------------------------------------------------
            Preferences
            ---------------------------------------------------
            */

            const preferences =
                normalizePreferences(
                    opts.preferences ||
                    state.preferences
                );

            setPreferences(
                preferences
            );

            /*
            ---------------------------------------------------
            Weights
            ---------------------------------------------------
            */

            const weights =
                opts.weights ||
                buildWeights(
                    preferences
                );

            setWeights(
                weights
            );

            /*
            ---------------------------------------------------
            Core
            ---------------------------------------------------
            */

            const core =
                requireCore();

            let analysis;

            if (
                typeof core.analyzeWithPreferences ===
                "function"
            ) {

                analysis =
                    core.analyzeWithPreferences(
                        location,
                        preferences,
                        weights
                    );

            } else if (
                typeof core.analyzeLocation ===
                "function"
            ) {

                analysis =
                    core.analyzeLocation({
                        location:
                            location,

                        preferences:
                            preferences,

                        weights:
                            weights
                    });

            } else if (
                typeof core.analyze ===
                "function"
            ) {

                analysis =
                    core.analyze({
                        location:
                            location,

                        preferences:
                            preferences,

                        weights:
                            weights
                    });

            } else {

                throw new Error(
                    "ROlyfeCore does not expose an analysis method."
                );
            }

            state.analysis =
                clone(analysis);

            /*
            ---------------------------------------------------
            Build Relocation Result
            ---------------------------------------------------
            */

            const result =
                buildResult(
                    analysis
                );

            state.results = [
                result
            ];

            state.summary =
                buildSummary(
                    analysis,
                    result
                );

            state.status =
                "complete";

            state.timestamp =
                now();

            emit(
                "analysis:complete",
                {
                    result:
                        result,

                    summary:
                        state.summary
                }
            );

            return getResult();

        } catch (error) {

            state.status =
                "error";

            state.timestamp =
                now();

            state.errors.push({

                message:
                    error.message ||
                    String(error),

                timestamp:
                    now()
            });

            emit(
                "analysis:error",
                state.errors[
                    state.errors.length - 1
                ]
            );

            return getResult();
        }
    }

    /*
    ===========================================================
    BATCH LOCATION ANALYSIS
    ===========================================================
    */

    function analyzeLocations(
        locations,
        options
    ) {

        if (
            !Array.isArray(locations)
        ) {

            throw new Error(
                "analyzeLocations requires an array."
            );
        }

        const results = [];

        locations.forEach(
            function (location) {

                const result =
                    analyze(
                        merge(
                            options || {},
                            {
                                location:
                                    location
                            }
                        )
                    );

                if (
                    result &&
                    result.result
                ) {

                    results.push(
                        result.result
                    );

                }

            }
        );

        /*
        Store all results while preserving
        the current analysis as the latest.
        */

        state.results =
            results;

        state.status =
            "complete";

        state.timestamp =
            now();

        emit(
            "batch:complete",
            {
                count:
                    results.length,

                results:
                    results
            }
        );

        return getResults();
    }

    /*
    ===========================================================
    RESULT FILTERING
    ===========================================================
    */

    function filterResults(
        results,
        filters
    ) {

        const source =
            Array.isArray(results)
                ? results
                : state.results;

        const activeFilters =
            merge(
                state.filters,
                filters || {}
            );

        return source.filter(
            function (result) {

                const location =
                    result.location ||
                    {};

                if (
                    activeFilters.state &&
                    normalizeText(
                        location.state
                    ) !==
                    normalizeText(
                        activeFilters.state
                    )
                ) {

                    return false;
                }

                if (
                    activeFilters.region &&
                    normalizeText(
                        location.region
                    ) !==
                    normalizeText(
                        activeFilters.region
                    )
                ) {

                    return false;
                }

                if (
                    activeFilters.country &&
                    location.country &&
                    normalizeText(
                        location.country
                    ) !==
                    normalizeText(
                        activeFilters.country
                    )
                ) {

                    return false;
                }

                if (
                    activeFilters.level &&
                    location.level &&
                    normalizeText(
                        location.level
                    ) !==
                    normalizeText(
                        activeFilters.level
                    )
                ) {

                    return false;
                }

                return true;
            }
        );
    }

    /*
    ===========================================================
    RESULT ACCESS
    ===========================================================
    */

    function getResults(
        filters
    ) {

        let results =
            filterResults(
                state.results,
                filters
            );

        const maxResults =
            safeNumber(
                (
                    filters &&
                    filters.maxResults
                ) ||
                state.filters.maxResults,
                10
            );

        if (
            maxResults > 0
        ) {

            results =
                results.slice(
                    0,
                    maxResults
                );
        }

        return clone(
            results
        );
    }

    function getResult() {

        return {

            module:
                NAME,

            version:
                VERSION,

            status:
                state.status,

            timestamp:
                state.timestamp,

            query:
                state.query,

            result:
                state.results.length
                    ? clone(
                        state.results[
                            state.results.length - 1
                        ]
                    )
                    : null,

            results:
                clone(
                    state.results
                ),

            summary:
                clone(
                    state.summary
                ),

            analysis:
                clone(
                    state.analysis
                ),

            preferences:
                clone(
                    state.preferences
                ),

            weights:
                clone(
                    state.weights
                ),

            filters:
                clone(
                    state.filters
                ),

            errors:
                clone(
                    state.errors
                ),

            warnings:
                clone(
                    state.warnings
                )
        };
    }

    /*
    ===========================================================
    STATE
    ===========================================================
    */

    function getState() {

        return clone(
            state
        );
    }

    /*
    ===========================================================
    AI CONTEXT
    ===========================================================
    */

    function buildAIContext() {

        const core =
            getCore();

        if (
            core &&
            typeof core.buildAIContext ===
            "function"
        ) {

            return core.buildAIContext();
        }

        return {

            system:
                NAME,

            version:
                VERSION,

            location:
                clone(state.location),

            query:
                state.query,

            preferences:
                clone(state.preferences),

            weights:
                clone(state.weights),

            analysis:
                clone(state.analysis),

            results:
                clone(state.results),

            summary:
                clone(state.summary)
        };
    }

    /*
    ===========================================================
    LOCATION COMPARISON DATA
    ===========================================================
    */

    function buildComparison(
        results
    ) {

        const source =
            Array.isArray(results)
                ? results
                : state.results;

        return source.map(
            function (result) {

                const location =
                    result.location ||
                    {};

                const metrics =
                    result.metrics ||
                    {};

                return {

                    id:
                        result.id,

                    location:
                        clone(location),

                    coverage:
                        clone(
                            result.coverage
                        ),

                    metrics:
                        clone(metrics),

                    availableDomains:
                        identifyAvailableDomains(
                            {
                                intelligence:
                                    result.intelligence,

                                opportunity:
                                    result.opportunity
                            }
                        ),

                    tradeoffs:
                        clone(
                            result.tradeoffs
                        ),

                    pathways:
                        clone(
                            result.pathways
                        )
                };

            }
        );
    }

    /*
    ===========================================================
    PREFERENCE PROFILE HELPERS
    ===========================================================
    */

    function addPreference(
        domain,
        value
    ) {

        if (
            !state.preferences[domain]
        ) {

            state.preferences[domain] = {

                priority:
                    1,

                preferred: [],

                avoid: []
            };
        }

        const target =
            state.preferences[domain];

        if (
            !Array.isArray(
                target.preferred
            )
        ) {

            target.preferred = [];
        }

        if (
            !target.preferred.includes(
                value
            )
        ) {

            target.preferred.push(
                value
            );
        }

        setPreferences(
            state.preferences
        );

        return getPreferences();
    }

    function removePreference(
        domain,
        value
    ) {

        if (
            !state.preferences[domain]
        ) {
            return getPreferences();
        }

        const target =
            state.preferences[domain];

        [
            "preferred",
            "avoid"
        ].forEach(function (
            field
        ) {

            if (
                Array.isArray(
                    target[field]
                )
            ) {

                target[field] =
                    target[field].filter(
                        function (item) {

                            return normalizeText(
                                item
                            ) !==
                            normalizeText(
                                value
                            );

                        }
                    );
            }

        });

        setPreferences(
            state.preferences
        );

        return getPreferences();
    }

    /*
    ===========================================================
    EXPORT
    ===========================================================
    */

    function serialize() {

        return JSON.stringify(
            getResult(),
            null,
            2
        );
    }

    /*
    ===========================================================
    RESET
    ===========================================================
    */

    function reset() {

        state =
            clone(
                DEFAULT_STATE
            );

        state.preferences =
            createDefaultPreferences();

        emit(
            "relocation:reset",
            {}
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

        state.preferences =
            normalizePreferences(
                (
                    options &&
                    options.preferences
                ) ||
                DEFAULT_PREFERENCES
            );

        if (
            options &&
            options.filters
        ) {

            setFilters(
                options.filters
            );
        }

        if (
            options &&
            options.location
        ) {

            setLocation(
                options.location
            );
        }

        const core =
            getCore();

        if (!core) {

            state.status =
                "waiting_for_core";

            state.initialized =
                false;

            state.warnings.push(
                "ROlyfeCore has not loaded yet."
            );

        } else {

            state.initialized =
                true;

            state.status =
                "ready";
        }

        state.timestamp =
            now();

        emit(
            "relocation:initialized",
            {
                initialized:
                    state.initialized
            }
        );

        return getStatus();
    }

    /*
    ===========================================================
    STATUS
    ===========================================================
    */

    function getStatus() {

        const core =
            getCore();

        return {

            module:
                NAME,

            version:
                VERSION,

            initialized:
                state.initialized,

            status:
                state.status,

            coreAvailable:
                !!core,

            timestamp:
                state.timestamp,

            resultCount:
                state.results.length,

            errors:
                clone(
                    state.errors
                ),

            warnings:
                clone(
                    state.warnings
                )
        };
    }

    /*
    ===========================================================
    PUBLIC API
    ===========================================================
    */

    const API = {

        name:
            NAME,

        version:
            VERSION,

        initialize:
            initialize,

        reset:
            reset,

        analyze:
            analyze,

        analyzeLocation:
            analyze,

        analyzeLocations:
            analyzeLocations,

        getState:
            getState,

        getStatus:
            getStatus,

        getResult:
            getResult,

        getResults:
            getResults,

        getSummary:
            function () {
                return clone(
                    state.summary
                );
            },

        getLocation:
            function () {
                return clone(
                    state.location
                );
            },

        getPreferences:
            getPreferences,

        setPreferences:
            setPreferences,

        addPreference:
            addPreference,

        removePreference:
            removePreference,

        setLocation:
            setLocation,

        setWeights:
            setWeights,

        getFilters:
            getFilters,

        setFilters:
            setFilters,

        buildAIContext:
            buildAIContext,

        buildComparison:
            buildComparison,

        serialize:
            serialize,

        subscribe:
            subscribe
    };

    /*
    ===========================================================
    GLOBAL EXPORT
    ===========================================================
    */

    global.ROlyfeRelocation =
        API;

    if (
        typeof globalThis !==
        "undefined"
    ) {

        globalThis.ROlyfeRelocation =
            API;
    }

    /*
    ===========================================================
    INITIALIZE
    ===========================================================
    */

    initialize();

})(typeof window !== "undefined"
    ? window
    : globalThis);
