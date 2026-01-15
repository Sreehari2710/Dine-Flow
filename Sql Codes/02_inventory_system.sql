-- INVENTORY FUNCTIONS WITH FRACTIONAL SUPPORT
-- Decrement Stock (When Order is Placed)
CREATE OR REPLACE FUNCTION decrement_menu_item_stock(p_menu_item_id INT, p_quantity_float NUMERIC)
RETURNS VOID AS $$
BEGIN
    UPDATE public.menu_items
    SET stock_count = GREATEST(0, stock_count - p_quantity_float),
        available = CASE 
            WHEN (stock_count - p_quantity_float) <= 0 THEN FALSE 
            ELSE available 
        END
    WHERE id = p_menu_item_id AND track_inventory = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment Stock (Restocking on Cancellation)
CREATE OR REPLACE FUNCTION increment_menu_item_stock(p_menu_item_id INT, p_quantity_float NUMERIC)
RETURNS VOID AS $$
BEGIN
    UPDATE public.menu_items
    SET stock_count = stock_count + p_quantity_float,
        available = CASE 
            WHEN (stock_count + p_quantity_float) > 0 THEN TRUE 
            ELSE available 
        END
    WHERE id = p_menu_item_id AND track_inventory = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
