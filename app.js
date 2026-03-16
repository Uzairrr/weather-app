const WMO_CONDITIONS = {
  0: "Clear Sky", 1: "Mainly Clear", 2: "Partly Cloudy", 3: "Overcast",
  45: "Foggy", 48: "Icy Fog",
  51: "Light Drizzle", 53: "Drizzle", 55: "Heavy Drizzle",
  61: "Light Rain", 63: "Rain", 65: "Heavy Rain",
  71: "Light Snow", 73: "Snow", 75: "Heavy Snow",
  80: "Rain Showers", 81: "Showers", 82: "Heavy Showers",
  95: "Thunderstorm", 96: "Thunderstorm + Hail",
};

const WMO_ICONS = {
  0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️",
  45: "🌫️", 48: "🌫️",
  51: "🌦️", 53: "🌧️", 55: "🌧️",
  61: "🌧️", 63: "🌧️", 65: "🌧️",
  71: "🌨️", 73: "❄️", 75: "❄️",
  80: "🌦️", 81: "🌦️", 82: "⛈️",
  95: "⛈️", 96: "⛈️",
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const errorEl   = document.getElementById("error");
const emptyEl   = document.getElementById("empty");
const resultsEl = document.getElementById("results");

cityInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") fetchWeather();
});
searchBtn.addEventListener("click", fetchWeather);

async function fetchWeather() {
  const query = cityInput.value.trim();
  if (!query) return;

  setLoading(true);
  hideAll();

  try {
    const city = await geocode(query);
    if (!city) {
      showError("City not found. Try another name.");
      return;
    }

    const weather = await getWeather(city.latitude, city.longitude);
    renderWeather(city.name, weather);
    resultsEl.hidden = false;

  } catch (err) {
    showError("Failed to fetch weather. Please try again.");
  } finally {
    setLoading(false);
  }
}

async function geocode(query) {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`
  );
  const data = await res.json();
  return data.results?.[0] ?? null;
}

async function getWeather(lat, lon) {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
    `&wind_speed_unit=mph&timezone=auto`
  );
  return res.json();
}

function renderWeather(cityName, data) {
  const c = data.current;
  const d = data.daily;

  document.getElementById("cityName").textContent    = "📍 " + cityName;
  document.getElementById("tempVal").textContent     = Math.round(c.temperature_2m);
  document.getElementById("conditionVal").textContent = getCondition(c.weather_code);
  document.getElementById("feelsLike").textContent   = Math.round(c.apparent_temperature) + "°C";
  document.getElementById("humidity").textContent    = c.relative_humidity_2m + "%";
  document.getElementById("wind").textContent        = Math.round(c.wind_speed_10m) + " mph";

  document.getElementById("forecast").innerHTML = d.time
    .map((date, i) => `
      <div class="day-row">
        <span class="day-name ${i === 0 ? "today" : ""}">${i === 0 ? "Today" : DAYS[new Date(date).getDay()]}</span>
        <span class="day-icon">${getIcon(d.weather_code[i])}</span>
        <span class="day-cond">${getCondition(d.weather_code[i])}</span>
        <div class="day-temps">
          <span class="day-high">${Math.round(d.temperature_2m_max[i])}°</span>
          <span class="day-low">${Math.round(d.temperature_2m_min[i])}°</span>
        </div>
      </div>`)
    .join("");
}

function getCondition(code) { return WMO_CONDITIONS[code] ?? "Unknown"; }
function getIcon(code)      { return WMO_ICONS[code] ?? "🌡️"; }

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.hidden = false;
  emptyEl.hidden = false;
}

function hideAll() {
  errorEl.hidden = true;
  emptyEl.hidden = true;
  resultsEl.hidden = true;
}

function setLoading(loading) {
  searchBtn.disabled    = loading;
  searchBtn.textContent = loading ? "..." : "Search";
}
