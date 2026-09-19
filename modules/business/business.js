/*
============================================================
RO'Lyfe Relocation Intelligence Center™
MODULE: Business Intelligence Engine
FILE: /modules/business/business.js
VERSION: 1.0.0
============================================================

PURPOSE
-------
Business intelligence layer for the RO'Lyfe Relocation
Intelligence Center.

This module connects:

    LOCATION
       ↓
    ECONOMY
       ↓
    INDUSTRIES
       ↓
    BUSINESS ENVIRONMENT
       ↓
    WORKFORCE
       ↓
    FINANCING
       ↓
    INCENTIVES
       ↓
    EXPANSION / RELOCATION
       ↓
    OPPORTUNITY

PRIMARY QUESTIONS
-----------------
1. What does the business environment look like here?
2. What industries are represented?
3. What business types may fit the location?
4. What financing resources may exist?
5. What workforce resources may exist?
6. What incentives may apply?
7. Is the location prepared for business expansion?
8. What information is still missing?
9. What should the RO'Lyfe AI investigate next?

IMPORTANT
---------
This module is an intelligence layer.

It does NOT:
- guarantee business success
- guarantee financing
- guarantee incentives
- rank states as universally better
- predict future economic performance
- replace professional economic, tax, legal,
  lending, or investment advice

It organizes evidence and identifies pathways
for further investigation.

PA-FIRST / 50-STATE ARCHITECTURE
---------------------------------
The first implementation can use Pennsylvania data,
while the schema supports:

    State
    County
    City
    ZIP
    Metro
    Region

FUTURE CONNECTIONS
------------------
- incentives.js
- housing.js
- climate.js
- risk.js
- weather.js
- relocation.js
- opportunity-engine.js
- intelligence-engine.js
- RO'Lyfe Real Estate Command Center
- DealForge OS
- funding systems
- property intelligence
- workforce APIs
- Census / BLS / BEA data
- state economic-development APIs
- local economic-development organizations

============================================================
*/

(function (global) {
    "use strict";

    const VERSION = "1.0.0";

    const MODULE_NAME = "ROlyfeBusiness";

    const STORAGE_KEY =
        "rolyfe_business_state_v1";

    /*
    ========================================================
    CONFIGURATION
    ========================================================
    */

    const CONFIG = {
        autoInitialize: true,

        defaultState: "PA",

        cacheEnabled: true,

        cacheMinutes: 60,

        dataVersion: "1.0.0",

        defaultCurrency: "USD"
    };

    /*
    ========================================================
    BUSINESS DOMAINS
    ========================================================
    */

    const BUSINESS_TYPES = {
        STARTUP: "startup",

        SMALL_BUSINESS: "small_business",

        SERVICE: "service_business",

        RETAIL: "retail",

        RESTAURANT: "restaurant",

        FOOD: "food",

        TECHNOLOGY: "technology",

        AI: "ai",

        ROBOTICS: "robotics",

        MANUFACTURING: "manufacturing",

        CONSTRUCTION: "construction",

        REAL_ESTATE: "real_estate",

        LOGISTICS: "logistics",

        HEALTHCARE: "healthcare",

        LIFE_SCIENCES: "life_sciences",

        AGRICULTURE: "agriculture",

        ENERGY: "energy",

        PROFESSIONAL: "professional_services",

        FINANCIAL: "financial_services",

        HOSPITALITY: "hospitality",

        CREATIVE: "creative",

        ECOMMERCE: "ecommerce",

        FRANCHISE: "franchise",

        NONPROFIT: "nonprofit"
    };

    /*
    ========================================================
    INDUSTRY DOMAINS
    ========================================================
    */

    const INDUSTRIES = {
        TECHNOLOGY: "technology",

        AI: "artificial_intelligence",

        ROBOTICS: "robotics",

        SOFTWARE: "software",

        CYBERSECURITY: "cybersecurity",

        FINANCE: "finance",

        REAL_ESTATE: "real_estate",

        CONSTRUCTION: "construction",

        LOGISTICS: "logistics",

        TRANSPORTATION: "transportation",

        HEALTHCARE: "healthcare",

        LIFE_SCIENCES: "life_sciences",

        MANUFACTURING: "manufacturing",

        ENERGY: "energy",

        AGRICULTURE: "agriculture",

        FOOD: "food",

        RETAIL: "retail",

        HOSPITALITY: "hospitality",

        EDUCATION: "education",

        PROFESSIONAL_SERVICES: "professional_services",

        ENTERTAINMENT: "entertainment",

        TOURISM: "tourism"
    };

    /*
    ========================================================
    FINANCING TYPES
    ========================================================
    */

    const FINANCING_TYPES = {
        GRANT: "grant",

        LOAN: "loan",

        LINE_OF_CREDIT: "line_of_credit",

        TAX_CREDIT: "tax_credit",

        TAX_ABATEMENT: "tax_abatement",

        EQUITY: "equity",

        GUARANTEE: "loan_guarantee",

        WORKFORCE: "workforce_funding",

        TECHNICAL_ASSISTANCE:
            "technical_assistance",

        PRIVATE_CAPITAL:
            "private_capital"
    };

    /*
    ========================================================
    GEOGRAPHIC LEVELS
    ========================================================
    */

    const GEOGRAPHIC_LEVELS = {
        STATE: "state",

        COUNTY: "county",

        CITY: "city",

        ZIP: "zip",

        METRO: "metro",

        REGION: "region",

        LOCAL: "local"
    };

    /*
    ========================================================
    INTERNAL STATE
    ========================================================
    */

    let state = createInitialState();

    const subscribers = [];

    /*
    ========================================================
    INITIAL STATE
    ========================================================
    */

    function createInitialState() {
        return {
            initialized: false,

            version: VERSION,

            location: {
                country: "USA",

                state: CONFIG.defaultState,

                county: "",

                city: "",

                zip: "",

                metro: "",

                region: "",

                address: ""
            },

            business: {
                type: "",

                industry: "",

                secondaryIndustries: [],

                stage: "",

                startup: null,

                existingBusiness: null,

                relocating: null,

                expanding: null,

                employees: null,

                annualRevenue: null,

                yearsInBusiness: null,

                investmentAmount: null,

                workingCapitalNeeded: null,

                propertyNeeded: null,

                commercialSpaceNeeded: null,

                remoteFriendly: null,

                exportPotential: null
            },

            preferences: {
                industries: [],

                businessTypes: [],

                financingTypes: [],

                minimumEmployees: 0,

                maximumEmployees: null,

                minimumRevenue: 0,

                activeProgramsOnly: true
            },

            economicProfile: {
                population: null,

                populationGrowth: null,

                laborForce: null,

                unemploymentRate: null,

                medianHouseholdIncome: null,

                perCapitaIncome: null,

                businessCount: null,

                newBusinessFormation: null,

                businessSurvivalRate: null,

                jobGrowth: null,

                wageGrowth: null,

                medianWage: null,

                commercialVacancy: null,

                officeVacancy: null,

                retailVacancy: null,

                industrialVacancy: null,

                costIndex: null,

                taxEnvironment: {},

                industryData: [],

                workforceData: [],

                financingData: [],

                developmentData: []
            },

            programs: [],

            industryMatches: [],

            financingMatches: [],

            workforceMatches: [],

            developmentMatches: [],

            profile: createEmptyProfile(),

            status: {
                loading: false,

                analyzed: false,

                lastUpdated: null,

                dataCoverage: 0,

                programCount: 0,

                industryCount: 0,

                financingCount: 0
            },

            metadata: {
                module: MODULE_NAME,

                version: VERSION,

                createdAt: new Date().toISOString(),

                updatedAt: new Date().toISOString()
            }
        };
    }

    function createEmptyProfile() {
        return {
            location: null,

            business: null,

            economicSnapshot: {},

            businessEnvironment: {
                level: "UNKNOWN",

                signals: [],

                findings: [],

                gaps: []
            },

            industry: {
                matches: [],

                categories: {},

                signals: []
            },

            financing: {
                available: [],

                categories: {},

                signals: []
            },

            workforce: {
                profile: [],

                signals: []
            },

            development: {
                programs: [],

                signals: []
            },

            incentives: {
                total: 0,

                matched: 0,

                categories: {}
            },

            opportunity: {
                pathways: [],

                readiness: 0,

                businessReadiness: 0,

                expansionReadiness: 0,

                relocationReadiness: 0,

                startupReadiness: 0
            },

            signals: [],

            findings: [],

            gaps: [],

            actions: [],

            summary: "",

            aiContext: null,

            sharedContext: null
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

    function normalizeText(value) {
        if (
            value === null ||
            value === undefined
        ) {
            return "";
        }

        return String(value).trim();
    }

    function normalizeState(value) {
        return normalizeText(value).toUpperCase();
    }

    function safeNumber(
        value,
        fallback = 0
    ) {
        const number = Number(value);

        return Number.isFinite(number)
            ? number
            : fallback;
    }

    function meaningful(value) {
        if (
            value === null ||
            value === undefined
        ) {
            return false;
        }

        if (
            typeof value === "string"
        ) {
            return value.trim() !== "";
        }

        if (
            typeof value === "number"
        ) {
            return Number.isFinite(value);
        }

        if (Array.isArray(value)) {
            return value.length > 0;
        }

        if (
            typeof value === "object"
        ) {
            return Object.keys(value).length > 0;
        }

        return true;
    }

    function normalizeArray(value) {
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

    function unique(values) {
        return Array.from(
            new Set(values)
        );
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

    function increment(
        object,
        key
    ) {
        if (!key) {
            return;
        }

        object[key] =
            safeNumber(
                object[key],
                0
            ) + 1;
    }

    function emit(
        eventName,
        payload = {}
    ) {
        const event = {
            event: eventName,

            timestamp: now(),

            payload:
                safeClone(payload)
        };

        subscribers.forEach(
            function (subscriber) {
                try {
                    subscriber(event);
                } catch (error) {
                    console.warn(
                        "[RO'Lyfe Business] subscriber error:",
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
                        "rolyfe:business:" +
                            eventName,
                        {
                            detail: event
                        }
                    )
                );
            } catch (error) {
                // Ignore unsupported browser event errors.
            }
        }
    }

    /*
    ========================================================
    LOCATION
    ========================================================
    */

    function setLocation(
        location = {}
    ) {
        state.location = {
            ...state.location,

            ...location,

            state:
                normalizeState(
                    location.state ||
                        state.location.state
                ),

            county:
                normalizeText(
                    location.county ??
                        state.location.county
                ),

            city:
                normalizeText(
                    location.city ??
                        state.location.city
                ),

            zip:
                normalizeText(
                    location.zip ??
                        state.location.zip
                ),

            metro:
                normalizeText(
                    location.metro ??
                        state.location.metro
                ),

            region:
                normalizeText(
                    location.region ??
                        state.location.region
                )
        };

        state.metadata.updatedAt =
            now();

        emit(
            "location-changed",
            {
                location:
                    state.location
            }
        );

        return getLocation();
    }

    function getLocation() {
        return safeClone(
            state.location
        );
    }

    /*
    ========================================================
    BUSINESS PROFILE
    ========================================================
    */

    function setBusiness(
        business = {}
    ) {
        state.business = {
            ...state.business,
            ...business
        };

        if (
            business.secondaryIndustries !==
            undefined
        ) {
            state.business.secondaryIndustries =
                normalizeArray(
                    business.secondaryIndustries
                );
        }

        state.metadata.updatedAt =
            now();

        emit(
            "business-changed",
            {
                business:
                    state.business
            }
        );

        return getBusiness();
    }

    function getBusiness() {
        return safeClone(
            state.business
        );
    }

    /*
    ========================================================
    PREFERENCES
    ========================================================
    */

    function setPreferences(
        preferences = {}
    ) {
        state.preferences = {
            ...state.preferences,
            ...preferences
        };

        [
            "industries",
            "businessTypes",
            "financingTypes"
        ].forEach(
            function (key) {
                if (
                    preferences[key] !==
                    undefined
                ) {
                    state.preferences[key] =
                        normalizeArray(
                            preferences[key]
                        );
                }
            }
        );

        persist();

        emit(
            "preferences-changed",
            {
                preferences:
                    state.preferences
            }
        );

        return getPreferences();
    }

    function getPreferences() {
        return safeClone(
            state.preferences
        );
    }

    /*
    ========================================================
    ECONOMIC DATA INGESTION
    ========================================================
    */

    function ingestEconomicData(
        data = {},
        options = {}
    ) {
        const normalized =
            normalizeEconomicData(
                data
            );

        if (
            options.replace === true
        ) {
            state.economicProfile =
                normalized;
        } else {
            state.economicProfile = {
                ...state.economicProfile,
                ...normalized,

                taxEnvironment: {
                    ...state.economicProfile
                        .taxEnvironment,
                    ...(
                        normalized.taxEnvironment ||
                        {}
                    )
                }
            };
        }

        state.metadata.updatedAt =
            now();

        persist();

        emit(
            "economic-data-ingested",
            {
                economicProfile:
                    state.economicProfile
            }
        );

        return getEconomicProfile();
    }

    function normalizeEconomicData(
        data = {}
    ) {
        return {
            population:
                nullableNumber(
                    data.population
                ),

            populationGrowth:
                nullableNumber(
                    data.populationGrowth
                ),

            laborForce:
                nullableNumber(
                    data.laborForce
                ),

            unemploymentRate:
                nullableNumber(
                    data.unemploymentRate
                ),

            medianHouseholdIncome:
                nullableNumber(
                    data.medianHouseholdIncome
                ),

            perCapitaIncome:
                nullableNumber(
                    data.perCapitaIncome
                ),

            businessCount:
                nullableNumber(
                    data.businessCount
                ),

            newBusinessFormation:
                nullableNumber(
                    data.newBusinessFormation
                ),

            businessSurvivalRate:
                nullableNumber(
                    data.businessSurvivalRate
                ),

            jobGrowth:
                nullableNumber(
                    data.jobGrowth
                ),

            wageGrowth:
                nullableNumber(
                    data.wageGrowth
                ),

            medianWage:
                nullableNumber(
                    data.medianWage
                ),

            commercialVacancy:
                nullableNumber(
                    data.commercialVacancy
                ),

            officeVacancy:
                nullableNumber(
                    data.officeVacancy
                ),

            retailVacancy:
                nullableNumber(
                    data.retailVacancy
                ),

            industrialVacancy:
                nullableNumber(
                    data.industrialVacancy
                ),

            costIndex:
                nullableNumber(
                    data.costIndex
                ),

            taxEnvironment:
                data.taxEnvironment &&
                typeof data.taxEnvironment ===
                    "object"
                    ? safeClone(
                          data.taxEnvironment
                      )
                    : {},

            industryData:
                normalizeArray(
                    data.industryData
                ),

            workforceData:
                normalizeArray(
                    data.workforceData
                ),

            financingData:
                normalizeArray(
                    data.financingData
                ),

            developmentData:
                normalizeArray(
                    data.developmentData
                )
        };
    }

    function nullableNumber(
        value
    ) {
        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return null;
        }

        const number =
            Number(value);

        return Number.isFinite(number)
            ? number
            : null;
    }

    function getEconomicProfile() {
        return safeClone(
            state.economicProfile
        );
    }

    /*
    ========================================================
    INDUSTRY NORMALIZATION
    ========================================================
    */

    function normalizeIndustry(
        industry = {}
    ) {
        return {
            id:
                normalizeText(
                    industry.id
                ) ||
                createId(
                    industry.name,
                    industry.category
                ),

            name:
                normalizeText(
                    industry.name
                ) ||
                "Unnamed Industry",

            category:
                normalizeText(
                    industry.category
                ) ||
                "",

            description:
                normalizeText(
                    industry.description
                ),

            employment:
                nullableNumber(
                    industry.employment
                ),

            establishments:
                nullableNumber(
                    industry.establishments
                ),

            jobGrowth:
                nullableNumber(
                    industry.jobGrowth
                ),

            wageGrowth:
                nullableNumber(
                    industry.wageGrowth
                ),

            medianWage:
                nullableNumber(
                    industry.medianWage
                ),

            projectedGrowth:
                nullableNumber(
                    industry.projectedGrowth
                ),

            concentration:
                nullableNumber(
                    industry.concentration
                ),

            locationQuotient:
                nullableNumber(
                    industry.locationQuotient
                ),

            demand:
                normalizeText(
                    industry.demand
                ),

            tags:
                unique(
                    normalizeArray(
                        industry.tags
                    )
                        .map(normalizeText)
                        .filter(Boolean)
                ),

            source:
                normalizeText(
                    industry.source
                ),

            sourceUrl:
                normalizeText(
                    industry.sourceUrl
                ),

            verified:
                industry.verified === true
        };
    }

    function createId(
        name,
        category
    ) {
        return (
            [
                name,
                category
            ]
                .filter(Boolean)
                .join("-")
                .toLowerCase()
                .replace(
                    /[^a-z0-9]+/g,
                    "-"
                )
                .replace(
                    /^-+|-+$/g,
                    ""
                ) ||
            "business-" +
                Date.now()
        );
    }

    /*
    ========================================================
    INDUSTRY MATCHING
    ========================================================
    */

    function matchIndustry(
        industry,
        business = state.business
    ) {
        const normalized =
            normalizeIndustry(
                industry
            );

        let score = 0;

        const reasons = [];

        const gaps = [];

        const requestedIndustry =
            normalizeText(
                business.industry
            ).toLowerCase();

        const secondary =
            normalizeArray(
                business.secondaryIndustries
            ).map(
                function (item) {
                    return normalizeText(
                        item
                    ).toLowerCase();
                }
            );

        const category =
            normalizeText(
                normalized.category
            ).toLowerCase();

        const name =
            normalizeText(
                normalized.name
            ).toLowerCase();

        /*
        ----------------------------------------------------
        Direct industry match
        ----------------------------------------------------
        */

        if (
            requestedIndustry &&
            (
                category ===
                    requestedIndustry ||
                name ===
                    requestedIndustry ||
                normalized.tags.some(
                    function (tag) {
                        return (
                            normalizeText(
                                tag
                            ).toLowerCase() ===
                            requestedIndustry
                        );
                    }
                )
            )
        ) {
            score += 45;

            reasons.push(
                "Industry directly matches the requested business profile."
            );
        }

        /*
        ----------------------------------------------------
        Secondary industry
        ----------------------------------------------------
        */

        if (
            secondary.some(
                function (item) {
                    return (
                        item === category ||
                        item === name
                    );
                }
            )
        ) {
            score += 20;

            reasons.push(
                "Industry aligns with a secondary business interest."
            );
        }

        /*
        ----------------------------------------------------
        Growth
        ----------------------------------------------------
        */

        if (
            meaningful(
                normalized.jobGrowth
            )
        ) {
            if (
                normalized.jobGrowth > 0
            ) {
                score += 10;

                reasons.push(
                    "Industry shows positive reported job growth."
                );
            }
        } else {
            gaps.push(
                "Industry job-growth data is missing."
            );
        }

        /*
        ----------------------------------------------------
        Demand
        ----------------------------------------------------
        */

        const demand =
            normalized.demand.toLowerCase();

        if (
            demand === "high" ||
            demand === "growing"
        ) {
            score += 10;

            reasons.push(
                "Industry demand is marked as growing or high."
            );
        }

        /*
        ----------------------------------------------------
        Location quotient
        ----------------------------------------------------
        */

        if (
            meaningful(
                normalized.locationQuotient
            )
        ) {
            if (
                normalized.locationQuotient >=
                1
            ) {
                score += 10;

                reasons.push(
                    "Industry concentration is at or above the reference level."
                );
            }
        }

        /*
        ----------------------------------------------------
        Verification
        ----------------------------------------------------
        */

        if (
            normalized.verified
        ) {
            score += 5;
