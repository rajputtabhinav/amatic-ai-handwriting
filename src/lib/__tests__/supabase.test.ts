import { supabase, supabaseAdmin } from '../supabase';

describe('Supabase Client', () => {
  it('should initialize supabase client', () => {
    expect(supabase).toBeDefined();
    expect(supabaseAdmin).toBeDefined();
  });

  it('should have auth methods', () => {
    expect(supabase.auth).toBeDefined();
    expect(supabase.from).toBeDefined();
  });

  it('should have admin client with service role', () => {
    expect(supabaseAdmin.from).toBeDefined();
  });
});

