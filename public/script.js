document.addEventListener("DOMContentLoaded", () => {
  const btnEnter = document.getElementById("enterBooth");
  const startBtn = document.getElementById("startCapture");
  const video = document.getElementById("videoCapture");
  const countdownEl = document.getElementById("countdown");
  const resultContainer = document.getElementById("photoResult");

  const PHOTO_COUNT = 3;

  let capturedImages = [];

  btnEnter.addEventListener("click", async () => {
    switchScreen("photobooth");

    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
  });

  startBtn.addEventListener("click", async () => {
    startBtn.style.display = "none";
    capturedImages = [];

    for (let i = 0; i < PHOTO_COUNT; i++) {
      await runCountdown();
      capturedImages.push(captureFrame(video));
    }

    const strip = await createPhotoStrip(capturedImages);
    showResult(strip);
  });

  function switchScreen(id) {
    document.querySelectorAll(".screen").forEach((s) => {
      s.classList.remove("activeScr");
    });
    document.getElementById(id).classList.add("activeScr");
  }

  function runCountdown() {
    return new Promise((resolve) => {
      let count = 3;
      countdownEl.style.display = "block";

      const interval = setInterval(() => {
        countdownEl.textContent = count;

        if (count === 0) flash();

        count--;

        if (count < 0) {
          clearInterval(interval);
          countdownEl.style.display = "none";
          resolve();
        }
      }, 1000);
    });
  }

  function flash() {
    const flashEl = document.createElement("div");
    flashEl.style.position = "absolute";
    flashEl.style.top = 0;
    flashEl.style.left = 0;
    flashEl.style.width = "100%";
    flashEl.style.height = "100%";
    flashEl.style.background = "white";
    flashEl.style.opacity = "0.8";
    flashEl.style.zIndex = "5";
    flashEl.style.transition = "opacity 0.3s ease";

    document.body.appendChild(flashEl);

    setTimeout(() => (flashEl.style.opacity = "0"), 50);
    setTimeout(() => flashEl.remove(), 300);
  }

  function captureFrame(video) {
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);

    ctx.drawImage(video, 0, 0);

    return canvas.toDataURL("image/png");
  }

  async function createPhotoStrip(images) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const frame = new Image();
    frame.src = "/assets/polkadots-bg-remove.png";

    await new Promise((res) => (frame.onload = res));

    canvas.width = frame.width;
    canvas.height = frame.height;

    const loadedImages = await Promise.all(
      images.map((src) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.src = src;
          img.onload = () => resolve(img);
        });
      }),
    );

    const imgW = 860;
    const imgH = 900;
    const centerX = 62;

    const slots = [
      { x: centerX, y: 100, w: imgW, h: imgH },
      { x: centerX, y: 900, w: imgW, h: imgH },
      { x: centerX, y: 1800, w: imgW, h: imgH },
    ];

    loadedImages.forEach((img, i) => {
      const s = slots[i];
      ctx.filter = "grayscale(100%) sepia(20%) contrast(100%) brightness(110%)";
      ctx.drawImage(img, s.x, s.y, s.w, s.h);
      ctx.filter = "none";
    });

    ctx.drawImage(frame, 0, 0);

    return canvas;
  }

  function showResult(canvas) {
    switchScreen("resultScreen");

    const img = document.createElement("img");
    img.src = canvas.toDataURL();

    img.style.position = "absolute";
    img.style.top = "15.4%";
    img.style.left = "50%";
    img.style.transform = "translateX(-50%)";
    img.style.width = "150px";

    resultContainer.innerHTML = "";
    resultContainer.appendChild(img);

    addDownload(canvas);
  }

  function addDownload(canvas) {
    const btn = document.createElement("button");
    btn.className = "download-btn";
    btn.textContent = "Download";

    btn.onclick = () => {
      const link = document.createElement("a");
      link.download = "photostrip.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    };

    resultContainer.appendChild(btn);
  }
});
