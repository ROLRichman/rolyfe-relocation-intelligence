/*
============================================================
RO’LYFE RELOCATION INTELLIGENCE
AI LOCATION ANALYSIS ENGINE
============================================================

File:
    /modules/ai/location-analysis.js

Version:
    1.0.0

Purpose:
    Converts the RO’Lyfe location intelligence stack into
    an AI-ready location analysis.

Architecture:

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
    OPPORTUNITY
       ↓
    AI LOCATION ANALYSIS
       ↓
    AI ADVISOR / AI.JS

Important:
    This module does NOT attempt to declare a universal
    "best" location.

    It evaluates a location against the user's stated
    preferences, priorities, constraints, and goals.

    Scores are analytical signals, not guarantees.

============================================================
*/

(function (global) {
    "use strict";

    const VERSION = "1.0.0";

    const MODULE_NAME = "ROlyfeLocationAnalysis";

    const DEFAULT_CONFIG = {
        autoInitialize: true,
        maxSignals: 30,
        maxFindings: 30,
        maxActions: 20,
        maxTradeoffs: 20,
        maxGaps: 20,
        persist: true,
        storageKey: "rolyfe_location_analysis_v1"
    };

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

    let config = Object.assign({}, DEFAULT_CONFIG);

    let state = createInitialState();

    const listeners = [];

    /* ======================================================
       INITIAL STATE
    ====================================================== */

    function createInitialState() {
        return {
            status: "idle",

            location: {
                country: "US",
                state: "",
                stateName: "",
                county: "",
                city: "",
                zip: "",
                address: "",
                latitude: null,
                longitude: null,
                level: "state"
            },

            preferences: {
                priorities: {},
                mustHave: [],
                avoid: [],
                budget: null,
                housingType: "",
                businessType: "",
                industry: "",
                relocationReason: "",
                timeline: "",
                riskTolerance: "",
                climatePreference: "",
                heatTolerance: "",
                coldTolerance: "",
                naturalHazardTolerance: "",
                homeOwnershipGoal: "",
                investmentGoal: "",
                businessGoal: "",
                familyGoal: "",
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
                property: null,
                opportunity: null,
                core: null
            },

            analysis: {
                lifestyle: {},
                financial: {},
                housing: {},
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
                dimensions: {},
                explanation: ""
            },

            summary: "",

            aiContext: null,

            metadata: {
                version: VERSION,
                createdAt: null,
                updatedAt: null,
                sourceCount: 0,
                coverage: 0
            }
        };
    }

    /* ======================================================
       HELPERS
    ====================================================== */

    function now() {
        return new Date().toISOString();
    }

    function text(value, fallback = "") {
        if (value === null || value === undefined) {
            return fallback;
        }

        return String(value).trim();
    }

    function number(value, fallback = null) {
        const n = Number(value);

        return Number.isFinite(n) ? n : fallback;
    }

    function array(value) {
        if (Array.isArray(value)) {
            return value;
        }

        if (value === null || value === undefined) {
            return [];
        }

        return [value];
    }

    function clone(value) {
        try {
            return JSON.parse(JSON.stringify(value));
        } catch (error) {
            return value;
        }
    }

    function unique(values) {
        return [...new Set(array(values).filter(Boolean))];
    }

    function clamp(value, min = 0, max = 100) {
        const n = number(value, 0);

        return Math.max(min, Math.min(max, n));
    }

    function average(values) {
        const valid = array(values)
            .map(value => number(value))
            .filter(value => value !== null);

        if (!valid.length) {
            return null;
        }

        return valid.reduce((sum, value) => sum + value, 0) / valid.length;
    }

    function get(obj, path, fallback = null) {
        if (!obj || !path) {
            return fallback;
        }

        const parts = path.split(".");
        let current = obj;

        for (const part of parts) {
            if (
                current === null ||
                current === undefined ||
                !Object.prototype.hasOwnProperty.call(current, part)
            ) {
                return fallback;
            }

            current = current[part];
        }

        return current;
    }

    function meaningful(value) {
        if (value === null || value === undefined) {
            return false;
        }

        if (typeof value === "string") {
            return value.trim().length > 0;
        }

        if (Array.isArray(value)) {
            return value.length > 0;
        }

        if (typeof value === "object") {
            return Object.keys(value).length > 0;
        }

        return true;
    }

    function normalizeScore(value) {
        if (value === null || value === undefined) {
            return null;
        }

        let n = Number(value);

        if (!Number.isFinite(n)) {
            return null;
        }

        /*
            Accept:
                0-1
                0-10
                0-100
        */

        if (n >= 0 && n <= 1) {
            n *= 100;
        } else if (n > 1 && n <= 10) {
            n *= 10;
        }

        return clamp(n);
    }

    function emit(eventName, detail = {}) {
        const event = {
            event: eventName,
            module: MODULE_NAME,
            version: VERSION,
            timestamp: now(),
            detail
        };

        listeners.slice().forEach(listener => {
            try {
                listener(event);
            } catch (error) {
                console.warn(
                    `[${MODULE_NAME}] listener error`,
                    error
                );
            }
        });

        if (
            typeof window !== "undefined" &&
            typeof window.dispatchEvent === "function" &&
            typeof CustomEvent !== "undefined"
        ) {
            try {
                window.dispatchEvent(
                    new CustomEvent(
                        `rolyfe:location-analysis:${eventName}`,
                        {
                            detail: event
                        }
                    )
                );
            } catch (error) {
                /* Browser event support is optional. */
            }
        }
    }

    /* ======================================================
       LOCATION
    ====================================================== */

    function setLocation(location = {}) {
        state.location = Object.assign(
            {},
            state.location,
            normalizeLocation(location)
        );

        state.metadata.updatedAt = now();

        emit("location-updated", {
            location: clone(state.location)
        });

        return clone(state.location);
    }

    function normalizeLocation(location = {}) {
        const source = location.location || location;

        return {
            country:
                text(
                    source.country ||
                    source.countryCode
                ) || "US",

            state:
                text(
                    source.state ||
                    source.stateCode
                ).toUpperCase(),

            stateName:
                text(
                    source.stateName ||
                    source.state_name
                ),

            county:
                text(
                    source.county ||
                    source.countyName
                ),

            city:
                text(
                    source.city ||
                    source.cityName
                ),

            zip:
                text(
                    source.zip ||
                    source.zipCode ||
                    source.postalCode
                ),

            address:
                text(source.address),

            latitude:
                number(
                    source.latitude ||
                    source.lat
                ),

            longitude:
                number(
                    source.longitude ||
                    source.lng ||
                    source.lon
                ),

            level:
                text(
                    source.level ||
                    source.geographicLevel
                ) || determineLocationLevel(source)
        };
    }

    function determineLocationLevel(location = {}) {
        if (location.zip || location.zipCode) {
            return "zip";
        }

        if (location.city || location.cityName) {
            return "city";
        }

        if (location.county || location.countyName) {
            return "county";
        }

        if (location.state || location.stateCode) {
            return "state";
        }

        return "unknown";
    }

    function getLocation() {
        return clone(state.location);
    }

    /* ======================================================
       PREFERENCES
    ====================================================== */

    function setPreferences(preferences = {}) {
        state.preferences = Object.assign(
            {},
            state.preferences,
            normalizePreferences(preferences)
        );

        state.metadata.updatedAt = now();

        emit("preferences-updated", {
            preferences: clone(state.preferences)
        });

        return clone(state.preferences);
    }

    function normalizePreferences(preferences = {}) {
        const result = Object.assign({}, preferences);

        if (preferences.priorities) {
            result.priorities = normalizePriorities(
                preferences.priorities
            );
        }

        if (preferences.mustHave) {
            result.mustHave = unique(
                array(preferences.mustHave)
            );
        }

        if (preferences.avoid) {
            result.avoid = unique(
                array(preferences.avoid)
            );
        }

        return result;
    }

    function normalizePriorities(priorities = {}) {
        const result = {};

        if (Array.isArray(priorities)) {
            priorities.forEach((item, index) => {
                const key = text(item);

                if (key) {
                    result[key] = Math.max(
                        1,
                        priorities.length - index
                    );
                }
            });

            return result;
        }

        Object.keys(priorities || {}).forEach(key => {
            const value = number(
                priorities[key],
                0
            );

            if (value > 0) {
                result[key] = value;
            }
        });

        return result;
    }

    function getPreferences() {
        return clone(state.preferences);
    }

    /* ======================================================
       SOURCE DATA
    ====================================================== */

    function setSourceData(data = {}) {
        state.sourceData = Object.assign(
            {},
            state.sourceData,
            normalizeSourceData(data)
        );

        state.metadata.updatedAt = now();

        return clone(state.sourceData);
    }

    function normalizeSourceData(data = {}) {
        const source = data.intelligence || data;

        return {
            location:
                source.location ||
                data.location ||
                null,

            climate:
                source.climate ||
                data.climate ||
                null,

            weather:
                source.weather ||
                data.weather ||
                null,

            risk:
                source.risk ||
                source.hazards ||
                data.risk ||
                data.hazards ||
                null,

            housing:
                source.housing ||
                data.housing ||
                null,

            costOfLiving:
                source.costOfLiving ||
                source.cost_of_living ||
                data.costOfLiving ||
                data.cost_of_living ||
                null,

            incentives:
                source.incentives ||
                data.incentives ||
                null,

            business:
                source.business ||
                data.business ||
                null,

            property:
                source.property ||
                data.property ||
                null,

            opportunity:
                source.opportunity ||
                data.opportunity ||
                null,

            core:
                data.core ||
                null
        };
    }

    function getSourceData() {
        return clone(state.sourceData);
    }

    /* ======================================================
       MODULE BRIDGES
    ====================================================== */

    function readModuleProfile(globalName, getterName) {
        try {
            const module = global[globalName];

            if (
                module &&
                typeof module[getterName] === "function"
            ) {
                return module[getterName]();
            }
        } catch (error) {
            console.warn(
                `[${MODULE_NAME}] Unable to read ${globalName}`,
                error
            );
        }

        return null;
    }

    function collectAvailableModules() {
        const collected = {};

        const mappings = {
            climate: [
                "ROlyfeClimate",
                "getProfile"
            ],

            weather: [
                "ROlyfeWeather",
                "getProfile"
            ],

            risk: [
                "ROlyfeRisk",
                "getProfile"
            ],

            housing: [
                "ROlyfeHousing",
                "getProfile"
            ],

            incentives: [
                "ROlyfeIncentives",
                "getProfile"
            ],

            business: [
                "ROlyfeBusiness",
                "getProfile"
            ],

            opportunity: [
                "ROlyfeOpportunityEngine",
                "getProfile"
            ]
        };

        Object.keys(mappings).forEach(domain => {
            const mapping = mappings[domain];

            const profile = readModuleProfile(
                mapping[0],
                mapping[1]
            );

            if (profile) {
                collected[domain] = profile;
            }
        });

        return collected;
    }

    function collectCoreContext() {
        try {
            if (
                global.ROlyfeCore &&
                typeof global.ROlyfeCore.buildSharedContext === "function"
            ) {
                return global.ROlyfeCore.buildSharedContext();
            }

            if (
                global.ROlyfeCore &&
                typeof global.ROlyfeCore.getAnalysis === "function"
            ) {
                return global.ROlyfeCore.getAnalysis();
            }
        } catch (error) {
            console.warn(
                `[${MODULE_NAME}] Core context unavailable`,
                error
            );
        }

        return null;
    }

    /* ======================================================
       DOMAIN ANALYSIS
    ====================================================== */

    function analyzeClimate() {
        const climate = state.sourceData.climate || {};

        return {
            available: meaningful(climate),

            comfort: extractScore(
                climate,
                [
                    "comfortScore",
                    "scores.comfort",
                    "assessment.comfortScore",
                    "profile.comfortScore"
                ]
            ),

            heat: extractScore(
                climate,
                [
                    "heatScore",
                    "scores.heat",
                    "assessment.heatScore"
                ]
            ),

            cold: extractScore(
                climate,
                [
                    "coldScore",
                    "scores.cold",
                    "assessment.coldScore"
                ]
            ),

            precipitation: extractScore(
                climate,
                [
                    "precipitationScore",
                    "scores.precipitation"
                ]
            ),

            seasonality: extractScore(
                climate,
                [
                    "seasonalityScore",
                    "scores.seasonality"
                ]
            ),

            summary:
                text(
                    climate.summary ||
                    get(climate, "assessment.summary")
                ),

            signals: normalizeSignals(
                climate.signals
            )
        };
    }

    function analyzeWeather() {
        const weather = state.sourceData.weather || {};

        const current =
            weather.current ||
            weather.conditions ||
            {};

        const alerts =
            array(
                weather.alerts ||
                get(weather, "activeAlerts") ||
                []
            );

        return {
            available: meaningful(weather),

            temperature:
                number(
                    current.temperature ??
                    current.temp
                ),

            feelsLike:
                number(
                    current.feelsLike ??
                    current.apparentTemperature
                ),

            condition:
                text(
                    current.condition ||
                    current.shortForecast ||
                    current.description
                ),

            precipitation:
                number(
                    current.precipitationProbability ??
                    current.precipitationChance
                ),

            wind:
                number(
                    current.windSpeed
                ),

            alertCount: alerts.length,

            alerts: alerts.map(normalizeAlert),

            summary:
                text(
                    weather.summary
                )
        };
    }

    function analyzeRisk() {
        const risk = state.sourceData.risk || {};

        const scores = {};

        RISK_TYPES.forEach(type => {
            const score = extractScore(
                risk,
                [
                    `${type}Score`,
                    `scores.${type}`,
                    `hazards.${type}.score`,
                    `risk.${type}.score`
                ]
            );

            if (score !== null) {
                scores[type] = score;
            }
        });

        const availableScores =
            Object.values(scores);

        const averageRisk =
            availableScores.length
                ? average(availableScores)
                : null;

        return {
            available: meaningful(risk),
            scores,
            averageExposure: averageRisk,
            highestExposure: findHighestRisk(scores),

            alerts:
                array(
                    risk.alerts ||
                    risk.activeAlerts
                ).map(normalizeAlert),

            summary:
                text(
                    risk.summary ||
                    get(risk, "assessment.summary")
                ),

            signals:
                normalizeSignals(
                    risk.signals
                )
        };
    }

    function analyzeHousing() {
        const housing = state.sourceData.housing || {};

        const medianHomePrice =
            extractNumber(
                housing,
                [
                    "medianHomePrice",
                    "median_home_price",
                    "prices.medianHomePrice",
                    "profile.medianHomePrice"
                ]
            );

        const medianRent =
            extractNumber(
                housing,
                [
                    "medianRent",
                    "median_rent",
                    "rents.medianRent",
                    "profile.medianRent"
                ]
            );

        const medianIncome =
            extractNumber(
                housing,
                [
                    "medianHouseholdIncome",
                    "median_household_income",
                    "income.medianHouseholdIncome",
                    "profile.medianHouseholdIncome"
                ]
            );

        return {
            available: meaningful(housing),

            medianHomePrice,

            medianRent,

            medianHouseholdIncome:
                medianIncome,

            homeownershipRate:
                extractNumber(
                    housing,
                    [
                        "homeownershipRate",
                        "ownership.homeownershipRate"
                    ]
                ),

            vacancyRate:
                extractNumber(
                    housing,
                    [
                        "vacancyRate",
                        "profile.vacancyRate"
                    ]
                ),

            inventory:
                extractNumber(
                    housing,
                    [
                        "inventory",
                        "listingInventory"
                    ]
                ),

            daysOnMarket:
                extractNumber(
                    housing,
                    [
                        "daysOnMarket",
                        "market.daysOnMarket"
                    ]
                ),

            affordability:
                extractScore(
                    housing,
                    [
                        "affordabilityScore",
                        "scores.affordability",
                        "assessment.affordabilityScore"
                    ]
                )
        };
    }

    function analyzeCostOfLiving() {
        const cost =
            state.sourceData.costOfLiving || {};

        return {
            available: meaningful(cost),

            overall:
                extractScore(
                    cost,
                    [
                        "overallScore",
                        "costScore",
                        "scores.overall"
                    ]
                ),

            housing:
                extractScore(
                    cost,
                    [
                        "housingScore",
                        "scores.housing"
                    ]
                ),

            transportation:
                extractScore(
                    cost,
                    [
                        "transportationScore",
                        "scores.transportation"
                    ]
                ),

            utilities:
                extractScore(
                    cost,
                    [
                        "utilitiesScore",
                        "scores.utilities"
                    ]
                ),

            groceries:
                extractScore(
                    cost,
                    [
                        "groceriesScore",
                        "scores.groceries"
                    ]
                ),

            healthcare:
                extractScore(
                    cost,
                    [
                        "healthcareScore",
                        "scores.healthcare"
                    ]
                ),

            index:
                extractNumber(
                    cost,
                    [
                        "costOfLivingIndex",
                        "index",
                        "overallIndex"
                    ]
                )
        };
    }

    function analyzeIncentives() {
        const incentives =
            state.sourceData.incentives || {};

        const programs =
            array(
                incentives.programs ||
                incentives.matches ||
                incentives.opportunities
            );

        return {
            available: meaningful(incentives),

            programCount:
                programs.length,

            matches:
                programs
                    .slice(0, config.maxActions)
                    .map(normalizeProgram),

            grants:
                countProgramType(
                    programs,
                    [
                        "grant",
                        "grants"
                    ]
                ),

            loans:
                countProgramType(
                    programs,
                    [
                        "loan",
                        "loans"
                    ]
                ),

            taxCredits:
                countProgramType(
                    programs,
                    [
                        "tax_credit",
                        "tax-credit",
                        "tax credit"
                    ]
                ),

            abatements:
                countProgramType(
                    programs,
                    [
                        "tax_abatement",
                        "abatement"
                    ]
                ),

            summary:
                text(
                    incentives.summary
                )
        };
    }

    function analyzeBusiness() {
        const business =
            state.sourceData.business || {};

        const matches =
            array(
                business.matches ||
                business.programs ||
                business.opportunities
            );

        return {
            available: meaningful(business),

            businessReadiness:
                extractScore(
                    business,
                    [
                        "businessReadiness",
                        "metrics.businessReadiness",
                        "scores.businessReadiness"
                    ]
                ),

            economicCoverage:
                extractScore(
                    business,
                    [
                        "economicCoverage",
                        "metrics.economicCoverage"
                    ]
                ),

            industryCoverage:
                extractScore(
                    business,
                    [
                        "industryCoverage",
                        "metrics.industryCoverage"
                    ]
                ),

            populationGrowth:
                extractNumber(
                    business,
                    [
                        "economicData.populationGrowth",
                        "economic.populationGrowth",
                        "populationGrowth"
                    ]
                ),

            jobGrowth:
                extractNumber(
                    business,
                    [
                        "economicData.jobGrowth",
                        "economic.jobGrowth",
                        "jobGrowth"
                    ]
                ),

            establishmentCount:
                extractNumber(
                    business,
                    [
                        "economicData.establishmentCount",
                        "economic.establishments",
                        "establishmentCount"
                    ]
                ),

            majorEmployers:
                array(
                    get(
                        business,
                        "economicData.majorEmployers"
                    ) ||
                    business.majorEmployers
                ),

            programMatches:
                matches
                    .slice(0, config.maxActions)
                    .map(normalizeProgram),

            summary:
                text(
                    business.summary
                )
        };
    }

    function analyzeOpportunity() {
        const opportunity =
            state.sourceData.opportunity || {};

        return {
            available:
                meaningful(opportunity),

            dataCoverage:
                extractScore(
                    opportunity,
                    [
                        "metrics.dataCoverage",
                        "dataCoverage"
                    ]
                ),

            opportunityCoverage:
                extractScore(
                    opportunity,
                    [
                        "metrics.opportunityCoverage",
                        "opportunityCoverage"
                    ]
                ),

            propertyReadiness:
                extractScore(
                    opportunity,
                    [
                        "metrics.propertyReadiness",
                        "propertyReadiness"
                    ]
                ),

            businessReadiness:
                extractScore(
                    opportunity,
                    [
                        "metrics.businessReadiness",
                        "businessReadiness"
                    ]
                ),

            capitalReadiness:
                extractScore(
                    opportunity,
                    [
                        "metrics.capitalReadiness",
                        "capitalReadiness"
                    ]
                ),

            relocationReadiness:
                extractScore(
                    opportunity,
                    [
                        "metrics.relocationReadiness",
                        "relocationReadiness"
                    ]
                ),

            pathways:
                array(
                    opportunity.pathways ||
                    opportunity.opportunityPathways
                ),

            summary:
                text(
                    opportunity.summary
                )
        };
    }

    function analyzeProperty() {
        const property =
            state.sourceData.property || {};

        return {
            available:
                meaningful(property),

            propertyType:
                text(
                    property.type ||
                    property.propertyType
                ),

            purchasePrice:
                extractNumber(
                    property,
                    [
                        "purchase_price",
                        "purchasePrice",
                        "price"
                    ]
                ),

            arv:
                extractNumber(
                    property,
                    [
                        "arv",
                        "afterRepairValue"
                    ]
                ),

            rehab:
                extractNumber(
                    property,
                    [
                        "rehab",
                        "rehabCost"
                    ]
                ),

            capRate:
                extractNumber(
                    property,
                    [
                        "capRate",
                        "investment.capRate"
                    ]
                ),

            cashFlow:
                extractNumber(
                    property,
                    [
                        "cashFlow",
                        "investment.cashFlow"
                    ]
                ),

            summary:
                text(
                    property.summary
                )
        };
    }

    /* ======================================================
       ANALYSIS PIPELINE
    ====================================================== */

    function analyze(input = {}) {
        state.status = "analyzing";
        state.metadata.updatedAt = now();

        if (input.location) {
            setLocation(input.location);
        }

        if (input.preferences) {
            setPreferences(input.preferences);
        }

        const moduleData =
            collectAvailableModules();

        if (Object.keys(moduleData).length) {
            state.sourceData = Object.assign(
                {},
                state.sourceData,
                moduleData
            );
        }

        if (input.data) {
            setSourceData(input.data);
        }

        const coreContext =
            input.core ||
            collectCoreContext();

        if (coreContext) {
            state.sourceData.core = coreContext;
        }

        state.analysis = {
            lifestyle: analyzeLifestyle(),
            financial: analyzeFinancial(),
            housing: analyzeHousing(),
            climate: analyzeClimate(),
            weather: analyzeWeather(),
            risk: analyzeRisk(),
            business: analyzeBusiness(),
            incentives: analyzeIncentives(),
            opportunity: analyzeOpportunity(),
            property: analyzeProperty()
        };

        state.signals = buildSignals();
        state.findings = buildFindings();
        state.tradeoffs = buildTradeoffs();
        state.gaps = buildGaps();
        state.actions = buildActions();

        state.fit = calculateFit();
        state.summary = buildSummary();

        state.aiContext = buildAIContext();

        state.metadata.coverage =
            calculateCoverage();

        state.metadata.sourceCount =
            countSources();

        state.status = "ready";
        state.metadata.updatedAt = now();

        persist();

        emit("analysis-complete", {
            location: clone(state.location),
            fit: clone(state.fit),
            coverage: state.metadata.coverage
        });

        return getResult();
    }

    /* ======================================================
       LIFESTYLE
    ====================================================== */

    function analyzeLifestyle() {
        return {
            climatePreference:
                state.preferences.climatePreference,

            heatTolerance:
                state.preferences.heatTolerance,

            coldTolerance:
                state.preferences.coldTolerance,

            riskTolerance:
                state.preferences.riskTolerance,

            relocationReason:
                state.preferences.relocationReason,

            familyGoal:
                state.preferences.familyGoal,

            homeOwnershipGoal:
                state.preferences.homeOwnershipGoal,

            investmentGoal:
                state.preferences.investmentGoal,

            businessGoal:
                state.preferences.businessGoal
        };
    }

    /* ======================================================
       FINANCIAL
    ====================================================== */

    function analyzeFinancial() {
        const housing =
            state.analysis.housing;

        const cost =
            analyzeCostOfLiving();

        return {
            budget:
                state.preferences.budget,

            medianHomePrice:
                housing.medianHomePrice,

            medianRent:
                housing.medianRent,

            medianIncome:
                housing.medianHouseholdIncome,

            homePriceToIncome:
                calculateHomePriceToIncome(
                    housing.medianHomePrice,
                    housing.medianHouseholdIncome
                ),

            rentToIncome:
                calculateRentToIncome(
                    housing.medianRent,
                    housing.medianHouseholdIncome
                ),

            costIndex:
                cost.index,

            costScore:
                cost.overall
        };
    }

    function calculateHomePriceToIncome(
        homePrice,
        income
    ) {
        if (
            !Number.isFinite(homePrice) ||
            !Number.isFinite(income) ||
            income <= 0
        ) {
            return null;
        }

        return Number(
            (homePrice / income).toFixed(2)
        );
    }

    function calculateRentToIncome(
        monthlyRent,
        annualIncome
    ) {
        if (
            !Number.isFinite(monthlyRent) ||
            !Number.isFinite(annualIncome) ||
            annualIncome <= 0
        ) {
            return null;
        }

        return Number(
            ((monthlyRent * 12) / annualIncome * 100)
                .toFixed(2)
        );
    }

    /* ======================================================
       SIGNAL ENGINE
    ====================================================== */

    function buildSignals() {
        const signals = [];

        const climate =
            state.analysis.climate;

        const weather =
            state.analysis.weather;

        const risk =
            state.analysis.risk;

        const housing =
            state.analysis.housing;

        const business =
            state.analysis.business;

        const incentives =
            state.analysis.incentives;

        const opportunity =
            state.analysis.opportunity;

        if (climate.available) {
            signals.push({
                domain: "climate",
                type: "available",
                level: "info",
                message:
                    "Long-term climate data is available for this location."
            });
        }

        if (weather.available) {
            signals.push({
                domain: "weather",
                type: "available",
                level: "info",
                message:
                    "Current or near-term weather data is available."
            });
        }

        if (weather.alertCount > 0) {
            signals.push({
                domain: "weather",
                type: "active-alerts",
                level: "attention",
                message:
                    `${weather.alertCount} active weather alert(s) were detected.`
            });
        }

        if (
            risk.highestExposure &&
            risk.highestExposure.score !== null
        ) {
            signals.push({
                domain: "risk",
                type: "highest-exposure",
                level: "attention",
                hazard:
                    risk.highestExposure.type,
                score:
                    risk.highestExposure.score,
                message:
                    `The current risk dataset identifies ${risk.highestExposure.type} as the highest available exposure category.`
            });
        }

        if (
            housing.medianHomePrice !== null
        ) {
            signals.push({
                domain: "housing",
                type: "home-price",
                level: "info",
                value:
                    housing.medianHomePrice,
                message:
                    "Housing price data is available for affordability analysis."
            });
        }

        if (
            housing.medianRent !== null
        ) {
            signals.push({
                domain: "housing",
                type: "rent",
                level: "info",
                value:
                    housing.medianRent,
                message:
                    "Rental market data is available."
            });
        }

        if (
            business.populationGrowth !== null
        ) {
            signals.push({
                domain: "business",
                type: "population-growth",
                level:
                    business.populationGrowth > 0
                        ? "positive"
                        : "attention",
                value:
                    business.populationGrowth,
                message:
                    `Population growth data: ${business.populationGrowth}.`
            });
        }

        if (
            business.jobGrowth !== null
        ) {
            signals.push({
                domain: "business",
                type: "job-growth",
                level:
                    business.jobGrowth > 0
                        ? "positive"
                        : "attention",
                value:
                    business.jobGrowth,
                message:
                    `Job growth data: ${business.jobGrowth}.`
            });
        }

        if (
            incentives.programCount > 0
        ) {
            signals.push({
                domain: "incentives",
                type: "programs",
                level: "positive",
                count:
                    incentives.programCount,
                message:
                    `${incentives.programCount} incentive or business-support program record(s) are available.`
            });
        }

        if (
            opportunity.relocationReadiness !== null
        ) {
            signals.push({
                domain: "opportunity",
                type: "relocation-readiness",
                level: "info",
                score:
                    opportunity.relocationReadiness,
                message:
                    "The opportunity engine has generated a relocation-readiness signal."
            });
        }

        return signals.slice(
            0,
            config.maxSignals
        );
    }

    /* ======================================================
       FINDINGS
    ====================================================== */

    function buildFindings() {
        const findings = [];

        const preferences =
            state.preferences;

        const climate =
            state.analysis.climate;

        const risk =
            state.analysis.risk;

        const housing =
            state.analysis.housing;

        const business =
            state.analysis.business;

        const incentives =
            state.analysis.incentives;

        const opportunity =
            state.analysis.opportunity;

        if (
            preferences.climatePreference &&
            climate.available
        ) {
            findings.push({
                domain: "climate",
                type: "preference-review",
                message:
                    "Climate preferences can now be compared with available climate data."
            });
        }

        if (
            preferences.riskTolerance &&
            risk.available
        ) {
            findings.push({
                domain: "risk",
                type: "tolerance-review",
                message:
                    "Natural-hazard exposure should be interpreted against the user's stated risk tolerance."
            });
        }

        if (
            preferences.homeOwnershipGoal &&
            housing.available
        ) {
            findings.push({
                domain: "housing",
                type: "ownership-review",
                message:
                    "Housing data can be evaluated against the user's ownership objective."
            });
        }

        if (
            preferences.businessGoal &&
            business.available
        ) {
            findings.push({
                domain: "business",
                type: "business-review",
                message:
                    "Business conditions and programs can be evaluated against the user's business objective."
            });
        }

        if (
            incentives.programCount > 0
        ) {
            findings.push({
                domain: "incentives",
                type: "program-review",
                message:
                    "Potential programs have been identified but eligibility and funding availability require verification."
            });
        }

        if (
            opportunity.available
        ) {
            findings.push({
                domain: "opportunity",
                type: "pathway-review",
                message:
                    "Property, business, capital, and relocation pathways can be evaluated together."
            });
        }

        return findings.slice(
            0,
            config.maxFindings
        );
    }

    /* ======================================================
       TRADEOFF ENGINE
    ====================================================== */

    function buildTradeoffs() {
        const tradeoffs = [];

        const housing =
            state.analysis.housing;

        const risk =
            state.analysis.risk;

        const business =
            state.analysis.business;

        const incentives =
            state.analysis.incentives;

        const climate =
            state.analysis.climate;

        if (
            housing.medianHomePrice !== null &&
            housing.medianHouseholdIncome !== null
        ) {
            const ratio =
                calculateHomePriceToIncome(
                    housing.medianHomePrice,
                    housing.medianHouseholdIncome
                );

            if (ratio !== null) {
                tradeoffs.push({
                    type: "housing-vs-income",
                    domain: "housing",
                    metric: "homePriceToIncome",
                    value: ratio,
                    message:
                        "Housing cost should be considered relative to local household income rather than evaluated from price alone."
                });
            }
        }

        if (
            risk.highestExposure
        ) {
            tradeoffs.push({
                type: "opportunity-vs-risk",
                domain: "risk",
                hazard:
                    risk.highestExposure.type,
                score:
                    risk.highestExposure.score,
                message:
                    "Potential opportunity should be considered alongside the location's documented hazard exposure."
            });
        }

        if (
            business.businessReadiness !== null &&
            incentives.programCount > 0
        ) {
            tradeoffs.push({
                type: "business-vs-programs",
                domain: "business",
                message:
                    "Business opportunity and available programs should be evaluated separately; a program does not guarantee business success."
            });
        }

        if (
            climate.heat !== null ||
            climate.cold !== null
        ) {
            tradeoffs.push({
                type: "climate-vs-preference",
                domain: "climate",
                message:
                    "Climate conditions should be compared with the user's heat and cold tolerance rather than treated as universally positive or negative."
            });
        }

        return tradeoffs.slice(
            0,
            config.maxTradeoffs
        );
    }

    /* ======================================================
       GAP ENGINE
    ====================================================== */

    function buildGaps() {
        const gaps = [];

        const domains = {
            climate:
                state.analysis.climate,
            weather:
                state.analysis.weather,
            risk:
                state.analysis.risk,
            housing:
                state.analysis.housing,
            business:
                state.analysis.business,
            incentives:
                state.analysis.incentives,
            opportunity:
                state.analysis.opportunity,
            property:
                state.analysis.property
        };

        Object.keys(domains).forEach(domain => {
            if (!domains[domain].available) {
                gaps.push({
                    domain,
                    severity: "medium",
                    message:
                        `No usable ${domain} data is currently available.`
                });
            }
        });

        if (
            !state.location.state &&
            !state.location.city &&
            !state.location.zip
        ) {
            gaps.push({
                domain: "location",
                severity: "high",
                message:
                    "A geographic location is required for meaningful analysis."
            });
        }

        if (
            !state.preferences.priorities ||
            !Object.keys(
                state.preferences.priorities
            ).length
        ) {
            gaps.push({
                domain: "preferences",
                severity: "medium",
                message:
                    "User priorities have not been weighted."
            });
        }

        if (
            !state.preferences.budget
        ) {
            gaps.push({
                domain: "housing",
                severity: "low",
                message:
                    "A housing or relocation budget has not been provided."
            });
        }

        if (
            !state.preferences.businessType &&
            !state.preferences.industry
        ) {
            gaps.push({
                domain: "business",
                severity: "low",
                message:
                    "No business type or industry has been specified."
            });
        }

        return gaps.slice(
            0,
            config.maxGaps
        );
    }

    /* ======================================================
       ACTION ENGINE
    ====================================================== */

    function buildActions() {
        const actions = [];

        if (
            !state.location.state &&
            !state.location.city &&
            !state.location.zip
        ) {
            actions.push({
                priority: 1,
                domain: "location",
                action:
                    "Provide a state, county, city, ZIP code, or property location."
            });
        }

        if (
            state.gaps.some(
                gap =>
                    gap.domain === "preferences"
            )
        ) {
            actions.push({
                priority: 2,
                domain: "preferences",
                action:
                    "Set the user's priorities so the location can be evaluated against their actual goals."
            });
        }

        if (
            !state.analysis.housing.available
        ) {
            actions.push({
                priority: 3,
                domain: "housing",
                action:
                    "Load housing and affordability data."
            });
        }

        if (
            !state.analysis.risk.available
        ) {
            actions.push({
                priority: 4,
                domain: "risk",
                action:
                    "Load hazard and disaster-risk data."
            });
        }

        if (
            !state.analysis.climate.available
        ) {
            actions.push({
                priority: 5,
                domain: "climate",
                action:
                    "Load long-term climate data."
            });
        }

        if (
            !state.analysis.business.available &&
            (
                state.preferences.businessGoal ||
                state.preferences.businessType ||
                state.preferences.industry
            )
        ) {
            actions.push({
                priority: 6,
                domain: "business",
                action:
                    "Load economic, industry, workforce, and business-program data."
            });
        }

        if (
            state.analysis.incentives.programCount > 0
        ) {
            actions.push({
                priority: 7,
                domain: "incentives",
                action:
                    "Verify program eligibility, application requirements, deadlines, and current funding availability."
            });
        }

        if (
            state.preferences.investmentGoal
        ) {
            actions.push({
                priority: 8,
                domain: "property",
                action:
                    "Connect the location analysis to property and investment analysis."
            });
        }

        return actions
            .sort(
                (a, b) =>
                    a.priority - b.priority
            )
            .slice(
                0,
                config.maxActions
            );
    }

    /* ======================================================
       FIT ENGINE
    ====================================================== */

    function calculateFit() {
        const dimensions = {};

        PRIORITIES.forEach(domain => {
            dimensions[domain] =
                calculateDomainFit(domain);
        });

        const weighted = [];

        Object.keys(dimensions).forEach(
            domain => {
                const score =
                    dimensions[domain];

                const weight =
                    getPriorityWeight(
                        domain
                    );

                if (
                    score !== null &&
                    weight > 0
                ) {
                    weighted.push({
                        score,
                        weight
                    });
                }
            }
        );

        let overall = null;

        if (weighted.length) {
            const numerator =
                weighted.reduce(
                    (sum, item) =>
                        sum +
                        item.score *
                        item.weight,
                    0
                );

            const denominator =
                weighted.reduce(
                    (sum, item) =>
                        sum +
                        item.weight,
                    0
                );

            overall =
                denominator > 0
                    ? clamp(
                        numerator /
                        denominator
                    )
                    : null;
        }

        return {
            overall,
            dimensions,
            explanation:
                buildFitExplanation(
                    overall,
                    dimensions
                )
        };
    }

    function calculateDomainFit(domain) {
        const preference =
            getPriorityWeight(domain);

        /*
            No explicit preference:
            use available analytical score
            only where meaningful.
        */

        switch (domain) {
            case "climate":
                return calculateClimateFit();

            case "weather":
                return calculateWeatherFit();

            case "risk":
                return calculateRiskFit();

            case "housing":
                return calculateHousingFit();

            case "costOfLiving":
                return calculateCostFit();

            case "incentives":
                return calculateIncentiveFit();

            case "business":
                return calculateBusinessFit();

            case "opportunity":
                return calculateOpportunityFit();

            case "property":
                return calculatePropertyFit();

            case "qualityOfLife":
                return null;

            default:
                return null;
        }
    }

    function calculateClimateFit() {
        const climate =
            state.analysis.climate;

        if (!climate.available) {
            return null;
        }

        const scores = [];

        if (
            climate.comfort !== null
        ) {
            scores.push(
                climate.comfort
            );
        }

        const preference =
            text(
                state.preferences.climatePreference
            ).toLowerCase();

        if (
            preference.includes("warm") &&
            climate.heat !== null
        ) {
            scores.push(
                climate.heat
            );
        }

        if (
            preference.includes("cool") &&
            climate.cold !== null
        ) {
            scores.push(
                climate.cold
            );
        }

        return average(scores);
    }

    function calculateWeatherFit() {
        const weather =
            state.analysis.weather;

        if (!weather.available) {
            return null;
        }

        if (
            weather.alertCount > 0
        ) {
            return 45;
        }

        return 75;
    }

    function calculateRiskFit() {
        const risk =
            state.analysis.risk;

        if (
            !risk.available
        ) {
            return null;
        }

        if (
            risk.averageExposure === null
        ) {
            return null;
        }

        /*
            Risk data is normally represented
            as exposure.

            Lower exposure → higher fit signal.
        */

        return clamp(
            100 -
            risk.averageExposure
        );
    }

    function calculateHousingFit() {
        const housing =
            state.analysis.housing;

        if (!housing.available) {
            return null;
        }

        if (
            housing.affordability !== null
        ) {
            return housing.affordability;
        }

        const ratio =
            state.analysis.financial
                .homePriceToIncome;

        if (
            ratio !== null
        ) {
            /*
                This is intentionally a broad
                analytical signal, not a lending
                qualification.
            */

            if (ratio <= 3) return 85;
            if (ratio <= 4) return 70;
            if (ratio <= 5) return 55;

            return 40;
        }

        return null;
    }

    function calculateCostFit() {
        const cost =
            state.analysis.financial;

        if (
            state.analysis.costOfLiving &&
            state.analysis.costOfLiving.overall !== null
        ) {
            return state.analysis.costOfLiving.overall;
        }

        if (
            cost.costScore !== null
        ) {
            return cost.costScore;
        }

        return null;
    }

    function calculateIncentiveFit() {
        const incentives =
            state.analysis.incentives;

        if (
            !incentives.available
        ) {
            return null;
        }

        if (
            incentives.programCount === 0
        ) {
            return 40;
        }

        return clamp(
            50 +
            Math.min(
                50,
                incentives.programCount * 5
            )
        );
    }

    function calculateBusinessFit() {
        const business =
            state.analysis.business;

        if (
            !business.available
        ) {
            return null;
        }

        return average([
            business.businessReadiness,
            business.economicCoverage,
            business.industryCoverage
        ]);
    }

    function calculateOpportunityFit() {
        const opportunity =
            state.analysis.opportunity;

        if (
            !opportunity.available
        ) {
            return null;
        }

        return average([
            opportunity.opportunityCoverage,
            opportunity.propertyReadiness,
            opportunity.businessReadiness,
            opportunity.capitalReadiness,
            opportunity.relocationReadiness
        ]);
    }

    function calculatePropertyFit() {
        const property =
            state.analysis.property;

        if (
            !property.available
        ) {
            return null;
        }

        if (
            property.cashFlow !== null
        ) {
            return property.cashFlow > 0
                ? 75
                : 45;
        }

        if (
            property.capRate !== null
        ) {
            return clamp(
                property.capRate * 10
            );
        }

        return null;
    }

    function getPriorityWeight(domain) {
        const priorities =
            state.preferences.priorities ||
            {};

        if (
            priorities[domain] !== undefined
        ) {
            return Math.max(
                0,
                number(
                    priorities[domain],
                    0
                )
            );
        }

        /*
            If no explicit priority exists,
            use a neutral weight.
        */

        return 1;
    }

    function buildFitExplanation(
        overall,
        dimensions
    ) {
        if (overall === null) {
            return "There is not enough structured data to calculate a preference-based location fit.";
        }

        const available =
            Object.keys(dimensions)
                .filter(
                    key =>
                        dimensions[key] !== null
                );

        return (
            `The current analytical fit is based on ` +
            `${available.length} available dimensions and the user's stated priorities. ` +
            `It is an informational comparison signal, not a guarantee or universal ranking.`
        );
    }

    /* ======================================================
       SUMMARY
    ====================================================== */

    function buildSummary() {
        const location =
            formatLocation(
                state.location
            );

        const available =
            Object.keys(
                state.analysis
            ).filter(
                domain =>
                    state.analysis[
                        domain
                    ] &&
                    state.analysis[
                        domain
                    ].available
            );

        const topRisk =
            state.analysis.risk
                .highestExposure;

        let summary =
            `Location analysis for ${location}. `;

        if (available.length) {
            summary +=
                `Structured intelligence is available across ${available.length} analytical domain(s). `;
        }

        if (
            topRisk &&
            topRisk.type
        ) {
            summary +=
                `The highest available hazard exposure category is ${topRisk.type}. `;
        }

        if (
            state.analysis.incentives
                .programCount > 0
        ) {
            summary +=
                `${state.analysis.incentives.programCount} potential incentive or support program record(s) are available for review. `;
        }

        if (
            state.analysis.business
                .available
        ) {
            summary +=
                `Business and economic data can be evaluated alongside housing, risk, climate, and opportunity factors. `;
        }

        return summary.trim();
    }

    /* ======================================================
       AI CONTEXT
    ====================================================== */

    function buildAIContext() {
        const context = {
            systemRole:
                "RO’Lyfe Location Intelligence Analyst",

            version: VERSION,

            objective:
                "Analyze a location against user-provided priorities using structured location intelligence.",

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
                state.summary,

            guardrails: [
                "Do not declare a universal best state, city, county, ZIP code, or location.",
                "Do not rank locations unless the user explicitly supplies a comparison framework and the output is descriptive rather than an overall recommendation.",
                "Use the user's stated priorities rather than assuming what matters to them.",
                "Distinguish current weather from long-term climate.",
                "Distinguish hazard exposure from an active weather event.",
                "Do not treat a program match as guaranteed eligibility.",
                "Do not treat grants, loans, tax credits, abatements, or incentives as guaranteed funding.",
                "Verify current program requirements, deadlines, funding availability, and eligibility before presenting an incentive as actionable.",
                "Do not invent missing economic, housing, climate, risk, or business data.",
                "Identify the relevant geographic level: state, county, city, ZIP, or property.",
                "Identify the data period when known.",
                "Separate documented facts from analytical interpretation.",
                "Explain tradeoffs rather than hiding them.",
                "If data is incomplete, state what is missing.",
                "Use property-level analysis only when actual property information is supplied.",
                "Location fit is not a financial guarantee, investment recommendation, or lending qualification."
            ],

            suggestedQuestions: [
                "What matters most to you about relocating?",
                "Are you looking primarily for housing, business opportunity, investment opportunity, or a combination?",
                "What housing budget should be used?",
                "How much heat can you tolerate?",
                "How much cold can you tolerate?",
                "Which natural hazards do you most want to avoid?",
                "Do you want to buy a home, rent, invest, start a business, or build?",
                "What type of business or industry matters to you?",
                "What is your relocation timeline?"
            ]
        };

        return context;
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
                state.summary,

            aiContext:
                clone(state.aiContext)
        };
    }

    /* ======================================================
       CORE BRIDGE
    ====================================================== */

    function analyzeFromCore(
        coreContext = null
    ) {
        let context =
            coreContext;

        if (
            !context
        ) {
            context =
                collectCoreContext();
        }

        if (!context) {
            return analyze();
        }

        return analyze({
            core: context,
            data: context
        });
    }

    /* ======================================================
       GETTERS
    ====================================================== */

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

            location:
                clone(state.location),

            coverage:
                state.metadata.coverage,

            sourceCount:
                state.metadata.sourceCount,

            updatedAt:
                state.metadata.updatedAt
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
                state.summary,

            aiContext:
                clone(state.aiContext),

            metadata:
                clone(state.metadata)
        };
    }

    function getAnalysis() {
        return clone(state.analysis);
    }

    function getFit() {
        return clone(state.fit);
    }

    function getSignals() {
        return clone(state.signals);
    }

    function getFindings() {
        return clone(state.findings);
    }

    function getTradeoffs() {
        return clone(state.tradeoffs);
    }

    function getGaps() {
        return clone(state.gaps);
    }

    function getActions() {
        return clone(state.actions);
    }

    function getSummary() {
        return state.summary;
    }

    function getAIContext() {
        return clone(
            state.aiContext ||
            buildAIContext()
        );
    }

    /* ======================================================
       CONFIG
    ====================================================== */

    function configure(options = {}) {
        config = Object.assign(
            {},
            config,
            options
        );

        return getConfig();
    }

    function getConfig() {
        return clone(config);
    }

    /* ======================================================
       PERSISTENCE
    ====================================================== */

    function persist() {
        if (
            !config.persist ||
            typeof localStorage === "undefined"
        ) {
            return false;
        }

        try {
            localStorage.setItem(
                config.storageKey,
                JSON.stringify(state)
            );

            return true;
        } catch (error) {
            console.warn(
                `[${MODULE_NAME}] Persistence failed`,
                error
            );

            return false;
        }
    }

    function restore() {
        if (
            typeof localStorage === "undefined"
        ) {
            return false;
        }

        try {
            const raw =
                localStorage.getItem(
                    config.storageKey
                );

            if (!raw) {
                return false;
            }

            const saved =
                JSON.parse(raw);

            state = Object.assign(
                createInitialState(),
                saved
            );

            emit("restored", {
                location:
                    clone(state.location)
            });

            return true;
        } catch (error) {
            console.warn(
                `[${MODULE_NAME}] Restore failed`,
                error
            );

            return false;
        }
    }

    function clearPersistence() {
        if (
            typeof localStorage === "undefined"
        ) {
            return false;
        }

        try {
            localStorage.removeItem(
                config.storageKey
            );

            return true;
        } catch (error) {
            return false;
        }
    }

    /* ======================================================
       RESET
    ====================================================== */

    function reset(options = {}) {
        const keepLocation =
            options.keepLocation !== false;

        const keepPreferences =
            options.keepPreferences !== false;

        const oldLocation =
            clone(state.location);

        const oldPreferences =
            clone(state.preferences);

        state =
            createInitialState();

        if (keepLocation) {
            state.location =
                oldLocation;
        }

        if (keepPreferences) {
            state.preferences =
                oldPreferences;
        }

        state.metadata.updatedAt =
            now();

        if (
            options.clearStorage
        ) {
            clearPersistence();
        }

        emit("reset", {});

        return getState();
    }

    /* ======================================================
       SUBSCRIPTIONS
    ====================================================== */

    function subscribe(listener) {
        if (
            typeof listener !== "function"
        ) {
            return function () {};
        }

        listeners.push(listener);

        return function unsubscribe() {
            const index =
                listeners.indexOf(
                    listener
                );

            if (index !== -1) {
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
            getResult(),
            null,
            2
        );
    }

    /* ======================================================
       UTILITY HELPERS
    ====================================================== */

    function extractNumber(
        object,
        paths = []
    ) {
        for (const path of paths) {
            const value =
                get(object, path);

            const n =
                number(value);

            if (n !== null) {
                return n;
            }
        }

        return null;
    }

    function extractScore(
        object,
        paths = []
    ) {
        for (const path of paths) {
            const value =
                get(object, path);

            const score =
                normalizeScore(value);

            if (score !== null) {
                return score;
            }
        }

        return null;
    }

    function normalizeSignals(
        signals
    ) {
        return array(signals)
            .filter(Boolean)
            .map(signal => {
                if (
                    typeof signal === "string"
                ) {
                    return {
                        message: signal
                    };
                }

                return {
                    domain:
                        text(
                            signal.domain
                        ),

                    type:
                        text(
                            signal.type
                        ),

                    level:
                        text(
                            signal.level
                        ),

                    message:
                        text(
                            signal.message
                        ),

                    value:
                        signal.value
                };
            });
    }

    function normalizeAlert(
        alert = {}
    ) {
        return {
            id:
                text(
                    alert.id ||
                    alert.identifier
                ),

            event:
                text(
                    alert.event ||
                    alert.title
                ),

            headline:
                text(
                    alert.headline
                ),

            severity:
                text(
                    alert.severity
                ),

            urgency:
                text(
                    alert.urgency
                ),

            certainty:
                text(
                    alert.certainty
                ),

            effective:
                text(
                    alert.effective
                ),

            expires:
                text(
                    alert.expires
                )
        };
    }

    function normalizeProgram(
        program = {}
    ) {
        return {
            id:
                text(
                    program.id ||
                    program.programId
                ),

            name:
                text(
                    program.name ||
                    program.title
                ),

            type:
                text(
                    program.type ||
                    program.fundingType
                ),

            status:
                text(
                    program.status
                ),

            description:
                text(
                    program.description
                ),

            eligibility:
                text(
                    program.eligibility
                ),

            source:
                text(
                    program.source ||
                    program.sourceUrl ||
                    program.url
                ),

            matchScore:
                normalizeScore(
                    program.matchScore
                )
        };
    }

    function countProgramType(
        programs,
        types
    ) {
        const normalized =
            unique(
                types.map(
                    type =>
                        text(type)
                            .toLowerCase()
                )
            );

        return programs.filter(
            program => {
                const type =
                    text(
                        program.type ||
                        program.fundingType
                    ).toLowerCase();

                return normalized.includes(
                    type
                );
            }
        ).length;
    }

    function findHighestRisk(
        scores = {}
    ) {
        const entries =
            Object.keys(scores)
                .map(type => ({
                    type,
                    score:
                        number(
                            scores[type]
                        )
                }))
                .filter(
                    item =>
                        item.score !== null
                )
                .sort(
                    (a, b) =>
                        b.score -
                        a.score
                );

        return (
            entries[0] ||
            null
        );
    }

    function formatLocation(
        location
    ) {
        const parts = [
            location.address,
            location.city,
            location.county,
            location.stateName ||
                location.state,
            location.zip
        ].filter(Boolean);

        return (
            parts.length
                ? parts.join(", ")
                : "the selected location"
        );
    }

    function calculateCoverage() {
        const domains = [
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

        const available =
            domains.filter(
                domain => {
                    if (
                        domain ===
                        "location"
                    ) {
                        return (
                            meaningful(
                                state.location.state
                            ) ||
                            meaningful(
                                state.location.city
                            ) ||
                            meaningful(
                                state.location.zip
                            )
                        );
                    }

                    return meaningful(
                        state.sourceData[
                            domain
                        ]
                    );
                }
            ).length;

        return Math.round(
            (
                available /
                domains.length
            ) * 100
        );
    }

    function countSources() {
        return Object.values(
            state.sourceData
        ).filter(
            meaningful
        ).length;
    }

    /* ======================================================
       INITIALIZATION
    ====================================================== */

    function initialize(options = {}) {
        configure(options);

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
            state.status === "ready"
                ? state.status
                : "initialized";

        emit("initialized", {
            version: VERSION
        });

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

        analyze,

        analyzeFromCore,

        setLocation,

        getLocation,

        setPreferences,

        getPreferences,

        setSourceData,

        getSourceData,

        collectAvailableModules,

        getState,

        getStatus,

        getResult,

        getAnalysis,

        getFit,

        getSignals,

        getFindings,

        getTradeoffs,

        getGaps,

        getActions,

        getSummary,

        buildAIContext,

        getAIContext,

        buildSharedContext,

        persist,

        restore,

        clearPersistence,

        serialize,

        subscribe
    };

    /* ======================================================
       GLOBAL EXPORT
    ====================================================== */

    global.ROlyfeLocationAnalysis =
        api;

    global.ROLYFE_LOCATION_ANALYSIS =
        api;

    /* ======================================================
       AUTO INITIALIZE
    ====================================================== */

    if (
        config.autoInitialize
    ) {
        if (
            typeof document !== "undefined"
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
