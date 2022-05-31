import {
  PeerMessageType,
  Resource,
  PeerMessageValue,
  Offer,
  MediaConstraints,
  log,
  Candidate,
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

  /**
   * handleVideoOfferMsg
   */
  public handleOfferMessage(msg: Offer, cb: (stream: MediaStream | null) => any) {
    const { sdp } = msg;
    if (sdp) {
      const desc = new RTCSessionDescription(sdp);
      const localStream: MediaStream = new MediaStream();
      if (!this.peerConnection) {
        log('error', 'Failed handle offer stream. Peer connection is', this.peerConnection);
        cb(null);
        return;
      }
      this.peerConnection
        .setRemoteDescription(desc)
        .then(() => {
          log('info', 'Setting up the local media stream...');
          return navigator.mediaDevices.getUserMedia(MediaConstraints);
        })
        .then((stream) => {
          log('info', '-- Local video stream obtained');
          localStream.getTracks().forEach((track) => {
            if (!this.peerConnection) {
              log('warn', 'failed to add offer video track');
            } else {
              this.peerConnection.addTrack(track, localStream);
            }
          });
          cb(stream);
        })
        .catch((e) => {
          log('error', 'Failed get user media', e.mesage);
          cb(null);
        });
    } else {
      log('warn', 'Message offer error because sdp is', sdp);
      cb(null);
    }
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
