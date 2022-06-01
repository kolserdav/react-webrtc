import {
  PeerMessageType,
  Resource,
  PeerMessageValue,
  Offer,
  MediaConstraints,
  log,
  Candidate,
  Answer,
} from '../utils';

class Core {
  peerConnection: RTCPeerConnection | null = new RTCPeerConnection({
    iceServers: [
      {
        urls: ['stun:stun.l.google.com:19302'],
      },
    ],
  });

  connection: WebSocket;

  userId: number;

  constructor({
    userId,
    host = 'localhost',
    port = 8000,
    resource = Resource.peer,
  }: {
    userId: number;
    host?: string;
    port?: number;
    resource?: Resource.peer;
  }) {
    console.log(1);
    this.connection = this.setConnection({ host, port, resource });
    this.userId = userId;
  }

  public getConnection() {
    return this.connection;
  }

  public getUserId() {
    return this.userId;
  }

  /**
   * handleNewICECandidateMsg
   */
  public handleCandidateMessage(msg: Candidate, cb: (cand: RTCIceCandidate | null) => any) {
    const { candidate } = msg;
    if (!this.peerConnection) {
      log('warn', 'Failed create ice candidate because peerConnection is', this.peerConnection);
      cb(null);
      return;
    }
    const cand = new RTCIceCandidate(candidate);
    this.peerConnection
      .addIceCandidate(cand)
      .then(() => {
        log('info', `Adding received ICE candidate: ${JSON.stringify(cand)}`);
        cb(cand);
      })
      .catch((e) => {
        log('error', 'Set candidate error', e);
        cb(null);
      });
  }

  public invite({ targetUserId }: { targetUserId: number }) {
    this.handleIceCandidate({ targetUserId });
    navigator.mediaDevices
      .getUserMedia(MediaConstraints)
      .then((localStream) => {
        log('info', '-- Adding tracks to the RTCPeerConnection');
        localStream.getTracks().forEach((track) => {
          if (!this.peerConnection) {
            log('warn', 'failed to add offer video track');
          } else {
            this.peerConnection.addTrack(track, localStream);
          }
        });
      })
      .catch((err) => {
        log('error', 'Error get self user media', err);
      });
  }

  public handleOfferMessage(msg: Offer, cb: (desc: RTCSessionDescription | null) => any) {
    const { targetUserId, sdp } = msg;
    if (!sdp) {
      log('warn', 'Message offer error because sdp is', sdp);
      cb(null);
      return;
    }
    if (!this.peerConnection) {
      log('warn', 'Failed create answer', { peerConnection: this.peerConnection });
      cb(null);
      return;
    }
    const desc = new RTCSessionDescription(sdp);
    this.peerConnection
      .setRemoteDescription(desc)
      .then(() => {
        log('info', 'Setting up the local media stream...');
        return navigator.mediaDevices.getUserMedia(MediaConstraints);
      })
      .then((stream) => {
        const localStream = stream;
        log('info', '-- Local video stream obtained');
        localStream.getTracks().forEach((track) => {
          if (!this.peerConnection) {
            log('warn', 'failed to add candidate video track');
          } else {
            this.peerConnection.addTrack(track, localStream);
          }
        });
      })
      .then(() => {
        if (!this.peerConnection) {
          log('warn', 'Failed create answer because peerConnection is', this.peerConnection);
          return;
        }
        log('info', '------> Creating answer');
        this.peerConnection.createAnswer().then((answ) => {
          if (!answ || !this.peerConnection) {
            log('error', 'Failed set local description for answer.', {
              answ,
              peerConnection: this.peerConnection,
            });
            cb(null);
            return;
          }
          log('info', '------> Setting local description after creating answer');
          this.peerConnection.setLocalDescription(answ).then(() => {
            if (this.peerConnection) {
              const { localDescription } = this.peerConnection;
              if (localDescription) {
                log('info', 'Sending answer packet back to other peer');
                this.sendToServer({
                  resource: Resource.peer,
                  targetUserId,
                  type: PeerMessageType.answer,
                  sdp: localDescription,
                });
                cb(localDescription);
              } else {
                log('warn', 'Failed send answer because localDescription is', localDescription);
              }
            }
          });
        });
      })
      .catch((e) => {
        log('error', 'Failed get user media', e.mesage);
        cb(null);
      });
  }

  public handleVideoAnswerMsg(msg: Answer, cb: (res: 1 | 0) => any): 1 | 0 {
    if (this.peerConnection) {
      log('info', 'Call recipient has accepted our call');
      const desc = new RTCSessionDescription(msg.sdp);
      this.peerConnection.setRemoteDescription(desc).catch((e) => {
        log('error', 'Error set description fo answer', e);
        cb(1);
        return 1;
      });
    } else {
      log('warn', 'Answer description mot set because peerConnection is', this.peerConnection);
      cb(1);
      return 1;
    }
    cb(0);
    return 0;
  }

  public handleIceCandidate({ targetUserId }: { targetUserId: number }) {
    if (!this.peerConnection) {
      log('warn', 'Failed handle ice candidate because peerConnection is', this.peerConnection);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const core = this;
    this.peerConnection.onicecandidate = function handleICECandidateEvent() {
      return (event: RTCPeerConnectionIceEvent) => {
        if (event.candidate) {
          log('info', `Outgoing ICE candidate: ${event.candidate.candidate}`);
          core.sendToServer<PeerMessageType.candidate>({
            type: PeerMessageType.candidate,
            targetUserId,
            resource: Resource.peer,
            candidate: event.candidate,
          });
        }
      };
    };
    this.peerConnection.oniceconnectionstatechange = function handleICEConnectionStateChangeEvent(
      event: Event
    ): 1 | 0 {
      if (core.peerConnection) {
        log(
          'info',
          `*** ICE connection state changed to ${core.peerConnection.iceConnectionState}`
        );
        switch (core.peerConnection.iceConnectionState) {
          case 'closed':
          case 'failed':
          case 'disconnected':
            core.closeVideoCall();
            break;
        }
        return 0;
      }
      log('warn', 'Can not change state of ice peer connection that is', core.peerConnection);
      return 1;
    };
    this.peerConnection.onicegatheringstatechange = function handleICEGatheringStateChangeEvent(
      ev: Event
    ): 1 | 0 {
      if (core.peerConnection) {
        log('info', `*** ICE gathering state changed to: ${core.peerConnection.iceGatheringState}`);
        return 0;
      }
      log(
        'warn',
        'Handle ICE fathering state is wrong because peerConnection is',
        core.peerConnection
      );
      return 1;
    };
    this.peerConnection.onsignalingstatechange = function handleSignalingStateChangeEvent(
      ev: Event
    ): 1 | 0 {
      if (core.peerConnection) {
        log('info', `*** WebRTC signaling state changed to: ${core.peerConnection.signalingState}`);
        switch (core.peerConnection.signalingState) {
          case 'closed':
            core.closeVideoCall();
            break;
        }
        return 0;
      }
      log(
        'warn',
        'Can not handle signaling state chage event because peerConnections is',
        core.peerConnection
      );
      return 1;
    };
    this.peerConnection.onnegotiationneeded = function handleNegotiationNeededEvent() {
      if (core.peerConnection) {
        log('info', '---> Creating offer');
        core.peerConnection
          .createOffer()
          .then((offer): 1 | void | PromiseLike<void> => {
            if (!core.peerConnection) {
              log(
                'warn',
                'Can not set local description because peerConnection is',
                core.peerConnection
              );
              return 1;
            }
            return core.peerConnection.setLocalDescription(offer).catch((err) => {
              log('error', 'Error create local description', err);
            });
          })
          .then(() => {
            if (core.peerConnection) {
              const { localDescription } = core.peerConnection;
              if (localDescription) {
                log('info', '---> Sending offer to remote peer');
                core.sendToServer({
                  targetUserId,
                  resource: Resource.peer,
                  type: PeerMessageType.offer,
                  sdp: localDescription,
                });
                return 0;
              }
              log('warn', 'Local description is', localDescription);
            } else {
              log('warn', 'Peer connection is', core.peerConnection);
            }
            log('error', 'Local description not set');
            return 1;
          });
      } else {
        log('warn', 'Offer can not created that peerConnection is', core.peerConnection);
      }
    };

    this.peerConnection.ontrack = (ev: RTCTrackEvent) => {
      log('info', 'Ontrack', ev);
    };
  }

  private setConnection({
    host,
    port,
    resource,
  }: {
    host?: string;
    port?: number;
    resource?: Resource.peer;
  }) {
    let scheme = 'ws';
    if (document.location.protocol === 'https:') {
      scheme += 's';
    }
    // ws://localhost:8000/peer
    this.connection = new WebSocket(`${scheme}://${host}:${port}/${resource}`, 'json');
    return this.connection;
  }

  public sendToServer<T extends PeerMessageType>(msg: PeerMessageValue<T>) {
    const msgJSON = JSON.stringify(msg);
    const { type } = msg;
    log('info', 'Sending message', { type });
    this.connection.send(msgJSON);
  }

  public closeVideoCall(): 0 | 1 {
    if (this.peerConnection) {
      log('info', 'Closing the call');
      this.peerConnection.onicecandidate = null;
      this.peerConnection.oniceconnectionstatechange = null;
      this.peerConnection.onicegatheringstatechange = null;
      this.peerConnection.onsignalingstatechange = null;
      this.peerConnection.onnegotiationneeded = null;
      this.peerConnection.ontrack = null;
      this.peerConnection.close();
      this.peerConnection = null;
      return 0;
    }
    log('warn', 'Peer connection cant close that is', this.peerConnection);
    return 1;
  }
}

export default Core;
