"""Create missing tables (dev helper).
Run from repo backend folder after activating venv:

powershell:
& ".\.venv\Scripts\Activate.ps1"
$env:FLASK_APP="app.py"
python scripts/create_tables.py
"""
from app import create_app, db
from app import models

app = create_app()
with app.app_context():
    print('Creating database tables (if not exist)...')
    db.create_all()
    print('Done')

