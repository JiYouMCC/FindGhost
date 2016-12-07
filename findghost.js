var findghost = {
    appid: "findghost",
    userSleepTime: 2 * 60 * 1000,
    MESSAGE_TYPE: {
        SYSTEM: "系统消息",
        CHAT: "聊天消息"
    },
    init: function() {
        var config = {
            authDomain: this.appid + ".wilddog.com",
            syncURL: "https://" + this.appid + ".wilddogio.com"
        };

        wilddog.initializeApp(config);
    },
    handleError: function(error) {
        console.log(error);
    },
    getCurrentDate: function() {
        var currentDate = undefined;
        wilddog.sync().ref("/.info/serverTimeOffset").once('value', function(snapshot) {
            currentDate = (new Date).getTime() + snapshot.val();
        })
        while (currentDate) {
            return currentDate;
        }
    },
    user: {
        getCurrentUser: function() {
            return wilddog.auth().currentUser;
        },
        getDisplayName: function() {
            var user = this.getCurrentUser();
            if (user) {
                var name = user.displayName;
                if (name) {
                    return name;
                }
                return user.email.split('@')[0];
            }
        },
        register: function(email, password, callback) {
            var user = this.getCurrentUser();
            if (!user) {
                wilddog.auth().createUserWithEmailAndPassword(email, password).then(callback).catch(function(error) {
                    findghost.handleError(error);
                });
            }
        },
        login: function(email, password) {
            var user = this.getCurrentUser();
            if (!user) {
                wilddog.auth().signInWithEmailAndPassword(email, password).catch(function(error) {
                    findghost.handleError(error);
                });
            }
        },
        logout: function() {
            var user = this.getCurrentUser();
            if (user) {
                wilddog.auth().signOut().catch(function(error) {
                    findghost.handleError(error);
                });
            }
        },
        getUid: function() {
            var user = this.getCurrentUser();
            if (user) {
                return user.uid;
            }
        },
        setDisplayName: function(displayName, callback) {
            wilddog.auth().currentUser.updateProfile({
                displayName: displayName
            }).then(callback).catch(function(error) {
                findghost.handleError(error);
            });
        },
        getEmail: function() {
            var user = this.getCurrentUser();
            if (user) {
                return user.email;
            }
        },
        updateCallback: function(callback) {
            wilddog.auth().onAuthStateChanged(callback);
        }
    },
    hall: {
        out: function(uid) {
            wilddog.sync().ref("/hall/users/" + uid).remove();
        },
        in : function(uid, displayName) {
            wilddog.sync().ref("/hall/users/").child(uid).set({
                "displayName": displayName,
                "date": findghost.getCurrentDate()
            });
        },
        updateUserCallback: function(callback) {
            wilddog.sync().ref("/hall/users").on("value", callback);
        },
        updateMessageCallback: function(callback) {
            wilddog.sync().ref("/hall/message").on("value", callback);
        },
        removeSleepUser: function() {
            var user = findghost.user.getCurrentUser();
            if (user) {
                var currentDate = findghost.getCurrentDate();
                wilddog.sync().ref("/hall/users/").once("value", function(snapshot) {
                    var users = snapshot.val();
                    for (uid in users) {
                        var date = users[uid].date;
                        var userDisplay = users[uid].displayName;
                        if (date + findghost.userSleepTime < currentDate) {
                            findghost.hall.out(uid);
                        }
                    }
                });
            }
        },
        sendMessage: function(uid, displayName, message, type, callback) {
            var currentDate = findghost.getCurrentDate();
            wilddog.sync().ref("/hall/message").child(currentDate).set({
                "uid": uid,
                "displayName": displayName,
                "type": type,
                "message": message,
            }).then(callback);
        },
        chat: function(message, callback) {
            var user = findghost.user.getCurrentUser();
            if (user) {
                this.sendMessage(user.uid, findghost.user.getDisplayName(), message, findghost.MESSAGE_TYPE.CHAT, callback);
            }
        }
    }
}