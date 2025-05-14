// Hesaplar ve işlemler dinamik olarak yüklenecek
async function loadHesaplar() {
    const res = await fetch('/api/hesaplar');
    const hesaplar = await res.json();
    console.log('Hesaplar', hesaplar);
    const container = document.getElementById('hesaplarListesi');
    let toplam = 0;
    container.innerHTML = hesaplar.map(h => {
        toplam += h.bakiye;
        return `<div class="rounded-xl p-4 shadow flex flex-col bg-gradient-to-r ${h.tur === 'Nakit' ? 'from-purple-400 to-pink-400' : h.tur === 'Banka Kartı' ? 'from-blue-400 to-cyan-400' : 'from-red-400 to-orange-400'} text-white">
            <div class="flex justify-between items-center">
                <span class="font-bold text-lg">${h.ad}</span>
                <span class="text-xs">${h.son_kullanim ? 'Son kullanım: ' + h.son_kullanim : ''}</span>
            </div>
            <div class="text-2xl font-bold mt-2">₺${h.bakiye.toLocaleString('tr-TR', {minimumFractionDigits:2})}</div>
            <div class="text-xs mt-1">${h.aciklama || ''}</div>
        </div>`;
    }).join('');
    document.getElementById('bakiye').innerText = `₺${toplam.toLocaleString('tr-TR', {minimumFractionDigits:2})}`;
}

async function loadIslemler(filtre = 'tum') {
    const res = await fetch('/api/islemler');
    let islemler = await res.json();
    console.log('Islemler', islemler);
    if (filtre !== 'tum') {
        islemler = islemler.filter(i => i.tur === filtre);
    }
    const container = document.getElementById('islemListesi');
    container.innerHTML = islemler.slice(0, 7).map(i => {
        let renk = i.tur === 'gelir' ? 'text-green-600' : i.tur === 'gider' ? 'text-red-600' : 'text-blue-600';
        let isaret = i.tur === 'gelir' ? '+' : i.tur === 'gider' ? '-' : '';
        return `<div class="flex items-center justify-between border-b pb-1">
            <div class="flex items-center">
                <span class="text-2xl mr-2 ${renk}">${i.tur === 'gelir' ? '＋' : i.tur === 'gider' ? '－' : '⇄'}</span>
                <div>
                    <div class="font-semibold">${i.kategori}</div>
                    <div class="text-xs text-gray-400">${i.aciklama || ''}</div>
                    <div class="text-xs text-gray-400">${new Date(i.tarih).toLocaleDateString('tr-TR')}</div>
                </div>
            </div>
            <div class="font-bold ${renk}">${isaret}${i.miktar.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</div>
        </div>`;
    }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    loadHesaplar();
    loadIslemler();
    document.getElementById('islemFiltre').addEventListener('change', e => loadIslemler(e.target.value));
});

// Modal aç/kapat fonksiyonları
function modalAc(icerikHtml) {
    document.getElementById('modalIcerik').innerHTML = icerikHtml;
    document.getElementById('modal').classList.remove('hidden');
}
function modalKapat() {
    document.getElementById('modal').classList.add('hidden');
}
document.getElementById('modalKapat').onclick = modalKapat;

// Hesap Ekle butonu
document.getElementById('hesapEkleBtn').onclick = function() {
    modalAc(`
        <h2 class="text-xl font-bold mb-4">Hesap Ekle</h2>
        <form id="hesapEkleForm" class="space-y-3">
            <input name="ad" class="w-full border rounded p-2" placeholder="Hesap Adı" required>
            <input name="bakiye" type="number" class="w-full border rounded p-2" placeholder="Başlangıç Bakiyesi" required>
            <input name="tur" class="w-full border rounded p-2" placeholder="Tür (Nakit, Banka Kartı...)" required>
            <input name="son_kullanim" class="w-full border rounded p-2" placeholder="Son Kullanım (opsiyonel)">
            <input name="aciklama" class="w-full border rounded p-2" placeholder="Açıklama (opsiyonel)">
            <button type="submit" class="w-full bg-blue-600 text-white rounded py-2 font-bold">Kaydet</button>
        </form>
    `);
    document.getElementById('hesapEkleForm').onsubmit = async function(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        data.bakiye = parseFloat(data.bakiye);
        const res = await fetch('/api/hesaplar', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        if (res.ok) {
            modalKapat();
            loadHesaplar();
        } else {
            const hata = await res.json();
            alert('Hata: ' + (hata.error || 'Bilinmeyen hata'));
        }
    }
};
// Gelir Ekle butonu
// Hesap seçimi ve kategori ile gelir ekleme

document.getElementById('gelirEkleBtn').onclick = async function() {
    // Hesapları çek
    const hesapRes = await fetch('/api/hesaplar');
    const hesaplar = await hesapRes.json();
    const hesapSecOptions = hesaplar.map(h => `<option value="${h.id}">${h.ad}</option>`).join('');
    modalAc(`
        <h2 class="text-xl font-bold mb-4">Gelir Ekle</h2>
        <form id="gelirEkleForm" class="space-y-3">
            <select name="hesap_id" class="w-full border rounded p-2" required>
                <option value="">Hesap Seç</option>
                ${hesapSecOptions}
            </select>
            <input name="miktar" type="number" class="w-full border rounded p-2" placeholder="Miktar" required>
            <input name="kategori" class="w-full border rounded p-2" placeholder="Kategori (Maaş, Faiz, Kira...)" required>
            <input name="aciklama" class="w-full border rounded p-2" placeholder="Açıklama (opsiyonel)">
            <button type="submit" class="w-full bg-green-600 text-white rounded py-2 font-bold">Kaydet</button>
        </form>
    `);
    document.getElementById('gelirEkleForm').onsubmit = async function(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        data.tur = 'gelir';
        data.miktar = parseFloat(data.miktar);
        const res = await fetch('/api/islemler', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        if (res.ok) {
            modalKapat();
            loadIslemler();
            loadHesaplar();
        } else {
            const hata = await res.json();
            alert('Hata: ' + (hata.error || 'Bilinmeyen hata'));
        }
    }
};

// Gider Ekle butonu
// Gider eklerken hesap seçimi ve kategori de alınmalı
// Hesaplar dinamik olarak yüklenecek

document.getElementById('giderEkleBtn').onclick = async function() {
    // Hesapları çek
    const hesapRes = await fetch('/api/hesaplar');
    const hesaplar = await hesapRes.json();
    const hesapSecOptions = hesaplar.map(h => `<option value="${h.id}">${h.ad}</option>`).join('');
    modalAc(`
        <h2 class="text-xl font-bold mb-4">Gider Ekle</h2>
        <form id="giderEkleForm" class="space-y-3">
            <select name="hesap_id" class="w-full border rounded p-2" required>
                <option value="">Hesap Seç</option>
                ${hesapSecOptions}
            </select>
            <input name="miktar" type="number" class="w-full border rounded p-2" placeholder="Miktar" required>
            <input name="kategori" class="w-full border rounded p-2" placeholder="Kategori (Market, Fatura...)" required>
            <input name="aciklama" class="w-full border rounded p-2" placeholder="Açıklama (opsiyonel)">
            <button type="submit" class="w-full bg-red-600 text-white rounded py-2 font-bold">Kaydet</button>
        </form>
    `);
    document.getElementById('giderEkleForm').onsubmit = async function(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        data.tur = 'gider';
        data.miktar = parseFloat(data.miktar);
        const res = await fetch('/api/islemler', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        if (res.ok) {
            modalKapat();
            loadIslemler();
            loadHesaplar();
        } else {
            const hata = await res.json();
            alert('Hata: ' + (hata.error || 'Bilinmeyen hata'));
        }
    }
};

// Transfer butonu
// İki hesap arasında transfer için

document.getElementById('transferBtn').onclick = async function() {
    const hesapRes = await fetch('/api/hesaplar');
    const hesaplar = await hesapRes.json();
    const hesapSecOptions = hesaplar.map(h => `<option value="${h.id}">${h.ad}</option>`).join('');
    modalAc(`
        <h2 class="text-xl font-bold mb-4">Hesaplar Arası Transfer</h2>
        <form id="transferForm" class="space-y-3">
            <select name="kaynak_hesap" class="w-full border rounded p-2" required>
                <option value="">Kaynak Hesap</option>
                ${hesapSecOptions}
            </select>
            <select name="hedef_hesap" class="w-full border rounded p-2" required>
                <option value="">Hedef Hesap</option>
                ${hesapSecOptions}
            </select>
            <input name="miktar" type="number" class="w-full border rounded p-2" placeholder="Miktar" required>
            <input name="aciklama" class="w-full border rounded p-2" placeholder="Açıklama (opsiyonel)">
            <button type="submit" class="w-full bg-blue-600 text-white rounded py-2 font-bold">Transfer Yap</button>
        </form>
    `);
    document.getElementById('transferForm').onsubmit = async function(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        data.tur = 'transfer';
        data.miktar = parseFloat(data.miktar);
        // Burada transfer işlemi için özel bir API endpointi gerekebilir!
        // Şimdilik sadece uyarı verelim:
        alert('Transfer işlemi için backendde özel bir endpoint eklenmeli!');
        modalKapat();
    }
};

// Rapor butonu

document.getElementById('raporBtn').onclick = function() {
    modalAc(`
        <h2 class="text-xl font-bold mb-4">Rapor</h2>
        <div class="text-gray-600">Raporlama özelliği yakında eklenecek!</div>
    `);
};
