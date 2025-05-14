# Para Takip Cüzdanı

Bu uygulama, kişisel finans hareketlerinizi kolayca takip edebilmeniz için geliştirilmiş modern ve dinamik bir cüzdan uygulamasıdır. Backend Flask (MSSQL desteğiyle), frontend ise Tailwind CSS ve vanilla JS ile hazırlanmıştır.

## Özellikler
- Hesap ekleme (Nakit, Banka Kartı, Yatırım vb.)
- Gelir, gider ve transfer işlemleri
- Hesap bakiyelerinin otomatik güncellenmesi
- Son işlemler ve aylık özet
- Responsive (mobil/tablet/masaüstü uyumlu) modern arayüz
- Hata yönetimi ve güvenli logging

## Kurulum

### 1. Gerekli Paketler
Öncelikle bağımlılıkları yükleyin:
```bash
pip install -r requirements.txt
```

### 2. .env Dosyası
Ana dizine bir `.env` dosyası oluşturun ve MSSQL bağlantı bilgilerinizi girin:
```
SECRET_KEY=senin_gizli_anahtarın
DB_USER=kullanici_adi
DB_PASSWORD=sifre
DB_SERVER=server_adresi
DB_NAME=veritabani_adi
```

### 3. Veritabanı Kurulumu
MSSQL'de aşağıdaki tabloları oluşturun:
```sql
CREATE TABLE hesaplar (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ad NVARCHAR(100) COLLATE Turkish_CI_AS NOT NULL,
    bakiye DECIMAL(18,2) NOT NULL DEFAULT 0,
    tur NVARCHAR(50) COLLATE Turkish_CI_AS NOT NULL,
    son_kullanim NVARCHAR(10) COLLATE Turkish_CI_AS NULL,
    aciklama NVARCHAR(255) COLLATE Turkish_CI_AS NULL
);

CREATE TABLE islemler (
    id INT IDENTITY(1,1) PRIMARY KEY,
    hesap_id INT NOT NULL,
    tur NVARCHAR(50) COLLATE Turkish_CI_AS NOT NULL,
    miktar DECIMAL(18,2) NOT NULL,
    kategori NVARCHAR(100) COLLATE Turkish_CI_AS NOT NULL,
    aciklama NTEXT COLLATE Turkish_CI_AS NULL,
    tarih DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (hesap_id) REFERENCES hesaplar(id) ON DELETE CASCADE
);
```
Alternatif olarak Flask migrate komutlarını kullanabilirsiniz:
```bash
flask db init
flask db migrate -m "ilk kurulum"
flask db upgrade
```

### 4. Uygulamayı Başlatma
```bash
python run.py
```
veya
```bash
flask run
```

Tarayıcıdan [http://localhost:5000](http://localhost:5000) adresine giderek uygulamayı kullanmaya başlayabilirsiniz.

## Kullanım
- Hesap eklemek için sol üstteki "+ Hesap Ekle" butonunu kullanın.
- Gelir, gider ve transfer işlemleri için "Hızlı İşlemler" bölümündeki butonları kullanın.
- Son işlemler ve aylık özet ana ekranda otomatik olarak güncellenir.

## Güvenlik ve Loglama
- Tüm hata yönetimi profesyonel logging ile yapılır, kullanıcı verisi loglanmaz.
- Geliştirme dışında konsola veri basılmaz.

## Katkı ve Geliştirme
- Kodlar SOLID prensiplerine uygun, modüler ve genişletilebilir şekilde yazılmıştır.
- Yeni özellikler eklemek için `app/models.py`, `app/routes.py` ve `app/static/js/main.js` dosyalarını inceleyebilirsiniz.

---
Her türlü öneri, katkı ve hata bildirimi için iletişime geçebilirsiniz. 