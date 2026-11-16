-- ==============================================================================
-- FASTRIFA - Database Schema & Security Policies (Supabase PostgreSQL)
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Profiles Table (Organizers)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone_whatsapp TEXT NOT NULL DEFAULT '',
  pix_key TEXT,
  pix_key_type TEXT CHECK (pix_key_type IN ('cpf', 'cnpj', 'email', 'phone', 'random')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Raffles Table
CREATE TABLE IF NOT EXISTS public.raffles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  prize_image_url TEXT,
  ticket_price NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
  total_tickets INTEGER NOT NULL DEFAULT 100,
  pix_key TEXT NOT NULL,
  pix_key_type TEXT NOT NULL DEFAULT 'cpf',
  phone_whatsapp TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
  winner_ticket INTEGER,
  winner_name TEXT,
  draw_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Orders / Reservations Table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raffle_id UUID NOT NULL REFERENCES public.raffles(id) ON DELETE CASCADE,
  buyer_name TEXT NOT NULL,
  buyer_phone TEXT NOT NULL,
  ticket_numbers INTEGER[] NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  paid_at TIMESTAMPTZ
);

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_raffles_slug ON public.raffles(slug);
CREATE INDEX IF NOT EXISTS idx_raffles_user_id ON public.raffles(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_raffle_id ON public.orders(raffle_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_ticket_numbers ON public.orders USING GIN (ticket_numbers);

-- 6. Trigger: Automatically Create Profile on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone_whatsapp)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'phone_whatsapp', '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 7. Trigger: Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_raffles_updated_at ON public.raffles;
CREATE TRIGGER update_raffles_updated_at
  BEFORE UPDATE ON public.raffles
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- 8. Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raffles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON public.profiles;
CREATE POLICY "Usuários podem ver seu próprio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.profiles;
CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Raffles Policies
DROP POLICY IF EXISTS "Rifas públicas visíveis para todos" ON public.raffles;
CREATE POLICY "Rifas públicas visíveis para todos"
  ON public.raffles FOR SELECT
  USING (status IN ('active', 'completed', 'paused') OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Organizadores podem criar rifas" ON public.raffles;
CREATE POLICY "Organizadores podem criar rifas"
  ON public.raffles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Organizadores podem atualizar suas rifas" ON public.raffles;
CREATE POLICY "Organizadores podem atualizar suas rifas"
  ON public.raffles FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Organizadores podem excluir suas rifas" ON public.raffles;
CREATE POLICY "Organizadores podem excluir suas rifas"
  ON public.raffles FOR DELETE
  USING (auth.uid() = user_id);

-- Orders Policies
DROP POLICY IF EXISTS "Qualquer pessoa pode criar um pedido de reserva" ON public.orders;
CREATE POLICY "Qualquer pessoa pode criar um pedido de reserva"
  ON public.orders FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Leitura de pedidos pelo organizador da rifa" ON public.orders;
CREATE POLICY "Leitura de pedidos pelo organizador da rifa"
  ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.raffles
      WHERE public.raffles.id = public.orders.raffle_id
      AND public.raffles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Organizadores podem atualizar status dos pedidos" ON public.orders;
CREATE POLICY "Organizadores podem atualizar status dos pedidos"
  ON public.orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.raffles
      WHERE public.raffles.id = public.orders.raffle_id
      AND public.raffles.user_id = auth.uid()
    )
  );

-- Helper View/Function: Números ocupados para página pública da rifa
-- Permite que a página pública consulte quais números já estão reservados/pagos sem expor dados pessoais dos compradores
CREATE OR REPLACE FUNCTION public.get_raffle_occupied_tickets(target_raffle_id UUID)
RETURNS TABLE (
  ticket_number INTEGER,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    unnest(o.ticket_numbers) as ticket_number,
    o.status
  FROM public.orders o
  WHERE o.raffle_id = target_raffle_id
    AND o.status IN ('pending', 'paid');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
