findghost.history = {
    jsNodes: {},
    gameList: {},
    addMessage: function(messages) {
        var count = 0;
        var last = undefined;
        for (mid in messages) {
            count += 1;
            last = mid;
            var messageInfo = messages[mid];
            findghost.history.jsonNodes[mid] = messageInfo;
        }

        return [count, last];
    },
    start_backup: function(callback) {
        var gameName = new Date().getTime();
        var count = undefined;
        var last = undefined;
        findghost.history.jsonNodes = {};
        findghost.db.sync.ref("/hall/message").limitToFirst(500).once("value", function(snapshot) {
            var result = findghost.history.addMessage(snapshot.val());
            count = result[0];
            last = result[1];
            if (count == 500) {
                findghost.history.go_backup(count, last, gameName, callback);
            } else {
                findghost.db.sync.ref("/history").child(gameName).set(findghost.history.jsonNodes, function(error) {
                    if (error == null) {
                        // 建立记录索引
                        findghost.db.sync.ref("last").once("value", function(snapshot) {
                            findghost.db.sync.ref("/history/list").child(gameName).set(snapshot.val(), function(error) {
                                if (error == null) {
                                    findghost.db.sync.ref("/hall/message").remove();
                                    findghost.db.sync.ref("last").remove();
                                    console.log("清理完毕");
                                    if (callback) {
                                        callback();
                                    }
                                } else {
                                    findghost.handleError(error);
                                }
                            });
                        });

                    } else {
                        findghost.handleError(error);
                    }
                });
            }
        });
    },
    go_backup: function(count, last, gameName, callback) {
        findghost.db.sync.ref("/hall/message").orderByKey().startAt(last).limitToFirst(500).once("value", function(snapshot) {
            result = findghost.history.addMessage(snapshot.val());
            count = result[0];
            last = result[1];
            if (count == 500) {
                findghost.history.go_backup(count, last, gameName, callback);
            } else {
                findghost.db.sync.ref("/history").child(gameName).set(findghost.history.jsonNodes, function(error) {
                    if (error == null) {
                        findghost.db.sync.ref("/hall/message").remove();
                        console.log("清理完毕");
                        if (callback) {
                            callback();
                        }
                    }
                });
            }
        });
    },
    read: function(mid, callback) {
        findghost.db.sync.ref("history/" + mid).once("value", function(snapshot) {
            callback(snapshot.val());
        });
    },
    list: function(callback) {
        findghost.db.sync.ref("/history/list").once("value", function(snapshot) {
            callback(snapshot.val());
        });
    }
}