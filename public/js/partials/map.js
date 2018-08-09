mapboxgl.accessToken = 'pk.eyJ1Ijoid2l0aGNoZWVzZXBscyIsImEiOiJjams1cTkybmcwamo5M3FwMm5jMjdzdHl3In0.yI9WNY7aCdeQndyxbU9Amg';

// -------------------------------
// map objects initialize
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/dark-v9',
  center: location.hash.length == 0 ? [-73.9395,40.79] : [],
  zoom: 10,
  hash: true
});

const geocoder = new MapboxGeocoder({
  accessToken: mapboxgl.accessToken,
  localGeocoder: coordinatesGeocoder,
  zoom: 4,
  placeholder: 'Search',
});

const userlocation = new mapboxgl.GeolocateControl({
  positionOptions: {
    enableHighAccuracy: true
  },
  trackUserLocation: true
});

const geojson = {
    "type": "FeatureCollection",
    "features": [{
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": [0,0]
        }
    }]
};

function setNewCoord(lng, lat){
  geojson.features[0].geometry.coordinates = [lng, lat];
  map.getSource('point').setData(geojson);
  $('span.coordinates').text(`${lng}, ${lat}`);
}

function addSuggestion(sug) {
  $('.suggestions').append(
    `
      <div class='suggestion'>
        <h4 class='title'>${sug.title}</h4>
        <p class='location'>${sug.longitude}, ${sug.latitude}</p>
        <p class='text'>${sug.text}</p>
      </div>
    `
  )
}


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

// point
let canvas = map.getCanvasContainer();

function onMove(e) {
  var coords = e.lngLat;

  // Set a UI indicator for dragging.
  canvas.style.cursor = 'grabbing';

  // Update the Point feature in `geojson` coordinates
  // and call setData to the source layer `point` on it.
  setNewCoord(coords.lng, coords.lat);
}

function onUp(e) {
  var coords = e.lngLat;

  // Unbind mouse/touch events
  map.off('mousemove', onMove);
  map.off('touchmove', onMove);
}

// -------------------------------
// events
userlocation.on('geolocate', (pos)=>{
  setNewCoord(pos.coords.longitude, pos.coords.latitude);
});

geocoder.on('result', (r)=>{
  setNewCoord(r.result.geometry.coordinates[0],r.result.geometry.coordinates[1]);
});

map.on('load', ()=>{
  geojson['features'][0]['geometry']['coordinates'] = [map.getCenter().lng, map.getCenter().lat];
  $('span.coordinates').text(`${map.getCenter().lng}, ${map.getCenter().lat}`);

  // get long and lat and get request to get points for the map
  const bounds = map.getBounds().toArray();
  fetch(`/suggestions/${bounds[0][0]}/${bounds[0][1]}/${bounds[1][0]}/${bounds[1][1]}`)
  .then(function(res){return res.json()})
  .then((data)=>{
    // for now just add points
    // TODO: later make clusters
    // const points = [];
    data.forEach((e, i)=>{
      map.addSource(`point${i}`, {
        "type": "geojson",
        data: {
          "type": "FeatureCollection",
          "features": [{
            "type": "Feature",
            "geometry": {
              "type": "Point",
              "coordinates": [e.longitude,e.latitude]
            }
          }]
        }
      })
      map.addLayer({
        "id": `point${i}`,
        "type": "circle",
        "source": `point${i}`,
        "paint": {
            "circle-radius": 7,
            "circle-color": e.color
        }
      });
      // addSuggestion is from suggestion partial
      addSuggestion(e);
    });
  });

  // Add a single point to the map
  map.addSource('point', {
    "type": "geojson",
    "data": geojson
  });

  map.addLayer({
    "id": "point",
    "type": "circle",
    "source": "point",
    "paint": {
        "circle-radius": 10,
        "circle-color": "#3887be"
    }
  });

  // When the cursor enters a feature in the point layer, prepare for dragging.
  map.on('mouseenter', 'point', ()=>{
    if($('.mapboxgl-user-location-dot.mapboxgl-marker.mapboxgl-marker-anchor-center').length > 0) return;

    map.setPaintProperty('point', 'circle-color', '#3bb2d0');
    canvas.style.cursor = 'move';
  });

  map.on('mouseleave', 'point', ()=> {
    map.setPaintProperty('point', 'circle-color', '#3887be');
    canvas.style.cursor = '';
  });

  map.on('mousedown', 'point', (e)=> {
    // check if uselocation exist
    if($('.mapboxgl-user-location-dot.mapboxgl-marker.mapboxgl-marker-anchor-center').length > 0) return;

    // Prevent the default map drag behavior.
    e.preventDefault();

    canvas.style.cursor = 'grab';

    map.on('mousemove', onMove);
    map.once('mouseup', onUp);
  });

  map.on('touchstart', 'point', (e)=> {
      if (e.points.length !== 1) return;
      if($('.mapboxgl-user-location-dot.mapboxgl-marker.mapboxgl-marker-anchor-center').length > 0) return;

      // Prevent the default map drag behavior.
      e.preventDefault();

      map.on('touchmove', onMove);
      map.once('touchend', onUp);
  });
});

// this is added with the sidebar (it would be repetive if i add it here, cause the sidebar checks if it is the right one to use)
// map.addControl(geocoder);
// map.addControl(userlocation);
