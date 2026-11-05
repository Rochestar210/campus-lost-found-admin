import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const [permissions, setPermissions] = useState({
    student: { read: true, write: true },
    finder: { read: true, write: true },
    admin: { read: true, write: true },
  });
  const [claims, setClaims] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load current permissions and claims from Firestore
  useEffect(() => {
    const loadData = async () => {
      // 1. Load Permissions
      const docRef = doc(db, "settings", "permissions");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setPermissions(docSnap.data());
      }

      // 2. Load Claims
      const claimSnap = await getDocs(collection(db, "claims"));
      setClaims(claimSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    loadData();
  }, []);

  const handleToggle = (role, action) => {
    setPermissions((prev) => ({
      ...prev,
      [role]: { ...prev[role], [action]: !prev[role][action] },
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "permissions"), permissions);
      setSaved(true);
    } catch (err) {
      alert("Error saving: " + err.message);
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>🔒 Security Configuration Module</h1>
        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
      </div>
      <p style={styles.subtitle}>
        Configure read and write permissions for actors accessing the Campus Lost & Found modules.
      </p>

      {/* RBAC Table */}
      <div style={styles.card}>
        <h2>Role-Based Access Control (RBAC)</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Actor / Role</th>
              <th style={styles.th}>Read Access</th>
              <th style={styles.th}>Write Access</th>
            </tr>
          </thead>
          <tbody>
            {["student", "finder", "admin"].map((role) => (
              <tr key={role}>
                <td style={styles.td}>
                  <strong>{role.charAt(0).toUpperCase() + role.slice(1)}</strong>
                </td>
                <td style={styles.td}>
                  <input
                    type="checkbox"
                    checked={permissions[role].read}
                    onChange={() => handleToggle(role, "read")}
                    style={styles.checkbox}
                  />
                </td>
                <td style={styles.td}>
                  <input
                    type="checkbox"
                    checked={permissions[role].write}
                    onChange={() => handleToggle(role, "write")}
                    style={styles.checkbox}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button onClick={handleSave} style={styles.saveBtn} disabled={saving}>
          {saving ? "Saving..." : "Save Permissions"}
        </button>
        {saved && <p style={{ color: "green", marginTop: 10 }}>✅ Permissions saved successfully!</p>}
      </div>

      {/* Claims Messages Table */}
      <div style={{ ...styles.card, marginTop: 30 }}>
        <h2>📩 Claim Messages</h2>
        {claims.length === 0 ? (
          <p style={{ marginTop: 10, color: "#666" }}>No claims yet.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Item</th>
                <th style={styles.th}>Claimant Email</th>
                <th style={styles.th}>Message</th>
              </tr>
            </thead>
            <tbody>
              {claims.map(c => (
                <tr key={c.id}>
                  <td style={styles.td}><strong>{c.itemTitle}</strong></td>
                  <td style={styles.td}>{c.claimantEmail}</td>
                  <td style={styles.td}>{c.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: 800, margin: "40px auto", padding: 20 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  subtitle: { color: "#555", marginBottom: 20 },
  logoutBtn: { padding: "8px 16px", background: "#dc2626", color: "white", border: "none", borderRadius: 6, cursor: "pointer" },
  card: { background: "white", padding: 24, borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" },
  table: { width: "100%", borderCollapse: "collapse", marginTop: 16, marginBottom: 24 },
  th: { textAlign: "left", padding: 12, borderBottom: "2px solid #eee", background: "#f9fafb" },
  td: { padding: 12, borderBottom: "1px solid #eee" },
  checkbox: { width: 20, height: 20, cursor: "pointer" },
  saveBtn: { padding: "12px 24px", background: "#2563eb", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 16, fontWeight: "bold" },
};