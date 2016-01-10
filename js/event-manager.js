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
      pDatabase.createObjectStore('Event', {keyPath: 'event_id', autoIncrement: true});
      pDatabase.createObjectStore('Event_Equip', {keyPath: ['event_id', 'equipment_id']});
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
    this.tab = 2;

    this.isSet = function(pTab) {
      return( this.tab === pTab );
    };
    this.setTab = function(pTab) {
      this.tab = pTab;
    };
  });

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
        var thisController = this,
            STORE_NAME     = "Equipment";

        this.types      = [];
        this.equipments = [];

        /**
         * Hilfsfunktion zum Laden aller Lieder, da es mehrfach benötigt wird
         * @param {object} pStore Verbindung zu einem ObjectStore
         */
        var getAllEquipments = function(pStore) {
          pStore.getAll().then(function(pEquipments) {
            thisController.equipments = pEquipments;
          });
        };

        /**
         * Hinzufügen eines Instruments
         * Nach erfolgreichem Hinzufügen wird das Inventar aktualisiert
         */
        this.add = function() {
          var eq = {
            'equipment_typ' : document.equipmentInventoryAdd.elements[0].selectedIndex - 1,
            'equipment_name': document.equipmentInventoryAdd.elements[1].value
          };

          $indexedDB.openStore(STORE_NAME, function(pStore) {
            pStore.insert(eq).then(function() {
              getAllEquipments.call(thisController, pStore)
            });
          });
        };

        /**
         * Entfernen eines Instruments
         * Nach erfolgreichem Entfernen wird das Inventar aktualisiert
         */
        this.remove = function(pId) {
          $indexedDB.openStore(STORE_NAME, function(pStore) {
            pStore.delete(pId).then(function() {
              getAllEquipments.call(thisController, pStore)
            });
          });
        };

        // ~~~ Zum Seitenstart das Inventar laden
        $indexedDB.openStore(STORE_NAME, getAllEquipments);

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

        /**
         * Hilfsfunktion zum Laden aller Lieder, da es mehrfach benötigt wird
         * @param {object} pStore Verbindung zu einem ObjectStore
         */
        var getAllTracks = function(pStore) {
          pStore.getAll().then(function(pTracks) {
            thisController.tracks = pTracks;
          });
        };

        /**
         * Hinzufügen eines Lieds
         * Nach erfolgreichem Hinzufügen wird das Array der Lieder aktualisiert
         */
        this.add = function() {
          var track = {
            'track_title': document.jukeboxAdd.elements[0].value,
            'duration'   : document.jukeboxAdd.elements[1].value,
            'artist'     : document.jukeboxAdd.elements[2].value
          };

          $indexedDB.openStore(STORE_NAME, function(pStore) {
            pStore.insert(track).then(function() {
              getAllTracks.call(thisController, pStore)
            });
          });
        };

        /**
         * Entfernen eines Lieds
         * Nach erfolgreichem Entfernen wird das Array der Lieder aktualisiert
         */
        this.remove = function(pId) {
          $indexedDB.openStore(STORE_NAME, function(pStore) {
            pStore.delete(pId).then(function() {
              getAllTracks.call(thisController, pStore)
            });
          });
        };

        // ~~~ Zum Seitenstart die Lieder laden
        $indexedDB.openStore(STORE_NAME, getAllTracks);
      },
      controllerAs: 'jukebox'
    };
  }]);

  /**
   * Eigenes Tag für das modale Formular zum Hinzufügen eines Events
   */
  app.directive('eventCreator', function($indexedDB) {
    return {
      restrict: 'E',
      templateUrl: './html/event-creator.html'
    };
  });

  /**
   * Eigenes Tag zur Anzeige aller verfügbaren Events und zur Auswahl eines Events aus der Liste.
   */
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
        var thisController  = this,
            STORE_NAME      = "Event";

        this.events  = [];
        this.current = 0;

        /**
         * Hilfsfunktion zum Laden aller Events, da es mehrfach benötigt wird
         * @param {object} pStore Verbindung zu einem ObjectStore
         */
        var getAllEvents = function(pStore) {
          pStore.getAll().then(function(pEvents) {
            thisController.events = pEvents;
          });
        };

        /**
         * Event-Handler um auf das Karussel reagieren und den aktuellen Index merken
         * @param {object} pEvent slid.bs.carousel-Event
         */
        $('#event-carousel').on('slid.bs.carousel', function (pEvent) {
          this.current = pEvent;
        });

        /**
         * Hinzufügen eines Events
         * Nach erfolgreichem Hinzufügen wird das Array der Events nachgeladen und der modale Dialog mit dem Formular geschlossen.
         */
        this.add = function() {
          var vEvent = {
            'event_name'       : document.eventCreator.eventName.value,
            'timestamp'        : new Date(document.eventCreator.eventDate.value + "T" + document.eventCreator.eventHour.value + ":" + document.eventCreator.eventMinute.value + ":00"),
            'event_description': document.eventCreator.eventDescription.value
          };

          $indexedDB.openStore(STORE_NAME, function(pStore) {
            pStore.insert(vEvent).then(function() {
              getAllEvents.call(thisController, pStore);
              $('#eventCreatorModal').modal('hide');
            });
          });
        };

        /**
         * Entfernen eines Events
         * Nach erfolgreichem Entfernen wird zunächst das Karussel umpositioniert und danach das Array der Events nachgeladen.
         */
        this.remove = function(pId) {
          $indexedDB.openStore(STORE_NAME, function(pStore) {
            $('#event-carousel').carousel('prev');
            pStore.delete(pId).then(function () {
              getAllEvents.call(thisController, pStore);
            });
          });
        };

        // ~~~ Zum Seitenstart die Events laden
        $indexedDB.openStore(STORE_NAME, getAllEvents);
      },
      controllerAs: 'carousel'
    };
  }]);

  /**
   * Eigenes Tag für das aktuell ausgewählte Event
   */
  app.directive('eventPlanner', ['$indexedDB', function($indexedDB) {
    return {
      restrict: 'E',
      templateUrl: './html/event-planner.html',
      /**
       * Event-Planner Controller
       * @author m11t
       * @param {object} $indexedDB IndexedDB service
       */
      controller: function($indexedDB) {
        var thisController = this;

        this.event = {};

        /**
         * Das aktuelle Event übernehmen
         */
        this.setEvent = function(pEvent) {
          this.event = pEvent;
        };
      },
      controllerAs: 'planner'
    };
  }]);

})();
