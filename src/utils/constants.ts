export enum PeerMessageType {
  candidate,
  offer,
  answer,
  close,
  getId = 'get-id',
}

export enum Resource {
  peer = 'peer',
  message = 'message',
}

export interface PeerServerMessage {
  type: PeerMessageType;
  resource: Resource.peer;
}

export interface Candidate extends PeerServerMessage {
  type: PeerMessageType.candidate;
  userId: number;
  candidate: RTCIceCandidateInit | undefined;
  sdpMid: string;
}

export interface Offer extends PeerServerMessage {
  type: PeerMessageType.offer;
  targetUserId: number;
  userId: number;
  sdp: RTCSessionDescriptionInit | null;
}

export interface Answer extends PeerServerMessage {
  type: PeerMessageType.answer;
  sdp: RTCSessionDescriptionInit | null;
  targetUserId: number;
}

export type PeerMessageValue<T> = T extends PeerMessageType.offer
  ? Offer
  : T extends PeerMessageType.candidate
  ? Candidate
  : T extends PeerMessageType.answer
  ? Answer
  : PeerServerMessage;

export interface Video {
  id: number;
  type: PeerMessageType;
  stream?: MediaStream;
}

export const MediaConstraints = {
  audio: true,
  video: true,
};
