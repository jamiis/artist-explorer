Movie Explorer
===============

See Movie Explorer at [movieexplorer.me](https://movieexplorer.me/).

This project is a fork of Spotify's awesome [Artist Explorer](https://artistexplorer.spotify.com/).

Movie Explorer is a tool that helps serious movie enthusiasts explore movie relationships and discover new movies. Start from any movie and quickly navigate through trees of related movies, watching trailers as you go.

The app pulls related movie information from Rotten Tomatoes. You will need to create a `keys.py` file at the project root with the following keys and format:

```
RT_KEY='t1s-aRandomK3y-th0'
GOOGLE_YOUTUBE_API_KEY='you7ube-K3Y5'
```

Obviously those aren't real keys. You will need to register for Rotten Tomatoes and YouTube API keys.

Running Locally
===============
**Not necessary but strongly suggested:** Create a [virtualenv] (http://docs.python-guide.org/en/latest/dev/virtualenvs/) or use an existing one before installing dependencies of this project.


Rotten Tomatoes API calls are proxied through a flask server. You need to start the server first.

```
virtualenv venv
source /venv/bin/activate
cd server
pip install -r requirements.txt
python server.py
```

And you also need to serve the files at the root of the project. You can use SimpleHTTPServer module in python. To do that, change directyory to the project base and enter the following command:
```
python -m SimpleHTTPServer
```

App
===
todo: insert img

Consumed Libraries:
--------------
* [Rotten Tomatoes API](http://developer.rottentomatoes.com/)
* [d3](http://d3js.org/)
* [Google Gauge Charts](https://developers.google.com/chart/interactive/docs/gallery/gauge)
* [Google's YouTube API](https://developers.google.com/youtube/)
* [geoplugin](http://www.geoplugin.com/)
* [freegeoip](https://freegeoip.net)

