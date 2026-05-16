import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation, Navigate, useParams } from 'react-router-dom';
import { Briefcase, MapPin, Calendar, CheckSquare, Plus, LogOut, Trash2, ChevronRight, Cloud, Wind, Thermometer, User, Package, ListChecks, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import api from './services/api';
import { generatePackingList } from './services/gemini';
import { WeatherPreview } from './components/WeatherPreview';
import { fetchWeather } from './services/weatherApi';


// --- Constants ---

const DESTINATIONS = [
  // --- North America ---
  "New York City, USA", "Los Angeles, USA", "Chicago, USA", "Houston, USA", "Phoenix, USA", "Philadelphia, USA", "San Antonio, USA", "San Diego, USA", "Dallas, USA", "San Jose, USA", 
  "Austin, USA", "Jacksonville, USA", "Fort Worth, USA", "Columbus, USA", "Charlotte, USA", "San Francisco, USA", "Indianapolis, USA", "Seattle, USA", "Denver, USA", "Washington D.C., USA", 
  "Boston, USA", "El Paso, USA", "Nashville, USA", "Detroit, USA", "Oklahoma City, USA", "Portland, USA", "Las Vegas, USA", "Memphis, USA", "Louisville, USA", "Baltimore, USA", 
  "Milwaukee, USA", "Albuquerque, USA", "Tucson, USA", "Fresno, USA", "Sacramento, USA", "Mesa, USA", "Kansas City, USA", "Atlanta, USA", "Long Beach, USA", "Omaha, USA", 
  "Raleigh, USA", "Colorado Springs, USA", "Miami, USA", "Virginia Beach, USA", "Oakland, USA", "Minneapolis, USA", "Tulsa, USA", "Arlington, USA", "New Orleans, USA", "Wichita, USA",
  "Toronto, Canada", "Montreal, Canada", "Vancouver, Canada", "Calgary, Canada", "Ottawa, Canada", "Edmonton, Canada", "Quebec City, Canada", "Winnipeg, Canada", "Victoria, Canada", "Halifax, Canada",
  "Mexico City, Mexico", "Guadalajara, Mexico", "Monterrey, Mexico", "Cancun, Mexico", "Tijuana, Mexico", "Leon, Mexico", "Puebla, Mexico", "Merida, Mexico", "San Luis Potosi, Mexico", "Hermosillo, Mexico",
  "Honolulu, USA", "Anchorage, USA", "Salt Lake City, USA", "Pittsburgh, USA", "St. Louis, USA", "Orlando, USA", "Tampa, USA", "Cincinnati, USA", "Cleveland, USA", "Buffalo, USA",
  "Vancouver, USA", "Salt Lake City, USA", "Sacramento, USA", "Richmond, USA", "Providence, USA", "Oakland, USA", "Memphis, USA", "Madison, USA", "Little Rock, USA", "Lincoln, USA",

  // --- Europe ---
  "London, UK", "Paris, France", "Berlin, Germany", "Madrid, Spain", "Rome, Italy", "Amsterdam, Netherlands", "Vienna, Austria", "Prague, Czechia", "Budapest, Hungary", "Brussels, Belgium", 
  "Stockholm, Sweden", "Lisbon, Portugal", "Warsaw, Poland", "Athens, Greece", "Dublin, Ireland", "Copenhagen, Denmark", "Helsinki, Finland", "Oslo, Norway", "Zurich, Switzerland", "Geneva, Switzerland", 
  "Munich, Germany", "Frankfurt, Germany", "Hamburg, Germany", "Barcelona, Spain", "Seville, Spain", "Milan, Italy", "Florence, Italy", "Venice, Italy", "Naples, Italy", "Lyon, France", 
  "Marseille, France", "Nice, France", "Bordeaux, France", "Toulouse, France", "Strasbourg, France", "Krakow, Poland", "Porto, Portugal", "Antwerp, Belgium", "Rotterdam, Netherlands", "Edinburgh, UK", 
  "Glasgow, UK", "Belfast, UK", "Luxembourg City, Luxembourg", "Monaco", "San Marino", "Vaduz, Liechtenstein", "Reykjavik, Iceland", "Tallinn, Estonia", "Riga, Latvia", "Vilnius, Lithuania",
  "Manchester, UK", "Birmingham, UK", "Liverpool, UK", "Leeds, UK", "Bristol, UK", "Cologne, Germany", "Dusseldorf, Germany", "Stuttgart, Germany", "Valencia, Spain", "Malaga, Spain",
  "Bilbao, Spain", "Turin, Italy", "Palermo, Italy", "Genoa, Italy", "Bologna, Italy", "Verona, Italy", "Bern, Switzerland", "Basel, Switzerland", "Lausanne, Switzerland", "Salzburg, Austria",
  "Innsbruck, Austria", "Ghent, Belgium", "Bruges, Belgium", "Utrecht, Netherlands", "Eindhoven, Netherlands", "Gothenburg, Sweden", "Malmo, Sweden", "Bergen, Norway", "Stavanger, Norway", 
  "Aarhus, Denmark", "Lille, France", "Nantes, France", "Montpellier, France", "Rennes, France", "Reims, France",
  "Alicante, Spain", "Granada, Spain", "Cordoba, Spain", "Toledo, Spain", "Pisa, Italy", "Siena, Italy", "Bari, Italy", "Catania, Italy", "Turku, Finland", "Tampere, Finland",

  // --- Asia ---
  "Tokyo, Japan", "Osaka, Japan", "Nagoya, Japan", "Kyoto, Japan", "Sapporo, Japan", "Fukuoka, Japan", "Yokohama, Japan", "Hiroshima, Japan", "Sendai, Japan", "Nara, Japan",
  "Seoul, South Korea", "Busan, South Korea", "Incheon, South Korea", "Daegu, South Korea", "Daejeon, South Korea", "Gwangju, South Korea", "Ulsan, South Korea",
  "Beijing, China", "Shanghai, China", "Guangzhou, China", "Shenzhen, China", "Hong Kong", "Macau", "Chengdu, China", "Hangzhou, China", "Wuhan, China", "Xian, China", "Nanjing, China",
  "Taipei, Taiwan", "Kaohsiung, Taiwan", "Taichung, Taiwan",
  "Bangkok, Thailand", "Phuket, Thailand", "Pattaya, Thailand", "Chiang Mai, Thailand", "Koh Samui, Thailand", "Krabi, Thailand", "Hua Hin, Thailand",
  "Singapore",
  "Kuala Lumpur, Malaysia", "Penang, Malaysia", "Kota Kinabalu, Malaysia", "Malacca, Malaysia", "Johor Bahru, Malaysia",
  "Jakarta, Indonesia", "Bali, Indonesia", "Surabaya, Indonesia", "Medan, Indonesia", "Bandung, Indonesia", "Yogyakarta, Indonesia",
  "Manila, Philippines", "Cebu City, Philippines", "Boracay, Philippines", "Davao City, Philippines", "Palawan, Philippines",
  "Hanoi, Vietnam", "Ho Chi Minh City, Vietnam", "Da Nang, Vietnam", "Hoi An, Vietnam", "Nha Trang, Vietnam", "Hue, Vietnam",
  "Mumbai, India", "Delhi, India", "Bangalore, India", "Hyderabad, India", "Chennai, India", "Kolkata, India", "Jaipur, India", "Udaipur, India", "Ahmedabad, India", "Pune, India",
  "Karachi, Pakistan", "Lahore, Pakistan", "Islamabad, Pakistan",
  "Dhaka, Bangladesh",
  "Colombo, Sri Lanka", "Kandy, Sri Lanka", "Galle, Sri Lanka",
  "Kathmandu, Nepal", "Pokhara, Nepal",
  "Phnom Penh, Cambodia", "Siem Reap, Cambodia",
  "Vientiane, Laos", "Luang Prabang, Laos",
  "Yangon, Myanmar", "Mandalay, Myanmar",
  "Macau, China", "Ulaanbaatar, Mongolia", "Tashkent, Uzbekistan", "Almaty, Kazakhstan", "Bishkek, Kyrgyzstan", "Dushanbe, Tajikistan", "Ashgabat, Turkmenistan", "Male, Maldives",

  // --- Middle East & North Africa ---
  "Dubai, UAE", "Abu Dhabi, UAE", "Sharjah, UAE",
  "Mecca, Saudi Arabia", "Medina, Saudi Arabia", "Riyadh, Saudi Arabia", "Jeddah, Saudi Arabia", "Dammam, Saudi Arabia",
  "Doha, Qatar",
  "Kuwait City, Kuwait",
  "Manama, Bahrain",
  "Muscat, Oman", "Salalah, Oman",
  "Tehran, Iran", "Isfahan, Iran", "Shiraz, Iran",
  "Baghdad, Iraq", "Erbil, Iraq",
  "Amman, Jordan", "Petra, Jordan", "Aqaba, Jordan",
  "Beirut, Lebanon",
  "Tel Aviv, Israel", "Jerusalem, Israel", "Haifa, Israel",
  "Cairo, Egypt", "Alexandria, Egypt", "Sharm El Sheikh, Egypt", "Luxor, Egypt", "Aswan, Egypt", "Hurghada, Egypt",
  "Casablanca, Morocco", "Marrakech, Morocco", "Tangier, Morocco", "Rabat, Morocco", "Fes, Morocco", "Agadir, Morocco",
  "Tunis, Tunisia", "Hammamet, Tunisia",
  "Algiers, Algeria", "Oran, Algeria",
  "Baku, Azerbaijan", "Yerevan, Armenia", "Tbilisi, Georgia", "Nur-Sultan, Kazakhstan",

  // --- Sub-Saharan Africa ---
  "Johannesburg, South Africa", "Cape Town, South Africa", "Durban, South Africa", "Pretoria, South Africa", "Port Elizabeth, South Africa",
  "Nairobi, Kenya", "Mombasa, Kenya",
  "Lagos, Nigeria", "Abuja, Nigeria",
  "Addis Ababa, Ethiopia",
  "Accra, Ghana",
  "Dakar, Senegal",
  "Luanda, Angola",
  "Dar es Salaam, Tanzania", "Zanzibar City, Tanzania", "Arusha, Tanzania",
  "Kampala, Uganda",
  "Harare, Zimbabwe", "Victoria Falls, Zimbabwe",
  "Windhoek, Namibia",
  "Gaborone, Botswana",
  "Antananarivo, Madagascar",
  "Mauritius", "Seychelles",
  "Kigali, Rwanda", "Lusaka, Zambia", "Lilongwe, Malawi", "Maputo, Mozambique", "Libreville, Gabon", "Brazzaville, Congo", "Kinshasa, DR Congo",

  // --- Oceania ---
  "Sydney, Australia", "Melbourne, Australia", "Brisbane, Australia", "Perth, Australia", "Adelaide, Australia", "Canberra, Australia", "Hobart, Australia", "Darwin, Australia", "Gold Coast, Australia", "Cairns, Australia",
  "Auckland, New Zealand", "Wellington, New Zealand", "Christchurch, New Zealand", "Queenstown, New Zealand", "Dunedin, New Zealand",
  "Suva, Fiji", "Nadi, Fiji",
  "Port Moresby, Papua New Guinea",
  "Apia, Samoa", "Honiara, Solomon Islands", "Port Vila, Vanuatu", "Noumea, New Caledonia", "Papeete, French Polynesia",

  // --- South & Central America ---
  "Sao Paulo, Brazil", "Rio de Janeiro, Brazil", "Brasilia, Brazil", "Salvador, Brazil", "Fortaleza, Brazil", "Belo Horizonte, Brazil", "Manaus, Brazil", "Curitiba, Brazil", "Recife, Brazil",
  "Buenos Aires, Argentina", "Cordoba, Argentina", "Rosario, Argentina", "Mendoza, Argentina", "Bariloche, Argentina",
  "Santiago, Chile", "Valparaiso, Chile", "Punta Arenas, Chile",
  "Bogota, Colombia", "Medellin, Colombia", "Cartagena, Colombia", "Cali, Colombia", "Santa Marta, Colombia",
  "Lima, Peru", "Cusco, Peru", "Arequipa, Peru",
  "Quito, Ecuador", "Guayaquil, Ecuador", "Cuenca, Ecuador", "Galapagos, Ecuador",
  "Caracas, Venezuela",
  "Montevideo, Uruguay", "Punta del Este, Uruguay",
  "Asuncion, Paraguay",
  "La Paz, Bolivia", "Santa Cruz, Bolivia", "Uyuni, Bolivia",
  "Panama City, Panama",
  "San Jose, Costa Rica",
  "Guatemala City, Guatemala", "Antigua, Guatemala",
  "Managua, Nicaragua",
  "San Salvador, El Salvador",
  "Tegucigalpa, Honduras",
  "Belize City, Belize",
  "San Juan, Puerto Rico", "Santo Domingo, Dominican Republic", "Havana, Cuba", "Kingston, Jamaica", "Nassau, Bahamas", "Port-of-Spain, Trinidad and Tobago",

  // --- Countries ---
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", 
  "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", 
  "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", 
  "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", 
  "Croatia", "Cuba", "Cyprus", "Czechia", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", 
  "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", 
  "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", 
  "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", 
  "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", 
  "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", 
  "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", 
  "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", 
  "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", 
  "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", 
  "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", 
  "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", 
  "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", 
  "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", 
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States of America", "Uruguay", "Uzbekistan", "Vanuatu", "Venezuela", "Vietnam", 
  "Yemen", "Zambia", "Zimbabwe"
];

// --- Components ---

const Button = ({ className, variant = 'primary', ...props }: any) => {
  const variants: any = {
    primary: 'bg-black text-white hover:bg-gray-800',
    secondary: 'bg-white text-black border border-black hover:bg-gray-100',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100',
  };
  return (
    <button
      className={cn(
        'px-4 py-2 rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2',
        variants[variant],
        className
      )}
      {...props}
    />
  );
};

const Input = ({ className, ...props }: any) => (
  <input
    className={cn(
      'w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 transition-all',
      className
    )}
    {...props}
  />
);

const Card = ({ children, className }: any) => (
  <div className={cn('bg-white rounded-2xl border border-gray-100 shadow-sm p-6', className)}>
    {children}
  </div>
);

// --- Pages ---

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isLongEnough = password.length >= 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isLogin) {
      if (!hasUppercase || !hasLowercase || !hasSymbol || !isLongEnough) {
        setError('Please meet all password requirements.');
        return;
      }
    }

    try {
      const endpoint = isLogin ? '/login' : '/register';
      const { data } = await api.post(endpoint, { email, password });
      if (isLogin) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = '/';
      } else {
        setIsLogin(true);
        alert('Registration successful! Please login.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package size={32} />
          </div>
          <h1 className="text-2xl font-bold">Packing Pal</h1>
          <p className="text-gray-500">{isLogin ? 'Welcome back!' : 'Create your account'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <Input type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} required />
            {!isLogin && (
              <div className="mt-2 space-y-1">
                <p className={cn("text-xs flex items-center gap-1", isLongEnough ? "text-green-600" : "text-gray-400")}>
                  <span className={cn("w-1 h-1 rounded-full", isLongEnough ? "bg-green-600" : "bg-gray-400")} />
                  At least 8 characters
                </p>
                <p className={cn("text-xs flex items-center gap-1", hasUppercase ? "text-green-600" : "text-gray-400")}>
                  <span className={cn("w-1 h-1 rounded-full", hasUppercase ? "bg-green-600" : "bg-gray-400")} />
                  One uppercase letter (A-Z)
                </p>
                <p className={cn("text-xs flex items-center gap-1", hasLowercase ? "text-green-600" : "text-gray-400")}>
                  <span className={cn("w-1 h-1 rounded-full", hasLowercase ? "bg-green-600" : "bg-gray-400")} />
                  One lowercase letter (a-z)
                </p>
                <p className={cn("text-xs flex items-center gap-1", hasSymbol ? "text-green-600" : "text-gray-400")}>
                  <span className={cn("w-1 h-1 rounded-full", hasSymbol ? "bg-green-600" : "bg-gray-400")} />
                  One symbol (!@#$%^&*)
                </p>
              </div>
            )}
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button type="submit" className="w-full" disabled={!isLogin && (!hasUppercase || !hasLowercase || !hasSymbol || !isLongEnough)}>
            {isLogin ? 'Login' : 'Register'}
          </Button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-500">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button onClick={() => setIsLogin(!isLogin)} className="text-black font-semibold hover:underline">
            {isLogin ? 'Register' : 'Login'}
          </button>
        </p>
      </Card>
    </div>
  );
};

const TripGrid = ({ title, items, onNavigate, onDelete }: { title: string, items: any[], onNavigate: (id: number) => void, onDelete: (id: number) => void }) => (
  <div className="mb-12">
    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
      {title}
      <span className="text-sm font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
        {items.length}
      </span>
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.map((trip: any) => (
        <motion.div
          layoutId={`trip-${trip.id}`}
          key={trip.id}
          className="group relative"
        >
          <Card 
            className="hover:border-black transition-colors h-full cursor-pointer"
            onClick={() => onNavigate(trip.id)}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-black group-hover:text-white transition-colors">
                <Briefcase size={24} />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(trip.id);
                  }}
                  className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  title="Delete Trip"
                >
                  <Trash2 size={18} />
                </button>
                <ChevronRight size={20} className="text-gray-300 group-hover:text-black transition-colors" />
              </div>
            </div>
            <h3 className="text-xl font-bold mb-1">{trip.destination}</h3>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                {new Date(trip.start_date).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1 uppercase tracking-wider text-[10px] font-bold bg-gray-100 px-2 py-0.5 rounded">
                {trip.trip_type}
              </span>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  </div>
);

const Dashboard = ({ trips, fetchTrips, onDeleteTrip }: { trips: any[], fetchTrips: () => void, onDeleteTrip: (id: number) => void }) => {
  const navigate = useNavigate();

  const now = new Date();
  const upcomingTrips = trips.filter(trip => new Date(trip.end_date) >= now);
  const pastTrips = trips.filter(trip => new Date(trip.end_date) < now);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Trips</h1>
          <p className="text-gray-500">Plan your next adventure</p>
        </div>
        <Button onClick={() => navigate('/new-trip')}>
          <Plus size={20} />
          New Trip
        </Button>
      </div>

      {trips.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed rounded-3xl border-gray-200">
          <Package className="mx-auto mb-4 text-gray-300" size={48} />
          <p className="text-gray-400">No trips planned yet.</p>
        </div>
      ) : (
        <>
          {upcomingTrips.length > 0 && (
            <TripGrid 
              title="Upcoming Trips" 
              items={upcomingTrips} 
              onNavigate={(id) => navigate(`/trip/${id}`)} 
              onDelete={onDeleteTrip}
            />
          )}
          {pastTrips.length > 0 && (
            <TripGrid 
              title="Past Trips" 
              items={pastTrips} 
              onNavigate={(id) => navigate(`/trip/${id}`)} 
              onDelete={onDeleteTrip}
            />
          )}
        </>
      )}
    </div>
  );
};

const NewTrip = ({ onTripCreated }: { onTripCreated: (trip?: any) => void }) => {
  const [destination, setDestination] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [tripType, setTripType] = useState('leisure');
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [weatherPreview, setWeatherPreview] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (destination.length < 3) {
        setSuggestions([]);
        setWeatherPreview(null);
        return;
      }
      try {
        const { data } = await api.get(`/geocode?q=${destination}`);
        setSuggestions(data);
        
        // Fetch weather preview for the first suggestion or the destination itself
        try {
          const response = await fetchWeather(destination);
          if (response.success && response.data && response.data.days && response.data.days.length > 0) {
            const day = response.data.days[0];
            const forecast = day.noon || day.morning || day.night;
            if (forecast) {
              setWeatherPreview(`${forecast.condition}, ${Math.round(forecast.temp)}°C`);
            }
          } else {
            setWeatherPreview(null);
          }
        } catch (err) {
          setWeatherPreview(null);
        }
      } catch (err) {
        console.error("Geocoding error", err);
      }
    };

    const timer = setTimeout(fetchSuggestions, 500);
    return () => clearTimeout(timer);
  }, [destination]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Date Validation
    if (new Date(endDate) < new Date(startDate)) {
      alert("End date cannot be before start date.");
      return;
    }

    setLoading(true);
    try {
      // 1. Weather Summary (Graceful degradation for unrecognized cities)
      let weatherSummary = weatherPreview || "Weather data unavailable for this location";
      
      let hasRain = false;
      
      if (!weatherPreview) {
        try {
          const response = await fetchWeather(destination);
          if (response.success && response.data && response.data.days && response.data.days.length > 0) {
            const day = response.data.days[0];
            const forecast = day.noon || day.morning || day.night;
            if (forecast) {
              weatherSummary = `${forecast.condition}, ${Math.round(forecast.temp)}°C`;
            }
            hasRain = response.data.days.some(d => d.morning?.hasRain || d.noon?.hasRain || d.night?.hasRain);
          }
        } catch (err) {
          console.warn("Could not fetch weather for this destination", err);
          // We continue anyway per user requirement to accept any place
        }
      } else {
        // If we already had weather preview, we should quickly check rain status
        try {
          const response = await fetchWeather(destination);
          if (response.success && response.data && response.data.days) {
             hasRain = response.data.days.some(d => d.morning?.hasRain || d.noon?.hasRain || d.night?.hasRain);
          }
        } catch (e) {}
      }
      
      if (hasRain) {
        weatherSummary += " (Rain is expected! Ensure raincoat and umbrella are packed.)";
      }

      // 2. Generate Smart Packing List
      let items = [
        { name: 'Passport', category: 'Documents' },
        { name: 'Phone Charger', category: 'Electronics' },
        { name: 'Walking Shoes', category: 'Clothing' }
      ];
      
      if (hasRain) {
        items.push({ name: 'Umbrella', category: 'Essentials' });
        items.push({ name: 'Raincoat', category: 'Clothing' });
      }

      try {
        const duration = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) || 1;
        const aiItems = await generatePackingList(destination, tripType, duration, weatherSummary);
        if (aiItems && aiItems.length > 0) {
          items = aiItems;
        }
      } catch (err) {
        console.error("AI Generation failed, using defaults", err);
      }

      // 3. Save Trip (Instant UI Response)
      const tempId = `local-${Date.now()}`;
      const localTrip = {
        id: tempId,
        destination,
        start_date: startDate,
        end_date: endDate,
        trip_type: tripType,
        weather_summary: weatherSummary,
        items: items.map((it, idx) => ({ ...it, id: idx + 1000, is_packed: 0 }))
      };

      // Immediate Navigation
      onTripCreated(localTrip);
      navigate(`/trip/${tempId}`);

      // Fire and forget server sync (Non-blocking)
      api.post('/trips', {
        destination,
        start_date: startDate,
        end_date: endDate,
        trip_type: tripType,
        weather_summary: weatherSummary,
        items
      }).catch(err => console.warn("Background sync failed, but trip exists locally.", err));
    } catch (err: any) {
      console.error("Full error object:", err);
      let message = 'Failed to create trip. Please try again.';
      
      if (err.response?.data?.error) {
        message = err.response.data.error;
      } else if (err.message) {
        message = err.message;
      }
      
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Button variant="ghost" onClick={() => navigate('/')} className="mb-6">
        Back to Dashboard
      </Button>
      
      <Card>
        <h1 className="text-2xl font-bold mb-6">Plan New Trip</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <label className="block text-sm font-medium mb-1">Where are you going?</label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                <Search className="text-gray-400 group-focus-within:text-black transition-colors" size={18} />
                <div className="w-[1px] h-4 bg-gray-200" />
              </div>
              <Input 
                className="pl-12 pr-4 py-3" 
                placeholder="Search city or country..." 
                value={destination} 
                list="city-suggestions"
                onChange={(e: any) => {
                  setDestination(e.target.value);
                  setShowSuggestions(true);
                }} 
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                required 
              />
              <datalist id="city-suggestions">
                {DESTINATIONS.map(dest => (
                  <option key={dest} value={dest} />
                ))}
              </datalist>
            </div>
            <p className="mt-2 text-xs text-gray-400 flex items-center gap-1">
              <MapPin size={12} />
              Type any city or country worldwide.
            </p>
            
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors border-b border-gray-50 last:border-0"
                    onClick={() => {
                      setDestination(`${s.name}, ${s.country}`);
                      setShowSuggestions(false);
                    }}
                  >
                    <MapPin size={16} className="text-gray-400" />
                    <div>
                      <p className="font-bold text-sm">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.state ? `${s.state}, ` : ''}{s.country}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {weatherPreview && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-3 text-blue-900"
            >
              <Cloud size={20} className="text-blue-500" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-500">Weather Preview</p>
                <p className="font-medium">{weatherPreview}</p>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <Input type="date" value={startDate} onChange={(e: any) => setStartDate(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <Input type="date" value={endDate} onChange={(e: any) => setEndDate(e.target.value)} required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Trip Type</label>
            <div className="grid grid-cols-3 gap-2">
              {['business', 'leisure', 'hiking', 'beach', 'winter'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTripType(type)}
                  className={cn(
                    "px-4 py-2 rounded-xl border text-sm font-medium capitalize transition-all",
                    tripType === type ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full py-4 text-lg" disabled={loading}>
            {loading ? 'Generating Smart List...' : 'Create Trip'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

const TripDetail = ({ trips, setTrips }: { trips: any[], setTrips: (t: any[]) => void }) => {
  const { id } = useParams();
  const [trip, setTrip] = useState<any>(null);
  const [newItem, setNewItem] = useState('');
  const [newCategory, setNewCategory] = useState('Essentials');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const localTrip = trips.find(t => String(t.id) === String(id));
    
    if (localTrip && localTrip.items && localTrip.items.length > 0) {
      setTrip(localTrip);
      setLoading(false);
    } else {
      setLoading(true);
      fetchTrip();
    }
  }, [id, trips.length]); // Only re-run if id changes or number of trips changes

  const fetchTrip = async () => {
    try {
      const { data } = await api.get(`/trips/${id}`);
      setTrip(data);
    } catch (err) {
      console.error("Failed to fetch trip", err);
      // If we can't find it locally or on server, it might be deleted or invalid
      if (!trip) navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = async (itemId: any, currentStatus: number) => {
    // Optimistic local update
    setTrip({
      ...trip,
      items: trip.items.map((item: any) => 
        item.id === itemId ? { ...item, is_packed: !currentStatus ? 1 : 0 } : item
      )
    });

    if (String(id).startsWith('local-')) return;

    try {
      await api.patch(`/items/${itemId}`, { is_packed: !currentStatus });
    } catch (err) {
      console.error("Failed to sync item status", err);
    }
  };

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;

    const tempItemId = Date.now();
    const newItemObj = { id: tempItemId, name: newItem, category: newCategory, is_packed: 0 };

    setTrip({
      ...trip,
      items: [...trip.items, newItemObj]
    });
    setNewItem('');

    if (String(id).startsWith('local-')) return;

    try {
      await api.post(`/trips/${id}/items`, { name: newItem, category: newCategory });
    } catch (err) {
      console.error("Failed to sync new item", err);
    }
  };

  const deleteItem = async (itemId: any) => {
    setTrip({
      ...trip,
      items: trip.items.filter((item: any) => item.id !== itemId)
    });

    if (String(id).startsWith('local-')) return;

    try {
      await api.delete(`/items/${itemId}`);
    } catch (err) {
      console.error("Failed to sync item deletion", err);
    }
  };

  const deleteTrip = (tripId?: any) => {
    const targetId = tripId || id;
    if (!confirm('Are you sure you want to delete this trip?')) return;
    
    // Immediate state update for demo
    const updatedTrips = trips.filter((t: any) => String(t.id) !== String(targetId));
    setTrips(updatedTrips);
    
    // Instant navigation back to dashboard
    navigate('/');

    // Backend call bypassed for demo purposes
    /*
    try {
      if (!String(targetId).startsWith('local-')) {
        api.delete(`/trips/${targetId}`);
      }
    } catch (err) {
      console.warn("Backend sync bypassed for demo.", err);
    }
    */
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!trip) return null;

  const categories = Array.from(new Set(trip.items.map((i: any) => i.category)));
  const packedCount = trip.items.filter((i: any) => i.is_packed).length;
  const progress = Math.round((packedCount / trip.items.length) * 100) || 0;

  return (
    <div className="max-w-4xl mx-auto p-6 pb-24">
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" onClick={() => navigate('/')}>
          Back
        </Button>
        <Button variant="danger" onClick={deleteTrip}>
          <Trash2 size={18} />
          Delete Trip
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">{trip.destination}</h1>
              <p className="text-gray-500 flex items-center gap-2 mt-1">
                <Calendar size={16} />
                {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest">
                {trip.trip_type}
              </span>
            </div>
          </div>
          
          <div className="mt-6">
            <div className="flex justify-between text-sm font-bold mb-2">
              <span>Packing Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-black"
              />
            </div>
          </div>
        </Card>

        <WeatherPreview city={trip.destination} />
      </div>

      <div className="space-y-8">
        {categories.map((cat: any) => (
          <section key={cat}>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-black rounded-full" />
              {cat}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <AnimatePresence>
                {trip.items.filter((i: any) => i.category === cat).map((item: any) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-2xl border transition-all",
                      item.is_packed ? "bg-gray-50 border-gray-100 opacity-60" : "bg-white border-gray-100 shadow-sm"
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => toggleItem(item.id, item.is_packed)}>
                      <div className={cn(
                        "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors",
                        item.is_packed ? "bg-black border-black text-white" : "border-gray-200"
                      )}>
                        {item.is_packed && <CheckSquare size={14} />}
                      </div>
                      <span className={cn("font-medium", item.is_packed && "line-through")}>{item.name}</span>
                    </div>
                    <button onClick={() => deleteItem(item.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>
        ))}
      </div>

      {/* Add Item Form */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6">
        <Card className="shadow-2xl border-gray-200">
          <form onSubmit={addItem} className="flex gap-2">
            <Input 
              placeholder="Add custom item..." 
              value={newItem} 
              onChange={(e: any) => setNewItem(e.target.value)}
            />
            <select 
              value={newCategory} 
              onChange={(e: any) => setNewCategory(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium focus:outline-none"
            >
              <option>Essentials</option>
              <option>Clothing</option>
              <option>Toiletries</option>
              <option>Electronics</option>
              <option>Documents</option>
            </select>
            <Button type="submit">Add</Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<any[]>([]);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
    setLoading(false);
  }, []);

  const fetchTrips = async (newTrip?: any) => {
    if (newTrip) {
      setTrips(prev => {
        const exists = prev.find(t => String(t.id) === String(newTrip.id));
        if (exists) return prev;
        return [newTrip, ...prev];
      });
      setHasFetched(true);
      return; // Bypass server fetch when adding a local trip
    }

    try {
      const { data } = await api.get('/trips');
      setTrips(data);
    } catch (err) {
      console.error("Failed to fetch trips:", err);
    } finally {
      setHasFetched(true);
    }
  };

  useEffect(() => {
    if (user && !hasFetched) {
      fetchTrips();
    }
  }, [user, hasFetched]);

  const handleDeleteTrip = (id: number) => {
    if (!confirm('Are you sure you want to delete this trip?')) return;
    
    // Immediate state update for demo
    setTrips(prev => prev.filter(t => String(t.id) !== String(id)));

    // Backend delete bypassed for demo
    /*
    try {
      api.delete(`/trips/${id}`);
    } catch (err) {
       console.warn("Backend delete bypassed for demo", err);
    }
    */
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-black">
      {user && (
        <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl">
              <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center">
                <Package size={18} />
              </div>
              Packing Pal
            </Link>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-gray-500">
                <User size={16} />
                {user.email}
              </div>
              <button onClick={logout} className="p-2 text-gray-400 hover:text-black transition-colors">
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </nav>
      )}

      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <AuthPage />} />
        <Route path="/" element={user ? <Dashboard trips={trips} fetchTrips={fetchTrips} onDeleteTrip={handleDeleteTrip} /> : <Navigate to="/login" />} />
        <Route path="/new-trip" element={user ? <NewTrip onTripCreated={fetchTrips} /> : <Navigate to="/login" />} />
        <Route path="/trip/:id" element={user ? <TripDetail trips={trips} setTrips={setTrips} /> : <Navigate to="/login" />} />
      </Routes>
    </div>
  );
}
