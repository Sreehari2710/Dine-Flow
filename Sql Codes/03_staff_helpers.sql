-- Helper for creating profiles via RPC (Secure)
CREATE OR REPLACE FUNCTION create_profile_v1(
  p_id UUID,
  p_hotel_id UUID,
  p_role TEXT,
  p_full_name TEXT,
  p_username TEXT,
  p_hotel_slug TEXT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.profiles (id, hotel_id, role, full_name, username, hotel_slug)
  VALUES (p_id, p_hotel_id, p_role, p_full_name, p_username, p_hotel_slug);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
