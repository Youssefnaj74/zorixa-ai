export type UsersProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  credits_balance: number;
  created_at: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  type: "purchase" | "usage";
  credits_amount: number;
  stripe_payment_id: string | null;
  feature_used: "enhance" | "video" | null;
  created_at: string;
};

export type Generation = {
  id: string;
  user_id: string;
  feature_type: "image" | "video";
  input_url: string;
  output_url: string | null;
  credits_spent: number;
  status: "pending" | "completed" | "failed";
  created_at: string;
};

