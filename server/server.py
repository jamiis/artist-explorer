from flask import Flask, jsonify, request
from functools import  wraps
from flask_cors import CORS, cross_origin
from werkzeug.contrib.cache import SimpleCache
from rottentomatoes import RT
import pyen, os, requests

cache = SimpleCache(threshold=20000)

app = Flask(__name__)
app.config.from_object('keys')

# Make sure you have server/keys.py file with rottentomatoes api (RT_KEY) defined
RT_KEY = app.config['RT_KEY']
rt = RT(RT_KEY)

#Allowed origins
ORIGINS = ['*']
app.config['CORS_HEADERS'] = "Content-Type"
app.config['CORS_RESOURCES'] = {r"/*": {"origins": ORIGINS}}
cors = CORS(app)

# Make sure ECHO_NEST_API_KEY environment variable is set
os.environ['ECHO_NEST_API_KEY'] = app.config['ECHO_NEST_API_KEY']
en = pyen.Pyen()

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


@app.route('/api/artist-info/<artist_uri>')
@cached(timeout=30 * 60)
def get_artist_info(artist_uri):
    echonest_response = en.get('artist/profile', id=artist_uri, bucket=['genre','biographies'])
    response = {}
    response['status'] = echonest_response['status']
    response['artist'] = {}
    response['artist']['genres'] = echonest_response['artist']['genres']
    for bio in echonest_response['artist']['biographies']:
        if ('truncated' not in bio) or bio['truncated'] == False:
            response['artist']['biographies'] = [bio]
            break

    return jsonify(response)

@app.route('/api/genres/<genre_name>/artists')
@cached(timeout=30 * 60)
def get_genre_artists(genre_name):
    response = en.get('genre/artists', name=genre_name, results=15, bucket=['id:spotify'], limit=True)
    return jsonify(response)

@app.route('/api/genres')
@cached(timeout=30 * 60)
def get_all_genres():
    response = en.get('genre/list', results=2000)
    return jsonify(response)

@app.route('/api/movie/<movie_id>')
@cached(timeout=30 * 60)
def get_movie(movie_id):
    # TODO implement. or add trailer and imdb to response
    return jsonify(rt.info(movie_id))

@app.route('/api/search/<movie_title>')
@cached(timeout=30 * 60)
def search_movie(movie_title):
    return jsonify({'arr': rt.search(movie_title)})

@app.route('/api/related/<movie_title>')
@cached(timeout=30 * 60)
def get_related_movie(movie_title):
    payload = {'apikey' : RT_KEY, 'limit': '5'}
    url = 'http://api.rottentomatoes.com/api/public/v1.0/movies/' + movie_title + '/similar.json'
    return jsonify(requests.get(url, params=payload).json());

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)
