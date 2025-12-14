//INITIALIZE MAP

const map = L.map('map').setView([20, 10], 2);

// Base Layer (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 6,
  attribution: '© OpenStreetMap contributors'
}).addTo(map);


// CHOROPLETH: GLOBAL INTERNET USERS

const geojsonUrl = 'data/Final-Woldmap.geojson';

// Color scale for all maps (Internet, 5G, 3G)
function getColor(value) {
  return value > 90 ? '#0c2c84' :
         value > 75 ? '#225ea8' :
         value > 60 ? '#1d91c0' :
         value > 45 ? '#41b6c4' :
         value > 30 ? '#7fcdbb' :
         value > 15 ? '#c7e9b4' :
                      '#f2e6b8';
}

function styleInternet(feature) {
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



// FOCUS COUNTRY LAYER (Netherlands + Chad)

const focusCountries = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Netherlands", role: "High access" },
      geometry: { type: "Point", coordinates: [5.3, 52.1] }
    },
    {
      type: "Feature",
      properties: { name: "Chad", role: "Low access" },
      geometry: { type: "Point", coordinates: [18.7, 15.5] }
    }
  ]
};

const focusLayer = L.geoJSON(focusCountries, {
  pointToLayer: (feature, latlng) => {
    return L.circleMarker(latlng, {
      radius: 10,
      fillColor: feature.properties.role === 'High access' ? '#006d2c' : '#a50f15',
      color: '#fff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.9
    });
  },
  onEachFeature: (feature, layer) => {
    layer.bindPopup(`<strong>${feature.properties.name}</strong><br>${feature.properties.role}`);
    layer.bindTooltip(feature.properties.name, {
      permanent: true,
      direction: 'top',
      className: 'country-label'
    });
  }
}).addTo(map);



// HOVER INTERACTIONS

function highlightFeature(e) {
  const layer = e.target;
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

function onEachCountry(feature, layer) {
  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight
  });

  layer.bindPopup(`
    <strong>${feature.properties.NAME}</strong><br>
    Internet users: ${feature.properties.daten_neu_2023}%
  `);
}


// LAYER CONTROL

let layerControl;

fetch(geojsonUrl)
  .then(res => res.json())
  .then(data => {
    choroplethLayer = L.geoJSON(data, {
      style: styleInternet,
      onEachFeature: onEachCountry
    }).addTo(map);

    layerControl = L.control.layers(
      null,
      {
        "Internet users (choropleth)": choroplethLayer,
        "Focus countries": focusLayer
      },
      { collapsed: false }
    ).addTo(map);
  });


// ZOOM FUNCTIONS

function zoomGlobal() {
  map.setView([20, 10], 2);
}

function zoomHigh() {
  map.setView([52.1, 5.3], 5);
}

function zoomLow() {
  map.setView([15.5, 18.7], 5);
}


// LEGEND

const legend = L.control({ position: 'bottomright' });

legend.onAdd = function () {
  const div = L.DomUtil.create('div', 'info legend');
  const grades = [0, 15, 30, 45, 60, 75, 90, 100];

  for (let i = 0; i < grades.length - 1; i++) {
    div.innerHTML +=
      `<i style="background:${getColor(grades[i] + 1)}"></i>
       ${grades[i]}–${grades[i + 1]}%<br>`;
  }

  return div;
};

legend.addTo(map);


// 5G COVERAGE LAYER

const map5gUrl = 'data/5g_map.geojson';

function get5GValue(feature) {
  return Number(feature.properties["5g_Column24"]);
}

function style5G(feature) {
  return {
    fillColor: getColor(get5GValue(feature)),
    weight: 1,
    opacity: 1,
    color: '#fff',
    fillOpacity: 0.7
  };
}

let layer5G;

fetch(map5gUrl)
  .then(res => res.json())
  .then(data => {
    layer5G = L.geoJSON(data, {
      style: style5G,
      onEachFeature: (feature, layer) => {
        function resetHighlight5G(e) {
          layer5G.resetStyle(e.target);
        }
        layer.on({
          mouseover: highlightFeature,
          mouseout: resetHighlight5G
        });

        layer.bindPopup(`
          <strong>${feature.properties.NAME}</strong><br>
          5G coverage: ${get5GValue(feature)}%
        `);
      }
    });

    // Add layer after layerControl exists
    const interval = setInterval(() => {
      if (layerControl) {
        layerControl.addOverlay(layer5G, "5G coverage (choropleth)");
        clearInterval(interval);
      }
    }, 100);
  });



// 3G COVERAGE LAYER

const map3gUrl = 'data/3g_final_map.geojson';

function get3GValue(feature) {
  return Number(feature.properties["3g_final_Column35"]);
}

function style3G(feature) {
  return {
    fillColor: getColor(get3GValue(feature)),
    weight: 1,
    opacity: 1,
    color: '#fff',
    fillOpacity: 0.7
  };
}

let layer3G;

fetch(map3gUrl)
  .then(res => res.json())
  .then(data => {
    layer3G = L.geoJSON(data, {
      style: style3G,
      onEachFeature: (feature, layer) => {
        function resetHighlight3G(e) {
          layer3G.resetStyle(e.target);
        }

        layer.on({
          mouseover: highlightFeature,
          mouseout: resetHighlight3G
        });

        layer.bindPopup(`
          <strong>${feature.properties.NAME}</strong><br>
          3G coverage: ${get3GValue(feature)}%
        `);
      }
    });

    const interval = setInterval(() => {
      if (layerControl) {
        layerControl.addOverlay(layer3G, "3G coverage (choropleth)");
        clearInterval(interval);
      }
    }, 100);
  });


// TOGGLE MAP LAYERS

function showInternet() {
  map.removeLayer(layer5G);
  map.removeLayer(layer3G);
  map.addLayer(choroplethLayer);
}

function show5G() {
  map.removeLayer(choroplethLayer);
  map.removeLayer(layer3G);
  map.addLayer(layer5G);
}

function show3G() {
  map.removeLayer(choroplethLayer);
  map.removeLayer(layer5G);
  map.addLayer(layer3G);
}


// DATA DOWNLOAD UTILITY

function downloadFile(url) {
  const link = document.createElement('a');
  link.href = url;
  link.download = url.split('/').pop();
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
