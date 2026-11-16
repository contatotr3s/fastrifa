export type PixKeyType = 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';

export type RaffleStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';

export type OrderStatus = 'pending' | 'paid' | 'cancelled';

export interface Profile {
  id: string; // Firebase Auth UID
  full_name: string;
  phone_whatsapp: string;
  pix_key?: string | null;
  pix_key_type?: PixKeyType | null;
  created_at: string;
  updated_at: string;
}

export interface Raffle {
  id: string; // Firestore document ID
  user_id: string; // Organizer UID
  title: string;
  slug: string;
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
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string; // Firestore document ID
  raffle_id: string;
  buyer_name: string;
  buyer_phone: string;
  ticket_numbers: number[];
  total_amount: number;
  status: OrderStatus;
  created_at: string;
  paid_at?: string | null;
}

export interface OccupiedTicket {
  ticket_number: number;
  status: 'pending' | 'paid';
}
