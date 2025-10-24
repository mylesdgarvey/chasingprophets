import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function LoginPage() {
  const [credentials, setCredentials] = useState({ username: "", password: "", newPassword: "" });
  const [error, setError] = useState("");
  const [isNewPasswordRequired, setIsNewPasswordRequired] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await signIn(credentials.username, credentials.password, credentials.newPassword);
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Login failed:", err);
      if (err.code === "NewPasswordRequired") {
        setIsNewPasswordRequired(true);
        setError("Please set a new password.");
      } else {
        setError(err.message || "Invalid credentials. Please try again.");
      }
    }
  };

  return (
    <div style={{
      maxWidth: '400px',
      margin: '40px auto',
      padding: '20px',
      boxShadow: '0 0 10px rgba(0,0,0,0.1)',
      borderRadius: '8px'
    }}>
      <h1 style={{textAlign: 'center', marginBottom: '30px'}}>ChasingProphets</h1>
      <form onSubmit={handleSubmit}>
        <div style={{marginBottom: '15px'}}>
          <label style={{display: 'block', marginBottom: '5px'}}>Username</label>
          <input
            type="text"
            value={credentials.username}
            onChange={(e) => setCredentials({...credentials, username: e.target.value})}
            style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd'}}
          />
        </div>
        <div style={{marginBottom: '20px'}}>
          <label style={{display: 'block', marginBottom: '5px'}}>Password</label>
          <input
            type="password"
            value={credentials.password}
            onChange={(e) => setCredentials({...credentials, password: e.target.value})}
            style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd'}}
          />
        </div>
        {isNewPasswordRequired && (
          <div style={{marginBottom: '20px'}}>
            <label style={{display: 'block', marginBottom: '5px'}}>New Password</label>
            <input
              type="password"
              value={credentials.newPassword}
              onChange={(e) => setCredentials({...credentials, newPassword: e.target.value})}
              style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd'}}
              placeholder="Enter your new password"
            />
          </div>
        )}
        {error && (
          <div style={{
            color: 'red',
            marginBottom: '15px',
            textAlign: 'center',
            padding: '8px',
            backgroundColor: '#ffebee',
            borderRadius: '4px'
          }}>
            {error}
          </div>
        )}
        <button 
          type="submit"
          style={{
            width: '100%',
            padding: '10px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Sign In
        </button>
      </form>
    </div>
  );
}