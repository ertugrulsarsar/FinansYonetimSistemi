# Finans Yönetim Sistemi

Modern ve kullanıcı dostu bir kişisel finans yönetim uygulaması. Flask backend ve Tailwind CSS frontend ile geliştirilmiş, MSSQL veritabanı desteği sunan dinamik bir web uygulaması.

## 🚀 Özellikler

- 💰 Çoklu hesap yönetimi (Nakit, Kredi Kartı, Yatırım)
- 📊 Gelir-gider takibi ve kategorize edilmiş işlemler
- 🔄 Hesaplar arası transfer
- 📈 Aylık finansal raporlar ve grafikler
- 📱 Responsive tasarım
- 🔒 Güvenli veri yönetimi

## 🛠️ Kurulum

1. **Bağımlılıkları Yükle**
```bash
pip install -r requirements.txt
```

2. **Veritabanı Ayarları**
`.env` dosyası oluşturun:
```env
SECRET_KEY=your_secret_key
DB_USER=db_username
DB_PASSWORD=db_password
DB_SERVER=server_address
DB_NAME=database_name
```

3. **Veritabanını Oluştur**
```bash
flask db init
flask db migrate -m "initial setup"
flask db upgrade
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

---
Geliştirici: Ertuğrul Sarsar
İletişim: ertugrulsarsar@gmail.com