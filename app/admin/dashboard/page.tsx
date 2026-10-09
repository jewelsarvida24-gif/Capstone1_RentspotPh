const summaryCards = [
  {
    title: "Pending KYC Reviews",
    description: "Renter identity verification",
    value: "—",
  },
  {
    title: "Pending Bookings",
    description: "Bookings awaiting review",
    value: "—",
  },
  {
    title: "Available Units",
    description: "Rental inventory overview",
    value: "—",
  },
  {
    title: "Registered Renters",
    description: "Renter account overview",
    value: "—",
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-semibold text-[#2C3E50]">
          Welcome to RentSpotPH
        </h2>

        <p className="mt-2 text-sm text-neutral-600">
          Manage rental operations, review renter verification,
          and monitor booking activity.
        </p>
      </section>

      <section>
        <h3 className="mb-4 text-base font-semibold text-neutral-800">
          Operations Overview
        </h3>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <article
              key={card.title}
              className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm font-medium text-neutral-600">
                {card.title}
              </p>

              <p className="mt-4 text-3xl font-semibold text-[#2C3E50]">
                {card.value}
              </p>

              <p className="mt-2 text-xs text-neutral-500">
                {card.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="font-semibold text-[#2C3E50]">
          Getting Started
        </h3>

        <p className="mt-2 text-sm leading-6 text-neutral-600">
          Select a module from the sidebar to manage renter verification,
          bookings, rental units, and renter accounts.
        </p>
      </section>
    </div>
  );
}