"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const maplibre_gl_1 = __importDefault(require("maplibre-gl/dist/maplibre-gl"));
const client_1 = require("react-dom/client");
function onLoad() {
    return __awaiter(this, void 0, void 0, function* () {
        const rootElement = document.getElementById('root');
        if (!rootElement)
            return;
        const root = (0, client_1.createRoot)(rootElement);
        root.render(<div>
            <weatherApp></weatherApp>
        </div>);
    });
}
const Map = () => {
    const [map, setMap] = (0, react_1.useState)(null);
    const handleClick = (e) => __awaiter(void 0, void 0, void 0, function* () {
        const lngLat = e.lngLat;
        const { data } = yield axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
            params: {
                lat: lngLat.lat,
                lon: lngLat.lng,
                appid: apiKey,
                units: 'metric', // Используем метрическую систему
            },
        });
        alert(`Weather: ${data.weather[0].main}, Temperature: ${data.main.temp}°C`);
    });
    useEffect(() => {
        const map = new maplibre_gl_1.default.Map({
            container: 'map',
            style: 'https://maps.geoapify.com/v1/styles/osm-bright/style.json',
            center: [0, 0],
            zoom: 2,
        });
        map.on('load', () => {
            setMap(map);
            map.on('click', 'background', handleClick);
        });
        return () => map.remove();
    }, []);
    return <div id="map" style={{ width: '100%', height: '400px' }}/>;
};
const weatherApp = () => {
    return (<div>
      <h1>Map with Weather</h1>
      <Map />
    </div>);
};
exports.default = weatherApp;
window.onload = onLoad;
