import { zeros, browser, image, tidy, cumsum, reshape } from "@tensorflow/tfjs";
import tensorStore from "./mttscan/lib/tensorStore";
import Posprocessor from "./mttscan/lib/posprocessor";
import Preprocessor from './mttscan/lib/preprocessor';
import Fili from 'fili';
import bci from "bcijs";
import { maxCountDown } from "@/assets/js/constants";


class PulseModel {
    constructor() {
        this.tensorStore = tensorStore;
        this.postprocessor = new Posprocessor(this.tensorStore);
        this.preprocessor = new Preprocessor(this.tensorStore, this.postprocessor);
    }

    async loadModel(path, callback = null) {
        await this.postprocessor.loadModel(path);
        const x = zeros([1, 36, 36, 3]);
        const [a, b] = this.postprocessor.model.predict([x, x]);
        a.dispose();
        b.dispose();
        x.dispose();
        console.log('Pulse model is loaded!');
        if (callback) {
            callback();
        }
    }

    capture(elm, box, imageSize) {
        const x = tidy(() => {
            const x = browser.fromPixels(elm).expandDims(0)
            const crop = image.cropAndResize(x, box, [0], imageSize, 'bilinear');
            const origV = crop.gather(0);
            return origV;
        });
        this.tensorStore.addRawTensor(x);
    }

    start() {
        this.preprocessor.startProcess();
    }

    stop() {
        this.preprocessor.stopProcess();
        this.tensorStore.reset();
    }
    output_i(pltData, iirFilter) {
        if (pltData) {
            const rppgCumsum = cumsum(reshape(pltData, [-1, 1]), 0).dataSync();
            const result = iirFilter
                .filtfilt(rppgCumsum)
                .slice(0, rppgCumsum.length - 60);
            const labels = Array.from(pltData.keys())
                .map(i => i.toString())
                .slice(0, rppgCumsum.length - 60);
            return { x: labels, y: result };
        }
    }

    getFrequency(signal, flb, fub) {
        const fs = 30;
        const fttSizeRaw = 4 * maxCountDown * fs;
        const fttSize = Math.pow(2, Math.ceil(Math.log2(fttSizeRaw)));
        const res = bci.periodogram(signal, fs, { fttSize: fttSize });
        const f = res.frequencies;
        const pxx = res.estimates;
        const ff = [];
        const pxxf = [];
        for (let i = 0; i < f.length; i++) {
            if (f[i] >= flb && f[i] <= fub) {
                ff.push(f[i]);
                pxxf.push(pxx[i]);
            }
        }
        return ff[pxxf.indexOf(Math.max(...pxxf))] * 60
    }

    output() {
        const iirCalculator = new Fili.CalcCascades();
        const iirFilterCoeffs = iirCalculator.bandpass({
            order: 1, // cascade 3 biquad filters (max: 12)
            characteristic: 'butterworth',
            Fs: 30, // sampling frequency
            Fc: 1.375, // (2.5-0.75) / 2 + 0.75, 2.5 --> 150/60, 0.75 --> 45/60 # 1.625
            BW: 1.25, // 2.5 - 0.75 = 1.75
            gain: 0, // gain for peak, lowshelf and highshelf
            preGain: false // adds one constant multiplication for highpass and lowpass
        });
        const iirFilter = new Fili.IirFilter(iirFilterCoeffs);
        const HR = this.output_i(tensorStore.hrPltData, iirFilter);
        const RR = this.output_i(tensorStore.rrPltData, iirFilter);
        const HRFreq = this.getFrequency(HR['y'], 0.75, 2.5);
        const RRFreq = this.getFrequency(RR['y'], 0.08, 0.5);
        return [HR, RR, HRFreq, RRFreq];
    }
}

export default new PulseModel();