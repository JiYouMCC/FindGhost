findghost.db = {
    auth:undefined,
    sync:undefined,
    timestamp:undefined,
    init: function(config) {
        // for wilddog
        /*
        var config = {
            authDomain: appid + ".wilddog.com",
            syncURL: "https://" + appid + ".wilddogio.com"
        };
        wilddog.initializeApp(config);
        */


        // for firebase
        /*var config = {
            apiKey: "AIzaSyD4X5tblmJliy5f0WD4xIPNgV6v3RVEQ6s",
            authDomain: "findghost-11aab.firebaseapp.com",
            databaseURL: "https://findghost-11aab.firebaseio.com",
            storageBucket: "findghost-11aab.appspot.com",
            messagingSenderId: "292064845703"
        };*/
        firebase.initializeApp(config);
        findghost.db.auth = firebase.auth();
        findghost.db.sync = firebase.database();
        findghost.db.timestamp = firebase.database.ServerValue.TIMESTAMP;
    }
}
