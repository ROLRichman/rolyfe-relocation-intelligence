/modules/ai/backups/ai.backup-v1.0.0.js

/*
============================================================
RO’LYFE RELOCATION INTELLIGENCE
AI ORCHESTRATION ENGINE
============================================================

File:
    /modules/ai/ai.js

Version:
    1.0.0

Purpose:
    Master AI orchestration layer for the RO’Lyfe Relocation
    Intelligence Center.

Architecture:

    USER
      ↓
    AI.JS
      ↓
    LOCATION ANALYSIS
      ↓
    ┌─────────────────────────────────────────────┐
    │ LOCATION                                    │
    │ CLIMATE                                     │
    │ WEATHER                                     │
    │ RISK                                        │
    │ HOUSING                                     │
    │ COST OF LIVING                              │
    │ INCENTIVES                                  │
    │ BUSINESS                                    │
    │ PROPERTY                                    │
    │ OPPORTUNITY                                 │
    └─────────────────────────────────────────────┘
      ↓
    ADVISOR
      ↓
    RESPONSE / NEXT ACTIONS

IMPORTANT:
    This module does NOT contain the underlying data engines.

    It orchestrates them.

    It can:
      - collect context
      - analyze a location
      - analyze property context
      - create AI prompts
      - create structured AI requests
      - maintain conversation history
      - produce local/offline responses
      - connect to a future secure AI endpoint
      - expose one unified API to ai.html

SECURITY:
    Never place a production OpenAI/API secret in browser
    JavaScript.

    Browser deployment should call a server-side endpoint.

============================================================
*/

(function (global) {
    "use strict";

    const VERSION = "1.0.0";

    const MODULE_NAME = "ROlyfeAI";

    const DEFAULT_CONFIG = {
        autoInitialize: true,

        storageKey:
            "rolyfe_ai_v1",

        conversationKey:
            "rolyfe_ai_conversation_v1",

        maxHistory:
            20,

        maxContextCharacters:
            50000,

        maxResponseCharacters:
            12000,

        persist:
            true,

        useLocalAnalysis:
            true,

        endpoint:
            "",

        model:
            "gpt-5.6-luna",

        temperature:
            0.2,

        timeout:
            30000,

        includeSources:
            true,

        allowPropertyAnalysis:
            true,

        allowLocationAnalysis:
            true,

        allowAdvisor:
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
       INITIAL STATE
    ====================================================== */

    function createInitialState() {
        return {
            status:
                "idle",

            mode:
                "local",

            location:
                null,

            preferences:
                {},

            context:
                null,

            locationAnalysis:
                null,

            propertyAnalysis:
                null,

            advisor:
                null,

            lastQuestion:
                "",

            lastResponse:
                "",

            conversation:
                [],

            actions:
                [],

            sources:
                [],

            metadata: {
                version:
                    VERSION,

                createdAt:
                    null,

                updatedAt:
                    null,

                requestCount:
                    0,

                contextCoverage:
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

    function text(
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

    function number(
        value,
        fallback = null
    ) {
        const n =
            Number(value);

        return Number.isFinite(n)
            ? n
            : fallback;
    }

    function array(
        value
    ) {
        if (
            Array.isArray(value)
        ) {
            return value;
        }

        if (
            value === null ||
            value === undefined
        ) {
            return [];
        }

        return [value];
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

    function unique(
        values
    ) {
        return [
            ...new Set(
                array(values)
                    .filter(Boolean)
            )
        ];
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

            detail
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
                        `rolyfe:ai:${eventName}`,
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
            typeof module[method] !==
                "function"
        ) {
            return null;
        }

        try {
            return module[
                method
            ](...args);
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
       LOCATION
    ====================================================== */

    function setLocation(
        location = {}
    ) {
        state.location =
            clone(location);

        callModule(
            "ROlyfeLocationAnalysis",
            "setLocation",
            location
        );

        state.metadata.updatedAt =
            now();

        emit(
            "location-updated",
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

        const location =
            callModule(
                "ROlyfeLocationAnalysis",
                "getLocation"
            );

        return clone(
            location
        );
    }

    /* ======================================================
       USER PREFERENCES
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
            "preferences-updated",
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
       LOCATION ANALYSIS
    ====================================================== */

    function runLocationAnalysis(
        options = {}
    ) {
        if (
            !config.allowLocationAnalysis
        ) {
            return null;
        }

        const module =
            getModule(
                "ROlyfeLocationAnalysis"
            );

        if (
            !module
        ) {
            return null;
        }

        let result = null;

        if (
            typeof module.analyze ===
                "function"
        ) {
            result =
                module.analyze(
                    {
                        location:
                            options.location ||
                            state.location,

                        preferences:
                            options.preferences ||
                            state.preferences,

                        data:
                            options.data,

                        core:
                            options.core
                    }
                );
        }

        state.locationAnalysis =
            clone(
                result
            );

        if (
            result &&
            result.location
        ) {
            state.location =
                clone(
                    result.location
                );
        }

        if (
            result &&
            result.preferences
        ) {
            state.preferences =
                clone(
                    result.preferences
                );
        }

        state.metadata.contextCoverage =
            number(
                result &&
                result.metadata &&
                result.metadata.coverage,
                0
            );

        state.metadata.updatedAt =
            now();

        emit(
            "location-analysis-complete",
            {
                result:
                    clone(
                        result
                    )
            }
        );

        return clone(
            result
        );
    }

    function getLocationAnalysis() {
        return clone(
            state.locationAnalysis ||
            callModule(
                "ROlyfeLocationAnalysis",
                "getResult"
            )
        );
    }

    /* ======================================================
       PROPERTY ANALYSIS
    ====================================================== */

    function runPropertyAnalysis(
        property = {},
        options = {}
    ) {
        if (
            !config.allowPropertyAnalysis
        ) {
            return null;
        }

        const module =
            getModule(
                "ROlyfePropertyAnalysis"
            );

        if (
            !module
        ) {
            return null;
        }

        let result = null;

        if (
            typeof module.analyze ===
                "function"
        ) {
            result =
                module.analyze(
                    Object.assign(
                        {},
                        property,
                        {
                            location:
                                options.location ||
                                state.location,

                            preferences:
                                options.preferences ||
                                state.preferences
                        }
                    )
                );
        } else if (
            typeof module.analyzeProperty ===
                "function"
        ) {
            result =
                module.analyzeProperty(
                    property
                );
        }

        state.propertyAnalysis =
            clone(
                result
            );

        state.metadata.updatedAt =
            now();

        emit(
            "property-analysis-complete",
            {
                result:
                    clone(
                        result
                    )
            }
        );

        return clone(
            result
        );
    }

    function getPropertyAnalysis() {
        return clone(
            state.propertyAnalysis
        );
    }

    /* ======================================================
       ADVISOR
    ====================================================== */

    function runAdvisor(
        question = "",
        options = {}
    ) {
        if (
            !config.allowAdvisor
        ) {
            return null;
        }

        const advisor =
            getModule(
                "ROlyfeAdvisor"
            );

        if (
            !advisor
        ) {
            return null;
        }

        const context =
            options.context ||
            buildContext(
                options
            );

        let result = null;

        if (
            typeof advisor.ask ===
                "function"
        ) {
            result =
                advisor.ask(
                    question,
                    context
                );
        } else if (
            typeof advisor.answer ===
                "function"
        ) {
            result =
                advisor.answer(
                    question,
                    context
                );
        } else if (
            typeof advisor.analyze ===
                "function"
        ) {
            result =
                advisor.analyze(
                    {
                        question,
                        context
                    }
                );
        }

        state.advisor =
            clone(
                result
            );

        return clone(
            result
        );
    }

    function getAdvisor() {
        return clone(
            state.advisor
        );
    }

    /* ======================================================
       CORE INTELLIGENCE
    ====================================================== */

    function getCoreContext() {
        const core =
            getModule(
                "ROlyfeCore"
            );

        if (
            !core
        ) {
            return null;
        }

        if (
            typeof core.buildSharedContext ===
                "function"
        ) {
            return callModule(
                "ROlyfeCore",
                "buildSharedContext"
            );
        }

        if (
            typeof core.getAIContext ===
                "function"
        ) {
            return callModule(
                "ROlyfeCore",
                "getAIContext"
            );
        }

        if (
            typeof core.getAnalysis ===
                "function"
        ) {
            return callModule(
                "ROlyfeCore",
                "getAnalysis"
            );
        }

        return null;
    }

    /* ======================================================
       CONTEXT BUILDER
    ====================================================== */

    function buildContext(
        options = {}
    ) {
        /*
            Always prefer the dedicated
            Location Analysis layer.

            This prevents AI.JS from becoming
            a second intelligence engine.
        */

        let locationAnalysis =
            options.locationAnalysis ||
            state.locationAnalysis;

        if (
            !locationAnalysis &&
            config.allowLocationAnalysis
        ) {
            locationAnalysis =
                runLocationAnalysis(
                    options
                );
        }

        const core =
            options.core ||
            getCoreContext();

        const property =
            options.propertyAnalysis ||
            state.propertyAnalysis ||
            null;

        const context = {
            system:
                "RO’Lyfe Relocation Intelligence AI",

            version:
                VERSION,

            location:
                clone(
                    state.location ||
                    (
                        locationAnalysis &&
                        locationAnalysis.location
                    )
                ),

            preferences:
                clone(
                    state.preferences ||
                    (
                        locationAnalysis &&
                        locationAnalysis.preferences
                    )
                ),

            locationAnalysis:
                clone(
                    locationAnalysis
                ),

            propertyAnalysis:
                clone(
                    property
                ),

            core:
                clone(
                    core
                ),

            userQuestion:
                text(
                    options.question
                ),

            conversation:
                clone(
                    state.conversation
                ),

            generatedAt:
                now()
        };

        return trimContext(
            context
        );
    }

    function trimContext(
        context
    ) {
        let serialized;

        try {
            serialized =
                JSON.stringify(
                    context
                );
        } catch (
            error
        ) {
            return context;
        }

        if (
            serialized.length <=
            config.maxContextCharacters
        ) {
            return context;
        }

        /*
            Keep the most important layers
            when the context becomes large.
        */

        return {
            system:
                context.system,

            version:
                context.version,

            location:
                context.location,

            preferences:
                context.preferences,

            locationAnalysis:
                compactLocationAnalysis(
                    context.locationAnalysis
                ),

            propertyAnalysis:
                context.propertyAnalysis
                    ? compactPropertyAnalysis(
                        context.propertyAnalysis
                    )
                    : null,

            userQuestion:
                context.userQuestion,

            conversation:
                array(
                    context.conversation
                ).slice(
                    -8
                ),

            generatedAt:
                context.generatedAt,

            contextTrimmed:
                true
        };
    }

    function compactLocationAnalysis(
        analysis
    ) {
        if (
            !analysis
        ) {
            return null;
        }

        return {
            status:
                analysis.status,

            location:
                analysis.location,

            preferences:
                analysis.preferences,

            analysis:
                analysis.analysis,

            fit:
                analysis.fit,

            signals:
                array(
                    analysis.signals
                ).slice(
                    0,
                    20
                ),

            findings:
                array(
                    analysis.findings
                ).slice(
                    0,
                    20
                ),

            tradeoffs:
                array(
                    analysis.tradeoffs
                ).slice(
                    0,
                    15
                ),

            gaps:
                array(
                    analysis.gaps
                ).slice(
                    0,
                    15
                ),

            actions:
                array(
                    analysis.actions
                ).slice(
                    0,
                    15
                ),

            summary:
                analysis.summary,

            aiContext:
                analysis.aiContext
        };
    }

    function compactPropertyAnalysis(
        analysis
    ) {
        if (
            !analysis
        ) {
            return null;
        }

        return {
            status:
                analysis.status,

            property:
                analysis.property,

            location:
                analysis.location,

            analysis:
                analysis.analysis,

            signals:
                analysis.signals,

            findings:
                analysis.findings,

            gaps:
                analysis.gaps,

            actions:
                analysis.actions,

            summary:
                analysis.summary
        };
    }

    /* ======================================================
       SYSTEM INSTRUCTIONS
    ====================================================== */

    function buildSystemInstructions(
        options = {}
    ) {
        const location =
            state.location;

        const locationLabel =
            formatLocation(
                location
            );

        return [
            "You are the RO’Lyfe Relocation Intelligence Advisor.",

            "Your job is to interpret structured location intelligence and help the user understand a location in relation to their stated goals.",

            `Current geographic focus: ${locationLabel}.`,

            "Use the structured data supplied to you. Do not invent missing facts.",

            "Separate documented data from interpretation.",

            "Identify the relevant geographic level whenever possible.",

            "Identify the data period when available.",

            "Current weather is not the same thing as long-term climate.",

            "Hazard exposure is not the same thing as an active weather alert.",

            "A program match does not guarantee eligibility, approval, funding, or economic benefit.",

            "Distinguish grants, loans, tax credits, tax abatements, rebates, equity, and technical assistance.",

            "Do not represent a location as universally best.",

            "Do not assume the user's priorities.",

            "Use the user's stated preferences and goals.",

            "Explain tradeoffs openly.",

            "If important information is missing, say what is missing.",

            "When discussing housing, distinguish market statistics from individual affordability.",

            "When discussing property investment, do not treat analytical estimates as guaranteed returns.",

            "When discussing business opportunities, distinguish economic data from forecasts.",

            "When discussing incentives, recommend verification of current eligibility, deadlines, funding, and program rules.",

            "If the user asks what they should investigate next, use the Actions and Gaps generated by the intelligence engine.",

            "The purpose is decision support, not replacing the user's judgment."
        ].join(
            "\n"
        );
    }

    /* ======================================================
       PROMPT BUILDER
    ====================================================== */

    function buildPrompt(
        question = "",
        options = {}
    ) {
        const context =
            options.context ||
            buildContext(
                {
                    question,
                    locationAnalysis:
                        options.locationAnalysis,
                    propertyAnalysis:
                        options.propertyAnalysis,
                    core:
                        options.core
                }
            );

        const instructions =
            options.systemInstructions ||
            buildSystemInstructions(
                options
            );

        return {
            system:
                instructions,

            user:
                buildUserPrompt(
                    question,
                    context,
                    options
                ),

            context
        };
    }

    function buildUserPrompt(
        question,
        context,
        options = {}
    ) {
        const outputFormat =
            options.outputFormat ||
            "plain_text";

        return [
            "USER QUESTION:",
            text(
                question,
                "Analyze the selected location using the available intelligence."
            ),

            "",

            "RO’LYFE STRUCTURED CONTEXT:",

            safeJSONStringify(
                context
            ),

            "",

            "RESPONSE FORMAT:",

            outputFormat,

            "",

            "When useful, organize the response into:",
            "1. What the data shows",
            "2. How it relates to the user's goals",
            "3. Important tradeoffs",
            "4. Missing information",
            "5. Practical next steps"
        ].join(
            "\n"
        );
    }

    function safeJSONStringify(
        value
    ) {
        try {
            return JSON.stringify(
                value,
                null,
                2
            );
        } catch (
            error
        ) {
            return "{}";
        }
    }

    /* ======================================================
       LOCAL AI RESPONSE
    ====================================================== */

    function generateLocalResponse(
        question = "",
        options = {}
    ) {
        const context =
            options.context ||
            buildContext(
                {
                    question,
                    locationAnalysis:
                        options.locationAnalysis,
                    propertyAnalysis:
                        options.propertyAnalysis
                }
            );

        const analysis =
            context.locationAnalysis;

        if (
            !analysis
        ) {
            return {
                mode:
                    "local",

                response:
                    "I need a location profile before I can analyze this request.",

                context
            };
        }

        const location =
            formatLocation(
                context.location
            );

        const lines = [];

        lines.push(
            `RO’Lyfe Location Intelligence: ${location}`
        );

        lines.push("");

        if (
            analysis.summary
        ) {
            lines.push(
                analysis.summary
            );
        }

        lines.push("");

        const fit =
            analysis.fit &&
            analysis.fit.overall;

        if (
            fit !== null &&
            fit !== undefined
        ) {
            lines.push(
                `Preference-based analytical fit signal: ${Math.round(fit)}/100.`
            );

            lines.push(
                "This is a comparison signal based on the supplied preferences and available data, not a universal location ranking or guarantee."
            );

            lines.push("");
        }

        const signals =
            array(
                analysis.signals
            );

        if (
            signals.length
        ) {
            lines.push(
                "Key signals:"
            );

            signals
                .slice(
                    0,
                    8
                )
                .forEach(
                    signal => {
                        if (
                            signal.message
                        ) {
                            lines.push(
                                `• ${signal.message}`
                            );
                        }
                    }
                );

            lines.push("");
        }

        const tradeoffs =
            array(
                analysis.tradeoffs
            );

        if (
            tradeoffs.length
        ) {
            lines.push(
                "Tradeoffs to examine:"
            );

            tradeoffs
                .slice(
                    0,
                    6
                )
                .forEach(
                    tradeoff => {
                        if (
                            tradeoff.message
                        ) {
                            lines.push(
                                `• ${tradeoff.message}`
                            );
                        }
                    }
                );

            lines.push("");
        }

        const gaps =
            array(
                analysis.gaps
            );

        if (
            gaps.length
        ) {
            lines.push(
                "Information gaps:"
            );

            gaps
                .slice(
                    0,
                    6
                )
                .forEach(
                    gap => {
                        if (
                            gap.message
                        ) {
                            lines.push(
                                `• ${gap.message}`
                            );
                        }
                    }
                );

            lines.push("");
        }

        const actions =
            array(
                analysis.actions
            );

        if (
            actions.length
        ) {
            lines.push(
                "Next actions:"
            );

            actions
                .slice(
                    0,
                    6
                )
                .forEach(
                    action => {
                        if (
                            action.action
                        ) {
                            lines.push(
                                `• ${action.action}`
                            );
                        }
                    }
                );
        }

        return {
            mode:
                "local",

            response:
                lines.join(
                    "\n"
                ),

            context
        };
    }

    /* ======================================================
       REMOTE AI
    ====================================================== */

    async function requestRemoteAI(
        question = "",
        options = {}
    ) {
        const endpoint =
            text(
                options.endpoint ||
                config.endpoint
            );

        if (
            !endpoint
        ) {
            throw new Error(
                "No AI endpoint has been configured."
            );
        }

        const prompt =
            buildPrompt(
                question,
                options
            );

        const controller =
            typeof AbortController !==
                "undefined"
                ? new AbortController()
                : null;

        let timeoutId =
            null;

        if (
            controller
        ) {
            timeoutId =
                setTimeout(
                    () =>
                        controller.abort(),
                    config.timeout
                );
        }

        try {
            const response =
                await fetch(
                    endpoint,
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                {
                                    model:
                                        options.model ||
                                        config.model,

                                    system:
                                        prompt.system,

                                    input:
                                        prompt.user,

                                    context:
                                        prompt.context,

                                    question:
                                        question
                                }
                            ),

                        signal:
                            controller
                                ? controller.signal
                                : undefined
                    }
                );

            if (
                !response.ok
            ) {
                throw new Error(
                    `AI endpoint returned HTTP ${response.status}.`
                );
            }

            const data =
                await response.json();

            return normalizeRemoteResponse(
                data
            );
        } finally {
            if (
                timeoutId
            ) {
                clearTimeout(
                    timeoutId
                );
            }
        }
    }

    function normalizeRemoteResponse(
        data
    ) {
        /*
            Supports several possible backend
            response shapes.

            Your server can return:

            {
                response: "..."
            }

            or:

            {
                output_text: "..."
            }

            or:

            {
                answer: "..."
            }
        */

        const response =
            text(
                data &&
                (
                    data.response ||
                    data.output_text ||
                    data.answer ||
                    data.message ||
                    data.text
                )
            );

        return {
            mode:
                "remote",

            response:
                response ||
                "The AI service returned no readable response.",

            raw:
                clone(
                    data
                )
        };
    }

    /* ======================================================
       ASK
    ====================================================== */

    async function ask(
        question = "",
        options = {}
    ) {
        question =
            text(
                question
            );

        if (
            !question
        ) {
            return {
                mode:
                    "local",

                response:
                    "Tell me what you want to know about the location."
            };
        }

        state.status =
            "thinking";

        state.lastQuestion =
            question;

        state.metadata.requestCount +=
            1;

        state.metadata.updatedAt =
            now();

        emit(
            "request-started",
            {
                question
            }
        );

        /*
            Rebuild analysis when explicitly
            requested or when none exists.
        */

        if (
            options.refreshAnalysis ||
            !state.locationAnalysis
        ) {
            runLocationAnalysis(
                {
                    location:
                        options.location ||
                        state.location,

                    preferences:
                        options.preferences ||
                        state.preferences,

                    data:
                        options.data,

                    core:
                        options.core
                }
            );
        }

        const context =
            buildContext(
                {
                    question,

                    locationAnalysis:
                        state.locationAnalysis,

                    propertyAnalysis:
                        options.property
                            ? runPropertyAnalysis(
                                options.property,
                                options
                            )
                            : state.propertyAnalysis,

                    core:
                        options.core
                }
            );

        let result;

        /*
            Remote endpoint takes priority when
            configured and explicitly enabled.
        */

        const useRemote =
            (
                options.useRemote ===
                    true
            ) ||
            (
                options.useRemote !==
                    false &&
                Boolean(
                    options.endpoint ||
                    config.endpoint
                )
            );

        try {
            if (
                useRemote
            ) {
                result =
                    await requestRemoteAI(
                        question,
                        {
                            context,

                            endpoint:
                                options.endpoint ||
                                config.endpoint,

                            model:
                                options.model ||
                                config.model,

                            systemInstructions:
                                options.systemInstructions
                        }
                    );
            } else {
                result =
                    generateLocalResponse(
                        question,
                        {
                            context
                        }
                    );
            }
        } catch (
            error
        ) {
            console.warn(
                `[${MODULE_NAME}] Remote AI failed; using local analysis.`,
                error
            );

            result =
                generateLocalResponse(
                    question,
                    {
                        context
                    }
                );

            result.fallback =
                true;

            result.error =
                text(
                    error.message
                );
        }

        const finalResponse =
            limitText(
                result.response
            );

        state.lastResponse =
            finalResponse;

        state.status =
            "ready";

        addConversation(
            "user",
            question
        );

        addConversation(
            "assistant",
            finalResponse
        );

        state.metadata.updatedAt =
            now();

        persist();

        emit(
            "response-complete",
            {
                mode:
                    result.mode,

                response:
                    finalResponse
            }
        );

        return {
            mode:
                result.mode,

            response:
                finalResponse,

            context:
                clone(
                    context
                ),

            fallback:
                Boolean(
                    result.fallback
                ),

            error:
                result.error ||
                null
        };
    }

    function limitText(
        value
    ) {
        const result =
            text(
                value
            );

        if (
            result.length <=
            config.maxResponseCharacters
        ) {
            return result;
        }

        return (
            result.substring(
                0,
                config.maxResponseCharacters
            ) +
            "\n\n[Response truncated by RO’Lyfe AI context limits.]"
        );
    }

    /* ======================================================
       CONVERSATION
    ====================================================== */

    function addConversation(
        role,
        content
    ) {
        state.conversation.push(
            {
                role:
                    text(
                        role
                    ),

                content:
                    text(
                        content
                    ),

                timestamp:
                    now()
            }
        );

        if (
            state.conversation.length >
            config.maxHistory
        ) {
            state.conversation =
                state.conversation.slice(
                    -config.maxHistory
                );
        }

        return clone(
            state.conversation
        );
    }

    function getConversation() {
        return clone(
            state.conversation
        );
    }

    function clearConversation() {
        state.conversation =
            [];

        state.lastQuestion =
            "";

        state.lastResponse =
            "";

        state.metadata.updatedAt =
            now();

        persist();

        emit(
            "conversation-cleared"
        );

        return [];
    }

    /* ======================================================
       QUESTION HELPERS
    ====================================================== */

    function classifyQuestion(
        question = ""
    ) {
        const q =
            text(
                question
            ).toLowerCase();

        const intents = [];

        if (
            /move|relocat|live|living|where should/i
                .test(q)
        ) {
            intents.push(
                "relocation"
            );
        }

        if (
            /house|home|rent|mortgage|housing|buy/i
                .test(q)
        ) {
            intents.push(
                "housing"
            );
        }

        if (
            /business|company|startup|industry|job|work/i
                .test(q)
        ) {
            intents.push(
                "business"
            );
        }

        if (
            /invest|property|real estate|deal|cash flow|cap rate/i
                .test(q)
        ) {
            intents.push(
                "property"
            );
        }

        if (
            /weather|climate|hot|cold|snow|rain/i
                .test(q)
        ) {
            intents.push(
                "climate"
            );
        }

        if (
            /flood|tornado|hurricane|wildfire|earthquake|risk|hazard/i
                .test(q)
        ) {
            intents.push(
                "risk"
            );
        }

        if (
            /grant|incentive|tax credit|abatement|program|funding/i
                .test(q)
        ) {
            intents.push(
                "incentives"
            );
        }

        return unique(
            intents
        );
    }

    /* ======================================================
       SOURCES
    ====================================================== */

    function collectSources() {
        const sources = [];

        const locationAnalysis =
            state.locationAnalysis;

        if (
            !locationAnalysis
        ) {
            return [];
        }

        const domains = [
            "climate",
            "weather",
            "risk",
            "housing",
            "business",
            "incentives",
            "opportunity",
            "property"
        ];

        domains.forEach(
            domain => {
                const data =
                    locationAnalysis
                        .analysis &&
                    locationAnalysis
                        .analysis[
                            domain
                        ];

                if (
                    !data
                ) {
                    return;
                }

                array(
                    data.sources
                ).forEach(
                    source => {
                        sources.push(
                            source
                        );
                    }
                );
            }
        );

        state.sources =
            unique(
                sources.map(
                    source =>
                        typeof source ===
                            "string"
                            ? source
                            : JSON.stringify(
                                source
                            )
                )
            );

        return clone(
            state.sources
        );
    }

    /* ======================================================
       ACTIONS
    ====================================================== */

    function getNextActions() {
        const actions = [];

        const analysis =
            state.locationAnalysis;

        if (
            analysis
        ) {
            array(
                analysis.actions
            ).forEach(
                action => {
                    actions.push(
                        action
                    );
                }
            );

            array(
                analysis.gaps
            ).forEach(
                gap => {
                    actions.push(
                        {
                            type:
                                "data-gap",

                            domain:
                                gap.domain,

                            priority:
                                gap.severity,

                            action:
                                gap.message
                        }
                    );
                }
            );
        }

        return actions;
    }

    /* ======================================================
       FULL INTELLIGENCE REFRESH
    ====================================================== */

    function refresh(
        options = {}
    ) {
        state.status =
            "refreshing";

        const location =
            options.location ||
            state.location;

        const preferences =
            options.preferences ||
            state.preferences;

        if (
            location
        ) {
            setLocation(
                location
            );
        }

        if (
            preferences
        ) {
            setPreferences(
                preferences
            );
        }

        const locationAnalysis =
            runLocationAnalysis(
                {
                    location,
                    preferences,

                    data:
                        options.data,

                    core:
                        options.core
                }
            );

        state.locationAnalysis =
            clone(
                locationAnalysis
            );

        state.actions =
            getNextActions();

        state.sources =
            config.includeSources
                ? collectSources()
                : [];

        state.status =
            "ready";

        state.metadata.updatedAt =
            now();

        persist();

        emit(
            "refresh-complete",
            {
                location:
                    clone(
                        state.location
                    )
            }
        );

        return getState();
    }

    /* ======================================================
       SHARED CONTEXT
    ====================================================== */

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

            locationAnalysis:
                clone(
                    state.locationAnalysis
                ),

            propertyAnalysis:
                clone(
                    state.propertyAnalysis
                ),

            advisor:
                clone(
                    state.advisor
                ),

            conversation:
                clone(
                    state.conversation
                ),

            actions:
                clone(
                    state.actions
                ),

            sources:
                clone(
                    state.sources
                ),

            metadata:
                clone(
                    state.metadata
                )
        };
    }

    /* ======================================================
       EXPORTABLE AI REQUEST
    ====================================================== */

    function buildRequest(
        question = "",
        options = {}
    ) {
        const prompt =
            buildPrompt(
                question,
                options
            );

        return {
            version:
                VERSION,

            model:
                options.model ||
                config.model,

            question:
                text(
                    question
                ),

            system:
                prompt.system,

            input:
                prompt.user,

            context:
                prompt.context,

            metadata: {
                location:
                    clone(
                        state.location
                    ),

                intents:
                    classifyQuestion(
                        question
                    ),

                createdAt:
                    now()
            }
        };
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

            mode:
                state.mode,

            location:
                clone(
                    state.location
                ),

            contextCoverage:
                state.metadata
                    .contextCoverage,

            requestCount:
                state.metadata
                    .requestCount,

            conversationLength:
                state.conversation
                    .length,

            updatedAt:
                state.metadata
                    .updatedAt
        };
    }

    function getLastResponse() {
        return state.lastResponse;
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

        if (
            config.endpoint
        ) {
            state.mode =
                "remote";
        }

        return getConfig();
    }

    function getConfig() {
        return clone(
            config
        );
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

                        locationAnalysis:
                            state.locationAnalysis,

                        propertyAnalysis:
                            state.propertyAnalysis,

                        advisor:
                            state.advisor,

                        actions:
                            state.actions,

                        sources:
                            state.sources,

                        metadata:
                            state.metadata
                    }
                )
            );

            localStorage.setItem(
                config.conversationKey,
                JSON.stringify(
                    state.conversation
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
                raw
            ) {
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
            }

            const conversationRaw =
                localStorage.getItem(
                    config.conversationKey
                );

            if (
                conversationRaw
            ) {
                state.conversation =
                    JSON.parse(
                        conversationRaw
                    );
            }

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

            localStorage.removeItem(
                config.conversationKey
            );

            return true;
        } catch (
            error
        ) {
            return false;
        }
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
        listener
    ) {
        if (
            typeof listener !==
                "function"
        ) {
            return function () {};
        }

        listeners.push(
            listener
        );

        return function unsubscribe() {
            const index =
                listeners.indexOf(
                    listener
                );

            if (
                index !== -1
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

        state.status =
            "initialized";

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

        initialize,

        configure,

        getConfig,

        reset,

        setLocation,

        getLocation,

        setPreferences,

        getPreferences,

        runLocationAnalysis,

        getLocationAnalysis,

        runPropertyAnalysis,

        getPropertyAnalysis,

        runAdvisor,

        getAdvisor,

        getCoreContext,

        buildContext,

        buildSharedContext,

        buildSystemInstructions,

        buildPrompt,

        buildRequest,

        generateLocalResponse,

        requestRemoteAI,

        ask,

        classifyQuestion,

        collectSources,

        getNextActions,

        refresh,

        getState,

        getStatus,

        getLastResponse,

        getConversation,

        addConversation,

        clearConversation,

        persist,

        restore,

        clearPersistence,

        serialize,

        subscribe
    };

    /* ======================================================
       GLOBAL EXPORTS
    ====================================================== */

    global.ROlyfeAI =
        api;

    global.ROLYFE_AI =
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
                        once: true
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
