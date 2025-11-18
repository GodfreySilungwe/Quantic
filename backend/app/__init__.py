import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from dotenv import load_dotenv

load_dotenv()

db = SQLAlchemy()
migrate = Migrate()


def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://cafefausse:cafefaussepass@localhost:5432/cafefausse_dev')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JSON_SORT_KEYS'] = False

    db.init_app(app)
    migrate.init_app(app, db)

    # register blueprints
    from .api import api_bp
    app.register_blueprint(api_bp, url_prefix='/api')

    return app
