// @ts-check

if (navigator.mediaDevices) {
  console.log('getUserMedia supported.');

  const constraints = { audio: true, video: true };
  let timeout = setInterval(() => {
    /** */
  }, Infinity);
  navigator.mediaDevices
    .getUserMedia(constraints)
    .then((stream) => {
      const codecs = [
        'video/webm',
        'video/webm;codecs=vp8',
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8.0',
        'video/webm;codecs=vp9.0',
        'video/webm;codecs=h264',
        'video/webm;codecs=H264',
        'video/webm;codecs=avc1',
        'video/webm;codecs=vp8,opus',
        'video/WEBM;codecs=VP8,OPUS',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,vp9,opus',
        'video/webm;codecs=h264,opus',
        'video/webm;codecs=h264,vp9,opus',
        'video/x-matroska;codecs=avc1',
      ];
      let mimeType = '';
      for (let i = 0; codecs[i]; i++) {
        const item = codecs[i];
        if (MediaRecorder.isTypeSupported(item) && MediaSource.isTypeSupported(item)) {
          console.log('Supported mimetype is', item);
          mimeType = item;
          break;
        }
      }
      if (!mimeType) {
        console.warn('From all list', codecs, 'not one is supported');
      }
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
      });

      // visualize(stream);

      document.querySelector('#record').onclick = function () {
        mediaRecorder.start();
        console.log(mediaRecorder.state);
        console.log('recorder started');
        record.style.background = 'red';
        record.style.color = 'black';
      };

      document.querySelector('#stop').onclick = function () {
        mediaRecorder.stop();
        console.log(mediaRecorder.state);
        console.log('recorder stopped');
        record.style.background = '';
        record.style.color = '';
        clearInterval(timeout);
      };

      mediaRecorder.onstart = () => {
        const video = document.querySelector('video');
        video.crossOrigin = 'anonymous';
        const mediaSource = new MediaSource();
        const newObjectUrl = URL.createObjectURL(mediaSource);
        video.src = newObjectUrl;
        mediaSource.addEventListener('sourceopen', sourceOpen);
        function sourceOpen(_) {
          const queue = [];
          const buffer = mediaSource.addSourceBuffer(mimeType);
          buffer.addEventListener('update', () => {
            if (queue.length > 0 && !buffer.updating) {
              buffer.appendBuffer(queue.shift());
            }
          });

          mediaRecorder.ondataavailable = async function (e) {
            if (e.data.size > 0) {
              e.data.arrayBuffer().then((data) => {
                const uIntArray = new Uint8Array(data);
                if (!buffer.updating) {
                  buffer.appendBuffer(uIntArray);
                } else {
                  queue.push(Uint8Array);
                }
              });
            }
          };
          timeout = setInterval(() => {
            mediaRecorder.requestData();
          }, 10);
        }
      };
    })
    .catch((err) => {
      console.log(`The following error occurred: ${err}`);
    });
}
