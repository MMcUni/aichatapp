import axios from "axios";

const WEATHER_API_URL = "https://api.open-meteo.com/v1/forecast";
const GEOCODING_API_URL = "https://geocoding-api.open-meteo.com/v1/search";

const DEFAULT_CITY = "Glasgow";
const DEFAULT_COORDS = { latitude: 55.8617, longitude: -4.2583 }; // Glasgow coordinates

export const geocodeCity = async (city) => {
  try {
    const response = await axios.get(GEOCODING_API_URL, {
      params: { name: city, count: 1 },
    });
    if (response.data.results && response.data.results.length > 0) {
      const result = response.data.results[0];
      return {
        latitude: result.latitude,
        longitude: result.longitude,
        name: result.name,
        country: result.country,
      };
    }
    throw new Error("City not found");
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
};

export const fetchWeatherData = async (latitude, longitude) => {
  try {
    const response = await axios.get(WEATHER_API_URL, {
      params: {
        latitude,
        longitude,
        hourly:
          "temperature_2m,relative_humidity_2m,precipitation_probability,weathercode",
        daily:
          "weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum",
        timezone: "auto",
        forecast_days: 7,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching weather data:", error);
    throw error;
  }
};

export const interpretWeatherCode = (code) => {
  const weatherCodes = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    95: "Thunderstorm",
    // Add more codes as needed
  };
  return weatherCodes[code] || "Unknown weather condition";
};

export const getLocationFromText = async (text) => {
  const cityMatch = text.match(/(?:in|for|at)\s+([A-Za-z\s]+)$/i);
  if (cityMatch) {
    const cityName = cityMatch[1].trim();
    const location = await geocodeCity(cityName);
    return (
      location || {
        ...DEFAULT_COORDS,
        name: DEFAULT_CITY,
        country: "United Kingdom",
      }
    );
  }
  return { ...DEFAULT_COORDS, name: DEFAULT_CITY, country: "United Kingdom" };
};
