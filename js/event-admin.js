/**
 * Angular Controller App for Event-Manager
 *
 */
(function() {
  var STORE_EQUIPMENT = "Equipment",
      STORE_TRACK     = "Track",
      app = angular.module('eventAdministration', ['indexedDB']);

  /**
   * Eigenes Tag für das Instrumenteninventar in den Stammdaten
   */
  app.directive('equipmentInventory', ['$http', '$indexedDB', function($http, $indexedDB) {
    return {
      restrict: 'E',
      templateUrl: './html/equipment-inventory.html',
      /**
       * Controller for the equipment inventory
       * @author m11t
       * @param {object} $indexedDB IndexedDB service
       */
      controller: function($indexedDB) {
        var thisController = this;

        this.types      = [];
        this.equipments = [];

        /**
         * Hilfsfunktion zum Laden aller Ausrüstungsgegenstände, da es mehrfach benötigt wird
         */
        var getAllEquipments = function() {
          $indexedDB.openStore(STORE_EQUIPMENT, function(pStore) {
            pStore.getAll().then(function(pEquipments) {
              thisController.equipments = pEquipments;
            });
          });
        };

        /**
         * Hinzufügen eines Instruments
         * Nach erfolgreichem Hinzufügen wird das Inventar aktualisiert
         */
        this.add = function() {
          var eq = {
            'equipment_typ' : document.equipmentInventoryAdd.eqType.selectedIndex - 1,
            'equipment_name': document.equipmentInventoryAdd.eqName.value
          };

          $indexedDB.openStore(STORE_EQUIPMENT, function(pStore) {
            pStore.insert(eq).then(getAllEquipments);
          });
        };

        /**
         * Entfernen eines Instruments
         * Nach erfolgreichem Entfernen wird das Inventar aktualisiert
         */
        this.remove = function(pId) {
          $indexedDB.openStore(STORE_EQUIPMENT, function(pStore) {
            pStore.delete(pId).then(getAllEquipments);
          });
        };

        // ~~~ Zum Seitenstart das Inventar laden
        getAllEquipments();

        // ~~~ Zum Seitenstart die möglichen Instrumente laden
        $http.get("./json/equipment-types.json").success(function(pTypes) {
          thisController.types = pTypes;
        });
      },
      controllerAs: 'inventory'
    };
  }]);

  /**
   * Eigenes Tag für die Lieder in den Stammdaten
   */
  app.directive('trackJukebox', ['$indexedDB', function($indexedDB) {
    return {
      restrict: 'E',
      templateUrl: './html/track-jukebox.html',
      /**
       * Controller for the equipment inventory
       * @author m11t
       * @param {object} $indexedDB IndexedDB service
       */
      controller: function($indexedDB) {
        var thisController = this;

        this.tracks = [];

        /**
         * Hilfsfunktion zum Laden aller Lieder, da es mehrfach benötigt wird
         * @param {object} pStore Verbindung zu einem ObjectStore
         */
        var getAllTracks = function() {
          $indexedDB.openStore(STORE_TRACK, function(pStore) {
            pStore.getAll().then(function(pTracks) {
              thisController.tracks = pTracks;
            });
          });
        };

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

          $indexedDB.openStore(STORE_TRACK, function(pStore) {
            pStore.insert(track).then(getAllTracks);
          });
        };

        /**
         * Entfernen eines Lieds
         * Nach erfolgreichem Entfernen wird das Array der Lieder aktualisiert
         */
        this.remove = function(pId) {
          $indexedDB.openStore(STORE_TRACK, function(pStore) {
            pStore.delete(pId).then(getAllTracks);
          });
        };

        // ~~~ Zum Seitenstart die Lieder laden
        getAllTracks();
      },
      controllerAs: 'jukebox'
    };
  }]);

})();
