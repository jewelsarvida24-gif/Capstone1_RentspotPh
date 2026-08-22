import Image from 'next/image';
import Link from 'next/link';
import type { RentalUnit } from '@/lib/types';

interface UnitCardProps {
	unit: RentalUnit;
}

export function UnitCard({ unit }: UnitCardProps) {
	const imageUrl = typeof unit.image_url === 'string' ? unit.image_url : null;
	const price = typeof unit.price_per_day === 'number' ? unit.price_per_day : null;

	return (
		<article className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-md">
			<div className="relative flex aspect-[4/3] items-center justify-center bg-neutral-100">
				{imageUrl ? (
					<Image src={imageUrl} alt={unit.unit_name} fill className="object-cover" />
				) : (
					<span className="text-sm text-neutral-400">No image available</span>
				)}
			</div>
			<div className="space-y-3 p-5">
				<div>
					<p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
						{unit.category || 'Rental unit'}
					</p>
					<h2 className="mt-1 text-lg font-bold text-neutral-900">{unit.unit_name}</h2>
				</div>
				{unit.description && <p className="line-clamp-2 text-sm text-neutral-600">{unit.description}</p>}
				<div className="flex items-center justify-between gap-3">
					<div>
						{price !== null ? (
							<p className="font-semibold text-neutral-900">PHP {price.toLocaleString()} / day</p>
						) : (
							<p className="text-sm text-neutral-500">Price on request</p>
						)}
						{unit.avg_rating !== null && unit.avg_rating !== undefined && (
							<p className="text-sm text-amber-600">★ {unit.avg_rating.toFixed(1)}</p>
						)}
					</div>
					<Link href={`/guest/${unit.unit_id}`} className="btn-secondary px-3 py-2 text-sm">
						View unit
					</Link>
				</div>
			</div>
		</article>
	);
}
