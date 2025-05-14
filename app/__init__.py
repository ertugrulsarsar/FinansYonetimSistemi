import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from dotenv import load_dotenv

load_dotenv()

db = SQLAlchemy()
migrate = Migrate()

def create_app():
    app = Flask(__name__,
                template_folder = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'templates')
                )
    app.config['SQLALCHEMY_DATABASE_URI'] = (
        f"mssql+pyodbc://{os.getenv('DB_SERVER')}/{os.getenv('DB_NAME')}?driver=ODBC+Driver+17+for+SQL+Server"
    )
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)
    migrate.init_app(app, db)

    from app.routes import main
    app.register_blueprint(main)

    return app 