import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface CertificateRecipient {
  id?: string;
  certificate_id: string;
  participant_name: string;
  participant_email: string;
  participant_organization?: string | null;
  test_title?: string;
  score?: number;
  percentage?: number;
  issue_date?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Save certificate recipient to Supabase
 */
export async function saveCertificateRecipient(data: CertificateRecipient) {
  try {
    const { data: result, error } = await supabase
      .from('certificate_recipients')
      .insert([
        {
          certificate_id: data.certificate_id,
          participant_name: data.participant_name,
          participant_email: data.participant_email,
          participant_organization: data.participant_organization || null,
          test_title: data.test_title || null,
          score: data.score || null,
          percentage: data.percentage || null,
          issue_date: data.issue_date || new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: result };
  } catch (err: any) {
    console.error('Failed to save to Supabase:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get certificate recipient by certificate ID
 */
export async function getCertificateRecipient(certificateId: string) {
  try {
    const { data, error } = await supabase
      .from('certificate_recipients')
      .select('*')
      .eq('certificate_id', certificateId.toUpperCase())
      .single();

    if (error) {
      console.error('Supabase query error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error('Failed to fetch from Supabase:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get all certificate recipients
 */
export async function getAllCertificateRecipients() {
  try {
    const { data, error } = await supabase
      .from('certificate_recipients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase query error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error('Failed to fetch from Supabase:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== '' && supabaseAnonKey !== '');
}
