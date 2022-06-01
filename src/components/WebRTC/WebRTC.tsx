import React, { useMemo, useEffect, useCallback } from 'react';
import { useOnClose, useOnError, useOnOpen } from './WebRTC.hooks';
import {
  PeerMessageType,
  Video,
  PeerMessageValue,
  log,
  getUniqueUserId,
  Offer,
  Resource,
  parseMessage,
  getTarget,
  isRoom,
} from '../../utils';
import s from './WebRTC.module.scss';
import Core from '../../core';

function WebRTC() {
  const room = isRoom();
  const userId = room ? getTarget() : getUniqueUserId();
  const target = getTarget();
  const roomLink = room
    ? window.location.href.replace(window.location.search, '')
    : window.location.href;
  const core = useMemo(() => new Core({ userId }), []);
  const connection = core.getConnection();
  const open = useOnOpen(connection);
  const error = useOnError(connection);

  const close = useOnClose(connection);

  useEffect(() => {
    // eslint-disable-next-line no-param-reassign
    connection.onmessage = (event) => {
      log('info', 'message', event);
      const msg: any = parseMessage(event.data);
      console.log(33, msg);
      switch (msg.type) {
        case PeerMessageType.getId:
          core.sendToServer<PeerMessageType.setId>({
            type: PeerMessageType.setId,
            id: userId,
          });
          break;
        case PeerMessageType.offer:
          core.handleOfferMessage(msg, (stream) => {
            console.log(1212, stream);
          });
          break;

        case PeerMessageType.answer:
          core.handleVideoAnswerMsg(msg, (ev) => {
            console.log(56665, ev);
          });
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

  useEffect(() => {
    if (userId !== target) {
      core.invite({ targetUserId: target });
    }
  }, []);

  return (
    <section>
      <video />
      <a href={roomLink}>{roomLink}</a>
    </section>
  );
}

export default WebRTC;
