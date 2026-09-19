# RP-53 Search and Filter QA

Date: 2026-09-19
Route: `/guest/browse`
Viewport checks: desktop and 390px mobile

## Results

- Initial catalogue: 18 rentals displayed.
- Search `iPhone 17`: 1 matching rental displayed.
- Category `Camera`: 6 camera rentals displayed.
- Category `Camera` plus availability `available`: 6 rentals displayed.
- Reset: catalogue returned to 18 rentals and cleared active filters.
- Maximum price `Up to PHP 1,500/day`: 13 rentals displayed.
- Mobile viewport: no horizontal overflow at 390px width.
- Search input, filter groups, result count, and clear/reset controls were present and usable.
- Server output showed no application runtime errors. An existing Next.js process was already using port 3000, so QA used the active server on that port.
