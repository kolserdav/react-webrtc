import React, { useMemo, useEffect } from 'react';
import { useOnClose, useOnError, useOnMessage, useOnOpen } from './WebRTC.hooks';
import s from './WebRTC.module.scss';

function WebRTC() {
  const conn = useMemo(() => new WebSocket('ws://localhost:8000/peer', 'json'), []);

  const open = useOnOpen(conn);
  const error = useOnError(conn);
  const message = useOnMessage(conn);
  const close = useOnClose(conn);

  useEffect(() => {
    console.log(message, 12);
  }, [message]);

  return <section>ds</section>;
}

export default WebRTC;
