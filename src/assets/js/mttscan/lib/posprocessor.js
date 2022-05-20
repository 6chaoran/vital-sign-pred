import {
    serialization,
    loadLayersModel,
} from '@tensorflow/tfjs';
import MovingAvgProcessor from './moveAvgProcessor';
import TSM from '../tensorflow/TSM';
import AttentionMask from '../tensorflow/AttentionMask';

class Posprocessor {

    constructor(tensorStore) {
        this.tensorStore = tensorStore;
        this.rppgAvgProcessor = new MovingAvgProcessor();
        this.respAvgProcessor = new MovingAvgProcessor();
        this.model = null;
    }

    reset = () => {
        this.rppgAvgProcessor.reset();
        this.respAvgProcessor.reset();
    };

    loadModel = async (path) => {
        if (this.model === null) {
            serialization.registerClass(TSM);
            serialization.registerClass(AttentionMask);
            this.model = await loadLayersModel(path);
        }
        return true;
    };

    compute = (normalizedBatch, rawBatch) => {
        if (this.model) {
            const res = this.model.predict([normalizedBatch, rawBatch]);
            const [hr, rr] = res;
            this.tensorStore.addHRPltData(hr.dataSync());
            this.tensorStore.addRRPltData(rr.dataSync());
        }
    };
}

export default Posprocessor;