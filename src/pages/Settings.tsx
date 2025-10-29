import React, { useEffect, useMemo, useRef, useState } from "react";
import { Moon, Sun } from "react-feather";
import { useTheme } from "../context/ThemeContext";
import "./Settings.css";

type ThemeOption = {
  id: "night" | "day";
  title: string;
  description: string;
  icon: React.ReactNode;
};

export default function Settings() {
  const { theme, setTheme, toggleTheme } = useTheme();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "saved">("idle");
  const resetTimerRef = useRef<number | null>(null);

  const themeOptions = useMemo<ThemeOption[]>(
    () => [
      {
        id: "night",
        title: "Night Ops",
        description:
          "Deep blues with neon highlights purpose-built for dark rooms and overnight monitoring shifts.",
        icon: <Moon size={20} />
      },
      {
        id: "day",
        title: "Daylight",
        description:
          "Bright, glassmorphic palette tuned for clarity in well lit environments and daytime operations.",
        icon: <Sun size={20} />
      }
    ],
    []
  );

  const handleAccountSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("saved");
    if (resetTimerRef.current) {
      window.clearTimeout(resetTimerRef.current);
    }
    resetTimerRef.current = window.setTimeout(() => setStatus("idle"), 2200);
  };

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="settings-page">
      <header className="settings-header">
        <h1>Platform Settings</h1>
        <p>
          Personalise the console for night ops or daylight duty and keep your operator profile up to date.
        </p>
      </header>

      <section className="settings-section">
        <div className="section-heading">
          <div>
            <h2>Theme Mode</h2>
            <p>Choose between the immersive night deck or the brighter day cockpit. Changes apply instantly.</p>
          </div>
          <button className="ghost-switch" type="button" onClick={toggleTheme}>
            Toggle to {theme === "night" ? "Day" : "Night"} Mode
          </button>
        </div>

        <div className="theme-grid">
          {themeOptions.map(option => (
            <button
              key={option.id}
              type="button"
              className={`theme-card ${theme === option.id ? "active" : ""}`}
              onClick={() => setTheme(option.id)}
            >
              <div className="theme-card-header">
                <span className="theme-icon">{option.icon}</span>
                <div>
                  <div className="theme-title">{option.title}</div>
                  <div className="theme-description">{option.description}</div>
                </div>
              </div>
              <div className="theme-preview">
                <div className="preview-banner" />
                <div className="preview-metrics">
                  <div className="preview-card" />
                  <div className="preview-card" />
                  <div className="preview-card" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <div className="section-heading">
          <div>
            <h2>Operator Profile</h2>
            <p>Update mission-critical contact details and keep your authentication credentials fresh.</p>
          </div>
        </div>
        <form className="account-form" onSubmit={handleAccountSubmit}>
          <label className="form-field" htmlFor="settings-email">
            Email Address
            <input
              id="settings-email"
              type="email"
              autoComplete="email"
              placeholder="ops@chasingprophets.ai"
              value={email}
              onChange={event => setEmail(event.target.value)}
            />
          </label>
          <label className="form-field" htmlFor="settings-password">
            New Password
            <input
              id="settings-password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={event => setPassword(event.target.value)}
            />
          </label>
          <div className="form-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setEmail("");
                setPassword("");
                setStatus("idle");
              }}
            >
              Reset
            </button>
            <button className="primary-button" type="submit">
              {status === "saved" ? "Saved" : "Save Changes"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}