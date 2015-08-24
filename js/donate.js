/* global SpotifyWebApi, dndTree, $, geoplugin_countryCode, Promise, google, setRepeatArtists */
(function () {
    'use strict';

    function donate(token) {
      console.log('token',token);
      $.ajax({
        type: 'POST',
        url: AE.apiUrl + '/api/donate',
        data: JSON.stringify(token),
        contentType: 'application/json'
      }).done(function (data) {
        console.log('success',data);
      });
    }

    var handler = StripeCheckout.configure({
      key: 'pk_live_OhJuToHMW67bNhKIVZd6R4JB',
      locale: 'auto',
      // TODO bitcoin: true,
      panelLabel: 'Donate',
      // Use the token to create the charge with a server-side script.
      // You can access the token ID with `token.id`
      token: donate,
    });

    $('#customButton').on('click', function(e) {
      // Open Checkout with further options
      handler.open({
        description: 'Help me build more apps!',
        amount: 200
      });
      e.preventDefault();
    });

    // Close Checkout on page navigation
    $(window).on('popstate', function() {
      handler.close();
    });
})();
