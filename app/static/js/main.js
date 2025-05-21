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

// Aylık özet grafiği
let aylikOzetChart = null;

// Ay seçme butonunu doldur ve değişiklikte grafiği güncelle
function fillAySec() {
    const aylar = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    const now = new Date();
    const aySec = document.getElementById('aySec');
    aySec.innerHTML = aylar.map((ad, i) =>
        `<option value="${i+1}" ${i === now.getMonth() ? 'selected' : ''}>${ad} ${now.getFullYear()}</option>`
    ).join('');
    aySec.onchange = () => loadAylikOzet(parseInt(aySec.value));
}

async function loadAylikOzet(ay = null) {
    const now = new Date();
    const yil = now.getFullYear();
    if (!ay) ay = now.getMonth() + 1;
    try {
        const res = await fetch(`/api/aylik-ozet?yil=${yil}&ay=${ay}`);
        const data = await res.json();
        console.log('Aylık özet API verisi:', data);
        if (!data || data.error || !data.haftalar || !data.gelirler || !data.giderler) {
            document.getElementById('aylikOzet').innerHTML = data.error ? data.error : 'Veri yok';
            return;
        }
        const ctx = document.getElementById('aylikOzetChart').getContext('2d');
        if (aylikOzetChart) aylikOzetChart.destroy();
        aylikOzetChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.haftalar.map(h => `${h}. Hafta`),
                datasets: [
                    {
                        label: 'Gelir',
                        data: data.gelirler,
                        backgroundColor: 'rgba(34,197,94,0.6)',
                        borderColor: 'rgba(34,197,94,1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Gider',
                        data: data.giderler,
                        backgroundColor: 'rgba(239,68,68,0.6)',
                        borderColor: 'rgba(239,68,68,1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' },
                    title: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    } catch (e) {
        console.error('Aylık özet hata:', e);
        document.getElementById('aylikOzet').innerHTML = 'Veri yok';
    }
}

// Modal aç/kapat fonksiyonları
function modalAc(icerikHtml) {
    document.getElementById('modalIcerik').innerHTML = icerikHtml;
    document.getElementById('modal').classList.remove('hidden');
}

function modalKapat() {
    document.getElementById('modal').classList.add('hidden');
}

// Tüm event listener'ları tek bir yerde toplayalım
document.addEventListener('DOMContentLoaded', () => {
    // Mevcut fonksiyonlar
    loadHesaplar();
    loadIslemler();
    fillAySec();
    loadAylikOzet();
    
    // Filtre event listener'ı
    const islemFiltre = document.getElementById('islemFiltre');
    if (islemFiltre) {
        islemFiltre.addEventListener('change', e => loadIslemler(e.target.value));
    }

    // Modal kapatma butonu
    const modalKapatBtn = document.getElementById('modalKapat');
    if (modalKapatBtn) {
        modalKapatBtn.onclick = modalKapat;
    }

    // Hesap Ekle butonu
    const hesapEkleBtn = document.getElementById('hesapEkleBtn');
    if (hesapEkleBtn) {
        hesapEkleBtn.onclick = function() {
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
    }

    // Gelir Ekle butonu
    const gelirEkleBtn = document.getElementById('gelirEkleBtn');
    if (gelirEkleBtn) {
        gelirEkleBtn.onclick = async function() {
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
    }

    // Gider Ekle butonu
    const giderEkleBtn = document.getElementById('giderEkleBtn');
    if (giderEkleBtn) {
        giderEkleBtn.onclick = async function() {
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
    }

// Transfer butonu
const transferBtn = document.getElementById('transferBtn');
if (transferBtn) {
    transferBtn.onclick = async function() {
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
            
            // Aynı hesap seçilmişse uyarı ver
            if (data.kaynak_hesap === data.hedef_hesap) {
                alert('Kaynak ve hedef hesap aynı olamaz!');
                return;
            }
            
            data.miktar = parseFloat(data.miktar);
            
            try {
                const res = await fetch('/api/transfer', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(data)
                });
                
                if (res.ok) {
                    modalKapat();
                    loadHesaplar(); // Hesapları güncelle
                    loadIslemler(); // İşlemleri güncelle
                } else {
                    const hata = await res.json();
                    alert('Hata: ' + (hata.error || 'Bilinmeyen hata'));
                }
            } catch (error) {
                console.error('Transfer hatası:', error);
                alert('Transfer işlemi sırasında bir hata oluştu.');
            }
        };
    };
}

    // Rapor butonu
    const raporBtn = document.getElementById('raporBtn');
    if (raporBtn) {
        raporBtn.onclick = async function() {
            const res = await fetch('/api/rapor');
            const raporData = await res.json();
            
            modalAc(`
                <h2 class="text-xl font-bold mb-4">Finansal Rapor</h2>
                <div class="space-y-4">
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h3 class="font-semibold mb-2">Aylık Özet</h3>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <div class="text-sm text-gray-600">Toplam Gelir</div>
                                <div class="text-lg font-bold text-green-600">₺${raporData.toplamGelir.toLocaleString('tr-TR', {minimumFractionDigits:2})}</div>
                            </div>
                            <div>
                                <div class="text-sm text-gray-600">Toplam Gider</div>
                                <div class="text-lg font-bold text-red-600">₺${raporData.toplamGider.toLocaleString('tr-TR', {minimumFractionDigits:2})}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h3 class="font-semibold mb-2">Kategori Bazlı Giderler</h3>
                        <div class="space-y-2">
                            ${raporData.kategoriGiderleri.map(k => `
                                <div class="flex justify-between items-center">
                                    <span class="text-sm">${k.kategori}</span>
                                    <span class="font-semibold text-red-600">₺${k.toplam.toLocaleString('tr-TR', {minimumFractionDigits:2})}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h3 class="font-semibold mb-2">Hesap Bakiyeleri</h3>
                        <div class="space-y-2">
                            ${raporData.hesapBakiyeleri.map(h => `
                                <div class="flex justify-between items-center">
                                    <span class="text-sm">${h.ad}</span>
                                    <span class="font-semibold">₺${h.bakiye.toLocaleString('tr-TR', {minimumFractionDigits:2})}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `);
        };
    }
});