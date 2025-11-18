from . import db
from datetime import datetime

class Category(db.Model):
    __tablename__ = 'categories'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), nullable=False)
    position = db.Column(db.Integer, default=0)

class MenuItem(db.Model):
    __tablename__ = 'menu_items'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), nullable=False)
    description = db.Column(db.String(512))
    price_cents = db.Column(db.Integer, nullable=False)
    available = db.Column(db.Boolean, default=True)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Order(db.Model):
    __tablename__ = 'orders'
    id = db.Column(db.Integer, primary_key=True)
    customer_name = db.Column(db.String(128))
    customer_email = db.Column(db.String(128))
    customer_phone = db.Column(db.String(64))
    total_cents = db.Column(db.Integer)
    status = db.Column(db.String(64), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class OrderItem(db.Model):
    __tablename__ = 'order_items'
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'))
    menu_item_id = db.Column(db.Integer, db.ForeignKey('menu_items.id'))
    qty = db.Column(db.Integer, default=1)
    unit_price_cents = db.Column(db.Integer)
