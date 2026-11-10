// =====================================
// EXAM SECURITY MONITOR
// =====================================

const welcomeScreen = document.getElementById("welcomeScreen");
const examScreen = document.getElementById("examScreen");
const resultScreen = document.getElementById("resultScreen");

const startButton = document.getElementById("startButton");
const finishButton = document.getElementById("finishButton");
const resetButton = document.getElementById("resetButton");

const warningCount = document.getElementById("warningCount");
const alertBox = document.getElementById("alertBox");
const alertTitle = document.getElementById("alertTitle");
const alertMessage = document.getElementById("alertMessage");

const visibilityStatus = document.getElementById("visibilityStatus");
const fullscreenStatus = document.getElementById("fullscreenStatus");

let active = false;
let ending = false;
let warnings = Number(sessionStorage.getItem("examWarnings") || 0);
let lastWarningTime = 0;
let wasFullscreen = false;

const MAX_WARNINGS = 3;


// =====================================
// UPDATE WARNING COUNTER
// =====================================

function updateWarnings() {
    warningCount.textContent = warnings;

    sessionStorage.setItem(
        "examWarnings",
        String(warnings)
    );
}


// =====================================
// WARNING SYSTEM
// =====================================

function addWarning(title, message) {

    if (!active || ending) return;

    // Hindari laporan ganda dalam waktu sangat dekat.
    const now = Date.now();

    if (now - lastWarningTime < 1500) {
        return;
    }

    lastWarningTime = now;

    warnings++;

    updateWarnings();

    alertBox.classList.remove("hidden");

    alertTitle.textContent = title;

    alertMessage.textContent =
        message + " Peringatan ke-" + warnings + ".";

    console.warn("SECURITY WARNING:", title, warnings);

    if (warnings >= MAX_WARNINGS) {
        alertTitle.textContent = "Batas peringatan tercapai";

        alertMessage.textContent =
            "Aktivitas ujian ditandai untuk diperiksa oleh pengawas.";
    }
}


// =====================================
// START EXAM
// =====================================

startButton.addEventListener("click", async function () {

    // Harus dipanggil langsung dari interaksi pengguna.
    active = true;
    ending = false;

    warnings = 0;
    sessionStorage.setItem("examWarnings", "0");
    sessionStorage.setItem("examActive", "true");

    welcomeScreen.classList.add("hidden");
    examScreen.classList.remove("hidden");

    wasFullscreen = false;

    try {

        if (document.documentElement.requestFullscreen) {

            await document.documentElement.requestFullscreen();

        } else {

            throw new Error("Fullscreen API tidak tersedia.");

        }

        } catch (error) {

        console.warn("Fullscreen gagal:", error);

        alertBox.classList.remove("hidden");
        alertTitle.textContent = "Fullscreen tidak tersedia";

        alertMessage.textContent =
            "Browser tidak mengizinkan fullscreen. Lanjutkan hanya untuk pengujian.";
    }

    wasFullscreen = Boolean(document.fullscreenElement);

    // Simpan ukuran awal setelah fullscreen selesai
    setTimeout(function () {

        saveInitialViewport();
        resizeWarningTriggered = false;

    }, 300);

    updateFullscreenStatus();

    updateWarnings();

    console.log("EXAM STARTED");
});


// =====================================
// VISIBILITY DETECTION
// =====================================

document.addEventListener("visibilitychange", function () {

    visibilityStatus.textContent =
        document.visibilityState;

    if (!active || ending) return;

    if (document.hidden) {

        addWarning(
            "Kamu meninggalkan halaman!",
            "Sistem mendeteksi halaman menjadi tersembunyi."
        );

    }

});


// =====================================
// WINDOW BLUR
// =====================================

window.addEventListener("blur", function () {

    console.log("Window kehilangan fokus.");

    // Tidak langsung dihitung sebagai pelanggaran.
    // Blur bisa terjadi karena keyboard, dialog, atau sistem Android.

});


// =====================================
// WINDOW FOCUS
// =====================================

window.addEventListener("focus", function () {

    console.log("Window mendapatkan fokus.");

});


// =====================================
// FULLSCREEN DETECTION
// =====================================

document.addEventListener("fullscreenchange", function () {

    const currentFullscreen =
        Boolean(document.fullscreenElement);

    updateFullscreenStatus();

    if (!active || ending) {
        wasFullscreen = currentFullscreen;
        return;
    }

    if (wasFullscreen && !currentFullscreen) {

        addWarning(
            "Fullscreen dinonaktifkan!",
            "Kamu keluar dari mode fullscreen."
        );

    }

    wasFullscreen = currentFullscreen;

});


function updateFullscreenStatus() {

    if (document.fullscreenElement) {

        fullscreenStatus.textContent = "Fullscreen aktif";

    } else {

        fullscreenStatus.textContent = "Fullscreen tidak aktif";

    }

}


// =====================================
// RESIZE DETECTION
// =====================================

// =====================================
// SENSITIVE SCREEN SIZE DETECTION
// =====================================

let initialWidth = 0;
let initialHeight = 0;
let resizeWarningTriggered = false;

// Toleransi perubahan ukuran dalam pixel
const RESIZE_THRESHOLD = 2;

function saveInitialViewport() {

    const viewport = window.visualViewport;

    initialWidth = Math.min(
        window.innerWidth,
        viewport ? viewport.width : window.innerWidth
    );

    initialHeight = Math.min(
        window.innerHeight,
        viewport ? viewport.height : window.innerHeight
    );

    console.log("Ukuran awal ujian:", {
        width: initialWidth,
        height: initialHeight
    });
}


function checkViewport() {

    if (!active || ending) return;

    // Belum ada ukuran awal
    if (initialWidth === 0 || initialHeight === 0) return;

    const viewport = window.visualViewport;

    const currentWidth = Math.min(
        window.innerWidth,
        viewport ? viewport.width : window.innerWidth
    );

    const currentHeight = Math.min(
        window.innerHeight,
        viewport ? viewport.height : window.innerHeight
    );

    const widthReduced =
        currentWidth < initialWidth - RESIZE_THRESHOLD;

    const heightReduced =
        currentHeight < initialHeight - RESIZE_THRESHOLD;

    console.log("Pemeriksaan ukuran layar:", {
        initialWidth,
        initialHeight,
        currentWidth,
        currentHeight,
        widthReduced,
        heightReduced
    });

    // Jika ukuran layar mengecil sedikit saja
    if (
        (widthReduced || heightReduced) &&
        !resizeWarningTriggered
    ) {

        resizeWarningTriggered = true;

        addWarning(
            "Perubahan ukuran layar terdeteksi!",
            "Ukuran layar ujian mengecil. Kemungkinan split-screen, floating window, atau perubahan viewport."
        );

    }

    // Aktifkan kembali deteksi jika ukuran kembali normal
    if (
        currentWidth >= initialWidth - RESIZE_THRESHOLD &&
        currentHeight >= initialHeight - RESIZE_THRESHOLD
    ) {

        resizeWarningTriggered = false;

    }
}


// Deteksi perubahan ukuran browser
window.addEventListener("resize", checkViewport);

// Deteksi perubahan visual viewport Android
if (window.visualViewport) {

    window.visualViewport.addEventListener(
        "resize",
        checkViewport
    );

}

// =====================================
// FINISH EXAM
// =====================================

finishButton.addEventListener("click", async function () {

    const confirmFinish = confirm(
        "Apakah kamu yakin ingin menyelesaikan ujian?"
    );

    if (!confirmFinish) return;

    ending = true;
    active = true;
    sessionStorage.removeItem("examActive");

    document.getElementById("finalWarnings").textContent =
        warnings;

    document.getElementById("finalStatus").textContent =
        warnings === 0
            ? "Tidak ada pelanggaran tercatat."
            : "Terdapat aktivitas yang perlu diperiksa.";

    examScreen.classList.add("hidden");
    resultScreen.classList.remove("hidden");

    if (document.fullscreenElement) {

        try {
            await document.exitFullscreen();
        } catch (error) {
            console.warn(error);
        }

    }

    console.log("EXAM FINISHED");

});


// =====================================
// RESET DEMO
// =====================================

resetButton.addEventListener("click", function () {

    sessionStorage.removeItem("examWarnings");
    sessionStorage.removeItem("examActive");

    location.reload();

});


// =====================================
// INITIALIZE
// =====================================

updateWarnings();

// =====================================
// RESTORE SESSION AFTER REFRESH
// =====================================

if (sessionStorage.getItem("examActive") === "true") {

    active = true;

    welcomeScreen.classList.add("hidden");
    examScreen.classList.remove("hidden");

    updateWarnings();
    updateFullscreenStatus();

    console.log("Exam session restored.");

}
