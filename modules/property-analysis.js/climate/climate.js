/*
===========================================================
RO’LYFE RELOCATION INTELLIGENCE CENTER™
CLIMATE INTELLIGENCE MODULE
File: /modules/climate/climate.js
Version: 1.0.0
===========================================================

PURPOSE
-------
Climate intelligence layer for the RO’Lyfe Relocation
Intelligence Center.

This module translates structured climate data into a
location-level climate profile that can be consumed by:

    LOCATION
        ↓
    CLIMATE
        ↓
    RISK
        ↓
    HOUSING
        ↓
    BUSINESS
        ↓
    OPPORTUNITY
        ↓
    RO’Lyfe AI

DESIGN PRINCIPLES
-----------------
• State → County → City → ZIP compatible
• 50-state architecture
• PA-first but not PA-dependent
• No universal "best climate" ranking
• User preferences determine interpretation
• Works with current JSON data
• Ready for future NOAA/API ingestion
• Browser-safe
• No framework dependency
• Defensive against missing data

SUPPORTED CLIMATE SIGNALS
-------------------------
• Average temperature
• High / low temperature
• Summer heat
• Winter cold
• Precipitation
• Snowfall
• Freeze days
• Growing season
• Humidity
• Sunshine
• Heating degree days
• Cooling degree days
• Climate zone
• Seasonal profile
• Climate comfort
• Climate-related gaps

===========================================================
*/

(function (global) {
    "use strict";

    const VERSION = "1.0.0";

    const MODULE_NAME = "ROlyfeClimate";

    const DEFAULT_PREFERENCES = {
        heatTolerance: "moderate",
        coldTolerance: "moderate",
        snowTolerance: "moderate",
        humidityTolerance: "moderate",
        precipitationTolerance: "moderate",

        preferredClimate: "",
        preferredSeasons: [],
        avoidExtremeHeat: false,
        avoidExtremeCold: false,
        avoidHeavySnow: false,
        avoidHighHumidity: false,
        avoidHighPrecipitation: false,

        outdoorPriority: false,
        energyCostPriority: false,
        agriculturePriority: false,
        relocationPriority: false
    };

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
            zip: ""
        },

        climate: {
            classification: "",
            zone: "",
            description: "",

            averageTemperature: null,
            averageHigh: null,
            averageLow: null,

            summerHigh: null,
            summerLow: null,
            winterHigh: null,
            winterLow: null,

            precipitation: null,
            snowfall: null,

            freezeDays: null,
            growingSeasonDays: null,

            humidity: null,
            sunshine: null,

            heatingDegreeDays: null,
            coolingDegreeDays: null,

            seasons: {
                spring: {},
                summer: {},
                fall: {},
                winter: {}
            }
        },

        comfort: {
            overall: null,
            heat: null,
            cold: null,
            snow: null,
            humidity: null,
            precipitation: null
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
            referencePeriod: "1991-2020",
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
            return JSON.parse(JSON.stringify(value));
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
        if (value === null || value === undefined) return false;
        if (typeof value === "string" && value.trim() === "") return false;
        if (typeof value === "number" && Number.isNaN(value)) return false;
        return true;
    }

    function number(value) {
        if (typeof value === "number" && Number.isFinite(value)) {
            return value;
        }

        if (typeof value === "string") {
            const parsed = parseFloat(
                value.replace(/[^0-9.+-]/g, "")
            );

            return Number.isFinite(parsed) ? parsed : null;
        }

        return null;
    }

    function string(value, fallback = "") {
        return hasValue(value) ? String(value) : fallback;
    }

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function average(values) {
        const valid = values
            .map(number)
            .filter(value => value !== null);

        if (!valid.length) return null;

        return valid.reduce((sum, value) => sum + value, 0) /
            valid.length;
    }

    function titleCase(value) {
        return String(value || "")
            .replace(/[_-]+/g, " ")
            .replace(/\b\w/g, char => char.toUpperCase());
    }

    /*
    ===========================================================
    LOCATION NORMALIZATION
    ===========================================================
    */

    function normalizeLocation(location) {
        location = location || {};

        return {
            country: string(
                location.country ||
                location.countryCode ||
                "United States"
            ),

            state: string(
                location.state ||
                location.stateCode ||
                location.abbreviation
            ),

            stateName: string(
                location.stateName ||
                location.state_name
            ),

            county: string(
                location.county ||
                location.countyName
            ),

            city: string(
                location.city ||
                location.cityName
            ),

            zip: string(
                location.zip ||
                location.zipCode ||
                location.postalCode
            )
        };
    }

    /*
    ===========================================================
    CLIMATE DATA NORMALIZATION
    ===========================================================
    */

    function normalizeClimate(raw) {
        raw = raw || {};

        const temperature =
            raw.temperature ||
            raw.temperatures ||
            {};

        const precipitation =
            raw.precipitation ||
            {};

        const snow =
            raw.snow ||
            raw.snowfall ||
            {};

        const seasons =
            raw.seasons ||
            raw.seasonal ||
            {};

        const normalized = {

            classification: string(
                raw.classification ||
                raw.climateClassification ||
                raw.type ||
                raw.climate_type
            ),

            zone: string(
                raw.zone ||
                raw.climateZone ||
                raw.usdaZone
            ),

            description: string(
                raw.description ||
                raw.summary ||
                raw.notes
            ),

            averageTemperature: number(
                raw.averageTemperature ??
                raw.avgTemperature ??
                temperature.average ??
                temperature.mean ??
                raw.meanTemperature
            ),

            averageHigh: number(
                raw.averageHigh ??
                raw.avgHigh ??
                temperature.averageHigh ??
                temperature.high
            ),

            averageLow: number(
                raw.averageLow ??
                raw.avgLow ??
                temperature.averageLow ??
                temperature.low
            ),

            summerHigh: number(
                raw.summerHigh ??
                temperature.summerHigh ??
                seasons.summer?.high
            ),

            summerLow: number(
                raw.summerLow ??
                temperature.summerLow ??
                seasons.summer?.low
            ),

            winterHigh: number(
                raw.winterHigh ??
                temperature.winterHigh ??
                seasons.winter?.high
            ),

            winterLow: number(
                raw.winterLow ??
                temperature.winterLow ??
                seasons.winter?.low
            ),

            precipitation: number(
                raw.precipitation ??
                raw.annualPrecipitation ??
                precipitation.annual ??
                precipitation.total
            ),

            snowfall: number(
                raw.snowfall ??
                raw.annualSnowfall ??
                snow.annual ??
                snow.total
            ),

            freezeDays: number(
                raw.freezeDays ??
                raw.daysBelowFreezing ??
                raw.freezingDays
            ),

            growingSeasonDays: number(
                raw.growingSeasonDays ??
                raw.growingSeason ??
                raw.growingDays
            ),

            humidity: number(
                raw.humidity ??
                raw.averageHumidity ??
                raw.relativeHumidity
            ),

            sunshine: number(
                raw.sunshine ??
                raw.sunshinePercent ??
                raw.percentSunshine
            ),

            heatingDegreeDays: number(
                raw.heatingDegreeDays ??
                raw.hdd
            ),

            coolingDegreeDays: number(
                raw.coolingDegreeDays ??
                raw.cdd
            ),

            seasons: {
                spring: normalizeSeason(seasons.spring),
                summer: normalizeSeason(seasons.summer),
                fall: normalizeSeason(
                    seasons.fall ||
                    seasons.autumn
                ),
                winter: normalizeSeason(seasons.winter)
            }
        };

        return normalized;
    }

    function normalizeSeason(season) {
        season = season || {};

        return {
            averageTemperature: number(
                season.averageTemperature ??
                season.average ??
                season.mean
            ),

            high: number(
                season.high ??
                season.averageHigh
            ),

            low: number(
                season.low ??
                season.averageLow
            ),

            precipitation: number(
                season.precipitation ??
                season.rainfall
            ),

            snowfall: number(
                season.snowfall ??
                season.snow
            ),

            description: string(
                season.description ||
                season.summary
            )
        };
    }

    /*
    ===========================================================
    DATA EXTRACTION
    ===========================================================
    */

    function extractClimateFromAnalysis(analysis) {
        if (!analysis) return null;

        if (analysis.intelligence?.climate) {
            return analysis.intelligence.climate;
        }

        if (analysis.domains?.climate) {
            return analysis.domains.climate;
        }

        if (analysis.climate) {
            return analysis.climate;
        }

        if (analysis.data?.intelligence?.climate) {
            return analysis.data.intelligence.climate;
        }

        return null;
    }

    function extractLocationFromAnalysis(analysis) {
        if (!analysis) return {};

        if (analysis.location) {
            return analysis.location;
        }

        if (analysis.data?.location) {
            return analysis.data.location;
        }

        return {};
    }

    /*
    ===========================================================
    CLIMATE INTERPRETATION
    ===========================================================
    */

    function calculateComfort(profile) {
        const climate = profile.climate;

        const heat = evaluateHeatComfort(
            climate,
            state.preferences
        );

        const cold = evaluateColdComfort(
            climate,
            state.preferences
        );

        const snow = evaluateSnowComfort(
            climate,
            state.preferences
        );

        const humidity = evaluateHumidityComfort(
            climate,
            state.preferences
        );

        const precipitation = evaluatePrecipitationComfort(
            climate,
            state.preferences
        );

        const values = [
            heat,
            cold,
            snow,
            humidity,
            precipitation
        ]
            .map(item => item.score)
            .filter(value => Number.isFinite(value));

        const overall = values.length
            ? Math.round(
                values.reduce((sum, value) => sum + value, 0) /
                values.length
            )
            : null;

        return {
            overall,
            heat: heat.score,
            cold: cold.score,
            snow: snow.score,
            humidity: humidity.score,
            precipitation: precipitation.score,

            details: {
                heat,
                cold,
                snow,
                humidity,
                precipitation
            }
        };
    }

    function evaluateHeatComfort(climate, preferences) {
        const temp =
            climate.summerHigh ??
            climate.averageHigh;

        if (temp === null) {
            return {
                score: null,
                status: "unknown",
                message: "Summer heat data unavailable."
            };
        }

        let score = 75;

        if (temp >= 100) score -= 35;
        else if (temp >= 95) score -= 25;
        else if (temp >= 90) score -= 15;
        else if (temp >= 85) score -= 5;
        else if (temp >= 75) score += 5;

        if (preferences.heatTolerance === "high") {
            score += 10;
        }

        if (preferences.heatTolerance === "low") {
            score -= 10;
        }

        return {
            score: clamp(Math.round(score), 0, 100),
            status: score >= 70
                ? "comfortable"
                : score >= 50
                    ? "moderate"
                    : "challenging",

            message:
                temp >= 95
                    ? "Summer heat may be a significant climate consideration."
                    : temp >= 85
                        ? "Warm summer conditions should be considered."
                        : "Summer temperatures appear relatively moderate."
        };
    }

    function evaluateColdComfort(climate, preferences) {
        const temp =
            climate.winterLow ??
            climate.averageLow;

        if (temp === null) {
            return {
                score: null,
                status: "unknown",
                message: "Winter temperature data unavailable."
            };
        }

        let score = 75;

        if (temp <= 10) score -= 35;
        else if (temp <= 20) score -= 25;
        else if (temp <= 30) score -= 15;
        else if (temp <= 40) score -= 5;
        else if (temp >= 50) score += 5;

        if (preferences.coldTolerance === "high") {
            score += 10;
        }

        if (preferences.coldTolerance === "low") {
            score -= 10;
        }

        return {
            score: clamp(Math.round(score), 0, 100),
            status: score >= 70
                ? "comfortable"
                : score >= 50
                    ? "moderate"
                    : "challenging",

            message:
                temp <= 20
                    ? "Winter cold may be a significant climate consideration."
                    : temp <= 35
                        ? "Cool winter conditions should be considered."
                        : "Winter temperatures appear relatively moderate."
        };
    }

    function evaluateSnowComfort(climate, preferences) {
        const snow = climate.snowfall;

        if (snow === null) {
            return {
                score: null,
                status: "unknown",
                message: "Snowfall data unavailable."
            };
        }

        let score;

        if (snow <= 5) score = 95;
        else if (snow <= 15) score = 85;
        else if (snow <= 30) score = 70;
        else if (snow <= 60) score = 50;
        else if (snow <= 100) score = 30;
        else score = 15;

        if (preferences.snowTolerance === "high") {
            score += 10;
        }

        if (preferences.snowTolerance === "low") {
            score -= 10;
        }

        return {
            score: clamp(Math.round(score), 0, 100),
            status: score >= 70
                ? "lower_impact"
                : score >= 50
                    ? "moderate"
                    : "higher_impact",

            message:
                snow >= 60
                    ? "Snowfall may materially affect transportation, maintenance and housing decisions."
                    : snow >= 20
                        ? "Seasonal snowfall may be a meaningful consideration."
                        : "Annual snowfall appears relatively limited."
        };
    }

    function evaluateHumidityComfort(climate, preferences) {
        const humidity = climate.humidity;

        if (humidity === null) {
            return {
                score: null,
                status: "unknown",
                message: "Humidity data unavailable."
            };
        }

        let score = 80;

        if (humidity >= 80) score -= 30;
        else if (humidity >= 70) score -= 15;
        else if (humidity >= 60) score -= 5;
        else if (humidity >= 40) score += 5;

        if (preferences.humidityTolerance === "high") {
            score += 10;
        }

        if (preferences.humidityTolerance === "low") {
            score -= 10;
        }

        return {
            score: clamp(Math.round(score), 0, 100),
            status: score >= 70
                ? "comfortable"
                : score >= 50
                    ? "moderate"
                    : "challenging",

            message:
                humidity >= 75
                    ? "Higher humidity may affect comfort and cooling demand."
                    : "Humidity appears relatively moderate."
        };
    }

    function evaluatePrecipitationComfort(climate, preferences) {
        const precipitation = climate.precipitation;

        if (precipitation === null) {
            return {
                score: null,
                status: "unknown",
                message: "Precipitation data unavailable."
            };
        }

        let score = 80;

        if (precipitation >= 70) score -= 30;
        else if (precipitation >= 55) score -= 15;
        else if (precipitation >= 40) score -= 5;
        else if (precipitation >= 25) score += 5;

        if (preferences.precipitationTolerance === "high") {
            score += 10;
        }

        if (preferences.precipitationTolerance === "low") {
            score -= 10;
        }

        return {
            score: clamp(Math.round(score), 0, 100),
            status: score >= 70
                ? "moderate"
                : score >= 50
                    ? "higher"
                    : "very_high",

            message:
                precipitation >= 60
                    ? "Higher annual precipitation may influence drainage, moisture and flood considerations."
                    : "Annual precipitation appears moderate."
        };
    }

    /*
    ===========================================================
    SIGNAL ENGINE
    ===========================================================
    */

    function buildSignals(profile) {
        const climate = profile.climate;
        const signals = [];

        if (climate.classification) {
            signals.push({
                type: "classification",
                level: "info",
                title: "Climate Classification",
                value: climate.classification
            });
        }

        if (climate.averageTemperature !== null) {
            signals.push({
                type: "temperature",
                level: "info",
                title: "Average Temperature",
                value: climate.averageTemperature
            });
        }

        if (climate.summerHigh !== null) {
            signals.push({
                type: "heat",
                level: climate.summerHigh >= 95
                    ? "attention"
                    : "info",
                title: "Summer Heat",
                value: climate.summerHigh,
                message:
                    climate.summerHigh >= 95
                        ? "Hot summer conditions detected."
                        : "Summer temperatures within recorded range."
            });
        }

        if (climate.winterLow !== null) {
            signals.push({
                type: "cold",
                level: climate.winterLow <= 20
                    ? "attention"
                    : "info",
                title: "Winter Cold",
                value: climate.winterLow,
                message:
                    climate.winterLow <= 20
                        ? "Cold winter conditions detected."
                        : "Winter temperatures within recorded range."
            });
        }

        if (climate.snowfall !== null) {
            signals.push({
                type: "snow",
                level: climate.snowfall >= 60
                    ? "attention"
                    : "info",
                title: "Annual Snowfall",
                value: climate.snowfall
            });
        }

        if (climate.precipitation !== null) {
            signals.push({
                type: "precipitation",
                level: climate.precipitation >= 60
                    ? "attention"
                    : "info",
                title: "Annual Precipitation",
                value: climate.precipitation
            });
        }

        if (climate.growingSeasonDays !== null) {
            signals.push({
                type: "growing-season",
                level: "opportunity",
                title: "Growing Season",
                value: climate.growingSeasonDays,
                message: "Growing-season length may matter for agriculture, landscaping and outdoor business activity."
            });
        }

        if (climate.heatingDegreeDays !== null) {
            signals.push({
                type: "heating-demand",
                level: "financial",
                title: "Heating Demand",
                value: climate.heatingDegreeDays,
                message: "Heating degree days can help contextualize seasonal energy demand."
            });
        }

        if (climate.coolingDegreeDays !== null) {
            signals.push({
                type: "cooling-demand",
                level: "financial",
                title: "Cooling Demand",
                value: climate.coolingDegreeDays,
                message: "Cooling degree days can help contextualize seasonal energy demand."
            });
        }

        return signals;
    }

    /*
    ===========================================================
    FINDINGS
    ===========================================================
    */

    function buildFindings(profile) {
        const climate = profile.climate;
        const findings = [];

        if (
            climate.summerHigh !== null &&
            climate.summerHigh >= 95
        ) {
            findings.push({
                category: "heat",
                severity: "attention",
                title: "High Summer Heat",
                detail: "Summer temperatures may influence comfort, cooling demand, landscaping and outdoor activity."
            });
        }

        if (
            climate.winterLow !== null &&
            climate.winterLow <= 20
        ) {
            findings.push({
                category: "cold",
                severity: "attention",
                title: "Cold Winter Conditions",
                detail: "Cold temperatures may influence heating demand, transportation and property maintenance."
            });
        }

        if (
            climate.snowfall !== null &&
            climate.snowfall >= 60
        ) {
            findings.push({
                category: "snow",
                severity: "attention",
                title: "Higher Snowfall",
                detail: "Snowfall may affect transportation, maintenance, insurance considerations and operating costs."
            });
        }

        if (
            climate.precipitation !== null &&
            climate.precipitation >= 60
        ) {
            findings.push({
                category: "precipitation",
                severity: "attention",
                title: "Higher Precipitation",
                detail: "Higher precipitation should be reviewed alongside drainage and flood-risk data."
            });
        }

        if (
            climate.growingSeasonDays !== null &&
            climate.growingSeasonDays >= 180
        ) {
            findings.push({
                category: "opportunity",
                severity: "positive",
                title: "Longer Growing Season",
                detail: "A longer growing season may support agriculture, landscaping and outdoor-oriented activity."
            });
        }

        if (
            climate.heatingDegreeDays !== null &&
            climate.coolingDegreeDays !== null
        ) {
            findings.push({
                category: "energy",
                severity: "financial",
                title: "Energy Demand Profile Available",
                detail: "Heating and cooling demand can be incorporated into property and cost analysis."
            });
        }

        return findings;
    }

    /*
    ===========================================================
    DATA GAPS
    ===========================================================
    */

    function buildGaps(profile) {
        const climate = profile.climate;
        const gaps = [];

        const requiredFields = [
            ["averageTemperature", "Average temperature"],
            ["averageHigh", "Average high temperature"],
            ["averageLow", "Average low temperature"],
            ["summerHigh", "Summer high temperature"],
            ["winterLow", "Winter low temperature"],
            ["precipitation", "Annual precipitation"],
            ["snowfall", "Annual snowfall"],
            ["freezeDays", "Freeze days"],
            ["growingSeasonDays", "Growing season"],
            ["humidity", "Humidity"]
        ];

        requiredFields.forEach(([field, label]) => {
            if (!hasValue(climate[field])) {
                gaps.push({
                    field,
                    label,
                    importance:
                        field === "averageTemperature" ||
                        field === "summerHigh" ||
                        field === "winterLow"
                            ? "high"
                            : "medium"
                });
            }
        });

        return gaps;
    }

    /*
    ===========================================================
    ACTION ENGINE
    ===========================================================
    */

    function buildActions(profile) {
        const actions = [];

        if (profile.gaps.length) {
            actions.push({
                type: "data",
                priority: "high",
                title: "Complete Climate Dataset",
                detail: "Add missing temperature, precipitation, snowfall and seasonal climate measurements."
            });
        }

        if (
            profile.climate.summerHigh !== null &&
            profile.climate.summerHigh >= 95
        ) {
            actions.push({
                type: "risk-review",
                priority: "medium",
                title: "Review Heat Exposure",
                detail: "Cross-reference heat conditions with utility costs, housing design and heat-risk data."
            });
        }

        if (
            profile.climate.winterLow !== null &&
            profile.climate.winterLow <= 20
        ) {
            actions.push({
                type: "property-review",
                priority: "medium",
                title: "Review Winter Property Requirements",
                detail: "Review heating systems, insulation, winter maintenance and cold-weather operating costs."
            });
        }

        if (
            profile.climate.precipitation !== null &&
            profile.climate.precipitation >= 60
        ) {
            actions.push({
                type: "risk-review",
                priority: "medium",
                title: "Cross-Check Flood Risk",
                detail: "Climate precipitation should be evaluated together with location-specific flood and drainage data."
            });
        }

        if (
            profile.preferences.outdoorPriority &&
            profile.climate.growingSeasonDays !== null
        ) {
            actions.push({
                type: "opportunity",
                priority: "medium",
                title: "Evaluate Outdoor Opportunity",
                detail: "Use growing-season and seasonal climate data in outdoor business, agriculture and lifestyle analysis."
            });
        }

        if (profile.preferences.energyCostPriority) {
            actions.push({
                type: "financial",
                priority: "medium",
                title: "Review Energy Demand",
                detail: "Use heating and cooling degree days as inputs to future property operating-cost analysis."
            });
        }

        return actions;
    }

    /*
    ===========================================================
    SUMMARY
    ===========================================================
    */

    function buildSummary(profile) {
        const climate = profile.climate;

        const locationName =
            profile.location.city ||
            profile.location.county ||
            profile.location.stateName ||
            profile.location.state ||
            "Selected location";

        const summary = {
            location: locationName,

            classification:
                climate.classification ||
                "Climate classification unavailable",

            temperature:
                climate.averageTemperature !== null
                    ? climate.averageTemperature
                    : null,

            summer:
                climate.summerHigh !== null
                    ? climate.summerHigh
                    : null,

            winter:
                climate.winterLow !== null
                    ? climate.winterLow
                    : null,

            precipitation:
                climate.precipitation !== null
                    ? climate.precipitation
                    : null,

            snowfall:
                climate.snowfall !== null
                    ? climate.snowfall
                    : null,

            growingSeason:
                climate.growingSeasonDays !== null
                    ? climate.growingSeasonDays
                    : null,

            comfort:
                profile.comfort.overall,

            dataCompleteness:
                calculateDataCompleteness(profile)
        };

        summary.narrative = buildNarrative(summary);

        return summary;
    }

    function buildNarrative(summary) {
        const parts = [];

        if (summary.classification) {
            parts.push(
                `${summary.location} has a ${summary.classification} climate profile.`
            );
        } else {
            parts.push(
                `Climate classification data is not yet available for ${summary.location}.`
            );
        }

        if (summary.summer !== null) {
            parts.push(
                `Recorded summer high: ${formatValue(summary.summer)}.`
            );
        }

        if (summary.winter !== null) {
            parts.push(
                `Recorded winter low: ${formatValue(summary.winter)}.`
            );
        }

        if (summary.precipitation !== null) {
            parts.push(
                `Annual precipitation: ${formatValue(summary.precipitation)}.`
            );
        }

        if (summary.snowfall !== null) {
            parts.push(
                `Annual snowfall: ${formatValue(summary.snowfall)}.`
            );
        }

        return parts.join(" ");
    }

    function formatValue(value) {
        if (value === null || value === undefined) {
            return "N/A";
        }

        if (typeof value === "number") {
            return Number.isInteger(value)
                ? String(value)
                : value.toFixed(1);
        }

        return String(value);
    }

    /*
    ===========================================================
    DATA COMPLETENESS
    ===========================================================
    */

    function calculateDataCompleteness(profile) {
        const fields = [
            "classification",
            "averageTemperature",
            "averageHigh",
            "averageLow",
            "summerHigh",
            "summerLow",
            "winterHigh",
            "winterLow",
            "precipitation",
            "snowfall",
            "freezeDays",
            "growingSeasonDays",
            "humidity",
            "sunshine"
        ];

        const available = fields.filter(
            field => hasValue(profile.climate[field])
        ).length;

        return Math.round(
            (available / fields.length) * 100
        );
    }

    /*
    ===========================================================
    AI CONTEXT
    ===========================================================
    */

    function buildAIContext(profile) {
        const climate = profile.climate;

        return {
            module: MODULE_NAME,
            version: VERSION,

            location: clone(profile.location),

            climate: {
                classification: climate.classification,
                zone: climate.zone,

                averageTemperature: climate.averageTemperature,
                averageHigh: climate.averageHigh,
                averageLow: climate.averageLow,

                summerHigh: climate.summerHigh,
                summerLow: climate.summerLow,

                winterHigh: climate.winterHigh,
                winterLow: climate.winterLow,

                precipitation: climate.precipitation,
                snowfall: climate.snowfall,

                freezeDays: climate.freezeDays,
                growingSeasonDays: climate.growingSeasonDays,

                humidity: climate.humidity,
                sunshine: climate.sunshine,

                heatingDegreeDays: climate.heatingDegreeDays,
                coolingDegreeDays: climate.coolingDegreeDays
            },

            comfort: clone(profile.comfort),

            signals: clone(profile.signals),

            findings: clone(profile.findings),

            gaps: clone(profile.gaps),

            preferences: clone(profile.preferences),

            interpretationRules: [
                "Climate should be interpreted alongside hazard and weather data.",
                "Climate comfort depends on user preferences.",
                "Climate data does not by itself determine whether a location is suitable.",
                "Housing, cost, risk, business and incentive data should be considered separately.",
                "Historical climate normals describe typical conditions and are not a forecast."
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
            module: MODULE_NAME,
            version: VERSION,
            location: clone(state.profile.location),
            climate: clone(state.profile.climate),
            comfort: clone(state.profile.comfort),
            signals: clone(state.profile.signals),
            findings: clone(state.profile.findings),
            gaps: clone(state.profile.gaps),
            actions: clone(state.profile.actions),
            preferences: clone(state.preferences)
        };
    }

    /*
    ===========================================================
    ANALYSIS
    ===========================================================
    */

    function analyze(options = {}) {
        const analysis =
            options.analysis ||
            getCoreAnalysis();

        const location =
            options.location ||
            extractLocationFromAnalysis(analysis);

        const rawClimate =
            options.climate ||
            extractClimateFromAnalysis(analysis) ||
            options.data ||
            {};

        const normalizedLocation =
            normalizeLocation(location);

        const climate =
            normalizeClimate(rawClimate);

        const profile = clone(EMPTY_PROFILE);

        profile.status = "ready";

        profile.location =
            normalizedLocation;

        profile.climate =
            climate;

        profile.preferences =
            clone(state.preferences);

        profile.metadata = {
            source:
                options.source ||
                rawClimate.source ||
                "RO’Lyfe climate data",

            sourceType:
                options.sourceType ||
                rawClimate.sourceType ||
                "structured",

            referencePeriod:
                rawClimate.referencePeriod ||
                rawClimate.normalPeriod ||
                "1991-2020",

            lastUpdated:
                rawClimate.lastUpdated ||
                "",

            confidence:
                rawClimate.confidence ||
                determineConfidence(climate)
        };

        profile.comfort =
            calculateComfort(profile);

        profile.signals =
            buildSignals(profile);

        profile.findings =
            buildFindings(profile);

        profile.gaps =
            buildGaps(profile);

        profile.actions =
            buildActions(profile);

        profile.summary =
            buildSummary(profile);

        profile.aiContext =
            buildAIContext(profile);

        state.profile =
            profile;

        state.status =
            "ready";

        state.initialized =
            true;

        emit("analyzed", profile);

        return clone(profile);
    }

    function determineConfidence(climate) {
        const completeness =
            calculateDataCompleteness({
                climate
            });

        if (completeness >= 85) return "high";
        if (completeness >= 60) return "medium";
        if (completeness >= 30) return "limited";

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

            if (typeof core.getAnalysis === "function") {
                return core.getAnalysis();
            }

            if (typeof core.getState === "function") {
                const coreState =
                    core.getState();

                return coreState?.analysis ||
                    coreState;
            }
        } catch (error) {
            console.warn(
                "[ROlyfeClimate] Unable to retrieve core analysis:",
                error
            );
        }

        return null;
    }

    function initialize(options = {}) {
        state.initialized = true;
        state.status = "initialized";

        if (options.preferences) {
            setPreferences(options.preferences);
        }

        if (
            options.analysis ||
            options.location ||
            options.climate ||
            options.data
        ) {
            return analyze(options);
        }

        const coreAnalysis =
            getCoreAnalysis();

        if (coreAnalysis) {
            return analyze({
                analysis: coreAnalysis
            });
        }

        state.profile =
            clone(EMPTY_PROFILE);

        state.profile.status =
            "initialized";

        state.profile.preferences =
            clone(state.preferences);

        state.profile.aiContext =
            buildAIContext(state.profile);

        emit("initialized", state.profile);

        return clone(state.profile);
    }

    /*
    ===========================================================
    PREFERENCE MANAGEMENT
    ===========================================================
    */

    function setPreferences(preferences = {}) {
        state.preferences = {
            ...state.preferences,
            ...preferences
        };

        if (state.initialized) {
            state.profile.preferences =
                clone(state.preferences);

            state.profile.comfort =
                calculateComfort(state.profile);

            state.profile.signals =
                buildSignals(state.profile);

            state.profile.findings =
                buildFindings(state.profile);

            state.profile.gaps =
                buildGaps(state.profile);

            state.profile.actions =
                buildActions(state.profile);

            state.profile.summary =
                buildSummary(state.profile);

            state.profile.aiContext =
                buildAIContext(state.profile);

            emit(
                "preferences_changed",
                state.profile
            );
        }

        return clone(state.preferences);
    }

    function getPreferences() {
        return clone(state.preferences);
    }

    /*
    ===========================================================
    DATA INGESTION
    ===========================================================
    */

    function ingestClimate(climateData, options = {}) {
        return analyze({
            ...options,
            climate: climateData,
            source:
                options.source ||
                climateData?.source ||
                "manual climate ingestion",
            sourceType:
                options.sourceType ||
                "ingested"
        });
    }

    function ingestNOAAStyleData(data, options = {}) {
        /*
        -------------------------------------------------------
        Future NOAA adapter.

        The module does not directly call NOAA here.
        Instead, it accepts NOAA-shaped climate data after
        retrieval by a future data connector/API layer.
        -------------------------------------------------------
        */

        const normalized = {
            ...data,

            averageTemperature:
                data.averageTemperature ??
                data.avgMeanTemperature ??
                data.meanTemperature,

            averageHigh:
                data.averageHigh ??
                data.avgMaximumTemperature ??
                data.maxTemperature,

            averageLow:
                data.averageLow ??
                data.avgMinimumTemperature ??
                data.minTemperature,

            precipitation:
                data.precipitation ??
                data.annualPrecipitation,

            snowfall:
                data.snowfall ??
                data.annualSnowfall,

            heatingDegreeDays:
                data.heatingDegreeDays ??
                data.hdd,

            coolingDegreeDays:
                data.coolingDegreeDays ??
                data.cdd,

            growingSeasonDays:
                data.growingSeasonDays ??
                data.growingSeason
        };

        return ingestClimate(
            normalized,
            {
                ...options,
                source:
                    options.source ||
                    "NOAA-compatible climate dataset",
                sourceType:
                    options.sourceType ||
                    "NOAA-compatible"
            }
        );
    }

    /*
    ===========================================================
    SEASONAL ANALYSIS
    ===========================================================
    */

    function getSeason(season) {
        const normalized =
            String(season || "")
                .toLowerCase();

        const seasons =
            state.profile.climate.seasons;

        if (
            normalized === "fall" ||
            normalized === "autumn"
        ) {
            return clone(seasons.fall);
        }

        if (
            normalized === "spring" ||
            normalized === "summer" ||
            normalized === "winter"
        ) {
            return clone(seasons[normalized]);
        }

        return null;
    }

    function getSeasonalProfile() {
        return clone(
            state.profile.climate.seasons
        );
    }

    /*
    ===========================================================
    CLIMATE COMPARISON
    ===========================================================
    */

    function compare(climateA, climateB) {
        const a =
            normalizeClimate(climateA);

        const b =
            normalizeClimate(climateB);

        return {
            temperature: compareMetric(
                a.averageTemperature,
                b.averageTemperature
            ),

            summerHigh: compareMetric(
                a.summerHigh,
                b.summerHigh
            ),

            winterLow: compareMetric(
                a.winterLow,
                b.winterLow
            ),

            precipitation: compareMetric(
                a.precipitation,
                b.precipitation
            ),

            snowfall: compareMetric(
                a.snowfall,
                b.snowfall
            ),

            growingSeasonDays: compareMetric(
                a.growingSeasonDays,
                b.growingSeasonDays
            ),

            humidity: compareMetric(
                a.humidity,
                b.humidity
            )
        };
    }

    function compareMetric(a, b) {
        if (a === null || b === null) {
            return {
                available: false,
                difference: null
            };
        }

        return {
            available: true,
            difference: a - b,
            absoluteDifference: Math.abs(a - b)
        };
    }

    /*
    ===========================================================
    FILTER / MATCHING
    ===========================================================
    */

    function matchesPreferences(
        climateData,
        preferences = state.preferences
    ) {
        const climate =
            normalizeClimate(climateData);

        const checks = [];

        if (
            preferences.avoidExtremeHeat &&
            climate.summerHigh !== null
        ) {
            checks.push(
                climate.summerHigh < 95
            );
        }

        if (
            preferences.avoidExtremeCold &&
            climate.winterLow !== null
        ) {
            checks.push(
                climate.winterLow > 20
            );
        }

        if (
            preferences.avoidHeavySnow &&
            climate.snowfall !== null
        ) {
            checks.push(
                climate.snowfall < 30
            );
        }

        if (
            preferences.avoidHighHumidity &&
            climate.humidity !== null
        ) {
            checks.push(
                climate.humidity < 75
            );
        }

        if (
            preferences.avoidHighPrecipitation &&
            climate.precipitation !== null
        ) {
            checks.push(
                climate.precipitation < 60
            );
        }

        if (!checks.length) {
            return {
                matches: true,
                checked: 0,
                passed: 0,
                failed: 0
            };
        }

        const passed =
            checks.filter(Boolean).length;

        return {
            matches: passed === checks.length,
            checked: checks.length,
            passed,
            failed: checks.length - passed
        };
    }

    /*
    ===========================================================
    GETTERS
    ===========================================================
    */

    function getState() {
        return {
            initialized: state.initialized,
            status: state.status,
            version: VERSION
        };
    }

    function getStatus() {
        return state.status;
    }

    function getProfile() {
        return clone(state.profile);
    }

    function getClimate() {
        return clone(
            state.profile.climate
        );
    }

    function getComfort() {
        return clone(
            state.profile.comfort
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

    function getGaps() {
        return clone(
            state.profile.gaps
        );
    }

    function getActions() {
        return clone(
            state.profile.actions
        );
    }

    function getSummary() {
        return clone(
            state.profile.summary
        );
    }

    function getAIContext() {
        return clone(
            state.profile.aiContext ||
            buildAIContext(state.profile)
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
        state.initialized = false;
        state.status = "not_initialized";

        state.profile =
            clone(EMPTY_PROFILE);

        state.preferences =
            clone(DEFAULT_PREFERENCES);

        emit("reset", state.profile);

        return getState();
    }

    /*
    ===========================================================
    EVENT SYSTEM
    ===========================================================
    */

    function subscribe(callback) {
        if (typeof callback !== "function") {
            return () => {};
        }

        state.listeners.push(callback);

        return function unsubscribe() {
            state.listeners =
                state.listeners.filter(
                    listener =>
                        listener !== callback
                );
        };
    }

    function emit(event, payload) {
        state.listeners.forEach(
            listener => {
                try {
                    listener({
                        module: MODULE_NAME,
                        version: VERSION,
                        event,
                        payload: clone(payload)
                    });
                } catch (error) {
                    console.warn(
                        "[ROlyfeClimate] Listener error:",
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
                        "rolyfe:climate:" + event,
                        {
                            detail: clone(payload)
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

        initialize,

        reset,

        analyze,

        ingestClimate,

        ingestNOAAStyleData,

        getState,

        getStatus,

        getProfile,

        getClimate,

        getComfort,

        getSummary,

        getSignals,

        getFindings,

        getGaps,

        getActions,

        getAIContext,

        buildAIContext,

        buildSharedContext,

        getSeason,

        getSeasonalProfile,

        compare,

        matchesPreferences,

        setPreferences,

        getPreferences,

        calculateDataCompleteness,

        serialize,

        subscribe
    };

    /*
    ===========================================================
    GLOBAL EXPORT
    ===========================================================
    */

    global.ROlyfeClimate =
        API;

    global.ROLYFE_CLIMATE =
        API;

    /*
    ===========================================================
    OPTIONAL AUTO-INITIALIZATION
    ===========================================================
    */

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
                    try {
                        initialize();
                    } catch (error) {
                        console.warn(
                            "[ROlyfeClimate] Initialization warning:",
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
                    "[ROlyfeClimate] Initialization warning:",
                    error
                );
            }
        }
    }

})(typeof window !== "undefined"
    ? window
    : globalThis);
