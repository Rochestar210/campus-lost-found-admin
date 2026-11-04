import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        // Check their role in Firestore
        try {
          const userDoc = await getDoc(doc(db, "users", u.uid));
          if (userDoc.exists() && userDoc.data().role === "admin") {
            setUser(u); // They are an admin, let them in
            setErrorMsg("");
          } else {
            // Not an admin! Kick them out.
            await signOut(auth);
            setUser(null);
            setErrorMsg("Access Denied: You do not have Admin privileges.");
          }
        } catch (err) {
          console.error(err);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return <p style={{ padding: 40 }}>Verifying Admin Access…</p>;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          <div>
            {errorMsg && (
              <div style={{ background: "#fee2e2", color: "#991b1b", padding: 12, textAlign: "center", fontWeight: "bold" }}>
                {errorMsg}
              </div>
            )}
            <Login />
          </div>
        } />
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      </Routes>
    </BrowserRouter>
  );
}