const overlays = {
  settings: document.querySelector('[data-overlay="settings"]'),
  process: document.querySelector('[data-overlay="process"]'),
  fail: document.querySelector('[data-overlay="fail"]'),
  success: document.querySelector('[data-overlay="success"]'),
};

const overlayBackdrop = document.querySelector("[data-overlay-backdrop]");
const claimButton = document.getElementById("claimButton");
const claimButtonLabel = document.getElementById("claimButtonLabel");
const settingsForm = document.getElementById("settingsForm");
const botNameInput = document.getElementById("botName");
const avatarGrid = document.getElementById("avatarGrid");
const avatarButtons = Array.from(document.querySelectorAll(".avatar-option"));
const startButton = document.getElementById("startButton");
const progressRing = document.getElementById("processRing");
const progressPercent = document.getElementById("progressPercent");
const progressStage = document.getElementById("progressStage");
const statusCopy = document.getElementById("statusCopy");
const stepList = Array.from(document.querySelectorAll(".step-item"));
const stepProgressRings = Array.from(document.querySelectorAll("[data-step-progress]"));
const retryButton = document.getElementById("retryButton");
const successAvatar = document.getElementById("successAvatar");
const successTitle = document.getElementById("success-title");
const serialPill = document.getElementById("serialPill");
const inventoryText = document.getElementById("inventoryText");
const successCard = document.getElementById("successCard");
const chatButton = document.getElementById("chatButton");
const heroVideo = document.querySelector(".hero-video");

const avatarMap = {
  profile1: "./profile/profile1.png",
  profile2: "./profile/profile2.png",
  profile3: "./profile/profile3.png",
  profile4: "./profile/profile4.png",
};

const stepConfig = [
  { label: "启动云端服务", duration: 2400, displaySeconds: 15 },
  { label: "部署OpenClaw", duration: 1800, displaySeconds: 10 },
  { label: "连接BossHi", duration: 2200, displaySeconds: 8 },
];

const PROCESS_COPY = "";
const STEP_RING_CIRCUMFERENCE = 53.41;
const INVENTORY_EXTERNAL_RANGE = [1, 3];

const state = {
  overlay: null,
  name: "",
  avatar: "",
  claimed: false,
  inventory: 2716,
  serial: 2031,
  timers: [],
  stepStartedAt: 0,
  currentStep: -1,
  stepDurations: [0, 0, 0],
  inventoryFlowTimer: 0,
};

function clearTimers() {
  while (state.timers.length) {
    window.clearTimeout(state.timers.pop());
  }
}

function resetProcessView() {
  state.currentStep = -1;
  state.stepDurations = [0, 0, 0];
  progressRing.style.setProperty("--progress", "0deg");
  progressPercent.textContent = "0%";
  progressStage.textContent = "准备中";
  statusCopy.textContent = PROCESS_COPY;

  stepList.forEach((item, index) => {
    item.classList.remove("is-active", "is-complete");
    item.querySelector(".step-time").textContent = "";
    updateStepRing(index, 0, "pending");
  });
}

function resetSettingsForm() {
  state.name = "";
  state.avatar = "";
  botNameInput.value = "";
  avatarButtons.forEach((button) => button.classList.remove("is-selected"));
  startButton.disabled = true;
}

function updateInventory() {
  inventoryText.textContent = `虾塘还剩 ${state.inventory} 只龙虾待领取`;
}

function updateClaimButton() {
  if (state.claimed) {
    claimButtonLabel.textContent = "已领取";
    claimButton.classList.add("is-claimed");
    claimButton.style.background = "#B3CCFF";
  } else {
    claimButtonLabel.textContent = "领取我的龙虾";
    claimButton.classList.remove("is-claimed");
    claimButton.style.background = "";
  }
}

function scheduleInventoryFlow() {
  if (state.inventoryFlowTimer) {
    window.clearTimeout(state.inventoryFlowTimer);
  }

  const delay = 4800 + Math.random() * 4200;

  state.inventoryFlowTimer = window.setTimeout(() => {
    const decrement =
      INVENTORY_EXTERNAL_RANGE[0] +
      Math.floor(Math.random() * (INVENTORY_EXTERNAL_RANGE[1] - INVENTORY_EXTERNAL_RANGE[0] + 1));

    state.inventory = Math.max(0, state.inventory - decrement);
    updateInventory();
    scheduleInventoryFlow();
  }, delay);
}

function setOverlay(name) {
  state.overlay = name;
  const isVisible = Boolean(name);

  overlayBackdrop.classList.toggle("is-hidden", !isVisible);

  Object.entries(overlays).forEach(([key, element]) => {
    const active = key === name;
    element.classList.toggle("is-hidden", !active);
    element.setAttribute("aria-hidden", active ? "false" : "true");
  });

  if (name === "success") {
    successCard.classList.remove("is-entering");
    window.requestAnimationFrame(() => {
      successCard.classList.add("is-entering");
    });
  } else {
    successCard.classList.remove("is-entering");
  }
}

function closeCurrentOverlay() {
  clearTimers();
  resetProcessView();
  setOverlay(null);
}

function validateSettings() {
  const name = botNameInput.value.trim();
  state.name = name;
  startButton.disabled = !(name && state.avatar);
}

function selectAvatar(key) {
  state.avatar = key;
  avatarButtons.forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.avatar === key);
  });
  validateSettings();
}

function getOutcome() {
  return /fail|失败/i.test(state.name) ? "fail" : "success";
}

function updateSuccessContent() {
  const title = state.name || "虾老板的小助手";
  successTitle.textContent = title;
  successAvatar.src = avatarMap[state.avatar] || avatarMap.profile3;
  successAvatar.alt = `${title}头像`;
  serialPill.lastElementChild.textContent = `您已领取虾塘的第${state.serial}只龙虾`;
}

function finishProcess(outcome) {
  clearTimers();
  state.claimed = outcome === "success";

  if (outcome === "success") {
    state.inventory = Math.max(0, state.inventory - 1);
    state.serial += 1;
    updateInventory();
    updateClaimButton();
    updateSuccessContent();
    setOverlay("success");
    return;
  }

  updateClaimButton();
  setOverlay("fail");
}

function updateStepRing(stepIndex, progress, status) {
  const ring = stepProgressRings[stepIndex];

  if (!ring) {
    return;
  }

  const safeProgress = Math.max(0, Math.min(1, progress));
  const offset = STEP_RING_CIRCUMFERENCE * (1 - safeProgress);

  ring.style.stroke = "#1C64F2";
  ring.style.strokeDasharray = `${STEP_RING_CIRCUMFERENCE}`;
  ring.style.strokeDashoffset = `${offset}`;
  ring.style.opacity = status === "pending" ? "0" : "1";
}

function getVisualStepProgress(progress) {
  const safeProgress = Math.max(0, Math.min(1, progress));

  if (safeProgress <= 0) {
    return 0;
  }

  if (safeProgress >= 1) {
    return 1;
  }

  if (safeProgress < 0.55) {
    const phase = safeProgress / 0.55;
    return 0.72 * (1 - Math.pow(1 - phase, 2.2));
  }

  if (safeProgress < 0.88) {
    const phase = (safeProgress - 0.55) / 0.33;
    return 0.72 + 0.21 * phase;
  }

  const phase = (safeProgress - 0.88) / 0.12;
  return 0.93 + 0.07 * Math.pow(phase, 1.8);
}

function formatStepTime(stepIndex, progress) {
  const displaySeconds = stepConfig[stepIndex]?.displaySeconds;

  if (!displaySeconds) {
    return "";
  }

  const safeProgress = Math.max(0, Math.min(1, progress));

  if (safeProgress <= 0) {
    return "";
  }

  if (safeProgress >= 1) {
    return `${displaySeconds}s`;
  }

  return `${Math.min(displaySeconds, Math.max(1, Math.ceil(displaySeconds * safeProgress)))}s`;
}

function setStepState(stepIndex, status, elapsedMs) {
  const item = stepList[stepIndex];
  const timeNode = item.querySelector(".step-time");
  const duration = stepConfig[stepIndex].duration;
  const rawProgress = typeof elapsedMs === "number" && duration > 0 ? Math.min(1, elapsedMs / duration) : 0;
  const progress = getVisualStepProgress(rawProgress);

  item.classList.remove("is-active", "is-complete");

  if (status === "active") {
    item.classList.add("is-active");
    updateStepRing(stepIndex, progress, "active");
    timeNode.textContent = formatStepTime(stepIndex, progress);
  }

  if (status === "complete") {
    item.classList.add("is-complete");
    updateStepRing(stepIndex, 1, "complete");
    timeNode.textContent = formatStepTime(stepIndex, 1);
  }

  if (status === "pending") {
    updateStepRing(stepIndex, 0, "pending");
    timeNode.textContent = "";
  }
}

function runStep(stepIndex, totalDuration) {
  if (stepIndex >= stepConfig.length) {
    finishProcess(getOutcome());
    return;
  }

  state.currentStep = stepIndex;
  state.stepStartedAt = performance.now();

  const step = stepConfig[stepIndex];
  progressStage.textContent = `步骤 ${stepIndex + 1}/${stepConfig.length}`;
  setStepState(stepIndex, "active", 0);

  const tick = () => {
    const elapsed = performance.now() - state.stepStartedAt;
    const cappedElapsed = Math.min(elapsed, step.duration);
    const completedBefore = stepConfig
      .slice(0, stepIndex)
      .reduce((sum, item) => sum + item.duration, 0);
    const overall = Math.min(1, (completedBefore + cappedElapsed) / totalDuration);
    const degree = `${overall * 360}deg`;

    progressRing.style.setProperty("--progress", degree);
    progressPercent.textContent = `${Math.round(overall * 100)}%`;
    setStepState(stepIndex, "active", cappedElapsed);

    if (cappedElapsed < step.duration) {
      const timerId = window.setTimeout(tick, 100);
      state.timers.push(timerId);
      return;
    }

    state.stepDurations[stepIndex] = cappedElapsed;
    setStepState(stepIndex, "complete", cappedElapsed);

    if (stepIndex === stepConfig.length - 1) {
      progressStage.textContent = "配置完成";
      progressRing.style.setProperty("--progress", "360deg");
      progressPercent.textContent = "100%";
    }

    const timerId = window.setTimeout(() => runStep(stepIndex + 1, totalDuration), 320);
    state.timers.push(timerId);
  };

  tick();
}

function openSettings() {
  clearTimers();
  resetProcessView();
  resetSettingsForm();
  setOverlay("settings");
  window.setTimeout(() => botNameInput.focus(), 120);
}

function openProcess() {
  setOverlay("process");
  resetProcessView();

  const totalDuration = stepConfig.reduce((sum, item) => sum + item.duration, 0);
  const timerId = window.setTimeout(() => runStep(0, totalDuration), 220);
  state.timers.push(timerId);
}

claimButton.addEventListener("click", () => {
  if (state.claimed) {
    setOverlay("success");
    return;
  }

  openSettings();
});

settingsForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (startButton.disabled) {
    validateSettings();
    return;
  }

  openProcess();
});

botNameInput.addEventListener("input", validateSettings);

avatarGrid.addEventListener("click", (event) => {
  const button = event.target.closest(".avatar-option");
  if (!button) {
    return;
  }

  selectAvatar(button.dataset.avatar);
});

document.addEventListener("click", (event) => {
  const closeButton = event.target.closest("[data-close]");
  if (closeButton) {
    const overlayName = closeButton.dataset.close;

    if (overlayName === "fail") {
      resetSettingsForm();
    }

    closeCurrentOverlay();
  }
});

overlayBackdrop.addEventListener("click", () => {
  if (state.overlay === "process") {
    closeCurrentOverlay();
    return;
  }

  if (state.overlay === "fail") {
    resetSettingsForm();
  }

  setOverlay(null);
});

retryButton.addEventListener("click", () => {
  resetSettingsForm();
  openSettings();
});

chatButton.addEventListener("click", () => {
  setOverlay("fail");
});

updateInventory();
updateClaimButton();
resetProcessView();
scheduleInventoryFlow();

if (heroVideo) {
  heroVideo.addEventListener("ended", () => {
    const endFrameTime = Number.isFinite(heroVideo.duration) ? Math.max(0, heroVideo.duration - 0.05) : heroVideo.currentTime;
    heroVideo.currentTime = endFrameTime;
    heroVideo.pause();
  });
}
