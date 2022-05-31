export enum PeerMessageType {
  candidate,
  offer,
  answer,
  getId = 'get-id',
}

export enum Resource {
  peer = 'peer',
  message = 'message',
}

export interface PeerServerMessage {
  type: PeerMessageType;
  resource: Resource.peer;
  targetUserId: number;
}

export interface Candidate extends PeerServerMessage {
  type: PeerMessageType.candidate;
  candidate: RTCIceCandidate;
}

export interface Offer extends PeerServerMessage {
  type: PeerMessageType.offer;
  userId: number;
  sdp: RTCSessionDescriptionInit;
}

export interface Answer extends PeerServerMessage {
  type: PeerMessageType.answer;
  sdp: RTCSessionDescriptionInit;
}

export type PeerMessageValue<T> = T extends PeerMessageType.offer
  ? Offer
  : T extends PeerMessageType.candidate
  ? Candidate
  : T extends PeerMessageType.answer
  ? Answer
  : PeerServerMessage;

export const MediaConstraints = {
  audio: true,
  video: true,
};
