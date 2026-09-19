/**
 * RO’Lyfe Relocation Intelligence
 * Opportunity Engine
 *
 * File:
 * /core/opportunity-engine.js
 *
 * Purpose:
 * Converts the RO’Lyfe Intelligence Profile into a
 * structured opportunity profile.
 *
 * Core relationship:
 *
 * LOCATION
 *    ↓
 * PROPERTY
 *    ↓
 * BUSINESS
 *    ↓
 * INCENTIVES
 *    ↓
 * CAPITAL
 *    ↓
 * OPPORTUNITY
 *
 * This engine does not declare a universal "best"
 * location or make a political/electoral judgment.
 *
 * It organizes measurable signals and user-selected
 * priorities so the AI layer can explain tradeoffs.
 */

const ROlyfeOpportunityEngine = (() => {

    const VERSION = "1.0.0";


    /*
    -------------------------------------------------------
    OPPORTUNITY DOMAINS
    -------------------------------------------------------
    */

    const DOMAINS = [

        "location",
        "housing",
        "property",
        "business",
        "incentives",
        "capital",
        "risk",
        "climate",
        "costOfLiving"

    ];


    /*
    -------------------------------------------------------
    DEFAULT OPPORTUNITY WEIGHTS
    -------------------------------------------------------
    These are neutral defaults.
    They can be overridden by user preferences.
    -------------------------------------------------------
    */

    const DEFAULT_WEIGHTS = {

        location: 1,

        housing: 1,

        property: 1,

        business: 1,

        incentives: 1,

        capital: 1,

        risk: 1,

        climate: 1,

        costOfLiving: 1

    };


    /*
    -------------------------------------------------------
    CREATE OPPORTUNITY PROFILE
    -------------------------------------------------------
    */

    function createProfile(
        intelligenceProfile = null
    ) {

        return {

            engine: {

                name:
                    "RO’Lyfe Opportunity Engine",

                version:
                    VERSION,

                generatedAt:
                    new Date().toISOString()

            },

            location:
                intelligenceProfile?.location || {},

            intelligence:
                intelligenceProfile || {},

            opportunity: {

                location: {},

                housing: {},

                property: {},

                business: {},

                incentives: {},

                capital: {},

                risk: {},

                climate: {},

                costOfLiving: {}

            },

            signals: [],

            pathways: [],

            gaps: [],

            metrics: {

                dataCoverage: 0,

                opportunityCoverage: 0,

                propertyReadiness: 0,

                businessReadiness: 0,

                capitalReadiness: 0,

                relocationReadiness: 0

            },

            nextActions: []

        };

    }


    /*
    -------------------------------------------------------
    BUILD OPPORTUNITY PROFILE
    -------------------------------------------------------
    */

    function analyze(
        intelligenceProfile,
        preferences = {},
        weights = {}
    ) {

        const profile =
            createProfile(
                intelligenceProfile
            );


        if (!intelligenceProfile) {

            profile.gaps.push(
                "No intelligence profile was supplied."
            );

            return profile;

        }


        const mergedWeights =
            mergeWeights(
                DEFAULT_WEIGHTS,
                weights
            );


        /*
        ---------------------------------------------------
        EXTRACT DOMAINS
        ---------------------------------------------------
        */

        const domains =
            intelligenceProfile.domains || {};


        /*
        ---------------------------------------------------
        LOCATION
        ---------------------------------------------------
        */

        profile.opportunity.location =
            analyzeLocation(
                intelligenceProfile.location
            );


        /*
        ---------------------------------------------------
        HOUSING
        ---------------------------------------------------
        */

        profile.opportunity.housing =
            analyzeHousing(
                domains.housing
            );


        /*
        ---------------------------------------------------
        PROPERTY
        ---------------------------------------------------
        */

        profile.opportunity.property =
            analyzeProperty(
                domains.property,
                domains.housing,
                domains.hazards
            );


        /*
        ---------------------------------------------------
        BUSINESS
        ---------------------------------------------------
        */

        profile.opportunity.business =
            analyzeBusiness(
                domains.business,
                domains.costOfLiving,
                domains.incentives
            );


        /*
        ---------------------------------------------------
        INCENTIVES
        ---------------------------------------------------
        */

        profile.opportunity.incentives =
            analyzeIncentives(
                domains.incentives
            );


        /*
        ---------------------------------------------------
        CAPITAL
        ---------------------------------------------------
        */

        profile.opportunity.capital =
            analyzeCapital(
                domains.capital,
                domains.property,
                domains.business
            );


        /*
        ---------------------------------------------------
        RISK
        ---------------------------------------------------
        */

        profile.opportunity.risk =
            analyzeRisk(
                domains.hazards
            );


        /*
        ---------------------------------------------------
        CLIMATE
        ---------------------------------------------------
        */

        profile.opportunity.climate =
            analyzeClimate(
                domains.climate,
                domains.weather
            );


        /*
        ---------------------------------------------------
        COST OF LIVING
        ---------------------------------------------------
        */

        profile.opportunity.costOfLiving =
            analyzeCostOfLiving(
                domains.costOfLiving
            );


        /*
        ---------------------------------------------------
        SIGNALS
        ---------------------------------------------------
        */

        profile.signals =
            buildSignals(
                profile.opportunity
            );


        /*
        ---------------------------------------------------
        PATHWAYS
        ---------------------------------------------------
        */

        profile.pathways =
            buildOpportunityPathways(
                profile.opportunity
            );


        /*
        ---------------------------------------------------
        DATA GAPS
        ---------------------------------------------------
        */

        profile.gaps =
            identifyGaps(
                profile.opportunity
            );


        /*
        ---------------------------------------------------
        METRICS
        ---------------------------------------------------
        */

        profile.metrics =
            calculateOpportunityMetrics(
                profile,
                mergedWeights
            );


        /*
        ---------------------------------------------------
        NEXT ACTIONS
        ---------------------------------------------------
        */

        profile.nextActions =
            buildNextActions(
                profile
            );


        return profile;

    }


    /*
    -------------------------------------------------------
    LOCATION ANALYSIS
    -------------------------------------------------------
    */

    function analyzeLocation(
        location = {}
    ) {

        const country =
            location.country || {};

        const state =
            location.state || {};

        const county =
            location.county || {};

        const city =
            location.city || {};


        const identified =
            Boolean(
                country.name ||
                state.name ||
                city.name
            );


        return {

            identified,

            country,

            state,

            county,

            city,

            zip:
                location.zip || "",

            address:
                location.address || "",

            coordinates:
                location.coordinates || {},

            geographicLevel:
                determineGeographicLevel(
                    location
                )

        };

    }


    /*
    -------------------------------------------------------
    GEOGRAPHIC LEVEL
    -------------------------------------------------------
    */

    function determineGeographicLevel(
        location = {}
    ) {

        if (location.address) {

            return "property";

        }

        if (location.zip) {

            return "zip";

        }

        if (location.city?.name) {

            return "city";

        }

        if (location.county?.name) {

            return "county";

        }

        if (location.state?.name) {

            return "state";

        }

        if (location.country?.name) {

            return "country";

        }

        return "unknown";

    }


    /*
    -------------------------------------------------------
    HOUSING ANALYSIS
    -------------------------------------------------------
    */

    function analyzeHousing(
        housing = {}
    ) {

        const available =
            hasData(housing);


        return {

            available,

            coverage:
                available
                    ? calculateDomainCoverage(
                        housing
                    )
                    : 0,

            indicators:
                extractNumericIndicators(
                    housing
                ),

            sourceData:
                housing

        };

    }


    /*
    -------------------------------------------------------
    PROPERTY ANALYSIS
    -------------------------------------------------------
    */

    function analyzeProperty(
        property = {},
        housing = {},
        hazards = {}
    ) {

        const propertyAvailable =
            hasData(property);


        const housingAvailable =
            hasData(housing);


        const riskAvailable =
            hasData(hazards);


        const readinessFactors = [

            propertyAvailable,

            housingAvailable,

            riskAvailable

        ];


        const readiness =
            percentageTrue(
                readinessFactors
            );


        return {

            available:
                propertyAvailable,

            housingContextAvailable:
                housingAvailable,

            riskContextAvailable:
                riskAvailable,

            readiness,

            indicators:
                extractNumericIndicators(
                    property
                ),

            sourceData:
                property

        };

    }


    /*
    -------------------------------------------------------
    BUSINESS ANALYSIS
    -------------------------------------------------------
    */

    function analyzeBusiness(
        business = {},
        costOfLiving = {},
        incentives = {}
    ) {

        const businessAvailable =
            hasData(business);

        const costAvailable =
            hasData(costOfLiving);

        const incentiveAvailable =
            hasData(incentives);


        const readiness =
            percentageTrue([

                businessAvailable,

                costAvailable,

                incentiveAvailable

            ]);


        return {

            available:
                businessAvailable,

            costContextAvailable:
                costAvailable,

            incentiveContextAvailable:
                incentiveAvailable,

            readiness,

            indicators:
                extractNumericIndicators(
                    business
                ),

            sourceData:
                business

        };

    }


    /*
    -------------------------------------------------------
    INCENTIVE ANALYSIS
    -------------------------------------------------------
    */

    function analyzeIncentives(
        incentives = {}
    ) {

        const available =
            hasData(incentives);


        return {

            available,

            coverage:
                available
                    ? calculateDomainCoverage(
                        incentives
                    )
                    : 0,

            programs:
                extractPrograms(
                    incentives
                ),

            sourceData:
                incentives

        };

    }


    /*
    -------------------------------------------------------
    CAPITAL ANALYSIS
    -------------------------------------------------------
    */

    function analyzeCapital(
        capital = {},
        property = {},
        business = {}
    ) {

        const capitalAvailable =
            hasData(capital);

        const propertyAvailable =
            hasData(property);

        const businessAvailable =
            hasData(business);


        const readiness =
            percentageTrue([

                capitalAvailable,

                propertyAvailable,

                businessAvailable

            ]);


        return {

            available:
                capitalAvailable,

            propertyContextAvailable:
                propertyAvailable,

            businessContextAvailable:
                businessAvailable,

            readiness,

            indicators:
                extractNumericIndicators(
                    capital
                ),

            sourceData:
                capital

        };

    }


    /*
    -------------------------------------------------------
    RISK ANALYSIS
    -------------------------------------------------------
    */

    function analyzeRisk(
        hazards = {}
    ) {

        const available =
            hasData(hazards);


        return {

            available,

            coverage:
                available
                    ? calculateDomainCoverage(
                        hazards
                    )
                    : 0,

            categories:
                extractHazardCategories(
                    hazards
                ),

            sourceData:
                hazards

        };

    }


    /*
    -------------------------------------------------------
    CLIMATE ANALYSIS
    -------------------------------------------------------
    */

    function analyzeClimate(
        climate = {},
        weather = {}
    ) {

        const climateAvailable =
            hasData(climate);

        const weatherAvailable =
            hasData(weather);


        return {

            climateAvailable,

            weatherAvailable,

            coverage:
                calculateDomainCoverage(
                    climate
                ),

            indicators:
                extractNumericIndicators(
                    climate
                ),

            sourceData:
                climate

        };

    }


    /*
    -------------------------------------------------------
    COST OF LIVING ANALYSIS
    -------------------------------------------------------
    */

    function analyzeCostOfLiving(
        costOfLiving = {}
    ) {

        const available =
            hasData(
                costOfLiving
            );


        return {

            available,

            coverage:
                available
                    ? calculateDomainCoverage(
                        costOfLiving
                    )
                    : 0,

            indicators:
                extractNumericIndicators(
                    costOfLiving
                ),

            sourceData:
                costOfLiving

        };

    }


    /*
    -------------------------------------------------------
    SIGNAL ENGINE
    -------------------------------------------------------
    */

    function buildSignals(
        opportunity = {}
    ) {

        const signals = [];


        /*
        Property signal
        */

        if (
            opportunity.property?.available
        ) {

            signals.push({

                domain: "property",

                type: "available",

                priority: "normal",

                message:
                    "Property intelligence is available for further analysis."

            });

        }


        /*
        Business signal
        */

        if (
            opportunity.business?.available
        ) {

            signals.push({

                domain: "business",

                type: "available",

                priority: "normal",

                message:
                    "Business opportunity data is available."

            });

        }


        /*
        Incentive signal
        */

        if (
            opportunity.incentives?.available
        ) {

            signals.push({

                domain: "incentives",

                type: "available",

                priority: "normal",

                message:
                    "Incentive/program information is available for verification."

            });

        }


        /*
        Capital signal
        */

        if (
            opportunity.capital?.available
        ) {

            signals.push({

                domain: "capital",

                type: "available",

                priority: "normal",

                message:
                    "Capital-related information is available."

            });

        }


        /*
        Risk signal
        */

        if (
            opportunity.risk?.available
        ) {

            signals.push({

                domain: "risk",

                type: "review",

                priority: "important",

                message:
                    "Hazard information should be reviewed before property or relocation decisions."

            });

        }


        /*
        Climate signal
        */

        if (
            opportunity.climate?.climateAvailable
        ) {

            signals.push({

                domain: "climate",

                type: "available",

                priority: "normal",

                message:
                    "Climate information is available for location analysis."

            });

        }


        return signals;

    }


    /*
    -------------------------------------------------------
    OPPORTUNITY PATHWAYS
    -------------------------------------------------------
    */

    function buildOpportunityPathways(
        opportunity
    ) {

        const pathways = [];


        /*
        ---------------------------------------------------
        RELOCATION PATH
        ---------------------------------------------------
        */

        if (
            opportunity.location?.identified
        ) {

            pathways.push({

                id:
                    "relocation",

                name:
                    "Relocation Intelligence",

                sequence: [

                    "location",

                    "climate",

                    "weather",

                    "risk",

                    "housing",

                    "costOfLiving",

                    "incentives"

                ],

                purpose:
                    "Evaluate a location using lifestyle, environmental, housing, cost, and program information."

            });

        }


        /*
        ---------------------------------------------------
        PROPERTY PATH
        ---------------------------------------------------
        */

        if (
            opportunity.property
        ) {

            pathways.push({

                id:
                    "property",

                name:
                    "Property Opportunity",

                sequence: [

                    "location",

                    "housing",

                    "risk",

                    "property",

                    "business",

                    "capital"

                ],

                purpose:
                    "Move from location intelligence into property-level analysis."

            });

        }


        /*
        ---------------------------------------------------
        BUSINESS PATH
        ---------------------------------------------------
        */

        if (
            opportunity.business
        ) {

            pathways.push({

                id:
                    "business",

                name:
                    "Business Opportunity",

                sequence: [

                    "location",

                    "costOfLiving",

                    "business",

                    "incentives",

                    "capital"

                ],

                purpose:
                    "Evaluate business and economic opportunity within a selected location."

            });

        }


        /*
        ---------------------------------------------------
        CAPITAL PATH
        ---------------------------------------------------
        */

        if (
            opportunity.capital
        ) {

            pathways.push({

                id:
                    "capital",

                name:
                    "Capital Pathway",

                sequence: [

                    "opportunity",

                    "property",

                    "business",

                    "capital"

                ],

                purpose:
                    "Connect a defined opportunity to potential capital analysis."

            });

        }


        return pathways;

    }


    /*
    -------------------------------------------------------
    GAP ENGINE
    -------------------------------------------------------
    */

    function identifyGaps(
        opportunity
    ) {

        const gaps = [];


        if (
            !opportunity.location?.identified
        ) {

            gaps.push(
                "Location identity is incomplete."
            );

        }


        if (
            !opportunity.climate?.climateAvailable
        ) {

            gaps.push(
                "Climate intelligence is unavailable."
            );

        }


        if (
            !opportunity.risk?.available
        ) {

            gaps.push(
                "Hazard/risk intelligence is unavailable."
            );

        }


        if (
            !opportunity.housing?.available
        ) {

            gaps.push(
                "Housing intelligence is unavailable."
            );

        }


        if (
            !opportunity.costOfLiving?.available
        ) {

            gaps.push(
                "Cost-of-living intelligence is unavailable."
            );

        }


        if (
            !opportunity.incentives?.available
        ) {

            gaps.push(
                "Incentive/program intelligence is unavailable."
            );

        }


        if (
            !opportunity.business?.available
        ) {

            gaps.push(
                "Business intelligence is unavailable."
            );

        }


        return gaps;

    }


    /*
    -------------------------------------------------------
    OPPORTUNITY METRICS
    -------------------------------------------------------
    */

    function calculateOpportunityMetrics(
        profile,
        weights
    ) {

        const opportunity =
            profile.opportunity;


        const availableDomains = [

            opportunity.housing?.available,

            opportunity.property?.available,

            opportunity.business?.available,

            opportunity.incentives?.available,

            opportunity.capital?.available,

            opportunity.risk?.available,

            opportunity.climate?.climateAvailable,

            opportunity.costOfLiving?.available

        ];


        const opportunityCoverage =
            percentageTrue(
                availableDomains
            );


        const relocationReadiness =
            percentageTrue([

                opportunity.location?.identified,

                opportunity.climate?.climateAvailable,

                opportunity.risk?.available,

                opportunity.housing?.available,

                opportunity.costOfLiving?.available,

                opportunity.incentives?.available

            ]);


        const propertyReadiness =
            opportunity.property?.readiness || 0;


        const businessReadiness =
            opportunity.business?.readiness || 0;


        const capitalReadiness =
            opportunity.capital?.readiness || 0;


        const dataCoverage =
            profile.intelligence
                ?.metrics
                ?.dataCoverage ??
            opportunityCoverage;


        return {

            dataCoverage,

            opportunityCoverage,

            propertyReadiness,

            businessReadiness,

            capitalReadiness,

            relocationReadiness,

            weights

        };

    }


    /*
    -------------------------------------------------------
    NEXT ACTIONS
    -------------------------------------------------------
    */

    function buildNextActions(
        profile
    ) {

        const actions = [];


        if (
            profile.metrics
                .relocationReadiness < 100
        ) {

            actions.push({

                id:
                    "complete-location-profile",

                title:
                    "Complete Location Profile",

                reason:
                    "Additional location intelligence would improve the analysis.",

                priority:
                    "high"

            });

        }


        if (
            profile.opportunity.property
                ?.readiness < 100
        ) {

            actions.push({

                id:
                    "property-analysis",

                title:
                    "Run Property Analysis",

                reason:
                    "Property-level information can add another layer of opportunity intelligence.",

                priority:
                    "normal"

            });

        }


        if (
            profile.opportunity.business
                ?.readiness < 100
        ) {

            actions.push({

                id:
                    "business-analysis",

                title:
                    "Review Business Intelligence",

                reason:
                    "Business and economic data can be added to the location profile.",

                priority:
                    "normal"

            });

        }


        if (
            profile.opportunity.capital
                ?.readiness < 100
        ) {

            actions.push({

                id:
                    "capital-analysis",

                title:
                    "Review Capital Pathway",

                reason:
                    "A defined property or business opportunity can be evaluated against available capital information.",

                priority:
                    "normal"

            });

        }


        if (
            profile.opportunity.risk
                ?.available
        ) {

            actions.push({

                id:
                    "risk-review",

                title:
                    "Review Location Risk",

                reason:
                    "Hazard information should be considered alongside property and relocation factors.",

                priority:
                    "important"

            });

        }


        return actions;

    }


    /*
    -------------------------------------------------------
    NUMERIC INDICATORS
    -------------------------------------------------------
    */

    function extractNumericIndicators(
        data = {}
    ) {

        const indicators = {};


        if (
            !data ||
            typeof data !== "object"
        ) {

            return indicators;

        }


        Object.keys(data).forEach(key => {

            const value =
                data[key];


            if (
                typeof value === "number" &&
                Number.isFinite(value)
            ) {

                indicators[key] =
                    value;

            }

        });


        return indicators;

    }


    /*
    -------------------------------------------------------
    PROGRAM EXTRACTION
    -------------------------------------------------------
    */

    function extractPrograms(
        data = {}
    ) {

        const possibleKeys = [

            "programs",
            "incentives",
            "offers",
            "opportunities"

        ];


        for (
            const key of possibleKeys
        ) {

            if (
                Array.isArray(
                    data[key]
                )
            ) {

                return data[key];

            }

        }


        return [];

    }


    /*
    -------------------------------------------------------
    HAZARD EXTRACTION
    -------------------------------------------------------
    */

    function extractHazardCategories(
        hazards = {}
    ) {

        const categories = [

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


        return categories.filter(
            category =>
                hazards[category] !== undefined
        );

    }


    /*
    -------------------------------------------------------
    DOMAIN COVERAGE
    -------------------------------------------------------
    */

    function calculateDomainCoverage(
        data
    ) {

        if (!hasData(data)) {

            return 0;

        }


        const values =
            flattenValues(data);


        if (!values.length) {

            return 0;

        }


        const populated =
            values.filter(
                isMeaningful
            ).length;


        return Math.round(

            (
                populated /
                values.length
            ) * 100

        );

    }


    /*
    -------------------------------------------------------
    FLATTEN OBJECT VALUES
    -------------------------------------------------------
    */

    function flattenValues(
        value,
        result = []
    ) {

        if (
            value === null ||
            value === undefined
        ) {

            return result;

        }


        if (
            typeof value !== "object"
        ) {

            result.push(value);

            return result;

        }


        if (
            Array.isArray(value)
        ) {

            value.forEach(item => {

                flattenValues(
                    item,
                    result
                );

            });

            return result;

        }


        Object.keys(value).forEach(
            key => {

                flattenValues(
                    value[key],
                    result
                );

            }
        );


        return result;

    }


    /*
    -------------------------------------------------------
    MEANINGFUL VALUE
    -------------------------------------------------------
    */

    function isMeaningful(
        value
    ) {

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
    HAS DATA
    -------------------------------------------------------
    */

    function hasData(
        value
    ) {

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
            Array.isArray(value)
        ) {

            return value.length > 0;

        }


        if (
            typeof value === "object"
        ) {

            return Object.keys(value).length > 0;

        }


        return true;

    }


    /*
    -------------------------------------------------------
    PERCENTAGE TRUE
    -------------------------------------------------------
    */

    function percentageTrue(
        values
    ) {

        if (
            !Array.isArray(values) ||
            !values.length
        ) {

            return 0;

        }


        const trueCount =
            values.filter(
                Boolean
            ).length;


        return Math.round(

            (
                trueCount /
                values.length
            ) * 100

        );

    }


    /*
    -------------------------------------------------------
    MERGE WEIGHTS
    -------------------------------------------------------
    */

    function mergeWeights(
        defaults,
        overrides
    ) {

        return {

            ...defaults,

            ...(overrides || {})

        };

    }


    /*
    -------------------------------------------------------
    GET PATHWAY
    -------------------------------------------------------
    */

    function getPathway(
        profile,
        pathwayId
    ) {

        if (
            !profile ||
            !Array.isArray(
                profile.pathways
            )
        ) {

            return null;

        }


        return profile.pathways.find(
            pathway =>
                pathway.id === pathwayId
        ) || null;

    }


    /*
    -------------------------------------------------------
    GET DOMAIN
    -------------------------------------------------------
    */

    function getOpportunityDomain(
        profile,
        domain
    ) {

        if (
            !profile ||
            !profile.opportunity
        ) {

            return null;

        }


        return (
            profile.opportunity[domain] ||
            null
        );

    }


    /*
    -------------------------------------------------------
    BUILD AI CONTEXT
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
                "RO’Lyfe Opportunity Intelligence",

            engineVersion:
                VERSION,

            location:
                profile.location,

            metrics:
                profile.metrics,

            opportunity:
                profile.opportunity,

            signals:
                profile.signals,

            pathways:
                profile.pathways,

            gaps:
                profile.gaps,

            nextActions:
                profile.nextActions,

            instruction:
                "Explain the available opportunity signals and tradeoffs using only supplied data. Identify missing information. Do not invent facts or present an unsupported universal ranking."

        };

    }


    /*
    -------------------------------------------------------
    SERIALIZE
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

        analyze,

        buildFromIntelligence:
            analyze,

        calculateDomainCoverage,

        buildNextActions,

        getPathway,

        getOpportunityDomain,

        buildAIContext,

        serialize

    };

})();


/*
-----------------------------------------------------------
BROWSER GLOBAL
-----------------------------------------------------------
*/

if (
    typeof window !== "undefined"
) {

    window.ROlyfeOpportunityEngine =
        ROlyfeOpportunityEngine;

}


/*
-----------------------------------------------------------
GLOBAL REFERENCE
-----------------------------------------------------------
*/

if (
    typeof globalThis !== "undefined"
) {

    globalThis.ROlyfeOpportunityEngine =
        ROlyfeOpportunityEngine;

} 
