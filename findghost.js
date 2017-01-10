var findghost = {
    userSleepTime: 5 * 60 * 1000,
    showMessageCount: 128,
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
    handleError: function(error) {
        console.log(error);
    },
    getCurrentDate: function() {
        var currentDate = undefined;
        findghost.db.sync.ref("/.info/serverTimeOffset").once('value', function(snapshot) {
            currentDate = (new Date).getTime() + snapshot.val();
        })
        while (currentDate) {
            return currentDate;
        }
    },
    formatDate: function(date) {
        return ("0" + date.getHours()).slice(-2) + ":" + ("0" + date.getMinutes()).slice(-2) + ":" + ("0" + date.getSeconds()).slice(-2) + " ";
    },
    formatString: function() {
        var str = this;
        for (var i = 0; i < arguments.length; i++) {
            var reg = new RegExp("\\{" + i + "\\}", "gm");
            str = str.replace(reg, arguments[i]);
        }
        return str;
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
                if (displayName.length <= 0) {
                    findghost.handleError("昵称不能为空");
                    return;
                }

                if (displayName.length > 10) {
                    findghost.handleError("昵称太长了");
                    return;
                }
                var user = findghost.user.get();
                if (user) {
                    var oldDisplay = findghost.user.displayName.get();
                    findghost.db.auth.currentUser.updateProfile({
                        displayName: displayName
                    }).then(function(user) {
                        findghost.hall.message.sendSystem(findghost.hall.message.SYSTEM_MESSAGE.RENAME, [oldDisplay, displayName]);
                        callback(user);
                    }).catch(function(error) {
                        findghost.handleError(error);
                        callback(undefined);
                    });
                }
            }
        },
        get: function() {
            return findghost.db.auth.currentUser;
        },
        register: function(email, password, callback) {
            var user = findghost.user.get();
            if (!user) {
                findghost.db.auth.createUserWithEmailAndPassword(email, password).then(function(user) {
                    findghost.hall.message.sendSystem(findghost.hall.message.SYSTEM_MESSAGE.REGISTER, [user.email.split('@')[0]]);
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
                findghost.db.auth.signInWithEmailAndPassword(email, password).then(function(user) {
                    findghost.hall.message.sendSystem(findghost.hall.message.SYSTEM_MESSAGE.LOGIN, [findghost.user.displayName.get()]);
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
                findghost.db.auth.signOut().catch(function(error) {
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
            findghost.db.auth.onAuthStateChanged(callback);
        }
    },
    hall: {
        user: {
            clear: function() {
                var user = findghost.user.get();
                if (user) {
                    var currentDate = findghost.getCurrentDate();
                    findghost.db.sync.ref("/hall/users/").once("value", function(snapshot) {
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
                findghost.db.sync.ref("/hall/users").on("value", callback);
            },
        },
        message: {
            TYPE: {
                SYSTEM: 0,
                CHAT: 1,
                GAME: 2,
                PLAYER: 3,
            },
            SYSTEM_MESSAGE: {
                LEAVE: 0,
                RENAME: 1,
                REGISTER: 2,
                LOGIN: 3
            },
            SYSTEM_MESSAGE_TXT: [
                "“{0}”离开了。",
                "“{0}”改名为“{1}”。",
                "“{0}”加入了游戏。",
                "“{0}”回来了。"
            ],
            GAME_MESSAGE: {
                START: 0,
                END: 1,
                MAN_WORD: 2,
                GHOST_WORD: 3,
                MEN: 4,
                GHOST: 5,
                READY_PLAY: 6,
                READY_WHITE: 7,
                READY_OWNER: 8,
                GUESS_WORD: 9,
                GUESS_FAIL: 10,
                EXPOSE: 11,
                CONTINUE: 12,
                VOTE: 13,
                VOTE_RESULT: 14,
                VOTE_CONTINUE: 15,
                OWNER_GIVE_UP: 16,
                PLAYER_GIVE_UP: 17,
                WHITE_GIVE_UP: 18,
                OWNER_LEAVE: 19,
                PLAYER_RUN: 20,
                PLAYER_LEAVE: 21,
                WHITE_RUN: 22,
                WHITE_LEAVE: 23
            },
            GAME_MESSAGE_TXT: [
                "游戏开始了，请大家确认自己发到的词！现在场上出现了{0}个鬼，它们和{1}个人混在一起，但是谁都不知道自己是人还是鬼，大家加油把它们抓出来吧！",
                "游戏结束, {0}赢了！",
                "人词：{0}",
                "鬼词：{0}",
                "人：{0}",
                "鬼：{0}",
                "“{0}”要抓鬼！",
                "“{0}”要当小白！",
                "“{0}”已经提交了词，要当法官。",
                "小白“{0}”猜人词是“{1}”。",
                "天雷滚滚，一道闪电把小白“{0}”劈死了……",
                "“{0}”发出了一声嚎叫，筋脉尽断，自爆而亡！",
                "游戏继续进行。",
                "“{0}”指认“{1}”是鬼！",
                "“{0}”就这么被投死了，那么问题来了，Ta到底是不是鬼呢？",
                "大家争吵很激烈，不能确定谁是鬼，本次投票作废。",
                "“{0}”不当法官了。",
                "“{0}”不玩了。",
                "“{0}”不当小白了。",
                "法官“{0}”很无聊，走了。",
                "玩家“{0}”逃跑了，Ta在逃跑的路上被活活呸死~~",
                "玩家“{0}”拖着自己的尸体走了……",
                "小白“{0}”放弃了……",
                "小白“{0}”拖着自己的尸体走了……"
            ],
            send: function(uid, displayName, message, type, color, callback) {
                var messageRef = findghost.db.sync.ref("/hall/message");
                if (callback) {
                    callback();
                }
                messageRef.push({
                    "uid": uid,
                    "uname": displayName,
                    "type": type,
                    "date": findghost.db.timestamp,
                    "msg": message,
                    "color": color
                });
            },
            sendSystem: function(messageCode, params, callback) {
                findghost.hall.message.send("", params, messageCode, findghost.hall.message.TYPE.SYSTEM, "", callback);
            },
            sendGame: function(messageCode, params, callback) {
                findghost.hall.message.send("", params, messageCode, findghost.hall.message.TYPE.GAME, "", callback);
            },
            sendChat: function(message, color, callback) {
                if (!message) {
                    return;
                }

                var user = findghost.user.get();
                if (user) {
                    findghost.game.words.expose(message, function(expose) {
                        if (expose) {
                            findghost.handleError("爆词了！不能发送！");
                        } else {
                            findghost.hall.message.send(user.uid, findghost.user.displayName.get(), message, findghost.hall.message.TYPE.CHAT, color, callback);
                        }
                    });
                }
            },
            sendPlayer: function(message, callback) {
                var user = findghost.user.get();
                if (user) {
                    findghost.hall.message.send(user.uid, findghost.user.displayName.get(), message, findghost.hall.message.TYPE.PLAYER, callback);
                }
            },
            parseMessage: function(messages, messageCode, params) {
                if (messageCode >= 0 && messageCode < messages.length) {
                    return findghost.formatString.apply(messages[messageCode], params);
                }
            },
            addCallback: function(callback) {
                findghost.db.sync.ref("/hall/message").orderByKey().limitToLast(findghost.showMessageCount).on("child_added", callback);
            }
        },
        out: function(uid, displayName) {
            findghost.game.out(uid, displayName);
            findghost.db.sync.ref("/hall/users/" + uid).remove();
            findghost.hall.message.sendSystem(findghost.hall.message.SYSTEM_MESSAGE.LEAVE, [displayName]);
        },
        in : function(uid, displayName) {
            findghost.db.sync.ref("/hall/users/").child(uid).set({
                "displayName": displayName,
                "date": findghost.db.timestamp
            });
        }
    },
    game: {
        start: function(callback) {
            findghost.game.camp.man.count(function(manCount) {
                findghost.game.camp.ghost.count(function(ghostCount) {
                    findghost.hall.message.sendGame(findghost.hall.message.GAME_MESSAGE.START, [ghostCount, manCount], callback);
                });
            });
        },
        end: function(winer) {
            findghost.hall.message.sendGame(findghost.hall.message.GAME_MESSAGE.END, [winer], function() {
                findghost.game.words.getAll(function(words) {
                    var manWord = words.manWord;
                    var ghostWord = words.ghostWord;
                    if (manWord && ghostWord) {
                        findghost.hall.message.sendGame(findghost.hall.message.GAME_MESSAGE.MAN_WORD, [manWord], function() {
                            findghost.hall.message.sendGame(findghost.hall.message.GAME_MESSAGE.GHOST_WORD, [ghostWord], function() {
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
                                        findghost.hall.message.sendGame(findghost.hall.message.GAME_MESSAGE.MEN, [men_str], function() {
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
                                                    findghost.hall.message.sendGame(findghost.hall.message.GAME_MESSAGE.GHOST, [ghost_str], function() {
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
                findghost.db.sync.ref("/game/users/").child(uid).set({
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
                    findghost.db.sync.ref("/game/users/" + uid).once("value", function(snapshot) {
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
                    findghost.db.sync.ref("game/users").orderByChild("role").equalTo(findghost.GAME_ROLE.PLAYER).once('value', function(snapshot) {
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
                                    findghost.hall.message.sendGame(findghost.hall.message.GAME_MESSAGE.READY_PLAY, [displayName]);
                                });
                            }
                        });
                    }
                },
                updateCallback: function(callback) {
                    var playersListener = findghost.db.sync.ref("game/users").orderByChild("role").equalTo(findghost.GAME_ROLE.PLAYER);
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
                    findghost.db.sync.ref("game/users").orderByChild("role").equalTo(findghost.GAME_ROLE.PLAYER).once('value', function(snapshot) {
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
                    findghost.db.sync.ref("game/users").orderByChild("role").equalTo(findghost.GAME_ROLE.WHITE).once('value', function(snapshot) {
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
                                    //findghost.db.sync.ref("/game/users/" + uid).child("alive").set(true);
                                    findghost.game.status.get(function(status) {
                                        if (status && status == findghost.GAME_STATUS.NOT_START) {
                                            findghost.game.status.set(findghost.GAME_STATUS.READY);
                                        }
                                    })
                                    findghost.hall.message.sendGame(findghost.hall.message.GAME_MESSAGE.READY_WHITE, [displayName]);
                                });
                            }
                        });
                    }
                },
                updateCallback: function(callback) {
                    var whitesListener = findghost.db.sync.ref("game/users").orderByChild("role").equalTo(findghost.GAME_ROLE.WHITE);
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
                    findghost.db.sync.ref("/game/owner/").once("value", function(snapshot) {
                        callback(snapshot.val());
                    });
                },
                set: function(uid, displayName, callback) {
                    findghost.db.sync.ref("/game/").child("owner").set({
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
                                            findghost.hall.message.sendGame(findghost.hall.message.GAME_MESSAGE.READY_OWNER, [displayName]);
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
                    findghost.db.sync.ref("/game/owner").remove();
                    if (callback) {
                        callback();
                    }
                },
            },
            updateCallback: function(callback) {
                var user = findghost.user.get();
                if (user) {
                    findghost.game.role.callback = findghost.db.sync.ref("/game/users/" + user.uid + "/role");
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
            set: function(status, callback) {
                findghost.db.sync.ref("/game/").child("status").set(status).then(callback);
            },
            get: function(callback) {
                findghost.db.sync.ref("/game/status").once('value', function(snapshot) {
                    var result = snapshot.val();
                    if (result) {
                        callback(result);
                    } else {
                        callback(findghost.GAME_STATUS.NOT_START);
                    }
                });
            },
            updateCallback: function(callback) {
                findghost.db.sync.ref("/game/status").on("value", function(snapshot) {
                    callback(snapshot.val());
                });
            }
        },
        user: {
            get: function(callback) {
                findghost.db.sync.ref("/game/users").once('value', function(snapshot) {
                    callback(snapshot.val());
                });
            },
            updateCallback: function(callback) {
                findghost.db.sync.ref("/game/users").orderByChild("role").on("value", function(snapshot) {
                    var users = snapshot.val();
                    callback(users);
                });
            },
            removeAll: function(callback) {
                findghost.db.sync.ref("/game/users").remove();
                if (callback) {
                    callback();
                }
            }
        },
        camp: {
            CAMP: {
                MAN: 0,
                GHOST: 1
            },
            get: function(callback) {
                var user = findghost.user.get();
                if (user) {
                    findghost.db.sync.ref("/game/camp/" + user.uid + "/camp").once('value', function(snapshot) {
                        var result = snapshot.val();
                        callback(result);
                    });
                }
                callback(undefined);
            },
            remove: function(callback) {
                findghost.db.sync.ref("/game/camp").remove();
                if (callback) {
                    callback();
                }
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
                                        findghost.db.sync.ref("/game/users/" + uid).child("alive").set(true);
                                        if (ghostList.indexOf(index) < 0) {
                                            camp = findghost.game.camp.CAMP.MAN;
                                        } else {
                                            camp = findghost.game.camp.CAMP.GHOST;
                                        }

                                        findghost.db.sync.ref("/game/camp/").child(uid).set({
                                            no: index,
                                            displayName: displayName,
                                            camp: camp,
                                            alive: true
                                        });
                                    }

                                    findghost.game.status.set(findghost.GAME_STATUS.ONGOING, callback);
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
                                                findghost.db.sync.ref("/game/camp/" + uid + "/alive").once('value', function(snapshot) {
                                                    callback(snapshot.val());
                                                });
                                                break;
                                            case findghost.GAME_ROLE.WHITE:
                                                findghost.db.sync.ref("/game/users/" + uid + "/alive").once('value', function(snapshot) {
                                                    if (snapshot && snapshot.val() == false) {
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
                                                break;
                                            case findghost.GAME_ROLE.PLAYER:
                                                findghost.db.sync.ref("/game/camp/" + uid).child("alive").set(value).then(function() {
                                                    findghost.db.sync.ref("/game/users/" + uid).child("alive").set(value).then(callback);
                                                });
                                                break;
                                            case findghost.GAME_ROLE.WHITE:
                                                findghost.db.sync.ref("/game/users/" + uid).child("alive").set(value).then(callback);
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
                                findghost.game.end(winer);
                            } else {
                                findghost.hall.message.sendGame(findghost.hall.message.GAME_MESSAGE.CONTINUE, []);
                            }
                            if (callback) {
                                callback();
                            }
                        })
                    })
                }
            },
            man: {
                get: function(callback) {
                    findghost.db.sync.ref("/game/camp/").orderByChild("camp").equalTo(findghost.game.camp.CAMP.MAN).once('value', function(snapshot) {
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
                    findghost.db.sync.ref("/game/camp/").orderByChild("camp").equalTo(findghost.game.camp.CAMP.GHOST).once('value', function(snapshot) {
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
                                callback(true, "人");
                            } else if (aliveGhostCount >= aliveManCount) {
                                callback(true, "鬼");
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
                NOT_START: 0,
                IN_PROGRESS: 1,
                DONE: 2
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
                findghost.db.sync.ref("/game/vote").once('value', function(snapshot) {
                    callback(snapshot.val());
                });
            },
            set: function(tid, tDisplayName, callback) {
                var uid = findghost.user.uid.get();
                if (uid) {
                    var displayName = findghost.user.displayName.get();
                    findghost.game.role.player.getAlive(function(alivePlayers) {
                        if (alivePlayers && alivePlayers.hasOwnProperty(uid) && alivePlayers.hasOwnProperty(tid)) {
                            findghost.db.sync.ref("/game/vote").child(uid).set({
                                uid: tid,
                                displayName: tDisplayName
                            }).then(function() {
                                findghost.hall.message.sendGame(findghost.hall.message.GAME_MESSAGE.VOTE, [displayName, tDisplayName]);
                                if (callback) {
                                    callback();
                                }
                            });
                        } else {
                            callback(undefined);
                        }
                    });
                } else {
                    callback(undefined);
                }
            },
            remove: function(callback) {
                findghost.db.sync.ref("/game/vote").remove()
                if (callback) {
                    callback();
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
                                var tid = votes[uid].uid;
                                var displayName = votes[uid].displayName;
                                if (result.hasOwnProperty(tid)) {
                                    result[tid].count += 1;
                                } else {
                                    result[tid] = {
                                        displayName: displayName,
                                        count: 1
                                    };
                                }
                            }

                            var max = 0;
                            var max_list = [];
                            for (tid in result) {
                                if (result[tid].count > max) {
                                    max = result[tid].count;
                                    max_list = [
                                        [tid, result[tid].displayName]
                                    ];
                                } else if (result[tid].count == max) {
                                    max_list.push([tid, result[tid].displayName]);
                                }
                            }
                            if (max_list.length == 1) {
                                findghost.hall.message.sendGame(findghost.hall.message.GAME_MESSAGE.VOTE_RESULT, [max_list[0][1]], function() {
                                    findghost.game.camp.alive.kill(max_list[0][0], function() {
                                        findghost.game.vote.remove();
                                    });
                                });
                            } else {
                                findghost.hall.message.sendGame(findghost.hall.message.GAME_MESSAGE.VOTE_CONTINUE, "", function() {
                                    findghost.game.vote.remove();
                                });
                            }
                            if (callback) {
                                callback(true);
                            }
                        });
                    } else {
                        if (callback) {
                            callback(false);
                        }
                    }
                });
            },
            updateCallback: function(callback) {
                findghost.game.vote.callback = findghost.db.sync.ref("/game/vote/");
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
                                        findghost.hall.message.sendGame(findghost.hall.message.GAME_MESSAGE.OWNER_GIVE_UP, [displayName]);
                                        findghost.game.words.remove(function() {});
                                    });
                                    break;
                                case findghost.GAME_ROLE.PLAYER:
                                    findghost.hall.message.sendGame(findghost.hall.message.GAME_MESSAGE.PLAYER_GIVE_UP, [displayName]);
                                    break;
                                case findghost.GAME_ROLE.WHITE:
                                    findghost.hall.message.sendGame(findghost.hall.message.GAME_MESSAGE.WHITE_GIVE_UP, [displayName]);
                                    break;
                            }
                            findghost.db.sync.ref("/game/users/" + uid).remove();
                        }
                    } else {
                        if (role) {
                            switch (role) {
                                case findghost.GAME_ROLE.OWNER:
                                    findghost.hall.message.sendGame(findghost.hall.message.GAME_MESSAGE.OWNER_LEAVE, [displayName]);
                                    break;
                                case findghost.GAME_ROLE.PLAYER:
                                    findghost.game.camp.alive.get(uid, function(result) {
                                        if (result) {
                                            findghost.game.camp.alive.kill(uid, function() {
                                                findghost.hall.message.sendGame(findghost.hall.message.GAME_MESSAGE.PLAYER_RUN, [displayName]);
                                            })
                                        } else {
                                            findghost.hall.message.sendGame(findghost.hall.message.GAME_MESSAGE.PLAYER_LEAVE, [displayName]);
                                        }
                                    })
                                    break;
                                case findghost.GAME_ROLE.WHITE:
                                    findghost.game.camp.alive.get(uid, function(result) {
                                        if (result) {
                                            findghost.game.camp.alive.kill(uid, function() {
                                                findghost.hall.message.sendGame(findghost.hall.message.GAME_MESSAGE.WHITE_RUN, [displayName]);
                                                findghost.db.sync.ref("/game/users/" + uid).remove()
                                            })
                                        } else {
                                            findghost.hall.message.sendGame(findghost.hall.message.GAME_MESSAGE.WHITE_LEAVE, [displayName]);
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
