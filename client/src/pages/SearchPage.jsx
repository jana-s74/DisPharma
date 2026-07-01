import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import SearchResults from '../components/search/SearchResults';
import BillGenerator from '../components/billing/BillGenerator';

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const [results, setResults] = useState(null);
  const [exploreData, setExploreData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [exploreLoading, setExploreLoading] = useState(true);

  // Load nearby explore data on mount (and after bill generation)
  const loadExplore = async () => {
    setExploreLoading(true);
    try {
      const res = await api.get('/search/explore');
      setExploreData(res.data);
    } catch (err) {
      // silent
    } finally {
      setExploreLoading(false);
    }
  };

  useEffect(() => {
    loadExplore();
  }, []);

  // Run search when query param changes
  useEffect(() => {
    if (!query) {
      setResults(null);
      return;
    }
    const doSearch = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/search?name=${encodeURIComponent(query)}`);
        setResults(res.data);
      } catch (err) {
        setResults({ own: [], nearby: [] });
      } finally {
        setLoading(false);
      }
    };
    doSearch();
  }, [query]);

  console.log(exploreData, "sdnjsn")

  const handleSelect = (item) => {
    console.log(item, 'dsndskj')
    setSelectedItems((prev) => {
      const exists = prev.find((s) => s._id === item._id);
      if (exists) return prev.filter((s) => s._id !== item._id);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const handleQuantityChange = (id, qty) => {
    setSelectedItems((prev) =>
      prev.map((s) => s._id === id ? { ...s, quantity: qty } : s)
    );
  };

  const handleRemove = (id) => {
    setSelectedItems((prev) => prev.filter((s) => s._id !== id));
  };

  const handleClearAll = () => setSelectedItems([]);

  // Build explore-style results for display
  const exploreResults = {
    own: [],
    nearby: exploreData,
  };

  return (
    <div className={`space-y-6 ${selectedItems.length > 0 ? 'pb-40' : ''}`}>
      {/* Header */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Explore Medicines</h1>
        <p className="text-slate-500 mt-1 text-sm sm:text-base">Search across all nearby pharmacies or browse available stock</p>
      </div>

      {/* Current search badge */}
      {query && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Showing results for:</span>
          <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-sm px-3 py-0.5 rounded-full font-medium">
            "{query}"
          </span>
        </div>
      )}

      {/* Results */}
      {query ? (
        <SearchResults
          results={results}
          selectedItems={selectedItems}
          onSelect={handleSelect}
          loading={loading}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2.5 h-2.5 bg-[#16a34a] rounded-full animate-pulse" />
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Available Nearby</h2>
            {!exploreLoading && (
              <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{exploreData.length} products</span>
            )}
          </div>

          {exploreLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
                  <div className="w-full bg-slate-100" style={{ aspectRatio: '1/1' }} />
                  <div className="p-3 space-y-2">
                    <div className="h-3.5 bg-slate-100 rounded w-4/5" />
                    <div className="h-3 bg-slate-100/70 rounded w-3/5" />
                    <div className="flex justify-between pt-2 border-t border-slate-100">
                      <div className="h-5 bg-slate-100 rounded w-14" />
                      <div className="h-6 bg-slate-100 rounded w-14" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : exploreData.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
              <p className="text-6xl mb-4 opacity-50">🏥</p>
              <p className="text-xl font-bold text-slate-700">No nearby pharmacies found</p>
              <p className="text-slate-500 mt-2">Pharmacies with the same pincode will appear here</p>
            </div>
          ) : (
            <SearchResults
              results={exploreResults}
              selectedItems={selectedItems}
              onSelect={handleSelect}
              loading={false}
            />
          )}
        </div>
      )}

      {/* Sticky bill generator */}
      {selectedItems.length > 0 && (
        <BillGenerator
          selectedItems={selectedItems}
          onQuantityChange={handleQuantityChange}
          onRemove={handleRemove}
          onClearAll={handleClearAll}
          onBillGenerated={() => {
            // Refresh stock quantities after bill is generated
            loadExplore();
            if (query) {
              // Re-run search to refresh search results too
              api.get(`/search?name=${encodeURIComponent(query)}`)
                .then(r => setResults(r.data))
                .catch(() => { });
            }
          }}
        />
      )}
    </div>
  );
};

export default SearchPage;
