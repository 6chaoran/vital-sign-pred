import { dispose } from '@tensorflow/tfjs';

class TensorStore {

    constructor() {
        this.rawFrames = [];
        this.hrPltData = [];
        this.rrPltData = [];
        this.initialWait = true;
    }

    reset = () => {
        this.rawFrames.forEach(f => {
            dispose(f);
        });
        this.rawFrames = [];
        this.hrPltData = [];
        this.rrPltData = [];
        this.initialWait = true;
    };

    getRawTensor = () => {
        if (this.rawFrames) {
            const tensor = this.rawFrames.shift() || null;
            return tensor;
        }
        return null;
    };

    addHRPltData = (data) => {
        this.hrPltData = [...this.hrPltData, ...data];
    };
    addRRPltData = (data) => {
        this.rrPltData = [...this.rrPltData, ...data];
    };

    addRawTensor = (tensor) => {
        this.rawFrames.push(tensor);
    };
}

export default new TensorStore();