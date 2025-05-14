from app import db
from datetime import datetime

class Hesap(db.Model):
    __tablename__ = 'hesaplar'
    id = db.Column(db.Integer, primary_key=True)
    ad = db.Column(db.String(100, collation='Turkish_CI_AS'), nullable=False)
    bakiye = db.Column(db.Numeric(18, 2), nullable=False, default=0)
    tur = db.Column(db.String(50, collation='Turkish_CI_AS'), nullable=False)
    son_kullanim = db.Column(db.String(10, collation='Turkish_CI_AS'))
    aciklama = db.Column(db.String(255, collation='Turkish_CI_AS'))
    islemler = db.relationship('Islem', backref='hesap', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'ad': self.ad,
            'bakiye': float(self.bakiye),
            'tur': self.tur,
            'son_kullanim': self.son_kullanim,
            'aciklama': self.aciklama
        }

class Islem(db.Model):
    __tablename__ = 'islemler'
    id = db.Column(db.Integer, primary_key=True)
    hesap_id = db.Column(db.Integer, db.ForeignKey('hesaplar.id'), nullable=False)
    tur = db.Column(db.String(50, collation='Turkish_CI_AS'), nullable=False)  # gelir/gider/transfer
    miktar = db.Column(db.Numeric(18, 2), nullable=False)
    kategori = db.Column(db.String(100, collation='Turkish_CI_AS'), nullable=False)
    aciklama = db.Column(db.Text(collation='Turkish_CI_AS'))
    tarih = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'hesap_id': self.hesap_id,
            'tur': self.tur,
            'miktar': float(self.miktar),
            'kategori': self.kategori,
            'aciklama': self.aciklama,
            'tarih': self.tarih.strftime('%Y-%m-%d %H:%M:%S')
        } 