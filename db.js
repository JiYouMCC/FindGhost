findghost.db = {
    auth:undefined,
    sync:undefined,
    timestamp:undefined,
    init: function(type, config) {
        if (type == "firebase") {
            firebase.initializeApp(config);
            findghost.db.auth = firebase.auth();
            findghost.db.sync = firebase.database();
            findghost.db.timestamp = firebase.database.ServerValue.TIMESTAMP;
        } else if (type == "wilddog") {
            wilddog.initializeApp(config);
            findghost.db.auth = wilddog.auth();
            findghost.db.sync = wilddog.sync();
            findghost.db.timestamp = wilddog.sync().ServerValue.TIMESTAMP;
        }
    }
}
