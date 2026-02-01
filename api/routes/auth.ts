/**
 * This is a user authentication API route demo.
 * Handle user registration, login, token management, etc.
 */
import { Router, type Request, type Response } from 'express';
import getSupabaseClient from '../supabaseClient.js';

const router = Router();

/**
 * Register new user (Admin function usually, or public signup)
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const supabase = getSupabaseClient();
    const { email, password, full_name, role } = req.body;

    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name }
    });

    if (authError) throw authError;

    if (!authData.user) {
      throw new Error('Failed to create user');
    }

    // 2. Create profile (Trigger might handle this, but let's ensure it)
    // If you have a trigger on auth.users -> public.profiles, this step might be redundant or update only.
    // Let's assume we need to update the profile with the specific role if passed.
    
    // Check if profile exists (created by trigger)
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', authData.user.id)
      .single();

    if (existingProfile) {
       await supabase.from('profiles').update({
         full_name,
         role: role || 'staff'
       }).eq('id', authData.user.id);
    } else {
       await supabase.from('profiles').insert({
         id: authData.user.id,
         email,
         full_name,
         role: role || 'staff',
         staff_type: 'operator' // Default
       });
    }

    res.json({ success: true, user: authData.user });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
