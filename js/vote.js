findghost.game.vote = {
    _callback: undefined,
    STATUS: {
        NOT_START: 0,
        IN_PROGRESS: 1,
        DONE: 2
    },
    target: {
        get: function(callback) {
            var user = findghost.user.get();
            if (user) {
                findghost.game.role.player.alive.get(function(alivePlayers) {
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
            findghost.game.role.player.alive.get(function(alivePlayers) {
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
    result: function(callback) {
        findghost.game.vote.get(function(votes) {
            var voteCount = 0;
            var result = {};
            // 统计票数
            for (uid in votes) {
                voteCount += 1;
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

            findghost.game.role.player.alive.count(function(aliveCount) {
                if (voteCount > aliveCount / 2) {
                    //获取最高票
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

                    //如果已经投票数量大于半数，检查最高票是否提前投死
                    if (max > aliveCount / 2) {
                        // 这个情况max_list只会有1个值
                        findghost.hall.message.sendGame(findghost.hall.message.GAME_MESSAGE.VOTE_EARLY_KILL, [max_list[0][1]], function() {
                            findghost.game.camp.alive.kill(max_list[0][0], function() {
                                findghost.game.vote.remove();
                                if (callback) {
                                    callback(true);
                                }
                            });
                        });
                    } else if (voteCount == aliveCount) {
                        //如果全都投票了，唯一的高票出局
                        if (max_list.length == 1) {
                            findghost.hall.message.sendGame(findghost.hall.message.GAME_MESSAGE.VOTE_RESULT, [max_list[0][1]], function() {
                                findghost.game.camp.alive.kill(max_list[0][0], function() {
                                    findghost.game.vote.remove();
                                    if (callback) {
                                        callback(true);
                                    }
                                });
                            });
                        } else {
                            findghost.hall.message.sendGame(findghost.hall.message.GAME_MESSAGE.VOTE_CONTINUE, [""], function() {
                                findghost.game.vote.remove();
                                if (callback) {
                                    callback(false);
                                }
                            });
                        }
                    } else {
                        if (callback) {
                            callback(false);
                        }
                    }
                } else {
                    if (callback) {
                        callback(false);
                    }
                }
            })
        });
    },
    updateCallback: function(callback) {
        findghost.game.vote.removeCallback();
        findghost.game.vote._callback = findghost.db.sync.ref("/game/vote/");
        findghost.game.vote._callback.on("value", function(snapshot) {
            callback(snapshot.val());
        });
    },
    removeCallback: function() {
        if (findghost.game.vote._callback) {
            findghost.game.vote._callback.off();
            findghost.game.vote._callback = undefined;
        }
    }
}