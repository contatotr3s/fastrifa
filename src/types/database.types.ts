export type PixKeyType = 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';

export type RaffleStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';

export type OrderStatus = 'pending' | 'paid' | 'cancelled';

export type UserRole = 'organizer' | 'master';

export type DiscountMode = 'none' | 'progressive' | 'buy_x_pay_y' | 'simple' | 'roulette';

export interface DiscountTier {
  min_tickets: number;
  percent: number;
}

export interface RaffleDiscountConfig {
  mode: DiscountMode;
  tiers?: DiscountTier[];
  buy_x_qty?: number;
  pay_y_qty?: number;
  simple_min_tickets?: number;
  simple_percent?: number;
  roulette_min_tickets?: number;
  roulette_options?: number[];
}

export interface Profile {
  id: string; // Firebase Auth UID
  full_name: string;
  email?: string;
  cpf?: string | null;
  birth_date?: string | null;
  organizer_terms_accepted?: boolean;
  organizer_terms_accepted_at?: string | null;
  auth_provider?: 'google' | 'password';
  phone_whatsapp: string;
  pix_key?: string | null;
  pix_key_type?: PixKeyType | null;

  // Customização de Marca (White-label do Criador)
  brand_name?: string | null; // ex: "Freire Rifas"
  brand_logo_url?: string | null; // DataURL ou URL da logo processada em 512x512
  brand_initials?: string | null; // Iniciais geradas automaticamente ex: "FR"
  brand_color?: 'blue' | 'green' | string | null; // Preferência de cor da marca
  onboarding_completed?: boolean; // Se já concluiu o setup inicial de marca
  role?: UserRole; // 'organizer' ou 'master'

  created_at: string;
  updated_at: string;
}

export interface Raffle {
  id: string; // Firestore document ID
  user_id: string; // Organizer UID
  title: string;
  subtitle?: string | null;
  slug: string;
  brand_slug?: string | null;
  prize_keyword?: string | null;
  short_code?: string | null;
  description: string;
  prize_image_url?: string | null;
  ticket_price: number;
  total_tickets: number;
  pix_key: string;
  pix_key_type: PixKeyType;
  phone_whatsapp?: string | null;
  status: RaffleStatus;
  winner_ticket?: number | null;
  winner_name?: string | null;
  draw_date?: string | null;

  // Fotos do prêmio (suporte a múltiplas fotos / carrossel)
  prize_images?: string[];

  // Marca vinculada à campanha
  brand_name?: string | null;
  brand_logo_url?: string | null;
  brand_color?: 'blue' | 'green' | string | null;

  // Estratégia de desconto para múltiplos bilhetes
  discount_config?: RaffleDiscountConfig | null;

  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string; // Document ID
  raffle_id: string;
  raffle_title?: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  action: 'raffle_update' | 'ticket_price_change' | 'draw_date_change' | 'status_change';
  previous_values: Record<string, any>;
  new_values: Record<string, any>;
  change_summary: string;
  ip_address?: string;
  created_at: string;
}

export interface Order {
  id: string; // Firestore document ID
  raffle_id: string;
  buyer_name: string;
  buyer_phone: string;
  ticket_numbers: number[];
  total_amount: number;
  original_amount?: number;
  discount_percent?: number;
  discount_amount?: number;
  discount_label?: string | null;
  status: OrderStatus;
  created_at: string;
  paid_at?: string | null;
}

export interface OccupiedTicket {
  ticket_number: number;
  status: 'pending' | 'paid';
}
