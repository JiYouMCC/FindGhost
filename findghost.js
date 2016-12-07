var findghost = {
    appid: "findghost",
    userSleepTime: 2 * 60 * 1000,
    showMessageCount: 512,
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
                wilddog.auth().createUserWithEmailAndPassword(email, password).then(function(user) {
                    findghost.hall.sendSystemMessage("“" + user.email.split('@')[0] + "”" + "加入了游戏");
                    callback(user);
                }).catch(function(error) {
                    findghost.handleError(error);
                });
            }
        },
        login: function(email, password) {
            var user = this.getCurrentUser();
            if (!user) {
                wilddog.auth().signInWithEmailAndPassword(email, password).then(function(user) {
                    findghost.hall.sendSystemMessage("“" + user.displayName + "”" + "回来了");
                }).catch(function(error) {
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
            var user = this.getCurrentUser();
            if (user) {
                var oldDisplay = this.getDisplayName();
                wilddog.auth().currentUser.updateProfile({
                    displayName: displayName
                }).then(function(user) {
                    findghost.hall.sendSystemMessage("“" + oldDisplay + "”改名为“" + displayName + "”");
                    callback(user);
                }).catch(function(error) {
                    findghost.handleError(error);
                });
            }
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
        out: function(uid, displayName) {
            wilddog.sync().ref("/hall/users/" + uid).remove();
            findghost.hall.sendSystemMessage("“" + displayName + "”" + "离开了");
        },
        in : function(uid, displayName) {
            var date = findghost.getCurrentDate();
            if (date) {
                wilddog.sync().ref("/hall/users/").child(uid).set({
                    "displayName": displayName,
                    "date": date
                });
            }
        },
        updateUserCallback: function(callback) {
            wilddog.sync().ref("/hall/users").on("value", callback);
        },
        updateMessageCallback: function(callback) {
            wilddog.sync().ref("/hall/message").orderByKey().limitToLast(findghost.showMessageCount).on("value", callback);
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
                            findghost.hall.out(uid, userDisplay);
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
        },
        sendSystemMessage: function(message, callback) {
            this.sendMessage("", "", message, findghost.MESSAGE_TYPE.SYSTEM, callback);
        }
    }
}