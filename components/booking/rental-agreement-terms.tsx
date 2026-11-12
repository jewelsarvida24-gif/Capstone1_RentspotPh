const TERMS = [
  {
    title: "01 · Parties to the Agreement",
    body: "This Rental Agreement is between Anaclette Julia Lincallo and John Paulo Amponin (\"OWNERS\") and the person signing this agreement (\"YOU\"). YOU agree to all of the terms and conditions of this Agreement and also acknowledge that all of the details indicated on the first page are correct.",
  },
  {
    title: "02 · Condition of Rental Unit",
    body: "The OWNERS assure the RENTER that the rented unit was inspected thoroughly before pick up and is in good condition. Meanwhile, it is the responsibility of the RENTER to inspect the rented unit for any damage or issues within an hour from the moment the RENTER receives the unit. Customer failure to notify the OWNERS of any defects or problems within an hour of receipt shall be conclusively deemed as an acknowledgment that all units have passed customer approval and everything is in good working order.",
  },
  {
    title: "03 · Reservation/Security Fee and Rescheduling Policy",
    body: "The RENTER agrees to settle a reservation/security fee of PHP 300 which is refundable upon the safe and on-time return of the rented unit. If you wish to reschedule your booking date, we will allow it once and only if the date that you prefer to move your rental booking date is still available.",
  },
  {
    title: "04 · Cancellation Policy",
    body: "If the RENTER chooses to cancel the rental booking before the scheduled rental date regardless of the reason, the reservation fee will be forfeited in favor of the OWNERS. Cancellations made 1-3 days prior to the start of the rental period, regardless of the reason, will incur a cancellation/penalty fee equivalent to 30% of the total rental fee. This cancellation fee is in addition to the forfeited reservation fee and serves to compensate the OWNERS for a portion of the revenue loss due to short-notice cancellation. As much as possible, the OWNERS wish to avoid imposing this fee and strongly encourage the RENTER to inform the OWNERS as far in advance as possible if a cancellation becomes necessary. This advance notice allows for a more flexible arrangement and the potential for the reserved dates to be rebooked by other clients.",
  },
  {
    title: "05 · Return Condition and Late Fees",
    body: "The RENTER agrees to return the rented unit and all its accessories on the agreed date and time, in the same condition the RENTER received it. It is agreed that in the event of a late return, the RENTER will settle late fees as indicated on the booking confirmation details sent to the RENTER'S Facebook or Instagram account.",
  },
  {
    title: "06 · Knowledge and Proper Use of Unit",
    body: "It is understood and agreed that the RENTER is familiar with the rented unit and knowledgeable about its proper use. The RENTER acknowledges that they are responsible for operating the unit correctly, and the OWNERS will not be held liable if the RENTER is unable to use the unit due to a lack of understanding or skill. The RENTER agrees not to break, cover, alter, or deface any of the accessories or the unit itself.",
  },
  {
    title: "07 · Responsibility for Damage",
    body: "From the moment the rented unit and all accessories are in the RENTER'S physical possession, safekeeping thereof shall be the RENTER's responsibility. The RENTER is responsible for any damage, loss, misuse, or theft of the rented unit, including damage or loss caused by acts of nature or other individuals in the RENTER's surroundings, whether or not the RENTER is at fault. Any loss or damages incurred or discovered once the unit has come into the RENTER's possession, including those identified by the OWNERS within 24 hours of the unit's return, shall be borne solely by the RENTER. In the event of damage, the RENTER agrees to either cover the cost of repairs, pay the equivalent value of the unit, or replace it with a brand-new or well-conditioned second-hand unit of the same type.",
  },
  {
    title: "08 · Procedure for Repair",
    body: "If the Unit is damaged, the RENTER must notify the OWNERS immediately. The RENTER may seek repair shop options; however, any repair arrangements must be discussed with and approved by the OWNERS. The RENTER shall not attempt to repair the Unit without prior written consent from the OWNERS. The RENTER is required to pay the full cost of the repair.",
  },
  {
    title: "09 · Refund of Security Fee",
    body: "The reservation/security fee will be refunded only if the rented unit has been returned on time and after the unit has been inspected and tested by the OWNERS to assure that nothing has been lost or damaged and all pending invoices have been paid. If any additional charges exceed the amount of the security fee the RENTER will be liable for the additional amount. The RENTER's face will not be publicly displayed or posted on any social media platforms or other public groups, except in circumstances where it becomes necessary for the recovery of the unit, such as in cases of failure to return the unit or other significant breach of the rental agreement terms. The RENTER acknowledges and consents to the use of their photograph or screenshots of social media accounts in such exceptional circumstances as part of this agreement.",
  },
];

export default function RentalAgreementTerms({ previewMode = false }: { previewMode?: boolean }) {
  const articleClass = previewMode
    ? "border-b border-slate-200 pb-5 last:border-0 last:pb-0"
    : "rounded-2xl border border-[#CFE0F5] border-l-4 border-l-[#6E9CF7] bg-white p-4 shadow-[0_4px_18px_rgba(24,60,110,0.05)] sm:p-5";

  return (
    <section
      aria-label="Rental agreement terms"
      className={previewMode ? "space-y-5" : "space-y-3"}
    >
      {TERMS.map((term) => (
        <article key={term.title} className={articleClass}>
          <h4 className="text-sm font-bold text-[#14263D] sm:text-base">{term.title}</h4>
          <p className="mt-2 text-sm leading-7 text-[#30445D]">{term.body}</p>
        </article>
      ))}
    </section>
  );
}
