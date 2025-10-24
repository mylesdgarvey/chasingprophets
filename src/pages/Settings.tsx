import React from "react";

export default function Settings() {
  return (
    <div>
      <h2>Settings</h2>
      <form style={{maxWidth: '400px', marginTop: '20px'}}>
        <div style={{marginBottom: '15px'}}>
          <label style={{display: 'block', marginBottom: '5px'}}>Email</label>
          <input 
            type="email" 
            style={{width: '100%', padding: '8px'}}
            placeholder="your@email.com"
          />
        </div>
        <div style={{marginBottom: '15px'}}>
          <label style={{display: 'block', marginBottom: '5px'}}>Password</label>
          <input 
            type="password" 
            style={{width: '100%', padding: '8px'}}
            placeholder="Change password"
          />
        </div>
        <button 
          type="submit"
          style={{
            background: '#007bff',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}