/* ==========================================================
   GET DEBATING: random motion generator, side picker and prep timer.
   The motions themselves live in js/motions.js.
   You should not need to edit this file.
   ========================================================== */

(function () {
  "use strict";

  var root = document.getElementById("motion-generator");
  if (!root) { return; }

  /* ---- Read the list ------------------------------------ */
  var motions = (window.MOTION_LIST || "").split("\n").map(function (line) {
    var parts = line.split("|").map(function (p) { return p.trim(); });
    if (parts.length < 3 || !parts[2]) { return null; }
    return { topic: parts[0], level: parts[1], text: parts.slice(2).join(" | ") };
  }).filter(Boolean);

  var topicSelect = document.getElementById("motion-topic");
  var levelSelect = document.getElementById("motion-level");
  var textBox     = document.getElementById("motion-text");
  var topicChip   = document.getElementById("motion-chip-topic");
  var levelChip   = document.getElementById("motion-chip-level");
  var countBox    = document.getElementById("motion-count");
  var sideBox     = document.getElementById("motion-side");
  var newButton   = document.getElementById("motion-new");
  var sideButton  = document.getElementById("motion-pick-side");

  function unique(values) {
    return values.filter(function (v, i) { return v && values.indexOf(v) === i; });
  }
  function addOptions(select, values) {
    values.forEach(function (value) {
      var option = document.createElement("option");
      option.textContent = value;
      select.appendChild(option);
    });
  }

  var levelOrder = ["Beginner", "Intermediate", "Advanced"];
  var levels = unique(motions.map(function (m) { return m.level; })).sort(function (a, b) {
    var ia = levelOrder.indexOf(a), ib = levelOrder.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  addOptions(topicSelect, unique(motions.map(function (m) { return m.topic; })));
  addOptions(levelSelect, levels);

  /* ---- Pick a motion ------------------------------------ */
  var current = null;

  function matching() {
    var topic = topicSelect.value, level = levelSelect.value;
    return motions.filter(function (m) {
      return (!topic || m.topic === topic) && (!level || m.level === level);
    });
  }

  function updateCount() {
    var n = matching().length;
    countBox.textContent = n + (n === 1 ? " motion matches" : " motions match") + " these filters.";
  }

  function showMotion() {
    var pool = matching();
    sideBox.hidden = true;
    updateCount();
    if (!pool.length) {
      current = null;
      textBox.textContent = "No motions match these filters. Try a different topic or difficulty.";
      topicChip.hidden = levelChip.hidden = true;
      return;
    }
    var choices = pool.length > 1 ? pool.filter(function (m) { return m !== current; }) : pool;
    current = choices[Math.floor(Math.random() * choices.length)];
    textBox.textContent = current.text;
    topicChip.textContent = current.topic;
    levelChip.textContent = current.level;
    topicChip.hidden = levelChip.hidden = false;
  }

  newButton.addEventListener("click", showMotion);
  topicSelect.addEventListener("change", showMotion);
  levelSelect.addEventListener("change", showMotion);

  /* ---- Side picker -------------------------------------- */
  sideButton.addEventListener("click", function () {
    var side = Math.random() < 0.5 ? "Proposition" : "Opposition";
    sideBox.innerHTML = "You are <strong>" + side + "</strong>";
    sideBox.hidden = false;
  });

  /* ---- Prep timer --------------------------------------- */
  var timer        = document.getElementById("prep-timer");
  var display      = document.getElementById("timer-display");
  var minutesInput = document.getElementById("timer-minutes");
  var startButton  = document.getElementById("timer-start");
  var resetButton  = document.getElementById("timer-reset");
  var timerStatus  = document.getElementById("timer-status");
  var remaining = 0, endsAt = 0, ticker = null;

  function format(ms) {
    var total = Math.ceil(ms / 1000);
    var m = Math.floor(total / 60), s = total % 60;
    return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
  }
  function stopTicking() { clearInterval(ticker); ticker = null; }

  function reset() {
    stopTicking();
    remaining = Number(minutesInput.value) * 60000;
    display.textContent = format(remaining);
    startButton.textContent = "Start";
    timer.classList.remove("is-done");
    timerStatus.textContent = "";
  }

  function tick() {
    remaining = Math.max(0, endsAt - Date.now());
    display.textContent = format(remaining);
    if (remaining === 0) {
      stopTicking();
      startButton.textContent = "Start";
      timer.classList.add("is-done");
      timerStatus.textContent = "Time is up. Start the debate.";
    }
  }

  startButton.addEventListener("click", function () {
    if (ticker) {                       // pause
      stopTicking();
      remaining = Math.max(0, endsAt - Date.now());
      startButton.textContent = "Resume";
      timerStatus.textContent = "Paused.";
      return;
    }
    if (remaining === 0) { reset(); }
    timer.classList.remove("is-done");
    endsAt = Date.now() + remaining;
    startButton.textContent = "Pause";
    timerStatus.textContent = "Prep time is running.";
    ticker = setInterval(tick, 250);
  });
  resetButton.addEventListener("click", reset);
  minutesInput.addEventListener("change", reset);

  /* ---- Start with a motion on screen -------------------- */
  showMotion();
  reset();
})();
