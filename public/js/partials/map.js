mapboxgl.accessToken = 'pk.eyJ1Ijoid2l0aGNoZWVzZXBscyIsImEiOiJjams1cTkybmcwamo5M3FwMm5jMjdzdHl3In0.yI9WNY7aCdeQndyxbU9Amg';
let map = new mapboxgl.Map({
container: 'map',
style: 'mapbox://styles/mapbox/streets-v10',
hash: true
});

/* given a query in the form "lng, lat" or "lat, lng" returns the matching
 * geographic coordinate(s) as search results in carmen geojson format,
 * https://github.com/mapbox/carmen/blob/master/carmen-geojson.md
 */
var coordinatesGeocoder = function (query) {
    // match anything which looks like a decimal degrees coordinate pair
    let matches = query.match(/^[ ]*(?:Lat: )?(-?\d+\.?\d*)[, ]+(?:Lng: )?(-?\d+\.?\d*)[ ]*$/i);
    if (!matches) {
        return null;
    }

    function coordinateFeature(lng, lat) {
        return {
            center: [lng, lat],
            geometry: {
                type: "Point",
                coordinates: [lng, lat]
            },
            place_name: 'Lat: ' + lat + ', Lng: ' + lng, // eslint-disable-line camelcase
            place_type: ['coordinate'], // eslint-disable-line camelcase
            properties: {},
            type: 'Feature'
        };
    }

    let coord1 = Number(matches[1]);
    let coord2 = Number(matches[2]);
    let geocodes = [];

    if (coord1 < -90 || coord1 > 90) {
        // must be lng, lat
        geocodes.push(coordinateFeature(coord1, coord2));
    }

    if (coord2 < -90 || coord2 > 90) {
        // must be lat, lng
        geocodes.push(coordinateFeature(coord2, coord1));
    }

    if (geocodes.length === 0) {
        // else could be either lng, lat or lat, lng
        geocodes.push(coordinateFeature(coord1, coord2));
        geocodes.push(coordinateFeature(coord2, coord1));
    }

    return geocodes;
};

const geocoder = new MapboxGeocoder({
  accessToken: mapboxgl.accessToken,
  localGeocoder: coordinatesGeocoder,
  zoom: 4,
  placeholder: 'Search'
});

// this is added with the sidebar (it would be repetive if i add it here, cause the sidebar checks if it is the right one to use)
// map.addControl(geocoder);
