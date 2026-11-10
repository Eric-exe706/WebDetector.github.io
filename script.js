let jumlahPeringatan = 0;

document.addEventListener("visibilitychange", function () {

    if (document.hidden) {

        jumlahPeringatan++;

        console.log("Pengguna meninggalkan halaman!");

    } else {

        alert("Peringatan! Kamu telah keluar dari halaman!");

        document.getElementById("status").innerText =
            "Kamu kembali ke halaman.";

        document.getElementById("counter").innerText =
            "Jumlah peringatan: " + jumlahPeringatan;
    }

});