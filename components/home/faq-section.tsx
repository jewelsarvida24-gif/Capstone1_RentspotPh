
"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle, X } from "lucide-react";
import { faqCategories } from "./faq-data";

export default function FAQSection() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [openQuestion, setOpenQuestion] = useState<number | null>(null);

  const activeFaq = faqCategories.find(
    (category) => category.id === activeCategory
  );

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
    setOpenQuestion(null);
  };

  const closeModal = () => {
    setActiveCategory(null);
    setOpenQuestion(null);
  };

  return (
    <>
      <section
        id="faqs"
        className="relative overflow-hidden bg-[#f8fafc] px-6 py-20 sm:px-8 lg:px-12"
      >
        {/* Background grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "linear-gradient(#dbe4ee 1px, transparent 1px), linear-gradient(90deg, #dbe4ee 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />

        {/* Soft background glow */}
        <div className="pointer-events-none absolute -right-32 top-10 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -left-32 bottom-0 h-72 w-72 rounded-full bg-indigo-200/30 blur-3xl" />

        <div className="relative mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Frequently Asked Questions
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Find quick answers about renting, payment, rental agreements,
              pickup, and returns.
            </p>
          </div>

          {/* Four FAQ category cards */}
          <div className="grid gap-5 sm:grid-cols-2">
            {faqCategories.map((category, index) => (
              <button
                key={category.id}
                type="button"
                onClick={() => handleCategoryClick(category.id)}
                className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-6 text-left shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl"
              >
                {/* Number */}
                <div className="absolute right-5 top-5 text-5xl font-black text-slate-100 transition-colors group-hover:text-blue-50">
                  0{index + 1}
                </div>

                <div className="relative">
                  {/* Icon */}
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                    <HelpCircle className="h-5 w-5" />
                  </div>

                  <h3 className="text-xl font-bold text-slate-900">
                    {category.title}
                  </h3>

                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                    {category.description}
                  </p>

                  <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-blue-600">
                    View questions
                    <ChevronDown className="h-4 w-4 -rotate-90 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Modal */}
      {activeFaq && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="relative max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-3xl border border-white/60 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Modal header */}
            <div className="border-b border-slate-100 px-6 py-5 sm:px-7">
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close FAQ"
                className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="pr-10">
                <div className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                  RentSpotPH FAQ
                </div>

                <h3 className="text-2xl font-bold text-slate-900">
                  {activeFaq.title}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {activeFaq.description}
                </p>
              </div>
            </div>

            {/* Questions */}
            <div className="max-h-[calc(85vh-130px)] overflow-y-auto p-4 sm:p-6">
              <div className="space-y-3">
                {activeFaq.questions.map((item, index) => {
                  const isOpen = openQuestion === index;

                  return (
                    <div
                      key={item.question}
                      className={`overflow-hidden rounded-2xl border transition-all ${
                        isOpen
                          ? "border-blue-200 bg-blue-50/50"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setOpenQuestion(isOpen ? null : index)
                        }
                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                      >
                        <span className="text-sm font-semibold leading-6 text-slate-800">
                          {item.question}
                        </span>

                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-300 ${
                            isOpen ? "rotate-180 text-blue-600" : ""
                          }`}
                        />
                      </button>

                      {isOpen && (
                        <div className="border-t border-blue-100 px-5 pb-5 pt-4">
                          <div className="whitespace-pre-line text-sm leading-7 text-slate-600">
                            {item.answer}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}