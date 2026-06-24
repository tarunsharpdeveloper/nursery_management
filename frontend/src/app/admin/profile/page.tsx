"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { apiRequest, getStoredUser, setStoredUser, type AdminUser } from "@/lib/api";

export default function ProfilePage() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileMessage, setProfileMessage] = useState({ text: "", type: "" });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState({ text: "", type: "" });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
      setProfileName(stored.name);
      setProfileEmail(stored.email);
    }
  }, []);

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileMessage({ text: "", type: "" });

    try {
      await apiRequest("/api/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({ name: profileName, email: profileEmail }),
      });
      setProfileMessage({ text: "Profile updated successfully.", type: "success" });
      
      // Update stored user
      if (user) {
        const updatedUser = { ...user, name: profileName, email: profileEmail };
        setUser(updatedUser);
        setStoredUser(updatedUser);
        // Refresh page so sidebar logo updates
        window.location.reload();
      }
    } catch (err: any) {
      setProfileMessage({ text: err.message || "Failed to update profile.", type: "error" });
    } finally {
      setIsUpdatingProfile(false);
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMessage({ text: "", type: "" });

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: "New passwords do not match.", type: "error" });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ text: "Password must be at least 6 characters.", type: "error" });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await apiRequest("/api/auth/password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setPasswordMessage({ text: "Password updated successfully.", type: "success" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordMessage({ text: err.message || "Failed to update password.", type: "error" });
    } finally {
      setIsUpdatingPassword(false);
    }
  }

  if (!user) return <AdminShell><div className="section"><p>Loading...</p></div></AdminShell>;

  return (
    <AdminShell>
      <div className="section" style={{ padding: '32px' }}>
        <h1 className="brand-name" style={{ fontSize: '24px', marginBottom: '24px' }}>My Profile</h1>
        
        <div style={{ display: 'grid', gap: '32px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          
          {/* Profile Settings Form */}
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '16px', borderBottom: '1px solid var(--line)', paddingBottom: '8px' }}>Profile Settings</h2>
            
            {profileMessage.text && (
              <div style={{ 
                padding: '10px 14px', 
                marginBottom: '16px', 
                borderRadius: '6px', 
                background: profileMessage.type === 'error' ? '#fee2e2' : '#dcfce7',
                color: profileMessage.type === 'error' ? '#991b1b' : '#166534',
                fontSize: '14px'
              }}>
                {profileMessage.text}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '6px' }}>Name</label>
                <input 
                  type="text" 
                  value={profileName} 
                  onChange={e => setProfileName(e.target.value)} 
                  required 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--line)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '6px' }}>Email</label>
                <input 
                  type="email" 
                  value={profileEmail} 
                  onChange={e => setProfileEmail(e.target.value)} 
                  required 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--line)' }}
                />
              </div>
              <button 
                type="submit" 
                className="button" 
                disabled={isUpdatingProfile}
                style={{ alignSelf: 'flex-start', marginTop: '8px' }}
              >
                {isUpdatingProfile ? "Saving..." : "Save Profile"}
              </button>
            </form>
          </div>

          {/* Change Password Form */}
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '16px', borderBottom: '1px solid var(--line)', paddingBottom: '8px' }}>Security</h2>
            
            {passwordMessage.text && (
              <div style={{ 
                padding: '10px 14px', 
                marginBottom: '16px', 
                borderRadius: '6px', 
                background: passwordMessage.type === 'error' ? '#fee2e2' : '#dcfce7',
                color: passwordMessage.type === 'error' ? '#991b1b' : '#166534',
                fontSize: '14px'
              }}>
                {passwordMessage.text}
              </div>
            )}

            <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '6px' }}>Current Password</label>
                <input 
                  type="password" 
                  value={currentPassword} 
                  onChange={e => setCurrentPassword(e.target.value)} 
                  required 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--line)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '6px' }}>New Password</label>
                <input 
                  type="password" 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  required 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--line)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '6px' }}>Confirm New Password</label>
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  required 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--line)' }}
                />
              </div>
              <button 
                type="submit" 
                className="button" 
                disabled={isUpdatingPassword}
                style={{ alignSelf: 'flex-start', marginTop: '8px' }}
              >
                {isUpdatingPassword ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>

        </div>
      </div>
    </AdminShell>
  );
}
