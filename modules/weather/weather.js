/*
===========================================================
RO’LYFE RELOCATION INTELLIGENCE CENTER™
WEATHER INTELLIGENCE MODULE
File: /modules/weather/weather.js
Version: 1.0.0
===========================================================

PURPOSE
-------
Live / near-real-time weather intelligence layer.

This module is intentionally separate from:

    climate.js
        = long-term climate patterns / normals

    risk.js
        = hazard exposure / geographic risk

    weather.js
        = current conditions / forecast / active alerts

ARCHITECTURE
------------

LOCATION
   ↓
COORDINATES
   ↓
WEATHER ROUTER
   ├── Current Conditions
   ├── Hourly Forecast
   ├── Daily Forecast
   ├── Alerts
   ├── Forecast Office
   └── Observation Station
          ↓
    WEATHER PROFILE
          ↓
    RISK / CLIMATE / HOUSING
          ↓
       RO’Lyfe AI

PRIMARY DATA TARGET
-------------------
National Weather Service / NOAA Weather API

The NWS API provides:
• point forecast discovery
• hourly forecasts
• forecast periods
• observations
• active alerts

IMPORTANT
---------
This module does NOT assume that weather data is available
for every location.

Coordinates are the preferred live-weather input.

A state/city name alone may require a future geocoding layer.

Browser applications may also encounter API/network
restrictions. Therefore this module supports:

1. Direct ingestion
2. Configured API adapters
3. Cached data
4. Future server-side proxy integration

===========================================================
*/

(function (global) {
    "use strict";

    const VERSION = "1.0.0";
    const MODULE_NAME = "ROlyfeWeather";

    /*
    ===========================================================
    API CONFIGURATION
    ===========================================================
    */

    const DEFAULT_CONFIG = {

        provider: "NWS",

        baseUrl:
            "https://api.weather.gov",

        userAgent:
            "ROlyfe Relocation Intelligence Center",

        timeout:
            10000,

        cacheMinutes:
            10,

        autoRefresh:
            false,

        refreshMinutes:
            15,

        useLiveApi:
            false
    };

    /*
    ===========================================================
    WEATHER CATEGORIES
    ===========================================================
    */

    const WEATHER_FIELDS = [

        "temperature",
        "feelsLike",
        "dewpoint",
        "humidity",
        "windSpeed",
        "windDirection",
        "windGust",
        "precipitationProbability",
        "precipitationAmount",
        "snowAmount",
        "visibility",
        "pressure",
        "cloudCover",
        "weather",
        "conditions",
        "icon"
    ];

    const ALERT_SEVERITIES = [
        "Extreme",
        "Severe",
        "Moderate",
        "Minor",
        "Unknown"
    ];

    /*
    ===========================================================
    EMPTY PROFILE
    ===========================================================
    */

    const EMPTY_PROFILE = {

        status:
            "not_initialized",

        version:
            VERSION,

        module:
            MODULE_NAME,

        location: {

            country:
                "United States",

            state:
                "",

            stateName:
                "",

            county:
                "",

            city:
                "",

            zip:
                "",

            address:
                "",

            latitude:
                null,

            longitude:
                null
        },

        current: {

            available:
                false,

            temperature:
                null,

            temperatureUnit:
                "F",

            feelsLike:
                null,

            dewpoint:
                null,

            humidity:
                null,

            windSpeed:
                null,

            windDirection:
                null,

            windGust:
                null,

            visibility:
                null,

            pressure:
                null,

            cloudCover:
                null,

            conditions:
                "",

            description:
                "",

            icon:
                "",

            observedAt:
                "",

            station:
                "",

            raw:
                null
        },

        forecast: {

            daily:
                [],

            hourly:
                [],

            nextPeriod:
                null,

            next24Hours:
                [],

            next7Days:
                []
        },

        alerts: {

            active:
                [],

            count:
                0,

            extreme:
                0,

            severe:
                0,

            moderate:
                0,

            minor:
                0
        },

        offices: {

            forecastOffice:
                "",

            gridX:
                null,

            gridY:
                null,

            forecastUrl:
                "",

            hourlyForecastUrl:
                "",

            observationStationsUrl:
                "",

            zoneUrls:
                []
        },

        conditions: {

            precipitation:
                false,

            snow:
                false,

            ice:
                false,

            severeWeather:
                false,

            extremeHeat:
                false,

            extremeCold:
                false,

            highWind:
                false,

            flooding:
                false,

            tropical:
                false,

            wildfireWeather:
                false
        },

        summary: {

            current:
                "",

            forecast:
                "",

            alertSummary:
                "",

            weatherStatus:
                "unknown"
        },

        assessment: {

            currentAvailable:
                false,

            forecastAvailable:
                false,

            hourlyAvailable:
                false,

            alertsAvailable:
                false,

            dataCompleteness:
                0
        },

        signals: [],

        findings: [],

        actions: [],

        gaps: [],

        sources: [],

        metadata: {

            provider:
                "NWS",

            source:
                "",

            lastUpdated:
                "",

            retrievedAt:
                "",

            cacheExpires:
                "",

            confidence:
                "unknown"
        },

        aiContext:
            null
    };

    let state = {

        initialized:
            false,

        status:
            "not_initialized",

        config:
            {
                ...DEFAULT_CONFIG
            },

        profile:
            clone(
                EMPTY_PROFILE
            ),

        listeners: [],

        cache:
            {}
    };

    /*
    ===========================================================
    UTILITIES
    ===========================================================
    */

    function clone(value) {

        try {

            return JSON.parse(
                JSON.stringify(
                    value
                )
            );

        } catch (error) {

            return value;
        }
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

            return Number.isFinite(
                parsed
            )
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
                        "[ROlyfeWeather] Listener error:",
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
                        "rolyfe:weather:" +
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
    LOCATION
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
                    location.stateCode
                ),

            stateName:
                string(
                    location.stateName
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
                ),

            latitude:
                number(
                    location.latitude ??
                    location.lat
                ),

            longitude:
                number(
                    location.longitude ??
                    location.lon ??
                    location.lng
                )
        };
    }

    /*
    ===========================================================
    NWS POINT ENDPOINT BUILDER
    ===========================================================
    */

    function buildPointUrl(
        latitude,
        longitude
    ) {

        if (
            latitude === null ||
            longitude === null
        ) {

            return "";
        }

        return (
            state.config.baseUrl +
            "/points/" +
            encodeURIComponent(
                latitude
            ) +
            "," +
            encodeURIComponent(
                longitude
            )
        );
    }

    /*
    ===========================================================
    FETCH WITH TIMEOUT
    ===========================================================
    */

    async function fetchJson(
        url,
        options = {}
    ) {

        if (
            typeof fetch !==
            "function"
        ) {

            throw new Error(
                "Fetch is not available in this environment."
            );
        }

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
                    () => {

                        controller.abort();

                    },
                    options.timeout ||
                    state.config.timeout
                );
        }

        try {

            const response =
                await fetch(
                    url,
                    {
                        method:
                            "GET",

                        headers:
                            {
                                Accept:
                                    "application/geo+json, application/ld+json, application/json"
                            },

                        signal:
                            controller
                                ?.signal
                    }
                );

            if (
                !response.ok
            ) {

                throw new Error(
                    `Weather request failed: ${response.status} ${response.statusText}`
                );
            }

            return await response.json();

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

    /*
    ===========================================================
    POINT METADATA
    ===========================================================
    */

    async function fetchPoint(
        latitude,
        longitude
    ) {

        const url =
            buildPointUrl(
                latitude,
                longitude
            );

        if (!url) {

            throw new Error(
                "Latitude and longitude are required for live NWS lookup."
            );
        }

        return fetchJson(
            url
        );
    }

    /*
    ===========================================================
    FORECAST FETCHING
    ===========================================================
    */

    async function fetchForecast(
        pointData
    ) {

        const forecastUrl =
            pointData
                ?.properties
                ?.forecast;

        const hourlyUrl =
            pointData
                ?.properties
                ?.forecastHourly;

        const results = {

            daily:
                null,

            hourly:
                null
        };

        if (
            forecastUrl
        ) {

            results.daily =
                await fetchJson(
                    forecastUrl
                );
        }

        if (
            hourlyUrl
        ) {

            results.hourly =
                await fetchJson(
                    hourlyUrl
                );
        }

        return results;
    }

    /*
    ===========================================================
    OBSERVATION STATION
    ===========================================================
    */

    async function fetchLatestObservation(
        pointData
    ) {

        const stationsUrl =
            pointData
                ?.properties
                ?.observationStations;

        if (
            !stationsUrl
        ) {

            return null;
        }

        const stations =
            await fetchJson(
                stationsUrl
            );

        const station =
            stations
                ?.features
                ?.find(
                    item =>
                        item?.id
                );

        if (
            !station
        ) {

            return null;
        }

        const observationUrl =
            station
                ?.id +
            "/observations/latest";

        return fetchJson(
            observationUrl
        );
    }

    /*
    ===========================================================
    ALERTS
    ===========================================================
    */

    async function fetchAlerts(
        location
    ) {

        if (
            !location.state
        ) {

            return null;
        }

        const url =
            state.config.baseUrl +
            "/alerts/active?area=" +
            encodeURIComponent(
                location.state
            );

        return fetchJson(
            url
        );
    }

    /*
    ===========================================================
    CURRENT OBSERVATION NORMALIZATION
    ===========================================================
    */

    function normalizeObservation(
        data
    ) {

        const properties =
            data?.properties ||
            data ||
            {};

        const temperature =
            properties
                ?.temperature;

        const dewpoint =
            properties
                ?.dewpoint;

        const windSpeed =
            properties
                ?.windSpeed;

        const windDirection =
            properties
                ?.windDirection;

        const visibility =
            properties
                ?.visibility;

        const barometricPressure =
            properties
                ?.barometricPressure;

        return {

            available:
                true,

            temperature:
                extractValue(
                    temperature
                ),

            temperatureUnit:
                extractUnit(
                    temperature,
                    "F"
                ),

            feelsLike:
                extractValue(
                    properties
                        ?.heatIndex ||
                    properties
                        ?.windChill
                ),

            dewpoint:
                extractValue(
                    dewpoint
                ),

            humidity:
                extractValue(
                    properties
                        ?.relativeHumidity
                ),

            windSpeed:
                extractValue(
                    windSpeed
                ),

            windDirection:
                extractValue(
                    windDirection
                ),

            windGust:
                extractValue(
                    properties
                        ?.windGust
                ),

            visibility:
                extractValue(
                    visibility
                ),

            pressure:
                extractValue(
                    barometricPressure
                ),

            cloudCover:
                extractValue(
                    properties
                        ?.cloudLayers
                ),

            conditions:
                string(
                    properties
                        ?.textDescription
                ),

            description:
                string(
                    properties
                        ?.textDescription
                ),

            icon:
                string(
                    properties?.icon
                ),

            observedAt:
                string(
                    properties
                        ?.timestamp
                ),

            station:
                string(
                    data?.id ||
                    properties
                        ?.stationIdentifier
                ),

            raw:
                clone(
                    data
                )
        };
    }

    function extractValue(
        value
    ) {

        if (
            value === null ||
            value === undefined
        ) {

            return null;
        }

        if (
            typeof value ===
            "number"
        ) {

            return value;
        }

        if (
            typeof value ===
            "object"
        ) {

            if (
                typeof value.value ===
                "number"
            ) {

                return value.value;
            }

            if (
                typeof value.value ===
                "string"
            ) {

                return number(
                    value.value
                );
            }
        }

        return number(
            value
        );
    }

    function extractUnit(
        value,
        fallback
    ) {

        if (
            value &&
            typeof value ===
            "object"
        ) {

            if (
                value.unitCode
            ) {

                return String(
                    value.unitCode
                );
            }

            if (
                value.unit
            ) {

                return String(
                    value.unit
                );
            }
        }

        return fallback;
    }

    /*
    ===========================================================
    FORECAST NORMALIZATION
    ===========================================================
    */

    function normalizeForecastPeriod(
        period
    ) {

        if (!period) {
            return null;
        }

        return {

            number:
                number(
                    period.number
                ),

            name:
                string(
                    period.name
                ),

            startTime:
                string(
                    period.startTime
                ),

            endTime:
                string(
                    period.endTime
                ),

            isDaytime:
                Boolean(
                    period.isDaytime
                ),

            temperature:
                number(
                    period.temperature
                ),

            temperatureUnit:
                string(
                    period.temperatureUnit,
                    "F"
                ),

            temperatureTrend:
                string(
                    period.temperatureTrend
                ),

            probabilityOfPrecipitation:
                extractValue(
                    period
                        .probabilityOfPrecipitation
                ),

            windSpeed:
                string(
                    period.windSpeed
                ),

            windDirection:
                string(
                    period.windDirection
                ),

            shortForecast:
                string(
                    period.shortForecast
                ),

            detailedForecast:
                string(
                    period.detailedForecast
                ),

            icon:
                string(
                    period.icon
                ),

            relativeHumidity:
                extractValue(
                    period
                        .relativeHumidity
                ),

            dewpoint:
                extractValue(
                    period.dewpoint
                ),

            raw:
                clone(
                    period
                )
        };
    }

    function normalizeDailyForecast(
        data
    ) {

        const periods =
            data
                ?.properties
                ?.periods ||
            data
                ?.periods ||
            [];

        return periods.map(
            normalizeForecastPeriod
        );
    }

    function normalizeHourlyForecast(
        data
    ) {

        const periods =
            data
                ?.properties
                ?.periods ||
            data
                ?.periods ||
            [];

        return periods.map(
            normalizeForecastPeriod
        );
    }

    /*
    ===========================================================
    ALERT NORMALIZATION
    ===========================================================
    */

    function normalizeAlert(
        feature
    ) {

        const properties =
            feature?.properties ||
            feature ||
            {};

        return {

            id:
                string(
                    feature?.id ||
                    properties.id
                ),

            event:
                string(
                    properties.event
                ),

            headline:
                string(
                    properties.headline
                ),

            description:
                string(
                    properties.description
                ),

            instruction:
                string(
                    properties.instruction
                ),

            severity:
                string(
                    properties.severity,
                    "Unknown"
                ),

            certainty:
                string(
                    properties.certainty
                ),

            urgency:
                string(
                    properties.urgency
                ),

            effective:
                string(
                    properties.effective
                ),

            onset:
                string(
                    properties.onset
                ),

            expires:
                string(
                    properties.expires
                ),

            ends:
                string(
                    properties.ends
                ),

            sender:
                string(
                    properties.senderName
                ),

            areaDescription:
                string(
                    properties.areaDesc
                ),

            category:
                string(
                    properties.category
                ),

            response:
                string(
                    properties.response
                ),

            web:
                string(
                    properties.web
                ),

            raw:
                clone(
                    feature
                )
        };
    }

    function normalizeAlerts(
        data
    ) {

        const features =
            data?.features ||
            [];

        return features.map(
            normalizeAlert
        );
    }

    /*
    ===========================================================
    ALERT SUMMARY
    ===========================================================
    */

    function buildAlertSummary(
        alerts
    ) {

        const summary = {

            count:
                alerts.length,

            extreme:
                0,

            severe:
                0,

            moderate:
                0,

            minor:
                0,

            unknown:
                0
        };

        alerts.forEach(
            alert => {

                const key =
                    String(
                        alert.severity ||
                        "Unknown"
                    )
                        .toLowerCase();

                if (
                    key ===
                    "extreme"
                ) {

                    summary.extreme++;

                } else if (
                    key ===
                    "severe"
                ) {

                    summary.severe++;

                } else if (
                    key ===
                    "moderate"
                ) {

                    summary.moderate++;

                } else if (
                    key ===
                    "minor"
                ) {

                    summary.minor++;

                } else {

                    summary.unknown++;
                }
            }
        );

        return summary;
    }

    /*
    ===========================================================
    WEATHER CONDITION DETECTION
    ===========================================================
    */

    function detectConditions(
        current,
        forecast,
        alerts
    ) {

        const conditions = {

            precipitation:
                false,

            snow:
                false,

            ice:
                false,

            severeWeather:
                false,

            extremeHeat:
                false,

            extremeCold:
                false,

            highWind:
                false,

            flooding:
                false,

            tropical:
                false,

            wildfireWeather:
                false
        };

        const textParts = [];

        if (
            current
                ?.conditions
        ) {

            textParts.push(
                current.conditions
            );
        }

        forecast.forEach(
            period => {

                textParts.push(
                    period.shortForecast ||
                    ""
                );
            }
        );

        alerts.forEach(
            alert => {

                textParts.push(
                    alert.event ||
                    ""
                );
            }
        );

        const text =
            textParts
                .join(" ")
                .toLowerCase();

        if (
            /rain|showers|precipitation/
                .test(text)
        ) {

            conditions.precipitation =
                true;
        }

        if (
            /snow|blizzard|flurr/
                .test(text)
        ) {

            conditions.snow =
                true;
        }

        if (
            /ice|freezing rain|sleet/
                .test(text)
        ) {

            conditions.ice =
                true;
        }

        if (
            /severe thunderstorm|tornado|warning|severe weather/
                .test(text)
        ) {

            conditions.severeWeather =
                true;
        }

        if (
            /heat|hot|excessive heat/
                .test(text)
        ) {

            conditions.extremeHeat =
                true;
        }

        if (
            /cold|freeze|freezing/
                .test(text)
        ) {

            conditions.extremeCold =
                true;
        }

        if (
            /wind|gust|high wind/
                .test(text)
        ) {

            conditions.highWind =
                true;
        }

        if (
            /flood|flash flood/
                .test(text)
        ) {

            conditions.flooding =
                true;
        }

        if (
            /hurricane|tropical storm|tropical/
                .test(text)
        ) {

            conditions.tropical =
                true;
        }

        if (
            /fire weather|red flag|wildfire/
                .test(text)
        ) {

            conditions.wildfireWeather =
                true;
        }

        return conditions;
    }

    /*
    ===========================================================
    WEATHER SIGNALS
    ===========================================================
    */

    function buildSignals(
        profile
    ) {

        const signals = [];

        const current =
            profile.current;

        if (
            current.available
        ) {

            signals.push({

                type:
                    "current-weather",

                severity:
                    "info",

                title:
                    "Current Conditions",

                message:
                    buildCurrentSummary(
                        current
                    )
            });
        }

        if (
            profile.alerts.count > 0
        ) {

            signals.push({

                type:
                    "active-alert",

                severity:
                    profile.alerts.extreme > 0
                        ? "critical"
                        : profile.alerts.severe > 0
                            ? "high"
                            : "attention",

                title:
                    "Active Weather Alerts",

                message:
                    `${profile.alerts.count} active weather alert(s) are associated with the selected area.`
            });
        }

        if (
            profile.conditions.extremeHeat
        ) {

            signals.push({

                type:
                    "heat",

                severity:
                    "attention",

                title:
                    "Heat Signal",

                message:
                    "Current or forecast conditions include elevated heat-related language."
            });
        }

        if (
            profile.conditions.extremeCold
        ) {

            signals.push({

                type:
                    "cold",

                severity:
                    "attention",

                title:
                    "Cold Signal",

                message:
                    "Current or forecast conditions include elevated cold-related language."
            });
        }

        if (
            profile.conditions.flooding
        ) {

            signals.push({

                type:
                    "flood",

                severity:
                    "high",

                title:
                    "Flooding Weather Signal",

                message:
                    "Current weather information contains flood-related conditions or alerts."
            });
        }

        if (
            profile.conditions.tropical
        ) {

            signals.push({

                type:
                    "tropical",

                severity:
                    "high",

                title:
                    "Tropical Weather Signal",

                message:
                    "Current or forecast information contains tropical-system indicators."
            });
        }

        if (
            profile.conditions.highWind
        ) {

            signals.push({

                type:
                    "wind",

                severity:
                    "attention",

                title:
                    "Wind Signal",

                message:
                    "Current or forecast information contains elevated wind indicators."
            });
        }

        return signals;
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

        if (
            profile.alerts.extreme >
            0
        ) {

            findings.push({

                category:
                    "alerts",

                severity:
                    "critical",

                title:
                    "Extreme Weather Alert",

                detail:
                    "An active extreme-severity weather alert is present in the selected area."
            });
        }

        if (
            profile.alerts.severe >
            0
        ) {

            findings.push({

                category:
                    "alerts",

                severity:
                    "high",

                title:
                    "Severe Weather Alert",

                detail:
                    "One or more active severe weather alerts are present."
            });
        }

        if (
            profile.conditions
                .flooding
        ) {

            findings.push({

                category:
                    "flooding",

                severity:
                    "attention",

                title:
                    "Flooding Conditions",

                detail:
                    "Weather or active alerts indicate potential flooding conditions."
            });
        }

        if (
            profile.conditions
                .tropical
        ) {

            findings.push({

                category:
                    "tropical",

                severity:
                    "attention",

                title:
                    "Tropical Weather Activity",

                detail:
                    "Tropical weather information is present in the current forecast or alerts."
            });
        }

        return findings;
    }

    /*
    ===========================================================
    ACTIONS
    ===========================================================
    */

    function buildActions(
        profile
    ) {

        const actions = [];

        if (
            profile.alerts.count >
            0
        ) {

            actions.push({

                type:
                    "alert-review",

                priority:
                    profile.alerts.extreme >
                    0
                        ? "critical"
                        : profile.alerts.severe >
                          0
                            ? "high"
                            : "medium",

                title:
                    "Review Active Alerts",

                detail:
                    "Review the official alert text, affected area, timing and instructions before making location or travel decisions."
            });
        }

        if (
            profile.conditions
                .flooding
        ) {

            actions.push({

                type:
                    "risk-review",

                priority:
                    "high",

                title:
                    "Cross-Check Flood Risk",

                detail:
                    "Compare current weather conditions with the long-term flood-risk profile."
            });
        }

        if (
            profile.conditions
                .extremeHeat
        ) {

            actions.push({

                type:
                    "climate-review",

                priority:
                    "medium",

                title:
                    "Cross-Check Heat Exposure",

                detail:
                    "Compare current heat conditions with the location's long-term climate and housing characteristics."
            });
        }

        if (
            profile.conditions
                .extremeCold
        ) {

            actions.push({

                type:
                    "climate-review",

                priority:
                    "medium",

                title:
                    "Cross-Check Cold Exposure",

                detail:
                    "Compare current cold conditions with long-term winter climate and housing characteristics."
            });
        }

        if (
            !profile.assessment
                .forecastAvailable
        ) {

            actions.push({

                type:
                    "data",

                priority:
                    "high",

                title:
                    "Load Forecast Data",

                detail:
                    "Forecast data is not currently available for this location."
            });
        }

        if (
            !profile.assessment
                .alertsAvailable
        ) {

            actions.push({

                type:
                    "data",

                priority:
                    "medium",

                title:
                    "Load Weather Alerts",

                detail:
                    "Active alert information is not currently available."
            });
        }

        return actions;
    }

    /*
    ===========================================================
    SUMMARIES
    ===========================================================
    */

    function buildCurrentSummary(
        current
    ) {

        const parts = [];

        if (
            current.temperature !==
            null
        ) {

            parts.push(
                `${current.temperature}°${normalizeTemperatureUnit(current.temperatureUnit)}`
            );
        }

        if (
            current.conditions
        ) {

            parts.push(
                current.conditions
            );
        }

        if (
            current.windSpeed
        ) {

            parts.push(
                `Wind ${current.windSpeed}`
            );
        }

        return parts.join(
            " • "
        );
    }

    function normalizeTemperatureUnit(
        unit
    ) {

        const value =
            String(
                unit || "F"
            ).toUpperCase();

        if (
            value.includes("CELSIUS") ||
            value === "C"
        ) {

            return "C";
        }

        return "F";
    }

    function buildForecastSummary(
        forecast
    ) {

        if (
            !forecast.length
        ) {

            return "Forecast data is not currently available.";
        }

        const next =
            forecast[0];

        if (
            !next
        ) {

            return "Forecast data is not currently available.";
        }

        return [
            next.name,
            next.shortForecast,
            next.temperature !== null
                ? `${next.temperature}°${normalizeTemperatureUnit(next.temperatureUnit)}`
                : ""
        ]
            .filter(Boolean)
            .join(
                " • "
            );
    }

    function buildAlertSummary(
        alerts
    ) {

        if (
            !alerts.length
        ) {

            return "No active weather alerts were supplied.";
        }

        return alerts
            .slice(0, 3)
            .map(
                alert =>
                    alert.event ||
                    "Weather alert"
            )
            .join(
                " • "
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

        const currentAvailable =
            Boolean(
                profile.current
                    .available
            );

        const forecastAvailable =
            profile.forecast
                .daily.length > 0;

        const hourlyAvailable =
            profile.forecast
                .hourly.length > 0;

        const alertsAvailable =
            Array.isArray(
                profile.alerts.active
            );

        const fields = [
            currentAvailable,
            forecastAvailable,
            hourlyAvailable,
            alertsAvailable
        ];

        const available =
            fields.filter(
                Boolean
            ).length;

        return {

            currentAvailable,

            forecastAvailable,

            hourlyAvailable,

            alertsAvailable,

            dataCompleteness:
                Math.round(
                    (
                        available /
                        fields.length
                    ) * 100
                )
        };
    }

    /*
    ===========================================================
    SOURCES
    ===========================================================
    */

    function buildSources(
        profile
    ) {

        const sources = [];

        if (
            profile.offices
                .forecastUrl
        ) {

            sources.push({

                name:
                    "National Weather Service Forecast",

                type:
                    "forecast",

                url:
                    profile.offices
                        .forecastUrl
            });
        }

        if (
            profile.offices
                .hourlyForecastUrl
        ) {

            sources.push({

                name:
                    "National Weather Service Hourly Forecast",

                type:
                    "hourly",

                url:
                    profile.offices
                        .hourlyForecastUrl
            });
        }

        if (
            profile.current
                .station
        ) {

            sources.push({

                name:
                    "National Weather Service Observation Station",

                type:
                    "observation",

                station:
                    profile.current
                        .station
            });
        }

        sources.push({

            name:
                "National Weather Service",

            type:
                "provider",

            url:
                "https://www.weather.gov/"
        });

        return sources;
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

            current:
                clone(
                    profile.current
                ),

            forecast:
                clone(
                    profile.forecast
                ),

            alerts:
                clone(
                    profile.alerts
                ),

            conditions:
                clone(
                    profile.conditions
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

            actions:
                clone(
                    profile.actions
                ),

            interpretationRules: [

                "Weather represents current and near-term conditions and should not be treated as long-term climate.",

                "Active weather alerts can change rapidly.",

                "Official alert text and instructions should be reviewed directly.",

                "Current weather does not by itself establish long-term hazard risk.",

                "Forecast accuracy varies with location, forecast horizon and weather conditions.",

                "Property decisions should cross-reference weather with climate, hazard and property-level data.",

                "The NWS forecast is the primary official U.S. weather source configured for this module."
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

            current:
                clone(
                    state.profile.current
                ),

            forecast:
                clone(
                    state.profile.forecast
                ),

            alerts:
                clone(
                    state.profile.alerts
                ),

            conditions:
                clone(
                    state.profile.conditions
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

            actions:
                clone(
                    state.profile.actions
                )
        };
    }

    /*
    ===========================================================
    PROFILE BUILDER
    ===========================================================
    */

    function buildProfile(
        options = {}
    ) {

        const profile =
            clone(
                EMPTY_PROFILE
            );

        const location =
            normalizeLocation(
                options.location
            );

        profile.location =
            location;

        /*
        -------------------------------------------------------
        CURRENT
        -------------------------------------------------------
        */

        if (
            options.current
        ) {

            profile.current =
                normalizeObservation(
                    options.current
                );
        }

        /*
        -------------------------------------------------------
        FORECAST
        -------------------------------------------------------
        */

        if (
            options.forecast
        ) {

            profile.forecast.daily =
                Array.isArray(
                    options.forecast
                )
                    ? options.forecast.map(
                        normalizeForecastPeriod
                    )
                    : normalizeDailyForecast(
                        options.forecast
                    );
        }

        if (
            options.daily
        ) {

            profile.forecast.daily =
                Array.isArray(
                    options.daily
                )
                    ? options.daily.map(
                        normalizeForecastPeriod
                    )
                    : normalizeDailyForecast(
                        options.daily
                    );
        }

        if (
            options.hourly
        ) {

            profile.forecast.hourly =
                Array.isArray(
                    options.hourly
                )
                    ? options.hourly.map(
                        normalizeForecastPeriod
                    )
                    : normalizeHourlyForecast(
                        options.hourly
                    );
        }

        profile.forecast.nextPeriod =
            profile.forecast
                .daily[0] ||
            null;

        profile.forecast.next24Hours =
            profile.forecast
                .hourly
                .slice(
                    0,
                    24
                );

        profile.forecast.next7Days =
            profile.forecast
                .daily
                .slice(
                    0,
                    14
                );

        /*
        -------------------------------------------------------
        ALERTS
        -------------------------------------------------------
        */

        const alerts =
            options.alerts || [];

        profile.alerts.active =
            Array.isArray(
                alerts
            )
                ? alerts.map(
                    normalizeAlert
                )
                : normalizeAlerts(
                    alerts
                );

        const alertSummary =
            buildAlertSummary(
                profile.alerts.active
            );

        profile.alerts = {

            active:
                profile.alerts.active,

            count:
                alertSummary.count,

            extreme:
                alertSummary.extreme,

            severe:
                alertSummary.severe,

            moderate:
                alertSummary.moderate,

            minor:
                alertSummary.minor
        };

        /*
        -------------------------------------------------------
        OFFICES
        -------------------------------------------------------
        */

        if (
            options.pointData
        ) {

            profile.offices = {

                forecastOffice:
                    string(
                        options
                            .pointData
                            ?.properties
                            ?.cwa
                    ),

                gridX:
                    number(
                        options
                            .pointData
                            ?.properties
                            ?.gridX
                    ),

                gridY:
                    number(
                        options
                            .pointData
                            ?.properties
                            ?.gridY
                    ),

                forecastUrl:
                    string(
                        options
                            .pointData
                            ?.properties
                            ?.forecast
                    ),

                hourlyForecastUrl:
                    string(
                        options
                            .pointData
                            ?.properties
                            ?.forecastHourly
                    ),

                observationStationsUrl:
                    string(
                        options
                            .pointData
                            ?.properties
                            ?.observationStations
                    ),

                zoneUrls:
                    clone(
                        options
                            .pointData
                            ?.properties
                            ?.forecastZone
                            ? [
                                options
                                    .pointData
                                    .properties
                                    .forecastZone
                            ]
                            : []
                    )
            };
        }

        /*
        -------------------------------------------------------
        CONDITIONS
        -------------------------------------------------------
        */

        profile.conditions =
            detectConditions(
                profile.current,
                [
                    ...profile.forecast.daily,
                    ...profile.forecast.hourly
                        .slice(
                            0,
                            24
                        )
                ],
                profile.alerts.active
            );

        /*
        -------------------------------------------------------
        ASSESSMENT
        -------------------------------------------------------
        */

        profile.assessment =
            buildAssessment(
                profile
            );

        /*
        -------------------------------------------------------
        SIGNALS
        -------------------------------------------------------
        */

        profile.signals =
            buildSignals(
                profile
            );

        /*
        -------------------------------------------------------
        FINDINGS
        -------------------------------------------------------
        */

        profile.findings =
            buildFindings(
                profile
            );

        /*
        -------------------------------------------------------
        ACTIONS
        -------------------------------------------------------
        */

        profile.actions =
            buildActions(
                profile
            );

        /*
        -------------------------------------------------------
        SUMMARY
        -------------------------------------------------------
        */

        profile.summary = {

            current:
                buildCurrentSummary(
                    profile.current
                ),

            forecast:
                buildForecastSummary(
                    profile.forecast
                        .daily
                ),

            alertSummary:
                buildAlertSummary(
                    profile.alerts.active
                ),

            weatherStatus:
                determineWeatherStatus(
                    profile
                )
        };

        /*
        -------------------------------------------------------
        GAPS
        -------------------------------------------------------
        */

        profile.gaps =
            buildGaps(
                profile
            );

        /*
        -------------------------------------------------------
        SOURCES
        -------------------------------------------------------
        */

        profile.sources =
            buildSources(
                profile
            );

        /*
        -------------------------------------------------------
        METADATA
        -------------------------------------------------------
        */

        const now =
            new Date();

        profile.metadata = {

            provider:
                state.config.provider,

            source:
                options.source ||
                "National Weather Service / RO’Lyfe Weather Engine",

            lastUpdated:
                options.lastUpdated ||
                "",

            retrievedAt:
                now.toISOString(),

            cacheExpires:
                new Date(
                    now.getTime() +
                    state.config.cacheMinutes *
                    60000
                ).toISOString(),

            confidence:
                determineConfidence(
                    profile
                )
        };

        /*
        -------------------------------------------------------
        AI
        -------------------------------------------------------
        */

        profile.aiContext =
            buildAIContext(
                profile
            );

        profile.status =
            "ready";

        return profile;
    }

    /*
    ===========================================================
    WEATHER STATUS
    ===========================================================
    */

    function determineWeatherStatus(
        profile
    ) {

        if (
            profile.alerts.extreme >
            0
        ) {

            return "extreme_alert";
        }

        if (
            profile.alerts.severe >
            0
        ) {

            return "severe_alert";
        }

        if (
            profile.conditions
                .flooding
        ) {

            return "flooding_signal";
        }

        if (
            profile.conditions
                .tropical
        ) {

            return "tropical_signal";
        }

        if (
            profile.conditions
                .severeWeather
        ) {

            return "severe_weather_signal";
        }

        if (
            profile.current.available
        ) {

            return "normal_monitoring";
        }

        return "unknown";
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

        if (
            profile.location.latitude ===
                null ||
            profile.location.longitude ===
                null
        ) {

            gaps.push({

                field:
                    "coordinates",

                importance:
                    "high",

                reason:
                    "Latitude and longitude are required for the preferred NWS point forecast workflow."
            });
        }

        if (
            !profile.current.available
        ) {

            gaps.push({

                field:
                    "current",

                importance:
                    "medium",

                reason:
                    "Current observation data is not available."
            });
        }

        if (
            !profile.assessment
                .forecastAvailable
        ) {

            gaps.push({

                field:
                    "forecast",

                importance:
                    "high",

                reason:
                    "Forecast periods are not available."
            });
        }

        if (
            !profile.assessment
                .hourlyAvailable
        ) {

            gaps.push({

                field:
                    "hourly",

                importance:
                    "medium",

                reason:
                    "Hourly forecast data is not available."
            });
        }

        if (
            !profile.assessment
                .alertsAvailable
        ) {

            gaps.push({

                field:
                    "alerts",

                importance:
                    "high",

                reason:
                    "Active weather alert data is not available."
            });
        }

        return gaps;
    }

    /*
    ===========================================================
    CONFIDENCE
    ===========================================================
    */

    function determineConfidence(
        profile
    ) {

        const completeness =
            profile.assessment
                .dataCompleteness;

        if (
            completeness >= 100
        ) {

            return "high";
        }

        if (
            completeness >= 75
        ) {

            return "medium";
        }

        if (
            completeness >= 50
        ) {

            return "limited";
        }

        return "low";
    }

    /*
    ===========================================================
    ANALYZE INGESTED DATA
    ===========================================================
    */

    function analyze(
        options = {}
    ) {

        const profile =
            buildProfile(
                options
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

    /*
    ===========================================================
    LIVE WEATHER PIPELINE
    ===========================================================
    */

    async function fetchLive(
        options = {}
    ) {

        const location =
            normalizeLocation(
                options.location
            );

        if (
            location.latitude ===
                null ||
            location.longitude ===
                null
        ) {

            throw new Error(
                "Live weather requires latitude and longitude."
            );
        }

        state.status =
            "loading";

        emit(
            "loading",
            {
                location
            }
        );

        try {

            /*
            ---------------------------------------------------
            STEP 1
            Resolve coordinates to NWS point metadata.
            ---------------------------------------------------
            */

            const pointData =
                await fetchPoint(
                    location.latitude,
                    location.longitude
                );

            /*
            ---------------------------------------------------
            STEP 2
            Retrieve forecast + observation.

            These calls can be parallelized after the point
            response establishes the correct URLs.
            ---------------------------------------------------
            */

            const [
                forecastData,
                observationData,
                alertData
            ] =
                await Promise.all([
                    fetchForecast(
                        pointData
                    ),
                    fetchLatestObservation(
                        pointData
                    ),
                    fetchAlerts(
                        location
                    )
                ]);

            /*
            ---------------------------------------------------
            STEP 3
            Normalize everything.
            ---------------------------------------------------
            */

            const profile =
                buildProfile({

                    location,

                    pointData,

                    current:
                        observationData,

                    daily:
                        forecastData
                            ?.daily,

                    hourly:
                        forecastData
                            ?.hourly,

                    alerts:
                        normalizeAlerts(
                            alertData
                        ),

                    source:
                        "National Weather Service live API",

                    lastUpdated:
                        new Date()
                            .toISOString()
                });

            state.profile =
                profile;

            state.status =
                "ready";

            state.initialized =
                true;

            /*
            ---------------------------------------------------
            CACHE
            ---------------------------------------------------
            */

            const cacheKey =
                buildCacheKey(
                    location
                );

            state.cache[
                cacheKey
            ] = {

                timestamp:
                    Date.now(),

                profile:
                    clone(
                        profile
                    )
            };

            emit(
                "live_loaded",
                profile
            );

            return clone(
                profile
            );

        } catch (error) {

            state.status =
                "error";

            emit(
                "error",
                {
                    message:
                        error.message
                }
            );

            throw error;
        }
    }

    /*
    ===========================================================
    CACHE
    ===========================================================
    */

    function buildCacheKey(
        location
    ) {

        return [

            location.latitude,
            location.longitude,
            location.state,
            location.zip

        ]
            .filter(
                hasValue
            )
            .join(
                "|"
            );
    }

    function getCached(
        location
    ) {

        const key =
            buildCacheKey(
                normalizeLocation(
                    location
                )
            );

        const cached =
            state.cache[
                key
            ];

        if (
            !cached
        ) {

            return null;
        }

        const age =
            Date.now() -
            cached.timestamp;

        const maxAge =
            state.config.cacheMinutes *
            60 *
            1000;

        if (
            age > maxAge
        ) {

            delete state.cache[
                key
            ];

            return null;
        }

        return clone(
            cached.profile
        );
    }

    /*
    ===========================================================
    REFRESH
    ===========================================================
    */

    async function refresh(
        options = {}
    ) {

        const location =
            options.location ||
            state.profile.location;

        return fetchLive({
            ...options,
            location
        });
    }

    /*
    ===========================================================
    CONFIGURATION
    ===========================================================
    */

    function configure(
        options = {}
    ) {

        state.config = {

            ...state.config,

            ...options
        };

        return clone(
            state.config
        );
    }

    function getConfig() {

        return clone(
            state.config
        );
    }

    /*
    ===========================================================
    INITIALIZATION
    ===========================================================
    */

    function initialize(
        options = {}
    ) {

        state.initialized =
            true;

        state.status =
            "initialized";

        if (
            options.config
        ) {

            configure(
                options.config
            );
        }

        if (
            options.location ||
            options.current ||
            options.forecast ||
            options.daily ||
            options.hourly ||
            options.alerts
        ) {

            return analyze(
                options
            );
        }

        /*
        -------------------------------------------------------
        Try to inherit location from RO’Lyfe Core.
        -------------------------------------------------------
        */

        const coreLocation =
            getCoreLocation();

        if (
            coreLocation
        ) {

            state.profile =
                buildProfile({

                    location:
                        coreLocation
                });
        }

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
    CORE LOCATION INTEGRATION
    ===========================================================
    */

    function getCoreLocation() {

        try {

            const core =
                global.ROlyfeCore;

            if (!core) {
                return null;
            }

            if (
                typeof core.getLocation ===
                "function"
            ) {

                return core.getLocation();
            }

            if (
                typeof core.getState ===
                "function"
            ) {

                const coreState =
                    core.getState();

                return (
                    coreState?.location ||
                    coreState?.selectedLocation ||
                    null
                );
            }

            if (
                typeof core.getAnalysis ===
                "function"
            ) {

                const analysis =
                    core.getAnalysis();

                return (
                    analysis?.location ||
                    analysis?.data?.location ||
                    null
                );
            }

        } catch (error) {

            console.warn(
                "[ROlyfeWeather] Core location lookup failed:",
                error
            );
        }

        return null;
    }

    /*
    ===========================================================
    DIRECT INGESTION
    ===========================================================
    */

    function ingestCurrent(
        data,
        options = {}
    ) {

        return analyze({

            ...options,

            current:
                data,

            source:
                options.source ||
                "weather observation ingestion"
        });
    }

    function ingestForecast(
        data,
        options = {}
    ) {

        return analyze({

            ...options,

            forecast:
                data,

            source:
                options.source ||
                "weather forecast ingestion"
        });
    }

    function ingestAlerts(
        data,
        options = {}
    ) {

        return analyze({

            ...options,

            alerts:
                data,

            source:
                options.source ||
                "weather alert ingestion"
        });
    }

    /*
    ===========================================================
    WEATHER VS CLIMATE HELPER
    ===========================================================
    */

    function buildClimateBridge() {

        let climate =
            null;

        try {

            if (
                global.ROlyfeClimate
            ) {

                if (
                    typeof global
                        .ROlyfeClimate
                        .getProfile ===
                    "function"
                ) {

                    climate =
                        global
                            .ROlyfeClimate
                            .getProfile();
                }
            }

        } catch (error) {

            climate =
                null;
        }

        return {

            weather:
                clone(
                    state.profile
                ),

            climate:
                clone(
                    climate
                ),

            interpretation:
                "Weather represents current or forecast conditions. Climate represents longer-term patterns. The two datasets should be analyzed together but not treated as interchangeable."
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

    function getCurrent() {

        return clone(
            state.profile
                .current
        );
    }

    function getForecast() {

        return clone(
            state.profile
                .forecast
        );
    }

    function getDailyForecast() {

        return clone(
            state.profile
                .forecast
                .daily
        );
    }

    function getHourlyForecast() {

        return clone(
            state.profile
                .forecast
                .hourly
        );
    }

    function getAlerts() {

        return clone(
            state.profile
                .alerts
                .active
        );
    }

    function getConditions() {

        return clone(
            state.profile
                .conditions
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

    function getActions() {

        return clone(
            state.profile
                .actions
        );
    }

    function getGaps() {

        return clone(
            state.profile
                .gaps
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

        state.cache =
            {};

        emit(
            "reset",
            state.profile
        );

        return getState();
    }

    /*
    ===========================================================
    SUBSCRIBE
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

    /*
    ===========================================================
    PUBLIC API
    ===========================================================
    */

    const API = {

        VERSION,

        MODULE_NAME,

        WEATHER_FIELDS:
            clone(
                WEATHER_FIELDS
            ),

        ALERT_SEVERITIES:
            clone(
                ALERT_SEVERITIES
            ),

        initialize,

        reset,

        configure,

        getConfig,

        analyze,

        fetchLive,

        refresh,

        fetchPoint,

        fetchForecast,

        fetchLatestObservation,

        fetchAlerts,

        ingestCurrent,

        ingestForecast,

        ingestAlerts,

        getCached,

        getState,

        getStatus,

        getProfile,

        getCurrent,

        getForecast,

        getDailyForecast,

        getHourlyForecast,

        getAlerts,

        getConditions,

        getSignals,

        getFindings,

        getActions,

        getGaps,

        getSummary,

        getAIContext,

        buildAIContext,

        buildSharedContext,

        buildClimateBridge,

        serialize,

        subscribe
    };

    /*
    ===========================================================
    GLOBAL EXPORT
    ===========================================================
    */

    global.ROlyfeWeather =
        API;

    global.ROLYFE_WEATHER =
        API;

    /*
    ===========================================================
    AUTO INITIALIZATION
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
                            "[ROlyfeWeather] Initialization warning:",
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
                    "[ROlyfeWeather] Initialization warning:",
                    error
                );
            }
        }
    }

})(typeof window !== "undefined"
    ? window
    : globalThis);
