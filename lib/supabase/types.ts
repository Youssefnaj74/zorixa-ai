export type UsersProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  credits_balance: number;
  /** Subscription / payment provider ref — gates premium dashboard features in UI */
  is_premium: boolean;
  created_at: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  type: "purchase" | "usage";
  credits_amount: number;
  /** External payment reference (Dodo, legacy Lemon, or atlas:…). */
  lemonsqueezy_order_id: string | null;
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

export type UserClonedVoice = {
  id: string;
  user_id: string;
  voice_id: string;
  display_name: string;
  source_audio_url: string | null;
  demo_audio_url: string | null;
  provider: string;
  model_id: string | null;
  status: "pending" | "active" | "failed";
  activated_at: string | null;
  created_at: string;
};

