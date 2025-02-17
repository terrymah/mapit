// Use the global configFile variable (or default to 'config.json')
fetch(window.configFile || 'config.json')
  .then(response => response.json())
  .then(config => {
    // Set title.
    if (config.title) {
      document.title = config.title;
      document.getElementById('title').textContent = config.title;
    }
    // Set background color for the map container.
    document.getElementById('map').style.backgroundColor = config.background_color || '#ffffff';

    const interactive = config.scrollable;
    const quizMode = config.quiz === true;

    // Define onEachFeature function based on mode.
    let onEachFeature;
    if (quizMode) {
      // Make the config available to quiz.js.
      window.quizConfig = config;
      onEachFeature = quizOnEachFeature;
    } else {
      onEachFeature = function(feature, layer) {
        // In normal mode, clicking navigates to a URL.
        layer.on('click', function(e) {
          const featureConfig = config.features.find(f => f[config.key] === feature.properties[config.key]);
          const url = (featureConfig && featureConfig.url) ? featureConfig.url : feature.properties[config.key] + ".html";
          window.location.href = url;
        });
        // Apply hover effects if enabled.
        if (config.hover_effect === undefined || config.hover_effect) {
          layer.on({
            mouseover: function(e) {
              e.target.bringToFront();
              e.target.setStyle({ fillOpacity: 1, weight: 3 });
            },
            mouseout: function(e) {
              geoLayer.resetStyle(e.target);
            }
          });
        }
      };
    }

    // Initialize the Leaflet map.
    const map = L.map('map', {
      center: [35.0, -80.0],
      zoom: 7,
      dragging: interactive,
      scrollWheelZoom: interactive,
      doubleClickZoom: interactive,
      boxZoom: interactive,
      keyboard: interactive,
      zoomControl: interactive,
      zoomAnimation: false
    });

    // Resize handler: on window resize, invalidate size and re-fit bounds.
    window.addEventListener('resize', function() {
      setTimeout(() => {
        map.invalidateSize();
        if (geoLayer) {
          map.fitBounds(geoLayer.getBounds(), { animate: false });
        }
      }, 200);
    });

    // Add a background map if enabled.
    if (config.background_map) {
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
    }

    // Define a style function for GeoJSON features.
    function styleFeature(feature) {
      if (quizMode) {
        // In quiz mode, ignore configured colors.
        return {
          color: '#000000',
          fillColor: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.5
        };
      } else {
        const featureConfig = config.features.find(f => f[config.key] === feature.properties[config.key]);
        const fillColor = (featureConfig && featureConfig.color) ? featureConfig.color : '#ffffff';
        const borderColor = (featureConfig && featureConfig.border_color) ? featureConfig.border_color : '#000000';
        return {
          color: borderColor,
          fillColor: fillColor,
          weight: 2,
          opacity: 1,
          fillOpacity: 0.5
        };
      }
    }

    let geoLayer;
    // Load the GeoJSON file.
    fetch(config.geojson_file)
      .then(res => res.json())
      .then(geojsonData => {
        geoLayer = L.geoJSON(geojsonData, {
          style: styleFeature,
          onEachFeature: onEachFeature
        }).addTo(map);

        map.fitBounds(geoLayer.getBounds(), { animate: false });

        // If in quiz mode, initialize quiz logic.
        if (quizMode) {
          initQuiz(geoLayer, config);
        }
      });
  })
  .catch(error => {
    console.error("Error loading configuration or GeoJSON:", error);
  });
