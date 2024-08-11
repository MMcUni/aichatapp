import axios from "axios";

const NEWS_API_KEY = "XXeLT6dJG2RgO7NTBALD882ctzzBmuEmDvuGyG1a";
const NEWS_API_URL = "https://api.thenewsapi.com/v1/news/top";

/**
 * Fetches top news articles
 * @param {number} limit - Number of news articles to fetch (default: 5)
 * @returns {Promise<Array>} - Array of news articles
 */
export const fetchTopNews = async (limit = 5) => {
  try {
    const response = await axios.get(NEWS_API_URL, {
      params: {
        api_token: NEWS_API_KEY,
        locale: "us",
        language: "en",
        limit: limit,
      },
    });
    return response.data.data;
  } catch (error) {
    console.error("Error fetching news:", error);
    throw error;
  }
};
