/**
 * RO’Lyfe Relocation Intelligence
 * Location Intelligence Engine
 *
 * File:
 * /core/location-engine.js
 *
 * Purpose:
 * Creates, normalizes, validates, scores, compares,
 * and manages a shared RO’Lyfe location intelligence object.
 *
 * This file contains CORE LOGIC only.
 * No DOM.
 * No UI.
 * No page-specific code.
 *
 * Designed to work with:
 * - Relocation
 * - Climate
 * - Weather
 * - Risk
 * - Housing
 * - Cost of Living
 * - Incentives
 * - Business
 * - Property Analysis
 * - AI Advisor
 */

const ROLyfeLocationEngine = (() => {

    const VERSION = "1.0.0";

    /*
    -------------------------------------------------------
    DEFAULT LOCATION OBJECT
    -------------------------------------------------------
    */

    function createLocation(overrides = {}) {

        const baseLocation = {
            id: createLocationId(),

            country: {
                name: "",
                code: ""
            },

            state: {
                name: "",
                code: "",
                fips: ""
            },

            county: {
                name: "",
                fips: ""
            },

            city: {
                name: "",
                state: "",
                stateCode: ""
            },

            zip: "",

            address: "",

            coordinates: {
                latitude: null,
                longitude: null
            },

            /*
            -----------------------------------------------
            INTELLIGENCE DOMAINS
            -----------------------------------------------
            */

            climate: {},

            weather: {},

            hazards: {},

            housing: {},

            costOfLiving: {},

            incentives: {},

            business: {},

            property: {},

            capital: {},

            opportunity: {},

            /*
            -----------------------------------------------
            AI / ANALYSIS
            -----------------------------------------------
            */

            analysis: {
                relocationMatch: null,
                propertyMatch: null,
                businessMatch: null,
                riskSummary: null,
                opportunitySummary: null
            },

            /*
            -----------------------------------------------
            METADATA
            -----------------------------------------------
            */

            metadata: {
                source: "RO’Lyfe Relocation Intelligence",
                engineVersion: VERSION,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        };

        return deepMerge(baseLocation, overrides);
    }


    /*
    -------------------------------------------------------
    LOCATION ID
    -------------------------------------------------------
    */

    function createLocationId() {

        return (
            "loc-" +
            Date.now().toString(36) +
            "-" +
            Math.random().toString(36).substring(2, 8)
        );
    }


    /*
    -------------------------------------------------------
    DEEP MERGE
    -------------------------------------------------------
    */

    function deepMerge(target, source) {

        if (!source || typeof source !== "object") {
            return target;
        }

        Object.keys(source).forEach(key => {

            const sourceValue = source[key];

            if (
                sourceValue &&
                typeof sourceValue === "object" &&
                !Array.isArray(sourceValue)
            ) {

                if (
                    !target[key] ||
                    typeof target[key] !== "object" ||
                    Array.isArray(target[key])
                ) {
                    target[key] = {};
                }

                deepMerge(target[key], sourceValue);

            } else {

                target[key] = sourceValue;

            }

        });

        return target;
    }


    /*
    -------------------------------------------------------
    NORMALIZE LOCATION
    -------------------------------------------------------
    */

    function normalizeLocation(location = {}) {

        const normalized = createLocation(location);

        /*
        Country
        */

        normalized.country.name =
            cleanText(normalized.country.name);

        normalized.country.code =
            cleanText(normalized.country.code).toUpperCase();


        /*
        State
        */

        normalized.state.name =
            cleanText(normalized.state.name);

        normalized.state.code =
            cleanText(normalized.state.code).toUpperCase();

        normalized.state.fips =
            cleanText(normalized.state.fips);


        /*
        County
        */

        normalized.county.name =
            cleanText(normalized.county.name);

        normalized.county.fips =
            cleanText(normalized.county.fips);


        /*
        City
        */

        normalized.city.name =
            cleanText(normalized.city.name);

        normalized.city.state =
            cleanText(normalized.city.state);

        normalized.city.stateCode =
            cleanText(normalized.city.stateCode).toUpperCase();


        /*
        ZIP
        */

        normalized.zip =
            cleanText(normalized.zip);


        /*
        Address
        */

        normalized.address =
            cleanText(normalized.address);


        /*
        Coordinates
        */

        normalized.coordinates.latitude =
            normalizeCoordinate(
                normalized.coordinates.latitude,
                -90,
                90
            );

        normalized.coordinates.longitude =
            normalizeCoordinate(
                normalized.coordinates.longitude,
                -180,
                180
            );


        normalized.metadata.updatedAt =
            new Date().toISOString();

        return normalized;
    }


    /*
    -------------------------------------------------------
    TEXT CLEANING
    -------------------------------------------------------
    */

    function cleanText(value) {

        if (value === null || value === undefined) {
            return "";
        }

        return String(value).trim();
    }


    /*
    -------------------------------------------------------
    COORDINATE VALIDATION
    -------------------------------------------------------
    */

    function normalizeCoordinate(value, minimum, maximum) {

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return null;
        }

        const number = Number(value);

        if (!Number.isFinite(number)) {
            return null;
        }

        if (number < minimum || number > maximum) {
            return null;
        }

        return number;
    }


    /*
    -------------------------------------------------------
    VALIDATE LOCATION
    -------------------------------------------------------
    */

    function validateLocation(location) {

        const errors = [];
        const warnings = [];

        if (!location || typeof location !== "object") {

            return {
                valid: false,
                errors: ["Location object is missing."],
                warnings: []
            };

        }


        /*
        Country
        */

        if (!location.country?.name) {

            warnings.push(
                "Country has not been specified."
            );

        }


        /*
        State
        */

        if (!location.state?.name) {

            warnings.push(
                "State has not been specified."
            );

        }


        /*
        City
        */

        if (!location.city?.name) {

            warnings.push(
                "City has not been specified."
            );

        }


        /*
        ZIP
        */

        if (!location.zip) {

            warnings.push(
                "ZIP code has not been specified."
            );

        }


        /*
        Coordinates
        */

        if (
            location.coordinates?.latitude === null ||
            location.coordinates?.longitude === null
        ) {

            warnings.push(
                "Geographic coordinates are not available."
            );

        }


        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }


    /*
    -------------------------------------------------------
    LOCATION COMPLETENESS
    -------------------------------------------------------
    */

    function getCompleteness(location) {

        const fields = [
            location?.country?.name,
            location?.state?.name,
            location?.state?.code,
            location?.county?.name,
            location?.city?.name,
            location?.zip,
            location?.address,
            location?.coordinates?.latitude,
            location?.coordinates?.longitude
        ];

        const completed = fields.filter(
            value =>
                value !== null &&
                value !== undefined &&
                value !== ""
        ).length;

        return Math.round(
            (completed / fields.length) * 100
        );
    }


    /*
    -------------------------------------------------------
    SET INTELLIGENCE DOMAIN
    -------------------------------------------------------
    */

    function setDomain(location, domain, data = {}) {

        const allowedDomains = [
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

        if (!allowedDomains.includes(domain)) {

            throw new Error(
                `Invalid RO’Lyfe intelligence domain: ${domain}`
            );

        }

        location[domain] = deepMerge(
            location[domain] || {},
            data
        );

        location.metadata.updatedAt =
            new Date().toISOString();

        return location;
    }


    /*
    -------------------------------------------------------
    GET INTELLIGENCE DOMAIN
    -------------------------------------------------------
    */

    function getDomain(location, domain) {

        if (!location || !domain) {
            return null;
        }

        return location[domain] || null;
    }


    /*
    -------------------------------------------------------
    BUILD LOCATION PROFILE
    -------------------------------------------------------
    */

    function buildProfile(location) {

        const normalized =
            normalizeLocation(location);

        const validation =
            validateLocation(normalized);

        const completeness =
            getCompleteness(normalized);

        return {

            location: normalized,

            validation,

            completeness,

            profile: {

                identity: {
                    country: normalized.country,
                    state: normalized.state,
                    county: normalized.county,
                    city: normalized.city,
                    zip: normalized.zip,
                    address: normalized.address
                },

                geography: {
                    coordinates:
                        normalized.coordinates
                },

                lifestyle: {
                    climate:
                        normalized.climate,

                    weather:
                        normalized.weather,

                    hazards:
                        normalized.hazards,

                    costOfLiving:
                        normalized.costOfLiving,

                    housing:
                        normalized.housing
                },

                opportunity: {
                    incentives:
                        normalized.incentives,

                    business:
                        normalized.business,

                    property:
                        normalized.property,

                    capital:
                        normalized.capital,

                    opportunity:
                        normalized.opportunity
                },

                analysis:
                    normalized.analysis
            }
        };
    }


    /*
    -------------------------------------------------------
    LOCATION MATCH
    -------------------------------------------------------
    */

    function calculateMatch(location, preferences = {}) {

        const scores = [];
        const reasons = [];
        const missing = [];


        /*
        Climate preference
        */

        if (preferences.climate) {

            const climateScore =
                comparePreference(
                    location.climate,
                    preferences.climate
                );

            if (climateScore !== null) {
                scores.push(climateScore);
            }

        }


        /*
        Risk preference
        */

        if (preferences.riskTolerance) {

            const riskScore =
                calculateRiskMatch(
                    location.hazards,
                    preferences.riskTolerance
                );

            if (riskScore !== null) {
                scores.push(riskScore);
            }

        }


        /*
        Cost preference
        */

        if (preferences.costOfLiving) {

            const costScore =
                comparePreference(
                    location.costOfLiving,
                    preferences.costOfLiving
                );

            if (costScore !== null) {
                scores.push(costScore);
            }

        }


        /*
        Housing preference
        */

        if (preferences.housing) {

            const housingScore =
                comparePreference(
                    location.housing,
                    preferences.housing
                );

            if (housingScore !== null) {
                scores.push(housingScore);
            }

        }


        /*
        Business preference
        */

        if (preferences.business) {

            const businessScore =
                comparePreference(
                    location.business,
                    preferences.business
                );

            if (businessScore !== null) {
                scores.push(businessScore);
            }

        }


        const finalScore =
            scores.length
                ? Math.round(
                    scores.reduce(
                        (sum, value) => sum + value,
                        0
                    ) / scores.length
                )
                : null;


        if (!scores.length) {

            missing.push(
                "Additional preference data is required for a meaningful location match."
            );

        }


        return {

            score: finalScore,

            scale: "0-100",

            reasons,

            missing,

            factors: {
                evaluated: scores.length,
                available:
                    Object.keys(preferences).length
            }

        };
    }


    /*
    -------------------------------------------------------
    GENERIC PREFERENCE COMPARISON
    -------------------------------------------------------
    */

    function comparePreference(
        actual = {},
        preference = {}
    ) {

        if (
            actual === null ||
            actual === undefined
        ) {
            return null;
        }

        /*
        If the data already supplies a match score,
        use it.
        */

        if (
            typeof actual.matchScore === "number"
        ) {

            return clamp(
                actual.matchScore,
                0,
                100
            );

        }


        /*
        If preference provides a target score,
        compare against it.
        */

        if (
            typeof actual.score === "number" &&
            typeof preference.target === "number"
        ) {

            const difference =
                Math.abs(
                    actual.score -
                    preference.target
                );

            return clamp(
                100 - difference,
                0,
                100
            );

        }


        return null;
    }


    /*
    -------------------------------------------------------
    RISK MATCH
    -------------------------------------------------------
    */

    function calculateRiskMatch(
        hazards = {},
        tolerance = {}
    ) {

        const riskValues = [];

        Object.keys(tolerance).forEach(hazard => {

            const actual =
                Number(hazards[hazard]);

            const acceptable =
                Number(tolerance[hazard]);

            if (
                Number.isFinite(actual) &&
                Number.isFinite(acceptable)
            ) {

                /*
                Lower hazard exposure produces
                a higher compatibility score.
                */

                const difference =
                    actual - acceptable;

                const score =
                    difference <= 0
                        ? 100
                        : clamp(
                            100 -
                            (difference * 20),
                            0,
                            100
                        );

                riskValues.push(score);
            }

        });


        if (!riskValues.length) {
            return null;
        }


        return Math.round(
            riskValues.reduce(
                (sum, value) => sum + value,
                0
            ) / riskValues.length
        );
    }


    /*
    -------------------------------------------------------
    COMPARE LOCATIONS
    -------------------------------------------------------
    */

    function compareLocations(
        locationA,
        locationB,
        preferences = {}
    ) {

        const a =
            normalizeLocation(locationA);

        const b =
            normalizeLocation(locationB);


        const matchA =
            calculateMatch(
                a,
                preferences
            );

        const matchB =
            calculateMatch(
                b,
                preferences
            );


        return {

            locationA: a,

            locationB: b,

            comparison: {

                matchA,

                matchB,

                differences:
                    buildDifferences(
                        a,
                        b
                    )

            }

        };
    }


    /*
    -------------------------------------------------------
    BUILD DIFFERENCES
    -------------------------------------------------------
    */

    function buildDifferences(a, b) {

        return {

            costOfLiving:
                compareObjects(
                    a.costOfLiving,
                    b.costOfLiving
                ),

            housing:
                compareObjects(
                    a.housing,
                    b.housing
                ),

            climate:
                compareObjects(
                    a.climate,
                    b.climate
                ),

            hazards:
                compareObjects(
                    a.hazards,
                    b.hazards
                ),

            incentives:
                compareObjects(
                    a.incentives,
                    b.incentives
                ),

            business:
                compareObjects(
                    a.business,
                    b.business
                )

        };
    }


    /*
    -------------------------------------------------------
    SIMPLE OBJECT COMPARISON
    -------------------------------------------------------
    */

    function compareObjects(a = {}, b = {}) {

        const keys =
            new Set([
                ...Object.keys(a),
                ...Object.keys(b)
            ]);

        const differences = {};

        keys.forEach(key => {

            if (
                JSON.stringify(a[key]) !==
                JSON.stringify(b[key])
            ) {

                differences[key] = {
                    a: a[key] ?? null,
                    b: b[key] ?? null
                };

            }

        });

        return differences;
    }


    /*
    -------------------------------------------------------
    OPPORTUNITY PROFILE
    -------------------------------------------------------
    */

    function buildOpportunityProfile(location) {

        const profile =
            normalizeLocation(location);

        return {

            location: {
                country: profile.country,
                state: profile.state,
                county: profile.county,
                city: profile.city,
                zip: profile.zip
            },

            property:
                profile.property,

            housing:
                profile.housing,

            business:
                profile.business,

            incentives:
                profile.incentives,

            capital:
                profile.capital,

            opportunity:
                profile.opportunity,

            analysis:
                profile.analysis,

            generatedAt:
                new Date().toISOString()

        };
    }


    /*
    -------------------------------------------------------
    EXPORT / SERIALIZE
    -------------------------------------------------------
    */

    function serialize(location) {

        return JSON.stringify(
            normalizeLocation(location),
            null,
            2
        );
    }


    /*
    -------------------------------------------------------
    CLAMP
    -------------------------------------------------------
    */

    function clamp(value, min, max) {

        return Math.min(
            Math.max(value, min),
            max
        );
    }


    /*
    -------------------------------------------------------
    PUBLIC API
    -------------------------------------------------------
    */

    return {

        VERSION,

        createLocation,

        normalizeLocation,

        validateLocation,

        getCompleteness,

        setDomain,

        getDomain,

        buildProfile,

        calculateMatch,

        compareLocations,

        buildOpportunityProfile,

        serialize

    };

})();


/*
-----------------------------------------------------------
BROWSER GLOBAL
-----------------------------------------------------------
*/

if (typeof window !== "undefined") {

    window.ROlyfeLocationEngine =
        ROLyfeLocationEngine;

}


/*
-----------------------------------------------------------
ES MODULE EXPORT
-----------------------------------------------------------
*/

if (typeof globalThis !== "undefined") {

    globalThis.ROlyfeLocationEngine =
        ROLyfeLocationEngine;

}
