-- Update existing PC image URLs to point to the new 'marketing' bucket
UPDATE public.ads 
SET image_pc_url = REPLACE(image_pc_url, '/ads/', '/marketing/')
WHERE image_pc_url LIKE '%/ads/%';

-- Update existing Mobile image URLs to point to the new 'marketing' bucket
UPDATE public.ads 
SET image_mobile_url = REPLACE(image_mobile_url, '/ads/', '/marketing/')
WHERE image_mobile_url LIKE '%/ads/%';
