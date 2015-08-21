from flask import Flask, jsonify, request
from functools import  wraps
from flask_cors import CORS, cross_origin
from werkzeug.contrib.cache import SimpleCache
from rottentomatoes import RT
import requests, youtube, stripe

cache = SimpleCache(threshold=20000)

app = Flask(__name__)
app.config.from_object('keys')

# Make sure you have server/keys.py file with rottentomatoes api (RT_KEY) defined
RT_KEY = app.config['RT_KEY']
rt = RT(RT_KEY)

# config Stripe
stripe.api_key = app.config['STRIPE_SECRET']

#Allowed origins
ORIGINS = ['*']
app.config['CORS_HEADERS'] = "Content-Type"
app.config['CORS_RESOURCES'] = {r"/*": {"origins": ORIGINS}}
cors = CORS(app)

def cached(timeout=5 * 60, key='view/%s'):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            cache_key = key % request.path
            rv = cache.get(cache_key)
            if rv is not None:
                return rv
            rv = f(*args, **kwargs)
            cache.set(cache_key, rv, timeout=timeout)
            return rv
        return decorated_function
    return decorator

@app.route('/api/donate', methods=['POST'])
def donate():
    # TODO dump request json in donation mongo db
    amount = 100 # cents
    customer = stripe.Customer.create(
        email=request.json['email'],
        card=request.json['id']
    )
    charge = stripe.Charge.create(
        customer=customer.id,
        amount=amount,
        currency='usd',
        description='Donation (Movie Explorer)'
    )
    return jsonify({})

@app.route('/api/movie/<movie_id>')
@cached(timeout=30 * 60)
def get_movie(movie_id):
    return jsonify(rt.info(movie_id))

@app.route('/api/search/<movie_title>')
@cached(timeout=30 * 60)
def search_movie(movie_title):
    return jsonify({'arr': rt.search(movie_title)})

@app.route('/api/trailer/<movie_title>')
@cached(timeout=30 * 60)
def get_trailer_movie(movie_title):
    trailer = youtube.search(movie_title + " trailer")[0]
    return jsonify(trailer);

@app.route('/api/related/<movie_id>')
@cached(timeout=30 * 60)
def get_related_movie(movie_id):
    payload = {'apikey' : RT_KEY, 'limit': '5'}
    url = 'http://api.rottentomatoes.com/api/public/v1.0/movies/' + movie_id + '/similar.json'
    recommendations = requests.get(url, params=payload).json()
    return jsonify(recommendations);

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)
