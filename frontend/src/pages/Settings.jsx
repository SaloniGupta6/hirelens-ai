import { useEffect, useState } from "react";
import { UserRound, Bell, SlidersHorizontal, Save, RotateCcw, CheckCircle2 } from "lucide-react";

const defaultSettings = {
  name: "Recruiter",
  email: "",
  role: "Recruitment Administrator",
  company: "HireLens Workspace",
  emailNotifications: true,
  screeningNotifications: true,
  weeklySummary: false,
  shortlistThreshold: "80",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState(defaultSettings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("hirelens_profile_settings") || "{}");
      setSettings({ ...defaultSettings, ...stored });
    } catch {
      setSettings(defaultSettings);
    }
  }, []);

  const update = (key, value) => {
    setSettings((current) => ({ ...current, [key]: value }));
    setSaved(false);
  };

  const saveSettings = () => {
    localStorage.setItem("hirelens_profile_settings", JSON.stringify(settings));
    window.dispatchEvent(new Event("hirelens-profile-updated"));
    setSaved(true);
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.setItem("hirelens_profile_settings", JSON.stringify(defaultSettings));
    setSaved(true);
  };

  const initials = settings.name.trim()
    ? settings.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()
    : "R";

  return (
    <div className="settings-page">
      <section className="panel settings-card">
        <div className="settings-section-heading">
          <div className="settings-heading-icon"><UserRound size={19} /></div>
          <div>
            <h2>Profile information</h2>
            <p>Manage the details associated with your recruiter profile.</p>
          </div>
        </div>

        <div className="settings-profile-preview">
          <div className="settings-avatar">{initials}</div>
          <div>
            <strong>{settings.name || "Your name"}</strong>
            <span>{settings.role || "Recruiter"}</span>
          </div>
        </div>

        <div className="settings-form-grid">
          <label>
            Full name
            <input value={settings.name} onChange={(e) => update("name", e.target.value)} placeholder="Enter your name" />
          </label>
          <label>
            Email address
            <input type="email" value={settings.email} onChange={(e) => update("email", e.target.value)} placeholder="name@company.com" />
          </label>
          <label>
            Job title
            <input value={settings.role} onChange={(e) => update("role", e.target.value)} placeholder="e.g. Talent Acquisition Manager" />
          </label>
          <label>
            Organization
            <input value={settings.company} onChange={(e) => update("company", e.target.value)} placeholder="Enter organization name" />
          </label>
        </div>
      </section>

      <section className="panel settings-card">
        <div className="settings-section-heading">
          <div className="settings-heading-icon"><Bell size={19} /></div>
          <div>
            <h2>Notification preferences</h2>
            <p>Choose which updates you want to see in your workspace.</p>
          </div>
        </div>

        <div className="settings-options">
          {[
            ["emailNotifications", "Email notifications", "Receive important recruitment and workspace updates."],
            ["screeningNotifications", "Screening updates", "Get notified when resume screening is completed."],
            ["weeklySummary", "Weekly summary", "Receive a weekly overview of your recruitment activity."],
          ].map(([key, title, description]) => (
            <label className="settings-toggle-row" key={key}>
              <span><strong>{title}</strong><small>{description}</small></span>
              <input type="checkbox" checked={settings[key]} onChange={(e) => update(key, e.target.checked)} />
            </label>
          ))}
        </div>
      </section>

      <section className="panel settings-card">
        <div className="settings-section-heading">
          <div className="settings-heading-icon"><SlidersHorizontal size={19} /></div>
          <div>
            <h2>Screening preferences</h2>
            <p>Set the default score threshold used to identify strong matches.</p>
          </div>
        </div>

        <label className="settings-threshold">
          Strong match threshold
          <select value={settings.shortlistThreshold} onChange={(e) => update("shortlistThreshold", e.target.value)}>
            <option value="60">60% — Flexible</option>
            <option value="70">70% — Moderate</option>
            <option value="80">80% — Recommended</option>
            <option value="90">90% — Strict</option>
          </select>
          <small>Candidates meeting or exceeding this score can be treated as strong matches in your screening workflow.</small>
        </label>
      </section>

      <div className="settings-actions">
        <button className="settings-reset-button" onClick={resetSettings}>
          <RotateCcw size={16} /> Restore defaults
        </button>
        <button className="primary-button" onClick={saveSettings}>
          {saved ? <CheckCircle2 size={17} /> : <Save size={17} />}
          {saved ? "Saved successfully" : "Save changes"}
        </button>
      </div>
      <p className="settings-storage-note">Your settings are stored locally in this browser. This demo does not use a connected account or cloud profile.</p>
    </div>
  );
}
