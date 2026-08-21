'use client';

import { Search } from 'lucide-react';

interface BrowseFiltersProps {
	currentCategory?: string;
}

export function BrowseFilters({ currentCategory = '' }: BrowseFiltersProps) {
	return (
		<form action="/guest" method="get" className="card space-y-4">
			<div>
				<label htmlFor="search" className="mb-1.5 block text-sm font-semibold text-neutral-700">
					Search units
				</label>
				<div className="relative">
					<Search size={16} className="pointer-events-none absolute left-3 top-3 text-neutral-400" />
					<input
						id="search"
						name="search"
						type="search"
						placeholder="Search by name"
						className="input-field pl-9"
					/>
				</div>
			</div>
			<div>
				<label htmlFor="category" className="mb-1.5 block text-sm font-semibold text-neutral-700">
					Category
				</label>
				<select id="category" name="category" defaultValue={currentCategory} className="input-field">
					<option value="">All categories</option>
					<option value="Camera">Camera</option>
					<option value="Smartphone">Smartphone</option>
					<option value="Vehicle">Vehicle</option>
				</select>
			</div>
			<button type="submit" className="btn-primary w-full">
				Apply filters
			</button>
		</form>
	);
}
