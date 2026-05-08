"use client";
import { useState } from "react";
import { Check, Zap } from "lucide-react";

const plans = [
  {
    name: "Starter",
    monthly: 12,
    yearly: 10,
    credits: "12,000",
    generations: "~120",
    popular: false,
    badge: null,
    features: [
      "UGC Studio access",
      "Skin texture control",
      "Portrait upscale",
      "Image upscale",
      "De-AI enhancement",
      "Full 4K images",
      "Light presets",
      "Fix shine",
    ],
    extra: 10,
  },
  {
    name: "Creator",
    monthly: 45,
    yearly: 36,
    credits: "50,000",
    generations: "~500",
    popular: true,
    badge: "10% OFF",
    features: [
      "Everything in Starter",
      "AI Influencer models",
      "Cinema mode",
      "Identity consistency",
      "Lighting realism",
      "8K image output",
      "iPhone presets",
      "Kora Pro",
    ],
    extra: 20,
  },
  {
    name: "Professional",
    monthly: 147,
    yearly: 118,
    credits: "170,000",
    generations: "~1,700",
    popular: false,
    badge: "13.5% OFF",
    features: [
      "Everything in Creator",
      "Priority processing",
      "Commercial license",
      "API access",
      "Dedicated support",
      "White-label export",
      "Nano Banana Pro",
      "8K images",
    ],
    extra: 30,
  },
];

export default function PricingPage() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  return (
    <div className="min-h-screen bg-zorixa-bg text-white font-body">
      <div className="max-w-6xl mx-auto px-6 py-20">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3">
            Choose Your Plan
          </h1>
          <p className="text-gray-500 text-base">
            Unlock the full potential of Zorixa AI with cinematic tools and models.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center mt-6 bg-[#111120] border border-[#1e1e30] rounded-full p-1">
            <button
              onClick={() => setBilling("monthly")}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                billing === "monthly"
                  ? "bg-[#00e5ff] text-black"
                  : "text-gray-500"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("yearly")}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
                billing === "yearly"
                  ? "bg-[#00e5ff] text-black"
                  : "text-gray-500"
              }`}
            >
              Yearly
              <span className="bg-[#1a3a2a] text-[#00e5a0] text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                SAVE -20%
              </span>
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-6 flex flex-col ${
                plan.popular
                  ? "border-2 border-[#00e5ff] bg-[#0f0f1e]"
                  : "border border-[#1e1e30] bg-[#0f0f1e]"
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#00e5ff] text-black text-[11px] font-extrabold px-4 py-1 rounded-full whitespace-nowrap">
                  POPULAR &nbsp; {plan.badge}
                </div>
              )}

              {/* Off badge non-popular */}
              {!plan.popular && plan.badge && (
                <span className="inline-block mb-2 bg-[#1a3a2a] text-[#00e5a0] text-[11px] font-bold px-2 py-0.5 rounded-md w-fit">
                  {plan.badge}
                </span>
              )}

              <h2 className="text-base font-bold text-white mb-4">{plan.name}</h2>

              {/* Price */}
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-5xl font-extrabold text-white">
                  ${billing === "monthly" ? plan.monthly : plan.yearly}
                </span>
                <span className="text-gray-600 text-sm">/month</span>
              </div>

              {/* Credits */}
              <div className="flex items-center gap-1 text-sm text-gray-600 mb-6 pb-6 border-b border-[#1e1e30]">
                <Zap size={13} className="text-[#00e5ff]" />
                <span className="text-[#00e5ff] font-semibold">{plan.credits} Credits</span>
                <span className="ml-1">{plan.generations} generations</span>
              </div>

              {/* CTA */}
              <button
                className={`w-full py-3 rounded-full text-sm font-bold mb-6 transition-all ${
                  plan.popular
                    ? "bg-[#00e5ff] text-black hover:opacity-90"
                    : "bg-[#1a1a2e] text-white border border-[#2a2a4a] hover:border-[#00e5ff]"
                }`}
              >
                Subscribe Now
              </button>

              {/* Features */}
              <p className="text-[11px] tracking-widest uppercase text-gray-600 mb-3">
                Includes
              </p>
              <ul className="flex flex-col gap-2.5 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-400">
                    <Check size={15} className="text-[#00e5ff] mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-gray-600 mt-4 cursor-pointer hover:text-[#00e5ff] transition-colors">
                + {plan.extra} more features ↓
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
