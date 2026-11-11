
let qr;
let scanner;

function generateQR() {
    const text = document.getElementById("qrText").value.trim();
    const qrContainer = document.getElementById("qrCode");
    const downloadBtn = document.getElementById("downloadBtn");

    if (text === "") {
        alert("Zəhmət olmasa mətn və ya link daxil et.");
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

function downloadQR() {
    const canvas = document.querySelector("#qrCode canvas");

    if (!canvas) {
        alert("Əvvəlcə QR kod yarat.");
        return;
    }

    canvas.toBlob(function(blob) {
        if (!blob) return;

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "qr-code.png";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
}

// QR Scanner

function startQRScanner() {
    if (scanner) return;

    scanner = new Html5QrcodeScanner(
        "reader",
        {
            fps: 10,
            qrbox: { width: 220, height: 220 }
        },
        false
    );

    scanner.render(onScanSuccess);
}

function onScanSuccess(decodedText) {
    document.getElementById("scanResult").value = decodedText;

    document.getElementById("copyBtn").style.display = "block";

    if (/^https?:\/\//i.test(decodedText)) {
        document.getElementById("openBtn").style.display = "block";
    } else {
        document.getElementById("openBtn").style.display = "none";
    }
}

function copyResult() {
    const result = document.getElementById("scanResult").value;

    navigator.clipboard.writeText(result)
        .then(() => alert("Nəticə kopyalandı!"))
        .catch(() => alert("Kopyalama mümkün olmadı."));
}

function openResult() {
    const result = document.getElementById("scanResult").value;

    if (/^https?:\/\//i.test(result)) {
        window.open(result, "_blank", "noopener,noreferrer");
    }
}

startQRScanner();
