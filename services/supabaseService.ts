import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rhzlykkepamegubaongf.supabase.co';
// Using the provided JWT as the anon key for the Supabase Client
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoemx5a2tlcGFtZWd1YmFvbmdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NTc2NjQsImV4cCI6MjA4NjMzMzY2NH0.NoA_FuPj8KIMH7vMx22omIE4ZSuVJC_rFXF-cwvSLzo';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const supabaseService = {
  async saveJobs(jobs: any[]) {
    if (!jobs || jobs.length === 0) return true;
    try {
      const { error } = await supabase
        .from('titan_jobs')
        .upsert(jobs.map(j => ({ id: j.id, data: j })), { onConflict: 'id' });
      
      if (error) {
        console.warn("SUPABASE_SYNC_WARNING: Ensure 'titan_jobs' table exists.", error);
        return false;
      }
      return true;
    } catch (e) {
      console.error("SUPABASE_SAVE_JOBS_FAIL:", e);
      return false;
    }
  },

  async loadJobs() {
    try {
      const { data, error } = await supabase
        .from('titan_jobs')
        .select('data');
      
      if (error || !data) return null;
      return data.map(d => d.data);
    } catch (e) {
      return null;
    }
  },

  async saveSentRecords(records: any[]) {
    if (!records || records.length === 0) return true;
    try {
      const { error } = await supabase
        .from('titan_sent_records')
        .upsert(records.map(r => ({ id: r.id, data: r })), { onConflict: 'id' });
      
      if (error) {
        console.warn("SUPABASE_SYNC_WARNING: Ensure 'titan_sent_records' table exists.", error);
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  },

  async loadSentRecords() {
    try {
      const { data, error } = await supabase
        .from('titan_sent_records')
        .select('data');
      
      if (error || !data) return null;
      return data.map(d => d.data);
    } catch (e) {
      return null;
    }
  }
};