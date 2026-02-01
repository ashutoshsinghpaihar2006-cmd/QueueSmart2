alert("main.js loaded");
/*********************************************************
 * QueueSmart – Main App Controller
 *********************************************************/

import {
  joinQueue,
  leaveQueue,
  listenToQueue
} from "./queue.js";

import {
  trainWaitTimeModel
} from "./ai-waittime.js";

/* =====================================================
   SESSION ID (ANONYMOUS USER)
   ===================================================== */

let sessionId = localStorage.getItem("queuesmart_session");

if (!sessionId) {
  sessionId = crypto.randomUUID();
  localStorage.setItem("queuesmart_session", sessionId);
}

/* =====================================================
   DOM ELEMENTS
   ===================================================== */

const locationSelect = document.getElementById("locationSelect");
const joinBtn = document.getElementById("joinQueueBtn");
const leaveBtn = document.getElementById("leaveQueueBtn");

const positionEl = document.getElementById("position");
const crowdEl = document.getElementById("crowd");
const waitEl = document.getElementById("waitTime");

const statusEl = document.getElementById("status");

/* =====================================================
   APP STATE
   ===================================================== */

let currentLocation = null;
let listening = false;

/* =====================================================
   JOIN QUEUE HANDLER
   ===================================================== */

joinBtn.addEventListener("click", async () => {
  const locationId = locationSelect.value;

  if (!locationId) {
    alert("Please select a location");
    return;
  }

  currentLocation = locationId;

  await joinQueue(locationId, sessionId);

  statusEl.innerText = "✅ You joined the queue";
  joinBtn.disabled = true;
  leaveBtn.disabled = false;

  startListening();
});

/* =====================================================
   LEAVE QUEUE HANDLER
   ===================================================== */

leaveBtn.addEventListener("click", async () => {
  if (!currentLocation) return;

  await leaveQueue(currentLocation, sessionId);

  statusEl.innerText = "❌ You left the queue";
  joinBtn.disabled = false;
  leaveBtn.disabled = true;

  positionEl.innerText = "-";
  crowdEl.innerText = "-";
  waitEl.innerText = "-";

  listening = false;
});

/* =====================================================
   REAL-TIME QUEUE LISTENER
   ===================================================== */

function startListening() {
  if (listening) return;
  listening = true;

  listenToQueue(currentLocation, sessionId, data => {
    if (data.position === -1) {
      positionEl.innerText = "-";
      waitEl.innerText = "-";
      statusEl.innerText = "⏳ Waiting for position...";
      return;
    }

    positionEl.innerText = data.position;
    crowdEl.innerText = data.crowd;
    waitEl.innerText = `${data.predictedWait} min`;

    statusEl.innerText = "🧠 AI predicting wait time";
  });
}

/* =====================================================
   AUTO TRAIN AI ON LOAD
   ===================================================== */

window.addEventListener("load", async () => {
  await trainWaitTimeModel();
  console.log("🤖 AI model initialized");
});
