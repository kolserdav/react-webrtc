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

export const useHandleCandidate = ({
  core,
  msg,
}: {
  msg: Candidate;
  core: Core;
}): RTCIceCandidate | null => {
  const [candidate, setCandidate] = useState<RTCIceCandidate | null>(null);
  useEffect(() => {
    if (!core.peerConnection) {
      log('warn', 'Failed create ice candidate because peerConnection is', core.peerConnection);
      return;
    }
    const cand = new RTCIceCandidate(msg.candidate);
    core.peerConnection
      .addIceCandidate(cand)
      .then(() => {
        log('info', `Adding received ICE candidate: ${JSON.stringify(cand)}`);
        setCandidate(cand);
      })
      .catch((e) => {
        log('error', 'Set candidate error', e);
      });
  }, [core.peerConnection, msg.candidate]);
  return candidate;
};

export const useHandleOffer = ({ msg, core }: { msg: Offer; core: Core }): Video | null => {
  const { userId, targetUserId, sdp } = msg;
  const [video, setVideo] = useState<Video | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [answer, setAnswer] = useState<boolean>(false);

  /**
   * Set media stream
   */
  useEffect(() => {
    if (sdp) {
      const desc = new RTCSessionDescription(sdp);
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
    }
  }, [core.peerConnection, sdp]);

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
          type: PeerMessageType.offer,
          stream: mediaStream,
        });
      }
    }
  }, [answer, core, targetUserId, mediaStream]);

  return video;
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

export const useIceCandidateHandlers = ({ userId, core }: { userId: number; core: Core }) => {
  const _core = core;
  const [sessionDescriptionInit, setSessionDescriptionInit] =
    useState<RTCSessionDescriptionInit | null>(null);
  /**
   * set onicecandidate
   */
  useEffect(() => {
    if (_core.peerConnection) {
      _core.peerConnection.onicecandidate = function handleICECandidateEvent() {
        return (event: RTCPeerConnectionIceEvent) => {
          if (event.candidate) {
            log('info', `Outgoing ICE candidate: ${event.candidate.candidate}`);
            core.sendToServer<PeerMessageType.candidate>({
              type: PeerMessageType.candidate,
              userId,
              resource: Resource.peer,
              candidate: event.candidate,
            });
          }
        };
      };
    }
  }, [userId, core, _core.peerConnection]);

  /**
   * set oniceconnectionchage
   */
  useEffect(() => {
    if (_core.peerConnection) {
      _core.peerConnection.oniceconnectionstatechange =
        function handleICEConnectionStateChangeEvent(event: Event): 1 | 0 {
          if (_core.peerConnection) {
            log(
              'info',
              `*** ICE connection state changed to ${_core.peerConnection.iceConnectionState}`
            );
            switch (_core.peerConnection.iceConnectionState) {
              case 'closed':
              case 'failed':
              case 'disconnected':
                _core.closeVideoCall();
                break;
            }
            return 0;
          }
          log('warn', 'Can not change state of ice peer connection that is', _core.peerConnection);
          return 1;
        };
    }
  }, [_core]);

  /**
   * set onicegetherigngstatechange
   */
  useEffect(() => {
    if (_core.peerConnection) {
      _core.peerConnection.onicegatheringstatechange = function handleICEGatheringStateChangeEvent(
        ev: Event
      ): 1 | 0 {
        if (_core.peerConnection) {
          log(
            'info',
            `*** ICE gathering state changed to: ${_core.peerConnection.iceGatheringState}`
          );
          return 0;
        }
        log(
          'warn',
          'Handle ICE fathering state is wrong because peerConnection is',
          _core.peerConnection
        );
        return 1;
      };
    }
  }, [_core]);

  /**
   * set onsignalingstatechange
   */
  useEffect(() => {
    if (_core.peerConnection) {
      _core.peerConnection.onsignalingstatechange = function handleSignalingStateChangeEvent(
        ev: Event
      ): 1 | 0 {
        if (_core.peerConnection) {
          log(
            'info',
            `*** WebRTC signaling state changed to: ${_core.peerConnection.signalingState}`
          );
          switch (_core.peerConnection.signalingState) {
            case 'closed':
              _core.closeVideoCall();
              break;
          }
          return 0;
        }
        log(
          'warn',
          'Can not handle signaling state chage event because peerConnections is',
          _core.peerConnection
        );
        return 1;
      };
    }
  }, [_core]);

  /**
   * setSessionDescriptionInit
   */
  useEffect(() => {
    if (_core.peerConnection) {
      _core.peerConnection.onnegotiationneeded = function handleNegotiationNeededEvent() {
        return async () => {
          if (_core.peerConnection) {
            log('info', '---> Creating offer');
            const offer = await _core.peerConnection.createOffer();
            await _core.peerConnection.setLocalDescription(offer);
            const { localDescription } = _core.peerConnection;
            if (localDescription) {
              log('info', '---> Sending offer to remote peer');
              _core.sendToServer({
                userId,
                resource: Resource.peer,
                type: PeerMessageType.offer,
                sdp: localDescription,
              });
              setSessionDescriptionInit(offer);
              return 0;
            }
            log('error', 'Local description not set');
            return 1;
          }
          log('warn', 'Offer can not created that peerConnection is', _core.peerConnection);
          return 1;
        };
      };
    }
  }, [userId, _core]);

  /**
   * set ontrack
   */
  useEffect(() => {
    if (_core.peerConnection) {
      _core.peerConnection.ontrack = (ev: RTCTrackEvent) => {
        log('info', 'Ontrack', ev);
      };
    }
  }, [_core.peerConnection]);
  return { sessionDescriptionInit };
};
