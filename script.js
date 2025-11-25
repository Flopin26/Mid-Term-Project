// Initialize the map
var map = L.map('map').setView([20, 10], 2);

// Base layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 6,
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// URL to your global GeoJSON
var geojsonUrl = 'data/Final-Woldmap.geojson';

// Color scale for internet use
function getColor(d) {
  return d > 90 ? '#0c2c84' :
         d > 75 ? '#225ea8' :
         d > 60 ? '#1d91c0' :
         d > 45 ? '#41b6c4' :
         d > 30 ? '#7fcdbb' :
         d > 15 ? '#c7e9b4' :
                  '#ffffcc';
}

function styleFeature(feature) {
  // convert string to number
  const v = Number(feature.properties.daten_neu_2023);

  return {
    fillColor: getColor(v),
    weight: 1,
    opacity: 1,
    color: '#fff',
    fillOpacity: 0.7
  };
}


// Focus countries GeoJSON stays the same
var focusCountries = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": { "name": "Netherlands", "role": "High access" },
      "geometry": { "type": "Point", "coordinates": [5.3, 52.1] }
    },
    {
      "type": "Feature",
      "properties": { "name": "Chad", "role": "Low access" },
      "geometry": { "type": "Point", "coordinates": [18.7, 15.5] }
    }
  ]
};

var focusLayer = L.geoJSON(focusCountries, {
  pointToLayer: function (feature, latlng) {
    return L.circleMarker(latlng, {
      radius: 10,  // slightly larger radius for visibility
      fillColor: feature.properties.role === 'High access' ? '#006d2c' : '#a50f15',
      color: '#fff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.9
    });
  },
  onEachFeature: function (feature, layer) {
    layer.bindPopup('<strong>' + feature.properties.name + '</strong><br>' + feature.properties.role);

    // Add permanent label above the marker
    layer.bindTooltip(feature.properties.name, {
      permanent: true,
      direction: 'top',
      className: 'country-label'
    }).openTooltip();
  }
}).addTo(map);


// Save your choropleth layer in a variable
let choroplethLayer;

// Hover highlight functions
function highlightFeature(e) {
  var layer = e.target;
  layer.setStyle({
    weight: 2,
    color: '#000',
    fillOpacity: 0.9
  });
  layer.bringToFront();
}

function resetHighlight(e) {
  choroplethLayer.resetStyle(e.target);
}

function onEachChoroplethFeature(feature, layer) {
  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight
  });

  layer.bindPopup(`
    <strong>${feature.properties.NAME}</strong><br>
    Internet users: ${feature.properties.daten_neu_2023}%
  `);
}

// Load global GeoJSON + add layer control after load
fetch(geojsonUrl)
  .then(res => res.json())
  .then(data => {
    choroplethLayer = L.geoJSON(data, {
      style: styleFeature,
      onEachFeature: onEachChoroplethFeature
    }).addTo(map);

    // Create layer control
    L.control.layers(
      null,
      {
        "Internet users (choropleth)": choroplethLayer,
        "Focus countries": focusLayer
      },
      { collapsed: false }
    ).addTo(map);
  });


  function zoomGlobal() {
  map.setView([20, 10], 2);
}

function zoomHigh() {
  map.setView([52.1, 5.3], 5);
}

function zoomLow() {
  map.setView([15.5, 18.7], 5);
}

// Legend
var legend = L.control({position: 'bottomright'});

legend.onAdd = function (map) {
  var div = L.DomUtil.create('div', 'info legend');
  var grades = [0, 15, 30, 45, 60, 75, 90];
  var labels = [];

  for (var i = 0; i < grades.length; i++) {
    div.innerHTML +=
      '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
      grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
  }

  return div;
};

legend.addTo(map);



