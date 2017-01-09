findghost.game.words = {
    _word: undefined,
    length: function(callback) {
        findghost.game.role.get(undefined, function(gameRole) {
            if (gameRole && gameRole == findghost.GAME_ROLE.WHITE) {
                wilddog.sync().ref("/game/words/ghostWord").once('value', function(snapshot) {
                    if (snapshot && snapshot.val()) {
                        callback(snapshot.val().length);
                    } else {
                        callback(0);
                    }
                });
            } else {
                callback(-1);
            }
        });
    },
    get: function(callback) {
        if (findghost.game.words._word != undefined) {
            callback(findghost.game.words._word);
        } else {
            findghost.game.role.get(undefined, function(gameRole) {
                switch (gameRole) {
                    case undefined:
                    case findghost.GAME_ROLE.WHITE:
                        callback(undefined);
                        break;
                    case findghost.GAME_ROLE.PLAYER:
                        findghost.game.camp.get(function(camp) {
                            switch (camp) {
                                case findghost.game.camp.CAMP.GHOST:
                                    wilddog.sync().ref("/game/words/ghostWord").once('value', function(snapshot) {
                                        findghost.game.words._word = snapshot.val();
                                        callback(findghost.game.words._word);
                                    });
                                    return
                                case findghost.game.camp.CAMP.MAN:
                                    wilddog.sync().ref("/game/words/manWord").once('value', function(snapshot) {
                                        findghost.game.words._word = snapshot.val();
                                        callback(findghost.game.words._word);
                                    });
                                    return
                                case findghost.game.camp.CAMP.WHITE:
                                    findghost.game.words._word = "";
                                    callback(undefined);
                                    return
                            }
                        });
                        break;
                    case findghost.GAME_ROLE.OWNER:
                        wilddog.sync().ref("/game/words/").once('value', function(snapshot) {
                            findghost.game.words._word = snapshot.val();
                            callback(findghost.game.words._word);
                        });
                        break;
                }
            });
        }
    },
    set: function(manWord, ghostWord, callback) {
        findghost.game.role.get(undefined, function(role) {
            if (role && role == findghost.GAME_ROLE.OWNER) {
                var wordInfo = {
                    manWord: manWord,
                    ghostWord: ghostWord
                };
                wilddog.sync().ref("/game/").child("words").set(wordInfo).then(function() {
                    findghost.game.words._word = wordInfo;
                    callback();
                });
            }
        });
    },
    remove: function(callback) {
        wilddog.sync().ref("/game/words").remove();
        findghost.game.words._word = undefined;
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
    },
    guess: function(word, callback) {
        findghost.game.status.get(function(status) {
            if (status && status == findghost.GAME_STATUS.ONGOING) {
                findghost.game.role.get(undefined, function(gameRole) {
                    if (gameRole && gameRole == findghost.GAME_ROLE.WHITE) {
                        findghost.game.camp.alive.get(undefined, function(alive) {
                            if (alive) {
                                var displayName = findghost.user.displayName.get();
                                var uid = findghost.user.uid.get();
                                findghost.hall.message.sendGame(findghost.hall.message.GAME_MESSAGE.GUESS_WORD, [displayName, word], function() {
                                    wilddog.sync().ref("/game/words/manWord").once('value', function(snapshot) {
                                        if (snapshot && snapshot.val()) {
                                            if (snapshot.val() == word) {
                                                findghost.game.end(findghost.GAME_ROLE.WHITE);
                                                callback();
                                            } else {
                                                findghost.hall.message.sendGame(findghost.hall.message.GAME_MESSAGE.GUESS_FAIL, [displayName], function() {
                                                    findghost.game.camp.alive.kill(uid, function() {
                                                        callback();
                                                    });
                                                });
                                            }
                                        }
                                    });
                                });
                            } else {
                                callback();
                            }
                        });
                    } else {
                        callback();
                    }
                });
            } else {
                callback();
            }
        });
    },
    expose: function(message, callback) {
        findghost.game.words.get(function(word) {
            if (word && typeof word === "string") {
                for (c in word) {
                    if (message.indexOf(word[c]) >= 0) {
                        callback(true);
                        return;
                    }
                }
                callback(false);
            } else {
                callback(false);
            }
        });
    },
    clean: function() {
        findghost.game.words._word = undefined;
    }
}