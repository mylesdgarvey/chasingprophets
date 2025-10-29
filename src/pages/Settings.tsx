import React from "react";
import { Moon, Sun } from "react-feather";
import { useTheme } from "../context/ThemeContext";
import type { ThemeMode } from "../context/ThemeContext";
import "./Settings.css";

type ThemeOption = {
  id: ThemeMode;
  title: string;
  description: string;
  icon: React.ReactNode;
};

const THEME_OPTIONS: ThemeOption[] = [
  {
    id: "day",
    title: "Daylight",
    description: "Bright surfaces with crisp shadows for daylight trading floors.",
    icon: <Sun size={24} />
  },
  {
    id: "night",
    title: "Nightfall",
    description: "Low-glare palette tuned for evening war rooms and late sessions.",
    icon: <Moon size={24} />
  }
];

export default function Settings() {
  const { theme, setTheme, toggleTheme } = useTheme();

  return (
    <div className="settings-page">
      <header className="settings-header">
        <h1>Workspace preferences</h1>
        <p>Fine-tune how ChasingProphets feels across devices. These options update instantly so you can preview changes as you decide.</p>
      </header>

      <section className="settings-section">
        <div className="section-heading">
          <div>
            <h2>Appearance</h2>
            <p>Choose the visual language that fits your environment. Theme selections sync across the dashboard and saved sessions.</p>
          </div>
          <button type="button" className="ghost-switch" onClick={toggleTheme}>
            Quick toggle
          </button>
        </div>

        <div className="theme-grid">
          {THEME_OPTIONS.map((option) => {
            const isActive = theme === option.id;
            return (
              <button
                key={option.id}
                type="button"
                className={`theme-card ${isActive ? "active" : ""}`}
                onClick={() => setTheme(option.id)}
              >
                <div className="theme-card-header">
                  <span className="theme-icon">{option.icon}</span>
                  <span className="theme-title">{option.title}</span>
                </div>
                <p className="theme-description">{option.description}</p>
                <div className="theme-preview" aria-hidden="true">
                  <div className="preview-banner" />
                  <div className="preview-metrics">
                    <div className="preview-card" />
                    <div className="preview-card" />
                    <div className="preview-card" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="settings-section">
        <div className="section-heading">
          <div>
            <h2>Account basics</h2>
            <p>Update contact details so alerts and hand-offs reach the right team member.</p>
          </div>
        </div>
        <form className="account-form">
          <label className="form-field">
            <span>Email</span>
            <input type="email" placeholder="trader@firm.com" />
          </label>
          <label className="form-field">
            <span>Display name</span>
            <input type="text" placeholder="Your preferred call sign" />
          </label>
          <label className="form-field">
            <span>New password</span>
            <input type="password" placeholder="********" />
          </label>
          <div className="form-actions">
            <button type="submit" className="primary-button">Save changes</button>
            <button type="button" className="secondary-button">Reset</button>
          </div>
        </form>
      </section>
    </div>
  );
}