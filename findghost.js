var findghost = {
    userSleepTime: 2 * 60 * 1000,
    showMessageCount: 512,
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
    CAMP: {
        MAN: "人",
        GHOST: "鬼"
    },
    init: function(appid) {
        var config = {
            authDomain: appid + ".wilddog.com",
            syncURL: "https://" + appid + ".wilddogio.com"
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
        displayName: {
            get: function(user) {
                if (!user) {
                    var user = findghost.user.get();
                }
                if (user) {
                    var name = user.displayName;
                    if (name) {
                        return name;
                    }
                    return user.email.split('@')[0];
                }
            },
            set: function(displayName, callback) {
                var user = findghost.user.get();
                if (user) {
                    var oldDisplay = findghost.user.displayName.get();
                    wilddog.auth().currentUser.updateProfile({
                        displayName: displayName
                    }).then(function(user) {
                        findghost.hall.message.sendSystem("“" + oldDisplay + "”改名为“" + displayName + "”");
                        callback(user);
                    }).catch(function(error) {
                        findghost.handleError(error);
                        callback(undefined);
                    });
                }
            }
        },
        get: function() {
            return wilddog.auth().currentUser;
        },
        register: function(email, password, callback) {
            var user = findghost.user.get();
            if (!user) {
                wilddog.auth().createUserWithEmailAndPassword(email, password).then(function(user) {
                    findghost.hall.message.sendSystem("“" + user.email.split('@')[0] + "”" + "加入了游戏");
                    callback(user);
                }).catch(function(error) {
                    findghost.handleError(error);
                    callback(undefined);
                });
            }
        },
        login: function(email, password, callback) {
            var user = findghost.user.get();
            if (!user) {
                wilddog.auth().signInWithEmailAndPassword(email, password).then(function(user) {
                    findghost.hall.message.sendSystem("“" + user.displayName + "”" + "回来了");
                    callback(user);
                }).catch(function(error) {
                    findghost.handleError(error);
                    callback(undefined);
                });
            }
        },
        logout: function() {
            var user = findghost.user.get();
            if (user) {
                wilddog.auth().signOut().catch(function(error) {
                    findghost.handleError(error);
                });
            }
        },
        uid: {
            get: function() {
                var user = findghost.user.get();
                if (user) {
                    return user.uid;
                }
            },
        },
        updateCallback: function(callback) {
            wilddog.auth().onAuthStateChanged(callback);
        }
    },
    hall: {
        user: {
            clear: function() {
                var user = findghost.user.get();
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
            updateCallback: function(callback) {
                wilddog.sync().ref("/hall/users").on("value", callback);
            },
        },
        message: {
            TYPE: {
                SYSTEM: "系统消息",
                CHAT: "聊天消息",
                GAME: "游戏消息",
                PLAYER: "玩家发言",
            },
            send: function(uid, displayName, message, type, color, callback) {
                var currentDate = findghost.getCurrentDate();
                wilddog.sync().ref("/hall/message").child(currentDate).set({
                    "uid": uid,
                    "displayName": displayName,
                    "type": type,
                    "message": message,
                    "color": color
                }).then(callback);
            },
            sendSystem: function(message, callback) {
                findghost.hall.message.send("", "", message, findghost.hall.message.TYPE.SYSTEM, "", callback);
            },
            sendGame: function(message, callback) {
                findghost.hall.message.send("", "", message, findghost.hall.message.TYPE.GAME, "", callback);
            },
            sendChat: function(message, color, callback) {
                var user = findghost.user.get();
                if (user) {
                    findghost.hall.message.send(user.uid, findghost.user.displayName.get(), message, findghost.hall.message.TYPE.CHAT, color, callback);
                }
            },
            sendPlayer: function(message, callback) {
                var user = findghost.user.get();
                if (user) {
                    findghost.hall.message.send(user.uid, findghost.user.displayName.get(), message, findghost.hall.message.TYPE.PLAYER, callback);
                }
            },
            updateCallback: function(callback) {
                wilddog.sync().ref("/hall/message").orderByKey().limitToLast(findghost.showMessageCount).on("value", callback);
            }
        },
        out: function(uid, displayName) {
            findghost.game.out(uid, displayName);
            wilddog.sync().ref("/hall/users/" + uid).remove();
            findghost.hall.message.sendSystem("“" + displayName + "”" + "离开了");
        },
        in : function(uid, displayName) {
            wilddog.sync().ref("/hall/users/").child(uid).set({
                "displayName": displayName,
                "date": wilddog.sync().ServerValue.TIMESTAMP
            });
        }
    },
    game: {
        start: function(callback) {
            findghost.hall.message.sendGame("游戏开始了，请大家确认自己发到的词！", callback);
        },
        end: function(result, winer) {
            findghost.hall.message.sendGame("游戏结束," + winer + "赢了", function() {
                findghost.game.words.getAll(function(words) {
                    var manWord = words.manWord;
                    var ghostWord = words.ghostWord;
                    if (manWord && ghostWord) {
                        findghost.hall.message.sendGame("人词：" + manWord, function() {
                            findghost.hall.message.sendGame("鬼词：" + ghostWord, function() {
                                findghost.game.camp.man.get(function(men) {
                                    if (men) {
                                        var men_str = "";
                                        var men_count = 0;
                                        for (uid in men) {
                                            if (men_count > 0) {
                                                men_str += "，"
                                            }
                                            men_str += men[uid].displayName;
                                            men_count += 1
                                        }
                                        findghost.hall.message.sendGame("人：" + men_str, function() {
                                            findghost.game.camp.ghost.get(function(ghosts) {
                                                if (ghosts) {
                                                    var ghost_str = "";
                                                    var ghost_count = 0;
                                                    for (uid in ghosts) {
                                                        if (ghost_count > 0) {
                                                            ghost_str += "，"
                                                        }
                                                        ghost_str += ghosts[uid].displayName;
                                                        ghost_count += 1
                                                    }
                                                    findghost.hall.message.sendGame("鬼：" + ghost_str, function() {
                                                        findghost.game.words.remove(function() {
                                                            findghost.game.role.owner.remove(function() {
                                                                findghost.game.user.removeAll(function() {
                                                                    findghost.game.camp.remove(function() {
                                                                        findghost.game.status.set(findghost.GAME_STATUS.NOT_START);
                                                                    })
                                                                });
                                                            });
                                                        });
                                                    });
                                                }
                                            });
                                        });
                                    }
                                });
                            });
                        });
                    }
                });
            });
        },
        role: {
            callback: undefined,
            set: function(uid, displayName, gameRole, callback) {
                wilddog.sync().ref("/game/users/").child(uid).set({
                    "displayName": displayName,
                    "role": gameRole,
                    "alive": null
                }).then(callback);
            },
            get: function(uid, callback) {
                if (!uid) {
                    uid = findghost.user.uid.get();
                }

                if (uid) {
                    wilddog.sync().ref("/game/users/" + uid).once("value", function(snapshot) {
                        var result = snapshot.val();
                        if (result) {
                            callback(result.role);
                        } else {
                            callback(undefined);
                        }
                    });
                } else {
                    callback(undefined);
                }
            },
            player: {
                get: function(callback) {
                    wilddog.sync().ref("game/users").orderByChild("role").equalTo(findghost.GAME_ROLE.PLAYER).once('value', function(snapshot) {
                        callback(snapshot.val());
                    });
                },
                ready: function() {
                    // 在准备中或未开始状态下，登录用户可以提出加入游戏
                    var user = findghost.user.get();
                    if (user) {
                        findghost.game.status.get(function(status) {
                            if (status == findghost.GAME_STATUS.NOT_START || status == findghost.GAME_STATUS.READY) {
                                var uid = user.uid;
                                var displayName = findghost.user.displayName.get();
                                findghost.game.role.set(uid, displayName, findghost.GAME_ROLE.PLAYER, function() {
                                    findghost.game.status.set(findghost.GAME_STATUS.READY);
                                    findghost.hall.message.sendGame("“" + displayName + "”" + "要抓鬼");
                                });
                            }
                        });
                    }
                },
                updateCallback: function(callback) {
                    var playersListener = wilddog.sync().ref("game/users").orderByChild("role").equalTo(findghost.GAME_ROLE.PLAYER);
                    playersListener.on("value", function(snapshot) {
                        callback(snapshot.val());
                    });
                    return playersListener;
                },
                contains: function(uid, callback) {
                    findghost.game.role.player.get(function(players) {
                        if (players && players.hasOwnProperty(uid)) {
                            callback(true);
                        } else {
                            callback(false);
                        }
                    });
                },
                getAlive: function(callback) {
                    wilddog.sync().ref("game/users").orderByChild("role").equalTo(findghost.GAME_ROLE.PLAYER).once('value', function(snapshot) {
                        var result = snapshot.val();
                        if (result) {
                            var finalResult = {};
                            for (uid in result) {
                                if (result[uid].alive) {
                                    finalResult[uid] = result[uid];
                                }
                            }

                            callback(finalResult);
                        }

                    });
                }
            },
            white: {
                get: function(callback) {
                    wilddog.sync().ref("game/users").orderByChild("role").equalTo(findghost.GAME_ROLE.WHITE).once('value', function(snapshot) {
                        callback(snapshot.val());
                    });
                },
                ready: function() {
                    var user = findghost.user.get();
                    if (user) {
                        var uid = user.uid;
                        var displayName = findghost.user.displayName.get();
                        findghost.game.role.white.contains(uid, function(result) {
                            if (!result) {
                                findghost.game.role.set(uid, displayName, findghost.GAME_ROLE.WHITE, function() {
                                    //wilddog.sync().ref("/game/users/" + uid).child("alive").set(true);
                                    findghost.game.status.get(function(status) {
                                        if (status && status == findghost.GAME_STATUS.NOT_START) {
                                            findghost.game.status.set(findghost.GAME_STATUS.READY);
                                        }
                                    })
                                    findghost.hall.message.sendGame("“" + displayName + "”" + "要当小白");
                                });
                            }
                        });
                    }
                },
                updateCallback: function(callback) {
                    var whitesListener = wilddog.sync().ref("game/users").orderByChild("role").equalTo(findghost.GAME_ROLE.WHITE);
                    whitesListener.on("value", function(snapshot) {
                        callback(snapshot.val());
                    });
                    return whitesListener;
                },
                contains: function(uid, callback) {
                    findghost.game.role.white.get(function(whites) {
                        if (whites && whites.hasOwnProperty(uid)) {
                            callback(true);
                        } else {
                            callback(false);
                        }
                    });
                }
            },
            owner: {
                get: function(callback) {
                    wilddog.sync().ref("/game/owner/").once("value", function(snapshot) {
                        callback(snapshot.val());
                    });
                },
                set: function(uid, displayName, callback) {
                    wilddog.sync().ref("/game/").child("owner").set({
                        uid: uid,
                        displayName: displayName
                    }).then(callback);
                },
                ready: function(manWord, ghostWord, callback) {
                    // 在准备中或未开始状态下，在没有法官的情况下，登录用户可以提出当法官
                    var user = findghost.user.get();
                    if (user) {
                        findghost.game.role.owner.get(function(ownerInfo) {
                            if (!ownerInfo) {
                                var uid = user.uid;
                                var displayName = findghost.user.displayName.get();
                                findghost.game.role.set(uid, displayName, findghost.GAME_ROLE.OWNER, function() {
                                    findghost.game.role.owner.set(uid, displayName, function() {
                                        findghost.game.words.set(manWord, ghostWord, function() {
                                            findghost.game.status.set(findghost.GAME_STATUS.READY);
                                            findghost.hall.message.sendGame("“" + displayName + "”" + "已经提交了词，要当法官");
                                            callback(true);
                                        });
                                    });
                                });
                            } else {
                                findghost.handleError("已经有法官了!");
                                callback(false);
                            }
                        })
                    }
                    callback(false);
                },
                remove: function(callback) {
                    wilddog.sync().ref("/game/owner").remove();
                    callback();
                },
            },
            updateCallback: function(callback) {
                var user = findghost.user.get();
                if (user) {
                    findghost.game.role.callback = wilddog.sync().ref("/game/users/" + user.uid + "/role");
                    findghost.game.role.callback.on("value", function(snapshot) {
                        callback(snapshot.val());
                    });
                } else {
                    callback(undefined);
                }
            },
            removeCallback: function() {
                if (findghost.game.role.callback) {
                    findghost.game.role.callback.off();
                    findghost.game.role.callback = undefined;
                }
            },
        },
        status: {
            set: function(status) {
                wilddog.sync().ref("/game/").child("status").set(status);
            },
            get: function(callback) {
                wilddog.sync().ref("/game/status").once('value', function(snapshot) {
                    var result = snapshot.val();
                    callback(result);
                });
            },
            updateCallback: function(callback) {
                wilddog.sync().ref("/game/status").on("value", function(snapshot) {
                    callback(snapshot.val());
                });
            }
        },
        user: {
            get: function(callback) {
                wilddog.sync().ref("/game/users").once('value', function(snapshot) {
                    callback(snapshot.val());
                });
            },
            updateCallback: function(callback) {
                wilddog.sync().ref("/game/users").orderByChild("role").on("value", function(snapshot) {
                    var users = snapshot.val();
                    callback(users);
                });
            },
            removeAll: function(callback) {
                wilddog.sync().ref("/game/users").remove();
                callback();
            }
        },
        words: {
            get: function(callback) {
                findghost.game.role.get(undefined, function(gameRole) {
                    switch (gameRole) {
                        case undefined:
                        case findghost.GAME_ROLE.WHITE:
                            callback(undefined);
                            break;
                        case findghost.GAME_ROLE.PLAYER:
                            findghost.game.camp.get(function(camp) {
                                switch (camp) {
                                    case findghost.CAMP.GHOST:
                                        wilddog.sync().ref("/game/words/ghostWord").once('value', function(snapshot) {
                                            callback(snapshot.val());
                                        });
                                        return
                                    case findghost.CAMP.MAN:
                                        wilddog.sync().ref("/game/words/manWord").once('value', function(snapshot) {
                                            callback(snapshot.val());
                                        });
                                        return
                                    case findghost.CAMP.GHOST:
                                    default:
                                        callback(undefined);
                                        return
                                }
                            });
                            break;
                        case findghost.GAME_ROLE.OWNER:
                            wilddog.sync().ref("/game/words/").once('value', function(snapshot) {
                                callback(snapshot.val());
                            });
                            break;
                    }
                });
            },
            set: function(manWord, ghostWord, callback) {
                findghost.game.role.get(undefined, function(role) {
                    if (role && role == findghost.GAME_ROLE.OWNER) {
                        wilddog.sync().ref("/game/").child("words").set({
                            manWord: manWord,
                            ghostWord: ghostWord
                        }).then(callback);
                    }
                });
            },
            remove: function(callback) {
                wilddog.sync().ref("/game/words").remove();
                callback();
            },
            getAll: function(callback) {
                wilddog.sync().ref("/game/words/").once('value', function(snapshot) {
                    callback(snapshot.val());
                });
            },
            check: function(manWord, ghostWord) {
                if (manWord && ghostWord) {
                    if (manWord == ghostWord) {
                        return "人词和鬼词不能一样！";
                    } else if (manWord.length != ghostWord.length) {
                        return "人词和鬼词字数不同！";
                    } else {
                        return undefined;
                    }
                } else {
                    return "词不能为空！";
                }
            }
        },
        camp: {
            get: function(callback) {
                var user = findghost.user.get();
                if (user) {
                    wilddog.sync().ref("/game/camp/" + user.uid + "/camp").once('value', function(snapshot) {
                        var result = snapshot.val();
                        callback(result);
                    });
                }
                callback(undefined);
            },
            remove: function(callback) {
                wilddog.sync().ref("/game/camp").remove();
                callback();
            },
            create: function(callback) {
                findghost.game.role.get(undefined, function(role) {
                    if (role && role == findghost.GAME_ROLE.OWNER) {
                        findghost.game.role.player.get(function(players) {
                            if (players) {
                                var playerList = [];
                                var playerCount = 0;
                                for (uid in players) {
                                    playerCount += 1;
                                    var displayName = players[uid].displayName;
                                    playerList.push([playerCount, uid, displayName]);
                                }

                                if (playerCount >= 3) {
                                    var ghostCount = Math.floor(playerCount * 0.4);
                                    var manCount = playerCount - ghostCount;
                                    var ghostList = [];
                                    while (ghostList.length < ghostCount) {
                                        var newGhostId = Math.floor(Math.random(1) * playerCount + 1);
                                        if (ghostList && ghostList.indexOf(newGhostId) < 0) {
                                            ghostList.push(newGhostId);
                                        }
                                    }

                                    for (var i = 0; i < playerList.length; i++) {
                                        var index = playerList[i][0];
                                        var uid = playerList[i][1];
                                        var displayName = playerList[i][2];
                                        var camp = undefined;
                                        wilddog.sync().ref("/game/users/" + uid).child("alive").set(true);
                                        if (ghostList.indexOf(index) < 0) {
                                            camp = findghost.CAMP.MAN;
                                        } else {
                                            camp = findghost.CAMP.GHOST;
                                        }

                                        wilddog.sync().ref("/game/camp/").child(uid).set({
                                            no: index,
                                            displayName: displayName,
                                            camp: camp,
                                            alive: true
                                        });
                                    }

                                    findghost.game.status.set(findghost.GAME_STATUS.ONGOING);
                                    callback();
                                } else {
                                    findghost.handleError("人数不足，不能发牌");
                                }
                            } else {
                                findghost.handleError("人数不足，不能发牌");
                            }
                        });
                    }
                })
            },
            alive: {
                get: function(uid, callback) {
                    if (!uid) {
                        uid = findghost.user.uid.get();
                    }

                    if (uid) {
                        findghost.game.status.get(function(status) {
                            if (status && status == findghost.GAME_STATUS.ONGOING) {
                                findghost.game.role.get(uid, function(role) {
                                    if (role) {
                                        switch (role) {
                                            case findghost.GAME_ROLE.OWNER:
                                                callback(null);
                                                break;
                                            case findghost.GAME_ROLE.PLAYER:
                                                wilddog.sync().ref("/game/camp/" + uid + "/alive").once('value', function(snapshot) {
                                                    callback(snapshot.val());
                                                });
                                                break;
                                            case findghost.GAME_ROLE.WHITE:
                                                wilddog.sync().ref("/game/users/" + uid + "/alive").once('value', function(snapshot) {
                                                    if (snapshot.val() && snapshot.val() == false) {
                                                        callback(false);
                                                    } else {
                                                        callback(true);
                                                    }
                                                });
                                                break;
                                        }
                                    } else {
                                        callback(null);
                                    }
                                });
                            } else {
                                callback(null);
                            }
                        });
                    } else {
                        callback(undefined);
                    }
                },
                set: function(uid, value, callback) {
                    if (!uid) {
                        uid = findghost.user.uid.get();
                    }

                    if (uid) {
                        findghost.game.status.get(function(status) {
                            if (status && status == findghost.GAME_STATUS.ONGOING) {
                                findghost.game.role.get(uid, function(role) {
                                    if (role) {
                                        switch (role) {
                                            case findghost.GAME_ROLE.OWNER:
                                                callback(undefined);
                                                break;
                                            case findghost.GAME_ROLE.PLAYER:
                                                wilddog.sync().ref("/game/camp/" + uid).child("alive").set(value).then(function() {
                                                    wilddog.sync().ref("/game/users/" + uid).child("alive").set(value).then(callback);
                                                });
                                                break;
                                            case findghost.GAME_ROLE.WHITE:
                                                wilddog.sync().ref("/game/users/" + uid).child("alive").set(value).then(callback);
                                                break;
                                        }
                                    } else {
                                        callback(undefined);
                                    }
                                });
                            }
                        });
                    } else {
                        callback(undefined);
                    }
                },
                kill: function(uid, callback) {
                    findghost.game.camp.alive.set(uid, false, function() {
                        findghost.game.camp.result.check(function(result, winer) {
                            if (result) {
                                findghost.game.end(result, winer);
                            }
                            callback();
                        })
                    })
                }
            },
            man: {
                get: function(callback) {
                    wilddog.sync().ref("/game/camp/").orderByChild("camp").equalTo(findghost.CAMP.MAN).once('value', function(snapshot) {
                        callback(snapshot.val());
                    });
                },
                count: function(callback) {
                    findghost.game.camp.man.get(function(men) {
                        var result = 0;
                        for (uid in men) {
                            result += 1;
                        }
                        callback(result);
                    })
                }
            },
            ghost: {
                get: function(callback) {
                    wilddog.sync().ref("/game/camp/").orderByChild("camp").equalTo(findghost.CAMP.GHOST).once('value', function(snapshot) {
                        callback(snapshot.val());
                    });
                },
                count: function(callback) {
                    findghost.game.camp.ghost.get(function(men) {
                        var result = 0;
                        for (uid in men) {
                            result += 1;
                        }
                        callback(result);
                    })
                }
            },
            result: {
                check: function(callback) {
                    findghost.game.camp.man.get(function(men) {
                        findghost.game.camp.ghost.get(function(ghosts) {
                            var aliveManCount = 0;
                            var aliveGhostCount = 0;
                            for (uid in men) {
                                if (men[uid].alive) {
                                    aliveManCount += 1;
                                }
                            }

                            for (uid in ghosts) {
                                if (ghosts[uid].alive) {
                                    aliveGhostCount += 1;
                                }
                            }

                            if (aliveGhostCount == 0) {
                                callback(true, findghost.CAMP.MAN);
                            } else if (aliveGhostCount >= aliveManCount) {
                                callback(true, findghost.CAMP.GHOST);
                            } else {
                                callback(false, null);
                            }
                        });
                    });
                }
            }
        },
        vote: {
            callback: undefined,
            STATUS: {
                NOT_START: "未开始",
                IN_PROGRESS: "投票中",
                DONE: "已完成"
            },
            target: {
                get: function(callback) {
                    var user = findghost.user.get();
                    if (user) {
                        findghost.game.role.player.getAlive(function(alivePlayers) {
                            if (alivePlayers.hasOwnProperty(user.uid)) {
                                // delete alivePlayers[user.uid];
                                callback(alivePlayers);
                            } else {
                                callback(undefined);
                            }
                        });
                    } else {
                        callback(undefined);
                    }
                }
            },
            get: function(callback) {
                wilddog.sync().ref("/game/vote").once('value', function(snapshot) {
                    callback(snapshot.val());
                });
            },
            set: function(tid, tDisplayName, callback) {
                var uid = findghost.user.uid.get();
                if (uid) {
                    var displayName = findghost.user.displayName.get();
                    findghost.game.role.player.getAlive(function(alivePlayers) {
                        if (alivePlayers && alivePlayers.hasOwnProperty(uid) && alivePlayers.hasOwnProperty(tid)) {
                            wilddog.sync().ref("/game/vote").child(uid).set(tid).then(function() {
                                findghost.hall.message.sendGame("“" + displayName + "”" + "指认“" + tDisplayName + "”是鬼！");
                                callback();
                            });
                        } else {
                            callback(undefined);
                        }
                    });
                } else {
                    callback(undefined);
                }
            },
            status: {
                get: function(callback) {
                    findghost.game.vote.get(function(votes) {
                        var voteCount = 0;
                        for (uid in votes) {
                            voteCount += 1;
                        }

                        if (voteCount == 0) {
                            callback(findghost.game.vote.STATUS.NOT_START);
                        } else {
                            findghost.game.role.player.getAlive(function(alivePlayers) {
                                var alivePlayersCount = 0;
                                for (uid in alivePlayers) {
                                    alivePlayersCount += 1;
                                }

                                if (voteCount == alivePlayersCount) {
                                    callback(findghost.game.vote.STATUS.DONE);
                                } else {
                                    callback(findghost.game.vote.STATUS.IN_PROGRESS);
                                }
                            });
                        }
                    })
                }
            },
            result: function(callback) {
                findghost.game.vote.status.get(function(status) {
                    if (status == findghost.game.vote.STATUS.DONE) {
                        var result = {};
                        findghost.game.vote.get(function(votes) {
                            for (uid in votes) {
                                var tid = votes[uid];
                                if (result.hasOwnProperty(tid)) {
                                    result[tid].append[uid];
                                } else {
                                    result[tid] = [uid];
                                }
                            }
                            callback(true, result);
                        });
                    } else {
                        callback(false, undefined);
                    }
                });
            },
            updateCallback: function(callback) {
                findghost.game.vote.callback = wilddog.sync().ref("/game/vote/");
                findghost.game.vote.callback.on("value", function(snapshot) {
                    callback(snapshot.val());
                });
            },
            removeCallback: function() {
                if (findghost.game.vote.callback) {
                    findghost.game.vote.callback.off();
                    findghost.game.vote.callback = undefined;
                }
            }
        },
        out: function(uid, displayName) {
            if (!uid || !displayName) {
                var user = findghost.user.get();
                if (user) {
                    uid = user.uid;
                    displayName = findghost.user.displayName.get();
                }
            }

            findghost.game.status.get(function(status) {
                findghost.game.role.get(uid, function(role) {
                    if (status && (status == findghost.GAME_STATUS.NOT_START || status == findghost.GAME_STATUS.READY)) {
                        if (role) {
                            switch (role) {
                                case findghost.GAME_ROLE.OWNER:
                                    findghost.game.role.owner.remove(function() {
                                        findghost.hall.message.sendGame("“" + displayName + "”" + "不当法官了");
                                        findghost.game.words.remove(function() {});
                                    });
                                    break;
                                case findghost.GAME_ROLE.PLAYER:
                                    findghost.hall.message.sendGame("“" + displayName + "”" + "不玩了");
                                    break;
                                case findghost.GAME_ROLE.WHITE:
                                    findghost.hall.message.sendGame("“" + displayName + "”" + "不当小白了");
                                    break;
                            }
                            wilddog.sync().ref("/game/users/" + uid).remove();
                        }
                    } else {
                        if (role) {
                            switch (role) {
                                case findghost.GAME_ROLE.OWNER:
                                    findghost.hall.message.sendGame("法官“" + displayName + "”" + "很无聊，走了");
                                    break;
                                case findghost.GAME_ROLE.PLAYER:
                                    findghost.game.camp.alive.get(uid, function(result) {
                                        if (result) {
                                            findghost.game.camp.alive.kill(uid, function() {
                                                findghost.hall.message.sendGame("玩家“" + displayName + "”" + "逃跑了，逃跑的路上被活活呸死");
                                            })
                                        } else {
                                            findghost.hall.message.sendGame("玩家“" + displayName + "”" + "拖着自己的尸体走了");
                                        }
                                    })
                                    break;
                                case findghost.GAME_ROLE.WHITE:
                                    findghost.game.camp.alive.get(uid, function(result) {
                                        if (result) {
                                            findghost.game.camp.alive.kill(uid, function() {
                                                findghost.hall.message.sendGame("小白“" + displayName + "”" + "放弃了");
                                                wilddog.sync().ref("/game/users/" + uid).remove()
                                            })
                                        } else {
                                            findghost.hall.message.sendGame("小白“" + displayName + "”" + "拖着自己的尸体走了");
                                        }
                                    });
                                    break;
                            }
                        }
                    }
                });
            });
        },
    }
}