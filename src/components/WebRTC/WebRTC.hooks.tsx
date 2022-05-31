import { useEffect, useState } from 'react';

export const useOnOpen = (conn: WebSocket) => {
  const [openEvent, setOpenEvent] = useState<Event>();
  useEffect(() => {
    // eslint-disable-next-line no-param-reassign
    conn.onopen = (ev) => {
      console.log('open', ev);
      setOpenEvent(ev);
    };
    return () => {
      // eslint-disable-next-line no-param-reassign
      conn.onopen = () => {
        /** */
      };
    };
  }, [conn]);
  return openEvent;
};

export const useOnError = (conn: WebSocket) => {
  const [errorEvent, setErrorEvent] = useState<Event>();
  useEffect(() => {
    // eslint-disable-next-line no-param-reassign
    conn.onerror = (e) => {
      console.log('error', e);
      setErrorEvent(e);
    };
    return () => {
      // eslint-disable-next-line no-param-reassign
      conn.onerror = () => {
        /** */
      };
    };
  }, [conn]);
  return errorEvent;
};

export const useOnMessage = (conn: WebSocket) => {
  const [messageEvent, setMessageEvent] = useState<MessageEvent<any>>();
  useEffect(() => {
    // eslint-disable-next-line no-param-reassign
    conn.onmessage = (e) => {
      console.log('message', e);
      setMessageEvent(e);
    };
    return () => {
      // eslint-disable-next-line no-param-reassign
      conn.onmessage = () => {
        /** */
      };
    };
  }, [conn]);
  return messageEvent;
};

export const useOnClose = (conn: WebSocket) => {
  const [closeEvent, setCloseEvent] = useState<CloseEvent>();
  useEffect(() => {
    // eslint-disable-next-line no-param-reassign
    conn.onclose = (e) => {
      console.log('close', e);
      setCloseEvent(e);
    };
    return () => {
      // eslint-disable-next-line no-param-reassign
      conn.onclose = () => {
        /** */
      };
    };
  }, [conn]);
  return closeEvent;
};
