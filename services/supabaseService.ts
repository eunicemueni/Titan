
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rhzlykkepamegubaongf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoemx5a2tlcGFtZWd1YmFvbmdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NTc2NjQsImV4cCI6MjA4NjMzMzY2NH0.NoA_FuPj8KIMH7vMx22omIE4ZSuVJC_rFXF-cwvSLzo';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const supabaseService = {
  async saveJobs(jobs: any[]) {
    if (!jobs || jobs.length === 0) return true;
    try {
      const { error } = await supabase
        .from('titan_jobs')
        .upsert(jobs.map(j => ({ id: j.id, data: j })), { onConflict: 'id' });
      return !error;
    } catch (e) {
      return false;
    }
  },

  async loadJobs() {
    try {
      const { data, error } = await supabase.from('titan_jobs').select('data');
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
      return !error;
    } catch (e) {
      return false;
    }
  },

  async loadSentRecords() {
    try {
      const { data, error } = await supabase.from('titan_sent_records').select('data');
      if (error || !data) return null;
      return data.map(d => d.data);
    } catch (e) {
      return null;
    }
  },

  // NEW: Profile Persistence for Eunice / Ayana
  async saveProfiles(profiles: any[]) {
    try {
      const { error } = await supabase
        .from('titan_profiles')
        .upsert(profiles.map((p, i) => ({ id: `profile-${i}`, data: p })), { onConflict: 'id' });
      return !error;
    } catch (e) {
      return false;
    }
  },

  async loadProfiles() {
    try {
      const { data, error } = await supabase.from('titan_profiles').select('data').order('id');
      if (error || !data || data.length === 0) return null;
      return data.map(d => d.data);
    } catch (e) {
      return null;
    }
  }
};
