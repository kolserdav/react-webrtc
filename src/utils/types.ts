export enum PeerMessageType {
  candidate = 'candidate',
  offer = 'offer',
  answer = 'answer',
  close = 'close',
  getId = 'getId',
  setId = 'setId',
  idSaved = 'idSaved',
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

export type Candidate = Omit<PeerServerMessage<PeerMessageType.candidate>, 'sdp'>;

export type Offer = Omit<PeerServerMessage<PeerMessageType.offer>, 'candidate'>;

export type Answer = Omit<PeerServerMessage<PeerMessageType.answer>, 'candidate'>;

export interface GetId {
  type: PeerMessageType.getId;
  resource: Resource.message;
}

export interface SetId {
  type: PeerMessageType.setId;
  resource: Resource.message;
  id: number;
}

export interface IdSaved {
  type: PeerMessageType.idSaved;
  resource: Resource.message;
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
  : T extends PeerMessageType.idSaved
  ? IdSaved
  : PeerServerMessage<any>;

export interface Video {
  id: number;
  type: PeerMessageType;
  stream?: MediaStream;
}
