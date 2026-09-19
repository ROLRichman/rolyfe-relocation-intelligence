/*
============================================================
RO'Lyfe Relocation Intelligence Center™
MODULE: Incentives Intelligence Engine
FILE: /modules/incentives/incentives.js
VERSION: 1.0.0
============================================================

PURPOSE
-------
Identify, normalize, analyze, and prepare relocation-related
incentives for the RO'Lyfe Location Intelligence ecosystem.

This module is designed to answer:

    "What financial or economic incentives may exist
     if I move, buy, build, invest, or operate here?"

INCENTIVE DOMAINS
-----------------
1. Relocation Assistance
2. Homebuyer Assistance
3. Housing Assistance
4. Property / Development Incentives
5. Business Grants
6. Business Loans
7. Tax Credits
8. Tax Abatements
9. Workforce Incentives
10. Economic Development
11. Opportunity Zones / Special Zones
12. Local / Municipal Programs

IMPORTANT
---------
This module does NOT assume that an incentive is guaranteed.

It identifies potential programs and evaluates:

    availability
    eligibility
    geographic fit
    applicant type
    purpose
    timing
    funding type
    documentation needs
    verification status

The final determination always belongs to the
program administrator / government agency.

ARCHITECTURE
------------
Location
   ↓
State
   ↓
County
   ↓
City
   ↓
ZIP
   ↓
Applicant Profile
   ↓
Incentive Engine
   ↓
Eligibility Signals
   ↓
Opportunity Pathways
   ↓
AI Advisor
   ↓
Application / Verification

FUTURE
------
This module can later connect to:

- live state program APIs
- county programs
- municipal programs
- HUD
- SBA
- USDA
- workforce agencies
- economic development agencies
- property data
- business data
- RO'Lyfe funding systems
- Real Estate Command Center
- DealForge OS

============================================================
*/

(function (global) {
    "use strict";

    const VERSION = "1.0.0";

    const MODULE_NAME = "ROlyfeIncentives";

    const STORAGE_KEY = "rolyfe_incentives_state_v1";

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

        requireVerificationForQualified: false,

        dataVersion: "1.0.0",

        programStatus: {
            active: "ACTIVE",
            upcoming: "UPCOMING",
            closed: "CLOSED",
            unknown: "UNKNOWN"
        }
    };

    /*
    ========================================================
    INCENTIVE TYPES
    ========================================================
    */

    const INCENTIVE_TYPES = {
        RELOCATION: "relocation_assistance",
        HOMEBUYER: "homebuyer_assistance",
        HOUSING: "housing_assistance",
        PROPERTY: "property_development",
        BUSINESS_GRANT: "business_grant",
        BUSINESS_LOAN: "business_loan",
        TAX_CREDIT: "tax_credit",
        TAX_ABATEMENT: "tax_abatement",
        WORKFORCE: "workforce",
        ECONOMIC_DEVELOPMENT: "economic_development",
        SPECIAL_ZONE: "special_zone",
        ENERGY: "energy",
        AGRICULTURE: "agriculture",
        TECHNOLOGY: "technology",
        MANUFACTURING: "manufacturing",
        COMMUNITY: "community_development"
    };

    /*
    ========================================================
    APPLICANT TYPES
    ========================================================
    */

    const APPLICANT_TYPES = {
        INDIVIDUAL: "individual",
        HOMEBUYER: "homebuyer",
        FIRST_TIME_HOMEBUYER: "first_time_homebuyer",
        RENTER: "renter",
        PROPERTY_OWNER: "property_owner",
        INVESTOR: "investor",
        DEVELOPER: "developer",
        BUSINESS: "business",
        STARTUP: "startup",
        EMPLOYER: "employer",
        NONPROFIT: "nonprofit",
        FARMER: "farmer",
        VETERAN: "veteran",
        STUDENT: "student",
        WORKER: "worker",
        MUNICIPALITY: "municipality"
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
                address: ""
            },

            applicant: {
                type: "",
                firstTimeHomebuyer: null,
                veteran: null,
                income: null,
                householdSize: null,
                ageBand: "",
                employmentStatus: "",
                businessType: "",
                industry: "",
                annualRevenue: null,
                employees: null,
                startup: null,
                relocating: null,
                buyingProperty: null,
                buildingProperty: null,
                investing: null
            },

            preferences: {
                categories: [],
                minimumBenefit: 0,
                activeOnly: true,
                verifiedOnly: false,
                localOnly: false,
                stateOnly: false
            },

            programs: [],

            matches: [],

            profile: createEmptyProfile(),

            status: {
                loading: false,
                analyzed: false,
                lastUpdated: null,
                sourceCount: 0,
                programCount: 0,
                matchCount: 0
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

            incentiveCount: 0,

            activeCount: 0,

            potentialMatches: 0,

            categories: {},

            fundingTypes: {},

            applicantTypes: {},

            geographicLevels: {},

            verifiedPrograms: 0,

            unverifiedPrograms: 0,

            estimatedOpportunity: {
                count: 0,
                totalKnownValue: 0,
                valueCurrency: "USD"
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

    function safeNumber(value, fallback = 0) {
        const number = Number(value);

        return Number.isFinite(number)
            ? number
            : fallback;
    }

    function normalizeText(value) {
        if (value === null || value === undefined) {
            return "";
        }

        return String(value).trim();
    }

    function normalizeState(value) {
        return normalizeText(value).toUpperCase();
    }

    function normalizeArray(value) {
        if (Array.isArray(value)) {
            return value;
        }

        if (value === null || value === undefined || value === "") {
            return [];
        }

        return [value];
    }

    function unique(values) {
        return Array.from(new Set(values));
    }

    function meaningful(value) {
        if (value === null || value === undefined) {
            return false;
        }

        if (typeof value === "string") {
            return value.trim() !== "";
        }

        if (typeof value === "number") {
            return Number.isFinite(value);
        }

        if (Array.isArray(value)) {
            return value.length > 0;
        }

        if (typeof value === "object") {
            return Object.keys(value).length > 0;
        }

        return true;
    }

    function safeClone(value) {
        try {
            return JSON.parse(JSON.stringify(value));
        } catch (error) {
            return value;
        }
    }

    function emit(eventName, payload = {}) {
        const event = {
            event: eventName,
            timestamp: now(),
            payload: safeClone(payload)
        };

        subscribers.forEach(function (subscriber) {
            try {
                subscriber(event);
            } catch (error) {
                console.warn(
                    "[RO'Lyfe Incentives] subscriber error:",
                    error
                );
            }
        });

        if (
            typeof window !== "undefined" &&
            typeof window.dispatchEvent === "function"
        ) {
            try {
                window.dispatchEvent(
                    new CustomEvent(
                        "rolyfe:incentives:" + eventName,
                        {
                            detail: event
                        }
                    )
                );
            } catch (error) {
                // Browser may not support CustomEvent in older environments.
            }
        }
    }

    /*
    ========================================================
    PROGRAM NORMALIZATION
    ========================================================
    */

    function normalizeProgram(program = {}) {
        const normalized = {
            id:
                normalizeText(program.id) ||
                normalizeText(program.programId) ||
                createProgramId(program),

            name:
                normalizeText(program.name) ||
                normalizeText(program.title) ||
                "Unnamed Incentive",

            description:
                normalizeText(program.description) ||
                normalizeText(program.summary),

            agency:
                normalizeText(program.agency) ||
                normalizeText(program.provider) ||
                "",

            state:
                normalizeState(program.state) ||
                normalizeState(state.location.state),

            county:
                normalizeText(program.county),

            city:
                normalizeText(program.city),

            zip:
                normalizeText(program.zip),

            geographicLevel:
                normalizeText(program.geographicLevel) ||
                inferGeographicLevel(program),

            type:
                normalizeText(program.type) ||
                INCENTIVE_TYPES.ECONOMIC_DEVELOPMENT,

            categories: unique(
                normalizeArray(
                    program.categories ||
                    program.category
                ).map(normalizeText).filter(Boolean)
            ),

            applicantTypes: unique(
                normalizeArray(
                    program.applicantTypes ||
                    program.applicantType
                ).map(normalizeText).filter(Boolean)
            ),

            fundingType:
                normalizeText(program.fundingType) ||
                normalizeText(program.funding_type) ||
                "",

            benefit:
                safeNumber(
                    program.benefit ||
                    program.amount ||
                    program.maxBenefit ||
                    0
                ),

            minimumBenefit:
                safeNumber(program.minimumBenefit, 0),

            benefitText:
                normalizeText(
                    program.benefitText ||
                    program.benefitDescription
                ),

            incomeLimit:
                program.incomeLimit !== undefined
                    ? safeNumber(program.incomeLimit, null)
                    : null,

            householdSizeLimit:
                program.householdSizeLimit !== undefined
                    ? safeNumber(program.householdSizeLimit, null)
                    : null,

            minimumInvestment:
                safeNumber(program.minimumInvestment, 0),

            jobCreationRequirement:
                safeNumber(program.jobCreationRequirement, 0),

            status:
                normalizeText(program.status) ||
                CONFIG.programStatus.unknown,

            deadline:
                normalizeText(program.deadline),

            applicationWindow:
                normalizeText(program.applicationWindow),

            eligibility:
                normalizeArray(
                    program.eligibility ||
                    program.eligibilityRequirements
                ).map(normalizeText).filter(Boolean),

            requirements:
                normalizeArray(program.requirements)
                    .map(normalizeText)
                    .filter(Boolean),

            exclusions:
                normalizeArray(program.exclusions)
                    .map(normalizeText)
                    .filter(Boolean),

            documentation:
                normalizeArray(
                    program.documentation ||
                    program.documents
                ).map(normalizeText).filter(Boolean),

            source:
                normalizeText(program.source) ||
                normalizeText(program.sourceUrl),

            sourceUrl:
                normalizeText(program.sourceUrl) ||
                normalizeText(program.url),

            official:
                program.official === true,

            verified:
                program.verified === true,

            lastVerified:
                normalizeText(program.lastVerified),

            notes:
                normalizeText(program.notes),

            tags: unique(
                normalizeArray(program.tags)
                    .map(normalizeText)
                    .filter(Boolean)
            ),

            metadata:
                program.metadata &&
                typeof program.metadata === "object"
                    ? safeClone(program.metadata)
                    : {}
        };

        return normalized;
    }

    function createProgramId(program) {
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
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "")
            || "incentive-" + Date.now()
        );
    }

    function inferGeographicLevel(program) {
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
    LOCATION MATCHING
    ========================================================
    */

    function locationMatch(program, location) {
        const target = location || state.location;

        const programState = normalizeState(program.state);

        const targetState = normalizeState(target.state);

        if (
            programState &&
            targetState &&
            programState !== targetState
        ) {
            return false;
        }

        if (
            program.county &&
            target.county &&
            normalizeText(program.county).toLowerCase() !==
                normalizeText(target.county).toLowerCase()
        ) {
            return false;
        }

        if (
            program.city &&
            target.city &&
            normalizeText(program.city).toLowerCase() !==
                normalizeText(target.city).toLowerCase()
        ) {
            return false;
        }

        if (
            program.zip &&
            target.zip &&
            normalizeText(program.zip) !==
                normalizeText(target.zip)
        ) {
            return false;
        }

        return true;
    }

    function geographicMatchLevel(program, location) {
        const target = location || state.location;

        if (
            program.zip &&
            target.zip &&
            normalizeText(program.zip) ===
                normalizeText(target.zip)
        ) {
            return "ZIP";
        }

        if (
            program.city &&
            target.city &&
            normalizeText(program.city).toLowerCase() ===
                normalizeText(target.city).toLowerCase()
        ) {
            return "CITY";
        }

        if (
            program.county &&
            target.county &&
            normalizeText(program.county).toLowerCase() ===
                normalizeText(target.county).toLowerCase()
        ) {
            return "COUNTY";
        }

        if (
            program.state &&
            target.state &&
            normalizeState(program.state) ===
                normalizeState(target.state)
        ) {
            return "STATE";
        }

        return "UNKNOWN";
    }

    /*
    ========================================================
    APPLICANT MATCHING
    ========================================================
    */

    function applicantMatches(program, applicant) {
        if (!applicant || Object.keys(applicant).length === 0) {
            return {
                matches: true,
                score: 0,
                reasons: [],
                gaps: []
            };
        }

        let score = 0;

        const reasons = [];

        const gaps = [];

        const applicantType =
            normalizeText(applicant.type).toLowerCase();

        const applicantTypes =
            program.applicantTypes.map(function (value) {
                return normalizeText(value).toLowerCase();
            });

        /*
        ----------------------------------------------------
        Applicant type
        ----------------------------------------------------
        */

        if (applicantType) {
            if (applicantTypes.length === 0) {
                gaps.push("Applicant type not specified.");
            } else if (applicantTypes.includes(applicantType)) {
                score += 30;

                reasons.push(
                    "Applicant type matches program eligibility."
                );
            } else {
                return {
                    matches: false,
                    score: 0,
                    reasons: [],
                    gaps: [
                        "Applicant type does not match listed eligibility."
                    ]
                };
            }
        }

        /*
        ----------------------------------------------------
        First-time homebuyer
        ----------------------------------------------------
        */

        if (
            applicant.firstTimeHomebuyer === true &&
            (
                program.applicantTypes.includes(
                    APPLICANT_TYPES.FIRST_TIME_HOMEBUYER
                ) ||
                program.categories.includes(
                    "first-time-homebuyer"
                )
            )
        ) {
            score += 20;

            reasons.push(
                "Program appears relevant to first-time homebuyer status."
            );
        }

        /*
        ----------------------------------------------------
        Veteran
        ----------------------------------------------------
        */

        if (
            applicant.veteran === true &&
            (
                program.applicantTypes.includes(
                    APPLICANT_TYPES.VETERAN
                ) ||
                program.tags.includes("veteran")
            )
        ) {
            score += 15;

            reasons.push(
                "Program appears relevant to veteran eligibility."
            );
        }

        /*
        ----------------------------------------------------
        Income
        ----------------------------------------------------
        */

        if (
            program.incomeLimit !== null &&
            meaningful(applicant.income)
        ) {
            if (
                safeNumber(applicant.income) <=
                program.incomeLimit
            ) {
                score += 20;

                reasons.push(
                    "Reported income is within the listed income limit."
                );
            } else {
                return {
                    matches: false,
                    score: 0,
                    reasons: [],
                    gaps: [
                        "Reported income exceeds the listed program limit."
                    ]
                };
            }
        }

        /*
        ----------------------------------------------------
        Household size
        ----------------------------------------------------
        */

        if (
            program.householdSizeLimit !== null &&
            meaningful(applicant.householdSize)
        ) {
            if (
                safeNumber(applicant.householdSize) <=
                program.householdSizeLimit
            ) {
                score += 10;
            } else {
                gaps.push(
                    "Household-size eligibility requires verification."
                );
            }
        }

        /*
        ----------------------------------------------------
        Business / startup
        ----------------------------------------------------
        */

        if (
            applicant.startup === true &&
            (
                program.applicantTypes.includes(
                    APPLICANT_TYPES.STARTUP
                ) ||
                program.tags.includes("startup")
            )
        ) {
            score += 15;

            reasons.push(
                "Program may support startup activity."
            );
        }

        /*
        ----------------------------------------------------
        Relocation
        ----------------------------------------------------
        */

        if (
            applicant.relocating === true &&
            (
                program.type === INCENTIVE_TYPES.RELOCATION ||
                program.tags.includes("relocation")
            )
        ) {
            score += 20;

            reasons.push(
                "Program is relevant to relocation."
            );
        }

        return {
            matches: true,
            score: Math.min(score, 100),
            reasons,
            gaps
        };
    }

    /*
    ========================================================
    PROGRAM STATUS
    ========================================================
    */

    function isActive(program) {
        const status = normalizeText(
            program.status
        ).toUpperCase();

        if (!status) {
            return false;
        }

        return (
            status === CONFIG.programStatus.active ||
            status === "OPEN" ||
            status === "CURRENT"
        );
    }

    /*
    ========================================================
    PROGRAM MATCH ENGINE
    ========================================================
    */

    function matchProgram(program, options = {}) {
        const normalized = normalizeProgram(program);

        const location =
            options.location ||
            state.location;

        const applicant =
            options.applicant ||
            state.applicant;

        const preferences =
            options.preferences ||
            state.preferences;

        if (!locationMatch(normalized, location)) {
            return {
                matched: false,
                program: normalized,
                score: 0,
                reasons: [
                    "Program does not match the requested location."
                ],
                gaps: []
            };
        }

        if (
            preferences.activeOnly &&
            !isActive(normalized)
        ) {
            return {
                matched: false,
                program: normalized,
                score: 0,
                reasons: [
                    "Program is not currently marked active."
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
                program: normalized,
                score: 0,
                reasons: [
                    "Program is not verified."
                ],
                gaps: []
            };
        }

        if (
            preferences.categories.length &&
            !preferences.categories.some(function (category) {
                return (
                    normalized.type === category ||
                    normalized.categories.includes(category)
                );
            })
        ) {
            return {
                matched: false,
                program: normalized,
                score: 0,
                reasons: [
                    "Program does not match selected categories."
                ],
                gaps: []
            };
        }

        const applicantResult =
            applicantMatches(
                normalized,
                applicant
            );

        if (!applicantResult.matches) {
            return {
                matched: false,
                program: normalized,
                score: applicantResult.score,
                reasons: applicantResult.reasons,
                gaps: applicantResult.gaps
            };
        }

        let score = applicantResult.score;

        const reasons = applicantResult.reasons.slice();

        const gaps = applicantResult.gaps.slice();

        const geoLevel =
            geographicMatchLevel(
                normalized,
                location
            );

        /*
        More specific geographic programs receive
        additional relevance points.

        This is NOT a ranking of locations.
        It only determines program relevance.
        */

        if (geoLevel === "ZIP") {
            score += 25;

            reasons.push(
                "Program matches the requested ZIP."
            );
        } else if (geoLevel === "CITY") {
            score += 20;

            reasons.push(
                "Program matches the requested city."
            );
        } else if (geoLevel === "COUNTY") {
            score += 15;

            reasons.push(
                "Program matches the requested county."
            );
        } else if (geoLevel === "STATE") {
            score += 10;

            reasons.push(
                "Program matches the requested state."
            );
        }

        if (normalized.verified) {
            score += 5;

            reasons.push(
                "Program has been marked verified."
            );
        } else {
            gaps.push(
                "Program verification is required before relying on the information."
            );
        }

        if (normalized.sourceUrl) {
            score += 5;
        } else {
            gaps.push(
                "Official source/application URL is missing."
            );
        }

        if (normalized.eligibility.length === 0) {
            gaps.push(
                "Detailed eligibility requirements are missing."
            );
        }

        if (normalized.documentation.length === 0) {
            gaps.push(
                "Required documentation is not yet documented."
            );
        }

        return {
            matched: true,

            program: normalized,

            score: Math.min(score, 100),

            geographicMatch: geoLevel,

            reasons: unique(reasons),

            gaps: unique(gaps)
        };
    }

    /*
    ========================================================
    ANALYZE
    ========================================================
    */

    function analyze(options = {}) {
        state.status.loading = true;

        if (options.location) {
            setLocation(options.location);
        }

        if (options.applicant) {
            setApplicant(options.applicant);
        }

        if (options.preferences) {
            setPreferences(options.preferences);
        }

        let sourcePrograms =
            Array.isArray(options.programs)
                ? options.programs
                : state.programs;

        sourcePrograms =
            sourcePrograms.map(normalizeProgram);

        state.programs = dedupePrograms(sourcePrograms);

        const matches = [];

        state.programs.forEach(function (program) {
            const result =
                matchProgram(
                    program,
                    {
                        location: state.location,
                        applicant: state.applicant,
                        preferences: state.preferences
                    }
                );

            if (result.matched) {
                matches.push(result);
            }
        });

        matches.sort(function (a, b) {
            return b.score - a.score;
        });

        state.matches = matches;

        state.profile =
            buildProfile(
                state.location,
                state.applicant,
                state.programs,
                matches
            );

        state.status.loading = false;

        state.status.analyzed = true;

        state.status.lastUpdated = now();

        state.status.programCount =
            state.programs.length;

        state.status.matchCount =
            state.matches.length;

        state.status.sourceCount =
            unique(
                state.programs
                    .map(function (program) {
                        return program.sourceUrl || program.source;
                    })
                    .filter(Boolean)
            ).length;

        state.metadata.updatedAt = now();

        persist();

        emit("analyzed", {
            location: state.location,
            applicant: state.applicant,
            programCount: state.programs.length,
            matchCount: state.matches.length
        });

        return getProfile();
    }

    /*
    ========================================================
    PROFILE BUILDER
    ========================================================
    */

    function buildProfile(
        location,
        applicant,
        programs,
        matches
    ) {
        const profile =
            createEmptyProfile();

        profile.location =
            safeClone(location);

        profile.incentiveCount =
            programs.length;

        profile.activeCount =
            programs.filter(isActive).length;

        profile.potentialMatches =
            matches.length;

        /*
        ----------------------------------------------------
        Categories
        ----------------------------------------------------
        */

        programs.forEach(function (program) {
            increment(
                profile.categories,
                program.type
            );

            increment(
                profile.fundingTypes,
                program.fundingType || "unspecified"
            );

            increment(
                profile.geographicLevels,
                program.geographicLevel
            );

            program.applicantTypes.forEach(function (type) {
                increment(
                    profile.applicantTypes,
                    type
                );
            });
        });

        /*
        ----------------------------------------------------
        Verification
        ----------------------------------------------------
        */

        profile.verifiedPrograms =
            programs.filter(function (program) {
                return program.verified;
            }).length;

        profile.unverifiedPrograms =
            programs.filter(function (program) {
                return !program.verified;
            }).length;

        /*
        ----------------------------------------------------
        Known value
        ----------------------------------------------------
        */

        profile.estimatedOpportunity =
            calculateKnownValue(matches);

        /*
        ----------------------------------------------------
        Signals
        ----------------------------------------------------
        */

        profile.signals =
            buildSignals(
                location,
                applicant,
                programs,
                matches
            );

        /*
        ----------------------------------------------------
        Findings
        ----------------------------------------------------
        */

        profile.findings =
            buildFindings(
                location,
                applicant,
                programs,
                matches
            );

        /*
        ----------------------------------------------------
        Gaps
        ----------------------------------------------------
        */

        profile.gaps =
            buildGaps(
                programs,
                matches
            );

        /*
        ----------------------------------------------------
        Actions
        ----------------------------------------------------
        */

        profile.actions =
            buildActions(
                location,
                applicant,
                programs,
                matches,
                profile
            );

        /*
        ----------------------------------------------------
        Summary
        ----------------------------------------------------
        */

        profile.summary =
            buildSummary(
                location,
                programs,
                matches,
                profile
            );

        /*
        ----------------------------------------------------
        AI Context
        ----------------------------------------------------
        */

        profile.aiContext =
            buildAIContext(
                location,
                applicant,
                programs,
                matches,
                profile
            );

        profile.sharedContext =
            buildSharedContext(
                location,
                applicant,
                programs,
                matches,
                profile
            );

        return profile;
    }

    function increment(object, key) {
        if (!key) {
            return;
        }

        object[key] =
            safeNumber(object[key], 0) + 1;
    }

    function calculateKnownValue(matches) {
        let total = 0;

        let count = 0;

        matches.forEach(function (match) {
            const amount =
                safeNumber(
                    match.program.benefit,
                    0
                );

            if (amount > 0) {
                total += amount;

                count += 1;
            }
        });

        return {
            count,
            totalKnownValue: total,
            valueCurrency: "USD"
        };
    }

    /*
    ========================================================
    SIGNALS
    ========================================================
    */

    function buildSignals(
        location,
        applicant,
        programs,
        matches
    ) {
        const signals = [];

        if (programs.length > 0) {
            signals.push({
                type: "INCENTIVE_AVAILABILITY",
                level: "positive",
                title: "Incentive programs detected",
                detail:
                    programs.length +
                    " incentive record(s) are available for analysis."
            });
        }

        if (matches.length > 0) {
            signals.push({
                type: "POTENTIAL_MATCHES",
                level: "positive",
                title: "Potential program matches",
                detail:
                    matches.length +
                    " program(s) match the current location/profile criteria."
            });
        }

        const verified =
            programs.filter(function (program) {
                return program.verified;
            }).length;

        if (verified > 0) {
            signals.push({
                type: "VERIFIED_PROGRAMS",
                level: "positive",
                title: "Verified program records",
                detail:
                    verified +
                    " program(s) are currently marked verified."
            });
        }

        const relocationPrograms =
            matches.filter(function (match) {
                return (
                    match.program.type ===
                    INCENTIVE_TYPES.RELOCATION
                );
            });

        if (relocationPrograms.length > 0) {
            signals.push({
                type: "RELOCATION",
                level: "positive",
                title: "Relocation assistance detected",
                detail:
                    "Potential relocation-related assistance is present."
            });
        }

        const homebuyerPrograms =
            matches.filter(function (match) {
                return (
                    match.program.type ===
                    INCENTIVE_TYPES.HOMEBUYER
                );
            });

        if (homebuyerPrograms.length > 0) {
            signals.push({
                type: "HOMEBUYER",
                level: "positive",
                title: "Homebuyer assistance detected",
                detail:
                    "Potential homebuyer assistance is present."
            });
        }

        const businessPrograms =
            matches.filter(function (match) {
                return (
                    match.program.type ===
                        INCENTIVE_TYPES.BUSINESS_GRANT ||
                    match.program.type ===
                        INCENTIVE_TYPES.BUSINESS_LOAN ||
                    match.program.type ===
                        INCENTIVE_TYPES.TAX_CREDIT
                );
            });

        if (businessPrograms.length > 0) {
            signals.push({
                type: "BUSINESS",
                level: "positive",
                title: "Business incentives detected",
                detail:
                    "Potential business funding or tax incentives are present."
            });
        }

        const specialZones =
            matches.filter(function (match) {
                return (
                    match.program.type ===
                    INCENTIVE_TYPES.SPECIAL_ZONE
                );
            });

        if (specialZones.length > 0) {
            signals.push({
                type: "SPECIAL_ZONE",
                level: "positive",
                title: "Special-zone incentives detected",
                detail:
                    "A designated-zone incentive may apply to the location."
            });
        }

        if (
            programs.length > 0 &&
            verified < programs.length
        ) {
            signals.push({
                type: "VERIFICATION_REQUIRED",
                level: "warning",
                title: "Verification required",
                detail:
                    "Some program information still requires confirmation with the administering agency."
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
        location,
        applicant,
        programs,
        matches
    ) {
        const findings = [];

        const categories =
            unique(
                matches.map(function (match) {
                    return match.program.type;
                })
            );

        if (categories.length) {
            findings.push({
                type: "AVAILABLE_CATEGORIES",
                title: "Available incentive categories",
                value: categories
            });
        }

        if (matches.length) {
            findings.push({
                type: "MATCH_COUNT",
                title: "Potential matches",
                value: matches.length
            });
        }

        const highest =
            matches.length
                ? matches[0]
                : null;

        if (highest) {
            findings.push({
                type: "TOP_RELEVANCE",
                title: "Highest relevance program",
                value: {
                    id: highest.program.id,
                    name: highest.program.name,
                    score: highest.score
                },
                note:
                    "This is a program-relevance score, not a ranking of locations or a guarantee of eligibility."
            });
        }

        const active =
            programs.filter(isActive);

        findings.push({
            type: "ACTIVE_PROGRAMS",
            title: "Programs marked active",
            value: active.length
        });

        return findings;
    }

    /*
    ========================================================
    GAPS
    ========================================================
    */

    function buildGaps(programs, matches) {
        const gaps = [];

        if (programs.length === 0) {
            gaps.push(
                "No incentive records have been loaded for this location."
            );

            gaps.push(
                "Connect state, county, and municipal program data."
            );

            return gaps;
        }

        const missingSources =
            programs.filter(function (program) {
                return !program.sourceUrl;
            }).length;

        if (missingSources > 0) {
            gaps.push(
                missingSources +
                " program record(s) do not have a source URL."
            );
        }

        const unverified =
            programs.filter(function (program) {
                return !program.verified;
            }).length;

        if (unverified > 0) {
            gaps.push(
                unverified +
                " program record(s) require verification."
            );
        }

        const missingEligibility =
            programs.filter(function (program) {
                return program.eligibility.length === 0;
            }).length;

        if (missingEligibility > 0) {
            gaps.push(
                missingEligibility +
                " program record(s) lack detailed eligibility requirements."
            );
        }

        const missingDeadline =
            programs.filter(function (program) {
                return !program.deadline;
            }).length;

        if (missingDeadline > 0) {
            gaps.push(
                "Some programs do not include application deadlines."
            );
        }

        const missingLocal =
            programs.filter(function (program) {
                return (
                    program.geographicLevel !== "city" &&
                    program.geographicLevel !== "county" &&
                    program.geographicLevel !== "zip"
                );
            }).length;

        if (
            programs.length &&
            missingLocal === programs.length
        ) {
            gaps.push(
                "Local municipal incentive coverage has not yet been loaded."
            );
        }

        return unique(gaps);
    }

    /*
    ========================================================
    ACTIONS
    ========================================================
    */

    function buildActions(
        location,
        applicant,
        programs,
        matches,
        profile
    ) {
        const actions = [];

        if (!location.state) {
            actions.push({
                priority: "HIGH",
                action:
                    "Select a state before analyzing incentive programs."
            });

            return actions;
        }

        if (!applicant.type) {
            actions.push({
                priority: "HIGH",
                action:
                    "Set the applicant type to improve incentive matching."
            });
        }

        if (!location.county && !location.city && !location.zip) {
            actions.push({
                priority: "MEDIUM",
                action:
                    "Add county, city, or ZIP for more precise local-program matching."
            });
        }

        if (matches.length === 0) {
            actions.push({
                priority: "HIGH",
                action:
                    "Load or discover current incentive programs for this location."
            });
        }

        if (profile.unverifiedPrograms > 0) {
            actions.push({
                priority: "HIGH",
                action:
                    "Verify program availability, eligibility, funding, and deadlines with the administering agency."
            });
        }

        const homebuyerRelevant =
            applicant.firstTimeHomebuyer === true;

        if (homebuyerRelevant) {
            actions.push({
                priority: "MEDIUM",
                action:
                    "Check homebuyer assistance and closing-cost programs."
            });
        }

        if (applicant.relocating === true) {
            actions.push({
                priority: "MEDIUM",
                action:
                    "Check relocation-specific programs and employer relocation assistance."
            });
        }

        if (
            applicant.startup === true ||
            applicant.type === APPLICANT_TYPES.BUSINESS
        ) {
            actions.push({
                priority: "MEDIUM",
                action:
                    "Check business grants, loans, tax credits, workforce incentives, and economic-development programs."
            });
        }

        actions.push({
            priority: "MEDIUM",
            action:
                "Check state, county, and municipal programs separately because eligibility can vary by geographic level."
        });

        return actions;
    }

    /*
    ========================================================
    SUMMARY
    ========================================================
    */

    function buildSummary(
        location,
        programs,
        matches,
        profile
    ) {
        const stateName =
            location.state ||
            "the selected location";

        if (programs.length === 0) {
            return (
                "No incentive records are currently loaded for " +
                stateName +
                ". The engine is ready for state, county, city, ZIP, and applicant-specific program data."
            );
        }

        return (
            stateName +
            " currently has " +
            programs.length +
            " loaded incentive record(s), with " +
            matches.length +
            " potential match(es) under the current profile. " +
            profile.verifiedPrograms +
            " record(s) are marked verified. " +
            "Eligibility and program availability should be confirmed with the administering agency before relying on any incentive."
        );
    }

    /*
    ========================================================
    AI CONTEXT
    ========================================================
    */

    function buildAIContext(
        location,
        applicant,
        programs,
        matches,
        profile
    ) {
        return {
            module: MODULE_NAME,

            version: VERSION,

            purpose:
                "Analyze potential relocation, housing, business, property, and economic incentives without treating eligibility as guaranteed.",

            location:
                safeClone(location),

            applicant:
                safeClone(applicant),

            summary:
                profile.summary,

            counts: {
                totalPrograms: programs.length,
                activePrograms: profile.activeCount,
                potentialMatches: matches.length,
                verifiedPrograms: profile.verifiedPrograms
            },

            categories:
                safeClone(profile.categories),

            fundingTypes:
                safeClone(profile.fundingTypes),

            matches:
                matches.slice(0, 25).map(function (match) {
                    return {
                        id: match.program.id,
                        name: match.program.name,
                        type: match.program.type,
                        agency: match.program.agency,
                        benefit: match.program.benefit,
                        benefitText: match.program.benefitText,
                        fundingType: match.program.fundingType,
                        geographicMatch: match.geographicMatch,
                        score: match.score,
                        reasons: match.reasons,
                        gaps: match.gaps,
                        sourceUrl: match.program.sourceUrl,
                        verified: match.program.verified
                    };
                }),

            signals:
                safeClone(profile.signals),

            findings:
                safeClone(profile.findings),

            gaps:
                safeClone(profile.gaps),

            actions:
                safeClone(profile.actions),

            guardrails: [
                "Do not represent an incentive as guaranteed.",
                "Do not infer eligibility from incomplete information.",
                "Verify current program status with the administering agency.",
                "Verify deadlines and funding availability.",
                "Separate state programs from county and municipal programs.",
                "Separate grants, loans, tax credits, rebates, and tax abatements.",
                "Do not treat program relevance as a ranking of locations."
            ]
        };
    }

    /*
    ========================================================
    SHARED CONTEXT
    ========================================================
    */

    function buildSharedContext(
        location,
        applicant,
        programs,
        matches,
        profile
    ) {
        let coreContext = null;

        try {
            if (
                global.ROlyfeCore &&
                typeof global.ROlyfeCore.buildSharedContext ===
                    "function"
            ) {
                coreContext =
                    global.ROlyfeCore.buildSharedContext();
            }
        } catch (error) {
            coreContext = null;
        }

        return {
            location:
                safeClone(location),

            applicant:
                safeClone(applicant),

            incentives: {
                total: programs.length,
                active: profile.activeCount,
                matches: matches.length,
                verified: profile.verifiedPrograms,

                categories:
                    safeClone(profile.categories),

                fundingTypes:
                    safeClone(profile.fundingTypes),

                knownValue:
                    safeClone(
                        profile.estimatedOpportunity
                    )
            },

            ai:
                profile.aiContext,

            core:
                coreContext
        };
    }

    /*
    ========================================================
    DATA INGESTION
    ========================================================
    */

    function ingestPrograms(programs, options = {}) {
        const incoming =
            normalizeArray(programs)
                .filter(function (program) {
                    return (
                        program &&
                        typeof program === "object"
                    );
                })
                .map(normalizeProgram);

        if (options.replace === true) {
            state.programs = dedupePrograms(incoming);
        } else {
            state.programs =
                dedupePrograms(
                    state.programs.concat(incoming)
                );
        }

        state.status.programCount =
            state.programs.length;

        state.metadata.updatedAt = now();

        persist();

        emit("programs-ingested", {
            added: incoming.length,
            total: state.programs.length
        });

        if (options.analyze !== false) {
            analyze();
        }

        return getPrograms();
    }

    function dedupePrograms(programs) {
        const map = new Map();

        programs.forEach(function (program) {
            const normalized =
                normalizeProgram(program);

            map.set(
                normalized.id,
                normalized
            );
        });

        return Array.from(map.values());
    }

    /*
    ========================================================
    LIVE / EXTERNAL DATA ADAPTER
    ========================================================

    The module intentionally does not scrape government
    websites directly from the browser.

    A future server/API adapter can call:

        ingestPrograms(data)

    Example adapter output:

    {
        id: "program-001",
        name: "Example Program",
        state: "PA",
        type: "homebuyer_assistance",
        fundingType: "grant",
        benefit: 10000,
        verified: true,
        sourceUrl: "https://official-source.gov"
    }

    ========================================================
    */

    async function fetchPrograms(adapter, options = {}) {
        if (typeof adapter !== "function") {
            throw new Error(
                "fetchPrograms requires an adapter function."
            );
        }

        state.status.loading = true;

        emit("fetch-start", {
            location: state.location
        });

        try {
            const result =
                await adapter(
                    safeClone(state.location),
                    safeClone(state.applicant),
                    safeClone(options)
                );

            const programs =
                Array.isArray(result)
                    ? result
                    : result &&
                      Array.isArray(result.programs)
                        ? result.programs
                        : [];

            ingestPrograms(
                programs,
                {
                    replace:
                        options.replace === true,
                    analyze:
                        options.analyze !== false
                }
            );

            emit("fetch-complete", {
                count: programs.length
            });

            return getPrograms();
        } catch (error) {
            state.status.loading = false;

            emit("fetch-error", {
                message: error.message
            });

            throw error;
        }
    }

    /*
    ========================================================
    LOCATION
    ========================================================
    */

    function setLocation(location = {}) {
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

            address:
                normalizeText(
                    location.address ??
                    state.location.address
                )
        };

        state.metadata.updatedAt = now();

        emit("location-changed", {
            location: state.location
        });

        return getLocation();
    }

    function getLocation() {
        return safeClone(state.location);
    }

    /*
    ========================================================
    APPLICANT
    ========================================================
    */

    function setApplicant(applicant = {}) {
        state.applicant = {
            ...state.applicant,
            ...applicant
        };

        state.metadata.updatedAt = now();

        emit("applicant-changed", {
            applicant: state.applicant
        });

        return getApplicant();
    }

    function getApplicant() {
        return safeClone(state.applicant);
    }

    /*
    ========================================================
    PREFERENCES
    ========================================================
    */

    function setPreferences(preferences = {}) {
        state.preferences = {
            ...state.preferences,
            ...preferences
        };

        if (
            preferences.categories !== undefined
        ) {
            state.preferences.categories =
                normalizeArray(
                    preferences.categories
                );
        }

        persist();

        emit("preferences-changed", {
            preferences: state.preferences
        });

        return getPreferences();
    }

    function getPreferences() {
        return safeClone(state.preferences);
    }

    /*
    ========================================================
    FILTERS
    ========================================================
    */

    function filterPrograms(filters = {}) {
        const source =
            filters.matchesOnly
                ? state.matches.map(function (match) {
                      return match.program;
                  })
                : state.programs;

        return source.filter(function (program) {
            if (
                filters.type &&
                program.type !== filters.type
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
                filters.verified === true &&
                !program.verified
            ) {
                return false;
            }

            if (
                filters.active === true &&
                !isActive(program)
            ) {
                return false;
            }

            if (
                filters.geographicLevel &&
                program.geographicLevel !==
                    filters.geographicLevel
            ) {
                return false;
            }

            if (
                filters.applicantType &&
                !program.applicantTypes.includes(
                    filters.applicantType
                )
            ) {
                return false;
            }

            if (
                filters.search
            ) {
                const search =
                    normalizeText(
                        filters.search
                    ).toLowerCase();

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

                if (!haystack.includes(search)) {
                    return false;
                }
            }

            return true;
        });
    }

    /*
    ========================================================
    GETTERS
    ========================================================
    */

    function getPrograms() {
        return safeClone(state.programs);
    }

    function getMatches() {
        return safeClone(state.matches);
    }

    function getProfile() {
        return safeClone(state.profile);
    }

    function getSignals() {
        return safeClone(
            state.profile.signals
        );
    }

    function getFindings() {
        return safeClone(
            state.profile.findings
        );
    }

    function getActions() {
        return safeClone(
            state.profile.actions
        );
    }

    function getGaps() {
        return safeClone(
            state.profile.gaps
        );
    }

    function getSummary() {
        return state.profile.summary;
    }

    function getAIContext() {
        return safeClone(
            state.profile.aiContext
        );
    }

    function getSharedContext() {
        return safeClone(
            state.profile.sharedContext
        );
    }

    function getState() {
        return safeClone(state);
    }

    function getStatus() {
        return safeClone(state.status);
    }

    /*
    ========================================================
    PROGRAM LOOKUP
    ========================================================
    */

    function getProgram(id) {
        const target =
            normalizeText(id);

        const program =
            state.programs.find(function (item) {
                return item.id === target;
            });

        return program
            ? safeClone(program)
            : null;
    }

    function getMatch(id) {
        const target =
            normalizeText(id);

        const match =
            state.matches.find(function (item) {
                return item.program.id === target;
            });

        return match
            ? safeClone(match)
            : null;
    }

    /*
    ========================================================
    SHARED ENGINE BRIDGE
    ========================================================
    */

    function analyzeFromCore(options = {}) {
        let location =
            options.location;

        if (!location) {
            try {
                if (
                    global.ROlyfeCore &&
                    typeof global.ROlyfeCore.getLocation ===
                        "function"
                ) {
                    location =
                        global.ROlyfeCore.getLocation();
                }
            } catch (error) {
                location = null;
            }
        }

        if (location) {
            setLocation(location);
        }

        return analyze(options);
    }

    /*
    ========================================================
    PERSISTENCE
    ========================================================
    */

    function persist() {
        if (
            !CONFIG.cacheEnabled ||
            typeof localStorage === "undefined"
        ) {
            return;
        }

        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(state)
            );
        } catch (error) {
            console.warn(
                "[RO'Lyfe Incentives] storage error:",
                error
            );
        }
    }

    function restore() {
        if (
            !CONFIG.cacheEnabled ||
            typeof localStorage === "undefined"
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
                JSON.parse(raw);

            if (!saved || typeof saved !== "object") {
                return false;
            }

            state = {
                ...createInitialState(),
                ...saved,

                location: {
                    ...createInitialState().location,
                    ...(saved.location || {})
                },

                applicant: {
                    ...createInitialState().applicant,
                    ...(saved.applicant || {})
                },

                preferences: {
                    ...createInitialState().preferences,
                    ...(saved.preferences || {})
                },

                status: {
                    ...createInitialState().status,
                    ...(saved.status || {})
                },

                metadata: {
                    ...createInitialState().metadata,
                    ...(saved.metadata || {})
                }
            };

            return true;
        } catch (error) {
            console.warn(
                "[RO'Lyfe Incentives] restore error:",
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

    function reset(options = {}) {
        state = createInitialState();

        if (
            options.clearStorage !== false &&
            typeof localStorage !== "undefined"
        ) {
            try {
                localStorage.removeItem(
                    STORAGE_KEY
                );
            } catch (error) {
                // Ignore storage errors.
            }
        }

        emit("reset");

        return getState();
    }

    /*
    ========================================================
    SUBSCRIPTIONS
    ========================================================
    */

    function subscribe(callback) {
        if (typeof callback !== "function") {
            return function () {};
        }

        subscribers.push(callback);

        return function unsubscribe() {
            const index =
                subscribers.indexOf(callback);

            if (index !== -1) {
                subscribers.splice(index, 1);
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

    function initialize(options = {}) {
        if (state.initialized && !options.force) {
            return getState();
        }

        restore();

        if (options.location) {
            setLocation(
                options.location
            );
        }

        if (options.applicant) {
            setApplicant(
                options.applicant
            );
        }

        if (options.preferences) {
            setPreferences(
                options.preferences
            );
        }

        if (Array.isArray(options.programs)) {
            ingestPrograms(
                options.programs,
                {
                    replace: true,
                    analyze: false
                }
            );
        }

        state.initialized = true;

        state.metadata.updatedAt = now();

        emit("initialized", {
            location: state.location
        });

        if (
            options.analyze === true ||
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

        INCENTIVE_TYPES,

        APPLICANT_TYPES,

        initialize,

        reset,

        analyze,

        analyzeFromCore,

        fetchPrograms,

        ingestPrograms,

        normalizeProgram,

        matchProgram,

        getProgram,

        getMatch,

        filterPrograms,

        setLocation,

        getLocation,

        setApplicant,

        getApplicant,

        setPreferences,

        getPreferences,

        getPrograms,

        getMatches,

        getState,

        getStatus,

        getProfile,

        getSignals,

        getFindings,

        getActions,

        getGaps,

        getSummary,

        getAIContext,

        getSharedContext,

        subscribe,

        serialize
    };

    /*
    ========================================================
    GLOBAL EXPORTS
    ========================================================
    */

    global.ROlyfeIncentives = API;

    global.ROLYFE_INCENTIVES = API;

    /*
    ========================================================
    AUTO INITIALIZATION
    ========================================================
    */

    if (
        CONFIG.autoInitialize &&
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
