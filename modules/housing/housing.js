/*
===========================================================
RO’Lyfe Relocation Intelligence Center™
HOUSING INTELLIGENCE MODULE

File:
    /modules/housing/housing.js

Purpose:
    Housing-focused intelligence layer.

    Consumes:
        ROlyfeCore
        ROlyfeRelocation
        Intelligence Profile
        Opportunity Profile

    Produces:
        Housing profile
        Affordability context
        Rental context
        Ownership context
        Property context
        Housing signals
        Housing gaps
        Housing next actions
        AI-ready housing context

Architecture:

    RO’LYFE CORE
          ↓
    HOUSING MODULE
          ↓
    ┌───────────────┬───────────────┐
    ↓               ↓               ↓
    Housing       Property       Cost
    Data          Context        Context
    ↓               ↓               ↓
    └───────────────┴───────────────┘
                    ↓
             Housing Profile
                    ↓
          UI / AI / Relocation /
          Property / Capital

Design Principles:
    - Data-driven
    - No invented market statistics
    - No universal "best" housing market
    - Rental and ownership kept distinct
    - Current data can be plugged in later
    - Property listings can be plugged in later
    - 50-state ready
===========================================================
*/

(function (global) {
    "use strict";

    const VERSION = "1.0.0";

    const NAME = "RO’Lyfe Housing Intelligence";

    const DEFAULT_PREFERENCES = {
        mode: "both",

        monthlyBudget: null,

        purchaseBudget: null,

        downPayment: null,

        bedrooms: null,

        bathrooms: null,

        propertyTypes: [],

        rentalPreferred: false,

        ownershipPreferred: false,

        investmentProperty: false,

        affordabilityPriority: 1,

        housingRiskPriority: 1,

        propertyPriority: 1
    };

    const DEFAULT_STATE = {
        initialized: false,

        status: "idle",

        timestamp: null,

        location: null,

        preferences: {},

        profile: null,

        source: null,

        signals: [],

        gaps: [],

        actions: [],

        listings: [],

        summary: null,

        errors: [],

        warnings: []
    };

    let state = clone(DEFAULT_STATE);

    const subscribers = [];

    /*
    ===========================================================
    UTILITY
    ===========================================================
    */

    function clone(value) {
        if (
            value === undefined ||
            value === null
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

    function now() {
        return new Date().toISOString();
    }

    function isObject(value) {
        return value !== null &&
            typeof value === "object" &&
            !Array.isArray(value);
    }

    function merge(base, incoming) {
        const result =
            isObject(base)
                ? clone(base)
                : {};

        if (!isObject(incoming)) {
            return result;
        }

        Object.keys(incoming).forEach(function (key) {

            const value =
                incoming[key];

            if (
                isObject(value) &&
                isObject(result[key])
            ) {
                result[key] =
                    merge(
                        result[key],
                        value
                    );
            } else {
                result[key] =
                    clone(value);
            }
        });

        return result;
    }

    function safeNumber(value, fallback) {
        const number =
            Number(value);

        return Number.isFinite(number)
            ? number
            : (
                fallback !== undefined
                    ? fallback
                    : 0
            );
    }

    function normalizeText(value) {
        if (
            value === null ||
            value === undefined
        ) {
            return "";
        }

        return String(value)
            .trim()
            .toLowerCase();
    }

    function hasValue(value) {
        return (
            value !== null &&
            value !== undefined &&
            value !== ""
        );
    }

    function hasData(value) {

        if (!hasValue(value)) {
            return false;
        }

        if (Array.isArray(value)) {
            return value.length > 0;
        }

        if (isObject(value)) {
            return Object.keys(value).length > 0;
        }

        return true;
    }

    function unique(values) {
        return Array.from(
            new Set(
                (values || [])
                    .filter(hasValue)
            )
        );
    }

    /*
    ===========================================================
    CORE ACCESS
    ===========================================================
    */

    function getCore() {
        return (
            global.ROlyfeCore ||
            null
        );
    }

    function requireCore() {

        const core =
            getCore();

        if (!core) {
            throw new Error(
                "ROlyfeCore is required by the housing module."
            );
        }

        return core;
    }

    /*
    ===========================================================
    EVENTS
    ===========================================================
    */

    function subscribe(callback) {

        if (
            typeof callback !==
            "function"
        ) {
            return function () {};
        }

        subscribers.push(callback);

        return function unsubscribe() {

            const index =
                subscribers.indexOf(
                    callback
                );

            if (index !== -1) {
                subscribers.splice(
                    index,
                    1
                );
            }
        };
    }

    function emit(
        eventName,
        payload
    ) {

        const event = {

            name:
                eventName,

            timestamp:
                now(),

            payload:
                clone(payload),

            state:
                getState()
        };

        subscribers
            .slice()
            .forEach(function (callback) {

                try {
                    callback(event);
                } catch (error) {

                    console.error(
                        "RO’Lyfe Housing subscriber error:",
                        error
                    );
                }

            });

        return event;
    }

    /*
    ===========================================================
    PREFERENCES
    ===========================================================
    */

    function normalizePreferences(
        preferences
    ) {

        const result =
            merge(
                DEFAULT_PREFERENCES,
                preferences || {}
            );

        if (
            !Array.isArray(
                result.propertyTypes
            )
        ) {
            result.propertyTypes = [];
        }

        result.affordabilityPriority =
            safeNumber(
                result.affordabilityPriority,
                1
            );

        result.housingRiskPriority =
            safeNumber(
                result.housingRiskPriority,
                1
            );

        result.propertyPriority =
            safeNumber(
                result.propertyPriority,
                1
            );

        return result;
    }

    function setPreferences(
        preferences
    ) {

        state.preferences =
            normalizePreferences(
                preferences
            );

        state.timestamp =
            now();

        emit(
            "preferences:set",
            state.preferences
        );

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
    SOURCE EXTRACTION
    ===========================================================
    */

    function extractSourceData(
        analysis
    ) {

        if (!analysis) {
            return {};
        }

        const intelligence =
            analysis.intelligence ||
            {};

        const opportunity =
            analysis.opportunity ||
            {};

        return {

            housing:
                intelligence.housing ||
                opportunity.housing ||
                {},

            property:
                intelligence.property ||
                opportunity.property ||
                {},

            costOfLiving:
                intelligence.costOfLiving ||
                opportunity.costOfLiving ||
                {},

            climate:
                intelligence.climate ||
                opportunity.climate ||
                {},

            hazards:
                intelligence.hazards ||
                opportunity.risk ||
                {},

            location:
                analysis.location ||
                {}
        };
    }

    /*
    ===========================================================
    NUMBER EXTRACTION
    ===========================================================
    */

    function findNumber(
        object,
        keys
    ) {

        if (!isObject(object)) {
            return null;
        }

        for (
            let i = 0;
            i < keys.length;
            i++
        ) {

            const key =
                keys[i];

            if (
                hasValue(
                    object[key]
                )
            ) {

                const number =
                    Number(
                        object[key]
                    );

                if (
                    Number.isFinite(
                        number
                    )
                ) {
                    return number;
                }
            }
        }

        return null;
    }

    function findNestedNumber(
        object,
        paths
    ) {

        if (!isObject(object)) {
            return null;
        }

        for (
            let i = 0;
            i < paths.length;
            i++
        ) {

            const path =
                paths[i];

            const parts =
                path.split(".");

            let current =
                object;

            let valid =
                true;

            for (
                let j = 0;
                j < parts.length;
                j++
            ) {

                if (
                    current === null ||
                    current === undefined ||
                    !hasValue(
                        current[
                            parts[j]
                        ]
                    )
                ) {

                    valid = false;
                    break;
                }

                current =
                    current[
                        parts[j]
                    ];
            }

            if (valid) {

                const number =
                    Number(current);

                if (
                    Number.isFinite(
                        number
                    )
                ) {
                    return number;
                }
            }
        }

        return null;
    }

    /*
    ===========================================================
    HOUSING METRICS
    ===========================================================
    */

    function extractMetrics(
        source
    ) {

        const housing =
            source.housing || {};

        const property =
            source.property || {};

        const cost =
            source.costOfLiving || {};

        return {

            medianHomePrice:
                findNumber(
                    housing,
                    [
                        "medianHomePrice",
                        "median_home_price",
                        "medianSalePrice",
                        "median_sale_price",
                        "homePrice",
                        "home_price"
                    ]
                ) ??
                findNumber(
                    property,
                    [
                        "medianHomePrice",
                        "median_home_price",
                        "medianSalePrice",
                        "median_sale_price"
                    ]
                ),

            medianRent:
                findNumber(
                    housing,
                    [
                        "medianRent",
                        "median_rent",
                        "medianMonthlyRent",
                        "median_monthly_rent",
                        "averageRent",
                        "average_rent"
                    ]
                ) ??
                findNumber(
                    cost,
                    [
                        "medianRent",
                        "median_rent",
                        "housingRent",
                        "housing_rent"
                    ]
                ),

            averageHomePrice:
                findNumber(
                    housing,
                    [
                        "averageHomePrice",
                        "average_home_price",
                        "averageSalePrice",
                        "average_sale_price"
                    ]
                ),

            pricePerSquareFoot:
                findNumber(
                    housing,
                    [
                        "pricePerSquareFoot",
                        "price_per_square_foot",
                        "pricePerSqFt",
                        "price_per_sq_ft"
                    ]
                ),

            medianHouseholdIncome:
                findNumber(
                    housing,
                    [
                        "medianHouseholdIncome",
                        "median_household_income"
                    ]
                ) ??
                findNumber(
                    cost,
                    [
                        "medianHouseholdIncome",
                        "median_household_income"
                    ]
                ),

            homeownershipRate:
                findNumber(
                    housing,
                    [
                        "homeownershipRate",
                        "homeownership_rate",
                        "ownerOccupiedRate",
                        "owner_occupied_rate"
                    ]
                ),

            vacancyRate:
                findNumber(
                    housing,
                    [
                        "vacancyRate",
                        "vacancy_rate"
                    ]
                ),

            inventory:
                findNumber(
                    housing,
                    [
                        "inventory",
                        "activeListings",
                        "active_listings",
                        "housingInventory",
                        "housing_inventory"
                    ]
                ),

            daysOnMarket:
                findNumber(
                    housing,
                    [
                        "daysOnMarket",
                        "days_on_market",
                        "medianDaysOnMarket",
                        "median_days_on_market"
                    ]
                )
        };
    }

    /*
    ===========================================================
    AFFORDABILITY
    ===========================================================
    */

    function calculateRentBurden(
        monthlyRent,
        annualIncome
    ) {

        if (
            !Number.isFinite(
                monthlyRent
            ) ||
            !Number.isFinite(
                annualIncome
            ) ||
            annualIncome <= 0
        ) {
            return null;
        }

        return (
            monthlyRent * 12 /
            annualIncome
        ) * 100;
    }

    function calculatePurchaseRatio(
        homePrice,
        annualIncome
    ) {

        if (
            !Number.isFinite(
                homePrice
            ) ||
            !Number.isFinite(
                annualIncome
            ) ||
            annualIncome <= 0
        ) {
            return null;
        }

        return (
            homePrice /
            annualIncome
        );
    }

    function buildAffordability(
        metrics,
        preferences
    ) {

        const monthlyBudget =
            safeNumber(
                preferences.monthlyBudget,
                0
            );

        const purchaseBudget =
            safeNumber(
                preferences.purchaseBudget,
                0
            );

        const rent =
            metrics.medianRent;

        const homePrice =
            metrics.medianHomePrice;

        const income =
            metrics.medianHouseholdIncome;

        const rentBurden =
            calculateRentBurden(
                rent,
                income
            );

        const purchaseRatio =
            calculatePurchaseRatio(
                homePrice,
                income
            );

        let rentalBudgetStatus =
            "unknown";

        let purchaseBudgetStatus =
            "unknown";

        if (
            monthlyBudget > 0 &&
            Number.isFinite(rent)
        ) {

            rentalBudgetStatus =
                rent <= monthlyBudget
                    ? "within_budget"
                    : "above_budget";
        }

        if (
            purchaseBudget > 0 &&
            Number.isFinite(homePrice)
        ) {

            purchaseBudgetStatus =
                homePrice <= purchaseBudget
                    ? "within_budget"
                    : "above_budget";
        }

        return {

            monthlyBudget:
                monthlyBudget || null,

            purchaseBudget:
                purchaseBudget || null,

            medianRent:
                rent,

            medianHomePrice:
                homePrice,

            medianHouseholdIncome:
                income,

            estimatedRentBurdenPercent:
                rentBurden,

            homePriceToIncomeRatio:
                purchaseRatio,

            rentalBudgetStatus:
                rentalBudgetStatus,

            purchaseBudgetStatus:
                purchaseBudgetStatus
        };
    }

    /*
    ===========================================================
    RENTAL PROFILE
    ===========================================================
    */

    function buildRentalProfile(
        metrics,
        preferences
    ) {

        const available =
            Number.isFinite(
                metrics.medianRent
            );

        return {

            available:
                available,

            medianRent:
                metrics.medianRent,

            requestedMonthlyBudget:
                preferences.monthlyBudget ||
                null,

            budgetRelationship:
                buildBudgetRelationship(
                    metrics.medianRent,
                    preferences.monthlyBudget
                ),

            bedrooms:
                preferences.bedrooms,

            bathrooms:
                preferences.bathrooms,

            rentalPreferred:
                !!preferences.rentalPreferred,

            signals:
                buildRentalSignals(
                    metrics,
                    preferences
                )
        };
    }

    function buildRentalSignals(
        metrics,
        preferences
    ) {

        const signals = [];

        if (
            Number.isFinite(
                metrics.medianRent
            )
        ) {

            signals.push({
                type:
                    "rent_data",

                status:
                    "available",

                value:
                    metrics.medianRent
            });

        } else {

            signals.push({
                type:
                    "rent_data",

                status:
                    "missing"
            });
        }

        if (
            Number.isFinite(
                preferences.monthlyBudget
            ) &&
            Number.isFinite(
                metrics.medianRent
            )
        ) {

            signals.push({

                type:
                    "rent_budget",

                status:
                    metrics.medianRent <=
                    preferences.monthlyBudget
                        ? "within_budget"
                        : "above_budget",

                budget:
                    preferences.monthlyBudget,

                medianRent:
                    metrics.medianRent
            });
        }

        return signals;
    }

    /*
    ===========================================================
    OWNERSHIP PROFILE
    ===========================================================
    */

    function buildOwnershipProfile(
        metrics,
        preferences
    ) {

        return {

            available:
                Number.isFinite(
                    metrics.medianHomePrice
                ),

            medianHomePrice:
                metrics.medianHomePrice,

            averageHomePrice:
                metrics.averageHomePrice,

            pricePerSquareFoot:
                metrics.pricePerSquareFoot,

            homeownershipRate:
                metrics.homeownershipRate,

            requestedPurchaseBudget:
                preferences.purchaseBudget ||
                null,

            budgetRelationship:
                buildBudgetRelationship(
                    metrics.medianHomePrice,
                    preferences.purchaseBudget
                ),

            ownershipPreferred:
                !!preferences.ownershipPreferred,

            investmentProperty:
                !!preferences.investmentProperty
        };
    }

    function buildBudgetRelationship(
        marketValue,
        budget
    ) {

        if (
            !Number.isFinite(
                marketValue
            ) ||
            !Number.isFinite(
                Number(budget)
            ) ||
            Number(budget) <= 0
        ) {

            return {
                status:
                    "unknown",

                marketValue:
                    Number.isFinite(
                        marketValue
                    )
                        ? marketValue
                        : null,

                budget:
                    Number.isFinite(
                        Number(budget)
                    )
                        ? Number(budget)
                        : null
            };
        }

        const difference =
            marketValue -
            Number(budget);

        const percentage =
            (
                difference /
                Number(budget)
            ) * 100;

        return {

            status:
                difference <= 0
                    ? "within_budget"
                    : "above_budget",

            marketValue:
                marketValue,

            budget:
                Number(budget),

            difference:
                difference,

            differencePercent:
                percentage
        };
    }

    /*
    ===========================================================
    PROPERTY CONTEXT
    ===========================================================
    */

    function buildPropertyContext(
        source,
        preferences
    ) {

        const property =
            source.property || {};

        const propertyTypes =
            extractPropertyTypes(
                property
            );

        return {

            available:
                hasData(
                    property
                ),

            type:
                property.propertyType ||
                property.property_type ||
                null,

            availableTypes:
                propertyTypes,

            requestedTypes:
                clone(
                    preferences.propertyTypes
                ),

            bedrooms:
                property.bedrooms ||
                null,

            bathrooms:
                property.bathrooms ||
                null,

            units:
                property.units ||
                null,

            squareFeet:
                property.squareFeet ||
                property.square_feet ||
                null,

            investmentPotential:
                property.investmentPotential ||
                property.investment_potential ||
                null
        };
    }

    function extractPropertyTypes(
        property
    ) {

        const values = [];

        if (
            Array.isArray(
                property.propertyTypes
            )
        ) {

            values.push.apply(
                values,
                property.propertyTypes
            );
        }

        if (
            Array.isArray(
                property.property_types
            )
        ) {

            values.push.apply(
                values,
                property.property_types
            );
        }

        if (
            hasValue(
                property.propertyType
            )
        ) {

            values.push(
                property.propertyType
            );
        }

        if (
            hasValue(
                property.property_type
            )
        ) {

            values.push(
                property.property_type
            );
        }

        return unique(
            values
        );
    }

    /*
    ===========================================================
    HOUSING SIGNALS
    ===========================================================
    */

    function buildSignals(
        metrics,
        affordability,
        rental,
        ownership,
        property,
        source
    ) {

        const signals = [];

        /*
        Rent
        */

        if (
            Number.isFinite(
                metrics.medianRent
            )
        ) {

            signals.push({

                domain:
                    "rental",

                type:
                    "market_data",

                status:
                    "available",

                value:
                    metrics.medianRent
            });

        } else {

            signals.push({

                domain:
                    "rental",

                type:
                    "market_data",

                status:
                    "missing"
            });
        }

        /*
        Home price
        */

        if (
            Number.isFinite(
                metrics.medianHomePrice
            )
        ) {

            signals.push({

                domain:
                    "ownership",

                type:
                    "market_data",

                status:
                    "available",

                value:
                    metrics.medianHomePrice
            });

        } else {

            signals.push({

                domain:
                    "ownership",

                type:
                    "market_data",

                status:
                    "missing"
            });
        }

        /*
        Income
        */

        if (
            Number.isFinite(
                metrics.medianHouseholdIncome
            )
        ) {

            signals.push({

                domain:
                    "affordability",

                type:
                    "income",

                status:
                    "available",

                value:
                    metrics.medianHouseholdIncome
            });
        }

        /*
        Rent burden
        */

        if (
            Number.isFinite(
                affordability
                    .estimatedRentBurdenPercent
            )
        ) {

            signals.push({

                domain:
                    "affordability",

                type:
                    "rent_burden",

                status:
                    affordability
                        .estimatedRentBurdenPercent <= 30
                        ? "lower"
                        : "higher",

                value:
                    affordability
                        .estimatedRentBurdenPercent
            });
        }

        /*
        Inventory
        */

        if (
            Number.isFinite(
                metrics.inventory
            )
        ) {

            signals.push({

                domain:
                    "market",

                type:
                    "inventory",

                status:
                    "available",

                value:
                    metrics.inventory
            });
        }

        /*
        Days on market
        */

        if (
            Number.isFinite(
                metrics.daysOnMarket
            )
        ) {

            signals.push({

                domain:
                    "market",

                type:
                    "days_on_market",

                status:
                    "available",

                value:
                    metrics.daysOnMarket
            });
        }

        /*
        Homeownership
        */

        if (
            Number.isFinite(
                metrics.homeownershipRate
            )
        ) {

            signals.push({

                domain:
                    "ownership",

                type:
                    "homeownership_rate",

                status:
                    "available",

                value:
                    metrics.homeownershipRate
            });
        }

        /*
        Property data
        */

        signals.push({

            domain:
                "property",

            type:
                "property_context",

            status:
                property.available
                    ? "available"
                    : "missing"
        });

        /*
        Source-level housing data
        */

        if (
            !hasData(
                source.housing
            )
        ) {

            signals.push({

                domain:
                    "housing",

                type:
                    "housing_dataset",

                status:
                    "missing"
            });
        }

        return signals;
    }

    /*
    ===========================================================
    GAPS
    ===========================================================
    */

    function buildGaps(
        metrics,
        source,
        preferences
    ) {

        const gaps = [];

        if (
            !Number.isFinite(
                metrics.medianRent
            )
        ) {

            gaps.push({

                domain:
                    "rental",

                field:
                    "medianRent",

                message:
                    "Rental market data is not currently available for this location."
            });
        }

        if (
            !Number.isFinite(
                metrics.medianHomePrice
            )
        ) {

            gaps.push({

                domain:
                    "ownership",

                field:
                    "medianHomePrice",

                message:
                    "Home-price data is not currently available for this location."
            });
        }

        if (
            !Number.isFinite(
                metrics.medianHouseholdIncome
            )
        ) {

            gaps.push({

                domain:
                    "affordability",

                field:
                    "medianHouseholdIncome",

                message:
                    "Income data is needed for a stronger affordability analysis."
            });
        }

        if (
            !hasData(
                source.property
            )
        ) {

            gaps.push({

                domain:
                    "property",

                field:
                    "propertyData",

                message:
                    "Property-level data is not currently connected."
            });
        }

        if (
            preferences.investmentProperty &&
            !hasData(
                source.property
            )
        ) {

            gaps.push({

                domain:
                    "investment",

                field:
                    "investmentPropertyData",

                message:
                    "Investment-property analysis requires property-level market data."
            });
        }

        return gaps;
    }

    /*
    ===========================================================
    NEXT ACTIONS
    ===========================================================
    */

    function buildActions(
        metrics,
        gaps,
        preferences
    ) {

        const actions = [];

        if (
            gaps.some(function (gap) {
                return gap.domain ===
                    "rental";
            })
        ) {

            actions.push({

                id:
                    "connect-rental-data",

                priority:
                    "high",

                action:
                    "Connect rental-market data for the selected location."
            });
        }

        if (
            gaps.some(function (gap) {
                return gap.domain ===
                    "ownership";
            })
        ) {

            actions.push({

                id:
                    "connect-sale-data",

                priority:
                    "high",

                action:
                    "Connect home-sale and pricing data."
            });
        }

        if (
            gaps.some(function (gap) {
                return gap.domain ===
                    "property";
            })
        ) {

            actions.push({

                id:
                    "connect-property-data",

                priority:
                    "medium",

                action:
                    "Run property-level search for the selected location."
            });
        }

        if (
            preferences.investmentProperty
        ) {

            actions.push({

                id:
                    "investment-analysis",

                priority:
                    "medium",

                action:
                    "Send housing context into the property and deal-analysis workflow."
            });
        }

        if (
            preferences.ownershipPreferred
        ) {

            actions.push({

                id:
                    "ownership-analysis",

                priority:
                    "medium",

                action:
                    "Compare the requested ownership budget with available market data."
            });
        }

        if (
            preferences.rentalPreferred
        ) {

            actions.push({

                id:
                    "rental-analysis",

                priority:
                    "medium",

                action:
                    "Compare the requested rental budget with available market data."
            });
        }

        if (
            actions.length === 0
        ) {

            actions.push({

                id:
                    "continue-relocation-analysis",

                priority:
                    "low",

                action:
                    "Continue with climate, risk, incentives, business, and opportunity analysis."
            });
        }

        return actions;
    }

    /*
    ===========================================================
    HOUSING SUMMARY
    ===========================================================
    */

    function buildSummary(
        location,
        metrics,
        affordability,
        rental,
        ownership,
        gaps
    ) {

        const parts = [];

        if (
            Number.isFinite(
                metrics.medianRent
            )
        ) {

            parts.push(
                "Median rent data is available."
            );

        } else {

            parts.push(
                "Rental pricing data is incomplete."
            );
        }

        if (
            Number.isFinite(
                metrics.medianHomePrice
            )
        ) {

            parts.push(
                "Home-price data is available."
            );

        } else {

            parts.push(
                "Home-price data is incomplete."
            );
        }

        if (
            Number.isFinite(
                affordability
                    .estimatedRentBurdenPercent
            )
        ) {

            parts.push(
                "Estimated rent-to-income burden: " +
                affordability
                    .estimatedRentBurdenPercent
                    .toFixed(1) +
                "%."
            );
        }

        return {

            location:
                clone(location),

            headline:
                buildHeadline(
                    location
                ),

            narrative:
                parts.join(" "),

            rental:
                clone(rental),

            ownership:
                clone(ownership),

            affordability:
                clone(affordability),

            dataGaps:
                gaps.length,

            dataComplete:
                gaps.length === 0
        };
    }

    function buildHeadline(
        location
    ) {

        if (
            location.city &&
            location.state
        ) {

            return (
                "Housing intelligence for " +
                location.city +
                ", " +
                location.state
            );
        }

        if (
            location.state
        ) {

            return (
                "Housing intelligence for " +
                location.state
            );
        }

        return "RO’Lyfe housing intelligence";
    }

    /*
    ===========================================================
    PROFILE BUILDER
    ===========================================================
    */

    function buildProfile(
        analysis,
        preferences
    ) {

        const source =
            extractSourceData(
                analysis
            );

        const metrics =
            extractMetrics(
                source
            );

        const affordability =
            buildAffordability(
                metrics,
                preferences
            );

        const rental =
            buildRentalProfile(
                metrics,
                preferences
            );

        const ownership =
            buildOwnershipProfile(
                metrics,
                preferences
            );

        const property =
            buildPropertyContext(
                source,
                preferences
            );

        const signals =
            buildSignals(
                metrics,
                affordability,
                rental,
                ownership,
                property,
                source
            );

        const gaps =
            buildGaps(
                metrics,
                source,
                preferences
            );

        const actions =
            buildActions(
                metrics,
                gaps,
                preferences
            );

        const summary =
            buildSummary(
                source.location,
                metrics,
                affordability,
                rental,
                ownership,
                gaps
            );

        return {

            engine:
                NAME,

            version:
                VERSION,

            timestamp:
                now(),

            location:
                clone(
                    source.location
                ),

            metrics:
                clone(metrics),

            affordability:
                clone(affordability),

            rental:
                clone(rental),

            ownership:
                clone(ownership),

            property:
                clone(property),

            signals:
                clone(signals),

            gaps:
                clone(gaps),

            actions:
                clone(actions),

            summary:
                clone(summary)
        };
    }

    /*
    ===========================================================
    MAIN ANALYSIS
    ===========================================================
    */

    function analyze(
        options
    ) {

        const opts =
            isObject(options)
                ? clone(options)
                : {};

        state.status =
            "analyzing";

        state.timestamp =
            now();

        state.errors = [];

        state.warnings = [];

        emit(
            "housing:analysis:start",
            opts
        );

        try {

            const core =
                requireCore();

            /*
            ---------------------------------------------------
            Preferences
            ---------------------------------------------------
            */

            const preferences =
                normalizePreferences(
                    opts.preferences ||
                    state.preferences
                );

            state.preferences =
                preferences;

            /*
            ---------------------------------------------------
            Get existing core analysis
            ---------------------------------------------------
            */

            let analysis =
                opts.analysis ||
                null;

            if (!analysis) {

                if (
                    typeof core.getAnalysis ===
                    "function"
                ) {

                    analysis =
                        core.getAnalysis();
                }
            }

            /*
            ---------------------------------------------------
            Run core if a location was supplied and no
            meaningful analysis currently exists.
            ---------------------------------------------------
            */

            if (
                opts.location &&
                (
                    !analysis ||
                    !analysis.intelligence
                )
            ) {

                if (
                    typeof core.analyzeWithPreferences ===
                    "function"
                ) {

                    analysis =
                        core.analyzeWithPreferences(
                            opts.location,
                            {},
                            {}
                        );

                } else if (
                    typeof core.analyzeLocation ===
                    "function"
                ) {

                    analysis =
                        core.analyzeLocation({
                            location:
                                opts.location
                        });
                }
            }

            if (
                !analysis ||
                !analysis.intelligence
            ) {

                throw new Error(
                    "No RO’Lyfe Core intelligence profile is available for housing analysis."
                );
            }

            /*
            ---------------------------------------------------
            Build Housing Profile
            ---------------------------------------------------
            */

            const profile =
                buildProfile(
                    analysis,
                    preferences
                );

            state.profile =
                profile;

            state.location =
                clone(
                    profile.location
                );

            state.source =
                clone(
                    analysis.intelligence
                );

            state.signals =
                clone(
                    profile.signals
                );

            state.gaps =
                clone(
                    profile.gaps
                );

            state.actions =
                clone(
                    profile.actions
                );

            state.summary =
                clone(
                    profile.summary
                );

            state.status =
                "complete";

            state.timestamp =
                now();

            emit(
                "housing:analysis:complete",
                profile
            );

            return getResult();

        } catch (error) {

            state.status =
                "error";

            state.timestamp =
                now();

            state.errors.push({

                message:
                    error.message ||
                    String(error),

                timestamp:
                    now()
            });

            emit(
                "housing:analysis:error",
                state.errors[
                    state.errors.length - 1
                ]
            );

            return getResult();
        }
    }

    /*
    ===========================================================
    LISTING INGESTION
    ===========================================================
    */

    function normalizeListing(
        listing
    ) {

        if (!isObject(listing)) {
            return null;
        }

        return {

            id:
                listing.id ||
                listing.propertyId ||
                listing.property_id ||
                null,

            address:
                listing.address ||
                null,

            city:
                listing.city ||
                null,

            state:
                listing.state ||
                null,

            zip:
                listing.zip ||
                listing.zipCode ||
                null,

            price:
                safeNumber(
                    listing.price,
                    null
                ),

            rent:
                safeNumber(
                    listing.rent,
                    null
                ),

            propertyType:
                listing.propertyType ||
                listing.property_type ||
                null,

            bedrooms:
                safeNumber(
                    listing.bedrooms,
                    null
                ),

            bathrooms:
                safeNumber(
                    listing.bathrooms,
                    null
                ),

            squareFeet:
                safeNumber(
                    listing.squareFeet ||
                    listing.square_feet,
                    null
                ),

            status:
                listing.status ||
                "unknown",

            source:
                listing.source ||
                null,

            url:
                listing.url ||
                listing.link ||
                null,

            raw:
                clone(listing)
        };
    }

    function ingestListings(
        listings
    ) {

        if (
            !Array.isArray(listings)
        ) {

            throw new Error(
                "ingestListings requires an array."
            );
        }

        state.listings =
            listings
                .map(
                    normalizeListing
                )
                .filter(Boolean);

        state.timestamp =
            now();

        emit(
            "housing:listings:updated",
            {
                count:
                    state.listings.length
            }
        );

        return getListings();
    }

    function getListings() {

        return clone(
            state.listings
        );
    }

    /*
    ===========================================================
    LISTING FILTERING
    ===========================================================
    */

    function filterListings(
        filters
    ) {

        const active =
            filters || {};

        return state.listings.filter(
            function (listing) {

                if (
                    hasValue(
                        active.state
                    ) &&
                    normalizeText(
                        listing.state
                    ) !==
                    normalizeText(
                        active.state
                    )
                ) {

                    return false;
                }

                if (
                    hasValue(
                        active.city
                    ) &&
                    normalizeText(
                        listing.city
                    ) !==
                    normalizeText(
                        active.city
                    )
                ) {

                    return false;
                }

                if (
                    Number.isFinite(
                        Number(
                            active.maxPrice
                        )
                    ) &&
                    Number.isFinite(
                        listing.price
                    ) &&
                    listing.price >
                    Number(
                        active.maxPrice
                    )
                ) {

                    return false;
                }

                if (
                    Number.isFinite(
                        Number(
                            active.maxRent
                        )
                    ) &&
                    Number.isFinite(
                        listing.rent
                    ) &&
                    listing.rent >
                    Number(
                        active.maxRent
                    )
                ) {

                    return false;
                }

                if (
                    Number.isFinite(
                        Number(
                            active.minBedrooms
                        )
                    ) &&
                    Number.isFinite(
                        listing.bedrooms
                    ) &&
                    listing.bedrooms <
                    Number(
                        active.minBedrooms
                    )
                ) {

                    return false;
                }

                if (
                    active.propertyType &&
                    normalizeText(
                        listing.propertyType
                    ) !==
                    normalizeText(
                        active.propertyType
                    )
                ) {

                    return false;
                }

                return true;
            }
        );
    }

    /*
    ===========================================================
    AFFORDABILITY CHECK
    ===========================================================
    */

    function checkListingAffordability(
        listing,
        preferences
    ) {

        const result = {

            listing:
                clone(listing),

            rental:
                null,

            purchase:
                null
        };

        const monthlyBudget =
            safeNumber(
                preferences.monthlyBudget,
                0
            );

        const purchaseBudget =
            safeNumber(
                preferences.purchaseBudget,
                0
            );

        if (
            Number.isFinite(
                listing.rent
            ) &&
            monthlyBudget > 0
        ) {

            result.rental = {

                withinBudget:
                    listing.rent <=
                    monthlyBudget,

                budget:
                    monthlyBudget,

                rent:
                    listing.rent,

                difference:
                    monthlyBudget -
                    listing.rent
            };
        }

        if (
            Number.isFinite(
                listing.price
            ) &&
            purchaseBudget > 0
        ) {

            result.purchase = {

                withinBudget:
                    listing.price <=
                    purchaseBudget,

                budget:
                    purchaseBudget,

                price:
                    listing.price,

                difference:
                    purchaseBudget -
                    listing.price
            };
        }

        return result;
    }

    /*
    ===========================================================
    AI CONTEXT
    ===========================================================
    */

    function buildAIContext() {

        return {

            engine:
                NAME,

            version:
                VERSION,

            location:
                clone(
                    state.location
                ),

            preferences:
                clone(
                    state.preferences
                ),

            housing:
                clone(
                    state.profile
                ),

            listings:
                clone(
                    state.listings
                ),

            signals:
                clone(
                    state.signals
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

            instruction:
                "Interpret housing data as contextual intelligence. Do not invent missing housing statistics or treat incomplete data as complete."
        };
    }

    /*
    ===========================================================
    SHARED CONTEXT
    ===========================================================
    */

    function buildSharedContext() {

        const core =
            getCore();

        let shared =
            {};

        if (
            core &&
            typeof core.buildSharedContext ===
            "function"
        ) {

            shared =
                core.buildSharedContext();
        }

        return merge(
            shared,
            {
                housing:
                    clone(
                        state.profile
                    ),

                housingListings:
                    clone(
                        state.listings
                    ),

                housingAI:
                    buildAIContext()
            }
        );
    }

    /*
    ===========================================================
    RESULT
    ===========================================================
    */

    function getResult() {

        return {

            module:
                NAME,

            version:
                VERSION,

            status:
                state.status,

            timestamp:
                state.timestamp,

            location:
                clone(
                    state.location
                ),

            preferences:
                clone(
                    state.preferences
                ),

            profile:
                clone(
                    state.profile
                ),

            summary:
                clone(
                    state.summary
                ),

            signals:
                clone(
                    state.signals
                ),

            gaps:
                clone(
                    state.gaps
                ),

            actions:
                clone(
                    state.actions
                ),

            listings:
                clone(
                    state.listings
                ),

            errors:
                clone(
                    state.errors
                ),

            warnings:
                clone(
                    state.warnings
                )
        };
    }

    /*
    ===========================================================
    STATE
    ===========================================================
    */

    function getState() {
        return clone(
            state
        );
    }

    /*
    ===========================================================
    SERIALIZE
    ===========================================================
    */

    function serialize() {

        return JSON.stringify(
            getResult(),
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

        state =
            clone(
                DEFAULT_STATE
            );

        state.preferences =
            normalizePreferences(
                DEFAULT_PREFERENCES
            );

        emit(
            "housing:reset",
            {}
        );

        return getState();
    }

    /*
    ===========================================================
    INITIALIZATION
    ===========================================================
    */

    function initialize(
        options
    ) {

        state.preferences =
            normalizePreferences(
                (
                    options &&
                    options.preferences
                ) ||
                DEFAULT_PREFERENCES
            );

        if (
            options &&
            options.location
        ) {

            state.location =
                clone(
                    options.location
                );
        }

        const core =
            getCore();

        if (core) {

            state.initialized =
                true;

            state.status =
                "ready";

        } else {

            state.initialized =
                false;

            state.status =
                "waiting_for_core";

            state.warnings.push(
                "ROlyfeCore has not loaded yet."
            );
        }

        state.timestamp =
            now();

        emit(
            "housing:initialized",
            {
                initialized:
                    state.initialized
            }
        );

        return getStatus();
    }

    /*
    ===========================================================
    STATUS
    ===========================================================
    */

    function getStatus() {

        return {

            module:
                NAME,

            version:
                VERSION,

            initialized:
                state.initialized,

            status:
                state.status,

            coreAvailable:
                !!getCore(),

            timestamp:
                state.timestamp,

            listingCount:
                state.listings.length,

            signalCount:
                state.signals.length,

            gapCount:
                state.gaps.length,

            errors:
                clone(
                    state.errors
                ),

            warnings:
                clone(
                    state.warnings
                )
        };
    }

    /*
    ===========================================================
    PUBLIC API
    ===========================================================
    */

    const API = {

        name:
            NAME,

        version:
            VERSION,

        initialize:
            initialize,

        reset:
            reset,

        analyze:
            analyze,

        getState:
            getState,

        getStatus:
            getStatus,

        getResult:
            getResult,

        getProfile:
            function () {
                return clone(
                    state.profile
                );
            },

        getSummary:
            function () {
                return clone(
                    state.summary
                );
            },

        getSignals:
            function () {
                return clone(
                    state.signals
                );
            },

        getGaps:
            function () {
                return clone(
                    state.gaps
                );
            },

        getActions:
            function () {
                return clone(
                    state.actions
                );
            },

        setPreferences:
            setPreferences,

        getPreferences:
            getPreferences,

        ingestListings:
            ingestListings,

        getListings:
            getListings,

        filterListings:
            filterListings,

        checkListingAffordability:
            checkListingAffordability,

        buildAIContext:
            buildAIContext,

        buildSharedContext:
            buildSharedContext,

        serialize:
            serialize,

        subscribe:
            subscribe
    };

    /*
    ===========================================================
    GLOBAL EXPORT
    ===========================================================
    */

    global.ROlyfeHousing =
        API;

    if (
        typeof globalThis !==
        "undefined"
    ) {

        globalThis.ROlyfeHousing =
            API;
    }

    /*
    ===========================================================
    INITIALIZE
    ===========================================================
    */

    initialize();

})(typeof window !== "undefined"
    ? window
    : globalThis);
