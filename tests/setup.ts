import '@testing-library/jest-dom/vitest';

process.env.FAMILY_SESSION_SECRET ??= 'test-secret-do-not-use-in-production-0123456789';
process.env.SUPABASE_URL ??= 'https://example-test-project.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY ??= 'test-service-role-key';
process.env.NEXT_PUBLIC_SUPABASE_URL ??= 'https://example-test-project.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= 'test-anon-key';
