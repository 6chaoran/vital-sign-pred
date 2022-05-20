import * as tf from "@tensorflow/tfjs";

function mean(arr) {
    const sum = arr.reduce((a, b) => a + b, 0);
    return sum / arr.length;
}

function mae(arr) {
    const avg = mean(arr);
    const delta = arr.map(i => Math.abs(i - avg));
    return mean(delta);
}

class BMIModel {
    constructor() {
        this.model = null;
        this.BMIPool = [];
        this.AGEPool = [];
        this.SEXPool = [];
    }

    async loadModel(Path, callback = null) {
        this.model = await tf.loadLayersModel(Path);
        const x = tf.zeros([1, 224, 224, 3]);
        this.model.predict(x);
        x.dispose();
        console.log("BMI model is loaded!");
        if (callback) {
            callback();
        }
    }

    cropImage(tensor, box, imageSize) {
        const crop = tf.image.cropAndResize(tensor, box, [0], imageSize, 'bilinear');
        return crop;
    }

    predict(elm, box, imageSize) {
        if (elm.srcObject != null) {
            const x = tf.tidy(() => {
                let x = tf.browser.fromPixels(elm).expandDims(0);
                x = this.cropImage(x, box, imageSize);
                x = x.div(tf.scalar(127.5)).sub(tf.scalar(1));
                return x;
            })
            const [a, b, c] = this.model.predict(x);
            const BMI = a.dataSync()[0];
            const AGE = b.dataSync()[0];
            const SEX = c.dataSync()[0];
            a.dispose();
            b.dispose();
            c.dispose();
            this.BMIPool.push(BMI);
            this.AGEPool.push(AGE);
            this.SEXPool.push(SEX);
            return [BMI, AGE, SEX];
        }
    }

    output() {
        return {
            BMI: [mean(this.BMIPool), mae(this.BMIPool)],
            AGE: [mean(this.AGEPool), mae(this.AGEPool)],
            SEX: [mean(this.SEXPool), mae(this.SEXPool)]
        }
    }
}

export default new BMIModel();