import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './WeatherWidget.css';

const WeatherWidget = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [prevWeatherData, setPrevWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [city, setCity] = useState('New Delhi');
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    const fetchWeatherData = async () => {
      setLoading(true);
      setError(null);
      const apiKey = process.env.REACT_APP_WEATHER_API_KEY;

      try {
        const response = await fetch(
          `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}`
        );

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();

        // Only check for sudden changes if it's NOT a new city search
        if (prevWeatherData && prevWeatherData.location.name === data.location.name) {
          checkForSuddenChange(prevWeatherData, data);
        }

        setPrevWeatherData(data);
        setWeatherData(data);
      } catch (err) {
        setError(`Error fetching weather data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherData();

    const intervalId = setInterval(fetchWeatherData, 600000); // Refresh every 10 min

    return () => clearInterval(intervalId);
    // eslint-disable-next-line
  }, [city]);

  const checkForSuddenChange = (prevData, newData) => {
    const tempChange = Math.abs(newData.current.temp_c - prevData.current.temp_c);
    const windChange = Math.abs(newData.current.wind_kph - prevData.current.wind_kph);

    if (tempChange >= 5) {
      triggerAlert('Sudden Temperature Change', `Temperature changed by ${tempChange}°C!`);
    }

    if (windChange >= 20) {
      triggerAlert('High Wind Alert', `Wind speed changed by ${windChange} km/h!`);
    }
  };

  const triggerAlert = (title, message) => {
    setAlert({ title, message });

    setTimeout(() => setAlert(null), 5000);
  };

  return (
    <motion.div
      className="weather-widget"
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <h3>Weather Radar</h3>

      <motion.input
        type="text"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="Enter city name"
        className="city-input"
        whileFocus={{ scale: 1.05, boxShadow: "0 0 10px #8e44ad" }}
      />

      <div style={{ minHeight: 120 }}>
        <AnimatePresence mode="wait">
          {loading && (
            <motion.p
              key="loading"
              className="loading-message"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              Loading weather data...
            </motion.p>
          )}
          {error && !loading && (
            <motion.p
              key="error"
              className="error-message"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {error}
            </motion.p>
          )}
          {weatherData && !loading && !error && (
            <motion.div
              key={weatherData.location.name + weatherData.current.temp_c}
              className="weather-info"
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -20 }}
              transition={{ duration: 0.4 }}
              layout
            >
              <h4>{weatherData.location.name}, {weatherData.location.country}</h4>
              <p>Temperature: {weatherData.current.temp_c}°C</p>
              <p>Weather: {weatherData.current.condition.text}</p>
              <p>Humidity: {weatherData.current.humidity}%</p>
              <p>Wind Speed: {weatherData.current.wind_kph} km/h</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Alert Box - Only Appears When Sudden Changes Happen */}
      <AnimatePresence>
        {alert && (
          <motion.div
            className="weather-alert"
            key={alert.title + alert.message}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1.05 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ duration: 0.4 }}
            layout
          >
            <h4>{alert.title}</h4>
            <p>{alert.message}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default WeatherWidget;
