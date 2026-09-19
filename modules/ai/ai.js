/*
============================================================
RO'Lyfe Relocation Intelligence Center™
MODULE: AI Intelligence Orchestrator
FILE: /modules/ai/ai.js
VERSION: 1.0.0
============================================================

PURPOSE
-------
Central AI orchestration layer for the RO'Lyfe Relocation
Intelligence Center.

This file DOES NOT attempt to become the AI model itself.

Instead it prepares structured intelligence from:

    LOCATION
    ↓
    CLIMATE
    ↓
    WEATHER
    ↓
    RISK
    ↓
    HOUSING
    ↓
    COST OF LIVING
    ↓
    INCENTIVES
    ↓
    BUSINESS
    ↓
    PROPERTY
    ↓
    OPPORTUNITY
    ↓
    AI CONTEXT
    ↓
    ADVISOR

SPECIALIZED AI FILES
--------------------
advisor.js
    General relocation advisor

location-analysis.js
    Location-specific reasoning

property-analysis.js
    Property / real-estate reasoning

ai.js
    Central orchestrator and shared context layer

ARCHITECTURE
------------
User
 ↓
AI Module
 ↓
RO'Lyfe Core
 ↓
Intelligence Modules
 ↓
Structured Context
 ↓
Advisor / Analysis Engines
 ↓
Future AI API / Agent
 ↓
Response / Recommendation Context

IMPORTANT
---------
This module does not make an unconditional "best state"
decision.

It explains:

- available information
- matches
- tradeoffs
- risks
- opportunities
- missing data
- next steps

The user remains the decision-maker.

============================================================
*/

(function (global) {
    "use strict";

    const VERSION = "1.0.0";

    const MODULE_NAME = "ROlyfeAI";

    const STORAGE_KEY =
        "rolyfe_relocation_ai_state_v1";

    /*
    ========================================================
    CONFIGURATION
    ========================================================
    */

    const CONFIG = {

        autoInitialize: true,

        contextVersion: "1.0.0",

        maxPrograms: 25,

        maxSignals: 50,

        maxFindings: 50,

        maxActions: 30,

        maxProperties: 25,

        maxListings: 25,

        futureProvider: "external",

        /*
        ----------------------------------------------------
        The browser module intentionally does not contain
        a private AI API key.
        ----------------------------------------------------

        A future server-side adapter can consume:

            buildPrompt()
            buildContext()
            getAIContext()

        ----------------------------------------------------
        */

        provider: "none",

        temperature: 0.2
    };

    /*
    ========================================================
    STATE
    ========================================================
    */

    let state =
        createInitialState();

    const subscribers = [];

    function createInitialState() {

        return {

            initialized: false,

            version: VERSION,

            sessionId:
                createSessionId(),

            location: {},

            userProfile: {},

            preferences: {},

            context: null,

            analyses: {

                location: null,

                property: null,

                incentives: null,

                business: null,

                housing: null,

                climate: null,

                weather: null,

                risk: null,

                opportunity: null
            },

            messages: [],

            lastResponse: null,

            status: {

                ready: false,

                contextBuilt: false,

                analysisComplete: false,

                lastUpdated: null

            },

            metadata: {

                createdAt:
                    new Date().toISOString(),

                updatedAt:
                    new Date().toISOString(),

                module:
                    MODULE_NAME,

                version:
                    VERSION

            }

        };
    }

    /*
    ========================================================
    BASIC HELPERS
    ========================================================
    */

    function now() {

        return new Date().toISOString();

    }

    function safeClone(value) {

        try {

            return JSON.parse(
                JSON.stringify(value)
            );

        } catch (error) {

            return value;

        }

    }

    function text(value) {

        if (
            value === null ||
            value === undefined
        ) {

            return "";

        }

        return String(value).trim();

    }

    function array(value) {

        if (Array.isArray(value)) {

            return value;

        }

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {

            return [];

        }

        return [value];

    }

    function limit(
        value,
        maximum
    ) {

        return array(value)
            .slice(0, maximum);

    }

    function createSessionId() {

        return (
            "rolyfe-ai-" +
            Date.now() +
            "-" +
            Math.random()
                .toString(36)
                .slice(2, 9)
        );

    }

    /*
    ========================================================
    EVENT SYSTEM
    ========================================================
    */

    function emit(
        eventName,
        payload = {}
    ) {

        const event = {

            event:
                eventName,

            timestamp:
                now(),

            payload:
                safeClone(payload)

        };

        subscribers.forEach(
            function (subscriber) {

                try {

                    subscriber(event);

                } catch (error) {

                    console.warn(
                        "[RO'Lyfe AI] subscriber error:",
                        error
                    );

                }

            }
        );

        if (
            typeof window !== "undefined" &&
            typeof window.dispatchEvent ===
                "function"
        ) {

            try {

                window.dispatchEvent(

                    new CustomEvent(
                        "rolyfe:ai:" +
                        eventName,
                        {
                            detail: event
                        }
                    )

                );

            } catch (error) {

                // Ignore unsupported CustomEvent environments.

            }

        }

    }

    /*
    ========================================================
    MODULE DISCOVERY
    ========================================================

    Allows the orchestrator to safely communicate with
    modules that may or may not have loaded yet.

    ========================================================
    */

    function getModule(
        name
    ) {

        return (
            global[name] ||
            null
        );

    }

    function callModule(
        moduleName,
        method,
        fallback = null
    ) {

        const module =
            getModule(moduleName);

        if (
            !module ||
            typeof module[method] !==
                "function"
        ) {

            return fallback;

        }

        try {

            return module[method]();

        } catch (error) {

            console.warn(
                "[RO'Lyfe AI] module call failed:",
                moduleName,
                method,
                error
            );

            return fallback;

        }

    }

    /*
    ========================================================
    COLLECT MODULE CONTEXT
    ========================================================
    */

    function collectModuleContext() {

        const context = {};

        /*
        ----------------------------------------------------
        Core
        ----------------------------------------------------
        */

        context.core =
            collectFromModule(
                "ROlyfeCore"
            );

        /*
        ----------------------------------------------------
        Location
        ----------------------------------------------------
        */

        context.location =
            collectFromModule(
                "ROlyfeLocationEngine"
            );

        /*
        ----------------------------------------------------
        Housing
        ----------------------------------------------------
        */

        context.housing =
            collectFromModule(
                "ROlyfeHousing"
            );

        /*
        ----------------------------------------------------
        Climate
        ----------------------------------------------------
        */

        context.climate =
            collectFromModule(
                "ROlyfeClimate"
            );

        /*
        ----------------------------------------------------
        Risk
        ----------------------------------------------------
        */

        context.risk =
            collectFromModule(
                "ROlyfeRisk"
            );

        /*
        ----------------------------------------------------
        Weather
        ----------------------------------------------------
        */

        context.weather =
            collectFromModule(
                "ROlyfeWeather"
            );

        /*
        ----------------------------------------------------
        Incentives
        ----------------------------------------------------
        */

        context.incentives =
            collectFromModule(
                "ROlyfeIncentives"
            );

        /*
        ----------------------------------------------------
        Business
        ----------------------------------------------------
        */

        context.business =
            collectFromModule(
                "ROlyfeBusiness"
            );

        /*
        ----------------------------------------------------
        Opportunity
        ----------------------------------------------------
        */

        context.opportunity =
            collectFromModule(
                "ROlyfeOpportunityEngine"
            );

        /*
        ----------------------------------------------------
        Intelligence
        ----------------------------------------------------
        */

        context.intelligence =
            collectFromModule(
                "ROlyfeIntelligenceEngine"
            );

        return context;

    }

    function collectFromModule(
        moduleName
    ) {

        const module =
            getModule(moduleName);

        if (!module) {

            return {

                available: false,

                module:
                    moduleName

            };

        }

        let profile = null;

        let aiContext = null;

        let sharedContext = null;

        let status = null;

        try {

            if (
                typeof module.getProfile ===
                    "function"
            ) {

                profile =
                    module.getProfile();

            }

        } catch (error) {}

        try {

            if (
                typeof module.getAIContext ===
                    "function"
            ) {

                aiContext =
                    module.getAIContext();

            }

        } catch (error) {}

        try {

            if (
                typeof module.getSharedContext ===
                    "function"
            ) {

                sharedContext =
                    module.getSharedContext();

            }

        } catch (error) {}

        try {

            if (
                typeof module.getStatus ===
                    "function"
            ) {

                status =
                    module.getStatus();

            }

        } catch (error) {}

        return {

            available: true,

            module:
                moduleName,

            profile:
                safeClone(profile),

            aiContext:
                safeClone(aiContext),

            sharedContext:
                safeClone(sharedContext),

            status:
                safeClone(status)

        };

    }

    /*
    ========================================================
    LOCATION EXTRACTION
    ========================================================
    */

    function resolveLocation() {

        let location = {};

        /*
        ----------------------------------------------------
        Core
        ----------------------------------------------------
        */

        try {

            const core =
                getModule(
                    "ROlyfeCore"
                );

            if (
                core &&
                typeof core.getLocation ===
                    "function"
            ) {

                location =
                    core.getLocation() ||
                    {};

            }

        } catch (error) {}

        /*
        ----------------------------------------------------
        Location engine fallback
        ----------------------------------------------------
        */

        if (
            !location.state &&
            global.ROlyfeLocationEngine
        ) {

            try {

                const engine =
                    global.ROlyfeLocationEngine;

                if (
                    typeof engine.getLocation ===
                        "function"
                ) {

                    location =
                        engine.getLocation() ||
                        location;

                }

            } catch (error) {}

        }

        /*
        ----------------------------------------------------
        Stored state fallback
        ----------------------------------------------------
        */

        if (
            !location.state &&
            state.location &&
            state.location.state
        ) {

            location =
                state.location;

        }

        return safeClone(location);

    }

    /*
    ========================================================
    BUILD MASTER CONTEXT
    ========================================================
    */

    function buildContext(
        options = {}
    ) {

        const location =
            options.location ||
            resolveLocation();

        const modules =
            collectModuleContext();

        const userProfile =
            options.userProfile ||
            state.userProfile ||
            {};

        const preferences =
            options.preferences ||
            state.preferences ||
            {};

        const context = {

            schema: {
                name:
                    "ROlyfe Relocation AI Context",

                version:
                    CONFIG.contextVersion,

                generatedAt:
                    now()
            },

            mission:
                "Help the user understand relocation, housing, climate, risk, incentives, business, property, and opportunity information while keeping the user in control of the final decision.",

            location:
                safeClone(location),

            userProfile:
                safeClone(userProfile),

            preferences:
                safeClone(preferences),

            modules: modules,

            derived: {

                locationComplete:
                    checkLocationCompleteness(
                        location
                    ),

                availableModules:
                    getAvailableModules(
                        modules
                    ),

                missingModules:
                    getMissingModules(
                        modules
                    ),

                dataCoverage:
                    calculateDataCoverage(
                        modules
                    )

            },

            decisionFramework: {

                life:
                    "Climate, weather, housing, community, and lifestyle context.",

                money:
                    "Housing costs, taxes, incentives, business economics, and affordability.",

                risk:
                    "Flood, tornado, hurricane, wildfire, heat, cold, drought, earthquake, snow, ice, and severe-weather exposure.",

                opportunity:
                    "Business, property, development, employment, entrepreneurship, and investment context.",

                incentives:
                    "Potential grants, credits, assistance, abatements, loans, and relocation programs.",

                verification:
                    "Important claims should be traced to current and appropriate sources."

            },

            guardrails: [

                "Do not present incomplete data as complete.",

                "Do not represent incentives as guaranteed.",

                "Do not invent property, housing, weather, or program data.",

                "Do not infer eligibility from missing information.",

                "Distinguish historical climate from current weather.",

                "Distinguish hazard exposure from an active emergency.",

                "Identify uncertainty and missing data.",

                "Explain tradeoffs instead of hiding them.",

                "The user makes the final relocation decision."

            ]

        };

        state.context =
            context;

        state.status.contextBuilt =
            true;

        state.status.lastUpdated =
            now();

        state.metadata.updatedAt =
            now();

        persist();

        emit(
            "context-built",
            {
                location,
                coverage:
                    context.derived.dataCoverage
            }
        );

        return safeClone(
            context
        );

    }

    /*
    ========================================================
    CONTEXT COVERAGE
    ========================================================
    */

    function checkLocationCompleteness(
        location
    ) {

        const fields = [
            "country",
            "state",
            "county",
            "city",
            "zip"
        ];

        const present =
            fields.filter(
                function (field) {

                    return Boolean(
                        text(
                            location &&
                            location[field]
                        )
                    );

                }
            ).length;

        return {

            fields:

                fields.length,

            present,

            percentage:
                Math.round(
                    (
                        present /
                        fields.length
                    ) * 100
                )

        };

    }

    function getAvailableModules(
        modules
    ) {

        return Object.keys(
            modules
        ).filter(
            function (key) {

                return (
                    modules[key] &&
                    modules[key].available
                );

            }
        );

    }

    function getMissingModules(
        modules
    ) {

        return Object.keys(
            modules
        ).filter(
            function (key) {

                return !(
                    modules[key] &&
                    modules[key].available
                );

            }
        );

    }

    function calculateDataCoverage(
        modules
    ) {

        const keys =
            Object.keys(
                modules
            );

        if (!keys.length) {

            return 0;

        }

        const available =
            getAvailableModules(
                modules
            ).length;

        return Math.round(
            (
                available /
                keys.length
            ) * 100
        );

    }

    /*
    ========================================================
    ANALYSIS ENGINE
    ========================================================
    */

    function analyze(
        options = {}
    ) {

        const context =
            buildContext(
                options
            );

        const analyses = {

            location:
                analyzeLocation(
                    context
                ),

            property:
                analyzeProperty(
                    context
                ),

            incentives:
                analyzeIncentives(
                    context
                ),

            business:
                analyzeBusiness(
                    context
                ),

            housing:
                analyzeHousing(
                    context
                ),

            climate:
                analyzeClimate(
                    context
                ),

            weather:
                analyzeWeather(
                    context
                ),

            risk:
                analyzeRisk(
                    context
                ),

            opportunity:
                analyzeOpportunity(
                    context
                )

        };

        state.analyses =
            analyses;

        state.status.analysisComplete =
            true;

        state.status.ready =
            true;

        state.status.lastUpdated =
            now();

        state.metadata.updatedAt =
            now();

        persist();

        emit(
            "analysis-complete",
            {
                analyses:
                    Object.keys(
                        analyses
                    )
            }
        );

        return getAnalyses();

    }

    /*
    ========================================================
    SPECIALIZED ANALYSIS BRIDGES
    ========================================================
    */

    function analyzeLocation(
        context
    ) {

        return callAnalysisModule(
            "ROlyfeLocationAI",
            "analyze",
            context,
            buildGenericAnalysis(
                "location",
                context
            )
        );

    }

    function analyzeProperty(
        context
    ) {

        return callAnalysisModule(
            "ROlyfePropertyAI",
            "analyze",
            context,
            buildGenericAnalysis(
                "property",
                context
            )
        );

    }

    function analyzeIncentives(
        context
    ) {

        return buildDomainAnalysis(
            "incentives",
            context
        );

    }

    function analyzeBusiness(
        context
    ) {

        return buildDomainAnalysis(
            "business",
            context
        );

    }

    function analyzeHousing(
        context
    ) {

        return buildDomainAnalysis(
            "housing",
            context
        );

    }

    function analyzeClimate(
        context
    ) {

        return buildDomainAnalysis(
            "climate",
            context
        );

    }

    function analyzeWeather(
        context
    ) {

        return buildDomainAnalysis(
            "weather",
            context
        );

    }

    function analyzeRisk(
        context
    ) {

        return buildDomainAnalysis(
            "risk",
            context
        );

    }

    function analyzeOpportunity(
        context
    ) {

        return buildDomainAnalysis(
            "opportunity",
            context
        );

    }

    function callAnalysisModule(
        moduleName,
        method,
        context,
        fallback
    ) {

        const module =
            getModule(
                moduleName
            );

        if (
            !module ||
            typeof module[method] !==
                "function"
        ) {

            return fallback;

        }

        try {

            return safeClone(
                module[method](
                    context
                )
            );

        } catch (error) {

            return fallback;

        }

    }

    /*
    ========================================================
    DOMAIN ANALYSIS
    ========================================================
    */

    function buildDomainAnalysis(
        domain,
        context
    ) {

        const source =
            context.modules &&
            context.modules[domain]
                ? context.modules[domain]
                : null;

        const available =
            Boolean(
                source &&
                source.available
            );

        const profile =
            available
                ? (
                    source.profile ||
                    source.aiContext ||
                    source.sharedContext ||
                    {}
                )
                : {};

        const aiContext =
            available
                ? (
                    source.aiContext ||
                    {}
                )
                : {};

        const signals =
            extractSignals(
                profile,
                aiContext
            );

        const findings =
            extractFindings(
                profile,
                aiContext
            );

        const actions =
            extractActions(
                profile,
                aiContext
            );

        const gaps =
            extractGaps(
                profile,
                aiContext
            );

        return {

            domain,

            available,

            summary:
                buildDomainSummary(
                    domain,
                    available,
                    signals,
                    findings,
                    gaps
                ),

            signals:
                limit(
                    signals,
                    CONFIG.maxSignals
                ),

            findings:
                limit(
                    findings,
                    CONFIG.maxFindings
                ),

            actions:
                limit(
                    actions,
                    CONFIG.maxActions
                ),

            gaps:
                limit(
                    gaps,
                    CONFIG.maxActions
                ),

            source:
                domain,

            sourceContext:
                safeClone(
                    profile
                )

        };

    }

    function buildGenericAnalysis(
        domain,
        context
    ) {

        return {

            domain,

            available: true,

            summary:
                "The " +
                domain +
                " analysis layer is available through the RO'Lyfe AI context.",

            signals: [],

            findings: [],

            actions: [],

            gaps: [],

            source:
                domain,

            sourceContext:
                safeClone(
                    context.modules[domain]
                )

        };

    }

    /*
    ========================================================
    DATA EXTRACTION
    ========================================================
    */

    function extractSignals(
        profile,
        aiContext
    ) {

        const signals = [];

        if (
            profile &&
            Array.isArray(
                profile.signals
            )
        ) {

            signals.push(
                ...profile.signals
            );

        }

        if (
            aiContext &&
            Array.isArray(
                aiContext.signals
            )
        ) {

            signals.push(
                ...aiContext.signals
            );

        }

        return dedupeObjects(
            signals
        );

    }

    function extractFindings(
        profile,
        aiContext
    ) {

        const findings = [];

        if (
            profile &&
            Array.isArray(
                profile.findings
            )
        ) {

            findings.push(
                ...profile.findings
            );

        }

        if (
            aiContext &&
            Array.isArray(
                aiContext.findings
            )
        ) {

            findings.push(
                ...aiContext.findings
            );

        }

        return dedupeObjects(
            findings
        );

    }

    function extractActions(
        profile,
        aiContext
    ) {

        const actions = [];

        if (
            profile &&
            Array.isArray(
                profile.actions
            )
        ) {

            actions.push(
                ...profile.actions
            );

        }

        if (
            aiContext &&
            Array.isArray(
                aiContext.actions
            )
        ) {

            actions.push(
                ...aiContext.actions
            );

        }

        return dedupeObjects(
            actions
        );

    }

    function extractGaps(
        profile,
        aiContext
    ) {

        const gaps = [];

        if (
            profile &&
            Array.isArray(
                profile.gaps
            )
        ) {

            gaps.push(
                ...profile.gaps
            );

        }

        if (
            aiContext &&
            Array.isArray(
                aiContext.gaps
            )
        ) {

            gaps.push(
                ...aiContext.gaps
            );

        }

        return dedupeObjects(
            gaps
        );

    }

    function dedupeObjects(
        values
    ) {

        const seen =
            new Set();

        const output = [];

        values.forEach(
            function (value) {

                let key;

                try {

                    key =
                        JSON.stringify(
                            value
                        );

                } catch (error) {

                    key =
                        String(value);

                }

                if (
                    !seen.has(key)
                ) {

                    seen.add(key);

                    output.push(
                        value
                    );

                }

            }
        );

        return output;

    }

    /*
    ========================================================
    DOMAIN SUMMARY
    ========================================================
    */

    function buildDomainSummary(
        domain,
        available,
        signals,
        findings,
        gaps
    ) {

        if (!available) {

            return (
                "The " +
                domain +
                " intelligence module is not currently available."
            );

        }

        if (
            signals.length === 0 &&
            findings.length === 0
        ) {

            return (
                "The " +
                domain +
                " module is available, but additional structured data is needed for deeper analysis."
            );

        }

        return (
            "The " +
            domain +
            " intelligence layer is available with " +
            signals.length +
            " signal(s), " +
            findings.length +
            " finding(s), and " +
            gaps.length +
            " identified data gap(s)."
        );

    }

    /*
    ========================================================
    EXECUTIVE SUMMARY
    ========================================================
    */

    function buildExecutiveSummary(
        context,
        analyses
    ) {

        const location =
            context.location || {};

        const locationLabel =
            [
                location.city,
                location.state
            ]
                .filter(Boolean)
                .join(", ") ||
            "the selected location";

        const strengths = [];

        const concerns = [];

        const gaps = [];

        Object.keys(
            analyses
        ).forEach(
            function (domain) {

                const analysis =
                    analyses[domain];

                if (!analysis) {
                    return;
                }

                analysis.signals
                    .slice(0, 5)
                    .forEach(
                        function (signal) {

                            if (
                                signal.level ===
                                    "positive" ||
                                signal.type ===
                                    "positive"
                            ) {

                                strengths.push(
                                    {
                                        domain,
                                        signal
                                    }
                                );

                            }

                            if (
                                signal.level ===
                                    "warning" ||
                                signal.type ===
                                    "warning"
                            ) {

                                concerns.push(
                                    {
                                        domain,
                                        signal
                                    }
                                );

                            }

                        }
                    );

                analysis.gaps
                    .slice(0, 5)
                    .forEach(
                        function (gap) {

                            gaps.push(
                                {
                                    domain,
                                    gap
                                }
                            );

                        }
                    );

            }
        );

        return {

            location:
                locationLabel,

            strengths:
                strengths.slice(0, 15),

            concerns:
                concerns.slice(0, 15),

            gaps:
                gaps.slice(0, 15),

            narrative:
                buildNarrative(
                    locationLabel,
                    strengths,
                    concerns,
                    gaps
                )

        };

    }

    function buildNarrative(
        locationLabel,
        strengths,
        concerns,
        gaps
    ) {

        let narrative =
            "RO'Lyfe has assembled a relocation intelligence context for " +
            locationLabel +
            ".";

        if (strengths.length) {

            narrative +=
                " The available data contains positive signals across one or more intelligence domains.";

        }

        if (concerns.length) {

            narrative +=
                " Some areas contain conditions or signals that should be reviewed before making a decision.";

        }

        if (gaps.length) {

            narrative +=
                " Additional data verification is still needed in some areas.";

        }

        narrative +=
            " The purpose of the analysis is to explain the available evidence and tradeoffs, not to make the decision for the user.";

        return narrative;

    }

    /*
    ========================================================
    USER QUESTION → AI CONTEXT
    ========================================================
    */

    function prepareQuestion(
        question,
        options = {}
    ) {

        const context =
            state.context ||
            buildContext(
                options
            );

        const analyses =
            state.analyses;

        const executive =
            buildExecutiveSummary(
                context,
                analyses
            );

        return {

            schema:
                "ROlyfe-AI-Question-v1",

            question:
                text(question),

            context:
                safeClone(context),

            analyses:
                safeClone(analyses),

            executive:
                executive,

            instructions: [

                "Answer using the supplied RO'Lyfe context.",

                "Clearly distinguish facts, signals, analysis, and uncertainty.",

                "Do not invent missing information.",

                "Identify missing data when it materially affects the answer.",

                "If an incentive is mentioned, explain that eligibility and availability must be verified.",

                "If comparing locations, present the relevant dimensions and tradeoffs without declaring a universal winner.",

                "Use the user's stated priorities when they are available.",

                "Keep the final decision with the user."

            ],

            generatedAt:
                now()

        };

    }

    /*
    ========================================================
    PROMPT BUILDER
    ========================================================

    This creates a provider-neutral prompt.

    A future server-side AI gateway can consume this
    without exposing credentials in the browser.

    ========================================================
    */

    function buildPrompt(
        question,
        options = {}
    ) {

        const packet =
            prepareQuestion(
                question,
                options
            );

        return (

            "You are the RO'Lyfe Relocation Intelligence Advisor.\n\n" +

            "USER QUESTION:\n" +
            packet.question +
            "\n\n" +

            "LOCATION CONTEXT:\n" +
            JSON.stringify(
                packet.context.location,
                null,
                2
            ) +
            "\n\n" +

            "RO'LYFE INTELLIGENCE:\n" +
            JSON.stringify(
                packet.analyses,
                null,
                2
            ) +
            "\n\n" +

            "EXECUTIVE CONTEXT:\n" +
            packet.executive.narrative +
            "\n\n" +

            "RULES:\n" +
            packet.instructions
                .map(
                    function (item) {
                        return "- " + item;
                    }
                )
                .join("\n") +

            "\n\n" +

            "Provide a clear, evidence-aware response."

        );

    }

    /*
    ========================================================
    RESPONSE INGESTION
    ========================================================
    */

    function ingestResponse(
        response,
        metadata = {}
    ) {

        const normalized = {

            id:
                metadata.id ||
                "response-" +
                Date.now(),

            provider:
                metadata.provider ||
                CONFIG.provider,

            model:
                metadata.model ||
                "",

            text:
                extractResponseText(
                    response
                ),

            raw:
                safeClone(
                    response
                ),

            timestamp:
                now(),

            metadata:
                safeClone(
                    metadata
                )

        };

        state.lastResponse =
            normalized;

        state.messages.push(
            normalized
        );

        /*
        Keep browser state reasonably small.
        */

        if (
            state.messages.length >
            25
        ) {

            state.messages =
                state.messages.slice(
                    -25
                );

        }

        state.metadata.updatedAt =
            now();

        persist();

        emit(
            "response-ingested",
            {
                response:
                    normalized
            }
        );

        return safeClone(
            normalized
        );

    }

    function extractResponseText(
        response
    ) {

        if (
            typeof response ===
                "string"
        ) {

            return response;

        }

        if (!response) {

            return "";

        }

        return (
            response.text ||
            response.message ||
            response.content ||
            response.output ||
            ""
        );

    }

    /*
    ========================================================
    SPECIALIZED AI BRIDGES
    ========================================================
    */

    function askAdvisor(
        question,
        options = {}
    ) {

        const advisor =
            getModule(
                "ROlyfeAIAdvisor"
            );

        if (
            advisor &&
            typeof advisor.ask ===
                "function"
        ) {

            try {

                return advisor.ask(
                    question,
                    {
                        ...options,

                        context:
                            state.context ||
                            buildContext(
                                options
                            ),

                        analyses:
                            state.analyses

                    }
                );

            } catch (error) {

                console.warn(
                    "[RO'Lyfe AI] advisor error:",
                    error
                );

            }

        }

        return {

            success: false,

            mode:
                "CONTEXT_ONLY",

            question:
                text(question),

            prompt:
                buildPrompt(
                    question,
                    options
                ),

            context:
                getContext(),

            message:
                "AI provider is not connected. A provider-neutral AI context and prompt have been prepared."

        };

    }

    /*
    ========================================================
    LOCATION ANALYSIS BRIDGE
    ========================================================
    */

    function askLocation(
        question,
        options = {}
    ) {

        const module =
            getModule(
                "ROlyfeLocationAnalysis"
            );

        if (
            module &&
            typeof module.analyze ===
                "function"
        ) {

            return module.analyze(
                {
                    question,
                    context:
                        state.context ||
                        buildContext(
                            options
                        )
                }
            );

        }

        return buildDomainQuestion(
            "location",
            question,
            options
        );

    }

    /*
    ========================================================
    PROPERTY ANALYSIS BRIDGE
    ========================================================
    */

    function askProperty(
        question,
        options = {}
    ) {

        const module =
            getModule(
                "ROlyfePropertyAnalysis"
            );

        if (
            module &&
            typeof module.analyze ===
                "function"
        ) {

            return module.analyze(
                {
                    question,
                    context:
                        state.context ||
                        buildContext(
                            options
                        )
                }
            );

        }

        return buildDomainQuestion(
            "property",
            question,
            options
        );

    }

    function buildDomainQuestion(
        domain,
        question,
        options = {}
    ) {

        const context =
            state.context ||
            buildContext(
                options
            );

        const analysis =
            state.analyses[
                domain
            ];

        return {

            success: false,

            mode:
                "CONTEXT_ONLY",

            domain,

            question:
                text(question),

            analysis:
                safeClone(
                    analysis
                ),

            prompt:
                buildPrompt(
                    question,
                    options
                )

        };

    }

    /*
    ========================================================
    CROSS-MODULE REASONING
    ========================================================
    */

    function buildDecisionMatrix() {

        const analyses =
            state.analyses;

        const matrix = {

            life: collectDomainData(
                [
                    "climate",
                    "weather",
                    "housing"
                ],
                analyses
            ),

            money: collectDomainData(
                [
                    "housing",
                    "incentives",
                    "business"
                ],
                analyses
            ),

            risk: collectDomainData(
                [
                    "risk",
                    "weather",
                    "climate"
                ],
                analyses
            ),

            opportunity: collectDomainData(
                [
                    "business",
                    "property",
                    "opportunity",
                    "incentives"
                ],
                analyses
            )

        };

        return matrix;

    }

    function collectDomainData(
        domains,
        analyses
    ) {

        const result = {

            domains: [],

            signals: [],

            findings: [],

            gaps: []

        };

        domains.forEach(
            function (domain) {

                const analysis =
                    analyses[
                        domain
                    ];

                if (!analysis) {
                    return;
                }

                result.domains.push(
                    domain
                );

                result.signals.push(
                    ...array(
                        analysis.signals
                    )
                );

                result.findings.push(
                    ...array(
                        analysis.findings
                    )
                );

                result.gaps.push(
                    ...array(
                        analysis.gaps
                    )
                );

            }
        );

        result.signals =
            limit(
                dedupeObjects(
                    result.signals
                ),
                CONFIG.maxSignals
            );

        result.findings =
            limit(
                dedupeObjects(
                    result.findings
                ),
                CONFIG.maxFindings
            );

        result.gaps =
            limit(
                dedupeObjects(
                    result.gaps
                ),
                CONFIG.maxActions
            );

        return result;

    }

    /*
    ========================================================
    GETTERS
    ========================================================
    */

    function getContext() {

        return safeClone(
            state.context
        );

    }

    function getAnalyses() {

        return safeClone(
            state.analyses
        );

    }

    function getExecutiveSummary() {

        return buildExecutiveSummary(
            state.context ||
                buildContext(),
            state.analyses
        );

    }

    function getDecisionMatrix() {

        return buildDecisionMatrix();

    }

    function getLastResponse() {

        return safeClone(
            state.lastResponse
        );

    }

    function getMessages() {

        return safeClone(
            state.messages
        );

    }

    function getState() {

        return safeClone(
            state
        );

    }

    function getStatus() {

        return safeClone(
            state.status
        );

    }

    /*
    ========================================================
    USER PROFILE
    ========================================================
    */

    function setUserProfile(
        profile = {}
    ) {

        state.userProfile = {

            ...state.userProfile,

            ...profile

        };

        state.metadata.updatedAt =
            now();

        persist();

        emit(
            "profile-updated",
            {
                profile:
                    state.userProfile
            }
        );

        return getUserProfile();

    }

    function getUserProfile() {

        return safeClone(
            state.userProfile
        );

    }

    function setPreferences(
        preferences = {}
    ) {

        state.preferences = {

            ...state.preferences,

            ...preferences

        };

        state.metadata.updatedAt =
            now();

        persist();

        return safeClone(
            state.preferences
        );

    }

    function getPreferences() {

        return safeClone(
            state.preferences
        );

    }

    /*
    ========================================================
    PERSISTENCE
    ========================================================
    */

    function persist() {

        if (
            typeof localStorage ===
                "undefined"
        ) {

            return;

        }

        try {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(
                    state
                )
            );

        } catch (error) {

            console.warn(
                "[RO'Lyfe AI] storage error:",
                error
            );

        }

    }

    function restore() {

        if (
            typeof localStorage ===
                "undefined"
        ) {

            return false;

        }

        try {

            const raw =
                localStorage.getItem(
                    STORAGE_KEY
                );

            if (!raw) {

                return false;

            }

            const saved =
                JSON.parse(
                    raw
                );

            if (
                !saved ||
                typeof saved !==
                    "object"
            ) {

                return false;

            }

            state = {

                ...createInitialState(),

                ...saved,

                analyses: {

                    ...createInitialState()
                        .analyses,

                    ...(saved.analyses || {})

                },

                status: {

                    ...createInitialState()
                        .status,

                    ...(saved.status || {})

                },

                metadata: {

                    ...createInitialState()
                        .metadata,

                    ...(saved.metadata || {})

                }

            };

            return true;

        } catch (error) {

            console.warn(
                "[RO'Lyfe AI] restore error:",
                error
            );

            return false;

        }

    }

    /*
    ========================================================
    RESET
    ========================================================
    */

    function reset(
        options = {}
    ) {

        state =
            createInitialState();

        if (
            options.clearStorage !== false &&
            typeof localStorage !==
                "undefined"
        ) {

            try {

                localStorage.removeItem(
                    STORAGE_KEY
                );

            } catch (error) {}

        }

        emit(
            "reset"
        );

        return getState();

    }

    /*
    ========================================================
    SUBSCRIBE
    ========================================================
    */

    function subscribe(
        callback
    ) {

        if (
            typeof callback !==
                "function"
        ) {

            return function () {};

        }

        subscribers.push(
            callback
        );

        return function unsubscribe() {

            const index =
                subscribers.indexOf(
                    callback
                );

            if (
                index !== -1
            ) {

                subscribers.splice(
                    index,
                    1
                );

            }

        };

    }

    /*
    ========================================================
    SERIALIZATION
    ========================================================
    */

    function serialize() {

        return JSON.stringify(
            getState(),
            null,
            2
        );

    }

    /*
    ========================================================
    INITIALIZATION
    ========================================================
    */

    function initialize(
        options = {}
    ) {

        if (
            state.initialized &&
            !options.force
        ) {

            return getState();

        }

        restore();

        if (
            options.userProfile
        ) {

            setUserProfile(
                options.userProfile
            );

        }

        if (
            options.preferences
        ) {

            setPreferences(
                options.preferences
            );

        }

        state.initialized =
            true;

        state.status.ready =
            true;

        state.status.lastUpdated =
            now();

        state.metadata.updatedAt =
            now();

        emit(
            "initialized",
            {
                sessionId:
                    state.sessionId
            }
        );

        if (
            options.buildContext !==
                false
        ) {

            buildContext(
                options
            );

        }

        if (
            options.analyze === true
        ) {

            analyze(
                options
            );

        }

        return getState();

    }

    /*
    ========================================================
    PUBLIC API
    ========================================================
    */

    const API = {

        MODULE_NAME,

        VERSION,

        CONFIG,

        initialize,

        reset,

        buildContext,

        collectModuleContext,

        analyze,

        prepareQuestion,

        buildPrompt,

        askAdvisor,

        askLocation,

        askProperty,

        ingestResponse,

        buildDecisionMatrix,

        getContext,

        getAnalyses,

        getExecutiveSummary,

        getDecisionMatrix,

        getLastResponse,

        getMessages,

        getUserProfile,

        setUserProfile,

        getPreferences,

        setPreferences,

        getState,

        getStatus,

        subscribe,

        serialize

    };

    /*
    ========================================================
    GLOBAL EXPORTS
    ========================================================
    */

    global.ROlyfeAI =
        API;

    global.ROLYFE_AI =
        API;

    /*
    ========================================================
    AUTO INITIALIZATION
    ========================================================
    */

    if (
        CONFIG.autoInitialize &&
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

                }
            );

        } else {

            initialize();

        }

    } else {

        initialize();

    }

})(typeof window !== "undefined"
    ? window
    : globalThis);


/*
============================================================
END OF FILE
============================================================
*/
