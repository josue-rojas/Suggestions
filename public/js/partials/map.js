mapboxgl.accessToken = 'pk.eyJ1Ijoid2l0aGNoZWVzZXBscyIsImEiOiJjams1cTkybmcwamo5M3FwMm5jMjdzdHl3In0.yI9WNY7aCdeQndyxbU9Amg';

// -------------------------------
// map objects initialize
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/withcheesepls/cjkoe5a7w02042ro8em58c1aj',
  center: location.hash.length == 0 ? [-73.9395,40.79] : [],
  zoom: 10,
  hash: true
});

const geocoder = new MapboxGeocoder({
  accessToken: mapboxgl.accessToken,
  localGeocoder: coordinatesGeocoder,
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

// marker is for custom animation instead of a normal circle
let markerDIV = document.createElement('div');
markerDIV.className = 'marker marker-draggable';
const marker = new mapboxgl.Marker(markerDIV)

let canvas = map.getCanvasContainer();

// keep track of which points are shown
let visible_points_state = {};

function setNewCoord(lng, lat){
  geojson.features[0].geometry.coordinates = [lng, lat];
  map.getSource('point').setData(geojson);
  $('span.coordinates').text(`${lng}, ${lat}`);
  marker.setLngLat(geojson.features[0].geometry.coordinates)
}

function addSuggestion(sug, prevSugg) {
  const suggestion = `
    <div class='suggestion' id='point${sug.id}'
      onclick='suggestionClick("point${sug.id}")'
      onmouseover='suggestionHover("point${sug.id}")'
      onmouseleave='suggestionLeave("point${sug.id}")'>
      <div class='color-block' style='background-color: ${sug.color}'></div>
      <div class='info-wrapper'>
        <h4 class='title'> ${sug.title} </h4>
        <p class='location'>${sug.longitude}, ${sug.latitude}</p>
        <p class='text'>${sug.text}</p>
      </div>
    </div>
  `
  // logic to keep the order (especially when expiration or time is added)
  // TODO: make adding transition smoother for ui
  const $previousElement = prevSugg === '' ? $('div.new-suggestion') : $(`#point${prevSugg}`);
  if($previousElement.length === 0) $('div.suggestions').append(suggestion);
  else $previousElement.after(suggestion);
}

function suggestionClick(id){
  const point_source = map.getSource(id);
  map.flyTo({center: point_source._data.features[0].geometry.coordinates, zoom: 12});
}

function suggestionHover(id){
  map.setPaintProperty(id, 'circle-opacity', 1);
}
function suggestionLeave(id){
  map.setPaintProperty(id, 'circle-opacity', .4);
}

function fetchPoints(bounds){
  // TODO: so there should remove request that are not neccessary, for example if the new bounds is smaller than the old bounds (or old bounds square contains the new bounds) then it is not neccessary to fetch
  fetch(`/suggestions/${bounds[0][0]}/${bounds[0][1]}/${bounds[1][0]}/${bounds[1][1]}`)
  .then(function(res){return res.json()})
  .then((data)=>{
    // for now just add points
    // TODO: later make clusters, maybe (not sure yet)
    let prevID = '';
    let new_visible_state = {};
    // TODO make faster (i think https://www.mapbox.com/mapbox-gl-js/example/data-driven-lines/ this should help) instead of adding layers and sources just have one layer and source with multiple points
    data.forEach((e, i)=>{
      const point_id = `point${e.id}`;
      new_visible_state[point_id] = true;
      if(!(point_id in visible_points_state)){
        map.addLayer({
          "id": point_id,
          "type": "circle",
          "source": {
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
          },
          "paint": {
              "circle-radius": {
                'base': 1,
                'stops': [[7, 10], [15, 7]]
              },
              "circle-color": e.color,
              "circle-opacity": .4,
          }
        });
        map.on('mouseenter', point_id, ()=>{
          map.setPaintProperty(point_id, 'circle-opacity', 1);
          canvas.style.cursor = 'pointer';
        });
        map.on('mouseleave', point_id, ()=> {
          map.setPaintProperty(point_id, 'circle-opacity', .5);
          canvas.style.cursor = '';
        });
        map.on('click', point_id, (e)=>{
          suggestionClick(point_id);
        })
        // addSuggestion is from suggestion partial
        addSuggestion(e, prevID);
      }
      else delete visible_points_state[point_id];
      prevID = point_id
    });
    // after loop it should have deleted all that are visible from the previous state and all that is left is the ones that are not visible so lets handle that
    // TODO: delete transition should be smooth in ui
    for(let key in visible_points_state){
      map.removeLayer(key);
      map.removeSource(key);
      map.off('mouseenter', key);
      map.off('mouseleave', key);
      map.off('click', key);
      $(`#${key}`).remove();
    }
    // finally set the new fetch data as visible data
    visible_points_state = new_visible_state;
  });
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

function onMove(e) {
  var coords = e.lngLat;
  // Set a UI indicator for dragging.
  canvas.style.cursor = 'grabbing';
  // Update the Point feature in `geojson` coordinates
  // and call setData to the source layer `point` on it.
  setNewCoord(coords.lng, coords.lat);
}

function onUp(e) {
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
  fetchPoints(bounds);

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
        "circle-radius": 7.5,
        "circle-opacity": 0
    }
  });

  marker.setLngLat(geojson.features[0].geometry.coordinates)
  marker.addTo(map);

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

map.on('moveend',(data, error)=>{
  const bounds = map.getBounds().toArray();
  fetchPoints(bounds);
});

// TODO need to change marker style when userlocation end
// this might be a bit hard since the event is trigger when the map is moved but still leaves the userlocation
// i was thinking of added two checks and keep track if it still is active.
// the first is if the map is drag and the user is active it did not end
// this will cause the location button to be clicked twice to end
// if it is not drag and the button is clicked it will end and remove the pulse point
// ANOTHER method is to have an event listener for changes on the div on the map that holds the pulse point for location

// this is added with the sidebar (it would be repetive if i add it here, cause the sidebar checks if it is the right one to use)
// map.addControl(geocoder);
// map.addControl(userlocation);
