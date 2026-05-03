export type CreditPlan = {
  id: "starter" | "pro" | "business";
  name: string;
  priceUsd: number;
  credits: number;
};

export const creditPlans: CreditPlan[] = [
  { id: "starter", name: "Starter", priceUsd: 9, credits: 100 },
  { id: "pro", name: "Pro", priceUsd: 29, credits: 500 },
  { id: "business", name: "Business", priceUsd: 99, credits: 2000 }
];

export function getPlan(planId: string) {
  const plan = creditPlans.find((p) => p.id === planId);
  if (!plan) throw new Error("Invalid plan");
  return plan;
}

