import React, { useMemo, useEffect, useState } from 'react';
import { AppView, JobRecord, SentRecord, UserProfile } from '../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  sentRecords: SentRecord[];
  profiles: UserProfile[];
  onNavigate: (view: AppView) => void;
}

const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  query,
  sentRecords,
  profiles,
  onNavigate,
}) => {
  const [jobs, setJobs] = useState<JobRecord[]>([]);

  // ✅ Fetch jobs from backend when component loads
  useEffect(() => {
    if (!isOpen) return; // only fetch when modal opens

    fetch('https://titanmmmt.onrender.com/api/jobs') // your backend jobs endpoint
      .then(res => res.json())
      .then(data => setJobs(data.jobs || []))
      .catch(err => console.error('Error fetching jobs:', err));
  }, [isOpen]);

  if (!isOpen) return null;

  const results = useMemo(() => {
    const q = (query || '').toLowerCase().trim();
    if (!q) return { jobs: [], history: [], profiles: [], total: 0 };

    const jobNodes = (jobs || []).filter(j =>
      j.role.toLowerCase().includes(q) ||
      j.company.toLowerCase().includes(q) ||
      (j.description || '').toLowerCase().includes(q) ||
      (j.location || '').toLowerCase().includes(q)
    );

    const historyNodes = (sentRecords || []).filter(r =>
      r.recipient.toLowerCase().includes(q) ||
      r.subject.toLowerCase().includes(q) ||
      r.type.toLowerCase().includes(q)
    );

    const profileNodes = (profiles || []).filter(p =>
      p.fullName.toLowerCase().includes(q) ||
      p.masterCV.toLowerCase().includes(q)
    );

    return {
      jobs: jobNodes,
      history: historyNodes,
      profiles: profileNodes,
      total: jobNodes.length + historyNodes.length + profileNodes.length,
    };
  }, [query, jobs, sentRecords, profiles]);

  const navigateTo = (view: AppView) => {
    onNavigate(view);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-12 bg-black/98 backdrop-blur-3xl animate-in fade-in duration-200"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      {/* The rest of your modal JSX remains unchanged */}
      {/* ... */}
    </div>
  );
};

export default GlobalSearchModal;
