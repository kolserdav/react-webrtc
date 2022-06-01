// @ts-check

if (navigator.mediaDevices) {
  console.log('getUserMedia supported.');

  const constraints = { audio: true, video: true };
  const chunks = [];
  navigator.mediaDevices
    .getUserMedia(constraints)
    .then((stream) => {
      /**
       * 
    video/webm
    video/webm;codecs=vp8
    video/webm;codecs=vp9
    video/webm;codecs=vp8.0
    video/webm;codecs=vp9.0
    video/webm;codecs=h264
    video/webm;codecs=H264
    video/webm;codecs=avc1
    video/webm;codecs=vp8,opus
    video/WEBM;codecs=VP8,OPUS
    video/webm;codecs=vp9,opus
    video/webm;codecs=vp8,vp9,opus
    video/webm;codecs=h264,opus
    video/webm;codecs=h264,vp9,opus

    video/x-matroska;codecs=avc1

    audio/webm
    audio/webm;codecs=opus

       */

      const mimeType = 'video/webm';
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
      };

      mediaRecorder.onstart = () => {
        const video = document.querySelector('video');
        video.crossOrigin = 'anonymous';
        const mediaSource = new MediaSource();
        const newObjectUrl = URL.createObjectURL(mediaSource);
        video.src = newObjectUrl;
        mediaSource.addEventListener('sourceopen', sourceOpen);
        function sourceOpen(_) {
          const buffer = mediaSource.addSourceBuffer(mimeType);
          buffer.addEventListener('update', () => {
            console.log(1);
          });
          mediaRecorder.ondataavailable = async function (e) {
            e.data.arrayBuffer().then((data) => {
              buffer.appendBuffer(data);
            });
          };
          setInterval(() => {
            mediaRecorder.requestData();
          }, 10);
          setTimeout(() => {
            video.play();
          });
        }
      };
    })
    .catch((err) => {
      console.log(`The following error occurred: ${err}`);
    });
}
