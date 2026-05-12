-- BØLG Atlas — populate product_models hero_image_url + product_url
-- (Sesión 3.5, 2026-05-12). Source: bolg.cl/products.json.

-- Add product_url column for the catalog UX cross-sell link.
alter table public.product_models add column if not exists product_url text;

update public.product_models set hero_image_url = 'https://cdn.shopify.com/s/files/1/0842/0032/5400/files/1_912f7270-c14b-443c-9365-5e4261f2a7b0.png?v=1765040780', product_url = 'https://www.bolg.cl/products/botella-insulada-kids-355-ml-pale-rose-pink' where id = 'kids';
update public.product_models set hero_image_url = 'https://cdn.shopify.com/s/files/1/0842/0032/5400/files/Mochilaberlin_alta.jpg?v=1776348578', product_url = 'https://www.bolg.cl/products/mochila-berlin-black' where id = 'berlin';
update public.product_models set hero_image_url = 'https://cdn.shopify.com/s/files/1/0842/0032/5400/files/Mochila_oslo_alta.jpg?v=1776363424', product_url = 'https://www.bolg.cl/products/mochila-oslo-black' where id = 'oslo';
update public.product_models set hero_image_url = 'https://cdn.shopify.com/s/files/1/0842/0032/5400/files/Mochilaannapurna_alta.jpg?v=1776364416', product_url = 'https://www.bolg.cl/products/mochila-annapurna-black' where id = 'annapurna';
update public.product_models set hero_image_url = 'https://cdn.shopify.com/s/files/1/0842/0032/5400/files/1_37701a15-760e-4603-871b-f6cc3758f7b9.png?v=1765041136', product_url = 'https://www.bolg.cl/products/botella-insulada-zermatt-946-ml-black' where id = 'zermatt';
update public.product_models set hero_image_url = 'https://cdn.shopify.com/s/files/1/0842/0032/5400/files/1_743e23ac-40ec-450f-a286-0bf6152cfe84.jpg?v=1765041939', product_url = 'https://www.bolg.cl/products/botella-insulada-islandia-592-ml-graphite' where id = 'islandia';
update public.product_models set hero_image_url = 'https://cdn.shopify.com/s/files/1/0842/0032/5400/files/Mochilanewyorkoriongrey_alta.jpg?v=1776351438', product_url = 'https://www.bolg.cl/products/mochila-new-york-2-0-orion-grey' where id = 'new-york-2-0';
update public.product_models set hero_image_url = 'https://cdn.shopify.com/s/files/1/0842/0032/5400/files/Mochilanamibiablack_alta.jpg?v=1776350268', product_url = 'https://www.bolg.cl/products/mochila-namibia-black' where id = 'namibia';
update public.product_models set hero_image_url = 'https://cdn.shopify.com/s/files/1/0842/0032/5400/files/1_4525f146-b247-436d-bb1a-67192f5e3142.png?v=1763990288', product_url = 'https://www.bolg.cl/products/mug-insulado-portland-591-ml-pale-mint' where id = 'portland';
update public.product_models set hero_image_url = 'https://cdn.shopify.com/s/files/1/0842/0032/5400/files/1_ba644ece-4df0-4ba6-a519-b3ce71a110c4.jpg?v=1765041876', product_url = 'https://www.bolg.cl/products/billetera-singapur-black' where id = 'singapur';
update public.product_models set hero_image_url = 'https://cdn.shopify.com/s/files/1/0842/0032/5400/files/Mochilaborneo_alta2.png?v=1777482967', product_url = 'https://www.bolg.cl/products/mochila-borneo-black' where id = 'borneo';
update public.product_models set hero_image_url = 'https://cdn.shopify.com/s/files/1/0842/0032/5400/files/1_a7498cee-3692-4ee4-bcb0-b0a6a0481b0f.jpg?v=1765041656', product_url = 'https://www.bolg.cl/products/jockey-texas-black' where id = 'texas';
update public.product_models set hero_image_url = 'https://cdn.shopify.com/s/files/1/0842/0032/5400/files/1_b5ef2771-b7c2-47b4-aa83-257a1bcb50fb.jpg?v=1711458840', product_url = 'https://www.bolg.cl/products/llavero-experience-black' where id = 'experience';
update public.product_models set hero_image_url = 'https://cdn.shopify.com/s/files/1/0842/0032/5400/files/1_b91276c8-4671-4b5a-8ac6-5bec8872214e.jpg?v=1765041805', product_url = 'https://www.bolg.cl/products/jockey-lisboa-beige' where id = 'lisboa';
update public.product_models set hero_image_url = 'https://cdn.shopify.com/s/files/1/0842/0032/5400/files/1_8d23f17a-5b67-4051-8bee-63a395921aae.png?v=1765040305', product_url = 'https://www.bolg.cl/products/bolso-duffel-50l-palau-black' where id = 'palau';
update public.product_models set hero_image_url = 'https://cdn.shopify.com/s/files/1/0842/0032/5400/files/1_23e6c0c1-0440-4e49-aa90-2e908c5c2204.png?v=1765040407', product_url = 'https://www.bolg.cl/products/bolso-duffel-60l-vanuatu-black' where id = 'vanuatu';
update public.product_models set hero_image_url = 'https://cdn.shopify.com/s/files/1/0842/0032/5400/files/1_c24f9ddc-0e64-43c7-a768-a9e4ece3ac07.png?v=1765039811', product_url = 'https://www.bolg.cl/products/billetera-busan-black' where id = 'busan';
update public.product_models set hero_image_url = 'https://cdn.shopify.com/s/files/1/0842/0032/5400/files/1_c04b89fc-1f29-43b4-8b0c-545e340f4c23.jpg?v=1711459147', product_url = 'https://www.bolg.cl/products/llavero-memories-black-leopard' where id = 'memories';
update public.product_models set hero_image_url = 'https://cdn.shopify.com/s/files/1/0842/0032/5400/files/1_c33e397e-1212-4e7d-90e2-b84649c202d2.png?v=1765039730', product_url = 'https://www.bolg.cl/products/billetera-nankin-black' where id = 'nankin';
update public.product_models set hero_image_url = 'https://cdn.shopify.com/s/files/1/0842/0032/5400/files/1_c66ec363-11c4-44d0-a295-c89b2a8796e3.png?v=1765039751', product_url = 'https://www.bolg.cl/products/billetera-vientian-black' where id = 'vientian';

-- Matched 20 / 20 models.
