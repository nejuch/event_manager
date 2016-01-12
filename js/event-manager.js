/**
 * Angular Controller App for Event-Manager
 *
 */
(function() {
  var STORE_EVENT    = "Event",
      STORE_LOCATION = "Loation",
      app = angular.module('eventManager', ['indexedDB']);

  /**
   * IndexedDB-Configuration
   */
  app.config(function($indexedDBProvider) {
    var db = $indexedDBProvider.connection('EventManagerDB');

    // ~~~ Create initial database version
    db.upgradeDatabase(1, function(pEvent, pDatabase, pTransaction) {
      pDatabase.createObjectStore(STORE_EVENT, {keyPath: 'event_id', autoIncrement: true});
      pDatabase.createObjectStore('Event_Equip', {keyPath: ['event_id', 'equipment_id']});
      pDatabase.createObjectStore('Equipment', {keyPath: 'equipment_id', autoIncrement: true});
      pDatabase.createObjectStore(STORE_LOCATION, {keyPath: 'location_id', autoIncrement: true});
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
   * Gemeinsam genutzter Dienst, der das aktuelle Event zur Verfügung stellt.
   */
  app.service('currentEventProvider', ['$indexedDB', function($indexedDB) {
    var thisFactory = this;

    thisFactory.eventIdx = 0;
    thisFactory.eventId  = 0;
    thisFactory.event    = {};
    thisFactory.events   = [];

    /**
     * Hilfsfunktion zum Laden des Ortes der Veranstaltung
     * @param {number} pIdx Nummer des nach der Aktualisierung aktiven Events im Karussel
     */
    function getAllEvents(pIdx) {
      $indexedDB.openStore(STORE_EVENT, function(pStore) {
        pStore.getAll().then(function(pEvents) {
          thisFactory.events = pEvents;
          if ( typeof(pIdx) !== 'undefined' ) {
            $rootScope.$evalAsync(function() {
              $('#event-carousel .carousel-inner .item').eq(pIdx).toggleClass('active');
            });
          }
        });
      });
    }

    /**
     * Hilfsfunktion zum Ermitteln des Indexes eines Events innerhalb der Events von der Datenbank
     * @param {number} pEventId Primärkey
     */
    function getEventIdx(pEventId) {
      var i;
      for (i=0; i<thisFactory.events.length; i++) {
        if ( thisFactory.events[i].event_id === pEventId ) {
          return(i);
        }
      }
      return(-1);
    }

    /**
     * Das aktuelle Event aktualisieren damit der Planner und das Karussel darauf zugreifen können
     * @param {number} pEventId Indexnummer des aktiven Events in der Datenbank
     */
    this.updateEvent = function(pEventId) {
      thisFactory.eventId  = Number(pEventId);
      if ( thisFactory.isCreator() ) {
        thisFactory.eventIdx = 0;
        thisFactory.event    = {};
        thisFactory.location = {};
      }

      $indexedDB.openStore(STORE_EVENT, function(pStore) {
        pStore.find(thisFactory.eventId).then(function(pEvent) {
          thisFactory.event    = pEvent;
          thisFactory.eventIdx = getEventIdx(thisFactory.eventId);
        });
      });
    };

    /**
     * Eine Veranstaltung hinzufügen
     * Nach erfolgreichem Hinzufügen wird zunächst das modale Fenster geschlossen und danach das Array der Events nachgeladen.
     * @param {object} pEvent Datensatz
     */
    this.addEvent = function(pEvent) {
      $indexedDB.openStore(STORE_EVENT, function(pStore) {
        pStore.insert(pEvent).then(function() {
          $('#eventCreatorModal').modal('hide'); // ~~~ Modalen dialog schließen
          getAllEvents(thisFactory.events.length);
        });
      });
    };

    /**
     * Eine Veranstaltung entfernen
     * Nach erfolgreichem Entfernen wird das Array der Events nachgeladen.
     * @param {number} pEventId Index
     */
    this.removeEvent = function(pEventId) {
      $indexedDB.openStore(STORE_NAME, function(pStore) {
        pStore.delete(pEventId).then(function() {
          getAllEvents();
        });
      });
    };

    /**
     * Den Veranstaltungsort aktualisieren
     * @param {object} pLocation Datensatz
     */
    this.writeLocation = function(pLocation) {
      $indexedDB.openStore(STORE_EVENT, function(pStore) {
        pStore.upsert(thisFactory.event).then(function() {
          getAllEvents(thisFactory.eventIdx);
        });
      });
    };

    this.isCreator = function() {
      return( thisFactory.eventId === 0 );
    };

    // ~~~ Zum Start alle Events laden
    getAllEvents();
  }]);

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
      controller: function($indexedDB, currentEventProvider) {
        var thisController  = this,
            STORE_EVENT     = "Event",
            STORE_TRACKLIST = "Tracklist",
            STORE_LOCATION  = "Location",
            STORE_EQUIPMENT = "Event_Equip";

        thisController.provider = currentEventProvider;

        /**
         * Den Veranstaltungsort setzen
         */
        thisController.setLocation = function() {
          var vLocation = {
            'street'     : document.eventLocation.locationStreet.value,
            'zip'        : document.eventLocation.locationZIP.value,
            'city'       : document.eventLocation.locationCity.value
          };
          thisController.provider.writeLocation(vLocation);
        };

      },
      controllerAs: 'planner'
    };
  }]);

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
      controller: function($indexedDB, currentEventProvider) {
        var thisController  = this,
            STORE_NAME      = "Event";

        thisController.provider = currentEventProvider;

        /**
         * Event-Handler um auf das Karussel reagieren und den aktuellen Index merken
         * @param {object} pEvent slid.bs.carousel-Event
         */
        $('#event-carousel').on('slid.bs.carousel', function (pEvt) {
          thisController.provider.updateEvent(pEvt.relatedTarget.getAttribute("data-event-id"));
        });

        /**
         * Hinzufügen eines Events
         */
        this.add = function() {
          var vEvent = {
            'event_name'       : document.eventCreator.eventName.value,
            'timestamp'        : new Date(document.eventCreator.eventDate.value + "T" + document.eventCreator.eventHour.value + ":" + document.eventCreator.eventMinute.value + ":00"),
            'event_description': document.eventCreator.eventDescription.value
          };
          thisController.provider.addEvent(vEvent);
          document.eventCreator.reset(); // ~~~ Formular leeren
        };

        /**
         * Entfernen eines Events.
         * Nach erfolgreichem Entfernen wird zunächst das Karussel umpositioniert
         * @param {number} pId Index
         */
        this.remove = function(pId) {
          $('#event-carousel').carousel(0);
          thisController.provider.removeEvent(pId);
        };
      },
      controllerAs: 'carousel'
    };
  }]);

  /**
   * Eigenes Tag für den Veranstaltungsort des aktuell ausgewählten Events
   */
  app.directive('eventLocation', function() {
    return {
      restrict: 'E',
      templateUrl: './html/event-location.html'
    };
  });

})();
