import logging
from flask import Blueprint, jsonify, request, render_template
from app.models import Hesap, Islem
from app import db
from decimal import Decimal
from datetime import datetime, timedelta
from sqlalchemy import extract, func, text
import traceback

# Logging ayarları
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)

main = Blueprint('main', __name__)

@main.route('/')
def index():
    return render_template('index.html')

# Hesaplar API
@main.route('/api/hesaplar', methods=['GET'])
def get_hesaplar():
    hesaplar = Hesap.query.all()
    return jsonify([h.to_dict() for h in hesaplar])

@main.route('/api/hesaplar', methods=['POST'])
def create_hesap():
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'JSON body boş veya hatalı!'}), 400
        yeni_hesap = Hesap(
            ad=data.get('ad'),
            bakiye=data.get('bakiye', 0),
            tur=data.get('tur'),
            son_kullanim=data.get('son_kullanim'),
            aciklama=data.get('aciklama', '')
        )
        db.session.add(yeni_hesap)
        db.session.commit()
        return jsonify(yeni_hesap.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        logger.error('Hesap ekleme hatası: %s', str(e))
        return jsonify({'error': 'Hesap eklenemedi.'}), 400

# İşlemler API
@main.route('/api/islemler', methods=['GET'])
def get_islemler():
    islemler = Islem.query.order_by(Islem.tarih.desc()).all()
    return jsonify([i.to_dict() for i in islemler])

@main.route('/api/islemler', methods=['POST'])
def create_islem():
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'JSON body boş veya hatalı!'}), 400
        yeni_islem = Islem(
            hesap_id=data['hesap_id'],
            tur=data['tur'],
            miktar=data['miktar'],
            kategori=data['kategori'],
            aciklama=data.get('aciklama', '')
        )
        db.session.add(yeni_islem)
        # Hesap bakiyesini güncelle
        hesap = Hesap.query.get(data['hesap_id'])
        if not hesap:
            db.session.rollback()
            return jsonify({'error': 'Hesap bulunamadı!'}), 400
        miktar_decimal = Decimal(str(data['miktar']))
        if data['tur'] == 'gelir':
            hesap.bakiye += miktar_decimal
        elif data['tur'] == 'gider':
            hesap.bakiye -= miktar_decimal
        db.session.commit()
        return jsonify(yeni_islem.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        logger.error('İşlem ekleme hatası: %s', str(e))
        return jsonify({'error': 'İşlem eklenemedi.'}), 400

@main.route('/api/islemler/<int:id>', methods=['DELETE'])
def delete_islem(id):
    try:
        islem = Islem.query.get_or_404(id)
        hesap = Hesap.query.get(islem.hesap_id)
        # Silinen işleme göre bakiyeyi düzelt
        if islem.tur == 'gelir':
            hesap.bakiye -= Decimal(str(islem.miktar))
        elif islem.tur == 'gider':
            hesap.bakiye += Decimal(str(islem.miktar))
        db.session.delete(islem)
        db.session.commit()
        return '', 204
    except Exception as e:
        db.session.rollback()
        logger.error('İşlem silme hatası: %s', str(e))
        return jsonify({'error': 'İşlem silinemedi.'}), 400

@main.route('/api/aylik-ozet', methods=['GET'])
def aylik_ozet():
    try:
        yil = int(request.args.get('yil', datetime.now().year))
        ay = int(request.args.get('ay', datetime.now().month))
        sql = text("""
        SELECT DATEPART(week, tarih) as hafta, tur, SUM(miktar) as toplam
        FROM islemler
        WHERE YEAR(tarih) = :yil AND MONTH(tarih) = :ay
        GROUP BY DATEPART(week, tarih), tur
        """)
        result = db.session.execute(sql, {'yil': yil, 'ay': ay}).fetchall()
        ozet = {}
        for row in result:
            hafta, tur, toplam = row
            hafta = int(hafta)
            if hafta not in ozet:
                ozet[hafta] = {'gelir': 0, 'gider': 0}
            ozet[hafta][tur] = float(toplam)
        haftalar = sorted(ozet.keys())
        gelirler = [ozet.get(h, {}).get('gelir', 0) for h in haftalar]
        giderler = [ozet.get(h, {}).get('gider', 0) for h in haftalar]
        return jsonify({'haftalar': haftalar, 'gelirler': gelirler, 'giderler': giderler})
    except Exception as e:
        with open("aylik_ozet_debug.txt", "a", encoding="utf-8") as f:
            f.write(f"EXCEPTION: {str(e)}\n")
            f.write(traceback.format_exc())
        return jsonify({'error': 'Aylık özet alınamadı.'}), 400

@main.route('/api/test', methods=['GET'])
def test():
    print('TEST ENDPOINT ÇALIŞTI')
    with open("aylik_ozet_debug.txt", "a", encoding="utf-8") as f:
        f.write("TEST ENDPOINT ÇALIŞTI\n")
    return jsonify({'msg': 'test ok'})

@main.route('/api/rapor', methods=['GET'])
def get_rapor():
    try:
        # Aylık toplam gelir ve gider
        ay_basi = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        ay_sonu = (ay_basi + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        
        toplam_gelir = db.session.query(func.sum(Islem.miktar))\
            .filter(Islem.tur == 'gelir')\
            .filter(Islem.tarih >= ay_basi)\
            .filter(Islem.tarih <= ay_sonu)\
            .scalar() or 0
            
        toplam_gider = db.session.query(func.sum(Islem.miktar))\
            .filter(Islem.tur == 'gider')\
            .filter(Islem.tarih >= ay_basi)\
            .filter(Islem.tarih <= ay_sonu)\
            .scalar() or 0
            
        # Kategori bazlı giderler
        kategori_giderleri = db.session.query(
            Islem.kategori,
            func.sum(Islem.miktar).label('toplam')
        ).filter(
            Islem.tur == 'gider',
            Islem.tarih >= ay_basi,
            Islem.tarih <= ay_sonu
        ).group_by(Islem.kategori).all()
        
        # Hesap bakiyeleri
        hesaplar = Hesap.query.all()
        
        return jsonify({
            'toplamGelir': float(toplam_gelir),
            'toplamGider': float(toplam_gider),
            'kategoriGiderleri': [
                {'kategori': k.kategori, 'toplam': float(k.toplam)}
                for k in kategori_giderleri
            ],
            'hesapBakiyeleri': [
                {'ad': h.ad, 'bakiye': float(h.bakiye)}
                for h in hesaplar
            ]
        })
    except Exception as e:
        logger.error('Rapor oluşturma hatası: %s', str(e))
        return jsonify({'error': 'Rapor oluşturulamadı.'}), 400
    
    
@main.route('/api/transfer', methods=['POST'])
def transfer_yap():
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'JSON body boş veya hatalı!'}), 400
            
        kaynak_hesap = Hesap.query.get(data['kaynak_hesap'])
        hedef_hesap = Hesap.query.get(data['hedef_hesap'])
        
        if not kaynak_hesap or not hedef_hesap:
            return jsonify({'error': 'Hesap bulunamadı!'}), 400
            
        miktar = Decimal(str(data['miktar']))
        
        # Kaynak hesaptan para çıkışı
        kaynak_hesap.bakiye -= miktar
        
        # Hedef hesaba para girişi
        hedef_hesap.bakiye += miktar
        
        # Transfer işlemini kaydet
        transfer = Islem(
            hesap_id=kaynak_hesap.id,
            tur='transfer',
            miktar=miktar,
            kategori='Transfer',
            aciklama=f"{hedef_hesap.ad} hesabına transfer: {data.get('aciklama', '')}"
        )
        
        # Hedef hesap için de işlem kaydı
        hedef_transfer = Islem(
            hesap_id=hedef_hesap.id,
            tur='transfer',
            miktar=miktar,
            kategori='Transfer',
            aciklama=f"{kaynak_hesap.ad} hesabından transfer: {data.get('aciklama', '')}"
        )
        
        db.session.add(transfer)
        db.session.add(hedef_transfer)
        db.session.commit()
        
        return jsonify({
            'message': 'Transfer başarılı',
            'kaynak_hesap': kaynak_hesap.to_dict(),
            'hedef_hesap': hedef_hesap.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error('Transfer hatası: %s', str(e))
        return jsonify({'error': 'Transfer işlemi başarısız oldu.'}), 400