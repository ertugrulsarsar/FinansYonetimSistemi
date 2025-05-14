import logging
from flask import Blueprint, jsonify, request, render_template
from app.models import Hesap, Islem
from app import db
from decimal import Decimal

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

