import { PeerMessageType, Resource, PeerMessageValue } from '../utils/constants';
import { log } from '../utils/lib';

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
