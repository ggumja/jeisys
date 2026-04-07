SELECT 
    o.order_number, 
    o.total_amount, 
    COUNT(oi.id) as items_count
FROM 
    public.orders o
LEFT JOIN 
    public.order_items oi ON o.id = oi.order_id
WHERE 
    o.order_number = 'DUM-799066'
GROUP BY 
    o.order_number, o.total_amount;
