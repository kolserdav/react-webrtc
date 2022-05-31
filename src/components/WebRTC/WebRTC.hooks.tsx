import { useEffect, useState } from 'react';
import { log, Offer, MediaConstraints, Resource, PeerMessageType } from '../../utils';
import Core from '../../core';

export const useOnOpen = (conn: WebSocket) => {
  const [openEvent, setOpenEvent] = useState<Event>();
  useEffect(() => {
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

export const useOnError = (conn: WebSocket) => {
  const [errorEvent, setErrorEvent] = useState<Event>();
  useEffect(() => {
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

export const useOnMessage = (conn: WebSocket) => {
  const [messageEvent, setMessageEvent] = useState<MessageEvent<any>>();
  useEffect(() => {
    // eslint-disable-next-line no-param-reassign
    conn.onmessage = (e) => {
      log('info', 'message', e);
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

interface Video {
  stream: MediaStream;
  id: number;
}

export const useHandleOffer = ({
  msg,
  core,
  targetUserId,
  userId,
}: {
  msg: Offer;
  core: Core;
  targetUserId: number;
  userId: number;
}): Video | null => {
  const [video, setVideo] = useState<Video | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [answer, setAnswer] = useState<boolean>(false);

  /**
   * Set media stream
   */
  useEffect(() => {
    const desc = new RTCSessionDescription(msg.sdp);
    const localStream: MediaStream = new MediaStream();
    const mSProm: Promise<MediaStream | null> = new Promise((resolve) => {
      if (!core.peerConnection) {
        log('error', 'Failed handle offer stream. Peer connection is', core.peerConnection);
        resolve(null);
        return;
      }
      core.peerConnection
        .setRemoteDescription(desc)
        .then(() => {
          log('info', 'Setting up the local media stream...');
          return navigator.mediaDevices.getUserMedia(MediaConstraints);
        })
        .then((stream) => {
          log('info', '-- Local video stream obtained');
          localStream.getTracks().forEach((track) => {
            if (!core.peerConnection) {
              log('warn', 'failed to add offer video track');
            } else {
              core.peerConnection.addTrack(track, localStream);
            }
          });
          resolve(stream);
        })
        .catch((e) => {
          log('error', 'Failed get user media', e.mesage);
          resolve(null);
        });
    });
    mSProm.then((stream) => {
      setMediaStream(stream);
    });
  }, [core.peerConnection, msg.sdp]);

  /**
   * Send answer
   */
  useEffect(() => {
    if (!core.peerConnection) {
      log('warn', 'Failed create answe', { peerConnection: core.peerConnection, mediaStream });
      return;
    }
    if (mediaStream) {
      log('info', '------> Creating answer');
      core.peerConnection.createAnswer().then((answ) => {
        if (!answ || !core.peerConnection) {
          log('error', 'Failed set local description for answer.', {
            answ,
            peerConnection: core.peerConnection,
          });
          return;
        }
        log('info', '------> Setting local description after creating answer');
        core.peerConnection.setLocalDescription(answ);
        setAnswer(true);
      });
    }
  }, [mediaStream, core]);

  /**
   * Set video
   */
  useEffect(() => {
    if (!core.peerConnection) {
      log('warn', 'Set video stream failed because peerConnection is', core.peerConnection);
      return;
    }
    if (answer) {
      const { localDescription } = core.peerConnection;
      if (localDescription && mediaStream) {
        log('info', 'Sending answer packet back to other peer');
        core.sendToServer<PeerMessageType.answer>({
          resource: Resource.peer,
          targetUserId,
          type: PeerMessageType.answer,
          sdp: localDescription,
        });
        setVideo({
          id: userId,
          stream: mediaStream,
        });
      }
    }
  }, [answer, core, targetUserId, mediaStream]);

  return video;
};
