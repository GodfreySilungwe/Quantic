import os
import random
import time
from datetime import datetime
from flask import Blueprint, jsonify, request
from flask import send_from_directory, abort
from werkzeug.utils import secure_filename
from . import db
from .models import MenuItem, Category, Order, OrderItem, Subscriber, Customer, Reservation

# Simple admin secret (dev-only). Configure ADMIN_SECRET in your environment or .env
ADMIN_SECRET = os.getenv('ADMIN_SECRET', 'dev-secret')

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
                {'id': i.id, 'name': i.name, 'description': i.description, 'price_cents': i.price_cents, 'available': i.available, 'image_filename': getattr(i, 'image_filename', None)}
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
            'items': [
                {
                    'id': i.id,
                    'name': i.name,
                    'description': i.description,
                    'price_cents': i.price_cents,
                    'available': i.available,
                    'image_filename': getattr(i, 'image_filename', None),
                    'category_id': i.category_id
                }
                for i in items
            ]
        })
    # This endpoint serves the same data the frontend expects during development.
    return jsonify(cats)


# --- Admin routes (dev-only simple auth) ---------------------------------
def _is_admin(req):
    token = req.headers.get('X-Admin-Secret') or req.args.get('admin_secret')
    return token and token == ADMIN_SECRET


@api_bp.route('/admin/orders', methods=['GET'])
def admin_list_orders():
    if not _is_admin(request):
        return jsonify({'error': 'unauthorized'}), 401
    orders = Order.query.order_by(Order.created_at.desc()).all()
    result = []
    for o in orders:
        items = OrderItem.query.filter_by(order_id=o.id).all()
        result.append({
            'id': o.id,
            'customer_name': o.customer_name,
            'customer_email': o.customer_email,
            'customer_phone': o.customer_phone,
            'total_cents': o.total_cents,
            'status': o.status,
            'created_at': o.created_at.isoformat(),
            'items': [
                {'menu_item_id': it.menu_item_id, 'qty': it.qty, 'unit_price_cents': it.unit_price_cents}
                for it in items
            ]
        })
    return jsonify(result)


@api_bp.route('/admin/menu_items', methods=['GET'])
def admin_list_menu_items():
    if not _is_admin(request):
        return jsonify({'error': 'unauthorized'}), 401
    items = MenuItem.query.order_by(MenuItem.created_at.desc()).all()
    return jsonify([
        {'id': i.id, 'name': i.name, 'description': i.description, 'price_cents': i.price_cents, 'available': i.available, 'category_id': i.category_id, 'image_filename': getattr(i, 'image_filename', None)}
        for i in items
    ])


@api_bp.route('/admin/categories', methods=['GET'])
def admin_list_categories():
    if not _is_admin(request):
        return jsonify({'error': 'unauthorized'}), 401
    cats = Category.query.order_by(Category.position).all()
    return jsonify([{'id': c.id, 'name': c.name, 'position': c.position} for c in cats])


@api_bp.route('/admin/categories', methods=['POST'])
def admin_create_category():
    if not _is_admin(request):
        return jsonify({'error': 'unauthorized'}), 401
    data = request.get_json() or {}
    name = data.get('name')
    position = data.get('position', 0)
    if not name:
        return jsonify({'error': 'name is required'}), 400
    cat = Category(name=name, position=int(position))
    db.session.add(cat)
    db.session.commit()
    return jsonify({'id': cat.id, 'name': cat.name, 'position': cat.position}), 201


@api_bp.route('/admin/categories/<int:cat_id>', methods=['PUT', 'PATCH'])
def admin_update_category(cat_id):
    if not _is_admin(request):
        return jsonify({'error': 'unauthorized'}), 401
    cat = Category.query.get(cat_id)
    if not cat:
        return jsonify({'error': 'not found'}), 404
    data = request.get_json() or {}
    if 'name' in data:
        cat.name = data['name']
    if 'position' in data:
        cat.position = int(data['position'])
    db.session.commit()
    return jsonify({'ok': True})


@api_bp.route('/admin/categories/<int:cat_id>', methods=['DELETE'])
def admin_delete_category(cat_id):
    if not _is_admin(request):
        return jsonify({'error': 'unauthorized'}), 401
    cat = Category.query.get(cat_id)
    if not cat:
        return jsonify({'error': 'not found'}), 404
    db.session.delete(cat)
    db.session.commit()
    return jsonify({'ok': True}), 200


@api_bp.route('/admin/menu_items', methods=['POST'])
def admin_create_menu_item():
    if not _is_admin(request):
        return jsonify({'error': 'unauthorized'}), 401
    # support both JSON body and multipart/form-data with file upload
    data = {}
    if request.content_type and request.content_type.startswith('multipart/form-data'):
        data = request.form.to_dict()
    else:
        data = request.get_json() or {}

    name = data.get('name')
    price = data.get('price_cents')
    category_id = data.get('category_id')
    # require name, price and category for created items
    if not name or price is None or category_id is None:
        return jsonify({'error': 'name, price_cents and category_id are required'}), 400
    # validate category exists
    cat = Category.query.get(category_id)
    if not cat:
        return jsonify({'error': f'category {category_id} not found'}), 400

    image_filename = None
    # if an image file is included, save it to Images/ and record filename
    if 'image' in request.files:
        img = request.files.get('image')
        if img and img.filename:
            images_dir = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', '..', 'Images'))
            try:
                os.makedirs(images_dir, exist_ok=True)
            except Exception:
                pass
            fname = secure_filename(img.filename)
            # prefix with timestamp to avoid collisions
            fname = f"{int(time.time())}_{fname}"
            save_path = os.path.join(images_dir, fname)
            img.save(save_path)
            image_filename = fname

    mi = MenuItem(name=name, description=data.get('description'), price_cents=int(price), available=bool(data.get('available', True)), category_id=category_id)
    if image_filename:
        mi.image_filename = image_filename
    db.session.add(mi)
    db.session.commit()
    return jsonify({'id': mi.id, 'image_filename': getattr(mi, 'image_filename', None)}), 201


@api_bp.route('/admin/menu_items/<int:item_id>', methods=['PUT', 'PATCH'])
def admin_update_menu_item(item_id):
    if not _is_admin(request):
        return jsonify({'error': 'unauthorized'}), 401
    mi = MenuItem.query.get(item_id)
    if not mi:
        return jsonify({'error': 'not found'}), 404
    # accept multipart/form-data for updating image; if multipart, prefer request.form
    if request.content_type and request.content_type.startswith('multipart/form-data'):
        data = request.form.to_dict() or {}
    else:
        # parse JSON silently to avoid raising on unsupported media types
        data = request.get_json(silent=True) or {}
    if 'name' in data:
        mi.name = data['name']
    if 'description' in data:
        mi.description = data['description']
    if 'price_cents' in data:
        mi.price_cents = int(data['price_cents'])
    if 'available' in data:
        mi.available = bool(data['available'])
    if 'category_id' in data:
        # validate category exists before assigning
        new_cat = Category.query.get(data['category_id'])
        if not new_cat:
            return jsonify({'error': f'category {data["category_id"]} not found'}), 400
        mi.category_id = data['category_id']
    # handle image upload when present
    if 'image' in request.files:
        img = request.files.get('image')
        if img and img.filename:
            images_dir = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', '..', 'Images'))
            try:
                os.makedirs(images_dir, exist_ok=True)
            except Exception:
                pass
            fname = secure_filename(img.filename)
            fname = f"{int(time.time())}_{fname}"
            save_path = os.path.join(images_dir, fname)
            try:
                img.save(save_path)
                mi.image_filename = fname
            except Exception as e:
                db.session.rollback()
                return jsonify({'error': 'failed to save uploaded image', 'details': str(e)}), 500
    db.session.commit()
    return jsonify({'ok': True})


@api_bp.route('/admin/menu_items/<int:item_id>', methods=['DELETE'])
def admin_delete_menu_item(item_id):
    if not _is_admin(request):
        return jsonify({'error': 'unauthorized'}), 401
    mi = MenuItem.query.get(item_id)
    if not mi:
        return jsonify({'error': 'not found'}), 404
    # prevent deletion if this item appears in past orders to keep order history intact
    deps = OrderItem.query.filter_by(menu_item_id=mi.id).all()
    if deps:
        order_ids = sorted({d.order_id for d in deps})
        return jsonify({'error': 'item referenced by existing orders; cannot delete', 'order_ids': order_ids}), 400
    try:
        db.session.delete(mi)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'delete failed', 'details': str(e)}), 500
    return jsonify({'ok': True}), 200


@api_bp.route('/gallery', methods=['GET'])
def gallery_list():
    """Return list of image filenames in the project Images/ folder."""
    # Images folder is located at repository root: ../../Images relative to this file
    images_dir = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', '..', 'Images'))
    try:
        files = [f for f in os.listdir(images_dir) if os.path.isfile(os.path.join(images_dir, f))]
    except Exception:
        files = []
    return jsonify(sorted(files))


@api_bp.route('/reservations', methods=['POST'])
def create_reservation():
    """Create a reservation.

    Expected JSON:
      {
        "name": "Full Name",
        "email": "user@example.com",
        "phone": "optional",
        "guests": 2,
        "time_slot": "2025-11-25T18:30" ,  # ISO format
        "newsletter": true  # optional
      }
    """
    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    phone = (data.get('phone') or '').strip()
    guests = int(data.get('guests') or 1)
    newsletter = bool(data.get('newsletter', False))
    timeslot_raw = data.get('time_slot')

    if not name or not email or not timeslot_raw:
        return jsonify({'error': 'name, email and time_slot are required'}), 400

    try:
        # accept ISO format
        time_slot = datetime.fromisoformat(timeslot_raw)
    except Exception:
        return jsonify({'error': 'invalid time_slot format; use ISO datetime'}), 400

    # find or create customer by email
    customer = Customer.query.filter_by(email=email).first()
    if not customer:
        customer = Customer(name=name, email=email, phone=phone or None, newsletter=newsletter)
        db.session.add(customer)
        db.session.flush()
    else:
        # update name/phone/newsletter if provided
        customer.name = name or customer.name
        if phone:
            customer.phone = phone
        if newsletter:
            customer.newsletter = True

    # table assignment: 1..30
    TOTAL_TABLES = 30
    # get reserved table numbers for the same timeslot
    existing = Reservation.query.filter_by(time_slot=time_slot).all()
    taken_tables = {r.table_number for r in existing}
    available = [t for t in range(1, TOTAL_TABLES + 1) if t not in taken_tables]

    if not available:
        db.session.rollback()
        return jsonify({'error': 'no tables available for that time slot'}), 409

    table_number = random.choice(available)

    res = Reservation(customer_id=customer.id, time_slot=time_slot, table_number=table_number, guests=guests)
    db.session.add(res)
    db.session.commit()

    return jsonify({'reservation_id': res.id, 'table_number': table_number, 'time_slot': time_slot.isoformat()}), 201


@api_bp.route('/admin/reservations', methods=['GET'])
def admin_list_reservations():
    if not _is_admin(request):
        return jsonify({'error': 'unauthorized'}), 401
    resv = Reservation.query.order_by(Reservation.time_slot.desc()).all()
    out = []
    for r in resv:
        cust = Customer.query.get(r.customer_id)
        out.append({
            'id': r.id,
            'customer': {'id': cust.id, 'name': cust.name, 'email': cust.email, 'phone': cust.phone},
            'time_slot': r.time_slot.isoformat(),
            'table_number': r.table_number,
            'guests': r.guests,
            'created_at': r.created_at.isoformat()
        })
    return jsonify(out)


@api_bp.route('/images/<path:filename>')
def serve_image(filename):
    images_dir = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', '..', 'Images'))
    # basic security: don't allow path traversal
    full_path = os.path.normpath(os.path.join(images_dir, filename))
    if not full_path.startswith(os.path.abspath(images_dir)):
        abort(404)
    if not os.path.exists(full_path):
        abort(404)
    return send_from_directory(images_dir, filename)


@api_bp.route('/newsletter', methods=['POST'])
def newsletter_signup():
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    if not email:
        return jsonify({'error': 'email required'}), 400
    # basic email validation
    if '@' not in email or '.' not in email.split('@')[-1]:
        return jsonify({'error': 'invalid email'}), 400
    existing = Subscriber.query.filter_by(email=email).first()
    if existing:
        return jsonify({'status': 'already_subscribed'}), 200
    sub = Subscriber(email=email)
    db.session.add(sub)
    db.session.commit()
    return jsonify({'status': 'subscribed', 'id': sub.id}), 201

