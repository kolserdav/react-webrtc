import React, { useMemo, useEffect, useCallback } from 'react';
import {
  useOnClose,
  useOnError,
  useOnMessage,
  useOnOpen,
  useHandleOffer,
  useHandleCandidate,
  useIceCandidateHandlers,
} from './WebRTC.hooks';
import {
  PeerMessageType,
  Video,
  PeerMessageValue,
  log,
  getUniqueUserId,
  getTarget,
  Resource,
} from '../../utils';
import s from './WebRTC.module.scss';
import Core from '../../core';

interface MessageReducer {
  msg: MessageEvent<PeerMessageValue<any>>;
}

const messageHandler = ({
  message,
  userId,
  targetUserId,
  core,
}: {
  message: MessageEvent<any>;
  userId: number;
  targetUserId: number;
  core: Core;
}) => {
  const msg: any = JSON.parse(message.data);
  switch (msg.type) {
    case PeerMessageType.offer:
      break;

    case PeerMessageType.answer:
      // handleVideoAnswerMsg(msg);
      break;

    case PeerMessageType.candidate:
      // handleNewICECandidateMsg(msg);
      break;
    case PeerMessageType.close:
      // handleHangUpMsg(msg);
      break;
    default:
      log('warn', 'Default case', msg);
  }
};

function WebRTC() {
  const core = useMemo(() => new Core({ userId: getUniqueUserId() }), []);
  const userId = core.getUserId();
  const connection = core.getConnection();
  const open = useOnOpen(connection);
  const error = useOnError(connection);
  const message = useOnMessage(connection);
  const close = useOnClose(connection);
  const candidate = useHandleCandidate({
    core,
    msg: {
      userId,
      type: PeerMessageType.candidate,
      resource: Resource.peer,
      candidate: {},
    },
  });
  const { sessionDescriptionInit } = useIceCandidateHandlers({ core, userId });
  const offer = useHandleOffer({
    core,
    msg: {
      type: PeerMessageType.offer,
      resource: Resource.peer,
      userId,
      targetUserId: getTarget(),
      sdp: sessionDescriptionInit,
    },
  });

  useEffect(() => {
    console.log(message, 12);
  }, [message]);

  return <section>ds</section>;
}

export default WebRTC;
