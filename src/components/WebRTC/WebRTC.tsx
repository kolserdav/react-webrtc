import React, { useMemo, useEffect, useCallback } from 'react';
import {
  useOnClose,
  useOnError,
  useOnOpen,
  useHandleOffer,
  useIceCandidateHandlers,
} from './WebRTC.hooks';
import {
  PeerMessageType,
  Video,
  PeerMessageValue,
  log,
  getUniqueUserId,
  Offer,
  Resource,
  parseMessage,
} from '../../utils';
import s from './WebRTC.module.scss';
import Core from '../../core';

function WebRTC() {
  const core = useMemo(() => new Core({ userId: getUniqueUserId() }), []);
  const userId = core.getUserId();
  const connection = core.getConnection();
  const open = useOnOpen(connection);
  const error = useOnError(connection);

  const close = useOnClose(connection);
  const { sessionDescriptionInit } = useIceCandidateHandlers({ core, userId });
  console.log(31, sessionDescriptionInit);
  const offer = useHandleOffer({
    core,
    msg: { userId } as Offer,
  });
  console.log(36, offer);
  useEffect(() => {
    // eslint-disable-next-line no-param-reassign
    connection.onmessage = (e) => {
      log('info', 'message', e);
      const msg: any = parseMessage(e.data);
      switch (msg.type) {
        case PeerMessageType.offer:
          core.handleOfferMessage(msg, (stream) => {
            console.log(1212, stream);
          });
          break;

        case PeerMessageType.answer:
          break;

        case PeerMessageType.candidate:
          core.handleCandidateMessage(msg, (cand) => {
            console.log(434, cand);
          });
          break;
        case PeerMessageType.close:
          // handleHangUpMsg(msg);
          break;
        default:
          log('warn', 'Default case', msg);
      }
    };
    return () => {
      // eslint-disable-next-line no-param-reassign
      connection.onmessage = () => {
        /** */
      };
    };
  }, [connection]);

  return <section>ds</section>;
}

export default WebRTC;
