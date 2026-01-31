/*********************************************************
 * QueueSmart AI – Real ML Wait Time Predictor
 * Uses TensorFlow.js + Firestore data
 *********************************************************/

import {
  waitTimeLogsRef,
  getDocs
} from "./firebase.js";

/* =====================================================
   GLOBAL MODEL
   ===================================================== */

let model = null;
let modelTrained = false;

/* =====================================================
   CREATE ML MODEL
   ===================================================== */

function createModel() {
  const m = tf.sequential();

  m.add(tf.layers.dense({
    inputShape: [3],   // position, crowd, hour
    units: 1
  }));

  m.compile({
    optimizer: tf.train.adam(0.01),
    loss: "meanSquaredError"
  });

  return m;
}

/* =====================================================
   LOAD TRAINING DATA FROM FIRESTORE
   ===================================================== */

async function loadTrainingData() {
  const snapshot = await getDocs(waitTimeLogsRef);

  const inputs = [];
  const labels = [];

  snapshot.forEach(doc => {
    const d = doc.data();

    if (
      d.position !== undefined &&
      d.crowd !== undefined &&
      d.hour !== undefined &&
      d.waitTime !== undefined
    ) {
      inputs.push([
        d.position,
        d.crowd,
        d.hour
      ]);

      labels.push(d.waitTime);
    }
  });

  return { inputs, labels };
}

/* =====================================================
   TRAIN MODEL
   ===================================================== */

export async function trainWaitTimeModel() {
  const { inputs, labels } = await loadTrainingData();

  if (inputs.length < 10) {
    console.warn("⚠️ Not enough data for ML. Using fallback.");
    return;
  }

  if (!model) {
    model = createModel();
  }

  const xs = tf.tensor2d(inputs);
  const ys = tf.tensor2d(labels, [labels.length, 1]);

  await model.fit(xs, ys, {
    epochs: 60,
    batchSize: 8,
    shuffle: true,
    verbose: 0
  });

  xs.dispose();
  ys.dispose();

  modelTrained = true;
  console.log("✅ AI model trained with", inputs.length, "samples");
}

/* =====================================================
   PREDICT WAIT TIME
   ===================================================== */

export function predictWaitTime(position, crowd, hour) {
  // Fallback logic (before ML is trained)
  if (!modelTrained || !model) {
    return Math.max(1, Math.round(
      position * 2 + crowd * 0.5
    ));
  }

  const input = tf.tensor2d([[position, crowd, hour]]);
  const prediction = model.predict(input);
  const value = prediction.dataSync()[0];

  input.dispose();
  prediction.dispose();

  return Math.max(1, Math.round(value));
}

/* =====================================================
   AUTO-RETRAIN (EVERY 2 MINUTES)
   ===================================================== */

setInterval(() => {
  trainWaitTimeModel();
}, 120000);
