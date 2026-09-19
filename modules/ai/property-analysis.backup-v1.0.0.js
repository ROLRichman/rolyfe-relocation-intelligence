/*
================================================================
RO'Lyfe AI Property Analysis Engine™
FILE:
    /modules/ai/property-analysis.js

VERSION:
    1.0.0

PURPOSE:
    Property-level intelligence aggregation layer for the
    RO'Lyfe AI ecosystem.

ARCHITECTURE:

    PROPERTY
       ↓
    PROPERTY PROFILE
       ↓
    LOCATION CONTEXT
       ↓
    HOUSING / CLIMATE / WEATHER / RISK
       ↓
    BUSINESS / INCENTIVES / OPPORTUNITY
       ↓
    DEAL FUNDAMENTALS
       ↓
    PROPERTY SIGNALS
       ↓
    FINDINGS
       ↓
    TRADEOFFS
       ↓
    DATA GAPS
       ↓
    ACTIONS
       ↓
    AI CONTEXT

IMPORTANT:
    This module does NOT replace the RO'Lyfe Real Estate
    Command Center deal calculator.

    It is designed to:
      - collect property facts
      - normalize deal inputs
      - connect property to location intelligence
      - identify analytical signals
      - identify missing information
      - build AI-ready property context
      - support future ARV / MAO / funding integrations

GUARDRAILS:
    - Never invent property facts.
    - Never guarantee value.
    - Never guarantee financing.
    - Never guarantee rent.
    - Never guarantee incentives.
    - Never represent a property risk as verified unless
      the source data says so.
    - Distinguish estimated, supplied, calculated and
      externally verified information.
================================================================
*/

(function (window) {

    "use strict";

    /*
    ============================================================
    MODULE
    ============================================================
    */

    const MODULE_NAME = "ROlyfePropertyAnalysis";
    const VERSION = "1.0.0";

    /*
    ============================================================
    CONFIGURATION
    ============================================================
    */

    const DEFAULT_CONFIG = {

        autoInitialize: true,

        persist: true,

        storageKey:
            "rolyfe_property_analysis_v1",

        maxSignals: 40,

        maxFindings: 40,

        maxTradeoffs: 30,

        maxGaps: 30,

        maxActions: 30,

        maxComparableProperties: 25,

        maxSources: 40,

        currency:
            "USD",

        defaultHoldingMonths:
            6,

        defaultSellingCostRate:
            0.08,

        defaultContingencyRate:
            0.10

    };

    let config =
        Object.assign(
            {},
            DEFAULT_CONFIG
        );

    /*
    ============================================================
    STATE
    ============================================================
    */

    const EMPTY_STATE = {

        status:
            "idle",

        initialized:
            false,

        property:
            null,

        location:
            null,

        preferences:
            {},

        sourceData: {

            property:
                null,

            location:
                null,

            housing:
                null,

            climate:
                null,

            weather:
                null,

            risk:
                null,

            incentives:
                null,

            business:
                null,

            opportunity:
                null,

            core:
                null

        },

        financial:
            {},

        market:
            {},

        physical:
            {},

        risk:
            {},

        analysis: {

            property:
                {},

            location:
                {},

            financial:
                {},

            market:
                {},

            risk:
                {},

            opportunity:
                {}

        },

        signals:
            [],

        findings:
            [],

        tradeoffs:
            [],

        gaps:
            [],

        actions:
            [],

        sources:
            [],

        summary:
            null,

        aiContext:
            null,

        metadata: {

            version:
                VERSION,

            createdAt:
                null,

            updatedAt:
                null,

            sourceCount:
                0

        }

    };

    let state =
        clone(EMPTY_STATE);

    /*
    ============================================================
    EVENTS
    ============================================================
    */

    const listeners = {};

    function subscribe(
        eventName,
        callback
    ) {

        if (
            typeof callback !==
            "function"
        ) {
            return function () {};
        }

        if (
            !listeners[eventName]
        ) {
            listeners[eventName] = [];
        }

        listeners[eventName].push(
            callback
        );

        return function unsubscribe() {

            listeners[eventName] =
                (
                    listeners[eventName] ||
                    []
                ).filter(
                    function (fn) {
                        return fn !== callback;
                    }
                );

        };
    }


    function emit(
        eventName,
        payload
    ) {

        (
            listeners[eventName] ||
            []
        ).forEach(
            function (callback) {

                try {

                    callback(
                        payload,
                        state
                    );

                } catch (error) {

                    console.error(
                        "[" +
                        MODULE_NAME +
                        "] event error:",
                        error
                    );

                }

            }
        );
    }


    /*
    ============================================================
    BASIC HELPERS
    ============================================================
    */

    function clone(value) {

        if (
            value === null ||
            value === undefined
        ) {
            return value;
        }

        try {

            return JSON.parse(
                JSON.stringify(value)
            );

        } catch (error) {

            return value;
        }
    }


    function isObject(value) {

        return (
            value !== null &&
            typeof value === "object" &&
            !Array.isArray(value)
        );
    }


    function hasValue(value) {

        return !(
            value === undefined ||
            value === null ||
            value === ""
        );
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

            const cleaned =
                value
                    .replace(
                        /[$,%\s,]/g,
                        ""
                    );

            const parsed =
                Number(cleaned);

            return Number.isFinite(parsed)
                ? parsed
                : null;
        }

        return null;
    }


    function firstValue(
        object,
        keys
    ) {

        if (!object) {
            return null;
        }

        for (
            let i = 0;
            i < keys.length;
            i++
        ) {

            const value =
                object[keys[i]];

            if (
                hasValue(value)
            ) {
                return value;
            }

        }

        return null;
    }


    function cap(
        array,
        maximum
    ) {

        return Array.isArray(array)
            ? array.slice(0, maximum)
            : [];
    }


    function unique(
        array
    ) {

        const seen =
            new Set();

        return (
            Array.isArray(array)
                ? array
                : []
        ).filter(
            function (item) {

                const key =
                    typeof item === "string"
                        ? item
                        : JSON.stringify(item);

                if (
                    seen.has(key)
                ) {
                    return false;
                }

                seen.add(key);

                return true;
            }
        );
    }


    /*
    ============================================================
    MODULE ACCESS
    ============================================================
    */

    function getModule(
        names
    ) {

        const candidates =
            Array.isArray(names)
                ? names
                : [names];

        for (
            let i = 0;
            i < candidates.length;
            i++
        ) {

            const module =
                window[candidates[i]];

            if (module) {
                return module;
            }

        }

        return null;
    }


    function callModule(
        names,
        method,
        fallback
    ) {

        const module =
            getModule(names);

        if (
            module &&
            typeof module[method] ===
                "function"
        ) {

            try {

                return module[method]();

            } catch (error) {

                console.warn(
                    "[" +
                    MODULE_NAME +
                    "] module call failed:",
                    method,
                    error
                );

            }

        }

        return fallback;
    }


    /*
    ============================================================
    NORMALIZE PROPERTY
    ============================================================
    */

    function normalizeProperty(
        input
    ) {

        input =
            isObject(input)
                ? clone(input)
                : {};

        const property = {

            id:
                firstValue(
                    input,
                    [
                        "id",
                        "propertyId",
                        "property_id",
                        "listingId",
                        "listing_id"
                    ]
                ),

            address:
                firstValue(
                    input,
                    [
                        "address",
                        "street",
                        "streetAddress",
                        "propertyAddress"
                    ]
                ),

            city:
                firstValue(
                    input,
                    [
                        "city"
                    ]
                ),

            state:
                firstValue(
                    input,
                    [
                        "state",
                        "stateCode"
                    ]
                ),

            zip:
                firstValue(
                    input,
                    [
                        "zip",
                        "zipcode",
                        "postalCode"
                    ]
                ),

            county:
                firstValue(
                    input,
                    [
                        "county"
                    ]
                ),

            country:
                firstValue(
                    input,
                    [
                        "country"
                    ]
                ) || "USA",

            propertyType:
                firstValue(
                    input,
                    [
                        "propertyType",
                        "property_type",
                        "type",
                        "assetType"
                    ]
                ),

            status:
                firstValue(
                    input,
                    [
                        "status",
                        "listingStatus",
                        "dealStatus"
                    ]
                ),

            bedrooms:
                number(
                    firstValue(
                        input,
                        [
                            "bedrooms",
                            "beds",
                            "br"
                        ]
                    )
                ),

            bathrooms:
                number(
                    firstValue(
                        input,
                        [
                            "bathrooms",
                            "baths",
                            "ba"
                        ]
                    )
                ),

            squareFeet:
                number(
                    firstValue(
                        input,
                        [
                            "squareFeet",
                            "sqft",
                            "livingArea",
                            "buildingSqFt"
                        ]
                    )
                ),

            lotSize:
                number(
                    firstValue(
                        input,
                        [
                            "lotSize",
                            "lotSquareFeet",
                            "lot_sqft"
                        ]
                    )
                ),

            yearBuilt:
                number(
                    firstValue(
                        input,
                        [
                            "yearBuilt",
                            "year_built"
                        ]
                    )
                ),

            askingPrice:
                number(
                    firstValue(
                        input,
                        [
                            "askingPrice",
                            "listPrice",
                            "listingPrice",
                            "price"
                        ]
                    )
                ),

            purchasePrice:
                number(
                    firstValue(
                        input,
                        [
                            "purchasePrice",
                            "contractPrice",
                            "acquisitionPrice",
                            "buyPrice"
                        ]
                    )
                ),

            currentValue:
                number(
                    firstValue(
                        input,
                        [
                            "currentValue",
                            "estimatedValue",
                            "marketValue"
                        ]
                    )
                ),

            arv:
                number(
                    firstValue(
                        input,
                        [
                            "arv",
                            "afterRepairValue",
                            "after_repair_value"
                        ]
                    )
                ),

            rent:
                number(
                    firstValue(
                        input,
                        [
                            "rent",
                            "monthlyRent",
                            "marketRent",
                            "estimatedRent"
                        ]
                    )
                ),

            annualTaxes:
                number(
                    firstValue(
                        input,
                        [
                            "annualTaxes",
                            "propertyTaxes",
                            "taxes"
                        ]
                    )
                ),

            insurance:
                number(
                    firstValue(
                        input,
                        [
                            "insurance",
                            "annualInsurance"
                        ]
                    )
                ),

            hoa:
                number(
                    firstValue(
                        input,
                        [
                            "hoa",
                            "monthlyHoa",
                            "monthlyHOA"
                        ]
                    )
                ),

            rehab:
                number(
                    firstValue(
                        input,
                        [
                            "rehab",
                            "rehabCost",
                            "renovationCost",
                            "repairCost"
                        ]
                    )
                ),

            holdingMonths:
                number(
                    firstValue(
                        input,
                        [
                            "holdingMonths",
                            "holdMonths"
                        ]
                    )
                ),

            financingCost:
                number(
                    firstValue(
                        input,
                        [
                            "financingCost",
                            "financeCost",
                            "loanCost"
                        ]
                    )
                ),

            closingCosts:
                number(
                    firstValue(
                        input,
                        [
                            "closingCosts",
                            "buyerClosingCosts"
                        ]
                    )
                ),

            sellingCosts:
                number(
                    firstValue(
                        input,
                        [
                            "sellingCosts",
                            "saleCosts",
                            "dispositionCosts"
                        ]
                    )
                ),

            assignmentFee:
                number(
                    firstValue(
                        input,
                        [
                            "assignmentFee",
                            "assignment",
                            "wholesaleFee"
                        ]
                    )
                ),

            downPayment:
                number(
                    firstValue(
                        input,
                        [
                            "downPayment",
                            "down",
                            "cashDown"
                        ]
                    )
                ),

            interestRate:
                number(
                    firstValue(
                        input,
                        [
                            "interestRate",
                            "interest",
                            "rate"
                        ]
                    )
                ),

            loanAmount:
                number(
                    firstValue(
                        input,
                        [
                            "loanAmount",
                            "loan",
                            "financingAmount"
                        ]
                    )
                ),

            source:
                firstValue(
                    input,
                    [
                        "source",
                        "listingSource",
                        "dataSource"
                    ]
                ),

            url:
                firstValue(
                    input,
                    [
                        "url",
                        "listingUrl",
                        "propertyUrl"
                    ]
                ),

            latitude:
                number(
                    firstValue(
                        input,
                        [
                            "latitude",
                            "lat"
                        ]
                    )
                ),

            longitude:
                number(
                    firstValue(
                        input,
                        [
                            "longitude",
                            "lng",
                            "lon"
                        ]
                    )
                ),

            description:
                firstValue(
                    input,
                    [
                        "description",
                        "remarks",
                        "propertyDescription"
                    ]
                ),

            raw:
                input

        };

        property.location =
            normalizeLocation(
                input.location ||
                property
            );

        return property;
    }


    /*
    ============================================================
    NORMALIZE LOCATION
    ============================================================
    */

    function normalizeLocation(
        input
    ) {

        input =
            isObject(input)
                ? input
                : {};

        return {

            name:
                firstValue(
                    input,
                    [
                        "name",
                        "locationName"
                    ]
                ),

            type:
                firstValue(
                    input,
                    [
                        "type",
                        "locationType",
                        "geography"
                    ]
                ) || "property",

            address:
                firstValue(
                    input,
                    [
                        "address",
                        "street",
                        "streetAddress"
                    ]
                ),

            city:
                firstValue(
                    input,
                    [
                        "city"
                    ]
                ),

            county:
                firstValue(
                    input,
                    [
                        "county"
                    ]
                ),

            state:
                firstValue(
                    input,
                    [
                        "state",
                        "stateCode"
                    ]
                ),

            zip:
                firstValue(
                    input,
                    [
                        "zip",
                        "zipcode",
                        "postalCode"
                    ]
                ),

            latitude:
                number(
                    firstValue(
                        input,
                        [
                            "latitude",
                            "lat"
                        ]
                    )
                ),

            longitude:
                number(
                    firstValue(
                        input,
                        [
                            "longitude",
                            "lng",
                            "lon"
                        ]
                    )
                )

        };
    }


    /*
    ============================================================
    LOCATION FROM PROPERTY
    ============================================================
    */

    function buildPropertyLocation(
        property
    ) {

        if (!property) {
            return null;
        }

        return normalizeLocation({

            name:
                property.city &&
                property.state
                    ? property.city +
                      ", " +
                      property.state
                    : property.address,

            type:
                "property",

            address:
                property.address,

            city:
                property.city,

            county:
                property.county,

            state:
                property.state,

            zip:
                property.zip,

            latitude:
                property.latitude,

            longitude:
                property.longitude

        });
    }


    /*
    ============================================================
    DEAL / FINANCIAL NORMALIZATION
    ============================================================
    */

    function buildFinancialProfile(
        property
    ) {

        const purchase =
            number(
                property.purchasePrice
            ) ||
            number(
                property.askingPrice
            );

        const rehab =
            number(property.rehab) || 0;

        const closing =
            number(property.closingCosts) || 0;

        const financing =
            number(property.financingCost) || 0;

        const selling =
            number(property.sellingCosts) || 0;

        const assignment =
            number(property.assignmentFee) || 0;

        const arv =
            number(property.arv);

        const holdingMonths =
            number(
                property.holdingMonths
            ) ||
            config.defaultHoldingMonths;

        const holdingCost =
            calculateHoldingCost(
                property,
                holdingMonths
            );

        const totalProjectCost =
            sumNumbers([
                purchase,
                rehab,
                closing,
                financing,
                holdingCost
            ]);

        const totalBasis =
            totalProjectCost;

        const estimatedProfit =
            arv !== null
                ? arv -
                  totalBasis -
                  selling -
                  assignment
                : null;

        const profitMargin =
            arv &&
            estimatedProfit !== null
                ? estimatedProfit /
                  arv
                : null;

        const equitySpread =
            arv !== null &&
            purchase !== null
                ? arv - purchase
                : null;

        const purchaseToARV =
            arv &&
            purchase !== null
                ? purchase / arv
                : null;

        const rehabToARV =
            arv &&
            rehab
                ? rehab / arv
                : null;

        return {

            purchasePrice:
                purchase,

            askingPrice:
                property.askingPrice,

            rehab:
                rehab,

            closingCosts:
                closing,

            financingCost:
                financing,

            holdingCost:
                holdingCost,

            sellingCosts:
                selling,

            assignmentFee:
                assignment,

            holdingMonths:
                holdingMonths,

            arv:
                arv,

            totalProjectCost:
                totalProjectCost,

            totalBasis:
                totalBasis,

            estimatedProfit:
                estimatedProfit,

            profitMargin:
                profitMargin,

            equitySpread:
                equitySpread,

            purchaseToARV:
                purchaseToARV,

            rehabToARV:
                rehabToARV,

            cashFlowInputs: {

                monthlyRent:
                    property.rent,

                annualTaxes:
                    property.annualTaxes,

                annualInsurance:
                    property.insurance,

                monthlyHOA:
                    property.hoa

            }

        };
    }


    function calculateHoldingCost(
        property,
        months
    ) {

        const supplied =
            number(
                property.holdingCost
            );

        if (
            supplied !== null
        ) {
            return supplied;
        }

        const monthlyRent =
            number(property.rent);

        const annualTaxes =
            number(
                property.annualTaxes
            );

        const annualInsurance =
            number(
                property.insurance
            );

        const monthlyHOA =
            number(property.hoa);

        const monthlyTax =
            annualTaxes !== null
                ? annualTaxes / 12
                : 0;

        const monthlyInsurance =
            annualInsurance !== null
                ? annualInsurance / 12
                : 0;

        const knownMonthlyCost =
            monthlyTax +
            monthlyInsurance +
            (monthlyHOA || 0);

        if (
            knownMonthlyCost <= 0
        ) {
            return 0;
        }

        return (
            knownMonthlyCost *
            months
        );
    }


    function sumNumbers(
        values
    ) {

        return (
            values || []
        ).reduce(
            function (
                total,
                value
            ) {

                return total +
                    (
                        number(value) || 0
                    );

            },
            0
        );
    }


    /*
    ============================================================
    MODULE DATA COLLECTION
    ============================================================
    */

    function collectLocationData() {

        return callModule(
            [
                "ROlyfeLocationEngine",
                "ROLYFE_LOCATION_ENGINE"
            ],
            "getProfile",
            callModule(
                [
                    "ROlyfeCore",
                    "ROLYFE_CORE"
                ],
                "getLocation",
                null
            )
        );
    }


    function collectHousingData() {

        return callModule(
            [
                "ROlyfeHousing",
                "ROLYFE_HOUSING"
            ],
            "getProfile",
            null
        );
    }


    function collectClimateData() {

        return callModule(
            [
                "ROlyfeClimate",
                "ROLYFE_CLIMATE"
            ],
            "getProfile",
            null
        );
    }


    function collectWeatherData() {

        return callModule(
            [
                "ROlyfeWeather",
                "ROLYFE_WEATHER"
            ],
            "getProfile",
            null
        );
    }


    function collectRiskData() {

        return callModule(
            [
                "ROlyfeRisk",
                "ROLYFE_RISK"
            ],
            "getProfile",
            null
        );
    }


    function collectIncentiveData() {

        return callModule(
            [
                "ROlyfeIncentives",
                "ROLYFE_INCENTIVES"
            ],
            "getProfile",
            null
        );
    }


    function collectBusinessData() {

        return callModule(
            [
                "ROlyfeBusiness",
                "ROLYFE_BUSINESS"
            ],
            "getProfile",
            null
        );
    }


    function collectOpportunityData() {

        return callModule(
            [
                "ROlyfeOpportunityEngine",
                "ROLYFE_OPPORTUNITY_ENGINE"
            ],
            "getProfile",
            callModule(
                [
                    "ROlyfeOpportunityEngine",
                    "ROLYFE_OPPORTUNITY_ENGINE"
                ],
                "getAnalysis",
                null
            )
        );
    }


    function collectCoreData() {

        return callModule(
            [
                "ROlyfeCore",
                "ROLYFE_CORE"
            ],
            "buildSharedContext",
            callModule(
                [
                    "ROlyfeCore",
                    "ROLYFE_CORE"
                ],
                "getAIContext",
                null
            )
        );
    }


    /*
    ============================================================
    INGEST PROPERTY DATA
    ============================================================
    */

    function ingestProperty(
        property
    ) {

        state.property =
            normalizeProperty(
                property
            );

        state.location =
            state.property.location ||
            buildPropertyLocation(
                state.property
            );

        state.sourceData.property =
            clone(property);

        state.financial =
            buildFinancialProfile(
                state.property
            );

        state.physical = {

            bedrooms:
                state.property.bedrooms,

            bathrooms:
                state.property.bathrooms,

            squareFeet:
                state.property.squareFeet,

            lotSize:
                state.property.lotSize,

            yearBuilt:
                state.property.yearBuilt,

            propertyType:
                state.property.propertyType

        };

        state.status =
            "property_loaded";

        state.metadata.updatedAt =
            new Date().toISOString();

        emit(
            "propertyLoaded",
            state.property
        );

        persist();

        return getProperty();
    }


    /*
    ============================================================
    LOCATION CONTEXT
    ============================================================
    */

    function collectContext() {

        state.sourceData.location =
            collectLocationData();

        state.sourceData.housing =
            collectHousingData();

        state.sourceData.climate =
            collectClimateData();

        state.sourceData.weather =
            collectWeatherData();

        state.sourceData.risk =
            collectRiskData();

        state.sourceData.incentives =
            collectIncentiveData();

        state.sourceData.business =
            collectBusinessData();

        state.sourceData.opportunity =
            collectOpportunityData();

        state.sourceData.core =
            collectCoreData();

        return state.sourceData;
    }


    /*
    ============================================================
    SIGNAL ENGINE
    ============================================================
    */

    function addSignal(
        domain,
        type,
        message,
        value,
        source
    ) {

        state.signals.push({

            id:
                "signal_" +
                (
                    state.signals.length +
                    1
                ),

            domain:
                domain,

            type:
                type,

            message:
                message,

            value:
                value !== undefined
                    ? value
                    : null,

            source:
                source || "RO'Lyfe",

            createdAt:
                new Date().toISOString()

        });
    }


    function analyzePropertySignals() {

        const property =
            state.property;

        if (!property) {
            return;
        }

        if (
            property.squareFeet
        ) {

            addSignal(
                "property",
                "physical",
                "Property size is available for analysis.",
                property.squareFeet,
                "property input"
            );

        } else {

            addSignal(
                "property",
                "data_gap",
                "Property square footage is not supplied.",
                null,
                "property input"
            );
        }


        if (
            property.yearBuilt
        ) {

            const currentYear =
                new Date().getFullYear();

            const age =
                currentYear -
                property.yearBuilt;

            addSignal(
                "property",
                age >= 75
                    ? "age"
                    : "physical",
                "Property age can affect inspection, maintenance and renovation analysis.",
                age,
                "property input"
            );

        }


        if (
            property.bedrooms !== null &&
            property.bathrooms !== null
        ) {

            addSignal(
                "property",
                "configuration",
                "Bedroom and bathroom configuration is available.",
                {
                    bedrooms:
                        property.bedrooms,

                    bathrooms:
                        property.bathrooms
                },
                "property input"
            );

        }


        if (
            property.propertyType
        ) {

            addSignal(
                "property",
                "asset_type",
                "Property type has been identified.",
                property.propertyType,
                "property input"
            );

        } else {

            addSignal(
                "property",
                "data_gap",
                "Property type is missing.",
                null,
                "property input"
            );
        }
    }


    /*
    ============================================================
    FINANCIAL SIGNALS
    ============================================================
    */

    function analyzeFinancialSignals() {

        const financial =
            state.financial;

        if (
            financial.purchasePrice !==
                null
        ) {

            addSignal(
                "financial",
                "purchase_price",
                "Purchase basis is available for deal analysis.",
                financial.purchasePrice,
                "property input"
            );

        } else {

            addSignal(
                "financial",
                "data_gap",
                "Purchase price is missing.",
                null,
                "property input"
            );
        }


        if (
            financial.arv !== null
        ) {

            addSignal(
                "financial",
                "arv",
                "An after-repair value has been supplied.",
                financial.arv,
                "property input"
            );

        } else {

            addSignal(
                "financial",
                "data_gap",
                "ARV is not supplied. Any profit analysis remains incomplete.",
                null,
                "property input"
            );
        }


        if (
            financial.rehab > 0
        ) {

            addSignal(
                "financial",
                "rehab",
                "Rehabilitation cost is included in the analysis.",
                financial.rehab,
                "property input"
            );

        }


        if (
            financial.totalProjectCost >
                0
        ) {

            addSignal(
                "financial",
                "basis",
                "Total known project basis has been calculated.",
                financial.totalProjectCost,
                "RO'Lyfe calculation"
            );

        }


        if (
            financial.estimatedProfit !==
                null
        ) {

            addSignal(
                "financial",
                financial.estimatedProfit >= 0
                    ? "positive_spread"
                    : "negative_spread",
                financial.estimatedProfit >= 0
                    ? "Supplied inputs produce a positive estimated spread before unmodeled costs."
                    : "Supplied inputs produce a negative estimated spread before unmodeled costs.",
                financial.estimatedProfit,
                "RO'Lyfe calculation"
            );

        }


        if (
            financial.purchaseToARV !==
                null
        ) {

            addSignal(
                "financial",
                "purchase_to_arv",
                "Purchase price has been compared with supplied ARV.",
                financial.purchaseToARV,
                "RO'Lyfe calculation"
            );
        }
    }


    /*
    ============================================================
    HOUSING SIGNALS
    ============================================================
    */

    function analyzeHousingSignals() {

        const housing =
            state.sourceData.housing;

        if (!housing) {

            addSignal(
                "housing",
                "data_gap",
                "Housing market context is not currently available.",
                null,
                "RO'Lyfe Housing"
            );

            return;
        }

        const profile =
            housing.profile ||
            housing;

        const medianHomePrice =
            number(
                firstValue(
                    profile,
                    [
                        "medianHomePrice",
                        "median_home_price"
                    ]
                )
            );

        const medianRent =
            number(
                firstValue(
                    profile,
                    [
                        "medianRent",
                        "median_rent"
                    ]
                )
            );

        if (
            medianHomePrice !== null
        ) {

            addSignal(
                "housing",
                "market",
                "Location housing-price context is available.",
                medianHomePrice,
                "RO'Lyfe Housing"
            );
        }

        if (
            medianRent !== null
        ) {

            addSignal(
                "housing",
                "rental",
                "Location rental-price context is available.",
                medianRent,
                "RO'Lyfe Housing"
            );
        }
    }


    /*
    ============================================================
    CLIMATE SIGNALS
    ============================================================
    */

    function analyzeClimateSignals() {

        const climate =
            state.sourceData.climate;

        if (!climate) {

            addSignal(
                "climate",
                "data_gap",
                "Long-term climate context is not currently available.",
                null,
                "RO'Lyfe Climate"
            );

            return;
        }

        const signals =
            climate.signals ||
            climate.profile?.signals ||
            [];

        if (
            Array.isArray(signals)
        ) {

            signals
                .slice(
                    0,
                    8
                )
                .forEach(
                    function (signal) {

                        addSignal(
                            "climate",
                            "climate_signal",
                            signal.message ||
                            signal.description ||
                            String(signal),
                            signal.value,
                            "RO'Lyfe Climate"
                        );

                    }
                );
        }
    }


    /*
    ============================================================
    WEATHER SIGNALS
    ============================================================
    */

    function analyzeWeatherSignals() {

        const weather =
            state.sourceData.weather;

        if (!weather) {

            addSignal(
                "weather",
                "data_gap",
                "Current weather context is not available.",
                null,
                "RO'Lyfe Weather"
            );

            return;
        }

        const current =
            weather.current ||
            weather.profile?.current;

        if (
            current
        ) {

            addSignal(
                "weather",
                "current_conditions",
                "Current weather observations are available for the location.",
                current,
                "NWS"
            );
        }

        const alerts =
            weather.alerts ||
            weather.profile?.alerts ||
            [];

        if (
            Array.isArray(alerts) &&
            alerts.length
        ) {

            addSignal(
                "weather",
                "active_alerts",
                "Active weather alert data is present and should be reviewed before time-sensitive property activity.",
                alerts.length,
                "NWS"
            );
        }
    }


    /*
    ============================================================
    RISK SIGNALS
    ============================================================
    */

    function analyzeRiskSignals() {

        const risk =
            state.sourceData.risk;

        if (!risk) {

            addSignal(
                "risk",
                "data_gap",
                "Property/location hazard analysis is not currently available.",
                null,
                "RO'Lyfe Risk"
            );

            return;
        }

        const profile =
            risk.profile ||
            risk;

        const signals =
            profile.signals ||
            [];

        if (
            Array.isArray(signals)
        ) {

            signals
                .slice(
                    0,
                    12
                )
                .forEach(
                    function (signal) {

                        addSignal(
                            "risk",
                            signal.type ||
                            "hazard",
                            signal.message ||
                            signal.description ||
                            String(signal),
                            signal.value,
                            "RO'Lyfe Risk"
                        );

                    }
                );
        }

        const hazards =
            profile.hazards ||
            risk.hazards;

        if (
            hazards
        ) {

            addSignal(
                "risk",
                "hazard_context",
                "Hazard context has been supplied by the risk intelligence layer.",
                hazards,
                "RO'Lyfe Risk"
            );
        }
    }


    /*
    ============================================================
    BUSINESS / INCENTIVE SIGNALS
    ============================================================
    */

    function analyzeOpportunitySignals() {

        const business =
            state.sourceData.business;

        if (
            business
        ) {

            const matches =
                business.matches ||
                business.profile?.matches ||
                [];

            if (
                Array.isArray(matches) &&
                matches.length
            ) {

                addSignal(
                    "business",
                    "program_match",
                    "Business-program matches are available for the property's location.",
                    matches.length,
                    "RO'Lyfe Business"
                );
            }

        } else {

            addSignal(
                "business",
                "data_gap",
                "Business intelligence is not currently available.",
                null,
                "RO'Lyfe Business"
            );
        }


        const incentives =
            state.sourceData.incentives;

        if (
            incentives
        ) {

            const matches =
                incentives.matches ||
                incentives.profile?.matches ||
                [];

            if (
                Array.isArray(matches) &&
                matches.length
            ) {

                addSignal(
                    "incentives",
                    "program_match",
                    "Location incentive matches are available for further eligibility review.",
                    matches.length,
                    "RO'Lyfe Incentives"
                );
            }

        } else {

            addSignal(
                "incentives",
                "data_gap",
                "Incentive intelligence is not currently available.",
                null,
                "RO'Lyfe Incentives"
            );
        }
    }


    /*
    ============================================================
    MASTER SIGNAL ANALYSIS
    ============================================================
    */

    function analyzeSignals() {

        state.signals = [];

        analyzePropertySignals();

        analyzeFinancialSignals();

        analyzeHousingSignals();

        analyzeClimateSignals();

        analyzeWeatherSignals();

        analyzeRiskSignals();

        analyzeOpportunitySignals();

        state.signals =
            cap(
                unique(
                    state.signals
                ),
                config.maxSignals
            );

        return state.signals;
    }


    /*
    ============================================================
    FINDINGS
    ============================================================
    */

    function addFinding(
        domain,
        type,
        message,
        evidence
    ) {

        state.findings.push({

            id:
                "finding_" +
                (
                    state.findings.length +
                    1
                ),

            domain:
                domain,

            type:
                type,

            message:
                message,

            evidence:
                evidence || null

        });
    }


    function buildFindings() {

        state.findings = [];

        const financial =
            state.financial;

        if (
            financial.arv !== null &&
            financial.purchasePrice !== null
        ) {

            if (
                financial.arv >
                financial.purchasePrice
            ) {

                addFinding(
                    "financial",
                    "spread",
                    "The supplied ARV exceeds the supplied purchase basis.",
                    {
                        arv:
                            financial.arv,

                        purchasePrice:
                            financial.purchasePrice
                    }
                );

            } else {

                addFinding(
                    "financial",
                    "spread",
                    "The supplied ARV does not exceed the supplied purchase basis.",
                    {
                        arv:
                            financial.arv,

                        purchasePrice:
                            financial.purchasePrice
                    }
                );
            }
        }


        if (
            financial.rehabToARV !== null
        ) {

            addFinding(
                "financial",
                "rehab_intensity",
                "Rehabilitation cost has been expressed as a share of supplied ARV.",
                financial.rehabToARV
            );
        }


        if (
            financial.profitMargin !== null
        ) {

            addFinding(
                "financial",
                "profit_context",
                "An estimated project margin has been calculated from supplied inputs.",
                financial.profitMargin
            );
        }


        const property =
            state.property;

        if (
            property &&
            property.yearBuilt
        ) {

            const age =
                new Date().getFullYear() -
                property.yearBuilt;

            if (
                age >= 75
            ) {

                addFinding(
                    "property",
                    "inspection",
                    "The property is older and may warrant additional inspection and systems review.",
                    {
                        yearBuilt:
                            property.yearBuilt,

                        approximateAge:
                            age
                    }
                );
            }
        }


        const weather =
            state.sourceData.weather;

        if (
            weather &&
            Array.isArray(
                weather.alerts
            ) &&
            weather.alerts.length
        ) {

            addFinding(
                "weather",
                "active_weather",
                "Active weather alerts are present in the available weather context.",
                {
                    alertCount:
                        weather.alerts.length
                }
            );
        }


        const risk =
            state.sourceData.risk;

        if (
            risk
        ) {

            const profile =
                risk.profile ||
                risk;

            if (
                profile.riskLevel
            ) {

                addFinding(
                    "risk",
                    "hazard",
                    "The risk module has supplied a property/location risk level.",
                    profile.riskLevel
                );
            }
        }


        state.findings =
            cap(
                unique(
                    state.findings
                ),
                config.maxFindings
            );

        return state.findings;
    }


    /*
    ============================================================
    TRADEOFFS
    ============================================================
    */

    function addTradeoff(
        domain,
        benefit,
        consideration,
        severity
    ) {

        state.tradeoffs.push({

            id:
                "tradeoff_" +
                (
                    state.tradeoffs.length +
                    1
                ),

            domain:
                domain,

            benefit:
                benefit,

            consideration:
                consideration,

            severity:
                severity || "moderate"

        });
    }


    function buildTradeoffs() {

        state.tradeoffs = [];

        const financial =
            state.financial;

        if (
            financial.arv !== null &&
            financial.purchasePrice !== null
        ) {

            addTradeoff(
                "financial",
                "A supplied ARV above purchase basis can create potential value spread.",
                "ARV must be supported by comparable sales, property condition and market evidence.",
                "high"
            );
        }


        if (
            financial.rehab > 0
        ) {

            addTradeoff(
                "rehab",
                "Renovation may create additional property value.",
                "Actual costs can exceed an initial rehab estimate.",
                "high"
            );
        }


        if (
            state.property &&
            state.property.rent !== null
        ) {

            addTradeoff(
                "rental",
                "Supplied rent provides a starting point for rental analysis.",
                "Rent estimates should be validated against current local comparables and actual achievable rent.",
                "moderate"
            );
        }


        if (
            state.sourceData.incentives
        ) {

            addTradeoff(
                "incentives",
                "Location programs may improve the economics of certain projects or businesses.",
                "Program eligibility, timing, funding and application requirements must be verified.",
                "moderate"
            );
        }


        if (
            state.sourceData.risk
        ) {

            addTradeoff(
                "risk",
                "Understanding hazard exposure can improve acquisition and underwriting decisions.",
                "Hazard data does not substitute for property-specific insurance, inspection or engineering review.",
                "high"
            );
        }


        state.tradeoffs =
            cap(
                unique(
                    state.tradeoffs
                ),
                config.maxTradeoffs
            );

        return state.tradeoffs;
    }


    /*
    ============================================================
    DATA GAPS
    ============================================================
    */

    function addGap(
        domain,
        field,
        message,
        importance
    ) {

        state.gaps.push({

            id:
                "gap_" +
                (
                    state.gaps.length +
                    1
                ),

            domain:
                domain,

            field:
                field,

            message:
                message,

            importance:
                importance || "medium"

        });
    }


    function buildDataGaps() {

        state.gaps = [];

        const property =
            state.property;

        const financial =
            state.financial;

        if (!property) {

            addGap(
                "property",
                "property",
                "No property has been supplied.",
                "critical"
            );

            return state.gaps;
        }


        if (
            !property.address &&
            !property.latitude
        ) {

            addGap(
                "property",
                "location",
                "A complete property address or coordinates are missing.",
                "high"
            );
        }


        if (
            !property.propertyType
        ) {

            addGap(
                "property",
                "propertyType",
                "Property type is missing.",
                "high"
            );
        }


        if (
            financial.purchasePrice ===
                null
        ) {

            addGap(
                "financial",
                "purchasePrice",
                "Purchase price is missing.",
                "high"
            );
        }


        if (
            financial.arv === null
        ) {

            addGap(
                "financial",
                "arv",
                "ARV is missing.",
                "critical"
            );
        }


        if (
            financial.rehab === 0
        ) {

            addGap(
                "financial",
                "rehab",
                "Rehabilitation cost is zero or not supplied. Confirm whether the property is turnkey or the rehab budget is incomplete.",
                "medium"
            );
        }


        if (
            !property.yearBuilt
        ) {

            addGap(
                "property",
                "yearBuilt",
                "Year built is missing.",
                "medium"
            );
        }


        if (
            property.squareFeet ===
                null
        ) {

            addGap(
                "property",
                "squareFeet",
                "Building square footage is missing.",
                "medium"
            );
        }


        if (
            property.bedrooms ===
                null
        ) {

            addGap(
                "property",
                "bedrooms",
                "Bedroom count is missing.",
                "medium"
            );
        }


        if (
            property.bathrooms ===
                null
        ) {

            addGap(
                "property",
                "bathrooms",
                "Bathroom count is missing.",
                "medium"
            );
        }


        if (
            !state.sourceData.housing
        ) {

            addGap(
                "housing",
                "marketData",
                "Local housing-market context is not connected.",
                "high"
            );
        }


        if (
            !state.sourceData.risk
        ) {

            addGap(
                "risk",
                "hazardData",
                "Hazard context is not connected.",
                "high"
            );
        }


        if (
            !state.sourceData.climate
        ) {

            addGap(
                "climate",
                "climateData",
                "Long-term climate context is not connected.",
                "medium"
            );
        }


        state.gaps =
            cap(
                unique(
                    state.gaps
                ),
                config.maxGaps
            );

        return state.gaps;
    }


    /*
    ============================================================
    ACTIONS
    ============================================================
    */

    function addAction(
        domain,
        action,
        priority,
        reason
    ) {

        state.actions.push({

            id:
                "action_" +
                (
                    state.actions.length +
                    1
                ),

            domain:
                domain,

            action:
                action,

            priority:
                priority || "medium",

            reason:
                reason || null

        });
    }


    function buildActions() {

        state.actions = [];

        const property =
            state.property;

        const financial =
            state.financial;

        if (!property) {

            addAction(
                "property",
                "Supply the property address or property record.",
                "critical",
                "Property-level analysis cannot begin without a property."
            );

            return state.actions;
        }


        if (
            !property.address &&
            !property.latitude
        ) {

            addAction(
                "property",
                "Add the full property address or coordinates.",
                "high",
                "Location intelligence depends on geographic identification."
            );
        }


        if (
            financial.arv === null
        ) {

            addAction(
                "valuation",
                "Validate ARV using recent comparable sales and property-specific condition.",
                "critical",
                "ARV materially affects deal analysis."
            );
        }


        if (
            financial.rehab === 0
        ) {

            addAction(
                "rehab",
                "Confirm whether the property is turnkey or develop a detailed rehab scope.",
                "high",
                "Rehabilitation assumptions can materially change project economics."
            );
        }


        if (
            !state.sourceData.risk
        ) {

            addAction(
                "risk",
                "Run property-level hazard and insurance due diligence.",
                "high",
                "Location risk data has not been connected."
            );
        }


        if (
            !state.sourceData.housing
        ) {

            addAction(
                "market",
                "Connect current local housing-market data and comparable properties.",
                "high",
                "Market context is required for stronger pricing analysis."
            );
        }


        if (
            state.sourceData.weather
        ) {

            const weather =
                state.sourceData.weather;

            const alerts =
                weather.alerts ||
                weather.profile?.alerts ||
                [];

            if (
                Array.isArray(alerts) &&
                alerts.length
            ) {

                addAction(
                    "weather",
                    "Review active weather alerts before time-sensitive property activity.",
                    "high",
                    "Current weather context contains active alerts."
                );
            }
        }


        if (
            property.url
        ) {

            addAction(
                "source",
                "Review the original listing/source record.",
                "medium",
                "The property has a source URL."
            );
        }


        addAction(
            "due_diligence",
            "Verify title, zoning, permits, taxes, insurance, utilities and property condition before committing capital.",
            "high",
            "AI analysis does not replace property due diligence."
        );


        state.actions =
            cap(
                unique(
                    state.actions
                ),
                config.maxActions
            );

        return state.actions;
    }


    /*
    ============================================================
    MARKET ANALYSIS
    ============================================================
    */

    function buildMarketAnalysis() {

        const housing =
            state.sourceData.housing;

        const property =
            state.property;

        const market = {

            status:
                housing
                    ? "available"
                    : "missing",

            medianHomePrice:
                null,

            medianRent:
                null,

            propertyPriceToMedian:
                null,

            rentToPriceRatio:
                null

        };

        if (!housing) {
            return market;
        }

        const profile =
            housing.profile ||
            housing;

        market.medianHomePrice =
            number(
                firstValue(
                    profile,
                    [
                        "medianHomePrice",
                        "median_home_price"
                    ]
                )
            );

        market.medianRent =
            number(
                firstValue(
                    profile,
                    [
                        "medianRent",
                        "median_rent"
                    ]
                )
            );

        if (
            market.medianHomePrice !==
                null &&
            property &&
            property.purchasePrice !==
                null
        ) {

            market.propertyPriceToMedian =
                property.purchasePrice /
                market.medianHomePrice;
        }

        if (
            market.medianRent !==
                null &&
            property &&
            property.purchasePrice !==
                null
        ) {

            market.rentToPriceRatio =
                (
                    market.medianRent *
                    12
                ) /
                property.purchasePrice;
        }

        return market;
    }


    /*
    ============================================================
    RISK ANALYSIS
    ============================================================
    */

    function buildRiskAnalysis() {

        const risk =
            state.sourceData.risk;

        const weather =
            state.sourceData.weather;

        const result = {

            status:
                risk
                    ? "available"
                    : "missing",

            riskLevel:
                null,

            hazards:
                [],

            activeWeatherAlerts:
                0,

            verificationRequired:
                true

        };

        if (risk) {

            const profile =
                risk.profile ||
                risk;

            result.riskLevel =
                firstValue(
                    profile,
                    [
                        "riskLevel",
                        "overallRisk",
                        "level"
                    ]
                );

            const hazards =
                profile.hazards ||
                risk.hazards ||
                [];

            if (
                Array.isArray(hazards)
            ) {

                result.hazards =
                    clone(hazards);

            } else if (
                isObject(hazards)
            ) {

                result.hazards =
                    Object.keys(hazards)
                        .map(
                            function (key) {

                                return {
                                    type: key,
                                    value:
                                        hazards[key]
                                };

                            }
                        );
            }
        }


        if (weather) {

            const alerts =
                weather.alerts ||
                weather.profile?.alerts ||
                [];

            result.activeWeatherAlerts =
                Array.isArray(alerts)
                    ? alerts.length
                    : 0;
        }

        return result;
    }


    /*
    ============================================================
    OPPORTUNITY ANALYSIS
    ============================================================
    */

    function buildOpportunityAnalysis() {

        const business =
            state.sourceData.business;

        const incentives =
            state.sourceData.incentives;

        const opportunity =
            state.sourceData.opportunity;

        return {

            businessPrograms:
                countMatches(
                    business
                ),

            incentives:
                countMatches(
                    incentives
                ),

            opportunityAvailable:
                Boolean(
                    opportunity
                ),

            businessDataAvailable:
                Boolean(
                    business
                ),

            incentiveDataAvailable:
                Boolean(
                    incentives
                )

        };
    }


    function countMatches(
        source
    ) {

        if (!source) {
            return 0;
        }

        const matches =
            source.matches ||
            source.profile?.matches ||
            [];

        return Array.isArray(matches)
            ? matches.length
            : 0;
    }


    /*
    ============================================================
    ANALYSIS BUILDER
    ============================================================
    */

    function buildAnalysis() {

        state.analysis = {

            property: {

                type:
                    state.property?.propertyType ||
                    null,

                size:
                    state.property?.squareFeet ||
                    null,

                age:
                    state.property?.yearBuilt
                        ? new Date().getFullYear() -
                          state.property.yearBuilt
                        : null

            },

            location:
                state.location || null,

            financial:
                clone(
                    state.financial
                ),

            market:
                buildMarketAnalysis(),

            risk:
                buildRiskAnalysis(),

            opportunity:
                buildOpportunityAnalysis()

        };

        return state.analysis;
    }


    /*
    ============================================================
    SUMMARY
    ============================================================
    */

    function buildSummary() {

        const property =
            state.property;

        const financial =
            state.financial;

        const summary = {

            property:
                property
                    ? (
                        property.address ||
                        (
                            property.city &&
                            property.state
                                ? property.city +
                                  ", " +
                                  property.state
                                : "Property"
                        )
                    )
                    : "No property",

            propertyType:
                property?.propertyType ||
                null,

            purchasePrice:
                financial.purchasePrice,

            arv:
                financial.arv,

            totalProjectCost:
                financial.totalProjectCost,

            estimatedProfit:
                financial.estimatedProfit,

            profitMargin:
                financial.profitMargin,

            signals:
                state.signals.length,

            findings:
                state.findings.length,

            tradeoffs:
                state.tradeoffs.length,

            gaps:
                state.gaps.length,

            actions:
                state.actions.length,

            location:
                state.location,

            riskLevel:
                state.analysis?.risk?.riskLevel ||
                null,

            marketStatus:
                state.analysis?.market?.status ||
                "missing"

        };

        state.summary =
            summary;

        return summary;
    }


    /*
    ============================================================
    SOURCES
    ============================================================
    */

    function buildSources() {

        const sources = [];

        function addSource(
            name,
            type,
            description
        ) {

            sources.push({

                name:
                    name,

                type:
                    type,

                description:
                    description

            });
        }


        if (
            state.sourceData.property
        ) {

            addSource(
                "Property Input",
                "user_or_external",
                "Property facts supplied to the RO'Lyfe property intelligence layer."
            );
        }


        if (
            state.sourceData.housing
        ) {

            addSource(
                "RO'Lyfe Housing",
                "internal_module",
                "Housing and affordability context."
            );
        }


        if (
            state.sourceData.climate
        ) {

            addSource(
                "RO'Lyfe Climate",
                "internal_module",
                "Long-term climate context."
            );
        }


        if (
            state.sourceData.weather
        ) {

            addSource(
                "National Weather Service",
                "external",
                "Current weather, forecasts and alerts where connected through the weather module."
            );
        }


        if (
            state.sourceData.risk
        ) {

            addSource(
                "RO'Lyfe Risk",
                "internal_module",
                "Hazard and risk context."
            );
        }


        if (
            state.sourceData.incentives
        ) {

            addSource(
                "RO'Lyfe Incentives",
                "internal_module",
                "Location-based incentive intelligence."
            );
        }


        if (
            state.sourceData.business
        ) {

            addSource(
                "RO'Lyfe Business",
                "internal_module",
                "Business, economic and program intelligence."
            );
        }


        state.sources =
            cap(
                sources,
                config.maxSources
            );

        state.metadata.sourceCount =
            state.sources.length;

        return state.sources;
    }


    /*
    ============================================================
    AI CONTEXT
    ============================================================
    */

    function buildAIContext(
        question
    ) {

        const property =
            clone(
                state.property
            );

        const context = {

            type:
                "property_analysis",

            version:
                VERSION,

            purpose:
                "Provide structured property intelligence for RO'Lyfe AI decision support.",

            question:
                question || null,

            property:
                property,

            location:
                clone(
                    state.location
                ),

            preferences:
                clone(
                    state.preferences
                ),

            financial:
                clone(
                    state.financial
                ),

            analysis:
                clone(
                    state.analysis
                ),

            signals:
                cap(
                    clone(
                        state.signals
                    ),
                    config.maxSignals
                ),

            findings:
                cap(
                    clone(
                        state.findings
                    ),
                    config.maxFindings
                ),

            tradeoffs:
                cap(
                    clone(
                        state.tradeoffs
                    ),
                    config.maxTradeoffs
                ),

            gaps:
                cap(
                    clone(
                        state.gaps
                    ),
                    config.maxGaps
                ),

            actions:
                cap(
                    clone(
                        state.actions
                    ),
                    config.maxActions
                ),

            sources:
                clone(
                    state.sources
                ),

            summary:
                clone(
                    state.summary
                ),

            guardrails: [

                "Do not invent missing property facts.",

                "Treat supplied ARV as an assumption unless independently verified.",

                "Do not guarantee investment returns or financing.",

                "Distinguish current weather from long-term climate.",

                "Distinguish hazard exposure from an active event.",

                "Verify flood, insurance, zoning, permitting and environmental conditions.",

                "Verify incentive eligibility with the administering organization.",

                "Do not treat a signal or match as a guarantee.",

                "Identify the geography and time period for market data when available.",

                "Explain material tradeoffs instead of hiding them.",

                "Use property-specific evidence before making a property conclusion."

            ]

        };

        state.aiContext =
            context;

        emit(
            "aiContextBuilt",
            context
        );

        return context;
    }


    /*
    ============================================================
    SHARED CONTEXT
    ============================================================
    */

    function buildSharedContext(
        question
    ) {

        return {

            module:
                MODULE_NAME,

            version:
                VERSION,

            location:
                clone(
                    state.location
                ),

            property:
                clone(
                    state.property
                ),

            financial:
                clone(
                    state.financial
                ),

            analysis:
                clone(
                    state.analysis
                ),

            signals:
                clone(
                    state.signals
                ),

            findings:
                clone(
                    state.findings
                ),

            tradeoffs:
                clone(
                    state.tradeoffs
                ),

            gaps:
                clone(
                    state.gaps
                ),

            actions:
                clone(
                    state.actions
                ),

            summary:
                clone(
                    state.summary
                ),

            aiContext:
                buildAIContext(
                    question
                )

        };
    }


    /*
    ============================================================
    MAIN ANALYZE METHOD
    ============================================================
    */

    function analyze(
        propertyInput,
        options
    ) {

        options =
            isObject(options)
                ? options
                : {};

        state.status =
            "analyzing";

        emit(
            "analysisStarted",
            {
                property:
                    propertyInput
            }
        );

        ingestProperty(
            propertyInput
        );

        if (
            options.location
        ) {

            state.location =
                normalizeLocation(
                    options.location
                );

        }

        if (
            options.preferences
        ) {

            state.preferences =
                Object.assign(
                    {},
                    state.preferences,
                    options.preferences
                );
        }

        collectContext();

        buildAnalysis();

        analyzeSignals();

        buildFindings();

        buildTradeoffs();

        buildDataGaps();

        buildActions();

        buildSummary();

        buildSources();

        buildAIContext(
            options.question
        );

        state.status =
            "complete";

        state.initialized =
            true;

        state.metadata.updatedAt =
            new Date().toISOString();

        persist();

        emit(
            "analysisComplete",
            getResult()
        );

        return getResult();
    }


    /*
    ============================================================
    ALIAS
    ============================================================
    */

    function analyzeProperty(
        propertyInput,
        options
    ) {

        return analyze(
            propertyInput,
            options
        );
    }


    /*
    ============================================================
    COMPARABLE PROPERTY SUPPORT
    ============================================================
    */

    function ingestComparables(
        comparables
    ) {

        if (
            !Array.isArray(
                comparables
            )
        ) {
            return [];
        }

        const normalized =
            comparables
                .slice(
                    0,
                    config.maxComparableProperties
                )
                .map(
                    function (item) {

                        return normalizeProperty(
                            item
                        );

                    }
                );

        state.market.comparables =
            normalized;

        state.market.comparableCount =
            normalized.length;

        emit(
            "comparablesLoaded",
            normalized
        );

        persist();

        return clone(
            normalized
        );
    }


    function getComparables() {

        return clone(
            state.market.comparables ||
            []
        );
    }


    function analyzeComparableSpread() {

        const subject =
            state.property;

        const comps =
            getComparables();

        if (
            !subject ||
            !comps.length
        ) {

            return {

                status:
                    "insufficient_data",

                message:
                    "Subject property and comparable properties are required."

            };
        }

        const valid =
            comps.filter(
                function (comp) {

                    return (
                        comp.currentValue !== null ||
                        comp.askingPrice !== null ||
                        comp.purchasePrice !== null
                    );
                }
            );

        const prices =
            valid
                .map(
                    function (comp) {

                        return (
                            comp.currentValue ??
                            comp.askingPrice ??
                            comp.purchasePrice
                        );

                    }
                )
                .filter(
                    function (value) {
                        return value !== null;
                    }
                );

        if (!prices.length) {

            return {

                status:
                    "insufficient_data",

                message:
                    "Comparable pricing data is unavailable."

            };
        }

        const average =
            prices.reduce(
                function (
                    total,
                    value
                ) {
                    return total + value;
                },
                0
            ) /
            prices.length;

        const subjectPrice =
            subject.purchasePrice ??
            subject.askingPrice ??
            subject.currentValue;

        return {

            status:
                "complete",

            comparableCount:
                prices.length,

            averageComparablePrice:
                average,

            subjectPrice:
                subjectPrice,

            subjectVsComparableAverage:
                subjectPrice !== null
                    ? subjectPrice - average
                    : null

        };
    }


    /*
    ============================================================
    AFFORDABILITY / DEAL CHECK
    ============================================================
    */

    function checkDeal(
        overrides
    ) {

        const property =
            Object.assign(
                {},
                state.property || {},
                overrides || {}
            );

        const financial =
            buildFinancialProfile(
                normalizeProperty(
                    property
                )
            );

        return {

            purchasePrice:
                financial.purchasePrice,

            arv:
                financial.arv,

            rehab:
                financial.rehab,

            totalProjectCost:
                financial.totalProjectCost,

            estimatedProfit:
                financial.estimatedProfit,

            profitMargin:
                financial.profitMargin,

            purchaseToARV:
                financial.purchaseToARV,

            rehabToARV:
                financial.rehabToARV,

            completeEnoughToEvaluate:
                financial.purchasePrice !== null &&
                financial.arv !== null

        };
    }


    /*
    ============================================================
    LOCATION SETTER
    ============================================================
    */

    function setLocation(
        location
    ) {

        state.location =
            normalizeLocation(
                location
            );

        state.property =
            state.property ||
            {};

        if (
            !state.property.location
        ) {

            state.property.location =
                clone(
                    state.location
                );
        }

        state.metadata.updatedAt =
            new Date().toISOString();

        persist();

        emit(
            "locationChanged",
            state.location
        );

        return clone(
            state.location
        );
    }


    /*
    ============================================================
    PREFERENCES
    ============================================================
    */

    function setPreferences(
        preferences
    ) {

        state.preferences =
            Object.assign(
                {},
                state.preferences,
                isObject(preferences)
                    ? preferences
                    : {}
            );

        state.metadata.updatedAt =
            new Date().toISOString();

        persist();

        emit(
            "preferencesChanged",
            state.preferences
        );

        return clone(
            state.preferences
        );
    }


    /*
    ============================================================
    GETTERS
    ============================================================
    */

    function getState() {

        return clone(
            state
        );
    }


    function getStatus() {

        return {

            module:
                MODULE_NAME,

            version:
                VERSION,

            status:
                state.status,

            initialized:
                state.initialized,

            hasProperty:
                Boolean(
                    state.property
                ),

            hasLocation:
                Boolean(
                    state.location
                ),

            signalCount:
                state.signals.length,

            findingCount:
                state.findings.length,

            tradeoffCount:
                state.tradeoffs.length,

            gapCount:
                state.gaps.length,

            actionCount:
                state.actions.length,

            sourceCount:
                state.sources.length

        };
    }


    function getProperty() {

        return clone(
            state.property
        );
    }


    function getLocation() {

        return clone(
            state.location
        );
    }


    function getFinancialProfile() {

        return clone(
            state.financial
        );
    }


    function getAnalysis() {

        return clone(
            state.analysis
        );
    }


    function getSignals() {

        return clone(
            state.signals
        );
    }


    function getFindings() {

        return clone(
            state.findings
        );
    }


    function getTradeoffs() {

        return clone(
            state.tradeoffs
        );
    }


    function getGaps() {

        return clone(
            state.gaps
        );
    }


    function getActions() {

        return clone(
            state.actions
        );
    }


    function getSummary() {

        return clone(
            state.summary
        );
    }


    function getAIContext() {

        return clone(
            state.aiContext
        );
    }


    function getSources() {

        return clone(
            state.sources
        );
    }


    /*
    ============================================================
    RESET
    ============================================================
    */

    function reset() {

        state =
            clone(
                EMPTY_STATE
            );

        state.metadata.createdAt =
            new Date().toISOString();

        state.metadata.updatedAt =
            state.metadata.createdAt;

        persist();

        emit(
            "reset",
            state
        );

        return getState();
    }


    /*
    ============================================================
    PERSISTENCE
    ============================================================
    */

    function persist() {

        if (
            !config.persist
        ) {
            return false;
        }

        try {

            if (
                typeof localStorage ===
                    "undefined"
            ) {
                return false;
            }

            localStorage.setItem(
                config.storageKey,
                JSON.stringify(
                    state
                )
            );

            return true;

        } catch (error) {

            console.warn(
                "[" +
                MODULE_NAME +
                "] persistence failed:",
                error
            );

            return false;
        }
    }


    function restore() {

        if (
            !config.persist
        ) {
            return false;
        }

        try {

            if (
                typeof localStorage ===
                    "undefined"
            ) {
                return false;
            }

            const saved =
                localStorage.getItem(
                    config.storageKey
                );

            if (!saved) {
                return false;
            }

            const parsed =
                JSON.parse(
                    saved
                );

            if (
                !isObject(parsed)
            ) {
                return false;
            }

            state =
                Object.assign(
                    clone(EMPTY_STATE),
                    parsed
                );

            return true;

        } catch (error) {

            console.warn(
                "[" +
                MODULE_NAME +
                "] restore failed:",
                error
            );

            return false;
        }
    }


    /*
    ============================================================
    CONFIGURATION
    ============================================================
    */

    function configure(
        options
    ) {

        if (
            !isObject(options)
        ) {
            return getConfig();
        }

        config =
            Object.assign(
                {},
                config,
                options
            );

        return getConfig();
    }


    function getConfig() {

        return clone(
            config
        );
    }


    /*
    ============================================================
    SERIALIZATION
    ============================================================
    */

    function serialize() {

        return JSON.stringify(
            getState()
        );
    }


    /*
    ============================================================
    INITIALIZATION
    ============================================================
    */

    function initialize(
        options
    ) {

        configure(
            options || {}
        );

        if (
            state.metadata.createdAt ===
                null
        ) {

            state.metadata.createdAt =
                new Date().toISOString();
        }

        restore();

        state.initialized =
            true;

        if (
            state.status ===
                "idle"
        ) {

            state.status =
                "ready";
        }

        state.metadata.updatedAt =
            new Date().toISOString();

        emit(
            "initialized",
            getStatus()
        );

        return getStatus();
    }


    /*
    ============================================================
    PUBLIC API
    ============================================================
    */

    const API = {

        VERSION:
            VERSION,

        MODULE_NAME:
            MODULE_NAME,

        initialize:
            initialize,

        configure:
            configure,

        getConfig:
            getConfig,

        reset:
            reset,

        analyze:
            analyze,

        analyzeProperty:
            analyzeProperty,

        ingestProperty:
            ingestProperty,

        setLocation:
            setLocation,

        getLocation:
            getLocation,

        setPreferences:
            setPreferences,

        getProperty:
            getProperty,

        getFinancialProfile:
            getFinancialProfile,

        getAnalysis:
            getAnalysis,

        getSignals:
            getSignals,

        getFindings:
            getFindings,

        getTradeoffs:
            getTradeoffs,

        getGaps:
            getGaps,

        getActions:
            getActions,

        getSummary:
            getSummary,

        getSources:
            getSources,

        getAIContext:
            getAIContext,

        buildAIContext:
            buildAIContext,

        buildSharedContext:
            buildSharedContext,

        ingestComparables:
            ingestComparables,

        getComparables:
            getComparables,

        analyzeComparableSpread:
            analyzeComparableSpread,

        checkDeal:
            checkDeal,

        getState:
            getState,

        getStatus:
            getStatus,

        subscribe:
            subscribe,

        serialize:
            serialize

    };


    /*
    ============================================================
    GLOBAL EXPORTS
    ============================================================
    */

    window.ROlyfePropertyAnalysis =
        API;

    window.ROLYFE_PROPERTY_ANALYSIS =
        API;


    /*
    ============================================================
    AUTO INITIALIZE
    ============================================================
    */

    if (
        config.autoInitialize
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

    }


})(window);
