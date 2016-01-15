/**
 * Angular Controller App for Event-Manager
 *
 */
(function() {
  var STORE_TRACK = "Track",
      app = angular.module('eventManagerTracklist', ['indexedDB']);

  /**
   * Gemeinsam genutzter Dienst, der alle Funktionen für die Lieder der Stammdaten zur Verfügung stellt.
   */
  app.service('tracklistService', ['$indexedDB', function($indexedDB) {
    var thisService    = this;
    thisService.tracks = [];

    /**
     * Hilfsfunktion zum Laden aller Lieder, da es mehrfach benötigt wird
     */
    var getAllTracks = function() {
      $indexedDB.openStore(STORE_TRACK, function(pStore) {
        pStore.getAll().then(function(pTracks) {
          thisService.tracks = pTracks;
        });
      });
    };

    /**
     * Hinzufügen eines Lieds
     * Nach erfolgreichem Hinzufügen wird die Tracklist aktualisiert
     * @param {object} pTrack Datensatz
     */
    thisService.add = function(pTrack) {
      $indexedDB.openStore(STORE_TRACK, function(pStore) {
        pStore.insert(pTrack).then(getAllTracks);
      });
    };

    /**
     * Entfernen eines Lieds
     * Nach erfolgreichem Entfernen wird die Tracklist aktualisiert
     * @param {number} pId Primärschlüssel
     */
    thisService.remove = function(pId) {
      $indexedDB.openStore(STORE_TRACK, function(pStore) {
        pStore.delete(pId).then(getAllTracks);
      });
    };

    // ~~~ Zum Start alle Lieder laden
    getAllTracks();
  }]);

  /**
   * Eigenes Tag für die Lieder in den Stammdaten
   */
  app.directive('trackJukebox', function() {
    return {
      restrict: 'E',
      templateUrl: './html/track-jukebox.html',
      /**
       * Controller for the equipment inventory
       * @author m11t
       * @param {object} $indexedDB IndexedDB service
       */
      controller: function($scope, tracklistService) {
        var thisController = this;
        $scope.tracklistService = tracklistService;

        /**
         * Hinzufügen eines Lieds
         * Nach erfolgreichem Hinzufügen wird das Array der Lieder aktualisiert
         */
        this.add = function() {
          var track = {
            'track_title': document.jukeboxAdd.trackTitle.value,
            'duration'   : document.jukeboxAdd.trackTime.value,
            'artist'     : document.jukeboxAdd.trackArtist.value
          };
          tracklistService.add(track);
          document.jukeboxAdd.reset();
        };

        /**
         * Entfernen eines Lieds
         * @param {number} pId Primärschlüssel
         */
        this.remove = function(pId) {
          tracklistService.remove(pId);
        };
      },
      controllerAs: 'jukebox'
    };
  });

})();
