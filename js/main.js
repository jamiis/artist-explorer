/* global SpotifyWebApi, dndTree, $, geoplugin_countryCode, Promise, google, setRepeatArtists */
(function () {
    'use strict';

    var numberOfArtistsToShow = 10;
    var playPopTrackTimeoutId;
    var api = new SpotifyWebApi();

    //replace with configured servers uri
    // TODO fix for dev environment
    var apiUrl = "http://api.movieexplorer.me";

    var movieApi = {
        search: function(title) {
            var url = apiUrl +'/api/search/' + title;
            return Promise.resolve($.ajax(url));
        },
        movie: function(id) {
            var url = apiUrl + '/api/movie/' + id;
            return Promise.resolve($.ajax(url));
        },
        related: function(id) {
            var url = apiUrl + '/api/related/' + id;
            return Promise.resolve($.ajax(url));
        }
    };

    var showCompletion = true;
    var repeatArtists = false;
    var repeatMovies = false;

    //default to US
    var userCountry = "US";

    var loadAllGenresUri = apiUrl + "/api/genres"
    var loadArtistInfoUri = apiUrl + "/api/artist-info/"

    function getGenreArtistsUri(genreId) {
        return apiUrl + "/api/genres/" + genreId + "/artists";
    }

    window.onresize = function () {
        dndTree.resizeOverlay();
        var height = $(window).height();
        $('#rightpane').height(height);
    };

    $('#rightpane').height($(window).height());

    function setRepeatMovies() {
        if (document.getElementById('repeatMovies').checked) {
            repeatMovies = true;
        } else {
            repeatMovies = false;
        }
    }

    function setRepeatArtists() {
        if (document.getElementById('repeatArtists').checked) {
            repeatArtists = true;
        } else {
            repeatArtists = false;
        }
    }

    function initContainer() {
        // Princess Mononoke default
        //movieApi.movie('10144').then(initRootWithMovie);

        // Pulp Fiction
        //movieApi.movie('13863').then(initRootWithMovie);

        // Her
        //movieApi.movie('771356295').then(initRootWithMovie);

        // Toy Story 3
        //movieApi.movie('770672122').then(initRootWithMovie);

        // Inception 
        movieApi.movie('770805418').then(initRootWithMovie);

        /* remove
        var initArtistId = stripTrailingSlash(qs('artist_id')),
            initGenre = stripTrailingSlash(qs('genre'));

        if (initArtistId) {
            api.getArtist(initArtistId).then(initRootWithArtist);
        } else if (initGenre) {
            initRootWithGenre(initGenre);
        } else {
            remove api.getArtist('43ZHCT0cAZBISjO8DG9PnE').then(initRootWithArtist);
        }
        */
    }

    window.addEventListener('load', function () {

        $.ajax({
            url: "https://freegeoip.net/json/"
        }).done(function (data) {
            userCountry = data.country_code;
        });

        initContainer();

        var formArtist = document.getElementById('search-artist');
        formArtist.addEventListener('submit', function (e) {
            showCompletion = false;
            e.preventDefault();
            var search = document.getElementById('artist-search');
            // TODO figure out what is going on with submit
            // TODO change returned data to movies
            api.searchArtists(search.value.trim(), { market: userCountry })
                .then(function (data) {
                if (data.artists && data.artists.items.length) {
                    initRootWithArtist(data.artists.items[0]);
                }
            });

        }, false);


        /* remove
        var formGenre = document.getElementById('search-genre');
        formGenre.addEventListener('submit', function (e) {
            showCompletion = false;
            e.preventDefault();
            var search = document.getElementById('genre-search');
            var genreName = search.value.trim();
            initRootWithGenre(genreName);
        }, false);
        */

    }, false);

    function qs(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        var regex = new RegExp('[\\?&]' + name + '=([^&#]*)'),
            results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    function stripTrailingSlash(str) {
        if (str.substr(-1) == '/') {
            return str.substr(0, str.length - 1);
        }
        return str;
    }

    var allGenres = [];

    // remove loadAllGenres();

    function initRootWithMovie(movie) {
        dndTree.setRootMovie(movie);
        $('#genre-search').val('');
    }

    function initRootWithArtist(artist) {
        dndTree.setRoot(artist);
        $('#genre-search').val('');
    }

    function initRootWithGenre(genre) {
        dndTree.setRootGenre(genre);
        $('#artist-search').val('');
    }

    function loadAllGenres() {
        $.ajax({
            url: loadAllGenresUri
        }).done(function (data) {
            data.genres.forEach(function (genre) {
                allGenres.push(toTitleCase(genre.name));
            });
        });
    }

    function toTitleCase(str) {
        return str.replace(/\w\S*/g, function (txt) {return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    }

    var getInfoTimeoutid;
    function getInfo(movie) {
        getInfoTimeoutid = window.setTimeout(function () {
            _getInfo(movie);
            $('#rightpane').animate({ scrollTop: '0px' });
        }, 500);
    }

    function getInfoCancel(movie) {
        window.clearTimeout(getInfoTimeoutid);
    }

    var movieInfoModel = function() {
        var self = this;

        // from api
        self.movieTitle = ko.observable();
        self.cast = ko.observableArray([]);
        self.mpaaRating = ko.observable();
        self.year = ko.observable();
        self.runtime = ko.observable();
        self.synopsis = ko.observable();
        self.rottenTomatoesLink = ko.observable();
        self.trailerEmbedLink = ko.observable();
        self.releaseYear = ko.observable();
        self.rottenTomatoesRatingCritics = ko.observable();
        self.rottenTomatoesRatingAudience = ko.observable();
        self.rottenTomatoesRatingAudience = ko.observable();
        self.showTrailer = ko.observable(false);

        // extra fields
        self.synopsisExists = ko.observable();
        self.isMovieInfoVisible = ko.observable(false);

        // TODO old fields. remove
        self.spotifyLink = ko.observable();
        self.popularity = ko.observable();
        self.biography = ko.observable();
        self.bioExists = ko.observable();
        self.genres = ko.observableArray([]);
        self.topTracks = ko.observableArray([]);

        self.switchToGenre = function() {
            initRootWithGenre(this.name);
        }

        self.playTrack = function() {
            var self2 = this;
            var track = {
                'preview_url': this.preview_url,
                'id': this.id,
            }
            playPopTrackTimeoutId = window.setTimeout(function () {
                _playTrack(track);
                ko.utils.arrayForEach(self.topTracks(), function(track) {
                    track.isPlaying(false);
                });
                self2.isPlaying(true);
            }, 500);
        }

        self.playTrackCancel = function() {
            window.clearTimeout(playPopTrackTimeoutId);
        }
    }

    function _playTrack(track) {
        Player.playForTrack(track);
    }

    var movieInfoModel = new movieInfoModel()

    ko.applyBindings(movieInfoModel);

    function _getInfo(movie) {
        $('#hoverwarning').css('display', 'none');

        movieInfoModel.isMovieInfoVisible(true);
        movieInfoModel.movieTitle(movie.title);
        movieInfoModel.cast(movie.abridged_cast);
        movieInfoModel.mpaaRating(movie.mpaa_rating);
        movieInfoModel.year(movie.year);
        movieInfoModel.runtime(movie.runtime);
        movieInfoModel.synopsis(movie.synopsis)
        movieInfoModel.synopsisExists(movie.synopsis ? true:false)
        movieInfoModel.rottenTomatoesLink(movie.links.alternate)
        movieInfoModel.rottenTomatoesRatingCritics(movie.ratings.critics_score);
        movieInfoModel.rottenTomatoesRatingAudience(movie.ratings.audience_score);
        movieInfoModel.releaseYear(movie.release_dates.theater.split("-")[0]);
        movieInfoModel.showTrailer(false);
        $.ajax(apiUrl+'/api/trailer/' + movie.title).then(function(data) {
            console.log('trailer', data)
                // TODO if data returns results
            movieInfoModel.trailerEmbedLink(
                '//www.youtube.com/embed/' + data.id.videoId
            );
            movieInfoModel.showTrailer(true);
        })
    }

    function getRelatedMovies(movie, exclude) {
        return new Promise(function (resolve, reject) {
            // TODO remove repeat artists
            return movieApi.related(movie.id).then(function (data) {
                if (!repeatMovies) {
                    data.movies = data.movies.filter(function (movies) {
                        return exclude.indexOf(movies.id) === -1;
                    });
                }
                resolve(data.movies);
            });
        });
    }

    function getRelated(artistId, excludeList) {
        return new Promise(function (resolve, reject) {
            return api.getArtistRelatedArtists(artistId).then(function (data) {

                data.artists.sort(function (a, b) {
                    return b.popularity - a.popularity;
                });
                if (!repeatArtists) {
                    data.artists = data.artists.filter(function (artist) {
                        return excludeList.indexOf(artist.id) === -1;
                    });
                }

                resolve(data.artists.slice(0, numberOfArtistsToShow));
            });
        });
    }

    function getIdFromArtistUri(artistUri) {
        return artistUri.split(':').pop();
    }

    function getArtistsForGenre(genreName) {
        return new Promise(function (resolve, reject) {
            return $.ajax({
                url: getGenreArtistsUri(encodeURIComponent(genreName.toLowerCase()))
            }).then(function (data) {
                var idsToRequest = [];
                data.artists.forEach(function (artist) {
                    if (artist.foreign_ids) {
                        idsToRequest.push(getIdFromArtistUri(artist.foreign_ids[0].foreign_id));
                    }
                });
                return api.getArtists(idsToRequest).then(function (data) {
                    //Sort in popularity order
                    resolve(data.artists.sort(function (a, b) {
                        return b.popularity - a.popularity;
                    }).slice(0, numberOfArtistsToShow));
                });
            });
        });
    }

    function changeNumberOfArtists(value) {
        numberOfArtistsToShow = value;
        document.getElementById('range-indicator').innerHTML = value;
    }

    function createAutoCompleteDiv(movie) {
        if (!movie) {
            return;
        }
        var val = '<div class="autocomplete-item">' +
            '<div class="artist-icon-container">' +
            '<img src="' + getSuitableThumbnail(movie.posters.thumbnail) + '" class="circular artist-icon" />' +
            '<div class="artist-label">' + movie.title + '</div>' +
            '</div>' +
            '</div>';
        return val;
    }

    var unavailCountryMessageSet = false;

    function setUnavailCountryErrorMessage() {
        var msg = 'Oops, seems like Spotify is not available in your country yet';
        if (unavailCountryMessageSet) {
            return;
        }
        var message = '<div class="alert alert-danger alert-error">' +
            msg +
            '</div>';
        $('#rightpane').prepend(message);
        unavailCountryMessageSet = true;
    }

    $(function () {
        $('#artist-search')
            // don't navigate away from the field on tab when selecting an item
            .bind('keydown', function (event) {
                showCompletion = true;
                if (event.keyCode === $.ui.keyCode.TAB &&
                    $(this).autocomplete('instance').menu.active) {
                    event.preventDefault();
                }
            })
            .autocomplete({
                minLength: 0,
                source: function (request, response) {
                    movieApi.search(request.term).then(function(data) {
                        response(data.arr)
                    },
                    function(err) {
                        if (err.status == 400){
                            console.log('error searching for movie', err)
                        }
                    });
                },
                focus: function () {
                    // prevent value inserted on focus
                    return false;
                },
                select: function (event, ui) {
                    $('#artist-search').val(ui.item.title);
                    initRootWithMovie(ui.item);
                    return false;
                }
            })
            .autocomplete('instance')._renderItem = function (ul, item) {
                if (!item) {
                    console.log('no item');
                    return;
                }
                return $('<li></li>')
                    .data('item.autocomplete', item)
                    .append(createAutoCompleteDiv(item))
                    .appendTo(ul);
            };

        $('#genre-search')
            // don't navigate away from the field on tab when selecting an item
            .bind('keydown', function (event) {
                showCompletion = true;
                if (event.keyCode === $.ui.keyCode.TAB &&
                    $(this).autocomplete('instance').menu.active) {
                    event.preventDefault();
                }
                if (event.keyCode == 13) {
                    $('.ui-menu-item').hide();
                }
            })
            .autocomplete({
                minLength: 0,
                source: function (request, response) {
                    if (showCompletion) {
                        response($.ui.autocomplete.filter(allGenres, request.term));
                    } else {
                        response([]);
                    }
                },
                focus: function (e, ui) {
                    // prevent value inserted on focus
                    return false;
                },
                select: function (event, ui) {
                    $('#genre-search').val(ui.item.value);
                    initRootWithGenre(ui.item.value);
                    return false;
                }
            });
    });

    function drawChart(popularity) {
        var popData = google.visualization.arrayToDataTable([
             ['Popularity', popularity],
        ], true);

        var options = {
            width: 300, height: 120,
            redFrom: 80, redTo: 100,
            yellowFrom:50, yellowTo: 80,
            minorTicks: 5
        };

        var chart = new google.visualization.Gauge(document.getElementById('chart_div'));
        chart.draw(popData, options);
    }

    function getSuitableThumbnail(thumbnail) {
        console.log(thumbnail);

        var splitThumb = thumbnail.split("/");
        var file = splitThumb[splitThumb.length-1];
        var movieDoesntHavePoster = (file == "poster_default_thumb.gif");

        if (!thumbnail || movieDoesntHavePoster) {
            //&& thumbnail.width > minSize && image.width > 64 {
            return 'img/rottentomatoes.thumbnail.png';
        } else {
            return thumbnail;
        }
    }

    function getSuitableImage(images) {
        var minSize = 64;
        if (images.length === 0) {
            return 'img/spotify.jpeg';
        }
        images.forEach(function (image) {
            if (image && image.width > minSize && image.width > 64) {
                return image.url;
            }
        });

        return images[images.length - 1].url;
    }

    window.AE = {
        getSuitableImage: getSuitableImage,
        getRelated: getRelated,
        getRelatedMovies: getRelatedMovies,
        getArtistsForGenre: getArtistsForGenre,
        getInfoCancel: getInfoCancel,
        getInfo: getInfo,
        changeNumberOfArtists: changeNumberOfArtists,
        setRepeatArtists: setRepeatArtists,
        setRepeatMovies: setRepeatMovies,
        toTitleCase: toTitleCase,
        apiUrl: apiUrl,
        movieInfoModel: movieInfoModel
    };
})();
