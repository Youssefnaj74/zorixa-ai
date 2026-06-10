import DodoPayments from "dodopayments";

import { dodoPaymentsEnvironment, getDodoApiKey } from "./config";

export async function resolveDodoCustomerIdByEmail(
  email: string
): Promise<{ customerId: string } | { error: string }> {
  const apiKey = getDodoApiKey();
  if (!apiKey) {
    return { error: "Payments are not configured." };
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return { error: "Email is required." };
  }

  const client = new DodoPayments({
    bearerToken: apiKey,
    environment: dodoPaymentsEnvironment()
  });

  const page = await client.customers.list({ email: normalizedEmail, page_size: 10 });
  const match = page.items.find(
    (customer) =>
      customer.customer_id && customer.email?.trim().toLowerCase() === normalizedEmail
  );
  if (match?.customer_id) {
    return { customerId: match.customer_id };
  }

  return { error: "No billing account found. Subscribe to a plan first." };
}
