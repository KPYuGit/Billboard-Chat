import { NextRequest, NextResponse } from 'next/server';

// You will need to set these in your .env.local file
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

// Predefined location coordinates
const predefinedLocations: Record<string, { latitude: number; longitude: number }> = {
  'nyc': { latitude: 40.7128, longitude: -74.0060 },
  'sf': { latitude: 37.7749, longitude: -122.4194 },
  'baltimore': { latitude: 39.2904, longitude: -76.6122 }
};


// talking points based on weather
const weatherTalkingPointsMapping: Record<string, string[]> = {
  "hot": [
    "Hot weather ahead? ICF's climate resilience solutions can help communities prepare.",
    "Rising temperatures call for smart infrastructure. Let's build a resilient future together.",
    "Heat waves are intensifying. ICF helps organizations adapt with data-driven solutions.",
    "When temperatures soar, ICF's environmental consulting keeps communities cool and prepared.",
    "Hot weather patterns changing? ICF's climate analytics help predict and prepare.",
    "Summer heat waves require smart planning. ICF delivers innovative climate solutions.",
    "Rising temps, rising challenges. ICF's expertise helps organizations stay ahead.",
    "Heat waves demand resilient infrastructure. ICF builds tomorrow's smart systems today.",
    "Hot weather data tells a story. ICF turns insights into action.",
    "When the mercury rises, ICF's environmental solutions keep communities thriving.",
    "Hot days ahead? ICF's climate resilience strategies prepare you for anything.",
    "Temperature trends changing fast. ICF helps organizations adapt with confidence.",
  ],
  "rain": [ 
    "Rain or shine, ICF's technology solutions keep operations running smoothly.",
    "Stormy weather ahead? ICF's disaster management expertise helps communities prepare.",
    "Rain can't stop progress. ICF's digital solutions work in any weather.",
    "Wet weather patterns changing? ICF's climate analytics provide clear insights.",
    "Rain, data, and innovation. ICF transforms weather challenges into opportunities.",
    "Storm clouds gathering? ICF's resilience planning keeps organizations prepared.",
    "Rain or drought, ICF's environmental consulting delivers sustainable solutions."
  ],
  "normal": [
    "Perfect weather for innovation. ICF's technology solutions work year-round.",
    "Clear skies, clear vision. ICF helps organizations see the future of digital transformation.",
    "Beautiful day for progress. ICF's consulting expertise accelerates your success.",
    "Great weather for growth. ICF's strategic solutions help organizations thrive.",
    "Ideal conditions for advancement. ICF's data analytics unlock new possibilities.",
    "Perfect day for transformation. ICF delivers the future of technology today.",
  ]
};


// Determine weather category based on conditions and temperature
function getWeatherCategory({ weather, temp }: { weather: string, temp: number }): 'hot' | 'rain' | 'normal' {
  const weatherLower = weather.toLowerCase();
  
  if (weatherLower.includes('rain') || weatherLower.includes('drizzle') || weatherLower.includes('shower')) {
    return 'rain';
  }
  
  if (weatherLower.includes('hot') || temp > 80) {
    return 'hot';
  }
  
  return 'normal';
}

export async function POST(req: NextRequest) {
  try {
    // Check for location parameter in URL
    const url = new URL(req.url);
    const locationParam = url.searchParams.get('location');
    
    let latitude: number;
    let longitude: number;
    
    if (locationParam && predefinedLocations[locationParam.toLowerCase()]) {
      // Use predefined location coordinates
      const coords = predefinedLocations[locationParam.toLowerCase()];
      latitude = coords.latitude;
      longitude = coords.longitude;
    } else {
      // Use coordinates from request body
      const body = await req.json();
      latitude = body.latitude;
      longitude = body.longitude;
      
      if (!latitude || !longitude) {
        return NextResponse.json({ error: 'Missing latitude or longitude' }, { status: 400 });
      }
    }

    // Reverse geocode to get zip code using Nominatim
    const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`, {
      headers: { 'User-Agent': 'smart-billboard-v2/1.0' }
    });
    const geoData = await geoRes.json();
    const zipCode = geoData.address?.postcode;

    // Baltimore zip code mapping
    const zipMapping = [
      {
        "zip_code": "21201",
        "neighborhood": ["Downtown", "Mount Vernon", "Seton Hill"],
        "highlight": ["historic", "cultural landmarks", "arts", "education", "diverse community"]
      },
      {
        "zip_code": "21202",
        "neighborhood": ["Inner Harbor", "Little Italy", "Jonestown"],
        "highlight": ["waterfront", "tourism", "dining", "nightlife", "Italian-American community"]
      },
      {
        "zip_code": "21205",
        "neighborhood": ["Middle East", "Milton-Montford", "Madison-Eastend"],
        "highlight": ["Johns Hopkins", "medical", "revitalization", "development", "African-American community"]
      },
      {
        "zip_code": "21206",
        "neighborhood": ["Frankford", "Waltherson", "Cedonia"],
        "highlight": ["residential", "parks", "community", "diverse housing", "African-American community"]
      },
      {
        "zip_code": "21209",
        "neighborhood": ["Mount Washington", "Cheswolde", "Cross Keys"],
        "highlight": ["suburban", "shopping", "recreation", "Jones Falls Trail", "Jewish community"]
      },
      {
        "zip_code": "21210",
        "neighborhood": ["Roland Park", "Wyndhurst", "Tuscany-Canterbury"],
        "highlight": ["historic homes", "tree-lined", "Johns Hopkins", "university proximity", "affluent community"]
      },
      {
        "zip_code": "21211",
        "neighborhood": ["Hampden", "Medfield", "Remington"],
        "highlight": ["arts", "shops", "festivals", "HonFest", "creative community"]
      },
      {
        "zip_code": "21212",
        "neighborhood": ["Homeland", "Govans", "Mid-Govans"],
        "highlight": ["historic homes", "education", "shopping", "residential mix", "diverse community"]
      },
      {
        "zip_code": "21213",
        "neighborhood": ["Belair-Edison", "Clifton Park", "Broadway East"],
        "highlight": ["parks", "residential", "African-American community", "revitalization"]
      },
      {
        "zip_code": "21214",
        "neighborhood": ["Hamilton", "Lauraville"],
        "highlight": ["arts", "residential", "gardening", "family-friendly", "diverse community"]
      },
      {
        "zip_code": "21215",
        "neighborhood": ["Park Heights", "Pimlico", "Arlington"],
        "highlight": ["Pimlico Race Course", "African-American community", "revitalization", "residential"]
      },
      {
        "zip_code": "21216",
        "neighborhood": ["Walbrook", "Forest Park", "Hanlon-Longwood"],
        "highlight": ["historic", "residential", "African-American community", "parks"]
      },
      {
        "zip_code": "21217",
        "neighborhood": ["Druid Hill Park", "Reservoir Hill", "Bolton Hill"],
        "highlight": ["parks", "historic homes", "arts", "diverse community"]
      },
      {
        "zip_code": "21218",
        "neighborhood": ["Waverly", "Charles Village", "Barclay"],
        "highlight": ["Johns Hopkins University", "education", "arts", "diverse community"]
      },
      {
        "zip_code": "21223",
        "neighborhood": ["Poppleton", "Union Square", "Hollins Market"],
        "highlight": ["historic", "African-American community", "revitalization", "residential"]
      },
      {
        "zip_code": "21224",
        "neighborhood": ["Highlandtown", "Canton", "Brewers Hill"],
        "highlight": ["arts", "dining", "Polish-American community", "revitalization"]
      },
      {
        "zip_code": "21225",
        "neighborhood": ["Brooklyn", "Cherry Hill", "Curtis Bay"],
        "highlight": ["industrial", "African-American community", "residential", "revitalization"]
      },
      {
        "zip_code": "21226",
        "neighborhood": ["Curtis Bay", "Hawkins Point"],
        "highlight": ["industrial", "port", "residential", "revitalization"]
      },
      {
        "zip_code": "21229",
        "neighborhood": ["Irvington", "Beechfield", "Saint Josephs"],
        "highlight": ["residential", "parks", "diverse community", "revitalization"]
      },
      {
        "zip_code": "21230",
        "neighborhood": ["Federal Hill", "Locust Point", "Riverside"],
        "highlight": ["waterfront", "historic", "young professionals", "dining", "Irish-American community"]
      },
      {
        "zip_code": "21231",
        "neighborhood": ["Fells Point", "Upper Fells Point", "Butchers Hill"],
        "highlight": ["historic", "waterfront", "dining", "arts", "diverse community"]
      },
      {
        "zip_code": "21239",
        "neighborhood": ["Loch Raven", "Northwood", "Perring Loch"],
        "highlight": ["residential", "education", "parks", "African-American community"]
      },
      {
        "zip_code": "21251",
        "neighborhood": ["Morgan State University"],
        "highlight": ["education", "African-American community", "university"]
      },
      {
        "zip_code": "21287",
        "neighborhood": ["Johns Hopkins Hospital"],
        "highlight": ["medical", "education", "research", "diverse community"]
      }
    ];
    let neighborhoodInfo = '';
    let match;
    if (zipCode) {
      match = zipMapping.find(z => z.zip_code === zipCode);
      if (match) {
        const neighborhoods = match.neighborhood;
        const randomNeighborhood = neighborhoods[Math.floor(Math.random() * neighborhoods.length)];
        neighborhoodInfo = `Neighborhood: ${randomNeighborhood}. Highlights: ${match.highlight.join(", ")}.`;
      }
    }

    // Fetch weather data
    const weatherRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${WEATHER_API_KEY}&units=imperial`
    );
    const weatherData = await weatherRes.json();
    if (!weatherRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch weather' }, { status: 500 });
    }

    const location = weatherData.name;
    const weather = weatherData.weather?.[0]?.description || 'unknown weather';
    const temp = Math.round(weatherData.main?.temp);

    // Get weather category and corresponding talking points
    const weatherCategory = getWeatherCategory({ weather, temp });
    const weatherTalkingPoints = weatherTalkingPointsMapping[weatherCategory] || [];
    let selectedTalkingPoint = '';
    if (weatherTalkingPoints.length > 0) {
      selectedTalkingPoint = weatherTalkingPoints[Math.floor(Math.random() * weatherTalkingPoints.length)];
    }

    // Generate message using OpenAI
    const prompt = `You are a smart billboard for ICF (International Consulting Firm). Create a warm, friendly greeting or observation (less than 8 words) for people passing by, using this info: location: ${location}, ${neighborhoodInfo}. Do not mention specific ICF services or programs. Do not use phrases like 'Welcome to' or anything that implies the audience is a visitor. Avoid slogans, taglines, or advertisements. Make it sound like a genuine, casual greeting or observation for anyone in the area that reflects ICF's professional, innovative spirit.`;

    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 60,
      }),
    });
    const aiData = await aiRes.json();
    if (!aiRes.ok) {
      return NextResponse.json({ error: 'Failed to generate message' }, { status: 500 });
    }

    const messageRaw = aiData.choices?.[0]?.message?.content?.trim() || 'Welcome!';
    // Remove leading/trailing quotes (single or double)
    let message = messageRaw.replace(/^['"]+|['"]+$/g, '');
    // Replace all straight single quotes with curly right single quote
    message = message.replace(/'/g, '’');
    // Append the weather-based talking point as a new sentence
    if (selectedTalkingPoint) {
      message = message.trim();
      if (!/[.!?]$/.test(message)) message += '.';
      message += ' ' + selectedTalkingPoint;
    }
    return NextResponse.json({ 
      message,
      location: location
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 