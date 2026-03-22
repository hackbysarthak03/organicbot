import React, { useState, useEffect } from 'react';
import ChatBot from './components/ChatBot';
import AuthModal from './components/AuthModal';

function App() {
  const [user, setUser] = useState(null);

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfdfc] relative">
      <ChatBot user={user} />
      {!user && <AuthModal onLogin={setUser} />}
    </div>
  );
}

export default App;

