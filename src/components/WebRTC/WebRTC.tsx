import React, { useMemo, useEffect, useCallback, useState } from 'react';
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

const createStreams = (
  _str: MediaStream[]
): { stream: MediaStream; ref: React.Ref<HTMLVideoElement> }[] =>
  _str.map((item) => ({
    stream: item,
    ref: (node: HTMLVideoElement) => {
      // eslint-disable-next-line no-param-reassign
      if (node) node.srcObject = item;
    },
  }));

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

  const [streams, setStreams] = useState<MediaStream[]>([]);

  useEffect(() => {
    // eslint-disable-next-line no-param-reassign
    connection.onmessage = (event) => {
      const msg: any = parseMessage(event.data);
      log('info', 'onmessage', {
        type: msg.type,
        resource: msg.resource,
      });
      switch (msg.type) {
        case PeerMessageType.getId:
          core.sendToServer<PeerMessageType.setId>({
            type: PeerMessageType.setId,
            resource: Resource.message,
            id: userId,
          });
          break;
        case PeerMessageType.idSaved:
          if (userId !== target && !room) {
            core.invite({ targetUserId: target, userId });
          }
          break;
        case PeerMessageType.offer:
          core.handleOfferMessage(msg, (stream) => {
            log('info', 'handleOfferMessage callback', stream);
          });
          break;

        case PeerMessageType.answer:
          core.handleVideoAnswerMsg(msg, (ev) => {
            log('info', 'handleVideoAnswerMsg callback', ev);
          });
          break;

        case PeerMessageType.candidate:
          core.handleCandidateMessage(msg, (cand) => {
            log('info', 'handleCandidateMessage callback', cand);
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
    if (core.peerConnection) {
      core.peerConnection.ontrack = (ev: RTCTrackEvent) => {
        console.log(ev);
        const _stream = ev.streams[0];
        const _streams = streams.map((item) => item);
        _streams.push(_stream);
        setStreams(_streams);
      };
    }
    return () => {
      if (core.peerConnection) {
        core.peerConnection.ontrack = null;
      }
    };
  }, [core.peerConnection, streams]);

  const _streams = useMemo(() => createStreams(streams), [streams]);

  console.log(_streams, streams);

  return (
    <section className={s.wrapper}>
      <div className={s.container}>
        {_streams.map((item, index) => (
          <div key={item.stream.id} className={s.video}>
            <video
              width={300}
              height={200}
              ref={item.ref}
              id={item.stream.id}
              title={item.stream.id}
              autoPlay
            />
          </div>
        ))}
      </div>
      <a href={roomLink}>{roomLink}</a>
    </section>
  );
}

export default WebRTC;
