/**
 * Angular Controller App for Event-Manager
 *
 */
(function() {
   var eventManagerDB = angular.module('eventManagerDB', []);

    /**
     * Create the database schema for the Event-Manager-App
     */
    db.open({
      server: 'event-manager-app',
      version: 1,
      schema: {
        Event: {
          key: {
            keyPath: 'event_id',
            autoIncrement: true
          }
        },
        Event_Equip: {
          key: {
            keyPath: ['event_id', 'equipment_id']
          }
        },
        Equipment: {
          key: {
            keyPath: 'equipment_id'
          }
        },
        Location: {
          key: {
            keyPath: 'location_id'
          }
        },
        Tracklist: {
          key: {
            keyPath: 'tracklist_id'
          }
        },
        Tracklist_Track: {
          key: {
            keyPath: ['tracklist_id', 'track_id']
          }
        },
        Track: {
          key: {
            keyPath: 'track_id'
          }
        }
    }).then(function(pServer) {
      eventManagerDB.factory('eventManagerDBFactory', function() {
        return pServer;
      });
    });

});
