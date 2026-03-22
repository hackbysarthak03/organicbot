import React, { useState, useEffect } from 'react';
import ChatBot from './components/ChatBot';
import AuthModal from './components/AuthModal';

import { Toaster } from 'react-hot-toast';

function App() {
  const [user, setUser] = useState(null);

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfdfc] relative">
      <Toaster position="top-center" toastOptions={{ className: 'font-sans' }} />
      <ChatBot user={user} />
      {!user && <AuthModal onLogin={setUser} />}
    </div>
  );
}

export default App;

