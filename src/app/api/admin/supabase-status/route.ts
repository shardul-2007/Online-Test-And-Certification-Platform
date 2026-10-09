import { NextRequest, NextResponse } from 'next/server';
import { supabase, getAllCertificateRecipients } from '@/lib/supabase';
import { getCurrentAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || admin.email.toLowerCase() !== 'shardulparihar2007@gmail.com') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check certificate_recipients table
    const { count, error } = await supabase
      .from('certificate_recipients')
      .select('*', { count: 'exact', head: true });

    if (error && error.code === 'PGRST205') {
      return NextResponse.json({
        success: true,
        connected: false,
        tableExists: false,
        message: "Supabase table 'certificate_recipients' does not exist yet.",
      });
    }

    if (error) {
      return NextResponse.json({
        success: true,
        connected: true,
        tableExists: false,
        error: error.message,
      });
    }

    return NextResponse.json({
      success: true,
      connected: true,
      tableExists: true,
      recordsCount: count || 0,
      message: `Supabase PostgreSQL database is fully connected and active (${count || 0} participants stored permanently)!`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
