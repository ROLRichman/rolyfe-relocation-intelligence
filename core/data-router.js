/**
 * RO’Lyfe Relocation Intelligence
 * Data Router
 *
 * File:
 * /core/data-router.js
 *
 * Purpose:
 * Centralized data-loading layer for the RO’Lyfe
 * Relocation Intelligence system.
 *
 * Responsibilities:
 * - Load JSON intelligence files
 * - Cache loaded datasets
 * - Handle loading errors
 * - Search state/city/country datasets
 * - Build a location intelligence package
 * - Connect data to ROlyfeLocationEngine
 *
 * This file contains DATA ROUTING LOGIC only.
 * It does not control page UI.
 */

const ROlyfeDataRouter = (() => {

    const VERSION = "1.0.0";

    /*
    -------------------------------------------------------
    DATA PATHS
    -------------------------------------------------------
    */

    const DATA_PATHS = {

        states:
            "./data/states.json",

        countries:
            "./data/countries.json",

        cities:
            "./data/cities.json",

        pennsylvania:
            "./data/pennsylvania.json",

        climate:
            "./data/climate.json",

        hazards:
            "./data/hazards.json",

        incentives:
            "./data/incentives.json",

        costOfLiving:
            "./data/cost-of-living.json",

        media:
            "./data/media.json"

    };


    /*
    -------------------------------------------------------
    CACHE
    -------------------------------------------------------
    */

    const cache = new Map();

    const loadingPromises = new Map();


    /*
    -------------------------------------------------------
    LOAD JSON
    -------------------------------------------------------
    */

    async function loadJSON(name) {

        if (!DATA_PATHS[name]) {

            throw new Error(
                `RO’Lyfe Data Router: Unknown dataset "${name}".`
            );

        }


        /*
        Return cached data when available.
        */

        if (cache.has(name)) {

            return cache.get(name);

        }


        /*
        Prevent duplicate simultaneous requests.
        */

        if (loadingPromises.has(name)) {

            return loadingPromises.get(name);

        }


        const url = DATA_PATHS[name];


        const request = fetch(url, {
            method: "GET",
            headers: {
                "Accept": "application/json"
            },
            cache: "no-cache"
        })
        .then(response => {

            if (!response.ok) {

                throw new Error(
                    `Failed to load ${name}.json — HTTP ${response.status}`
                );

            }

            return response.json();

        })
        .then(data => {

            cache.set(name, data);

            loadingPromises.delete(name);

            return data;

        })
        .catch(error => {

            loadingPromises.delete(name);

            throw error;

        });


        loadingPromises.set(name, request);

        return request;
    }


    /*
    -------------------------------------------------------
    LOAD MULTIPLE DATASETS
    -------------------------------------------------------
    */

    async function loadMany(names = []) {

        if (!Array.isArray(names)) {

            throw new TypeError(
                "loadMany() requires an array of dataset names."
            );

        }


        const results = {};


        await Promise.all(

            names.map(async name => {

                results[name] =
                    await loadJSON(name);

            })

        );


        return results;
    }


    /*
    -------------------------------------------------------
    LOAD ALL CORE DATA
    -------------------------------------------------------
    */

    async function loadAll() {

        const names =
            Object.keys(DATA_PATHS);

        return loadMany(names);
    }


    /*
    -------------------------------------------------------
    CLEAR CACHE
    -------------------------------------------------------
    */

    function clearCache(name = null) {

        if (name) {

            cache.delete(name);

            return true;
        }


        cache.clear();

        return true;
    }


    /*
    -------------------------------------------------------
    CACHE STATUS
    -------------------------------------------------------
    */

    function getCacheStatus() {

        const status = {};

        Object.keys(DATA_PATHS).forEach(name => {

            status[name] = {
                loaded: cache.has(name),
                loading: loadingPromises.has(name),
                path: DATA_PATHS[name]
            };

        });


        return status;
    }


    /*
    -------------------------------------------------------
    GET DATASET
    -------------------------------------------------------
    */

    function getCached(name) {

        return cache.get(name) || null;
    }


    /*
    -------------------------------------------------------
    GENERIC ARRAY EXTRACTION
    -------------------------------------------------------
    */

    function extractArray(data, possibleKeys = []) {

        if (Array.isArray(data)) {

            return data;
        }


        if (!data || typeof data !== "object") {

            return [];
        }


        for (const key of possibleKeys) {

            if (Array.isArray(data[key])) {

                return data[key];
            }

        }


        return [];
    }


    /*
    -------------------------------------------------------
    STATES
    -------------------------------------------------------
    */

    async function getStates() {

        const data =
            await loadJSON("states");


        return extractArray(
            data,
            [
                "states",
                "data",
                "locations"
            ]
        );
    }


    /*
    -------------------------------------------------------
    FIND STATE
    -------------------------------------------------------
    */

    async function findState(query) {

        const states =
            await getStates();


        const search =
            normalizeSearch(query);


        if (!search) {

            return null;
        }


        return states.find(state => {

            const name =
                normalizeSearch(
                    state.name
                );

            const code =
                normalizeSearch(
                    state.code
                );

            return (
                name === search ||
                code === search
            );

        }) || null;
    }


    /*
    -------------------------------------------------------
    SEARCH STATES
    -------------------------------------------------------
    */

    async function searchStates(query) {

        const states =
            await getStates();


        const search =
            normalizeSearch(query);


        if (!search) {

            return states;
        }


        return states.filter(state => {

            const name =
                normalizeSearch(
                    state.name
                );

            const code =
                normalizeSearch(
                    state.code
                );

            return (
                name.includes(search) ||
                code.includes(search)
            );

        });
    }


    /*
    -------------------------------------------------------
    CITIES
    -------------------------------------------------------
    */

    async function getCities() {

        const data =
            await loadJSON("cities");


        return extractArray(
            data,
            [
                "cities",
                "data",
                "locations"
            ]
        );
    }


    /*
    -------------------------------------------------------
    SEARCH CITIES
    -------------------------------------------------------
    */

    async function searchCities(query) {

        const cities =
            await getCities();


        const search =
            normalizeSearch(query);


        if (!search) {

            return [];
        }


        return cities.filter(city => {

            const name =
                normalizeSearch(
                    city.name ||
                    city.city
                );

            const state =
                normalizeSearch(
                    city.state ||
                    city.stateCode
                );

            return (
                name.includes(search) ||
                state.includes(search)
            );

        });
    }


    /*
    -------------------------------------------------------
    COUNTRIES
    -------------------------------------------------------
    */

    async function getCountries() {

        const data =
            await loadJSON("countries");


        return extractArray(
            data,
            [
                "countries",
                "data",
                "locations"
            ]
        );
    }


    /*
    -------------------------------------------------------
    FIND COUNTRY
    -------------------------------------------------------
    */

    async function findCountry(query) {

        const countries =
            await getCountries();


        const search =
            normalizeSearch(query);


        if (!search) {

            return null;
        }


        return countries.find(country => {

            const name =
                normalizeSearch(
                    country.name
                );

            const code =
                normalizeSearch(
                    country.code
                );

            return (
                name === search ||
                code === search
            );

        }) || null;
    }


    /*
    -------------------------------------------------------
    PENNSYLVANIA DATA
    -------------------------------------------------------
    */

    async function getPennsylvania() {

        return loadJSON(
            "pennsylvania"
        );
    }


    /*
    -------------------------------------------------------
    GENERIC LOCATION SEARCH
    -------------------------------------------------------
    */

    async function searchLocation(query) {

        const search =
            normalizeSearch(query);


        if (!search) {

            return {
                query: "",
                states: [],
                cities: [],
                countries: []
            };
        }


        const [
            states,
            cities,
            countries
        ] = await Promise.all([

            searchStates(query),

            searchCities(query),

            getCountries()

        ]);


        const matchingCountries =
            countries.filter(country => {

                const name =
                    normalizeSearch(
                        country.name
                    );

                const code =
                    normalizeSearch(
                        country.code
                    );

                return (
                    name.includes(search) ||
                    code.includes(search)
                );

            });


        return {

            query,

            states,

            cities,

            countries:
                matchingCountries

        };
    }


    /*
    -------------------------------------------------------
    LOAD INTELLIGENCE DOMAINS
    -------------------------------------------------------
    */

    async function loadIntelligence() {

        return loadMany([

            "climate",

            "hazards",

            "incentives",

            "costOfLiving",

            "media"

        ]);
    }


    /*
    -------------------------------------------------------
    BUILD LOCATION DATA PACKAGE
    -------------------------------------------------------
    */

    async function buildLocationData(options = {}) {

        const {

            stateCode = "",

            cityName = "",

            countryCode = "US",

            includeProperty = false

        } = options;


        const [

            states,

            cities,

            countries,

            climate,

            hazards,

            incentives,

            costOfLiving,

            media

        ] = await Promise.all([

            getStates(),

            getCities(),

            getCountries(),

            loadJSON("climate"),

            loadJSON("hazards"),

            loadJSON("incentives"),

            loadJSON("costOfLiving"),

            loadJSON("media")

        ]);


        const normalizedState =
            normalizeSearch(
                stateCode
            );

        const normalizedCity =
            normalizeSearch(
                cityName
            );

        const normalizedCountry =
            normalizeSearch(
                countryCode
            );


        const state =
            states.find(item => {

                return (

                    normalizeSearch(
                        item.code
                    ) === normalizedState ||

                    normalizeSearch(
                        item.name
                    ) === normalizedState

                );

            }) || null;


        const city =
            cities.find(item => {

                const itemCity =
                    normalizeSearch(
                        item.name ||
                        item.city
                    );

                const itemState =
                    normalizeSearch(
                        item.stateCode ||
                        item.state
                    );

                return (

                    itemCity === normalizedCity &&

                    (
                        !normalizedState ||
                        itemState === normalizedState
                    )

                );

            }) || null;


        const country =
            countries.find(item => {

                return (

                    normalizeSearch(
                        item.code
                    ) === normalizedCountry ||

                    normalizeSearch(
                        item.name
                    ) === normalizedCountry

                );

            }) || null;


        /*
        ---------------------------------------------------
        OPTIONAL PROPERTY DATA
        ---------------------------------------------------
        */

        let property = {};

        if (includeProperty) {

            property = {

                source:
                    "Property intelligence module",

                available:
                    true

            };

        }


        return {

            location: {

                country,

                state,

                city

            },

            intelligence: {

                climate,

                hazards,

                incentives,

                costOfLiving,

                media

            },

            property,

            generatedAt:
                new Date().toISOString(),

            routerVersion:
                VERSION

        };
    }


    /*
    -------------------------------------------------------
    BUILD RO’LYFE LOCATION PROFILE
    -------------------------------------------------------
    */

    async function buildROlyfeLocation(options = {}) {

        const data =
            await buildLocationData(
                options
            );


        /*
        If the Location Engine exists,
        create the standardized location object.
        */

        if (
            typeof window !== "undefined" &&
            window.ROlyfeLocationEngine
        ) {

            const engine =
                window.ROlyfeLocationEngine;


            const location =
                engine.createLocation({

                    country: {
                        name:
                            data.location.country?.name ||
                            "",

                        code:
                            data.location.country?.code ||
                            ""
                    },

                    state: {
                        name:
                            data.location.state?.name ||
                            "",

                        code:
                            data.location.state?.code ||
                            "",

                        fips:
                            data.location.state?.fips ||
                            ""
                    },

                    city: {
                        name:
                            data.location.city?.name ||
                            "",

                        state:
                            data.location.city?.state ||
                            "",

                        stateCode:
                            data.location.city?.stateCode ||
                            data.location.state?.code ||
                            ""
                    },

                    climate:
                        data.intelligence.climate,

                    hazards:
                        data.intelligence.hazards,

                    incentives:
                        data.intelligence.incentives,

                    costOfLiving:
                        data.intelligence.costOfLiving,

                    metadata: {

                        dataRouterVersion:
                            VERSION,

                        loadedAt:
                            new Date().toISOString()

                    }

                });


            return engine.normalizeLocation(
                location
            );
        }


        /*
        Fallback if the Location Engine
        has not yet been loaded.
        */

        return {

            location:
                data.location,

            intelligence:
                data.intelligence,

            property:
                data.property,

            metadata: {

                dataRouterVersion:
                    VERSION,

                warning:
                    "ROlyfeLocationEngine was not loaded."

            }

        };
    }


    /*
    -------------------------------------------------------
    NORMALIZE SEARCH STRING
    -------------------------------------------------------
    */

    function normalizeSearch(value) {

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


    /*
    -------------------------------------------------------
    DATASET LIST
    -------------------------------------------------------
    */

    function getAvailableDatasets() {

        return Object.keys(
            DATA_PATHS
        );
    }


    /*
    -------------------------------------------------------
    PUBLIC API
    -------------------------------------------------------
    */

    return {

        VERSION,

        DATA_PATHS,

        loadJSON,

        loadMany,

        loadAll,

        loadIntelligence,

        getCached,

        clearCache,

        getCacheStatus,

        getAvailableDatasets,

        getStates,

        findState,

        searchStates,

        getCities,

        searchCities,

        getCountries,

        findCountry,

        getPennsylvania,

        searchLocation,

        buildLocationData,

        buildROlyfeLocation

    };

})();


/*
-----------------------------------------------------------
BROWSER GLOBAL
-----------------------------------------------------------
*/

if (typeof window !== "undefined") {

    window.ROlyfeDataRouter =
        ROlyfeDataRouter;

}


/*
-----------------------------------------------------------
GLOBAL REFERENCE
-----------------------------------------------------------
*/

if (typeof globalThis !== "undefined") {

    globalThis.ROlyfeDataRouter =
        ROlyfeDataRouter;

}
