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

        var setEquipments = function(pEquipments) {
          thisController.equipments = pEquipments;
        };
        var getAllEquipments = function(pStore) {
          pStore.getAll().then(setEquipments);
        };
        $indexedDB.openStore(STORE_NAME, getAllEquipments);

        $http.get("./json/equipment-types.json").success(function(pTypes) {
          thisController.types = pTypes;
        });

        this.add = function() {
          var eq = {
            'equipment_typ' : document.equipmentInventoryAdd.elements[0].selectedIndex - 1,
            'equipment_name': document.equipmentInventoryAdd.elements[1].value
          };

          $indexedDB.openStore(STORE_NAME, function(pStore) {
            pStore.insert(eq).then(getAllEquipments.call(thisController, pStore));
          });
        };

        this.remove = function(pId) {
          $indexedDB.openStore(STORE_NAME, function(pStore) {
            pStore.delete(pId).then(getAllEquipments.call(thisController, pStore));
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

        var setTracks = function(pTracks) {
          thisController.tracks = pTracks;
        };
        var getAllTracks = function(pStore) {
          pStore.getAll().then(setTracks);
        };
        $indexedDB.openStore(STORE_NAME, getAllTracks);

        this.add = function() {
          var track = {
            'track_title': document.jukeboxAdd.elements[0].value,
            'duration'   : document.jukeboxAdd.elements[1].value,
            'artist'     : document.jukeboxAdd.elements[2].value
          };

          $indexedDB.openStore(STORE_NAME, function(pStore) {
            pStore.insert(track).then(getAllTracks.call(thisController, pStore));
          });
        };

        this.remove = function(pId) {
          $indexedDB.openStore(STORE_NAME, function(pStore) {
            pStore.delete(pId).then(getAllTracks.call(thisController, pStore));
          });
        };
      },
      controllerAs: 'jukebox'
    };
  }]);

  app.directive('eventCarousel', ['$indexedDB', function($indexedDB) {
    return {
      restrict: 'E',
      templateUrl: './html/event-carousel.html',
      /**
       * Event-Creator Controller
       * @author m11t
       * @param {object} $indexedDB IndexedDB service
       */
      controller: function($indexedDB) {
        var thisController = this,
            STORE_NAME     = "Event";

        this.events = [];

        var setEvents = function(pEvents) {
          thisController.events = pEvents;
        };
        var getAllEvents = function(pStore) {
          pStore.getAll().then(setEvents);
        };
        $indexedDB.openStore(STORE_NAME, getAllEvents);

        this.add = function() {
          var vEvent = {
            'event_name'       : document.eventCreator.elements[0].value,
            'timestamp'        : document.eventCreator.elements[1].value,
            'event_description': document.eventCreator.elements[2].value
          };

          $indexedDB.openStore(STORE_NAME, function(pStore) {
            pStore.insert(vEvent).then(getAllEvents.call(thisController, pStore));
          });
        };

        this.remove = function(pId) {
          $indexedDB.openStore(STORE_NAME, function(pStore) {
            pStore.delete(pId).then(getAllEvents.call(thisController, pStore));
          });
        };
      },
      controllerAs: 'Event'
    };
  }]);

})();
