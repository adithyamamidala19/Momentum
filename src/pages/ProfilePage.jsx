import React, { useState } from 'react';
import { useMomentum } from '../context/MomentumContext.jsx';
import { User, Download, Upload, Sparkles, Heart, ShieldCheck } from 'lucide-react';

export default function ProfilePage() {
  const { state, updateProfile, showToast } = useMomentum();
  const [name, setName] = useState(state.name || 'Adithya');
  const [mantra, setMantra] = useState(state.mantra || 'Slow is smooth, smooth is fast.');

  const handleSave = (e) => {
    e.preventDefault();
    updateProfile({ name, mantra });
  };

  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `momentum_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Rhythm data exported successfully.');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 select-none">
      {/* Title */}
      <div>
        <span className="text-[10px] uppercase font-bold tracking-wider text-primary-container">
          Identity & Rhythm
        </span>
        <h1 className="font-editorial text-3xl font-normal text-on-surface mt-0.5">
          Profile & Preferences
        </h1>
        <p className="text-xs text-outline">
          Personalize your daily quiet reflection and own your rhythm data.
        </p>
      </div>

      {/* Profile Card Form */}
      <form onSubmit={handleSave} className="p-6 rounded-3xl bg-surface-container-lowest hairline shadow-xs space-y-4">
        <div className="flex items-center gap-4 pb-4 hairline-b">
          <div className="w-16 h-16 rounded-full bg-primary-fixed text-primary-container flex items-center justify-center font-bold text-xl shadow-xs">
            {name.charAt(0) || 'A'}
          </div>
          <div>
            <h2 className="text-base font-bold text-on-surface">{name}</h2>
            <p className="text-xs text-outline italic">“{mantra}”</p>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-on-surface block mb-1">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low hairline text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container"
            required
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-on-surface block mb-1">Personal Daily Mantra</label>
          <input
            type="text"
            value={mantra}
            onChange={e => setMantra(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low hairline text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container"
          />
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 rounded-full bg-primary-container hover:bg-primary-container-hover text-white text-xs font-semibold cursor-pointer border-0 shadow-xs transition-colors"
        >
          Save Changes
        </button>
      </form>

      {/* Data Sovereignty & Export */}
      <div className="p-6 rounded-3xl bg-surface-container-lowest hairline shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-primary-container" />
          <span>Data Sovereignty & Offline Backup</span>
        </h3>
        <p className="text-xs text-outline leading-relaxed">
          Your habits, workouts, notes, and milestones are stored directly on your device. You can download a complete JSON snapshot at any time.
        </p>

        <button
          type="button"
          onClick={handleExportData}
          className="px-4 py-2.5 rounded-full bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface flex items-center gap-2 cursor-pointer border-0 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Rhythm Data (JSON)</span>
        </button>
      </div>
    </div>
  );
}
