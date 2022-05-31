import React, { useEffect, useMemo } from 'react';
import s from './App.module.scss';
import WebRTC from './components/WebRTC/WebRTC';

function App() {
  return (
    <div className={s.wrapper}>
      <WebRTC />
    </div>
  );
}

export default App;
