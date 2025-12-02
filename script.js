// =========================
// Initialize the map
// =========================
var map = L.map('map').setView([20, 10], 2);

// Base layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 6,
  attribution: '© OpenStreetMap contributors'
}).addTo(map);


// =========================
// Choropleth (World Map)
// =========================
var geojsonUrl = 'data/Final-Woldmap.geojson';

// Color scale for internet use
function getColor(d) {
  return d > 90 ? '#0c2c84' :
         d > 75 ? '#225ea8' :
         d > 60 ? '#1d91c0' :
         d > 45 ? '#41b6c4' :
         d > 30 ? '#7fcdbb' :
         d > 15 ? '#c7e9b4' :
                  '#f2e6b8';
}

function styleFeature(feature) {
  const v = Number(feature.properties.daten_neu_2023);
  return {
    fillColor: getColor(v),
    weight: 1,
    opacity: 1,
    color: '#fff',
    fillOpacity: 0.7
  };
}

let choroplethLayer;


// =========================
// Focus Countries Layer
// =========================
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
      radius: 10,
      fillColor: feature.properties.role === 'High access' ? '#006d2c' : '#a50f15',
      color: '#fff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.9
    });
  },
  onEachFeature: function (feature, layer) {
    layer.bindPopup('<strong>' + feature.properties.name + '</strong><br>' + feature.properties.role);
    layer.bindTooltip(feature.properties.name, {
      permanent: true,
      direction: 'top',
      className: 'country-label'
    }).openTooltip();
  }
}).addTo(map);


// =========================
// Hover highlight for choropleth
// =========================
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


// =========================
// Layer Control (saved in variable!)
// =========================
var layerControl;


// Load global GeoJSON + add layer control after load
fetch(geojsonUrl)
  .then(res => res.json())
  .then(data => {
    choroplethLayer = L.geoJSON(data, {
      style: styleFeature,
      onEachFeature: onEachChoroplethFeature
    }).addTo(map);

    // Create layer control NOW and save in variable
    layerControl = L.control.layers(
      null,
      {
        "Internet users (choropleth)": choroplethLayer,
        "Focus countries": focusLayer
      },
      { collapsed: false }
    ).addTo(map);
  });


// =========================
// Zoom Buttons
// =========================
function zoomGlobal() {
  map.setView([20, 10], 2);
}

function zoomHigh() {
  map.setView([52.1, 5.3], 5);
}

function zoomLow() {
  map.setView([15.5, 18.7], 5);
}


// =========================
// Legend
// =========================
var legend = L.control({position: 'bottomright'});

legend.onAdd = function (map) {
  var div = L.DomUtil.create('div', 'info legend');
  var grades = [0, 15, 30, 45, 60, 75, 90];

  for (var i = 0; i < grades.length; i++) {
    div.innerHTML +=
      '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
      grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
  }

  return div;
};
legend.addTo(map);


// =========================
// 5G MAP LAYER (using 5g_Column24)
// =========================

var map5gUrl = 'data/5g_map.geojson';

// Extract 5G percentage
function get5GValue(feature) {
  return Number(feature.properties["5g_Column24"]);
}

function style5G(feature) {
  const v = get5GValue(feature);
  return {
    fillColor: getColor(v),  // same color scale
    weight: 1,
    opacity: 1,
    color: '#fff',           // SAME white borders as internet map
    fillOpacity: 0.7        // SAME transparency
  };
}


var layer5G;

fetch(map5gUrl)
  .then(res => res.json())
  .then(data => {
    layer5G = L.geoJSON(data, {
      style: style5G,
      onEachFeature: function(feature, layer) {
        const v = get5GValue(feature);

        // Define a layer-specific reset function
        function resetHighlight5G(e) {
            layer5G.resetStyle(e.target);
        }

        layer.on({
          mouseover: highlightFeature,
          // Use the layer-specific reset function
          mouseout: resetHighlight5G
        });

        layer.bindPopup(`
          <strong>${feature.properties.NAME}</strong><br>
          5G coverage: ${v}%
        `);
      }
    });


    // Add 5G layer to layerControl once it's available
    let interval = setInterval(() => {
      if (layerControl) {
        layerControl.addOverlay(layer5G, "5G coverage (choropleth)");
        clearInterval(interval);
      }
    }, 100);
  });


  // =========================
// Toggle buttons
// =========================

function showInternet() {
  if (layer5G && map.hasLayer(layer5G)) {
    map.removeLayer(layer5G);
  }
  if (!map.hasLayer(choroplethLayer)) {
    map.addLayer(choroplethLayer);
  }
}

function show5G() {
  if (choroplethLayer && map.hasLayer(choroplethLayer)) {
    map.removeLayer(choroplethLayer);
  }
  if (!map.hasLayer(layer5G)) {
    map.addLayer(layer5G);
  }
}

function show3G() {
  if (choroplethLayer && map.hasLayer(choroplethLayer)) {
    map.removeLayer(choroplethLayer);
  }
  if (layer5G && map.hasLayer(layer5G)) {
    map.removeLayer(layer5G);
  }
  if (!map.hasLayer(layer3G)) {
    map.addLayer(layer3G);
  }
}
// =========================
// 3G MAP LAYER (using Column35)
// =========================

var map3gUrl = 'data/3g_final_map.geojson';

// Extract 3G percentage
function get3GValue(feature) {
  return Number(feature.properties["3g_final_Column35"]);
}

function style3G(feature) {
  const v = get3GValue(feature);
  return {
    fillColor: getColor(v),  // EXACT same color scale as Internet + 5G
    weight: 1,
    opacity: 1,
    color: '#fff',           // same borders
    fillOpacity: 0.7
  };
}

var layer3G;

// ... [EXISTING 3G MAP LAYER CODE] ...

fetch(map3gUrl)
  .then(res => res.json())
  .then(data => {
    layer3G = L.geoJSON(data, {
      style: style3G,
      onEachFeature: function(feature, layer) {
        const v = get3GValue(feature);
        
        // Define a layer-specific reset function
        function resetHighlight3G(e) {
            layer3G.resetStyle(e.target);
        }

        layer.on({
          mouseover: highlightFeature,
          // Use the layer-specific reset function
          mouseout: resetHighlight3G
        });

        layer.bindPopup(`
          <strong>${feature.properties.NAME}</strong><br>
          3G coverage: ${v}%
        `);
      }
    });

// ... [REST OF 3G CODE] ...


    // Add 3G layer to the layerControl once ready
    let interval = setInterval(() => {
      if (layerControl) {
        layerControl.addOverlay(layer3G, "3G coverage (choropleth)");
        clearInterval(interval);
      }
    }, 100);
  });

 function downloadFile(url) {
  const link = document.createElement('a');
  link.href = url;
  link.download = url.split('/').pop();  // filename only
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
