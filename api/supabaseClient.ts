import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let realClient: SupabaseClient | undefined;

const initializeClient = () => {
  if (realClient) return realClient;

  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error('❌ Supabase credentials missing in environment variables');
    console.error('VITE_SUPABASE_URL:', url ? 'Set' : 'Missing');
    console.error('SUPABASE_SERVICE_ROLE_KEY:', key ? 'Set' : 'Missing');
    throw new Error('Missing Supabase credentials');
  }

  realClient = createClient(url, key);
  return realClient;
};

// Return a Proxy that initializes the client lazily on first usage
const getSupabaseClient = () => {
  return new Proxy({} as SupabaseClient, {
    get: (_target, prop) => {
      // Initialize only when a property is accessed (e.g., supabase.from)
      const client = initializeClient();
      
      const value = Reflect.get(client, prop);
      
      // Ensure functions are bound to the real client instance
      if (typeof value === 'function') {
        return value.bind(client);
      }
      return value;
    },
    // Also trap set just in case, though unlikely used
    set: (_target, prop, value) => {
      const client = initializeClient();
      return Reflect.set(client, prop, value);
    }
  });
};

export default getSupabaseClient;
