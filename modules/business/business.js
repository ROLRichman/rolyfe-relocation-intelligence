/*
============================================================
RO'Lyfe Relocation Intelligence Center™
MODULE: Business & Economic Intelligence
FILE: /modules/business/business.js
VERSION: 1.0.0
============================================================

PURPOSE
-------
Business and economic intelligence layer for the
RO'Lyfe Relocation Intelligence Center.

This module connects LOCATION to:

    BUSINESS
    ↓
    INDUSTRY
    ↓
    JOBS / WORKFORCE
    ↓
    CAPITAL
    ↓
    INCENTIVES
    ↓
    PROPERTY
    ↓
    DEVELOPMENT
    ↓
    OPPORTUNITY

CORE QUESTIONS
--------------
- What is the business environment?
- What industries are present?
- What business assistance may exist?
- What financing programs may exist?
- What workforce resources exist?
- What tax incentives may apply?
- Is the location relevant to a particular business strategy?
- What information is missing?

IMPORTANT
---------
This module does not declare a location universally
"best" for business.

It identifies documented signals, opportunities,
requirements, gaps, and potential pathways.

Program eligibility and funding availability must be
verified with the administering organization.

DESIGNED FOR
------------
State
County
City
ZIP
Business
Startup
Investor
Developer
Employer
Entrepreneur

FUTURE INTEGRATIONS
-------------------
- live economic data
- BLS
- Census
- BEA
- SBA
- state economic-development agencies
- local economic-development organizations
- business licensing
- workforce data
- commercial property
- incentives
- capital
- RO'Lyfe Real Estate Command Center
- RO'Lyfe Funding Intelligence
- RO'Lyfe AI Advisor

============================================================
*/

(function (global) {
    "use strict";

    const VERSION = "1.0.0";

    const MODULE_NAME = "ROlyfeBusiness";

    const STORAGE_KEY =
        "rolyfe_business_intelligence_v1";

    /*
    ========================================================
    CONFIGURATION
    ========================================================
    */

    const CONFIG = {

        autoInitialize: true,

        defaultState: "PA",

        dataVersion: "1.0.0",

        cacheEnabled: true,

        cacheMinutes: 60,

        maxIndustries: 100,

        maxPrograms: 100,

        maxSignals: 50,

        maxFindings: 50,

        maxActions: 30

    };

    /*
    ========================================================
    BUSINESS TYPES
    ========================================================
    */

    const BUSINESS_TYPES = {

        STARTUP: "startup",

        SMALL_BUSINESS: "small_business",

        EXISTING_BUSINESS: "existing_business",

        HOME_BASED: "home_based_business",

        PROFESSIONAL: "professional_service",

        RETAIL: "retail",

        RESTAURANT: "restaurant",

        MANUFACTURING: "manufacturing",

        TECHNOLOGY: "technology",

        HEALTHCARE: "healthcare",

        CONSTRUCTION: "construction",

        REAL_ESTATE: "real_estate",

        LOGISTICS: "logistics",

        AGRICULTURE: "agriculture",

        ENERGY: "energy",

        CREATIVE: "creative",

        FRANCHISE: "franchise",

        NONPROFIT: "nonprofit",

        INVESTMENT: "investment"

    };

    /*
    ========================================================
    FUNDING TYPES
    ========================================================
    */

    const FUNDING_TYPES = {

        GRANT: "grant",

        LOAN: "loan",

        LOAN_GUARANTEE: "loan_guarantee",

        TAX_CREDIT: "tax_credit",

        TAX_ABATEMENT: "tax_abatement",

        EQUITY: "equity",

        BOND: "bond",

        WORKFORCE: "workforce",

        TECHNICAL_ASSISTANCE:
            "technical_assistance",

        REBATE: "rebate",

        OTHER: "other"

    };

    /*
    ========================================================
    INDUSTRY CATEGORIES
    ========================================================
    */

    const INDUSTRIES = {

        TECHNOLOGY: "technology",

        AI: "artificial_intelligence",

        ROBOTICS: "robotics",

        SOFTWARE: "software",

        HEALTHCARE: "healthcare",

        LIFE_SCIENCES: "life_sciences",

        MANUFACTURING: "manufacturing",

        ADVANCED_MANUFACTURING:
            "advanced_manufacturing",

        ENERGY: "energy",

        CLEAN_ENERGY: "clean_energy",

        LOGISTICS: "logistics",

        TRANSPORTATION:
            "transportation",

        CONSTRUCTION: "construction",

        REAL_ESTATE:
            "real_estate",

        FINANCE: "finance",

        PROFESSIONAL_SERVICES:
            "professional_services",

        RETAIL: "retail",

        HOSPITALITY: "hospitality",

        AGRICULTURE: "agriculture",

        FOOD: "food",

        TOURISM: "tourism",

        EDUCATION: "education",

        DEFENSE: "defense",

        AEROSPACE: "aerospace",

        CREATIVE: "creative",

        TELECOMMUNICATIONS:
            "telecommunications"

    };

    /*
    ========================================================
    INITIAL STATE
    ========================================================
    */

    let state =
        createInitialState();

    const subscribers = [];

    function createInitialState() {

        return {

            initialized: false,

            version: VERSION,

            location: {

                country: "USA",

                state:
                    CONFIG.defaultState,

                county: "",

                city: "",

                zip: "",

                address: ""

            },

            businessProfile: {

                type: "",

                industry: "",

                industries: [],

                startup: null,

                existingBusiness: null,

                relocatingBusiness: null,

                expanding: null,

                employees: null,

                annualRevenue: null,

                startupCapitalNeeded: null,

                expansionCapitalNeeded: null,

                propertyNeeded: null,

                commercialPropertyNeeded:
                    null,

                remoteFriendly: null,

                franchise: null,

                veteranOwned: null,

                womanOwned: null,

                minorityOwned: null,

                ruralBusiness: null

            },

            economicData: {

                population: null,

                populationGrowth: null,

                laborForce: null,

                unemploymentRate: null,

                medianHouseholdIncome:
                    null,

                perCapitaIncome: null,

                businessCount: null,

                newBusinessRate: null,

                jobGrowth: null,

                wageGrowth: null,

                medianWage: null,

                majorEmployers: [],

                industries: [],

                workforce: {},

                economicIndicators: {}

            },

            programs: [],

            incentives: [],

            preferences: {

                industries: [],

                fundingTypes: [],

                businessTypes: [],

                activeOnly: true,

                verifiedOnly: false,

                minimumBenefit: 0

            },

            matches: [],

            profile:
                createEmptyProfile(),

            status: {

                loading: false,

                analyzed: false,

                lastUpdated: null,

                programCount: 0,

                incentiveCount: 0,

                matchCount: 0,

                industryCount: 0

            },

            metadata: {

                module:
                    MODULE_NAME,

                version:
                    VERSION,

                createdAt:
                    new Date().toISOString(),

                updatedAt:
                    new Date().toISOString()

            }

        };

    }

    function createEmptyProfile() {

        return {

            location: null,

            business: null,

            economicSnapshot: null,

            industryProfile: {

                industries: [],

                primary: "",

                secondary: []

            },

            workforce: {},

            funding: {

                programs: 0,

                matched: 0,

                fundingTypes: {},

                knownValue: 0

            },

            incentives: {

                total: 0,

                matched: 0,

                taxCredits: 0,

                grants: 0,

                loans: 0,

                abatements: 0

            },

            opportunity: {

                businessReadiness: 0,

                economicCoverage: 0,

                fundingCoverage: 0,

                incentiveCoverage: 0,

                industryCoverage: 0

            },

            signals: [],

            findings: [],

            actions: [],

            gaps: [],

            summary: "",

            aiContext: null,

            sharedContext: null

        };

    }

    /*
    ========================================================
    HELPERS
    ========================================================
    */

    function now() {

        return new Date().toISOString();

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

    function number(
        value,
        fallback = 0
    ) {

        const n =
            Number(value);

        return Number.isFinite(n)
            ? n
            : fallback;

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

    function unique(values) {

        return Array.from(
            new Set(values)
        );

    }

    function clone(value) {

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
            number(
                object[key],
                0
            ) + 1;

    }

    /*
    ========================================================
    EVENTS
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
                clone(payload)

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
            typeof window !==
                "undefined" &&
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

            } catch (error) {}

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
                text(
                    location.state ||
                    state.location.state
                ).toUpperCase(),

            county:
                text(
                    location.county ??
                    state.location.county
                ),

            city:
                text(
                    location.city ??
                    state.location.city
                ),

            zip:
                text(
                    location.zip ??
                    state.location.zip
                ),

            address:
                text(
                    location.address ??
                    state.location.address
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

        return clone(
            state.location
        );

    }

    /*
    ========================================================
    BUSINESS PROFILE
    ========================================================
    */

    function setBusinessProfile(
        profile = {}
    ) {

        state.businessProfile = {

            ...state.businessProfile,

            ...profile

        };

        if (
            profile.industries !==
                undefined
        ) {

            state.businessProfile.industries =
                array(
                    profile.industries
                );

        }

        state.metadata.updatedAt =
            now();

        emit(
            "business-profile-changed",
            {
                profile:
                    state.businessProfile
            }
        );

        return getBusinessProfile();

    }

    function getBusinessProfile() {

        return clone(
            state.businessProfile
        );

    }

    /*
    ========================================================
    ECONOMIC DATA
    ========================================================
    */

    function setEconomicData(
        data = {}
    ) {

        state.economicData = {

            ...state.economicData,

            ...data

        };

        if (
            data.majorEmployers
        ) {

            state.economicData.majorEmployers =
                array(
                    data.majorEmployers
                );

        }

        if (
            data.industries
        ) {

            state.economicData.industries =
                array(
                    data.industries
                );

        }

        state.metadata.updatedAt =
            now();

        emit(
            "economic-data-updated",
            {
                data:
                    state.economicData
            }
        );

        return getEconomicData();

    }

    function getEconomicData() {

        return clone(
            state.economicData
        );

    }

    /*
    ========================================================
    PROGRAM NORMALIZATION
    ========================================================
    */

    function normalizeProgram(
        program = {}
    ) {

        const normalized = {

            id:
                text(
                    program.id ||
                    program.programId
                ) ||
                createProgramId(
                    program
                ),

            name:
                text(
                    program.name ||
                    program.title
                ) ||
                "Unnamed Business Program",

            description:
                text(
                    program.description ||
                    program.summary
                ),

            agency:
                text(
                    program.agency ||
                    program.provider
                ),

            state:
                text(
                    program.state ||
                    state.location.state
                ).toUpperCase(),

            county:
                text(
                    program.county
                ),

            city:
                text(
                    program.city
                ),

            type:
                text(
                    program.type ||
                    program.programType
                ) ||
                "business_assistance",

            industries:
                unique(
                    array(
                        program.industries ||
                        program.industry
                    )
                        .map(text)
                        .filter(Boolean)
                ),

            businessTypes:
                unique(
                    array(
                        program.businessTypes ||
                        program.businessType
                    )
                        .map(text)
                        .filter(Boolean)
                ),

            fundingType:
                text(
                    program.fundingType ||
                    program.funding_type
                ) ||
                FUNDING_TYPES.OTHER,

            benefit:
                number(
                    program.benefit ||
                    program.amount ||
                    program.maxBenefit,
                    0
                ),

            benefitText:
                text(
                    program.benefitText ||
                    program.benefitDescription
                ),

            minimumInvestment:
                number(
                    program.minimumInvestment,
                    0
                ),

            maximumInvestment:
                number(
                    program.maximumInvestment,
                    0
                ),

            jobCreationRequirement:
                number(
                    program.jobCreationRequirement,
                    0
                ),

            employeeRequirement:
                number(
                    program.employeeRequirement,
                    0
                ),

            revenueRequirement:
                number(
                    program.revenueRequirement,
                    0
                ),

            geographicLevel:
                text(
                    program.geographicLevel
                ) ||
                inferGeographicLevel(
                    program
                ),

            eligibility:
                array(
                    program.eligibility ||
                    program.eligibilityRequirements
                )
                    .map(text)
                    .filter(Boolean),

            requirements:
                array(
                    program.requirements
                )
                    .map(text)
                    .filter(Boolean),

            documentation:
                array(
                    program.documentation ||
                    program.documents
                )
                    .map(text)
                    .filter(Boolean),

            status:
                text(
                    program.status
                ) ||
                "UNKNOWN",

            deadline:
                text(
                    program.deadline
                ),

            source:
                text(
                    program.source
                ),

            sourceUrl:
                text(
                    program.sourceUrl ||
                    program.url
                ),

            official:
                program.official === true,

            verified:
                program.verified === true,

            lastVerified:
                text(
                    program.lastVerified
                ),

            tags:
                unique(
                    array(
                        program.tags
                    )
                        .map(text)
                        .filter(Boolean)
                ),

            notes:
                text(
                    program.notes
                )

        };

        return normalized;

    }

    function createProgramId(
        program
    ) {

        const base = [

            program.name,

            program.state,

            program.county,

            program.city,

            program.type

        ]
            .filter(Boolean)
            .join("-");

        return (
            base
                .toLowerCase()
                .replace(
                    /[^a-z0-9]+/g,
                    "-"
                )
                .replace(
                    /^-+|-+$/g,
                    ""
                )
            ||
            "business-program-" +
            Date.now()
        );

    }

    function inferGeographicLevel(
        program
    ) {

        if (program.zip) {

            return "zip";

        }

        if (program.city) {

            return "city";

        }

        if (program.county) {

            return "county";

        }

        if (program.state) {

            return "state";

        }

        return "unknown";

    }

    /*
    ========================================================
    PROGRAM INGESTION
    ========================================================
    */

    function ingestPrograms(
        programs,
        options = {}
    ) {

        const incoming =
            array(programs)
                .filter(
                    function (program) {

                        return (
                            program &&
                            typeof program ===
                                "object"
                        );

                    }
                )
                .map(
                    normalizeProgram
                );

        if (
            options.replace === true
        ) {

            state.programs =
                dedupePrograms(
                    incoming
                );

        } else {

            state.programs =
                dedupePrograms(
                    state.programs.concat(
                        incoming
                    )
                );

        }

        state.status.programCount =
            state.programs.length;

        state.metadata.updatedAt =
            now();

        persist();

        emit(
            "programs-ingested",
            {
                added:
                    incoming.length,

                total:
                    state.programs.length
            }
        );

        if (
            options.analyze !== false
        ) {

            analyze();

        }

        return getPrograms();

    }

    function ingestIncentives(
        programs,
        options = {}
    ) {

        const result =
            ingestPrograms(
                programs,
                options
            );

        state.incentives =
            state.programs.filter(
                function (program) {

                    return (
                        program.fundingType ===
                            FUNDING_TYPES.GRANT ||
                        program.fundingType ===
                            FUNDING_TYPES.LOAN ||
                        program.fundingType ===
                            FUNDING_TYPES.TAX_CREDIT ||
                        program.fundingType ===
                            FUNDING_TYPES.TAX_ABATEMENT ||
                        program.type ===
                            "incentive"
                    );

                }
            );

        state.status.incentiveCount =
            state.incentives.length;

        return result;

    }

    function dedupePrograms(
        programs
    ) {

        const map =
            new Map();

        programs.forEach(
            function (program) {

                const normalized =
                    normalizeProgram(
                        program
                    );

                map.set(
                    normalized.id,
                    normalized
                );

            }
        );

        return Array.from(
            map.values()
        );

    }

    /*
    ========================================================
    LOCATION MATCH
    ========================================================
    */

    function locationMatches(
        program
    ) {

        const location =
            state.location;

        const programState =
            text(
                program.state
            ).toUpperCase();

        const targetState =
            text(
                location.state
            ).toUpperCase();

        if (
            programState &&
            targetState &&
            programState !==
                targetState
        ) {

            return false;

        }

        if (
            program.county &&
            location.county &&
            program.county
                .toLowerCase() !==
                location.county
                    .toLowerCase()
        ) {

            return false;

        }

        if (
            program.city &&
            location.city &&
            program.city
                .toLowerCase() !==
                location.city
                    .toLowerCase()
        ) {

            return false;

        }

        return true;

    }

    function geographicMatch(
        program
    ) {

        const location =
            state.location;

        if (
            program.city &&
            location.city &&
            program.city.toLowerCase() ===
                location.city.toLowerCase()
        ) {

            return "CITY";

        }

        if (
            program.county &&
            location.county &&
            program.county.toLowerCase() ===
                location.county.toLowerCase()
        ) {

            return "COUNTY";

        }

        if (
            program.state &&
            location.state &&
            program.state.toUpperCase() ===
                location.state.toUpperCase()
        ) {

            return "STATE";

        }

        return "UNKNOWN";

    }

    /*
    ========================================================
    PROGRAM STATUS
    ========================================================
    */

    function isActive(
        program
    ) {

        const status =
            text(
                program.status
            ).toUpperCase();

        return (

            status === "ACTIVE" ||

            status === "OPEN" ||

            status === "CURRENT"

        );

    }

    /*
    ========================================================
    PROGRAM MATCH ENGINE
    ========================================================
    */

    function matchProgram(
        program,
        options = {}
    ) {

        const normalized =
            normalizeProgram(
                program
            );

        const business =
            options.businessProfile ||
            state.businessProfile;

        const preferences =
            options.preferences ||
            state.preferences;

        if (
            !locationMatches(
                normalized
            )
        ) {

            return {

                matched: false,

                score: 0,

                program:
                    normalized,

                reasons: [
                    "Program does not match the selected location."
                ],

                gaps: []

            };

        }

        if (
            preferences.activeOnly &&
            !isActive(
                normalized
            )
        ) {

            return {

                matched: false,

                score: 0,

                program:
                    normalized,

                reasons: [
                    "Program is not marked active."
                ],

                gaps: []

            };

        }

        if (
            preferences.verifiedOnly &&
            !normalized.verified
        ) {

            return {

                matched: false,

                score: 0,

                program:
                    normalized,

                reasons: [
                    "Program is not verified."
                ],

                gaps: []

            };

        }

        /*
        ----------------------------------------------------
        Industry matching
        ----------------------------------------------------
        */

        let score = 0;

        const reasons = [];

        const gaps = [];

        const targetIndustries =
            unique(
                array(
                    business.industries
                )
                    .concat(
                        business.industry
                    )
                    .filter(Boolean)
            );

        if (
            targetIndustries.length &&
            normalized.industries.length
        ) {

            const industryMatch =
                targetIndustries.some(
                    function (industry) {

                        return normalized
                            .industries
                            .some(
                                function (
                                    programIndustry
                                ) {

                                    return (
                                        text(
                                            programIndustry
                                        ).toLowerCase() ===
                                        text(
                                            industry
                                        ).toLowerCase()
                                    );

                                }
                            );

                    }
                );

            if (
                industryMatch
            ) {

                score += 30;

                reasons.push(
                    "Business industry matches the program."
                );

            }

        } else {

            gaps.push(
                "Industry-specific eligibility is not fully defined."
            );

        }

        /*
        ----------------------------------------------------
        Business type
        ----------------------------------------------------
        */

        if (
            business.type &&
            normalized.businessTypes.length
        ) {

            const businessTypeMatch =
                normalized.businessTypes
                    .map(
                        function (value) {

                            return text(
                                value
                            ).toLowerCase();

                        }
                    )
                    .includes(
                        text(
                            business.type
                        ).toLowerCase()
                    );

            if (
                businessTypeMatch
            ) {

                score += 25;

                reasons.push(
                    "Business type matches the program."
                );

            } else {

                return {

                    matched: false,

                    score: 0,

                    program:
                        normalized,

                    reasons: [
                        "Business type does not match listed eligibility."
                    ],

                    gaps: []

                };

            }

        }

        /*
        ----------------------------------------------------
        Startup
        ----------------------------------------------------
        */

        if (
            business.startup === true &&
            (
                normalized.businessTypes.includes(
                    BUSINESS_TYPES.STARTUP
                ) ||
                normalized.tags.includes(
                    "startup"
                )
            )
        ) {

            score += 15;

            reasons.push(
                "Program may support startup activity."
            );

        }

        /*
        ----------------------------------------------------
        Expansion
        ----------------------------------------------------
        */

        if (
            business.expanding === true &&
            (
                normalized.tags.includes(
                    "expansion"
                ) ||
                normalized.tags.includes(
                    "expanding-business"
                )
            )
        ) {

            score += 15;

            reasons.push(
                "Program may support business expansion."
            );

        }

        /*
        ----------------------------------------------------
        Job creation
        ----------------------------------------------------
        */

        if (
            normalized.jobCreationRequirement > 0
        ) {

            if (
                business.employees !== null &&
                business.employees !== undefined
            ) {

                if (
                    number(
                        business.employees
                    ) >=
                    normalized.jobCreationRequirement
                ) {

                    score += 10;

                    reasons.push(
                        "Reported workforce meets the listed job requirement."
                    );

                } else {

                    gaps.push(
                        "Job-creation requirements require verification."
                    );

                }

            } else {

                gaps.push(
                    "Program has a job-creation requirement."
                );

            }

        }

        /*
        ----------------------------------------------------
        Investment requirement
        ----------------------------------------------------
        */

        if (
            normalized.minimumInvestment > 0
        ) {

            if (
                business.expansionCapitalNeeded !==
                    null
            ) {

                if (
                    number(
                        business.expansionCapitalNeeded
                    ) >=
                    normalized.minimumInvestment
                ) {

                    score += 10;

                } else {

                    gaps.push(
                        "Reported investment level may not meet the program minimum."
                    );

                }

            } else {

                gaps.push(
                    "Program has a minimum investment requirement."
                );

            }

        }

        /*
        ----------------------------------------------------
        Geographic relevance
        ----------------------------------------------------
        */

        const geographicLevel =
            geographicMatch(
                normalized
            );

        if (
            geographicLevel ===
                "CITY"
        ) {

            score += 20;

            reasons.push(
                "Program matches the selected city."
            );

        } else if (
            geographicLevel ===
                "COUNTY"
        ) {

            score += 15;

            reasons.push(
                "Program matches the selected county."
            );

        } else if (
            geographicLevel ===
                "STATE"
        ) {

            score += 10;

            reasons.push(
                "Program matches the selected state."
            );

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

            reasons.push(
                "Program is marked verified."
            );

        } else {

            gaps.push(
                "Program information should be verified."
            );

        }

        /*
        ----------------------------------------------------
        Source
        ----------------------------------------------------
        */

        if (
            normalized.sourceUrl
        ) {

            score += 5;

        } else {

            gaps.push(
                "Official program source URL is missing."
            );

        }

        return {

            matched: true,

            score:
                Math.min(
                    score,
                    100
                ),

            program:
                normalized,

            geographicMatch:
                geographicLevel,

            reasons:
                unique(
                    reasons
                ),

            gaps:
                unique(
                    gaps
                )

        };

    }

    /*
    ========================================================
    ANALYZE
    ========================================================
    */

    function analyze(
        options = {}
    ) {

        state.status.loading =
            true;

        if (
            options.location
        ) {

            setLocation(
                options.location
            );

        }

        if (
            options.businessProfile
        ) {

            setBusinessProfile(
                options.businessProfile
            );

        }

        if (
            options.economicData
        ) {

            setEconomicData(
                options.economicData
            );

        }

        if (
            options.preferences
        ) {

            setPreferences(
                options.preferences
            );

        }

        const matches = [];

        state.programs =
            dedupePrograms(
                state.programs
            );

        state.programs.forEach(
            function (program) {

                const result =
                    matchProgram(
                        program,
                        {
                            businessProfile:
                                state.businessProfile,

                            preferences:
                                state.preferences
                        }
                    );

                if (
                    result.matched
                ) {

                    matches.push(
                        result
                    );

                }

            }
        );

        matches.sort(
            function (a, b) {

                return (
                    b.score -
                    a.score
                );

            }
        );

        state.matches =
            matches;

        state.profile =
            buildProfile(
                state.location,
                state.businessProfile,
                state.economicData,
                state.programs,
                matches
            );

        state.status.loading =
            false;

        state.status.analyzed =
            true;

        state.status.lastUpdated =
            now();

        state.status.programCount =
            state.programs.length;

        state.status.incentiveCount =
            state.incentives.length;

        state.status.matchCount =
            matches.length;

        state.status.industryCount =
            state.profile.industryProfile
                .industries.length;

        state.metadata.updatedAt =
            now();

        persist();

        emit(
            "analyzed",
            {
                location:
                    state.location,

                matchCount:
                    matches.length,

                programCount:
                    state.programs.length
            }
        );

        return getProfile();

    }

    /*
    ========================================================
    PROFILE
    ========================================================
    */

    function buildProfile(
        location,
        business,
        economic,
        programs,
        matches
    ) {

        const profile =
            createEmptyProfile();

        profile.location =
            clone(
                location
            );

        profile.business =
            clone(
                business
            );

        profile.economicSnapshot =
            buildEconomicSnapshot(
                economic
            );

        profile.industryProfile =
            buildIndustryProfile(
                business,
                economic
            );

        profile.workforce =
            buildWorkforceProfile(
                economic
            );

        profile.funding =
            buildFundingProfile(
                programs,
                matches
            );

        profile.incentives =
            buildIncentiveProfile(
                programs,
                matches
            );

        profile.opportunity =
            calculateOpportunity(
                business,
                economic,
                programs,
                matches
            );

        profile.signals =
            buildSignals(
                location,
                business,
                economic,
                programs,
                matches,
                profile
            );

        profile.findings =
            buildFindings(
                business,
                economic,
                programs,
                matches,
                profile
            );

        profile.gaps =
            buildGaps(
                business,
                economic,
                programs,
                matches
            );

        profile.actions =
            buildActions(
                location,
                business,
                economic,
                programs,
                matches,
                profile
            );

        profile.summary =
            buildSummary(
                location,
                business,
                economic,
                programs,
                matches,
                profile
            );

        profile.aiContext =
            buildAIContext(
                profile
            );

        profile.sharedContext =
            buildSharedContext(
                profile
            );

        return profile;

    }

    /*
    ========================================================
    ECONOMIC SNAPSHOT
    ========================================================
    */

    function buildEconomicSnapshot(
        economic
    ) {

        return {

            population:
                economic.population,

            populationGrowth:
                economic.populationGrowth,

            laborForce:
                economic.laborForce,

            unemploymentRate:
                economic.unemploymentRate,

            medianHouseholdIncome:
                economic.medianHouseholdIncome,

            perCapitaIncome:
                economic.perCapitaIncome,

            businessCount:
                economic.businessCount,

            newBusinessRate:
                economic.newBusinessRate,

            jobGrowth:
                economic.jobGrowth,

            wageGrowth:
                economic.wageGrowth,

            medianWage:
                economic.medianWage,

            majorEmployers:
                array(
                    economic.majorEmployers
                ),

            economicIndicators:
                clone(
                    economic.economicIndicators
                )

        };

    }

    /*
    ========================================================
    INDUSTRY PROFILE
    ========================================================
    */

    function buildIndustryProfile(
        business,
        economic
    ) {

        const industries =
            unique(

                array(
                    business.industries
                )
                    .concat(
                        business.industry
                    )
                    .concat(
                        array(
                            economic.industries
                        )
                    )
                    .filter(Boolean)

            );

        const primary =
            text(
                business.industry
            ) ||
            industries[0] ||
            "";

        return {

            industries,

            primary,

            secondary:
                industries.filter(
                    function (industry) {

                        return (
                            industry !==
                            primary
                        );

                    }
                )

        };

    }

    /*
    ========================================================
    WORKFORCE
    ========================================================
    */

    function buildWorkforceProfile(
        economic
    ) {

        return {

            laborForce:
                economic.laborForce,

            unemploymentRate:
                economic.unemploymentRate,

            medianWage:
                economic.medianWage,

            wageGrowth:
                economic.wageGrowth,

            jobGrowth:
                economic.jobGrowth,

            workforce:
                clone(
                    economic.workforce
                )

        };

    }

    /*
    ========================================================
    FUNDING PROFILE
    ========================================================
    */

    function buildFundingProfile(
        programs,
        matches
    ) {

        const fundingTypes = {};

        let knownValue = 0;

        programs.forEach(
            function (program) {

                increment(
                    fundingTypes,
                    program.fundingType
                );

            }
        );

        matches.forEach(
            function (match) {

                knownValue +=
                    number(
                        match.program.benefit,
                        0
                    );

            }
        );

        return {

            programs:
                programs.length,

            matched:
                matches.length,

            fundingTypes,

            knownValue

        };

    }

    /*
    ========================================================
    INCENTIVE PROFILE
    ========================================================
    */

    function buildIncentiveProfile(
        programs,
        matches
    ) {

        const result = {

            total:
                programs.length,

            matched:
                matches.length,

            taxCredits: 0,

            grants: 0,

            loans: 0,

            abatements: 0

        };

        programs.forEach(
            function (program) {

                if (
                    program.fundingType ===
                        FUNDING_TYPES.TAX_CREDIT
                ) {

                    result.taxCredits++;

                }

                if (
                    program.fundingType ===
                        FUNDING_TYPES.GRANT
                ) {

                    result.grants++;

                }

                if (
                    program.fundingType ===
                        FUNDING_TYPES.LOAN
                ) {

                    result.loans++;

                }

                if (
                    program.fundingType ===
                        FUNDING_TYPES.TAX_ABATEMENT
                ) {

                    result.abatements++;

                }

            }
        );

        return result;

    }

    /*
    ========================================================
    OPPORTUNITY METRICS
    ========================================================
    */

    function calculateOpportunity(
        business,
        economic,
        programs,
        matches
    ) {

        const economicFields = [

            economic.population,

            economic.populationGrowth,

            economic.laborForce,

            economic.unemploymentRate,

            economic.medianHouseholdIncome,

            economic.businessCount,

            economic.jobGrowth,

            economic.wageGrowth

        ];

        const economicPresent =
            economicFields.filter(
                function (value) {

                    return (
                        value !== null &&
                        value !== undefined &&
                        value !== ""
                    );

                }
            ).length;

        const economicCoverage =
            Math.round(
                (
                    economicPresent /
                    economicFields.length
                ) * 100
            );

        const industryCoverage =
            business.industries.length
                ? 100
                : economic.industries.length
                    ? 50
                    : 0;

        const fundingCoverage =
            programs.length
                ? 100
                : 0;

        const incentiveCoverage =
            matches.length
                ? 100
                : programs.length
                    ? 50
                    : 0;

        const businessFields = [

            business.type,

            business.industry,

            business.employees,

            business.annualRevenue,

            business.startupCapitalNeeded,

            business.expanding

        ];

        const businessPresent =
            businessFields.filter(
                function (value) {

                    return (
                        value !== null &&
                        value !== undefined &&
                        value !== ""
                    );

                }
            ).length;

        const businessReadiness =
            Math.round(
                (
                    businessPresent /
                    businessFields.length
                ) * 100
            );

        return {

            businessReadiness,

            economicCoverage,

            fundingCoverage,

            incentiveCoverage,

            industryCoverage

        };

    }

    /*
    ========================================================
    SIGNALS
    ========================================================
    */

    function buildSignals(
        location,
        business,
        economic,
        programs,
        matches,
        profile
    ) {

        const signals = [];

        if (
            economic.populationGrowth !==
                null &&
            economic.populationGrowth !==
                undefined
        ) {

            signals.push({

                type:
                    "POPULATION_GROWTH",

                level:
                    "informational",

                title:
                    "Population growth data available",

                value:
                    economic.populationGrowth

            });

        }

        if (
            economic.jobGrowth !==
                null &&
            economic.jobGrowth !==
                undefined
        ) {

            signals.push({

                type:
                    "JOB_GROWTH",

                level:
                    "informational",

                title:
                    "Job growth data available",

                value:
                    economic.jobGrowth

            });

        }

        if (
            economic.businessCount !==
                null &&
            economic.businessCount !==
                undefined
        ) {

            signals.push({

                type:
                    "BUSINESS_BASE",

                level:
                    "informational",

                title:
                    "Business-base data available",

                value:
                    economic.businessCount

            });

        }

        if (
            economic.majorEmployers.length
        ) {

            signals.push({

                type:
                    "MAJOR_EMPLOYERS",

                level:
                    "informational",

                title:
                    "Major employer data available",

                count:
                    economic.majorEmployers.length

            });

        }

        if (
            programs.length
        ) {

            signals.push({

                type:
                    "BUSINESS_PROGRAMS",

                level:
                    "positive",

                title:
                    "Business assistance programs detected",

                detail:
                    programs.length +
                    " business/economic program record(s) are loaded."

            });

        }

        if (
            matches.length
        ) {

            signals.push({

                type:
                    "BUSINESS_MATCHES",

                level:
                    "positive",

                title:
                    "Potential business program matches",

                detail:
                    matches.length +
                    " program(s) match the current business profile."

            });

        }

        if (
            profile.incentives.taxCredits
        ) {

            signals.push({

                type:
                    "TAX_CREDITS",

                level:
                    "positive",

                title:
                    "Tax-credit programs detected",

                count:
                    profile.incentives.taxCredits

            });

        }

        if (
            profile.incentives.grants
        ) {

            signals.push({

                type:
                    "GRANTS",

                level:
                    "positive",

                title:
                    "Business grants detected",

                count:
                    profile.incentives.grants

            });

        }

        if (
            profile.incentives.loans
        ) {

            signals.push({

                type:
                    "BUSINESS_LOANS",

                level:
                    "positive",

                title:
                    "Business financing programs detected",

                count:
                    profile.incentives.loans

            });

        }

        if (
            profile.incentives.abatements
        ) {

            signals.push({

                type:
                    "TAX_ABATEMENTS",

                level:
                    "positive",

                title:
                    "Tax-abatement programs detected",

                count:
                    profile.incentives.abatements

            });

        }

        if (
            !business.type
        ) {

            signals.push({

                type:
                    "PROFILE_INCOMPLETE",

                level:
                    "warning",

                title:
                    "Business profile incomplete",

                detail:
                    "Business type has not been defined."

            });

        }

        if (
            !business.industry &&
            !business.industries.length
        ) {

            signals.push({

                type:
                    "INDUSTRY_MISSING",

                level:
                    "warning",

                title:
                    "Industry not defined",

                detail:
                    "Add an industry to improve opportunity matching."

            });

        }

        return signals;

    }

    /*
    ========================================================
    FINDINGS
    ========================================================
    */

    function buildFindings(
        business,
        economic,
        programs,
        matches,
        profile
    ) {

        const findings = [];

        findings.push({

            type:
                "ECONOMIC_COVERAGE",

            title:
                "Economic data coverage",

            value:
                profile.opportunity
                    .economicCoverage

        });

        findings.push({

            type:
                "INDUSTRY_COVERAGE",

            title:
                "Industry coverage",

            value:
                profile.opportunity
                    .industryCoverage

        });

        findings.push({

            type:
                "FUNDING_COVERAGE",

            title:
                "Funding program coverage",

            value:
                profile.opportunity
                    .fundingCoverage

        });

        if (
            economic.unemploymentRate !==
                null
        ) {

            findings.push({

                type:
                    "UNEMPLOYMENT",

                title:
                    "Reported unemployment rate",

                value:
                    economic.unemploymentRate,

                note:
                    "Use the applicable geographic and time period when interpreting this metric."

            });

        }

        if (
            economic.medianWage !==
                null
        ) {

            findings.push({

                type:
                    "MEDIAN_WAGE",

                title:
                    "Reported median wage",

                value:
                    economic.medianWage

            });

        }

        if (
            economic.majorEmployers.length
        ) {

            findings.push({

                type:
                    "EMPLOYER_BASE",

                title:
                    "Major employers",

                value:
                    economic.majorEmployers

            });

        }

        if (
            matches.length
        ) {

            findings.push({

                type:
                    "PROGRAM_MATCHES",

                title:
                    "Potential program matches",

                value:
                    matches.length,

                note:
                    "Program relevance is not a guarantee of eligibility or funding."

            });

        }

        return findings;

    }

    /*
    ========================================================
    GAPS
    ========================================================
    */

    function buildGaps(
        business,
        economic,
        programs,
        matches
    ) {

        const gaps = [];

        if (
            !business.type
        ) {

            gaps.push(
                "Business type is not defined."
            );

        }

        if (
            !business.industry &&
            !business.industries.length
        ) {

            gaps.push(
                "Industry is not defined."
            );

        }

        if (
            economic.businessCount ===
                null
        ) {

            gaps.push(
                "Business-count data is not loaded."
            );

        }

        if (
            economic.jobGrowth ===
                null
        ) {

            gaps.push(
                "Job-growth data is not loaded."
            );

        }

        if (
            economic.laborForce ===
                null
        ) {

            gaps.push(
                "Labor-force data is not loaded."
            );

        }

        if (
            programs.length ===
                0
        ) {

            gaps.push(
                "Business funding and incentive programs have not been loaded."
            );

        }

        const missingSource =
            programs.filter(
                function (program) {

                    return !program.sourceUrl;

                }
            ).length;

        if (
            missingSource
        ) {

            gaps.push(
                missingSource +
                " program record(s) are missing source URLs."
            );

        }

        const unverified =
            programs.filter(
                function (program) {

                    return !program.verified;

                }
            ).length;

        if (
            unverified
        ) {

            gaps.push(
                unverified +
                " program record(s) require verification."
            );

        }

        if (
            !state.location.county &&
            !state.location.city &&
            !state.location.zip
        ) {

            gaps.push(
                "County, city, or ZIP is needed for deeper local-business analysis."
            );

        }

        return unique(
            gaps
        );

    }

    /*
    ========================================================
    ACTIONS
    ========================================================
    */

    function buildActions(
        location,
        business,
        economic,
        programs,
        matches,
        profile
    ) {

        const actions = [];

        if (
            !location.state
        ) {

            actions.push({

                priority:
                    "HIGH",

                action:
                    "Select a state before analyzing the business environment."

            });

        }

        if (
            !business.type
        ) {

            actions.push({

                priority:
                    "HIGH",

                action:
                    "Define the business type."

            });

        }

        if (
            !business.industry &&
            !business.industries.length
        ) {

            actions.push({

                priority:
                    "HIGH",

                action:
                    "Select the primary industry."

            });

        }

        if (
            !location.county &&
            !location.city &&
            !location.zip
        ) {

            actions.push({

                priority:
                    "MEDIUM",

                action:
                    "Add county, city, or ZIP to identify local business programs and economic-development resources."

            });

        }

        if (
            programs.length ===
                0
        ) {

            actions.push({

                priority:
                    "HIGH",

                action:
                    "Load current business financing, grants, tax credits, workforce, and economic-development programs."

            });

        }

        if (
            matches.length
        ) {

            actions.push({

                priority:
                    "MEDIUM",

                action:
                    "Verify matched programs, eligibility, funding availability, and deadlines with the administering agency."

            });

        }

        if (
            business.expanding ===
                true
        ) {

            actions.push({

                priority:
                    "MEDIUM",

                action:
                    "Review expansion financing, job-creation incentives, workforce programs, and site-development assistance."

            });

        }

        if (
            business.relocatingBusiness ===
                true
        ) {

            actions.push({

                priority:
                    "MEDIUM",

                action:
                    "Review business-relocation, site-selection, tax-zone, workforce, and economic-development programs."

            });

        }

        if (
            business.commercialPropertyNeeded ===
                true
        ) {

            actions.push({

                priority:
                    "MEDIUM",

                action:
                    "Connect the business analysis with commercial-property and development intelligence."

            });

        }

        return actions;

    }

    /*
    ========================================================
    SUMMARY
    ========================================================
    */

    function buildSummary(
        location,
        business,
        economic,
        programs,
        matches,
        profile
    ) {

        const locationLabel =
            [
                location.city,
                location.state
            ]
                .filter(Boolean)
                .join(", ") ||
            "the selected location";

        let summary =

            "Business intelligence for " +
            locationLabel +
            " includes " +
            profile.industryProfile
                .industries.length +
            " industry signal(s), " +
            programs.length +
            " business program record(s), and " +
            matches.length +
            " potential program match(es).";

        if (
            economic.majorEmployers.length
        ) {

            summary +=
                " Major-employer information is available.";

        }

        if (
            profile.incentives.taxCredits ||
            profile.incentives.grants ||
            profile.incentives.loans ||
            profile.incentives.abatements
        ) {

            summary +=
                " Business assistance may include grants, financing, tax credits, abatements, or related programs.";

        }

        summary +=
            " Eligibility, funding, and current availability should be verified with the applicable agency.";

        return summary;

    }

    /*
    ========================================================
    AI CONTEXT
    ========================================================
    */

    function buildAIContext(
        profile
    ) {

        return {

            module:
                MODULE_NAME,

            version:
                VERSION,

            purpose:
                "Analyze business environment, industries, workforce, financing, incentives, expansion, relocation, and economic opportunity.",

            location:
                clone(
                    profile.location
                ),

            business:
                clone(
                    profile.business
                ),

            economic:
                clone(
                    profile.economicSnapshot
                ),

            industries:
                clone(
                    profile.industryProfile
                ),

            workforce:
                clone(
                    profile.workforce
                ),

            funding:
                clone(
                    profile.funding
                ),

            incentives:
                clone(
                    profile.incentives
                ),

            opportunity:
                clone(
                    profile.opportunity
                ),

            signals:
                clone(
                    profile.signals
                ),

            findings:
                clone(
                    profile.findings
                ),

            actions:
                clone(
                    profile.actions
                ),

            gaps:
                clone(
                    profile.gaps
                ),

            guardrails: [

                "Do not invent economic data.",

                "Identify the relevant time period for economic statistics.",

                "Do not represent business incentives as guaranteed.",

                "Verify program eligibility and funding.",

                "Distinguish grants from loans.",

                "Distinguish tax credits from tax abatements.",

                "Do not treat a program-match score as a guarantee.",

                "Do not declare a universal best business location.",

                "Use the user's business profile and stated priorities when available."

            ]

        };

    }

    /*
    ========================================================
    SHARED CONTEXT
    ========================================================
    */

    function buildSharedContext(
        profile
    ) {

        let coreContext =
            null;

        try {

            if (
                global.ROlyfeCore &&
                typeof global.ROlyfeCore
                    .buildSharedContext ===
                    "function"
            ) {

                coreContext =
                    global.ROlyfeCore
                        .buildSharedContext();

            }

        } catch (error) {

            coreContext =
                null;

        }

        return {

            location:
                clone(
                    profile.location
                ),

            business: {

                type:
                    profile.business.type,

                industry:
                    profile.industryProfile
                        .primary,

                industries:
                    profile.industryProfile
                        .industries,

                employees:
                    profile.business
                        .employees,

                annualRevenue:
                    profile.business
                        .annualRevenue

            },

            economics:
                clone(
                    profile.economicSnapshot
                ),

            workforce:
                clone(
                    profile.workforce
                ),

            funding:
                clone(
                    profile.funding
                ),

            incentives:
                clone(
                    profile.incentives
                ),

            opportunity:
                clone(
                    profile.opportunity
                ),

            ai:
                profile.aiContext,

            core:
                coreContext

        };

    }

    /*
    ========================================================
    FILTER PROGRAMS
    ========================================================
    */

    function filterPrograms(
        filters = {}
    ) {

        return state.programs.filter(
            function (program) {

                if (
                    filters.type &&
                    program.type !==
                        filters.type
                ) {

                    return false;

                }

                if (
                    filters.fundingType &&
                    program.fundingType !==
                        filters.fundingType
                ) {

                    return false;

                }

                if (
                    filters.industry &&
                    !program.industries.includes(
                        filters.industry
                    )
                ) {

                    return false;

                }

                if (
                    filters.businessType &&
                    !program.businessTypes.includes(
                        filters.businessType
                    )
                ) {

                    return false;

                }

                if (
                    filters.verified ===
                        true &&
                    !program.verified
                ) {

                    return false;

                }

                if (
                    filters.active ===
                        true &&
                    !isActive(
                        program
                    )
                ) {

                    return false;

                }

                if (
                    filters.search
                ) {

                    const search =
                        text(
                            filters.search
                        )
                            .toLowerCase();

                    const haystack = [

                        program.name,

                        program.description,

                        program.agency,

                        program.type,

                        program.fundingType,

                        program.benefitText,

                        program.notes

                    ]
                        .join(" ")
                        .toLowerCase();

                    if (
                        !haystack.includes(
                            search
                        )
                    ) {

                        return false;

                    }

                }

                return true;

            }
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

        if (
            preferences.industries !==
                undefined
        ) {

            state.preferences.industries =
                array(
                    preferences.industries
                );

        }

        if (
            preferences.fundingTypes !==
                undefined
        ) {

            state.preferences.fundingTypes =
                array(
                    preferences.fundingTypes
                );

        }

        if (
            preferences.businessTypes !==
                undefined
        ) {

            state.preferences.businessTypes =
                array(
                    preferences.businessTypes
                );

        }

        state.metadata.updatedAt =
            now();

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

        return clone(
            state.preferences
        );

    }

    /*
    ========================================================
    GETTERS
    ========================================================
    */

    function getPrograms() {

        return clone(
            state.programs
        );

    }

    function getMatches() {

        return clone(
            state.matches
        );

    }

    function getProfile() {

        return clone(
            state.profile
        );

    }

    function getSignals() {

        return clone(
            state.profile.signals
        );

    }

    function getFindings() {

        return clone(
            state.profile.findings
        );

    }

    function getActions() {

        return clone(
            state.profile.actions
        );

    }

    function getGaps() {

        return clone(
            state.profile.gaps
        );

    }

    function getSummary() {

        return state.profile.summary;

    }

    function getAIContext() {

        return clone(
            state.profile.aiContext
        );

    }

    function getSharedContext() {

        return clone(
            state.profile.sharedContext
        );

    }

    function getState() {

        return clone(
            state
        );

    }

    function getStatus() {

        return clone(
            state.status
        );

    }

    /*
    ========================================================
    PROGRAM LOOKUP
    ========================================================
    */

    function getProgram(
        id
    ) {

        const target =
            text(id);

        const program =
            state.programs.find(
                function (item) {

                    return (
                        item.id ===
                        target
                    );

                }
            );

        return program
            ? clone(program)
            : null;

    }

    function getMatch(
        id
    ) {

        const target =
            text(id);

        const match =
            state.matches.find(
                function (item) {

                    return (
                        item.program.id ===
                        target
                    );

                }
            );

        return match
            ? clone(match)
            : null;

    }

    /*
    ========================================================
    CORE BRIDGE
    ========================================================
    */

    function analyzeFromCore(
        options = {}
    ) {

        let location =
            options.location;

        try {

            if (
                !location &&
                global.ROlyfeCore &&
                typeof global.ROlyfeCore
                    .getLocation ===
                    "function"
            ) {

                location =
                    global.ROlyfeCore
                        .getLocation();

            }

        } catch (error) {}

        if (
            location
        ) {

            setLocation(
                location
            );

        }

        return analyze(
            options
        );

    }

    /*
    ========================================================
    PERSISTENCE
    ========================================================
    */

    function persist() {

        if (
            !CONFIG.cacheEnabled ||
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
                "[RO'Lyfe Business] storage error:",
                error
            );

        }

    }

    function restore() {

        if (
            !CONFIG.cacheEnabled ||
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

            const defaults =
                createInitialState();

            state = {

                ...defaults,

                ...saved,

                location: {

                    ...defaults.location,

                    ...(saved.location || {})

                },

                businessProfile: {

                    ...defaults.businessProfile,

                    ...(saved.businessProfile || {})

                },

                economicData: {

                    ...defaults.economicData,

                    ...(saved.economicData || {})

                },

                preferences: {

                    ...defaults.preferences,

                    ...(saved.preferences || {})

                },

                status: {

                    ...defaults.status,

                    ...(saved.status || {})

                },

                metadata: {

                    ...defaults.metadata,

                    ...(saved.metadata || {})

                }

            };

            return true;

        } catch (error) {

            console.warn(
                "[RO'Lyfe Business] restore error:",
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
            options.clearStorage !==
                false &&
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
    SERIALIZE
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
            options.location
        ) {

            setLocation(
                options.location
            );

        }

        if (
            options.businessProfile
        ) {

            setBusinessProfile(
                options.businessProfile
            );

        }

        if (
            options.economicData
        ) {

            setEconomicData(
                options.economicData
            );

        }

        if (
            options.preferences
        ) {

            setPreferences(
                options.preferences
            );

        }

        if (
            Array.isArray(
                options.programs
            )
        ) {

            ingestPrograms(
                options.programs,
                {
                    replace: true,
                    analyze: false
                }
            );

        }

        state.initialized =
            true;

        state.metadata.updatedAt =
            now();

        emit(
            "initialized",
            {
                location:
                    state.location
            }
        );

        if (
            options.analyze ===
                true ||
            state.programs.length
        ) {

            analyze();

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

        BUSINESS_TYPES,

        FUNDING_TYPES,

        INDUSTRIES,

        initialize,

        reset,

        analyze,

        analyzeFromCore,

        setLocation,

        getLocation,

        setBusinessProfile,

        getBusinessProfile,

        setEconomicData,

        getEconomicData,

        ingestPrograms,

        ingestIncentives,

        normalizeProgram,

        matchProgram,

        filterPrograms,

        getProgram,

        getMatch,

        getPrograms,

        getMatches,

        getProfile,

        getSignals,

        getFindings,

        getActions,

        getGaps,

        getSummary,

        getAIContext,

        getSharedContext,

        setPreferences,

        getPreferences,

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

    global.ROlyfeBusiness =
        API;

    global.ROLYFE_BUSINESS =
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
