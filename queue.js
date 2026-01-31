/*********************************************************
 * QueueSmart – Queue Logic + AI Integration
 *********************************************************/

import {
  db,
  queueCollection,
  addDoc,
  deleteDoc,
  getDocs,
  doc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  waitTimeLogsRef
} from "./firebase.js";

import {
  predictWaitTime
} from "./ai-waittime.js";

/* =====================================================
   GLOBAL STATE
   ===================================================== */

let currentQueueUnsub = null;

/* =====================================================
   JOIN QUEUE
   ===================================================== */

export async function joinQueue(locationId, sessionId) {
  const usersRef = queueCollection(locationId);

  await addDoc(usersRef, {
    sessionId,
    joinedAt: serverTimestamp()
  });
}

/* =====================================================
   LEAVE QUEUE
   ===================================================== */

export async function leaveQueue(locationId, sessionId) {
  const usersRef = queueCollection(locationId);
  const snapshot = await getDocs(usersRef);

  snapshot.forEach(async d => {
    if (d.data().sessionId === sessionId) {
      await deleteDoc(doc(usersRef, d.id));
    }
  });
}

/* =====================================================
   LISTEN TO QUEUE (REAL-TIME)
   ===================================================== */

export function listenToQueue(locationId, sessionId, callback) {
  const usersRef = queueCollection(locationId);

  const q = query(usersRef, orderBy("joinedAt"));

  if (currentQueueUnsub) currentQueueUnsub();

  currentQueueUnsub = onSnapshot(q, snapshot => {
    const users = [];
    let position = -1;

    snapshot.docs.forEach((d, index) => {
      const data = d.data();
      users.push(data);

      if (data.sessionId === sessionId) {
        position = index + 1;
      }
    });

    const crowd = users.length;
    const hour = new Date().getHours();

    const predictedWait = position > 0
      ? predictWaitTime(position, crowd, hour)
      : 0;

    callback({
      position,
      crowd,
      predictedWait,
      users
    });
  });
}

/* =====================================================
   LOG ACTUAL WAIT TIME (FOR ML TRAINING)
   ===================================================== */

export async function logWaitTime({
  locationId,
  position,
  crowd,
  joinedAt,
  servedAt
}) {
  const waitMinutes = Math.max(
    1,
    Math.round((servedAt - joinedAt) / 60000)
  );

  await addDoc(waitTimeLogsRef, {
    locationId,
    position,
    crowd,
    hour: new Date(joinedAt).getHours(),
    waitTime: waitMinutes,
    timestamp: serverTimestamp()
  });
}
