const categories = ['All', 'Camera', 'Phone', 'Vehicle', 'Laptop', 'Drone'];

interface BrowseFiltersProps {
  category?: string;
  currentCategory?: string;
  availability?: string;
  maxPrice?: string;
  onCategoryChange?: (value: string) => void;
  onAvailabilityChange?: (value: string) => void;
  onMaxPriceChange?: (value: string) => void;
  onSearchReset?: () => void;
}

export function BrowseFilters({ category = 'All', currentCategory, availability = 'All', maxPrice = 'any', onCategoryChange = () => {}, onAvailabilityChange = () => {}, onMaxPriceChange = () => {}, onSearchReset = () => {} }: BrowseFiltersProps) {
  const selectedCategory = currentCategory || category;
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-neutral-500">Filters</p>
          <p className="mt-1 text-xs text-neutral-400">Narrow the catalogue</p>
        </div>
        <button type="button" onClick={() => { onCategoryChange('All'); onAvailabilityChange('All'); onMaxPriceChange('any'); onSearchReset(); }} className="min-h-10 rounded-lg px-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">Reset</button>
      </div>
      <div className="mt-5">
        <p id="rental-category-label" className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Category</p>
        <div role="group" aria-labelledby="rental-category-label" className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-2">
          {categories.map((item) => (
            <button key={item} type="button" aria-pressed={selectedCategory === item} onClick={() => onCategoryChange(item)} className={`min-h-11 rounded-lg px-3 py-2 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${selectedCategory === item ? 'bg-blue-600 text-white shadow-sm' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}>
              {item}
            </button>
          ))}
        </div>
      </div>
      <label className="mt-6 block text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
        Price range
        <select aria-label="Maximum daily price" value={maxPrice} onChange={(event) => onMaxPriceChange(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-neutral-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
          <option value="1500">Up to ₱1,500/day</option>
          <option value="2500">Up to ₱2,500/day</option>
          <option value="3500">Up to ₱3,500/day</option>
          <option value="any">Any price</option>
        </select>
      </label>
      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Availability</p>
        <div role="group" aria-label="Rental availability" className="mt-3 grid grid-cols-3 gap-2">
          {['All', 'available', 'rented'].map((item) => (
            <button key={item} type="button" aria-pressed={availability === (item === 'All' ? 'All' : item)} onClick={() => onAvailabilityChange(item === 'All' ? 'All' : item)} className={`min-h-11 rounded-lg px-2 py-2 text-xs font-semibold capitalize transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${availability === (item === 'All' ? 'All' : item) ? 'bg-emerald-600 text-white shadow-sm' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}>
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
