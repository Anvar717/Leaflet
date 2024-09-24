<template>
  <div>
    <div id="map" ref="mapElement"></div>
    <div v-if="showDialog" class="dialog">
      <div class="dialog-content">
        <h2>{{ selectedRegion }}</h2>
        <img :src="selectedImage" alt="Region Image" class="region-image" />
        <p>Batafsil ma'lumot: {{ selectedInfo }}</p>
        <button @click="closeDialog">Yopish</button>
      </div>
    </div>
  </div>
</template>

<script>
import { onMounted, ref } from "vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});
export default {
  name: "MapComponent",
  setup() {
    const mapElement = ref(null);
    const showDialog = ref(false);
    const selectedRegion = ref("");
    const selectedInfo = ref("");
    const selectedImage = ref("");
    const loading = ref(true);
    let map = null;
    let markerLayer = null;
    let boundaryLayer = null;

    const geojsonData = async () => {
      const response = await fetch("/assets/uzbekistan-regions.geojson");
      return await response.json();
    };

    const closeDialog = () => {
      showDialog.value = false;
      selectedRegion.value = "";
      selectedInfo.value = "";
      selectedImage.value = "";
    };

    const getRegionImage = (regionName) => {
      const images = {
        "Toshkent sh.": "./city/tashkent.jpg",
        "Namangan viloyati": "./city/namangan.jpg",
        "Toshkent viloyati": "./city/tashkent-region.jpg",
        "Fargʻona viloyati": "./city/fargona.jpg",
        "Andijon viloyati": "./city/andijan.jpg",
        "Sirdaryo viloyati": "./city/syrdarya.jpg",
        "Jizzax viloyati": "./city/jizzax.jpg",
        "Navoiy viloyati": "./city/navoiy.jpg",
        "Samarqand viloyati": "./city/samarqand.jpg",
        "Qashqadaryo viloyati": "./city/qashqadarya.jpg",
        "Surxondaryo viloyati": "./city/surkhandarya.jpg",
        "Buxoro viloyati": "./city/bukhara.jpg",
        "Xorazm viloyati": "./city/kharazm.jpg",
        "Qoraqalpogʻiston Respublikasi": "./city/qaraqalpaq.jpg",
      };
      return images[regionName] || "./city/tashkent.jpg";
    };

    onMounted(() => {
      if (mapElement.value) {
        map = L.map(mapElement.value).setView([30, 30], 3);

        const osmLayer = L.tileLayer(
          "http://localhost:3000/tiles/{z}/{x}/{y}.png",
          {
            maxZoom: 19,
            noWrap: true,
          }
        ).addTo(map);

        // const imageUrl =
        //   "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT6DeTzjmwnRR1_t6sZQ_eixAjxFzUBrP2omg&s";
        // const latLngBounds = L.latLngBounds([
        //   [41.0, 73.0],
        //   [48.0, 87.0],
        // ]);

        // L.imageOverlay(imageUrl, latLngBounds, {
        //   opacity: 1,
        //   interactive: true,
        //   zIndex: 999,
        // }).addTo(map);

        // map.fitBounds(latLngBounds);

        const openMapLayer = L.tileLayer(
          "http://localhost:3000/opentopomaptiles/{z}/{x}/{y}.png",
          {
            maxZoom: 19,
            noWrap: true,
          }
        );

        const CartoDBLayer = L.tileLayer(
          "http://localhost:3000/cartotile/{z}/{x}/{y}.png",
          {
            maxZoom: 19,
            noWrap: true,
          }
        );

        const baseMaps = {
          OpenStreetMap: osmLayer,
          openMap: openMapLayer,
          CartoDB: CartoDBLayer,
        };

        L.control.layers(baseMaps).addTo(map);

        markerLayer = L.layerGroup();
        boundaryLayer = L.layerGroup();
        markerLayer.addTo(map);
        boundaryLayer.addTo(map);

        const regionColors = {
          "Tashkent city": "#FDEFEF",
          "Tashkent region": "#FDEFEF",
          "Samarkand region": "#FAF4B7",
          "Bukhara region": "#FFD9C0",
          "Andijan region": "#CDF0EA",
          "Namangan region": "#F7D6E0",
          "Fergana region": "#F9F3DF",
          "Kashkadarya region": "#E6C3C3",
          "Surkhandarya region": "#C5E1A5",
          "Jizzakh region": "#FFEB99",
          "Syrdarya region": "#D1C4E9",
          "Navoiy region": "#B3E5FC",
          "Khorezm region": "#FFCDD2",
          "Republic of Karakalpakstan": "#A5D6A7",
        };

        const defaultStyle = (feature) => {
          const regionName = feature.properties.ADM1_EN;
          const fillColor = regionColors[regionName] || "#E1F1DD";
          return {
            color: "#000",
            weight: 2,
            fillColor: fillColor,
            fillOpacity: 0.7,
          };
        };

        const highlightStyle = {
          weight: 4,
          color: "#666",
          fillOpacity: 0.9,
        };

        geojsonData().then((data) => {
          loading.value = false;
          L.geoJSON(data, {
            style: defaultStyle,
            onEachFeature: (feature, layer) => {
              layer.bindPopup(`<strong>${feature.properties.ADM1_UZ}</strong>`);
              layer.on("mouseover", (e) => {
                const regionName = feature.properties.ADM1_UZ;

                layer.setStyle({
                  ...highlightStyle,
                  weight: 8,
                });

                layer.openPopup();
                const coordinates = e.latlng;
                const hoverMarker = L.marker(coordinates)
                  .addTo(map)
                  .bindPopup(`<strong>${regionName}</strong>`)
                  .openPopup();
                layer.hoverMarker = hoverMarker;
              });

              layer.on("mouseout", () => {
                layer.setStyle(defaultStyle(feature));
                layer.closePopup();
                if (layer.hoverMarker) {
                  map.removeLayer(layer.hoverMarker);
                  layer.hoverMarker = null;
                }
              });

              layer.on("click", () => {
                selectedRegion.value = feature.properties.ADM1_UZ;
                selectedInfo.value = feature.info;
                selectedImage.value = getRegionImage(
                  feature.properties.ADM1_UZ
                );
                showDialog.value = true;
              });
            },
          }).addTo(map);
        });
      }
    });

    return {
      mapElement,
      showDialog,
      selectedRegion,
      selectedInfo,
      closeDialog,
      selectedImage,
      getRegionImage,
      loading,
    };
  },
};
</script>

<style>
html,
body {
  margin: 0;
  height: 100%;
  width: 100%;
}

#map {
  width: 100%;
  height: 100vh;
}

.dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.dialog-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  min-width: 400px;
  max-width: 800px;
  width: 90%;
}

.dialog-content h2 {
  margin: 0 0 10px;
}

.dialog-content p {
  margin: 0 0 20px;
}

.dialog-content button {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  background-color: #ff5733;
  color: white;
  cursor: pointer;
}

.dialog-content button:hover {
  background-color: #c70039;
}

.region-image {
  width: 100%;
  max-width: 400px;
  height: auto;
  min-height: 200px;
  max-height: 300px;
  margin-bottom: 20px;
  object-fit: cover;
}
</style>
