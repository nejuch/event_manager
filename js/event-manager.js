/**
 * Angular Controller App for Event-Manager
 *
 */
(function() {
  var app = angular.module('eventManager', ['indexedDB']);

  /**
   * IndexedDB-Configuration
   */
  app.config(function($indexedDBProvider) {
    var db = $indexedDBProvider.connection('EventManagerDB');

    // ~~~ Create initial database version
    db.upgradeDatabase(1, function(pEvent, pDatabase, pTransaction) {
      pDatabase.createObjectStore('Event', {keyPath: 'person_id', autoIncrement: true});
      pDatabase.createObjectStore('Event_Equip', {keyPath: ['person_id', 'equipment_id']});
      pDatabase.createObjectStore('Equipment', {keyPath: 'equipment_id'});
      pDatabase.createObjectStore('Location', {keyPath: 'location_id'});
      pDatabase.createObjectStore('Tracklist', {keyPath: 'tracklist_id'});
      pDatabase.createObjectStore('Tracklist_Track', {keyPath: ['tracklist_id','track_id']});
      pDatabase.createObjectStore('Track', {keyPath: 'track_id'});
    }).upgradeDatabase(2, function(pEvent, pDatabase, pTransaction) {
      pDatabase.createObjectStore('Event', {keyPath: 'person_id', autoIncrement: true});
      pDatabase.createObjectStore('Event_Equip', {keyPath: ['person_id', 'equipment_id']});
      pDatabase.createObjectStore('Equipment', {keyPath: 'equipment_id', autoIncrement: true});
      pDatabase.createObjectStore('Location', {keyPath: 'location_id', autoIncrement: true});
      pDatabase.createObjectStore('Tracklist', {keyPath: 'tracklist_id', autoIncrement: true});
      pDatabase.createObjectStore('Tracklist_Track', {keyPath: ['tracklist_id','track_id']});
      pDatabase.createObjectStore('Track', {keyPath: 'track_id', autoIncrement: true});
    });
  });

  /**
   * Controller for the differet pages of the event manager
   */
  app.controller("TabControl", function() {
    this.tab = 1;

    this.isSet = function(pTab) {
      return( this.tab === pTab );
    };
    this.setTab = function(pTab) {
      this.tab = pTab;
    };
  });

  /**
   * Equipment inventory directive
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
        var thisController = this,
            STORE_NAME     = "Equipment";

        this.types      = [];
        this.equipments = [];

        $http.get("./json/equipment-types.json").success(function(pTypes) {
          thisController.types = pTypes;
        });

        $indexedDB.openStore(STORE_NAME, function(pStore) {
          pStore.getAll().then(function(pEquipments) {
            thisController.equipments = pEquipments;
          });
        });

        this.add = function() {
          var eq = {
            'equipment_typ' : document.jukeboxAdd.elements[0].selectedIndex - 1,
            'equipment_name': document.jukeboxAdd.elements[1].value
          };

          $indexedDB.openStore(STORE_NAME, function(pStore) {
            pStore.insert(eq).then(function() {
              pStore.getAll().then(function(pEquipments) {
                thisController.equipments = pEquipments;
              });
            });
          });
        };

        this.remove = function(pId) {
          $indexedDB.openStore(STORE_NAME, function(pStore) {
            pStore.delete(pId).then(function() {
              pStore.getAll().then(function(pEquipments) {
                thisController.equipments = pEquipments;
              });
            });
          });
        };
      },
      controllerAs: 'inventory'
    };
  }]);

  /**
   * Track jukebox directive
   */
  app.directive('trackJukebox', ['$http', '$indexedDB', function($http, $indexedDB) {
    return {
      restrict: 'E',
      templateUrl: './html/track-jukebox.html',
      /**
       * Controller for the equipment inventory
       * @author m11t
       * @param {object} $indexedDB IndexedDB service
       */
      controller: function($indexedDB) {
        var thisController = this,
            STORE_NAME     = "Track";

        this.tracks = [];

        $indexedDB.openStore(STORE_NAME, function(pStore) {
          pStore.getAll().then(function(pTracks) {
            thisController.tracks = pTracks;
          });
        });

        this.add = function() {
          var track = {
            'track_title': document.jukeboxAdd.elements[0].value,
            'duration'   : document.jukeboxAdd.elements[1].value,
            'artist'     : document.jukeboxAdd.elements[2].value
          };

          $indexedDB.openStore(STORE_NAME, function(pStore) {
            pStore.insert(track).then(function() {
              pStore.getAll().then(function(pTracks) {
                thisController.tracks = pTracks;
              });
            });
          });
        };

        this.remove = function(pId) {
          $indexedDB.openStore(STORE_NAME, function(pStore) {
            pStore.delete(pId).then(function() {
              pStore.getAll().then(function(pTracks) {
                thisController.tracks = pTracks;
              });
            });
          });
        };
      },
      controllerAs: 'jukebox'
    };
  }]);

})();
