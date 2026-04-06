export async function fetchImageSearch(query: string, title?: string) {
  try {
    const searchRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&origin=*`);
    if (!searchRes.ok) throw new Error(`Wikipedia API error: ${searchRes.status}`);
    const searchData = await searchRes.json();
    
    if (searchData.query?.search?.length > 0) {
      const bestMatch = searchData.query.search[0].title;
      const imgRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(bestMatch)}&prop=pageimages&format=json&pithumbsize=800&origin=*`);
      if (!imgRes.ok) throw new Error(`Wikipedia Image API error: ${imgRes.status}`);
      const imgData = await imgRes.json();
      const pages = imgData.query?.pages;
      
      if (pages) {
        const pageId = Object.keys(pages)[0];
        if (pageId !== '-1' && pages[pageId].thumbnail) {
          return { success: true, data: pages[pageId].thumbnail.source, title: title || bestMatch };
        }
      }
    }
    
    // Fallback to Picsum if no Wikipedia image found
    return { success: true, data: `https://picsum.photos/seed/${encodeURIComponent(query)}/800/600`, title: title || query };
  } catch (e) {
    console.error("Image search failed:", e);
    return { success: false, error: "Eroare de conexiune la modulul de imagini." };
  }
}

export async function fetchWeather(location: string) {
  try {
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`);
    if (!geoRes.ok) throw new Error(`Geocoding API error: ${geoRes.status}`);
    const geoData = await geoRes.json();
    
    if (!geoData.results || geoData.results.length === 0) {
      return { success: false, error: "Locația nu a fost găsită." };
    }
    
    const { latitude, longitude, name, country } = geoData.results[0];
    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m,weather_code`);
    if (!weatherRes.ok) throw new Error(`Weather API error: ${weatherRes.status}`);
    const weatherData = await weatherRes.json();
    
    return { success: true, data: weatherData.current, title: `Vremea: ${name}, ${country}` };
  } catch (e) {
    console.error("Weather fetch failed:", e);
    return { success: false, error: "Eroare de conexiune la modulul meteo." };
  }
}

export async function fetchCrypto(coinId: string) {
  try {
    const normalizedId = coinId.toLowerCase().trim();
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(normalizedId)}&vs_currencies=usd&include_24hr_change=true`);
    if (!res.ok) throw new Error(`Crypto API error: ${res.status}`);
    const data = await res.json();
    
    if (data[normalizedId]) {
      let chartData = null;
      try {
        const chartRes = await fetch(`https://api.coingecko.com/api/v3/coins/${encodeURIComponent(normalizedId)}/market_chart?vs_currency=usd&days=7`);
        if (chartRes.ok) {
          const rawChart = await chartRes.json();
          if (rawChart.prices) {
            chartData = rawChart.prices.map((price: [number, number]) => ({
              name: new Date(price[0]).toLocaleDateString(),
              value: price[1]
            }));
          }
        }
      } catch (e) {
        console.error("Chart fetch failed:", e);
      }

      return { 
        success: true, 
        data: { ...data[normalizedId], chart: chartData }, 
        title: `Crypto: ${normalizedId.toUpperCase()}` 
      };
    }
    return { success: false, error: "Criptomoneda nu a fost găsită. Încearcă numele complet (ex: 'bitcoin', nu 'btc')." };
  } catch (e) {
    console.error("Crypto fetch failed:", e);
    return { success: false, error: "Eroare de conexiune la modulul crypto (posibil limită de cereri depășită)." };
  }
}

export async function fetchNews(category: string) {
  try {
    const normalizedCategory = category.toLowerCase().trim();
    let rssUrl = 'http://feeds.bbci.co.uk/news/rss.xml'; // general fallback
    
    if (normalizedCategory === 'technology' || normalizedCategory === 'tech') {
      rssUrl = 'https://techcrunch.com/feed/';
    } else if (normalizedCategory === 'business') {
      rssUrl = 'http://feeds.bbci.co.uk/news/business/rss.xml';
    } else if (normalizedCategory === 'sports') {
      rssUrl = 'http://feeds.bbci.co.uk/sport/rss.xml';
    } else if (normalizedCategory === 'science') {
      rssUrl = 'http://feeds.bbci.co.uk/news/science_and_environment/rss.xml';
    } else if (normalizedCategory === 'entertainment') {
      rssUrl = 'http://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml';
    } else if (normalizedCategory === 'world') {
      rssUrl = 'http://feeds.bbci.co.uk/news/world/rss.xml';
    }

    const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`);
    if (!res.ok) throw new Error(`News API error: ${res.status}`);
    const data = await res.json();
    
    if (data.items) {
      return { success: true, data: data.items.slice(0, 5), title: `NEWS: ${category.toUpperCase()}` };
    }
    return { success: false, error: "Nu s-au putut prelua știrile." };
  } catch (e) {
    console.error("News fetch failed:", e);
    return { success: false, error: "Eroare de conexiune la modulul de știri." };
  }
}
