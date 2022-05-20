<template>
  <v-container>
    <div>
      <b>
        This is a camera-based remote PPG monitoring app, which also measures
        BMI and skin age.
      </b>
      <p style="color: red">
        Place your face in the red box and keep stationary for
        {{ maxCount }} seconds
      </p>
    </div>

    <div class="my-3 d-flex justify-center">
      <v-btn
        @click="startCam"
        rounded
        class="mx-3"
        v-show="!isCamStarted"
        :disabled="!isModelReady"
        >start Camera</v-btn
      >
      <v-btn @click="stopCam" rounded class="mx-3" v-show="isCamStarted"
        >stop Camera</v-btn
      >
      <v-btn
        @click="startRecording"
        rounded
        class="mx-3"
        v-show="isCamStarted && isModelReady && !isRecordStarted"
        >Start recording</v-btn
      >
    </div>

    <div class="d-flex justify-center mt-3">
      <p v-if="loadingMsg">{{ loadingMsg }}</p>
      <p v-show="isCamStarted">recording stops in {{ curCount }} seconds</p>
    </div>
    <div class="d-flex justify-center mb-3">
      <div id="overlay" v-show="isCamStarted">
        <video src="" muted playsinline id="webcam"></video>
        <canvas id="mask"></canvas>
      </div>
    </div>

    <div v-show="isResultsReady" id="results">
      <v-divider class="my-6"></v-divider>
      <b>Your Estimated Pulse & Respiratory</b>
      <div class="chart">
        <canvas id="chartHR"></canvas>
      </div>
      <div class="chart">
        <canvas id="chartRR"></canvas>
      </div>
      <v-divider class="my-6"></v-divider>

      <b>Your Estimated Vital Measurements</b>
      <ul>
        <li>AGE: {{ AGE }}</li>
        <li>BMI: {{ BMI }}</li>
        <li>HR : {{ HR }} bpm</li>
        <li>RR : {{ RR }} rpm</li>
      </ul>
    </div>
  </v-container>
</template>

<script>
import { maxCountDown } from "@/assets/js/constants";
import BMIModel from "@/assets/js/BMI";
import PulseModel from "@/assets/js/pulse";
import webcam from "@/assets/js/webcam";
import { plotChart } from "@/assets/js/ppgChart";

export default {
  name: "TFModels",
  data: () => ({
    camSize: [480, 480],
    imageSize: [224, 224],
    box: null,
    // status
    isCamStarted: true,
    isRecordStarted: false,
    isBMIModelReady: false,
    isPulseModelReady: false,
    isResultsReady: true,
    // count down
    maxCount: maxCountDown,
    curCount: maxCountDown,
    // results
    BMI: null,
    AGE: null,
    HR: null,
    RR: null,
    // intervals
    intvBMI: null,
    intvPulse: null,
    invtCountDown: null,
    chartHR: null,
    chartRR: null,
  }),
  computed: {
    isModelReady: function () {
      return this.isBMIModelReady && this.isPulseModelReady;
    },
    loadingMsg: function () {
      if (this.isBMIModelReady && this.isPulseModelReady) {
        return null;
      } else if (this.isBMIModelReady) {
        return "loading Pulse model ...";
      } else {
        return "loading BMI model ...";
      }
    },
  },

  mounted: function () {
    // const BasePath = "http://localhost:5500/public";
    const BasePath = "/data-story/assets/vital-signs-predict-60s";
    this.loadModels(BasePath);
    this.webcam = document.getElementById("webcam");
    this.mask = document.getElementById("mask");
    this.overlay = document.getElementById("overlay");
    this.adjustSize();
    this.drawBox();
    this.isCamStarted = false;
    this.isResultsReady = false;
  },
  methods: {
    loadModels: function (BasePath) {
      BMIModel.loadModel(BasePath + "/models/BMI/model.json", () => {
        this.isBMIModelReady = true;
      });
      PulseModel.loadModel(BasePath + "/models/Pulse/model.json", () => {
        this.isPulseModelReady = true;
      });
    },
    reset: function () {
      this.curCount = this.maxCount;
      this.stopCam();
    },
    destoryCharts: function () {
      if (this.chartHR) {
        this.chartHR.destroy();
      }
      if (this.chartRR) {
        this.chartRR.destroy();
      }
    },
    startCam: function () {
      const callback = () => {
        this.isCamStarted = true;
        this.isResultsReady = false;
        this.destoryCharts();
      };
      webcam.start(this.webcam, callback);
    },
    stopCam: function () {
      const callback = () => {
        this.isCamStarted = false;
        this.isRecordStarted = false;
      };
      webcam.stop(this.webcam, callback);
    },

    startRecording: function () {
      this.isRecordStarted = true;
      this.predictBMI();
      this.predictPulse();
      this.countDown();
    },
    output: function () {
      this.isResultsReady = true;
      const results = BMIModel.output();
      this.BMI = `${results.BMI[0].toFixed(1)} +/- ${results.BMI[1].toFixed(
        1
      )}`;
      this.AGE = `${results.AGE[0].toFixed(0)} +/- ${results.AGE[1].toFixed(
        0
      )}`;
      const [HR, RR, HRFreq, RRFreq] = PulseModel.output();
      // output HR, RR freq
      this.RR = RRFreq.toFixed(1);
      this.HR = HRFreq.toFixed(1);
      // plot curve
      const canvasHR = document.getElementById("chartHR");
      const canvasRR = document.getElementById("chartRR");
      this.chartHR = plotChart(canvasHR, HR.x, HR.y, "HR", "red");
      this.chartRR = plotChart(canvasRR, RR.x, RR.y, "RR", "green");
    },

    predictBMI: function () {
      this.intvBMI = setInterval(() => {
        BMIModel.predict(this.webcam, this.box, [224, 224]);
      }, 1000);
    },

    predictPulse: function () {
      this.intvPulse = setInterval(() => {
        PulseModel.capture(this.webcam, this.box, [36, 36]);
      }, 30);
      PulseModel.start();
    },

    countDown: function () {
      this.invtCountDown = setInterval(() => {
        if (this.curCount <= 0) {
          clearInterval(this.intvBMI);
          clearInterval(this.intvPulse);
          clearInterval(this.invtCountDown);
          this.output();
          PulseModel.stop();
          this.reset();
        } else {
          this.curCount--;
        }
      }, 1000);
    },

    drawBox: function () {
      const leftSpace = parseInt((this.camSize[0] - this.imageSize[0]) / 2);
      const topSpace = parseInt(0.3 * (this.camSize[1] - this.imageSize[1]));
      const y1 = topSpace / this.camSize[1];
      const x1 = leftSpace / this.camSize[0];
      const y2 = y1 + this.imageSize[1] / this.camSize[1];
      const x2 = x1 + this.imageSize[0] / this.camSize[0];
      this.box = [[y1, x1, y2, x2]];
      const ctx = this.mask.getContext("2d");
      ctx.beginPath();
      ctx.lineWidth = 4;
      ctx.strokeStyle = "red";
      ctx.rect(leftSpace, topSpace, this.imageSize[0], this.imageSize[1]);
      ctx.stroke();
    },
    adjustSize: function () {
      if (this.camSize[0] > window.screen.width - 24) {
        this.camSize = [window.screen.width - 24, window.screen.width - 24];
      }
      [this.mask.width, this.mask.height] = this.camSize;
      [this.webcam.width, this.webcam.height] = this.camSize;
      this.overlay.setAttribute(
        "style",
        `width : ${this.camSize[0]}px; height : ${this.camSize[1]}px; `
      );
    },
  },
};
</script>

<style scoped>
#overlay {
  position: relative;
  /* border: 1px black solid; */
}

#webcam {
  position: absolute;
  -o-transform: scaleX(-1);
  -moz-transform: scaleX(-1);
  -webkit-transform: scaleX(-1);
  -ms-transform: scaleX(-1);
  transform: scaleX(-1);
}

#mask {
  position: absolute;
}

p {
  text-align: justify;
}

.chart {
  height: 200px;
}
</style>