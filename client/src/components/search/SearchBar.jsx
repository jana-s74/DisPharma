import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const SearchBar = ({ compact = false, ecomStyle = false, onResults }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const timeoutRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) && !inputRef.current?.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (val.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    timeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/search?name=${encodeURIComponent(val)}`);
        const allItems = [...(res.data.own || []), ...(res.data.nearby || [])];
        // Deduplicate by medicineName
        const seen = new Set();
        const unique = allItems.filter((item) => {
          if (seen.has(item.medicineName.toLowerCase())) return false;
          seen.add(item.medicineName.toLowerCase());
          return true;
        });
        setSuggestions(unique.slice(0, 8));
        setShowDropdown(true);
        if (onResults) onResults(res.data);
      } catch (err) {
        // Silently fail for autocomplete
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setShowDropdown(false);
    }
  };

  const handleSuggestionClick = (name) => {
    setQuery(name);
    setShowDropdown(false);
    navigate(`/search?q=${encodeURIComponent(name)}`);
  };

  return (
    <div className="relative w-full">
      <form onSubmit={handleSearch} className="relative">
        <div className={`flex items-center gap-2 ${ecomStyle ? 'bg-white border-y border-slate-300 rounded-r-lg shadow-sm' : 'bg-slate-50 border border-slate-300 rounded-xl'} overflow-hidden focus-within:border-[#16a34a] focus-within:ring-2 focus-within:ring-[#16a34a]/20 transition-all duration-200 ${compact ? 'h-10' : 'h-12'}`}>
          <div className={`flex items-center justify-center ${compact ? 'px-3' : 'px-4'} ${ecomStyle ? 'text-slate-500' : 'text-slate-500'}`}>
            {loading ? (
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </div>
          <input
            ref={inputRef}
            id="global-search"
            type="text"
            value={query}
            onChange={handleChange}
            onFocus={() => query.length >= 2 && setShowDropdown(true)}
            placeholder="Search medicines across nearby pharmacies..."
            className={`flex-1 bg-transparent ${ecomStyle ? 'text-slate-900 placeholder-slate-400' : 'text-slate-900 placeholder-slate-500'} outline-none ${compact ? 'text-sm font-medium' : 'text-base'}`}
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setSuggestions([]); setShowDropdown(false); }}
              className={`${compact ? 'px-2' : 'px-3'} ${ecomStyle ? 'text-slate-500 hover:text-slate-600' : 'text-slate-500 hover:text-slate-700'} transition-colors`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <button
            type="submit"
            className={`${ecomStyle ? 'bg-[#16a34a] hover:bg-[#15803d]' : 'bg-blue-600 hover:bg-blue-500'} text-white font-bold tracking-wide ${compact ? 'px-6 py-2.5 text-sm' : 'px-5 py-3 text-sm'} transition-all duration-200`}
          >
            Search
          </button>
        </div>
      </form>

      {/* Autocomplete dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className={`absolute top-full left-0 right-0 mt-1 ${ecomStyle ? 'bg-white border-slate-200 shadow-xl text-slate-800' : 'bg-white border-slate-200 shadow-2xl text-slate-900'} border rounded-xl z-50 overflow-hidden animate-fade-in`}
        >
          {suggestions.map((item, i) => (
            <button
              key={i}
              onClick={() => handleSuggestionClick(item.medicineName)}
              className={`flex items-center justify-between w-full px-4 py-3 ${ecomStyle ? 'hover:bg-slate-50 border-slate-100' : 'hover:bg-slate-100 border-slate-200/30'} transition-all text-left border-b last:border-0`}
            >
              <div>
                <p className={`text-sm font-bold ${ecomStyle ? 'text-slate-800' : 'text-slate-900'}`}>{item.medicineName}</p>
                <p className={`text-xs ${ecomStyle ? 'text-slate-500' : 'text-slate-500'}`}>{item.medicalName}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-[#16a34a]">₹{item.sellPrice}</p>
                <p className={`text-xs ${ecomStyle ? 'text-slate-500' : 'text-slate-500'}`}>{item.distance}</p>
              </div>
            </button>
          ))}
          <button
            onClick={handleSearch}
            className={`flex items-center gap-2 w-full px-4 py-3 text-sm ${ecomStyle ? 'text-[#16a34a] hover:bg-green-50' : 'text-blue-400 hover:bg-blue-500/10'} transition-all font-bold`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search all results for "{query}"
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
