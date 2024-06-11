import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import Map from "./node_modules/react-map-gl/dist/es5/exports-maplibre";

const apiKey = "7594da6e724e73af8e10ae6f74a11090";
const mapStyle = "https://demotiles.maplibre.org/style.json";

const WeatherApp = () => {
  let onMapClick = (e: any) => {
    const latit = e.lngLat.lat;
    const longt = e.lngLat.lng;
    console.log(e.lngLat);
    const url = `http://api.openweathermap.org/data/2.5/weather?lat=${latit}&lon=${longt}&units=metric&appid=${apiKey}`;

    fetch(url).then((data) => {
      data.text().then((txt) => {
        let obj = JSON.parse(txt);

        alert(`
          temp: ${obj.main.temp},
          desc: ${obj.weather[0].description},
          feels_like: ${obj.main.feels_like},
          wind_speed: ${obj.wind.speed},
          country: ${obj.sys.country},
          name: ${obj.name}
          `);
      });
    });
  };

  let map = (
    <Map
      onClick={onMapClick}
      initialViewState={{
        longitude: -122.4,
        latitude: 37.8,
        zoom: 2,
      }}
      style={{ width: 1400, height: 600 }}
      mapStyle={mapStyle}
    />
  );
  return map;
};

async function onLoad() {
  const rootElement = document.getElementById("root");
  if (!rootElement) return;

  const root = createRoot(rootElement);
  root.render(
    <div>
      <WeatherApp></WeatherApp>
    </div>
  );
}

export default WeatherApp;
window.onload = onLoad;
