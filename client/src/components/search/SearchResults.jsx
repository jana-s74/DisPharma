import ProductCard from './ProductCard';

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
    {/* Image skeleton */}
    <div className="w-full bg-slate-100" style={{ aspectRatio: '1/1' }} />
    {/* Info skeleton */}
    <div className="p-3 space-y-2">
      <div className="h-3.5 bg-slate-100 rounded w-4/5" />
      <div className="h-3 bg-slate-100/70 rounded w-3/5" />
      <div className="h-3 bg-slate-100/50 rounded w-2/5" />
      <div className="flex justify-between items-center pt-2 border-t border-slate-100">
        <div className="h-5 bg-slate-100 rounded w-16" />
        <div className="h-7 bg-slate-100 rounded w-16" />
      </div>
    </div>
  </div>
);

const SearchResults = ({ results, selectedItems, onSelect, loading }) => {
  const { own = [], nearby = [], recommendations = [] } = results || {};

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {[...Array(12)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (!results) {
    return (
      <div className="text-center py-20 text-slate-400">
        <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <p className="text-lg font-semibold text-slate-500">Search for medicines</p>
        <p className="text-sm mt-1">Find stock across nearby pharmacies</p>
      </div>
    );
  }

  if (own.length === 0 && nearby.length === 0 && recommendations.length === 0) {
    return (
      <div className="text-center py-20 text-slate-400">
        <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-lg font-semibold text-slate-500">No medicines found</p>
        <p className="text-sm mt-1">Try a different name or check nearby pharmacies</p>
      </div>
    );
  }

  const isSelected = (item) => selectedItems.some((s) => s._id === item._id);

  // Responsive grid: 2 → 3 → 4 → 5 → 6 columns
  const gridClass = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3';

  return (
    <div className="space-y-8">
      {/* Missing Exact Matches Message */}
      {own.length === 0 && nearby.length === 0 && recommendations.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 text-amber-800">
          <svg className="w-6 h-6 flex-shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h4 className="font-bold">No Exact Matches Found</h4>
            <p className="text-sm mt-0.5 opacity-90">We couldn't find the exact medicine you searched for, but we found these generic substitutes available nearby.</p>
          </div>
        </div>
      )}

      {/* Own stock */}
      {own.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <h3 className="text-sm font-bold text-blue-500 uppercase tracking-widest">Your Stock</h3>
            <span className="text-xs bg-blue-50 text-blue-500 border border-blue-200 px-2 py-0.5 rounded-full font-medium">
              {own.length} items
            </span>
          </div>
          <div className={gridClass}>
            {own.map((item) => (
              <ProductCard
                key={item._id}
                item={item}
                selected={isSelected(item)}
                onSelect={onSelect}
                isOwn
              />
            ))}
          </div>
        </div>
      )}

      {/* Nearby Exact Matches */}
      {nearby.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-widest">Nearby Pharmacies</h3>
            <span className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
              {nearby.length} items
            </span>
          </div>
          <div className={gridClass}>
            {nearby.map((item) => (
              <ProductCard
                key={item._id}
                item={item}
                selected={isSelected(item)}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recommended Substitutes */}
      {recommendations.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-purple-500 rounded-full" />
            <h3 className="text-sm font-bold text-purple-600 uppercase tracking-widest">Recommended Substitutes</h3>
            <span className="text-xs bg-purple-50 text-purple-600 border border-purple-200 px-2 py-0.5 rounded-full font-medium">
              Same Ingredients
            </span>
          </div>
          <div className={gridClass}>
            {recommendations.map((item) => (
              <div key={item._id} className="relative group">
                <ProductCard
                  item={item}
                  selected={isSelected(item)}
                  onSelect={onSelect}
                />
                {/* Purple subtle border to distinguish substitutes */}
                <div className="absolute inset-0 border-2 border-purple-500/20 rounded-2xl pointer-events-none transition-all group-hover:border-purple-500/40"></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchResults;
