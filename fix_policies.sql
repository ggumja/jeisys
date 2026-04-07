CREATE POLICY "Allow delete shipments" ON public.shipments FOR DELETE USING (true);
CREATE POLICY "Allow update shipments" ON public.shipments FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete shipment_items" ON public.shipment_items FOR DELETE USING (true);
CREATE POLICY "Allow update shipment_items" ON public.shipment_items FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow update order_items" ON public.order_items FOR UPDATE USING (true) WITH CHECK (true);
