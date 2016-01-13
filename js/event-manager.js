/**
 * Angular Controller App for Event-Manager
 *
 */
(function() {
  var STORE_EVENT    = "Event",
      STORE_LOCATION = "Loation",
      app = angular.module('eventManager', ['eventAdministration', 'indexedDB']);

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

    thisFactory.eventIdx = -1;
    thisFactory.eventId  = 0;
    thisFactory.event    = {};
    thisFactory.events   = [];

    /**
     * Hilfsfunktion zum Laden des Ortes der Veranstaltung
     * @param {boolean} pPositionOnLast Soll auf den nach dem Laden letzten positioniert werden? (Nach addEvent)
     */
    function getAllEvents(pPositionOnLast) {
      $indexedDB.openStore(STORE_EVENT, function(pStore) {
        pStore.getAll().then(function(pEvents) {
          thisFactory.events = pEvents;
          if ( pPositionOnLast ) {
            thisFactory.position( thisFactory.events.length-1 );
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
     * Hilfsfunktion zum Verschieben des aktiven Events
     * @param {number} pEventId Primärkey
     */
    function shift() {
      if ( thisFactory.eventIdx === -1 ) {
        thisFactory.eventId  = 0;
        thisFactory.event    = {};
      } else {
        thisFactory.event    = thisFactory.events[thisFactory.eventIdx];
        thisFactory.eventId  = thisFactory.event.event_id;
      }
    }

    /**
     * Eine Veranstaltung hinzufügen
     * Nach erfolgreichem Hinzufügen wird zunächst das modale Fenster geschlossen und danach das Array der Events nachgeladen.
     * @param {object} pEvent Datensatz
     */
    this.addEvent = function(pEvent) {
      $indexedDB.openStore(STORE_EVENT, function(pStore) {
        pStore.insert(pEvent).then(function() {
          getAllEvents(true);
        });
      });
    };

    /**
     * Eine Veranstaltung entfernen
     * Nach erfolgreichem Entfernen wird das Array der Events nachgeladen.
     * @param {number} pEventId Index
     */
    this.removeEvent = function(pEventId) {
      $indexedDB.openStore(STORE_EVENT, function(pStore) {
        pStore.delete(pEventId).then(function() {
          getAllEvents(false);
          thisFactory.recede(); // ~~~ Auf vorheriges Event positionieren
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
          getAllEvents(false);
        });
      });
    };

    /**
     * Ist das aktuelle Event der Platzhalter fürs Anlegen?
     * @author M11
     */
    this.isCreator = function() {
      return( thisFactory.eventId === 0 );
    };

    /**
     * Ist das übergebene Event das aktuell dargestellte?
     * @author M11
     * @param {number} pEventId Primärschlüssel
     */
    this.isActive = function(pEventId) {
      return( thisFactory.eventId === pEventId );
    }

    /**
     * Ist das übergebene Event links vom aktuellen?
     * @author M11
     * @param {number} pEventId Primärschlüssel
     */
    this.isLeft = function(pEventId) {
      return( pEventId < thisFactory.eventId );
    }

    /**
     * Ist das übergebene Event rechts vom aktuellen?
     * @author M11
     * @param {number} pEventId Primärschlüssel
     */
    this.isRight = function(pEventId) {
      return( pEventId > thisFactory.eventId );
    }

    /**
     * Hat das angegebene Event einen Ort?
     * @param {number} pEventId Primärschlüssel
     */
    this.hasLocation = function(pEventId) {
      var vIdx = getEventIdx(pEventId);
      return( typeof(thisFactory.events[vIdx].street) !== 'undefined' || typeof(thisFactory.events[vIdx].city) !== 'undefined' );
    }

    /**
     * Aktives Event neu positionieren
     * @param {number} pIdx Index des neuen aktiven Events in der Datenbank
     */
    this.position = function(pIdx) {
      thisFactory.eventIdx = pIdx;
      shift();
    }

    /**
     * Aktives Event neu positionieren anhand event_id
     * @param {number} pId Event_id
     */
    this.positionById = function(pId) {
      thisFactory.eventIdx = getEventIdx(pId);
      shift();
    }

    /**
     * Nächstes Event selektieren
     */
    this.proceed = function() {
      if ( thisFactory.eventIdx === (thisFactory.events.length-1) ) {
        thisFactory.position( -1 );
      } else {
        thisFactory.position( thisFactory.eventIdx+1 );
      }
    }

    /**
     * Vorheriges Event selektieren
     */
    this.recede = function() {
      if ( thisFactory.eventIdx === -1 ) {
        thisFactory.position( thisFactory.events.length-1 );
      } else {
        thisFactory.position( thisFactory.eventIdx-1 );
      }
    }

    // ~~~ Zum Start alle Events laden
    getAllEvents(false);
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
        var thisController  = this;

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
        var thisController  = this;

        thisController.provider = currentEventProvider;

        /**
         * Hinzufügen eines Events
         */
        this.add = function() {
          var vEvent = {
            'event_name'       : document.eventCreator.eventName.value,
            'timestamp'        : new Date(document.eventCreator.eventDate.value + "T" + document.eventCreator.eventHour.value + ":" + document.eventCreator.eventMinute.value + ":00"),
            'event_description': document.eventCreator.eventDescription.value,
            'street'           : document.eventCreator.locationStreet.value,
            'zip'              : document.eventCreator.locationZIP.value,
            'city'             : document.eventCreator.locationCity.value
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
