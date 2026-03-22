import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, set, get, child, remove, serverTimestamp } from 'firebase/database';

export function useChats(user) {
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load Sessions
  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    if (user.isGuest) {
      const localData = localStorage.getItem('guest_sessions');
      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          setSessions(parsed);
          if (parsed.length > 0) setCurrentSessionId(parsed[0].id);
        } catch(e) { console.error("Error loading local storage", e); }
      }
      setLoading(false);
    } else {
      // Load from Realtime Database
      const loadRealtimeDB = async () => {
        try {
          const snapshot = await get(child(ref(db), `users/${user.uid}/sessions`));
          if (snapshot.exists()) {
            const data = snapshot.val();
            // Convert to array and sort by updatedAt descending
            const loaded = Object.keys(data).map(key => ({ id: key, ...data[key] }));
            loaded.sort((a, b) => b.updatedAt - a.updatedAt);
            setSessions(loaded);
            if (loaded.length > 0) setCurrentSessionId(loaded[0].id);
          } else {
            setSessions([]); 
          }
        } catch (e) {
          console.error("Error loading from rtdb", e);
        } finally {
          setLoading(false);
        }
      };
      loadRealtimeDB();
    }
  }, [user]);

  // Save Session
  const saveSession = async (sessionData) => {
    if (!user) return;
    
    // Auto-generate title from first user message if missing
    let finalTitle = sessionData.title || "New Chat";
    if (!sessionData.title && sessionData.messages.length > 0) {
      const firstUserMsg = sessionData.messages.find(m => m.role === 'user');
      if (firstUserMsg) {
        finalTitle = firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? '...' : '');
      }
    }

    const newSession = {
      ...sessionData,
      title: finalTitle,
      updatedAt: Date.now()
    };

    // Update state
    setSessions(prev => {
      const exists = prev.find(s => s.id === newSession.id);
      if (exists) {
        return prev.map(s => s.id === newSession.id ? newSession : s).sort((a,b) => b.updatedAt - a.updatedAt);
      }
      return [newSession, ...prev].sort((a,b) => b.updatedAt - a.updatedAt);
    });

    // Save to Layer
    if (user.isGuest) {
      setSessions(prev => {
        const toSave = prev.find(s => s.id === newSession.id) ? prev.map(s => s.id === newSession.id ? newSession : s) : [newSession, ...prev];
        localStorage.setItem('guest_sessions', JSON.stringify(toSave));
        return toSave;
      });
    } else {
      try {
        const saveReady = { ...newSession, updatedAt: serverTimestamp() };
        await set(ref(db, `users/${user.uid}/sessions/${newSession.id}`), saveReady);
      } catch (e) { console.error("Error saving to rtdb", e); }
    }
  };

  // Delete Session
  const deleteSession = async (sessionId) => {
    setSessions(prev => {
      const res = prev.filter(s => s.id !== sessionId);
      if (user.isGuest) localStorage.setItem('guest_sessions', JSON.stringify(res));
      return res;
    });

    if (currentSessionId === sessionId) {
      setCurrentSessionId(null);
    }

    if (!user.isGuest) {
      try {
        await remove(ref(db, `users/${user.uid}/sessions/${sessionId}`));
      } catch (e) { console.error("Error deleting from rtdb", e); }
    }
  };

  return { sessions, currentSessionId, setCurrentSessionId, saveSession, deleteSession, loading };
}
