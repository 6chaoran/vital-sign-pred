class webcam {
    constructor() { }
    start(elm, callback = null) {
        const constraints = {
            video: { width: elm.width, height: elm.height, facingMode: 'user' },
            audio: false
        }
        navigator.mediaDevices.getUserMedia(constraints)
            .then((stream) => {
                elm.srcObject = stream;
                elm.play();
                if (callback) {
                    callback();
                }
            })
    }
    stop(elm, callback = null) {
        elm.srcObject.getTracks().forEach((track) => {
            track.stop();
        })
        elm.srcObject = null;
        if (callback) {
            callback();
        }
    }
}




export default new webcam();