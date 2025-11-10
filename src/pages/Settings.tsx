import React, { useEffect, useMemo, useRef, useState } from "react";
import { Moon, Sun, Zap, Sunrise, Globe, Layers, Aperture } from "react-feather";
import { useTheme } from "../context/ThemeContext";
import { themes } from "../themes/themeConfigs";
import type { ThemeMode } from "../context/ThemeContext";
import "./Settings.css";

type ThemeOption = {
  id: ThemeMode;
  title: string;
  description: string;
  icon: React.ReactNode;
  previewColors: {
    primary: string;
    secondary: string;
    accent: string;
  };
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
        id: "night-blue",
        title: "Night Blue",
        description: "Deep blues with neon highlights purpose-built for dark rooms and overnight monitoring shifts.",
        icon: <Moon size={20} />,
        previewColors: {
          primary: "#0a1628",
          secondary: "#122344",
          accent: "#5eb8ff"
        }
      },
      {
        id: "day-light",
        title: "Day Light",
        description: "Bright, glassmorphic palette tuned for clarity in well-lit environments and daytime operations.",
        icon: <Sun size={20} />,
        previewColors: {
          primary: "#f8fafc",
          secondary: "#e2e8f0",
          accent: "#3b82f6"
        }
      },
      {
        id: "cyber-purple",
        title: "Cyber Purple",
        description: "Vibrant cyberpunk aesthetic with magenta and purple tones for a futuristic command center feel.",
        icon: <Zap size={20} />,
        previewColors: {
          primary: "#1a0a28",
          secondary: "#2d1844",
          accent: "#d946ef"
        }
      },
      {
        id: "forest-green",
        title: "Forest Green",
        description: "Earthy green tones inspired by nature, providing a calm and focused environment.",
        icon: <Layers size={20} />,
        previewColors: {
          primary: "#0a1610",
          secondary: "#122f20",
          accent: "#34d399"
        }
      },
      {
        id: "sunset-orange",
        title: "Sunset Orange",
        description: "Warm sunset tones with orange and amber hues, perfect for evening trading sessions.",
        icon: <Sunrise size={20} />,
        previewColors: {
          primary: "#1a0f0a",
          secondary: "#442218",
          accent: "#ff985e"
        }
      },
      {
        id: "deep-space",
        title: "Deep Space",
        description: "Ultra-dark theme with minimal contrast, optimized for OLED screens and reduced eye strain.",
        icon: <Globe size={20} />,
        previewColors: {
          primary: "#000000",
          secondary: "#0f0f15",
          accent: "#8ab4f8"
        }
      },
      {
        id: "psychedelic",
        title: "Psychedelic",
        description: "Groovy hippie vibes with neon magenta, cyan, and electric green for the ultimate trippy experience.",
        icon: <Aperture size={20} />,
        previewColors: {
          primary: "#1a0d2e",
          secondary: "#2d1b4e",
          accent: "#ff00ff"
        }
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
            <p>Choose your preferred color scheme. All themes support both light and dark variants with unique accent colors.</p>
          </div>
        </div>

        <div className="theme-grid">
          {themeOptions.map(option => {
            // Normalize theme comparison (handle legacy 'night' and 'day' values)
            const isActive = theme === option.id || 
                           (theme === 'night' && option.id === 'night-blue') ||
                           (theme === 'day' && option.id === 'day-light');
            
            return (
              <button
                key={option.id}
                type="button"
                className={`theme-card ${isActive ? "active" : ""}`}
                onClick={() => setTheme(option.id)}
              >
                <div className="theme-card-header">
                  <span className="theme-icon">{option.icon}</span>
                  <div>
                    <div className="theme-title">{option.title}</div>
                    <div className="theme-description">{option.description}</div>
                  </div>
                </div>
                <div className="theme-preview" style={{
                  background: `linear-gradient(135deg, ${option.previewColors.primary} 0%, ${option.previewColors.secondary} 100%)`
                }}>
                  <div className="preview-banner" style={{ background: option.previewColors.accent }} />
                  <div className="preview-metrics">
                    <div className="preview-card" style={{ background: option.previewColors.secondary, opacity: 0.8 }} />
                    <div className="preview-card" style={{ background: option.previewColors.secondary, opacity: 0.6 }} />
                    <div className="preview-card" style={{ background: option.previewColors.secondary, opacity: 0.4 }} />
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