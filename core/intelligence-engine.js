/**
 * RO’Lyfe Relocation Intelligence
 * Intelligence Engine
 *
 * File:
 * /core/intelligence-engine.js
 *
 * Purpose:
 * Combines location data from the RO’Lyfe Data Router
 * into a unified intelligence profile.
 *
 * This engine does NOT make political, financial,
 * legal, medical, or other high-stakes decisions.
 *
 * It organizes available data, identifies gaps,
 * calculates transparent analytical metrics, and
 * prepares structured information for the RO’Lyfe AI layer.
 *
 * Architecture:
 *
 * DATA
 *   ↓
 * DATA ROUTER
 *   ↓
 * LOCATION ENGINE
 *   ↓
 * INTELLIGENCE ENGINE
 *   ↓
 * AI / OPPORTUNITY ENGINE
 */

const ROlyfeIntelligenceEngine = (() => {

    const VERSION = "1.0.0";

    /*
    -------------------------------------------------------
    INTELLIGENCE DOMAINS
    -------------------------------------------------------
    */

    const DOMAINS = [

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


    /*
    -------------------------------------------------------
    DOMAIN WEIGHTS
    -------------------------------------------------------
    These are analytical defaults.
    They are NOT a recommendation or ranking.
    User preferences can override them later.
    -------------------------------------------------------
    */

    const DEFAULT_WEIGHTS = {

        climate: 1,

        weather: 1,

        hazards: 1,

        housing: 1,

        costOfLiving: 1,

        incentives: 1,

        business: 1,

        property: 1,

        capital: 1,

        opportunity: 1

    };


    /*
    -------------------------------------------------------
    CREATE EMPTY INTELLIGENCE PROFILE
    -------------------------------------------------------
    */

    function createProfile(location = {}) {

        return {

            engine: {

                name:
                    "RO’Lyfe Intelligence Engine",

                version:
                    VERSION,

                generatedAt:
                    new Date().toISOString()

            },

            location,

            domains: {

                climate: {},
                weather: {},
                hazards: {},
                housing: {},
                costOfLiving: {},
                incentives: {},
                business: {},
                property: {},
                capital: {},
                opportunity: {}

            },

            metrics: {

                completeness: 0,

                dataCoverage: 0,

                riskCoverage: 0,

                opportunityCoverage: 0,

                housingCoverage: 0,

                businessCoverage: 0,

                incentiveCoverage: 0

            },

            findings: {

                strengths: [],

                considerations: [],

                missingData: [],

                signals: []

            },

            analysis: {

                lifestyle: {},

                financial: {},

                property: {},

                business: {},

                risk: {},

                opportunity: {}

            }

        };

    }


    /*
    -------------------------------------------------------
    INGEST LOCATION
    -------------------------------------------------------
    */

    function ingestLocation(
        location,
        intelligence = {}
    ) {

        const profile =
            createProfile(location);


        DOMAINS.forEach(domain => {

            if (
                intelligence[domain] &&
                typeof intelligence[domain] === "object"
            ) {

                profile.domains[domain] =
                    intelligence[domain];

            }

        });


        profile.metrics =
            calculateCoverage(
                profile.domains
            );


        profile.findings =
            identifyFindings(
                profile.domains
            );


        profile.analysis =
            buildAnalysis(
                profile.domains
            );


        return profile;
    }


    /*
    -------------------------------------------------------
    BUILD FROM DATA ROUTER
    -------------------------------------------------------
    */

    async function buildFromRouter(
        options = {}
    ) {

        if (
            typeof window === "undefined" ||
            !window.ROlyfeDataRouter
        ) {

            throw new Error(
                "ROlyfeDataRouter is required before using buildFromRouter()."
            );

        }


        const router =
            window.ROlyfeDataRouter;


        const data =
            await router.buildLocationData(
                options
            );


        const location = {

            country:
                data.location.country || {},

            state:
                data.location.state || {},

            city:
                data.location.city || {}

        };


        return ingestLocation(

            location,

            {

                climate:
                    data.intelligence.climate,

                weather:
                    data.intelligence.weather || {},

                hazards:
                    data.intelligence.hazards,

                housing:
                    data.intelligence.housing || {},

                costOfLiving:
                    data.intelligence.costOfLiving,

                incentives:
                    data.intelligence.incentives,

                business:
                    data.intelligence.business || {},

                property:
                    data.property || {},

                capital:
                    data.intelligence.capital || {},

                opportunity:
                    data.intelligence.opportunity || {}

            }

        );

    }


    /*
    -------------------------------------------------------
    COVERAGE ENGINE
    -------------------------------------------------------
    */

    function calculateCoverage(
        domains = {}
    ) {

        const domainCoverage = {};

        let availableDomains = 0;

        let populatedFields = 0;

        let possibleFields = 0;


        DOMAINS.forEach(domain => {

            const data =
                domains[domain];


            const fieldCount =
                countFields(data);


            possibleFields +=
                fieldCount.total;

            populatedFields +=
                fieldCount.populated;


            const coverage =
                fieldCount.total > 0
                    ? Math.round(
                        (
                            fieldCount.populated /
                            fieldCount.total
                        ) * 100
                    )
                    : 0;


            domainCoverage[domain] =
                coverage;


            if (coverage > 0) {

                availableDomains++;

            }

        });


        const dataCoverage =
            possibleFields > 0

                ? Math.round(
                    (
                        populatedFields /
                        possibleFields
                    ) * 100
                )

                : 0;


        return {

            domainCoverage,

            completeness:
                dataCoverage,

            dataCoverage,

            riskCoverage:
                domainCoverage.hazards || 0,

            opportunityCoverage:
                average([
                    domainCoverage.incentives,
                    domainCoverage.business,
                    domainCoverage.property,
                    domainCoverage.opportunity
                ]),

            housingCoverage:
                domainCoverage.housing || 0,

            businessCoverage:
                domainCoverage.business || 0,

            incentiveCoverage:
                domainCoverage.incentives || 0,

            availableDomains,

            totalDomains:
                DOMAINS.length

        };

    }


    /*
    -------------------------------------------------------
    COUNT OBJECT FIELDS
    -------------------------------------------------------
    */

    function countFields(
        value,
        visited = new WeakSet()
    ) {

        if (
            value === null ||
            value === undefined
        ) {

            return {
                total: 1,
                populated: 0
            };

        }


        if (
            typeof value !== "object"
        ) {

            return {

                total: 1,

                populated:
                    isMeaningful(value)
                        ? 1
                        : 0

            };

        }


        if (visited.has(value)) {

            return {
                total: 0,
                populated: 0
            };

        }


        visited.add(value);


        if (Array.isArray(value)) {

            if (!value.length) {

                return {
                    total: 1,
                    populated: 0
                };

            }


            let total = 0;

            let populated = 0;


            value.forEach(item => {

                const result =
                    countFields(
                        item,
                        visited
                    );

                total += result.total;

                populated += result.populated;

            });


            return {
                total,
                populated
            };

        }


        const keys =
            Object.keys(value);


        if (!keys.length) {

            return {
                total: 1,
                populated: 0
            };

        }


        let total = 0;

        let populated = 0;


        keys.forEach(key => {

            const result =
                countFields(
                    value[key],
                    visited
                );

            total += result.total;

            populated += result.populated;

        });


        return {
            total,
            populated
        };

    }


    /*
    -------------------------------------------------------
    MEANINGFUL VALUE
    -------------------------------------------------------
    */

    function isMeaningful(value) {

        if (
            value === null ||
            value === undefined
        ) {

            return false;

        }


        if (
            typeof value === "string"
        ) {

            return value.trim().length > 0;

        }


        if (
            typeof value === "number"
        ) {

            return Number.isFinite(value);

        }


        if (
            typeof value === "boolean"
        ) {

            return true;

        }


        return true;

    }


    /*
    -------------------------------------------------------
    FINDINGS ENGINE
    -------------------------------------------------------
    */

    function identifyFindings(
        domains = {}
    ) {

        const findings = {

            strengths: [],

            considerations: [],

            missingData: [],

            signals: []

        };


        /*
        Climate
        */

        if (
            hasData(
                domains.climate
            )
        ) {

            findings.signals.push({

                domain: "climate",

                type: "data_available",

                message:
                    "Climate intelligence is available for analysis."

            });

        } else {

            findings.missingData.push(
                "Climate data"
            );

        }


        /*
        Weather
        */

        if (
            hasData(
                domains.weather
            )
        ) {

            findings.signals.push({

                domain: "weather",

                type: "data_available",

                message:
                    "Weather intelligence is available."

            });

        } else {

            findings.missingData.push(
                "Current weather data"
            );

        }


        /*
        Hazards
        */

        if (
            hasData(
                domains.hazards
            )
        ) {

            findings.signals.push({

                domain: "hazards",

                type: "risk_data_available",

                message:
                    "Hazard information is available for review."

            });

        } else {

            findings.missingData.push(
                "Hazard and disaster-risk data"
            );

        }


        /*
        Housing
        */

        if (
            hasData(
                domains.housing
            )
        ) {

            findings.strengths.push({

                domain: "housing",

                message:
                    "Housing intelligence is available."

            });

        } else {

            findings.missingData.push(
                "Housing data"
            );

        }


        /*
        Cost of Living
        */

        if (
            hasData(
                domains.costOfLiving
            )
        ) {

            findings.signals.push({

                domain: "costOfLiving",

                type: "economic_data_available",

                message:
                    "Cost-of-living intelligence is available."

            });

        } else {

            findings.missingData.push(
                "Cost-of-living data"
            );

        }


        /*
        Incentives
        */

        if (
            hasData(
                domains.incentives
            )
        ) {

            findings.strengths.push({

                domain: "incentives",

                message:
                    "Relocation or economic incentive data is available for review."

            });

        } else {

            findings.missingData.push(
                "Incentive/program data"
            );

        }


        /*
        Business
        */

        if (
            hasData(
                domains.business
            )
        ) {

            findings.strengths.push({

                domain: "business",

                message:
                    "Business and economic opportunity data is available."

            });

        } else {

            findings.missingData.push(
                "Business opportunity data"
            );

        }


        /*
        Property
        */

        if (
            hasData(
                domains.property
            )
        ) {

            findings.signals.push({

                domain: "property",

                type: "property_data_available",

                message:
                    "Property intelligence is available."

            });

        }


        /*
        Capital
        */

        if (
            hasData(
                domains.capital
            )
        ) {

            findings.signals.push({

                domain: "capital",

                type: "capital_data_available",

                message:
                    "Capital/funding information is available."

            });

        }


        /*
        Opportunity
        */

        if (
            hasData(
                domains.opportunity
            )
        ) {

            findings.strengths.push({

                domain: "opportunity",

                message:
                    "Opportunity intelligence is available."

            });

        }


        return findings;

    }


    /*
    -------------------------------------------------------
    BUILD ANALYSIS
    -------------------------------------------------------
    */

    function buildAnalysis(
        domains = {}
    ) {

        return {

            lifestyle:
                buildLifestyleAnalysis(
                    domains
                ),

            financial:
                buildFinancialAnalysis(
                    domains
                ),

            property:
                buildPropertyAnalysis(
                    domains
                ),

            business:
                buildBusinessAnalysis(
                    domains
                ),

            risk:
                buildRiskAnalysis(
                    domains
                ),

            opportunity:
                buildOpportunityAnalysis(
                    domains
                )

        };

    }


    /*
    -------------------------------------------------------
    LIFESTYLE ANALYSIS
    -------------------------------------------------------
    */

    function buildLifestyleAnalysis(
        domains
    ) {

        return {

            climateAvailable:
                hasData(
                    domains.climate
                ),

            weatherAvailable:
                hasData(
                    domains.weather
                ),

            housingAvailable:
                hasData(
                    domains.housing
                ),

            costOfLivingAvailable:
                hasData(
                    domains.costOfLiving
                ),

            summary:
                buildAvailabilitySummary([

                    ["Climate", domains.climate],

                    ["Weather", domains.weather],

                    ["Housing", domains.housing],

                    [
                        "Cost of Living",
                        domains.costOfLiving
                    ]

                ])

        };

    }


    /*
    -------------------------------------------------------
    FINANCIAL ANALYSIS
    -------------------------------------------------------
    */

    function buildFinancialAnalysis(
        domains
    ) {

        return {

            costOfLiving:
                summarizeDomain(
                    domains.costOfLiving
                ),

            housing:
                summarizeDomain(
                    domains.housing
                ),

            incentives:
                summarizeDomain(
                    domains.incentives
                ),

            capital:
                summarizeDomain(
                    domains.capital
                ),

            summary:
                buildAvailabilitySummary([

                    [
                        "Cost of Living",
                        domains.costOfLiving
                    ],

                    [
                        "Housing",
                        domains.housing
                    ],

                    [
                        "Incentives",
                        domains.incentives
                    ],

                    [
                        "Capital",
                        domains.capital
                    ]

                ])

        };

    }


    /*
    -------------------------------------------------------
    PROPERTY ANALYSIS
    -------------------------------------------------------
    */

    function buildPropertyAnalysis(
        domains
    ) {

        return {

            propertyDataAvailable:
                hasData(
                    domains.property
                ),

            housingDataAvailable:
                hasData(
                    domains.housing
                ),

            riskDataAvailable:
                hasData(
                    domains.hazards
                ),

            marketDataAvailable:
                hasData(
                    domains.business
                ),

            summary:
                buildAvailabilitySummary([

                    [
                        "Property",
                        domains.property
                    ],

                    [
                        "Housing",
                        domains.housing
                    ],

                    [
                        "Risk",
                        domains.hazards
                    ],

                    [
                        "Business",
                        domains.business
                    ]

                ])

        };

    }


    /*
    -------------------------------------------------------
    BUSINESS ANALYSIS
    -------------------------------------------------------
    */

    function buildBusinessAnalysis(
        domains
    ) {

        return {

            businessDataAvailable:
                hasData(
                    domains.business
                ),

            incentiveDataAvailable:
                hasData(
                    domains.incentives
                ),

            costDataAvailable:
                hasData(
                    domains.costOfLiving
                ),

            opportunityDataAvailable:
                hasData(
                    domains.opportunity
                ),

            summary:
                buildAvailabilitySummary([

                    [
                        "Business",
                        domains.business
                    ],

                    [
                        "Incentives",
                        domains.incentives
                    ],

                    [
                        "Cost of Living",
                        domains.costOfLiving
                    ],

                    [
                        "Opportunity",
                        domains.opportunity
                    ]

                ])

        };

    }


    /*
    -------------------------------------------------------
    RISK ANALYSIS
    -------------------------------------------------------
    */

    function buildRiskAnalysis(
        domains
    ) {

        const hazards =
            domains.hazards || {};


        return {

            dataAvailable:
                hasData(
                    hazards
                ),

            hazardCategories:
                extractHazardCategories(
                    hazards
                ),

            summary:
                hasData(hazards)

                    ? "Hazard intelligence is available for review."

                    : "Hazard intelligence is not yet available."

        };

    }


    /*
    -------------------------------------------------------
    OPPORTUNITY ANALYSIS
    -------------------------------------------------------
    */

    function buildOpportunityAnalysis(
        domains
    ) {

        const sources = [

            domains.incentives,

            domains.business,

            domains.property,

            domains.capital,

            domains.opportunity

        ];


        const available =
            sources.filter(
                hasData
            ).length;


        return {

            sourcesAvailable:
                available,

            totalSources:
                sources.length,

            coverage:
                Math.round(
                    (
                        available /
                        sources.length
                    ) * 100
                ),

            summary:
                available === 0

                    ? "Opportunity intelligence is not yet available."

                    : `${available} of ${sources.length} opportunity domains contain data.`

        };

    }


    /*
    -------------------------------------------------------
    HAZARD CATEGORIES
    -------------------------------------------------------
    */

    function extractHazardCategories(
        hazards = {}
    ) {

        const knownCategories = [

            "flood",
            "flooding",
            "tornado",
            "hurricane",
            "tropical",
            "wildfire",
            "heat",
            "extremeHeat",
            "cold",
            "drought",
            "earthquake",
            "snow",
            "ice",
            "severeStorm",
            "storm"

        ];


        return knownCategories.filter(
            category =>
                hazards[category] !== undefined
        );

    }


    /*
    -------------------------------------------------------
    DOMAIN SUMMARY
    -------------------------------------------------------
    */

    function summarizeDomain(
        domain
    ) {

        if (!hasData(domain)) {

            return {

                available: false,

                coverage: 0,

                fields: 0

            };

        }


        const fields =
            countFields(domain);


        const coverage =
            fields.total > 0

                ? Math.round(
                    (
                        fields.populated /
                        fields.total
                    ) * 100
                )

                : 0;


        return {

            available: true,

            coverage,

            fields:
                fields.populated,

            totalFields:
                fields.total

        };

    }


    /*
    -------------------------------------------------------
    AVAILABILITY SUMMARY
    -------------------------------------------------------
    */

    function buildAvailabilitySummary(
        entries
    ) {

        return entries.map(
            ([name, data]) => ({

                name,

                available:
                    hasData(data)

            })
        );

    }


    /*
    -------------------------------------------------------
    DATA AVAILABILITY
    -------------------------------------------------------
    */

    function hasData(value) {

        if (
            value === null ||
            value === undefined
        ) {

            return false;

        }


        if (
            typeof value === "string"
        ) {

            return value.trim().length > 0;

        }


        if (
            typeof value !== "object"
        ) {

            return true;

        }


        if (Array.isArray(value)) {

            return value.length > 0;

        }


        return Object.keys(value).length > 0;

    }


    /*
    -------------------------------------------------------
    AVERAGE
    -------------------------------------------------------
    */

    function average(values) {

        const valid =
            values.filter(
                value =>
                    typeof value === "number" &&
                    Number.isFinite(value)
            );


        if (!valid.length) {

            return 0;

        }


        return Math.round(

            valid.reduce(
                (sum, value) =>
                    sum + value,
                0
            ) / valid.length

        );

    }


    /*
    -------------------------------------------------------
    BUILD EXECUTIVE SUMMARY
    -------------------------------------------------------
    */

    function buildExecutiveSummary(
        profile
    ) {

        if (!profile) {

            return {

                headline:
                    "No intelligence profile available.",

                statements: []

            };

        }


        const location =
            formatLocationName(
                profile.location
            );


        const coverage =
            profile.metrics
                ?.dataCoverage ?? 0;


        const missing =
            profile.findings
                ?.missingData || [];


        const statements = [];


        statements.push(

            `${location} has ${coverage}% calculated data coverage across the current RO’Lyfe intelligence domains.`

        );


        if (missing.length) {

            statements.push(

                `Additional data is needed in ${missing.length} domain${missing.length === 1 ? "" : "s"} before a more complete analysis can be produced.`

            );

        }


        if (
            profile.metrics
                ?.riskCoverage > 0
        ) {

            statements.push(

                "Hazard information is available and can be incorporated into location-risk analysis."

            );

        }


        if (
            profile.metrics
                ?.opportunityCoverage > 0
        ) {

            statements.push(

                "Opportunity-related data is available for further property, business, incentive, and capital analysis."

            );

        }


        return {

            headline:
                `RO’Lyfe Intelligence Profile: ${location}`,

            statements

        };

    }


    /*
    -------------------------------------------------------
    LOCATION NAME
    -------------------------------------------------------
    */

    function formatLocationName(
        location = {}
    ) {

        const city =
            location.city?.name ||
            location.city?.city ||
            "";

        const state =
            location.state?.name ||
            location.state?.code ||
            "";

        const country =
            location.country?.name ||
            "";


        const parts =
            [city, state, country]
                .filter(Boolean);


        return parts.length
            ? parts.join(", ")
            : "Unknown Location";

    }


    /*
    -------------------------------------------------------
    GENERATE AI CONTEXT
    -------------------------------------------------------
    */

    function buildAIContext(
        profile
    ) {

        if (!profile) {

            return null;

        }


        return {

            system:
                "RO’Lyfe Relocation Intelligence",

            engineVersion:
                VERSION,

            location:
                profile.location,

            dataCoverage:
                profile.metrics,

            domains:
                profile.domains,

            findings:
                profile.findings,

            analysis:
                profile.analysis,

            executiveSummary:
                buildExecutiveSummary(
                    profile
                ),

            instruction:
                "Interpret the structured intelligence, explain tradeoffs, identify missing information, and present evidence-based considerations. Do not invent unavailable data."

        };

    }


    /*
    -------------------------------------------------------
    EXPORT PROFILE
    -------------------------------------------------------
    */

    function serialize(
        profile
    ) {

        return JSON.stringify(
            profile,
            null,
            2
        );

    }


    /*
    -------------------------------------------------------
    PUBLIC API
    -------------------------------------------------------
    */

    return {

        VERSION,

        DOMAINS,

        DEFAULT_WEIGHTS,

        createProfile,

        ingestLocation,

        buildFromRouter,

        calculateCoverage,

        identifyFindings,

        buildAnalysis,

        buildExecutiveSummary,

        buildAIContext,

        serialize

    };

})();


/*
-----------------------------------------------------------
BROWSER GLOBAL
-----------------------------------------------------------
*/

if (typeof window !== "undefined") {

    window.ROlyfeIntelligenceEngine =
        ROlyfeIntelligenceEngine;

}


/*
-----------------------------------------------------------
GLOBAL REFERENCE
-----------------------------------------------------------
*/

if (typeof globalThis !== "undefined") {

    globalThis.ROlyfeIntelligenceEngine =
        ROlyfeIntelligenceEngine;

              }
