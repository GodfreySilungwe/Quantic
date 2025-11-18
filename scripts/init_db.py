"""
scripts/init_db.py

Create database tables and seed sample categories and menu items for local development.

Usage:
  python scripts/init_db.py

This imports the Flask app factory from the backend package and runs create_all().
"""
import sys
from sqlalchemy.exc import OperationalError
from backend.app import create_app, db
from backend.app.models import Category, MenuItem


def seed(app):
    with app.app_context():
        print('Creating database tables...')
        try:
            db.create_all()
        except OperationalError as oe:
            print('Postgres connection failed:', oe)
            print('Falling back to a local SQLite database (dev.db) for quick local testing.')
            # Create a fresh Flask app configured for sqlite to avoid re-initializing the same app instance
            from flask import Flask

            temp_app = Flask(__name__)
            temp_app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///dev.db'
            temp_app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
            db.init_app(temp_app)
            with temp_app.app_context():
                db.create_all()
                # seed will continue in the outer function but DB objects are available via shared metadata
                print('SQLite dev.db created.')
            # Rebind app variable to the sqlite-backed app context for the remainder of seeding
            app = temp_app

        # If categories already exist, skip seeding
        if Category.query.first():
            print('Database already seeded — skipping.')
            return

        print('Seeding database with sample data...')
        coffee = Category(name='Coffee', position=1)
        pastries = Category(name='Pastries', position=2)
        db.session.add_all([coffee, pastries])
        db.session.flush()

        items = [
            MenuItem(name='Espresso', description='Rich single shot', price_cents=250, available=True, category_id=coffee.id),
            MenuItem(name='Cappuccino', description='Espresso with steamed milk', price_cents=350, available=True, category_id=coffee.id),
            MenuItem(name='Blueberry Muffin', description='Baked fresh daily', price_cents=300, available=True, category_id=pastries.id),
            MenuItem(name='Almond Croissant', description='Buttery and flaky', price_cents=420, available=True, category_id=pastries.id),
        ]
        db.session.add_all(items)
        db.session.commit()
        print('Seeding complete.')


if __name__ == '__main__':
    app = create_app()
    try:
        seed(app)
    except Exception as e:
        print('Error during init/seed:', e)
        sys.exit(1)
