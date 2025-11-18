from flask import Blueprint, jsonify, request
from . import db
from .models import MenuItem, Category, Order, OrderItem

api_bp = Blueprint('api', __name__)

@api_bp.route('/menu', methods=['GET'])
def list_menu():
    categories = Category.query.order_by(Category.position).all()
    result = []
    for c in categories:
        items = MenuItem.query.filter_by(category_id=c.id).all()
        result.append({
            'id': c.id,
            'name': c.name,
            'items': [
                {'id': i.id, 'name': i.name, 'description': i.description, 'price_cents': i.price_cents, 'available': i.available}
                for i in items
            ]
        })
    return jsonify(result)

@api_bp.route('/cart/checkout', methods=['POST'])
def checkout():
    data = request.get_json() or {}
    items = data.get('items', [])
    name = data.get('customer_name')
    email = data.get('customer_email')
    phone = data.get('customer_phone')

    if not items or not name:
        return jsonify({'error': 'Missing items or customer name'}), 400

    total = 0
    order = Order(customer_name=name, customer_email=email, customer_phone=phone, status='pending')
    db.session.add(order)
    db.session.flush()

    for it in items:
        mi = MenuItem.query.get(it.get('menu_item_id'))
        if not mi:
            db.session.rollback()
            return jsonify({'error': f"Menu item {it.get('menu_item_id')} not found"}), 400
        qty = int(it.get('qty', 1))
        total += mi.price_cents * qty
        oi = OrderItem(order_id=order.id, menu_item_id=mi.id, qty=qty, unit_price_cents=mi.price_cents)
        db.session.add(oi)

    order.total_cents = total
    db.session.commit()

    return jsonify({'order_id': order.id, 'status': order.status})


@api_bp.route('/')
def index():
    """Return menu categories and items as JSON for the frontend."""
    categories = Category.query.order_by(Category.position).all()
    # prepare items for JSON response
    cats = []
    for c in categories:
        items = MenuItem.query.filter_by(category_id=c.id).all()
        cats.append({
            'id': c.id,
            'name': c.name,
            'items': items
        })
    # This endpoint serves the same data the frontend expects during development.
    return jsonify(cats)
