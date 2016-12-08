var findghost = {
    appid: "findghost",
    userSleepTime: 2 * 60 * 1000,
    showMessageCount: 512,
    MESSAGE_TYPE: {
        SYSTEM: "系统消息",
        CHAT: "聊天消息",
        GAME: "游戏消息"
    },
    GAME_ROLE: {
        PLAYER: "玩家",
        WHITE: "小白",
        OWNER: "法官"
    },
    GAME_STATUS: {
        NOT_START: "未开始",
        READY: "准备中",
        ONGOING: "进行中"
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
    formatDate: function(date) {
        return ("0" + date.getHours()).slice(-2) + ":" + ("0" + date.getMinutes()).slice(-2) + ":" + ("0" + date.getSeconds()).slice(-2) + " ";
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
            findghost.game.outOfGame(uid, displayName);
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
        },
        sendGameMessage: function(message, callback) {
            this.sendMessage("", "", message, findghost.MESSAGE_TYPE.GAME, callback);
        }
    },
    game: {
        readyToPlay: function() {
            var user = findghost.user.getCurrentUser();
            if (user) {
                var uid = user.uid;
                var date = findghost.getCurrentDate();
                var displayName = findghost.user.getDisplayName();
                if (date) {
                    wilddog.sync().ref("/game/users/").child(uid).set({
                        "displayName": displayName,
                        "date": date,
                        "role": findghost.GAME_ROLE.PLAYER
                    }).then(function() {
                        findghost.game.setStatus(findghost.GAME_STATUS.READY);
                        findghost.hall.sendGameMessage("“" + displayName + "”" + "要抓鬼");
                    });
                }
            }
        },
        readyToWhite: function() {
            var user = findghost.user.getCurrentUser();
            if (user) {
                var uid = user.uid;
                var date = findghost.getCurrentDate();
                var displayName = findghost.user.getDisplayName();
                if (date) {
                    wilddog.sync().ref("/game/users/").child(uid).set({
                        "displayName": displayName,
                        "date": date,
                        "role": findghost.GAME_ROLE.WHITE
                    }).then(function() {
                        findghost.hall.sendGameMessage("“" + displayName + "”" + "要当小白");
                    });
                }
            }
        },
        readyToOwner: function(manWord, ghostWord) {
            var user = findghost.user.getCurrentUser();
            if (user) {
                var uid = user.uid;
                var date = findghost.getCurrentDate();
                var displayName = findghost.user.getDisplayName();
                if (date) {
                    wilddog.sync().ref("/game/users/").child(uid).set({
                        "displayName": displayName,
                        "date": date,
                        "role": findghost.GAME_ROLE.OWNER
                    }).then(function() {
                        findghost.hall.sendGameMessage("“" + displayName + "”" + "已经提交了词，要当法官");
                    });
                }
            }
        },
        outOfGame: function(uid, displayName) {
            if (!uid || !displayName) {
                var user = findghost.user.getCurrentUser();
                if (user) {
                    uid = user.uid;
                    displayName = findghost.user.getDisplayName();
                }
            }
            if (uid && displayName) {
                wilddog.sync().ref("/game/users/" + uid).remove();
                findghost.hall.sendGameMessage("“" + displayName + "”" + "不玩了");
                wilddog.sync().ref("/game/users").once("value", function(snapshot) {
                    var users = snapshot.val();
                    if (!users) {
                        findghost.game.setStatus(findghost.GAME_STATUS.NOT_START);
                    }
                });
            }
        },
        setStatus: function(status) {
            wilddog.sync().ref("/game/").child("status").set(status);
        },
        updateUserCallback: function(callback) {
            wilddog.sync().ref("/game/users").on("value", function(snapshot) {
                var users = snapshot.val();
                callback(users);
            });
        },
        updateStatusCallback: function(callback) {
            wilddog.sync().ref("/game/status").on("value", function(snapshot) {
                callback(snapshot.val());
            });
        },
        getStatus: function(callback) {
            wilddog.sync().ref("/game/status").once('value', callback);
        }
    }
}