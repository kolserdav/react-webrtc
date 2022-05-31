import { PeerMessageType, Resource, PeerMessageValue } from '../utils/constants';
import { log } from '../utils/lib';

class Core {
  readonly connection: WebSocket;

  peerConnection: RTCPeerConnection | null;

  handleTrackEvent: (ev: RTCTrackEvent) => any;

  constructor({ handleTrackEvent }: { handleTrackEvent: (ev: RTCTrackEvent) => any }) {
    this.connection = new WebSocket('ws://localhost:8000/peer', 'json');
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        {
          urls: ['stun:stun.l.google.com:19302'],
        },
      ],
    });
    this.handleTrackEvent = handleTrackEvent;
  }

  public handleMessage({ msg }: { msg: MessageEvent<PeerMessageValue<any>> }) {
    switch (msg.type) {
      case 'video-offer': // Invitation and offer to chat
        handleVideoOfferMsg(msg);
        break;

      case 'video-answer': // Callee has answered our offer
        handleVideoAnswerMsg(msg);
        break;

      case 'new-ice-candidate': // A new ICE candidate has been received
        handleNewICECandidateMsg(msg);
        break;

      case 'hang-up': // The other peer has hung up the call
        handleHangUpMsg(msg);
        break;

      // Unknown message; output to console for debugging.

      default:
        log_error('Unknown message received:');
        log_error(msg);
    }
  }

  public createPeerConnection({
    userId,
    targetUserId,
  }: {
    userId: number;
    targetUserId: number;
  }): RTCPeerConnection | null {
    if (this.peerConnection) {
      log('info', 'Create peer conection');
      this.peerConnection.onicecandidate = this.handleICECandidateEvent({ targetUserId });
      this.peerConnection.oniceconnectionstatechange = this.handleICEConnectionStateChangeEvent;
      this.peerConnection.onicegatheringstatechange = this.handleICEGatheringStateChangeEvent;
      this.peerConnection.onsignalingstatechange = this.handleSignalingStateChangeEvent;
      this.peerConnection.onnegotiationneeded = this.handleNegotiationNeededEvent({
        targetUserId,
        userId,
      });
      this.peerConnection.ontrack = this.handleTrackEvent;
      return this.peerConnection;
    }
    log('warn', 'Peer connection is', this.peerConnection);
    return null;
  }

  public sendToServer<T extends PeerMessageType>(msg: PeerMessageValue<T>) {
    const msgJSON = JSON.stringify(msg);
    const { type } = msg;
    log('info', 'Sending message', { type });
    this.connection.send(msgJSON);
  }

  private handleICECandidateEvent({ targetUserId }: { targetUserId: number }) {
    return (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate) {
        log('info', `Outgoing ICE candidate: ${event.candidate.candidate}`);
        this.sendToServer<PeerMessageType.candidate>({
          type: PeerMessageType.candidate,
          targetUserId,
          resource: Resource.peer,
          candidate: event.candidate,
        });
      }
    };
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

  private handleICEConnectionStateChangeEvent(event: Event): 1 | 0 {
    if (this.peerConnection) {
      log('info', `*** ICE connection state changed to ${this.peerConnection.iceConnectionState}`);
      switch (this.peerConnection.iceConnectionState) {
        case 'closed':
        case 'failed':
        case 'disconnected':
          this.closeVideoCall();
          break;
      }
      return 0;
    }
    log('warn', 'Can not change state of ice peer connection that is', this.peerConnection);
    return 1;
  }

  private handleNegotiationNeededEvent({
    userId,
    targetUserId,
  }: {
    userId: number;
    targetUserId: number;
  }) {
    return async () => {
      if (this.peerConnection) {
        log('info', '---> Creating offer');
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        const { localDescription } = this.peerConnection;
        if (localDescription) {
          log('info', '---> Sending offer to remote peer');
          this.sendToServer({
            userId,
            targetUserId,
            resource: Resource.peer,
            type: PeerMessageType.offer,
            sdp: localDescription,
          });
          return 0;
        }
        log('error', 'Local description not set');
        return 1;
      }
      log('warn', 'Offer can not created that peerConnection is', this.peerConnection);
      return 1;
    };
  }

  private handleSignalingStateChangeEvent(ev: Event): 1 | 0 {
    if (this.peerConnection) {
      log('info', `*** WebRTC signaling state changed to: ${this.peerConnection.signalingState}`);
      switch (this.peerConnection.signalingState) {
        case 'closed':
          this.closeVideoCall();
          break;
      }
      return 0;
    }
    log(
      'warn',
      'Can not handle signaling state chage event because peerConnections is',
      this.peerConnection
    );
    return 1;
  }

  private handleICEGatheringStateChangeEvent(ev: Event): 1 | 0 {
    if (this.peerConnection) {
      log('info', `*** ICE gathering state changed to: ${this.peerConnection.iceGatheringState}`);
      return 0;
    }
    log(
      'warn',
      'Handle ICE fathering state is wrong because peerConnection is',
      this.peerConnection
    );
    return 1;
  }
}

export default Core;
