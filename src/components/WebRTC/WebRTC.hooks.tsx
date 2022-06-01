import { useEffect, useState } from 'react';
import {
  log,
  Offer,
  MediaConstraints,
  Resource,
  PeerMessageType,
  Video,
  Candidate,
} from '../../utils';
import Core from '../../core';

export const useOnOpen = (conn: WebSocket | null) => {
  const [openEvent, setOpenEvent] = useState<Event | null>(null);
  useEffect(() => {
    if (!conn) {
      setOpenEvent(null);
      return () => {
        /** */
      };
    }
    // eslint-disable-next-line no-param-reassign
    conn.onopen = (ev) => {
      log('info', 'open', ev);
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

export const useOnError = (conn: WebSocket | null) => {
  const [errorEvent, setErrorEvent] = useState<Event | null>();
  useEffect(() => {
    if (!conn) {
      setErrorEvent(null);
      return () => {
        /** */
      };
    }
    // eslint-disable-next-line no-param-reassign
    conn.onerror = (e) => {
      log('error', 'error', e);
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

export const useOnClose = (conn: WebSocket | null) => {
  const [closeEvent, setCloseEvent] = useState<CloseEvent | null>();
  useEffect(() => {
    if (!conn) {
      setCloseEvent(null);
      return () => {
        /** */
      };
    }
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
