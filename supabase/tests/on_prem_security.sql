BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SELECT plan(15);

SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.tenants'::regclass), 'tenants RLS is enabled');
SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.profiles'::regclass), 'profiles RLS is enabled');
SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.properties'::regclass), 'properties RLS is enabled');
SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.property_images'::regclass), 'property images RLS is enabled');
SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.leads'::regclass), 'leads RLS is enabled');
SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.local_license_state'::regclass), 'local license state RLS is enabled');

SELECT ok(NOT has_table_privilege('anon', 'public.tenants', 'SELECT'), 'anon cannot read tenant rows or contact fields');
SELECT ok(NOT has_table_privilege('anon', 'public.profiles', 'SELECT'), 'anon cannot read profiles');
SELECT ok(NOT has_table_privilege('anon', 'public.properties', 'SELECT'), 'anon cannot read raw properties or exact addresses');
SELECT ok(NOT has_table_privilege('anon', 'public.property_images', 'SELECT'), 'anon cannot read image metadata directly');
SELECT ok(NOT has_table_privilege('anon', 'public.leads', 'SELECT'), 'anon cannot read leads');
SELECT ok(NOT has_table_privilege('anon', 'public.local_license_state', 'SELECT'), 'anon cannot read local lease or installation state');

SELECT ok(has_column_privilege('authenticated', 'public.tenants', 'site_config', 'UPDATE'), 'authenticated sessions can update the permitted settings column');
SELECT ok(NOT has_column_privilege('authenticated', 'public.tenants', 'email', 'UPDATE'), 'authenticated sessions cannot change tenant contact credentials');
SELECT ok(NOT has_function_privilege('anon', 'public.consume_public_lead_rate_limit(text, integer, integer)', 'EXECUTE'), 'anon cannot call the rate limit storage function directly');

SELECT * FROM finish();
ROLLBACK;
