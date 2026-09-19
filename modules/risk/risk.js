/*
===========================================================
RO’LYFE RELOCATION INTELLIGENCE CENTER™
RISK INTELLIGENCE MODULE
File: /modules/risk/risk.js
Version: 1.0.0
===========================================================

PURPOSE
-------
Multi-hazard risk intelligence layer for the RO’Lyfe
Relocation Intelligence Center.

ARCHITECTURE
------------

LOCATION
   ↓
CLIMATE ───────┐
               ↓
WEATHER ───→ RISK ENGINE
               ↓
        PROPERTY / BUSINESS
               ↓
        RO’Lyfe OPPORTUNITY
               ↓
           RO’Lyfe AI

CORE HAZARDS
------------
• Flood
• Coastal Flood
• River / Inland Flood
• Tornado
• Hurricane / Tropical Storm
• Wildfire
• Extreme Heat / Heat Wave
• Extreme Cold / Cold Wave
• Winter Weather
• Ice
• Drought
• Earthquake
• Hail
• Strong Wind
• Lightning
• Landslide
• Tsunami
• Avalanche
• Volcano
• Severe Storm

DESIGN PRINCIPLES
-----------------
• State → County → City → ZIP → Property compatible
• PA-first but 50-state ready
• No universal "best/worst" location ranking
• Risk is location-specific
• Property-level risk can override broad geography
• Climate and risk remain separate domains
• Supports structured JSON today
• Ready for FEMA / NOAA / USGS / state GIS adapters
• AI-ready
• Browser-safe
• No framework dependency

IMPORTANT
---------
This module does NOT claim that a location is universally
safe or unsafe.

It organizes available risk data and identifies areas that
require further investigation.

===========================================================
*/

(function (global) {
    "use strict";

    const VERSION = "1.0.0";

    const MODULE_NAME = "ROlyfeRisk";

    /*
    ===========================================================
    HAZARD CATALOG
    ===========================================================
    */

    const HAZARDS = [
        "flood",
        "coastalFlood",
        "riverFlood",
        "inlandFlood",
        "tornado",
        "hurricane",
        "wildfire",
        "heat",
        "cold",
        "winterWeather",
        "ice",
        "drought",
        "earthquake",
        "hail",
        "strongWind",
        "lightning",
        "landslide",
        "tsunami",
        "avalanche",
        "volcano",
        "severeStorm"
    ];

    const HAZARD_LABELS = {
        flood: "Flood",
        coastalFlood: "Coastal Flood",
        riverFlood: "River / Inland Flood",
        inlandFlood: "Inland Flood",
        tornado: "Tornado",
        hurricane: "Hurricane / Tropical Storm",
        wildfire: "Wildfire",
        heat: "Extreme Heat",
        cold: "Extreme Cold",
        winterWeather: "Winter Weather",
        ice: "Ice",
        drought: "Drought",
        earthquake: "Earthquake",
        hail: "Hail",
        strongWind: "Strong Wind",
        lightning: "Lightning",
        landslide: "Landslide",
        tsunami: "Tsunami",
        avalanche: "Avalanche",
        volcano: "Volcanic Activity",
        severeStorm: "Severe Storm"
    };

    /*
    ===========================================================
    DEFAULT PREFERENCES
    ===========================================================
    */

    const DEFAULT_PREFERENCES = {

        floodTolerance: "moderate",
        tornadoTolerance: "moderate",
        hurricaneTolerance: "moderate",
        wildfireTolerance: "moderate",
        heatTolerance: "moderate",
        coldTolerance: "moderate",
        winterWeatherTolerance: "moderate",
        droughtTolerance: "moderate",
        earthquakeTolerance: "moderate",
        severeStormTolerance: "moderate",

        avoidFloodRisk: false,
        avoidTornadoRisk: false,
        avoidHurricaneRisk: false,
        avoidWildfireRisk: false,
        avoidExtremeHeat: false,
        avoidExtremeCold: false,
        avoidHeavyWinterWeather: false,
        avoidDrought: false,
        avoidEarthquakeRisk: false,
        avoidSevereStormRisk: false,

        propertyPriority: false,
        insurancePriority: false,
        relocationPriority: false,
        businessPriority: false
    };

    /*
    ===========================================================
    EMPTY PROFILE
    ===========================================================
    */

    const EMPTY_PROFILE = {

        status: "not_initialized",

        version: VERSION,

        module: MODULE_NAME,

        location: {
            country: "",
            state: "",
            stateName: "",
            county: "",
            city: "",
            zip: "",
            address: ""
        },

        risk: {

            overall: null,

            hazards: {},

            categories: {
                water: [],
                wind: [],
                fire: [],
                temperature: [],
                geologic: [],
                winter: []
            },

            exposure: {},

            property: {},

            historical: {},

            mitigation: {},

            sources: []
        },

        assessment: {
            availableHazards: 0,
            missingHazards: 0,
            dataCompleteness: 0,
            attentionCount: 0,
            criticalCount: 0
        },

        signals: [],

        findings: [],

        gaps: [],

        actions: [],

        preferences: {
            ...DEFAULT_PREFERENCES
        },

        metadata: {
            source: "",
            sourceType: "",
            referencePeriod: "",
            lastUpdated: "",
            confidence: "unknown"
        },

        aiContext: null
    };

    let state = {
        initialized: false,

        status: "not_initialized",

        profile: clone(EMPTY_PROFILE),

        preferences: {
            ...DEFAULT_PREFERENCES
        },

        listeners: []
    };

    /*
    ===========================================================
    BASIC UTILITIES
    ===========================================================
    */

    function clone(value) {
        try {
            return JSON.parse(
                JSON.stringify(value)
            );
        } catch (error) {
            return value;
        }
    }

    function isObject(value) {
        return value !== null &&
            typeof value === "object" &&
            !Array.isArray(value);
    }

    function hasValue(value) {

        if (
            value === null ||
            value === undefined
        ) {
            return false;
        }

        if (
            typeof value === "string" &&
            value.trim() === ""
        ) {
            return false;
        }

        if (
            typeof value === "number" &&
            Number.isNaN(value)
        ) {
            return false;
        }

        return true;
    }

    function number(value) {

        if (
            typeof value === "number" &&
            Number.isFinite(value)
        ) {
            return value;
        }

        if (
            typeof value === "string"
        ) {
            const parsed =
                parseFloat(
                    value.replace(
                        /[^0-9.+-]/g,
                        ""
                    )
                );

            return Number.isFinite(parsed)
                ? parsed
                : null;
        }

        return null;
    }

    function string(
        value,
        fallback = ""
    ) {

        return hasValue(value)
            ? String(value)
            : fallback;
    }

    function clamp(
        value,
        min,
        max
    ) {

        return Math.min(
            Math.max(
                value,
                min
            ),
            max
        );
    }

    function titleCase(value) {

        return String(value || "")
            .replace(
                /[_-]+/g,
                " "
            )
            .replace(
                /\b\w/g,
                char =>
                    char.toUpperCase()
            );
    }

    /*
    ===========================================================
    LOCATION NORMALIZATION
    ===========================================================
    */

    function normalizeLocation(
        location
    ) {

        location =
            location || {};

        return {

            country:
                string(
                    location.country ||
                    location.countryCode ||
                    "United States"
                ),

            state:
                string(
                    location.state ||
                    location.stateCode ||
                    location.abbreviation
                ),

            stateName:
                string(
                    location.stateName ||
                    location.state_name
                ),

            county:
                string(
                    location.county ||
                    location.countyName
                ),

            city:
                string(
                    location.city ||
                    location.cityName
                ),

            zip:
                string(
                    location.zip ||
                    location.zipCode ||
                    location.postalCode
                ),

            address:
                string(
                    location.address
                )
        };
    }

    /*
    ===========================================================
    HAZARD NORMALIZATION
    ===========================================================
    */

    function normalizeHazard(
        raw,
        hazardName
    ) {

        raw =
            raw || {};

        /*
        Supports multiple possible data formats:

        {
            score: 75,
            level: "high"
        }

        {
            risk: 75
        }

        {
            rating: "High"
        }

        {
            expectedAnnualLoss: 12345
        }

        {
            exposure: ...
        }
        */

        let score =
            number(
                raw.score ??
                raw.riskScore ??
                raw.risk ??
                raw.index ??
                raw.ratingScore
            );

        const level =
            normalizeLevel(
                raw.level ||
                raw.riskLevel ||
                raw.rating ||
                raw.category
            );

        if (
            score === null &&
            level
        ) {
            score =
                levelToScore(
                    level
                );
        }

        const normalized = {

            name:
                hazardName,

            label:
                HAZARD_LABELS[
                    hazardName
                ] ||
                titleCase(
                    hazardName
                ),

            score,

            level:
                level ||
                scoreToLevel(score),

            probability:
                number(
                    raw.probability ??
                    raw.likelihood ??
                    raw.annualProbability
                ),

            frequency:
                number(
                    raw.frequency ??
                    raw.eventsPerYear
                ),

            expectedAnnualLoss:
                number(
                    raw.expectedAnnualLoss ??
                    raw.annualLoss ??
                    raw.eal
                ),

            exposure:
                number(
                    raw.exposure ??
                    raw.exposureScore
                ),

            vulnerability:
                number(
                    raw.vulnerability ??
                    raw.vulnerabilityScore
                ),

            historicalLoss:
                number(
                    raw.historicalLoss ??
                    raw.loss ??
                    raw.historicalDamage
                ),

            affectedPopulation:
                number(
                    raw.affectedPopulation ??
                    raw.populationExposure
                ),

            affectedStructures:
                number(
                    raw.affectedStructures ??
                    raw.structureExposure
                ),

            description:
                string(
                    raw.description ||
                    raw.summary ||
                    raw.notes
                ),

            source:
                string(
                    raw.source
                ),

            sourceUrl:
                string(
                    raw.sourceUrl ||
                    raw.url
                ),

            lastUpdated:
                string(
                    raw.lastUpdated ||
                    raw.updated
                ),

            confidence:
                string(
                    raw.confidence
                ),

            raw:
                clone(raw)
        };

        return normalized;
    }

    function normalizeHazards(
        rawHazards
    ) {

        rawHazards =
            rawHazards || {};

        const normalized = {};

        HAZARDS.forEach(
            hazard => {

                const aliases =
                    getHazardAliases(
                        hazard
                    );

                let raw = null;

                for (
                    let i = 0;
                    i < aliases.length;
                    i++
                ) {

                    if (
                        rawHazards[
                            aliases[i]
                        ] !== undefined
                    ) {

                        raw =
                            rawHazards[
                                aliases[i]
                            ];

                        break;
                    }
                }

                if (
                    raw !== null
                ) {

                    normalized[
                        hazard
                    ] =
                        normalizeHazard(
                            raw,
                            hazard
                        );
                }
            }
        );

        return normalized;
    }

    function getHazardAliases(
        hazard
    ) {

        const aliases = [
            hazard
        ];

        const aliasMap = {

            flood: [
                "flood",
                "flooding",
                "floodRisk"
            ],

            coastalFlood: [
                "coastalFlood",
                "coastalFlooding"
            ],

            riverFlood: [
                "riverFlood",
                "riverineFlood",
                "riverineFlooding"
            ],

            inlandFlood: [
                "inlandFlood",
                "inlandFlooding"
            ],

            tornado: [
                "tornado",
                "tornadoRisk"
            ],

            hurricane: [
                "hurricane",
                "hurricaneRisk",
                "tropicalStorm",
                "tropical"
            ],

            wildfire: [
                "wildfire",
                "wildFire",
                "fireRisk"
            ],

            heat: [
                "heat",
                "heatWave",
                "extremeHeat"
            ],

            cold: [
                "cold",
                "coldWave",
                "extremeCold"
            ],

            winterWeather: [
                "winterWeather",
                "winter",
                "snow"
            ],

            ice: [
                "ice",
                "iceStorm"
            ],

            drought: [
                "drought",
                "droughtRisk"
            ],

            earthquake: [
                "earthquake",
                "earthquakeRisk"
            ],

            hail: [
                "hail",
                "hailRisk"
            ],

            strongWind: [
                "strongWind",
                "wind",
                "windRisk"
            ],

            lightning: [
                "lightning",
                "lightningRisk"
            ],

            landslide: [
                "landslide",
                "landslideRisk"
            ],

            tsunami: [
                "tsunami",
                "tsunamiRisk"
            ],

            avalanche: [
                "avalanche",
                "avalancheRisk"
            ],

            volcano: [
                "volcano",
                "volcanicActivity",
                "volcanicRisk"
            ],

            severeStorm: [
                "severeStorm",
                "severeWeather",
                "storm"
            ]
        };

        return [
            ...new Set(
                aliases.concat(
                    aliasMap[
                        hazard
                    ] || []
                )
            )
        ];
    }

    /*
    ===========================================================
    RISK LEVEL ENGINE
    ===========================================================
    */

    function normalizeLevel(
        level
    ) {

        if (!hasValue(level)) {
            return "";
        }

        const value =
            String(level)
                .trim()
                .toLowerCase();

        if (
            [
                "very high",
                "very_high",
                "extreme",
                "exceptional",
                "critical"
            ].includes(value)
        ) {
            return "critical";
        }

        if (
            [
                "high",
                "severe"
            ].includes(value)
        ) {
            return "high";
        }

        if (
            [
                "moderate",
                "medium",
                "moderate risk"
            ].includes(value)
        ) {
            return "moderate";
        }

        if (
            [
                "low",
                "minor"
            ].includes(value)
        ) {
            return "low";
        }

        if (
            [
                "very low",
                "very_low",
                "minimal",
                "none"
            ].includes(value)
        ) {
            return "minimal";
        }

        return value;
    }

    function scoreToLevel(
        score
    ) {

        if (
            score === null ||
            score === undefined
        ) {
            return "unknown";
        }

        if (score >= 85) {
            return "critical";
        }

        if (score >= 65) {
            return "high";
        }

        if (score >= 40) {
            return "moderate";
        }

        if (score >= 15) {
            return "low";
        }

        return "minimal";
    }

    function levelToScore(
        level
    ) {

        switch (
            normalizeLevel(level)
        ) {

            case "critical":
                return 90;

            case "high":
                return 75;

            case "moderate":
                return 50;

            case "low":
                return 25;

            case "minimal":
                return 5;

            default:
                return null;
        }
    }

    /*
    ===========================================================
    HAZARD CATEGORIES
    ===========================================================
    */

    function buildCategories(
        hazards
    ) {

        const categories = {

            water: [],

            wind: [],

            fire: [],

            temperature: [],

            geologic: [],

            winter: []
        };

        const mapping = {

            flood: "water",
            coastalFlood: "water",
            riverFlood: "water",
            inlandFlood: "water",

            tornado: "wind",
            hurricane: "wind",
            strongWind: "wind",
            severeStorm: "wind",
            lightning: "wind",
            hail: "wind",

            wildfire: "fire",

            heat: "temperature",
            cold: "temperature",

            winterWeather: "winter",
            ice: "winter",

            earthquake: "geologic",
            landslide: "geologic",
            tsunami: "geologic",
            avalanche: "geologic",
            volcano: "geologic",
            drought: "temperature"
        };

        Object.keys(
            hazards
        ).forEach(
            hazard => {

                const category =
                    mapping[
                        hazard
                    ];

                if (
                    category &&
                    categories[
                        category
                    ]
                ) {

                    categories[
                        category
                    ].push(
                        clone(
                            hazards[
                                hazard
                            ]
                        )
                    );
                }
            }
        );

        return categories;
    }

    /*
    ===========================================================
    OVERALL RISK PROFILE
    ===========================================================
    */

    function calculateOverallRisk(
        hazards
    ) {

        const available =
            Object.values(
                hazards
            ).filter(
                hazard =>
                    hazard.score !== null
            );

        if (!available.length) {
            return {
                score: null,
                level: "unknown",
                methodology:
                    "No normalized hazard scores available."
            };
        }

        const average =
            available.reduce(
                (
                    total,
                    hazard
                ) =>
                    total +
                    hazard.score,
                0
            ) /
            available.length;

        /*
        -------------------------------------------------------
        IMPORTANT:
        This is a DATA COMPLETENESS / EXPOSURE INDICATOR,
        not an official FEMA risk score.

        The engine preserves individual hazard values so the
        user can inspect what contributes to the profile.
        -------------------------------------------------------
        */

        return {

            score:
                Math.round(
                    clamp(
                        average,
                        0,
                        100
                    )
                ),

            level:
                scoreToLevel(
                    average
                ),

            methodology:
                "RO’Lyfe normalized multi-hazard indicator; not an official government risk rating.",

            availableHazards:
                available.length
        };
    }

    /*
    ===========================================================
    DATA EXTRACTION
    ===========================================================
    */

    function extractRiskFromAnalysis(
        analysis
    ) {

        if (!analysis) {
            return null;
        }

        if (
            analysis.intelligence?.hazards
        ) {
            return analysis
                .intelligence
                .hazards;
        }

        if (
            analysis.intelligence?.risk
        ) {
            return analysis
                .intelligence
                .risk;
        }

        if (
            analysis.domains?.hazards
        ) {
            return analysis
                .domains
                .hazards;
        }

        if (
            analysis.risk
        ) {
            return analysis.risk;
        }

        if (
            analysis.hazards
        ) {
            return analysis.hazards;
        }

        if (
            analysis.data
                ?.intelligence
                ?.hazards
        ) {
            return analysis
                .data
                .intelligence
                .hazards;
        }

        return null;
    }

    function extractLocationFromAnalysis(
        analysis
    ) {

        if (!analysis) {
            return {};
        }

        if (
            analysis.location
        ) {
            return analysis.location;
        }

        if (
            analysis.data?.location
        ) {
            return analysis
                .data
                .location;
        }

        return {};
    }

    /*
    ===========================================================
    PREFERENCE INTERPRETATION
    ===========================================================
    */

    function getTolerancePreference(
        hazard,
        preferences
    ) {

        const map = {

            flood:
                preferences.floodTolerance,

            coastalFlood:
                preferences.floodTolerance,

            riverFlood:
                preferences.floodTolerance,

            inlandFlood:
                preferences.floodTolerance,

            tornado:
                preferences.tornadoTolerance,

            hurricane:
                preferences.hurricaneTolerance,

            wildfire:
                preferences.wildfireTolerance,

            heat:
                preferences.heatTolerance,

            cold:
                preferences.coldTolerance,

            winterWeather:
                preferences.winterWeatherTolerance,

            ice:
                preferences.winterWeatherTolerance,

            drought:
                preferences.droughtTolerance,

            earthquake:
                preferences.earthquakeTolerance,

            severeStorm:
                preferences.severeStormTolerance
        };

        return map[
            hazard
        ] || "moderate";
    }

    function getAvoidPreference(
        hazard,
        preferences
    ) {

        const map = {

            flood:
                preferences.avoidFloodRisk,

            coastalFlood:
                preferences.avoidFloodRisk,

            riverFlood:
                preferences.avoidFloodRisk,

            inlandFlood:
                preferences.avoidFloodRisk,

            tornado:
                preferences.avoidTornadoRisk,

            hurricane:
                preferences.avoidHurricaneRisk,

            wildfire:
                preferences.avoidWildfireRisk,

            heat:
                preferences.avoidExtremeHeat,

            cold:
                preferences.avoidExtremeCold,

            winterWeather:
                preferences.avoidHeavyWinterWeather,

            ice:
                preferences.avoidHeavyWinterWeather,

            drought:
                preferences.avoidDrought,

            earthquake:
                preferences.avoidEarthquakeRisk,

            severeStorm:
                preferences.avoidSevereStormRisk
        };

        return Boolean(
            map[hazard]
        );
    }

    function evaluatePreferenceMatch(
        hazard
    ) {

        const tolerance =
            getTolerancePreference(
                hazard.name,
                state.preferences
            );

        const avoid =
            getAvoidPreference(
                hazard.name,
                state.preferences
            );

        const score =
            hazard.score;

        if (
            score === null
        ) {

            return {
                matches: null,
                tolerance,
                avoid
            };
        }

        let threshold =
            65;

        if (
            tolerance === "low"
        ) {
            threshold = 40;
        }

        if (
            tolerance === "high"
        ) {
            threshold = 85;
        }

        const matches =
            avoid
                ? score < threshold
                : true;

        return {
            matches,
            tolerance,
            avoid,
            threshold
        };
    }

    /*
    ===========================================================
    SIGNAL ENGINE
    ===========================================================
    */

    function buildSignals(
        profile
    ) {

        const signals = [];

        Object.keys(
            profile.risk.hazards
        ).forEach(
            hazardName => {

                const hazard =
                    profile
                        .risk
                        .hazards[
                            hazardName
                        ];

                const preference =
                    evaluatePreferenceMatch(
                        hazard
                    );

                signals.push({

                    type:
                        hazardName,

                    category:
                        getHazardCategory(
                            hazardName
                        ),

                    level:
                        hazard.level,

                    score:
                        hazard.score,

                    title:
                        hazard.label,

                    preferenceMatch:
                        preference.matches,

                    message:
                        buildHazardMessage(
                            hazard,
                            preference
                        )
                });
            }
        );

        return signals;
    }

    function getHazardCategory(
        hazard
    ) {

        if (
            [
                "flood",
                "coastalFlood",
                "riverFlood",
                "inlandFlood"
            ].includes(hazard)
        ) {
            return "water";
        }

        if (
            [
                "tornado",
                "hurricane",
                "strongWind",
                "hail",
                "lightning",
                "severeStorm"
            ].includes(hazard)
        ) {
            return "wind";
        }

        if (
            hazard === "wildfire"
        ) {
            return "fire";
        }

        if (
            [
                "heat",
                "cold",
                "drought"
            ].includes(hazard)
        ) {
            return "temperature";
        }

        if (
            [
                "winterWeather",
                "ice"
            ].includes(hazard)
        ) {
            return "winter";
        }

        return "geologic";
    }

    function buildHazardMessage(
        hazard,
        preference
    ) {

        if (
            hazard.score === null
        ) {
            return `${hazard.label} data is not currently available.`;
        }

        if (
            hazard.level === "critical"
        ) {
            return `${hazard.label} requires detailed location and property-level review.`;
        }

        if (
            hazard.level === "high"
        ) {
            return `${hazard.label} should be included in relocation and property due diligence.`;
        }

        if (
            preference.avoid &&
            preference.matches === false
        ) {
            return `${hazard.label} exceeds the user's configured tolerance threshold.`;
        }

        return `${hazard.label} is represented in the current risk profile.`;
    }

    /*
    ===========================================================
    FINDINGS
    ===========================================================
    */

    function buildFindings(
        profile
    ) {

        const findings = [];

        Object.keys(
            profile.risk.hazards
        ).forEach(
            hazardName => {

                const hazard =
                    profile
                        .risk
                        .hazards[
                            hazardName
                        ];

                if (
                    hazard.level === "critical"
                ) {

                    findings.push({

                        category:
                            hazardName,

                        severity:
                            "critical",

                        title:
                            `Critical ${hazard.label} Signal`,

                        detail:
                            buildHazardFinding(
                                hazard
                            )
                    });

                } else if (
                    hazard.level === "high"
                ) {

                    findings.push({

                        category:
                            hazardName,

                        severity:
                            "attention",

                        title:
                            `High ${hazard.label} Signal`,

                        detail:
                            buildHazardFinding(
                                hazard
                            )
                    });
                }
            }
        );

        /*
        -------------------------------------------------------
        Property-specific finding.
        -------------------------------------------------------
        */

        if (
            profile.location.address &&
            profile.risk.property
        ) {

            findings.push({

                category:
                    "property",

                severity:
                    "info",

                title:
                    "Property-Level Risk Review Available",

                detail:
                    "Address-level hazard data should be reviewed separately from county or state averages."
            });
        }

        return findings;
    }

    function buildHazardFinding(
        hazard
    ) {

        const parts = [
            `${hazard.label} is currently classified as ${hazard.level}.`
        ];

        if (
            hazard.probability !== null
        ) {

            parts.push(
                `Recorded probability: ${hazard.probability}.`
            );
        }

        if (
            hazard.expectedAnnualLoss !== null
        ) {

            parts.push(
                `Expected annual loss indicator: ${hazard.expectedAnnualLoss}.`
            );
        }

        if (
            hazard.exposure !== null
        ) {

            parts.push(
                `Exposure indicator: ${hazard.exposure}.`
            );
        }

        return parts.join(" ");
    }

    /*
    ===========================================================
    DATA GAPS
    ===========================================================
    */

    function buildGaps(
        profile
    ) {

        const gaps = [];

        HAZARDS.forEach(
            hazardName => {

                if (
                    !profile
                        .risk
                        .hazards[
                            hazardName
                        ]
                ) {

                    gaps.push({

                        field:
                            hazardName,

                        label:
                            HAZARD_LABELS[
                                hazardName
                            ],

                        importance:
                            getHazardImportance(
                                hazardName
                            ),

                        reason:
                            "No normalized hazard data supplied."
                    });
                }
            }
        );

        /*
        -------------------------------------------------------
        Geographic gaps.
        -------------------------------------------------------
        */

        if (
            !profile.location.county
        ) {

            gaps.push({

                field:
                    "county",

                label:
                    "County",

                importance:
                    "high",

                reason:
                    "County-level hazard analysis improves geographic precision."
            });
        }

        if (
            !profile.location.zip
        ) {

            gaps.push({

                field:
                    "zip",

                label:
                    "ZIP Code",

                importance:
                    "high",

                reason:
                    "ZIP-level analysis can improve property and relocation precision."
            });
        }

        if (
            !profile.location.address
        ) {

            gaps.push({

                field:
                    "address",

                label:
                    "Property Address",

                importance:
                    "medium",

                reason:
                    "Property-level risk should be evaluated separately when an address is available."
            });
        }

        return gaps;
    }

    function getHazardImportance(
        hazard
    ) {

        if (
            [
                "flood",
                "wildfire",
                "hurricane",
                "tornado",
                "earthquake"
            ].includes(hazard)
        ) {
            return "high";
        }

        if (
            [
                "heat",
                "cold",
                "winterWeather",
                "drought",
                "strongWind"
            ].includes(hazard)
        ) {
            return "medium";
        }

        return "low";
    }

    /*
    ===========================================================
    ACTION ENGINE
    ===========================================================
    */

    function buildActions(
        profile
    ) {

        const actions = [];

        const hazards =
            profile.risk.hazards;

        /*
        -------------------------------------------------------
        Flood
        -------------------------------------------------------
        */

        if (
            hasHazardLevel(
                hazards,
                [
                    "flood",
                    "coastalFlood",
                    "riverFlood",
                    "inlandFlood"
                ],
                [
                    "high",
                    "critical"
                ]
            )
        ) {

            actions.push({

                type:
                    "property-review",

                priority:
                    "high",

                title:
                    "Review Flood Exposure",

                detail:
                    "Check FEMA flood mapping, drainage, elevation, flood insurance requirements and property-specific history."
            });
        }

        /*
        -------------------------------------------------------
        Wildfire
        -------------------------------------------------------
        */

        if (
            hasHazardLevel(
                hazards,
                [
                    "wildfire"
                ],
                [
                    "high",
                    "critical"
                ]
            )
        ) {

            actions.push({

                type:
                    "property-review",

                priority:
                    "high",

                title:
                    "Review Wildfire Exposure",

                detail:
                    "Review parcel location, defensible space, access, insurance availability and local wildfire mitigation requirements."
            });
        }

        /*
        -------------------------------------------------------
        Hurricane
        -------------------------------------------------------
        */

        if (
            hasHazardLevel(
                hazards,
                [
                    "hurricane"
                ],
                [
                    "high",
                    "critical"
                ]
            )
        ) {

            actions.push({

                type:
                    "insurance-review",

                priority:
                    "high",

                title:
                    "Review Storm Exposure",

                detail:
                    "Review wind, storm surge, flood exposure, insurance costs and building requirements."
            });
        }

        /*
        -------------------------------------------------------
        Tornado / Wind
        -------------------------------------------------------
        */

        if (
            hasHazardLevel(
                hazards,
                [
                    "tornado",
                    "strongWind",
                    "severeStorm"
                ],
                [
                    "high",
                    "critical"
                ]
            )
        ) {

            actions.push({

                type:
                    "property-review",

                priority:
                    "medium",

                title:
                    "Review Severe Wind Exposure",

                detail:
                    "Review roof condition, structural standards, storm shelter options and insurance considerations."
            });
        }

        /*
        -------------------------------------------------------
        Earthquake
        -------------------------------------------------------
        */

        if (
            hasHazardLevel(
                hazards,
                [
                    "earthquake"
                ],
                [
                    "high",
                    "critical"
                ]
            )
        ) {

            actions.push({

                type:
                    "property-review",

                priority:
                    "high",

                title:
                    "Review Seismic Exposure",

                detail:
                    "Review seismic conditions, building standards, foundation considerations and insurance."
            });
        }

        /*
        -------------------------------------------------------
        Heat
        -------------------------------------------------------
        */

        if (
            hasHazardLevel(
                hazards,
                [
                    "heat"
                ],
                [
                    "high",
                    "critical"
                ]
            )
        ) {

            actions.push({

                type:
                    "climate-review",

                priority:
                    "medium",

                title:
                    "Review Extreme Heat",

                detail:
                    "Cross-reference heat exposure with cooling costs, housing design and local climate conditions."
            });
        }

        /*
        -------------------------------------------------------
        Drought
        -------------------------------------------------------
        */

        if (
            hasHazardLevel(
                hazards,
                [
                    "drought"
                ],
                [
                    "high",
                    "critical"
                ]
            )
        ) {

            actions.push({

                type:
                    "water-review",

                priority:
                    "medium",

                title:
                    "Review Water Conditions",

                detail:
                    "Review current drought conditions, water availability, restrictions and long-term property implications."
            });
        }

        /*
        -------------------------------------------------------
        Data completeness
        -------------------------------------------------------
        */

        if (
            profile.assessment.dataCompleteness <
            60
        ) {

            actions.push({

                type:
                    "data",

                priority:
                    "high",

                title:
                    "Complete Risk Dataset",

                detail:
                    "More hazard data is needed before producing a complete relocation risk profile."
            });
        }

        /*
        -------------------------------------------------------
        Property-specific analysis
        -------------------------------------------------------
        */

        if (
            profile.location.address
        ) {

            actions.push({

                type:
                    "property",

                priority:
                    "medium",

                title:
                    "Run Property-Level Risk Review",

                detail:
                    "Use the exact property address to evaluate parcel-level hazards, flood zones, wildfire exposure and other location-specific conditions."
            });
        }

        return actions;
    }

    function hasHazardLevel(
        hazards,
        hazardNames,
        levels
    ) {

        return hazardNames.some(
            hazardName => {

                const hazard =
                    hazards[
                        hazardName
                    ];

                return hazard &&
                    levels.includes(
                        hazard.level
                    );
            }
        );
    }

    /*
    ===========================================================
    ASSESSMENT
    ===========================================================
    */

    function buildAssessment(
        profile
    ) {

        const hazards =
            Object.values(
                profile.risk.hazards
            );

        const available =
            hazards.filter(
                hazard =>
                    hazard.score !== null ||
                    hazard.level !== "unknown"
            );

        const critical =
            hazards.filter(
                hazard =>
                    hazard.level === "critical"
            );

        const attention =
            hazards.filter(
                hazard =>
                    hazard.level === "high" ||
                    hazard.level === "critical"
            );

        const completeness =
            HAZARDS.length
                ? Math.round(
                    (
                        available.length /
                        HAZARDS.length
                    ) * 100
                )
                : 0;

        return {

            availableHazards:
                available.length,

            missingHazards:
                HAZARDS.length -
                available.length,

            dataCompleteness:
                completeness,

            attentionCount:
                attention.length,

            criticalCount:
                critical.length
        };
    }

    /*
    ===========================================================
    SUMMARY
    ===========================================================
    */

    function buildSummary(
        profile
    ) {

        const locationName =
            profile.location.city ||
            profile.location.county ||
            profile.location.stateName ||
            profile.location.state ||
            "Selected location";

        const overall =
            profile.risk.overall;

        const highHazards =
            Object.values(
                profile.risk.hazards
            )
                .filter(
                    hazard =>
                        [
                            "high",
                            "critical"
                        ].includes(
                            hazard.level
                        )
                )
                .map(
                    hazard =>
                        hazard.label
                );

        return {

            location:
                locationName,

            overallScore:
                overall.score,

            overallLevel:
                overall.level,

            highAttentionHazards:
                highHazards,

            dataCompleteness:
                profile.assessment
                    .dataCompleteness,

            hazardCount:
                profile.assessment
                    .availableHazards,

            narrative:
                buildNarrative(
                    locationName,
                    overall,
                    highHazards,
                    profile
                )
        };
    }

    function buildNarrative(
        locationName,
        overall,
        highHazards,
        profile
    ) {

        const parts = [];

        parts.push(
            `The RO’Lyfe risk profile for ${locationName} is based on the hazard data currently available.`
        );

        if (
            overall.score !== null
        ) {

            parts.push(
                `The normalized multi-hazard indicator is ${overall.score}/100.`
            );
        }

        if (
            highHazards.length
        ) {

            parts.push(
                `Hazards requiring additional review include ${highHazards.join(", ")}.`
            );
        }

        if (
            profile.assessment
                .dataCompleteness < 100
        ) {

            parts.push(
                `The profile is incomplete because not every hazard currently has normalized data.`
            );
        }

        return parts.join(" ");
    }

    /*
    ===========================================================
    AI CONTEXT
    ===========================================================
    */

    function buildAIContext(
        profile
    ) {

        return {

            module:
                MODULE_NAME,

            version:
                VERSION,

            location:
                clone(
                    profile.location
                ),

            overallRisk:
                clone(
                    profile.risk.overall
                ),

            hazards:
                clone(
                    profile.risk.hazards
                ),

            categories:
                clone(
                    profile.risk.categories
                ),

            assessment:
                clone(
                    profile.assessment
                ),

            signals:
                clone(
                    profile.signals
                ),

            findings:
                clone(
                    profile.findings
                ),

            gaps:
                clone(
                    profile.gaps
                ),

            actions:
                clone(
                    profile.actions
                ),

            preferences:
                clone(
                    profile.preferences
                ),

            interpretationRules: [

                "Risk should be evaluated at the appropriate geographic scale.",

                "State or county averages do not automatically represent a specific property.",

                "Individual hazards should be reviewed separately from any combined indicator.",

                "Historical hazard data does not guarantee future conditions.",

                "Climate conditions and hazard exposure are related but separate analytical domains.",

                "Insurance availability and cost should be reviewed separately.",

                "Property-level due diligence should be performed before a purchase or investment decision.",

                "The RO’Lyfe normalized multi-hazard indicator is not an official government rating."
            ]
        };
    }

    /*
    ===========================================================
    SHARED CONTEXT
    ===========================================================
    */

    function buildSharedContext() {

        return {

            module:
                MODULE_NAME,

            version:
                VERSION,

            location:
                clone(
                    state.profile.location
                ),

            risk:
                clone(
                    state.profile.risk
                ),

            assessment:
                clone(
                    state.profile.assessment
                ),

            signals:
                clone(
                    state.profile.signals
                ),

            findings:
                clone(
                    state.profile.findings
                ),

            gaps:
                clone(
                    state.profile.gaps
                ),

            actions:
                clone(
                    state.profile.actions
                ),

            preferences:
                clone(
                    state.preferences
                )
        };
    }

    /*
    ===========================================================
    ANALYSIS
    ===========================================================
    */

    function analyze(
        options = {}
    ) {

        const analysis =
            options.analysis ||
            getCoreAnalysis();

        const location =
            options.location ||
            extractLocationFromAnalysis(
                analysis
            );

        const rawRisk =
            options.risk ||
            options.hazards ||
            extractRiskFromAnalysis(
                analysis
            ) ||
            options.data ||
            {};

        const normalizedLocation =
            normalizeLocation(
                location
            );

        /*
        -------------------------------------------------------
        Some datasets wrap hazards:

        {
            hazards: {
                flood: ...
            }
        }

        Others directly expose:

        {
            flood: ...
        }
        -------------------------------------------------------
        */

        const hazardSource =
            rawRisk.hazards ||
            rawRisk.risk ||
            rawRisk;

        const hazards =
            normalizeHazards(
                hazardSource
            );

        const profile =
            clone(
                EMPTY_PROFILE
            );

        profile.status =
            "ready";

        profile.location =
            normalizedLocation;

        profile.risk.hazards =
            hazards;

        profile.risk.categories =
            buildCategories(
                hazards
            );

        profile.risk.overall =
            calculateOverallRisk(
                hazards
            );

        profile.risk.exposure =
            normalizeObject(
                rawRisk.exposure
            );

        profile.risk.property =
            normalizeObject(
                rawRisk.property
            );

        profile.risk.historical =
            normalizeObject(
                rawRisk.historical
            );

        profile.risk.mitigation =
            normalizeObject(
                rawRisk.mitigation
            );

        profile.risk.sources =
            buildSources(
                hazards,
                rawRisk
            );

        profile.preferences =
            clone(
                state.preferences
            );

        profile.assessment =
            buildAssessment(
                profile
            );

        profile.signals =
            buildSignals(
                profile
            );

        profile.findings =
            buildFindings(
                profile
            );

        profile.gaps =
            buildGaps(
                profile
            );

        profile.actions =
            buildActions(
                profile
            );

        profile.metadata = {

            source:
                options.source ||
                rawRisk.source ||
                "RO’Lyfe risk data",

            sourceType:
                options.sourceType ||
                rawRisk.sourceType ||
                "structured",

            referencePeriod:
                rawRisk.referencePeriod ||
                rawRisk.normalPeriod ||
                "",

            lastUpdated:
                rawRisk.lastUpdated ||
                "",

            confidence:
                rawRisk.confidence ||
                determineConfidence(
                    profile
                )
        };

        profile.summary =
            buildSummary(
                profile
            );

        profile.aiContext =
            buildAIContext(
                profile
            );

        state.profile =
            profile;

        state.status =
            "ready";

        state.initialized =
            true;

        emit(
            "analyzed",
            profile
        );

        return clone(
            profile
        );
    }

    function normalizeObject(
        value
    ) {

        return isObject(value)
            ? clone(value)
            : {};
    }

    function buildSources(
        hazards,
        rawRisk
    ) {

        const sources = [];

        if (
            Array.isArray(
                rawRisk.sources
            )
        ) {

            sources.push(
                ...clone(
                    rawRisk.sources
                )
            );
        }

        Object.values(
            hazards
        ).forEach(
            hazard => {

                if (
                    hazard.source
                ) {

                    sources.push({

                        name:
                            hazard.source,

                        url:
                            hazard.sourceUrl ||
                            "",

                        hazard:
                            hazard.name,

                        lastUpdated:
                            hazard.lastUpdated ||
                            ""
                    });
                }
            }
        );

        return sources;
    }

    function determineConfidence(
        profile
    ) {

        const completeness =
            profile.assessment
                .dataCompleteness;

        if (
            completeness >= 85
        ) {
            return "high";
        }

        if (
            completeness >= 60
        ) {
            return "medium";
        }

        if (
            completeness >= 30
        ) {
            return "limited";
        }

        return "low";
    }

    /*
    ===========================================================
    CORE INTEGRATION
    ===========================================================
    */

    function getCoreAnalysis() {

        try {

            const core =
                global.ROlyfeCore;

            if (!core) {
                return null;
            }

            if (
                typeof core.getAnalysis ===
                "function"
            ) {

                return core.getAnalysis();
            }

            if (
                typeof core.getState ===
                "function"
            ) {

                const coreState =
                    core.getState();

                return (
                    coreState?.analysis ||
                    coreState
                );
            }

        } catch (error) {

            console.warn(
                "[ROlyfeRisk] Unable to retrieve core analysis:",
                error
            );
        }

        return null;
    }

    function initialize(
        options = {}
    ) {

        state.initialized =
            true;

        state.status =
            "initialized";

        if (
            options.preferences
        ) {

            setPreferences(
                options.preferences
            );
        }

        if (
            options.analysis ||
            options.location ||
            options.risk ||
            options.hazards ||
            options.data
        ) {

            return analyze(
                options
            );
        }

        const coreAnalysis =
            getCoreAnalysis();

        if (
            coreAnalysis
        ) {

            return analyze({
                analysis:
                    coreAnalysis
            });
        }

        state.profile =
            clone(
                EMPTY_PROFILE
            );

        state.profile.status =
            "initialized";

        state.profile.preferences =
            clone(
                state.preferences
            );

        state.profile.aiContext =
            buildAIContext(
                state.profile
            );

        emit(
            "initialized",
            state.profile
        );

        return clone(
            state.profile
        );
    }

    /*
    ===========================================================
    PREFERENCE MANAGEMENT
    ===========================================================
    */

    function setPreferences(
        preferences = {}
    ) {

        state.preferences = {

            ...state.preferences,

            ...preferences
        };

        if (
            state.initialized
        ) {

            state.profile.preferences =
                clone(
                    state.preferences
                );

            state.profile.signals =
                buildSignals(
                    state.profile
                );

            state.profile.findings =
                buildFindings(
                    state.profile
                );

            state.profile.actions =
                buildActions(
                    state.profile
                );

            state.profile.summary =
                buildSummary(
                    state.profile
                );

            state.profile.aiContext =
                buildAIContext(
                    state.profile
                );

            emit(
                "preferences_changed",
                state.profile
            );
        }

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
    HAZARD ACCESS
    ===========================================================
    */

    function getHazard(
        hazardName
    ) {

        const key =
            normalizeHazardName(
                hazardName
            );

        return clone(
            state.profile
                .risk
                .hazards[
                    key
                ] || null
        );
    }

    function normalizeHazardName(
        hazardName
    ) {

        const value =
            String(
                hazardName || ""
            )
                .trim()
                .toLowerCase();

        for (
            const hazard of HAZARDS
        ) {

            if (
                hazard === value
            ) {
                return hazard;
            }

            if (
                HAZARD_LABELS[
                    hazard
                ]
                    .toLowerCase() ===
                value
            ) {

                return hazard;
            }

            if (
                getHazardAliases(
                    hazard
                )
                    .map(
                        alias =>
                            alias.toLowerCase()
                    )
                    .includes(
                        value
                    )
            ) {

                return hazard;
            }
        }

        return value;
    }

    function getHazards() {

        return clone(
            state.profile
                .risk
                .hazards
        );
    }

    function getHighRiskHazards() {

        return Object.values(
            state.profile
                .risk
                .hazards
        )
            .filter(
                hazard =>
                    [
                        "high",
                        "critical"
                    ].includes(
                        hazard.level
                    )
            )
            .map(
                hazard =>
                    clone(hazard)
            );
    }

    function getCategory(
        category
    ) {

        return clone(
            state.profile
                .risk
                .categories[
                    category
                ] || []
        );
    }

    /*
    ===========================================================
    DATA INGESTION
    ===========================================================
    */

    function ingestRisk(
        riskData,
        options = {}
    ) {

        return analyze({

            ...options,

            risk:
                riskData,

            source:
                options.source ||
                riskData?.source ||
                "manual risk ingestion",

            sourceType:
                options.sourceType ||
                "ingested"
        });
    }

    /*
    ===========================================================
    FEMA / NRI COMPATIBLE ADAPTER
    ===========================================================
    */

    function ingestNRIStyleData(
        data,
        options = {}
    ) {

        /*
        -------------------------------------------------------
        This adapter intentionally does not fetch FEMA data.

        It accepts already-retrieved NRI-style information.

        Example:

        {
            flood: {
                riskScore: 72,
                riskLevel: "High"
            },

            tornado: {
                riskScore: 40,
                riskLevel: "Moderate"
            }
        }

        This allows a future FEMA API / GIS connector to feed
        the same engine without changing the UI or AI layer.
        -------------------------------------------------------
        */

        const normalized = {};

        Object.keys(
            data || {}
        ).forEach(
            key => {

                const normalizedName =
                    normalizeHazardName(
                        key
                    );

                normalized[
                    normalizedName
                ] =
                    data[key];
            }
        );

        return ingestRisk(
            normalized,
            {
                ...options,

                source:
                    options.source ||
                    "FEMA NRI-compatible dataset",

                sourceType:
                    options.sourceType ||
                    "FEMA-NRI-compatible"
            }
        );
    }

    /*
    ===========================================================
    COMPARISON
    ===========================================================
    */

    function compare(
        riskA,
        riskB
    ) {

        const a =
            normalizeHazards(
                riskA?.hazards ||
                riskA ||
                {}
            );

        const b =
            normalizeHazards(
                riskB?.hazards ||
                riskB ||
                {}
            );

        const comparison = {};

        HAZARDS.forEach(
            hazardName => {

                const hazardA =
                    a[hazardName];

                const hazardB =
                    b[hazardName];

                comparison[
                    hazardName
                ] = {

                    available:
                        Boolean(
                            hazardA &&
                            hazardB
                        ),

                    scoreA:
                        hazardA?.score ??
                        null,

                    scoreB:
                        hazardB?.score ??
                        null,

                    difference:
                        hazardA?.score !== null &&
                        hazardA?.score !== undefined &&
                        hazardB?.score !== null &&
                        hazardB?.score !== undefined
                            ? hazardA.score -
                              hazardB.score
                            : null
                };
            }
        );

        return comparison;
    }

    /*
    ===========================================================
    PROPERTY RISK HOOK
    ===========================================================
    */

    function ingestPropertyRisk(
        propertyRisk,
        options = {}
    ) {

        const current =
            state.profile;

        const nextRisk = {

            ...current.risk,

            property:
                clone(
                    propertyRisk || {}
                )
        };

        return analyze({

            ...options,

            location:
                options.location ||
                current.location,

            risk: {

                ...current.risk,

                hazards:
                    current.risk.hazards,

                property:
                    nextRisk.property
            },

            source:
                options.source ||
                "property risk ingestion",

            sourceType:
                options.sourceType ||
                "property"
        });
    }

    /*
    ===========================================================
    MATCHING ENGINE
    ===========================================================
    */

    function matchesPreferences(
        riskData,
        preferences =
            state.preferences
    ) {

        const hazards =
            normalizeHazards(
                riskData?.hazards ||
                riskData ||
                {}
            );

        const results = [];

        Object.keys(
            hazards
        ).forEach(
            hazardName => {

                const hazard =
                    hazards[
                        hazardName
                    ];

                const tolerance =
                    getTolerancePreference(
                        hazardName,
                        preferences
                    );

                const avoid =
                    getAvoidPreference(
                        hazardName,
                        preferences
                    );

                if (
                    hazard.score === null
                ) {

                    results.push({

                        hazard:
                            hazardName,

                        label:
                            hazard.label,

                        matches:
                            null,

                        reason:
                            "Risk score unavailable."
                    });

                    return;
                }

                let threshold =
                    65;

                if (
                    tolerance === "low"
                ) {
                    threshold = 40;
                }

                if (
                    tolerance === "high"
                ) {
                    threshold = 85;
                }

                const matches =
                    avoid
                        ? hazard.score <
                          threshold
                        : true;

                results.push({

                    hazard:
                        hazardName,

                    label:
                        hazard.label,

                    score:
                        hazard.score,

                    tolerance,

                    avoid,

                    threshold,

                    matches
                });
            }
        );

        const evaluated =
            results.filter(
                item =>
                    item.matches !== null
            );

        const passed =
            evaluated.filter(
                item =>
                    item.matches
            ).length;

        return {

            matches:
                evaluated.length
                    ? passed ===
                      evaluated.length
                    : true,

            checked:
                evaluated.length,

            passed,

            failed:
                evaluated.length -
                passed,

            results
        };
    }

    /*
    ===========================================================
    GETTERS
    ===========================================================
    */

    function getState() {

        return {

            initialized:
                state.initialized,

            status:
                state.status,

            version:
                VERSION
        };
    }

    function getStatus() {

        return state.status;
    }

    function getProfile() {

        return clone(
            state.profile
        );
    }

    function getOverallRisk() {

        return clone(
            state.profile
                .risk
                .overall
        );
    }

    function getAssessment() {

        return clone(
            state.profile
                .assessment
        );
    }

    function getSignals() {

        return clone(
            state.profile
                .signals
        );
    }

    function getFindings() {

        return clone(
            state.profile
                .findings
        );
    }

    function getGaps() {

        return clone(
            state.profile
                .gaps
        );
    }

    function getActions() {

        return clone(
            state.profile
                .actions
        );
    }

    function getSummary() {

        return clone(
            state.profile
                .summary
        );
    }

    function getAIContext() {

        return clone(
            state.profile
                .aiContext ||
            buildAIContext(
                state.profile
            )
        );
    }

    /*
    ===========================================================
    SERIALIZATION
    ===========================================================
    */

    function serialize() {

        return JSON.stringify(
            state.profile,
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

        state.initialized =
            false;

        state.status =
            "not_initialized";

        state.profile =
            clone(
                EMPTY_PROFILE
            );

        state.preferences =
            clone(
                DEFAULT_PREFERENCES
            );

        emit(
            "reset",
            state.profile
        );

        return getState();
    }

    /*
    ===========================================================
    EVENT SYSTEM
    ===========================================================
    */

    function subscribe(
        callback
    ) {

        if (
            typeof callback !==
            "function"
        ) {

            return () => {};
        }

        state.listeners.push(
            callback
        );

        return function unsubscribe() {

            state.listeners =
                state.listeners.filter(
                    listener =>
                        listener !==
                        callback
                );
        };
    }

    function emit(
        event,
        payload
    ) {

        state.listeners.forEach(
            listener => {

                try {

                    listener({

                        module:
                            MODULE_NAME,

                        version:
                            VERSION,

                        event,

                        payload:
                            clone(
                                payload
                            )
                    });

                } catch (error) {

                    console.warn(
                        "[ROlyfeRisk] Listener error:",
                        error
                    );
                }
            }
        );

        try {

            if (
                typeof global.dispatchEvent ===
                "function" &&
                typeof global.CustomEvent ===
                "function"
            ) {

                global.dispatchEvent(
                    new CustomEvent(
                        "rolyfe:risk:" +
                        event,
                        {
                            detail:
                                clone(
                                    payload
                                )
                        }
                    )
                );
            }

        } catch (error) {

            // Browser event support is optional.
        }
    }

    /*
    ===========================================================
    PUBLIC API
    ===========================================================
    */

    const API = {

        VERSION,

        MODULE_NAME,

        HAZARDS:
            clone(
                HAZARDS
            ),

        HAZARD_LABELS:
            clone(
                HAZARD_LABELS
            ),

        initialize,

        reset,

        analyze,

        ingestRisk,

        ingestNRIStyleData,

        ingestPropertyRisk,

        getState,

        getStatus,

        getProfile,

        getOverallRisk,

        getAssessment,

        getHazards,

        getHazard,

        getHighRiskHazards,

        getCategory,

        getSignals,

        getFindings,

        getGaps,

        getActions,

        getSummary,

        getAIContext,

        buildAIContext,

        buildSharedContext,

        compare,

        matchesPreferences,

        setPreferences,

        getPreferences,

        serialize,

        subscribe
    };

    /*
    ===========================================================
    GLOBAL EXPORT
    ===========================================================
    */

    global.ROlyfeRisk =
        API;

    global.ROLYFE_RISK =
        API;

    /*
    ===========================================================
    OPTIONAL AUTO-INITIALIZATION
    ===========================================================
    */

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

                    try {

                        initialize();

                    } catch (error) {

                        console.warn(
                            "[ROlyfeRisk] Initialization warning:",
                            error
                        );
                    }

                },
                {
                    once: true
                }
            );

        } else {

            try {

                initialize();

            } catch (error) {

                console.warn(
                    "[ROlyfeRisk] Initialization warning:",
                    error
                );
            }
        }
    }

})(typeof window !== "undefined"
    ? window
    : globalThis);
