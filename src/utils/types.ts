export enum PeerMessageType {
  candidate = 'candodate',
  offer = 'offer',
  answer = 'answer',
  close = 'close',
  getId = 'getId',
  setId = 'setId',
  all = 'all',
}

export enum Resource {
  peer = 'peer',
  message = 'message',
}

export interface PeerServerMessage<T extends PeerMessageType> {
  type: T;
  resource: Resource.peer;
  targetUserId: number;
  candidate: RTCIceCandidateInit;
  userId: number;
  sdp: RTCSessionDescriptionInit;
}

export type Candidate = Omit<PeerServerMessage<PeerMessageType.candidate>, 'userId' | 'sdp'>;

export type Offer = Omit<PeerServerMessage<PeerMessageType.offer>, 'candidate' | 'userId'>;

export type Answer = Omit<PeerServerMessage<PeerMessageType.answer>, 'candidate' | 'userId'>;

export interface GetId {
  type: PeerMessageType.getId;
}

export interface SetId {
  type: PeerMessageType.setId;
  id: number;
}

export type PeerMessageValue<T extends PeerMessageType> = T extends PeerMessageType.offer
  ? Offer
  : T extends PeerMessageType.candidate
  ? Candidate
  : T extends PeerMessageType.answer
  ? Answer
  : T extends PeerMessageType.getId
  ? GetId
  : T extends PeerMessageType.setId
  ? SetId
  : PeerServerMessage<any>;

export interface Video {
  id: number;
  type: PeerMessageType;
  stream?: MediaStream;
}
