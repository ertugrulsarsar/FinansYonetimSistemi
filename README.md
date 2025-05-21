# Finans Yönetim Sistemi

Modern ve kullanıcı dostu bir kişisel finans yönetim uygulaması. Flask backend ve Tailwind CSS frontend ile geliştirilmiş, MSSQL veritabanı desteği sunan dinamik bir web uygulaması.

## �� Özellikler

- 💰 Çoklu hesap yönetimi (Nakit, Kredi Kartı, Yatırım)
- 📊 Gelir-gider takibi ve kategorize edilmiş işlemler
- 🔄 Hesaplar arası transfer
- 📈 Aylık finansal raporlar ve grafikler
- 📱 Responsive tasarım
- �� Güvenli veri yönetimi

## 🛠️ Kurulum

1. **Bağımlılıkları Yükle**
```bash
pip install -r requirements.txt
```

2. **SQL Server Kurulumu**
- SQL Server Management Studio'yu yükleyin
- Yeni bir veritabanı oluşturun
- Aşağıdaki tabloları oluşturun:

```sql
-- Hesaplar Tablosu
CREATE TABLE hesaplar (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ad NVARCHAR(100) COLLATE Turkish_CI_AS NOT NULL,
    bakiye DECIMAL(18,2) NOT NULL DEFAULT 0,
    tur NVARCHAR(50) COLLATE Turkish_CI_AS NOT NULL,
    son_kullanim NVARCHAR(10) COLLATE Turkish_CI_AS NULL,
    aciklama NVARCHAR(255) COLLATE Turkish_CI_AS NULL
);

-- İşlemler Tablosu
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

3. **Veritabanı Ayarları**
`.env` dosyası oluşturun:
```env
SECRET_KEY=your_secret_key
DB_USER=db_username
DB_PASSWORD=db_password
DB_SERVER=server_address
DB_NAME=database_name
```

4. **Uygulamayı Başlat**
```bash
python run.py
```

## 💡 Kullanım

- **Hesap Yönetimi**: Sol üstteki "+" butonu ile yeni hesap ekleyin
- **İşlemler**: Hızlı işlemler menüsünden gelir/gider/transfer işlemlerini yapın
- **Raporlar**: Finansal durumunuzu raporlar bölümünden takip edin

## 🔧 Geliştirme

- SOLID prensiplerine uygun modüler yapı
- Temiz kod ve sürdürülebilir mimari
- Detaylı hata yönetimi ve loglama
- API-first yaklaşım

## 📝 Notlar

- SQL Server Management Studio'yu yüklemeden uygulama çalışmayacaktır
- Veritabanı ve tabloları manuel olarak oluşturmanız gerekmektedir
- Türkçe karakter desteği için COLLATE Turkish_CI_AS kullanılmıştır

---
Geliştirici: Ertuğrul Sarsar  
İletişim: ertugrulsarsar@gmail.com