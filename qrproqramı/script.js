let qr;
let html5Qr = null;
let cameraRunning = false;
let lastScanned = "";
let notificationTimeout;

/* ---------- QR yaratmaq ---------- */

function generateQR() {
    if (typeof QRCode === "undefined") {
        alert("QR kitabxanası yüklənmədi. İnterneti yoxla və səhifəni yenilə.");
        return;
    }

    const text = document.getElementById("qrText").value.trim();
    const qrContainer = document.getElementById("qrCode");
    const downloadBtn = document.getElementById("downloadBtn");

    if (text === "") {
        alert("Zəhmət olmasa link daxil et.");
        return;
    }

    if (!/^https?:\/\//i.test(text)) {
        alert("Link https:// ilə başlamalıdır. Məsələn: https://example.com");
        return;
    }

    qrContainer.innerHTML = "";

    qr = new QRCode(qrContainer, {
        text: text,
        width: 220,
        height: 220,
        correctLevel: QRCode.CorrectLevel.H
    });

    downloadBtn.style.display = "block";
}

document.getElementById("qrText").addEventListener("keydown", function (e) {
    if (e.key === "Enter") generateQR();
});

function downloadQR() {
    const canvas = document.querySelector("#qrCode canvas");

    if (!canvas) {
        alert("Əvvəlcə QR kod yarat.");
        return;
    }

    canvas.toBlob(function (blob) {
        if (!blob) return;

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "qr-code.png";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }, "image/png");
}

/* ---------- QR oxumaq ---------- */

function getScanner() {
    if (!html5Qr) {
        html5Qr = new Html5Qrcode("reader");
    }
    return html5Qr;
}

function setCameraButtons(running) {
    cameraRunning = running;
    document.getElementById("camStartBtn").style.display = running ? "none" : "block";
    document.getElementById("camStopBtn").style.display = running ? "block" : "none";
}

function startCamera() {
    if (typeof Html5Qrcode === "undefined") {
        alert("Skaner kitabxanası yüklənmədi. İnterneti yoxla və səhifəni yenilə.");
        return;
    }

    if (cameraRunning) return;

    const scanner = getScanner();
    const config = { fps: 10, qrbox: { width: 220, height: 220 } };

    scanner.start({ facingMode: "environment" }, config, onScanSuccess, function () {})
        .then(function () {
            setCameraButtons(true);
        })
        .catch(function () {
            scanner.start({ facingMode: "user" }, config, onScanSuccess, function () {})
                .then(function () {
                    setCameraButtons(true);
                })
                .catch(function (err) {
                    console.error(err);
                    alert("Kamera açılmadı. Kameraya icazə verdiyini, başqa tətbiqin kameranı işlətmədiyini və saytın https:// (və ya Live Server) ilə açıldığını yoxla.");
                });
        });
}

function stopCamera() {
    if (!html5Qr || !cameraRunning) return Promise.resolve();

    return html5Qr.stop()
        .then(function () {
            html5Qr.clear();
            setCameraButtons(false);
        })
        .catch(function (err) {
            console.error(err);
            setCameraButtons(false);
        });
}

function chooseFile() {
    document.getElementById("fileInput").click();
}

document.getElementById("fileInput").addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;

    if (typeof Html5Qrcode === "undefined") {
        alert("Skaner kitabxanası yüklənmədi. İnterneti yoxla və səhifəni yenilə.");
        return;
    }

    stopCamera().then(function () {
        getScanner().scanFile(file, false)
            .then(function (text) {
                onScanSuccess(text);
            })
            .catch(function () {
                alert("Şəkildə QR kod tapılmadı.");
            });
    });

    e.target.value = "";
});

function onScanSuccess(decodedText) {
    document.getElementById("scanResult").value = decodedText;
    document.getElementById("copyBtn").style.display = "block";

    const openBtn = document.getElementById("openBtn");

    if (/^https?:\/\//i.test(decodedText)) {
        openBtn.style.display = "block";
    } else {
        openBtn.style.display = "none";
    }

    if (decodedText !== lastScanned) {
        lastScanned = decodedText;
        showFoundMessage();
        scrollToOpenBtn();

        setTimeout(function () { lastScanned = ""; }, 6000);
    }
}

function showFoundMessage() {
    let box = document.getElementById("foundMessage");

    if (!box) {
        box = document.createElement("div");
        box.id = "foundMessage";
        box.innerHTML =
            '<div class="found-text">✅ Kod oxundu</div>' +
            '<div class="found-arrow">⬇</div>';
        document.body.appendChild(box);
    }

    requestAnimationFrame(function () {
        box.classList.add("show");
    });

    clearTimeout(notificationTimeout);
    notificationTimeout = setTimeout(function () {
        box.classList.remove("show");
    }, 5000);
}

function scrollToOpenBtn() {
    const openBtn = document.getElementById("openBtn");
    const target = openBtn.style.display === "block"
        ? openBtn
        : document.getElementById("scanResult");

    setTimeout(function () {
        const rect = target.getBoundingClientRect();
        const targetY = window.pageYOffset + rect.top - (window.innerHeight / 2) + (rect.height / 2);

        window.scrollTo({
            top: Math.max(0, targetY),
            behavior: "smooth"
        });
    }, 500);
}

function copyResult() {
    const result = document.getElementById("scanResult").value;

    navigator.clipboard.writeText(result)
        .then(function () { alert("Nəticə kopyalandı!"); })
        .catch(function () { alert("Kopyalama mümkün olmadı."); });
}

function openResult() {
    const result = document.getElementById("scanResult").value;

    if (/^https?:\/\//i.test(result)) {
        window.open(result, "_blank", "noopener,noreferrer");
    }
}