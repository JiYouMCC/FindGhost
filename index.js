$('[data-toggle="tooltip"]').tooltip();
// init wilddog
findghost.init("zhuagui");

// override error handler
findghost.handleError = function(error) {
    $("#div_error").text(error);
    $("#modal_error").modal('show');
}

// clean sleeping user per 10 secs
setInterval(function() {
    findghost.hall.user.clear();
}, 10000);

// heartbreak
setInterval(function() {
    var user = findghost.user.get();
    if (user) {
        findghost.hall.in(findghost.user.uid.get(), findghost.user.displayName.get());
        $("#menu_update_display_name").text(findghost.user.displayName.get());
    }
}, 1000);

// chat windows height setting
$(window).resize(function() {
    $("#left_pannel").height(window.innerHeight - 94);
    $("#messages").height(window.innerHeight - 265);
});
$(window).load(function() {
    $(window).resize();
});

// chat input enter event
$("#chat").keydown(function(event) {
    if (event.keyCode == 13) {
        $("#button_chat").click();
    }
});

// online user listener
findghost.hall.user.updateCallback(function(snapshot) {
    $("#user_list").text("");
    var users = snapshot.val();
    var count = 0;
    for (uid in users) {
        var displayName = users[uid].displayName;
        $("#user_list").append($("<li></li>").addClass("list-group-item").text(displayName));
        count += 1;
    }
    $("#online_count").text(count);
});

// message listener
findghost.hall.message.addCallback(function(snapshot) {
    var messageInfo = snapshot.val();
    var date = messageInfo.date;
    var message = messageInfo.msg;
    var messageType = messageInfo.type;
    var dateTime = new Date(parseInt(date));
    if (messageType == findghost.hall.message.TYPE.SYSTEM) {
        var params = messageInfo.uname;
        var messageTxt = findghost.hall.message.parseMessage(findghost.hall.message.SYSTEM_MESSAGE_TXT, message, params);
        $("#messages").append(
            $("<div></div>").addClass("text-danger").append(
                $("<span></span>").text("【系统消息】").append(
                    $("<span></span>").text(messageTxt)
                )
            )
        );
    } else if (messageType == findghost.hall.message.TYPE.GAME) {
        var params = messageInfo.uname;
        var messageTxt = findghost.hall.message.parseMessage(findghost.hall.message.GAME_MESSAGE_TXT, message, params);
        $("#messages").append(
            $("<div></div>").addClass("text-info").append(
                $("<span></span>").text("【游戏信息】").append(
                    $("<span></span>").text(messageTxt)
                )
            )
        );
    } else {
        var userDisplay = messageInfo.uname;
        var color = messageInfo.color;
        $("#messages").append($("<div></div>").append($("<span></span>").text(findghost.formatDate(dateTime) + " ")).append($("<span></span>").attr("style", "color:" + color).text(userDisplay + "：")).append($("<span></span>").attr("style", "color:" + color).text(message)));
    }
    if ($("#checkbox_autoscroll").is(':checked')) {
        $("#messages").scrollTop($("#messages").prop("scrollHeight"));
    }
});

// login/logout listener
findghost.user.updateCallback(function(user) {
    findghost.game.status.get(function(gameStatus) {
        findghost.game.role.get(undefined, function(gameRole) {
            formStatusSetting(user, gameRole, gameStatus);
        });
    });
    if (user) {
        // set game role listener
        findghost.game.role.updateCallback(function(gameRole) {
            findghost.game.status.get(function(gameStatus) {
                formStatusSetting(user, gameRole, gameStatus);
            });
        })
    } else {
        findghost.game.role.removeCallback();
        findghost.game.status.get(function(gameStatus) {
            formStatusSetting(user, undefined, gameStatus);
        });
    }
});

// gamer listener
findghost.game.user.updateCallback(function(users) {
    $("#gamer_list").text("");
    var count = 0;
    for (uid in users) {
        var displayName = users[uid].displayName;
        var role = users[uid].role;
        var alive = users[uid].alive;
        var aliveClass = "list-group-item";
        if (alive == true) {
            aliveClass += " list-group-item-success";
        } else if (alive == false) {
            aliveClass += " list-group-item-danger";
        }
        $("#gamer_list").append(
            $("<li></li>").addClass(aliveClass).text(displayName).append(
                $("<span></span>").attr("id", "gamer_vote_" + uid)
            ).append(
                $("<span></span>").addClass("badge").text(role)
            )
        );
        count += 1;
    }
    $("#gamer_count").text(count);
    updateVoteSelect();
});

function updateVoteSelect() {
    findghost.game.status.get(function(status) {
        if (status && status == findghost.GAME_STATUS.ONGOING) {
            findghost.game.role.get(undefined, function(role) {
                if (role && role == findghost.GAME_ROLE.PLAYER) {
                    $("#select_vote").text("");
                    findghost.game.vote.target.get(function(alivePlayers) {
                        for (uid in alivePlayers) {
                            $("#select_vote").append($("<option></option>").attr("value", uid).text(alivePlayers[uid].displayName));
                        }
                    });
                }
            });
        }
    })
}

// game status listener
findghost.game.status.updateCallback(function(gameStatus) {
    $("#span_game_status").text(gameStatus);
    var user = findghost.user.get();
    findghost.game.role.get(undefined, function(gameRole) {
        formStatusSetting(user, gameRole, gameStatus);
    });
});


function formStatusSetting(user, gameRole, gameStatus) {
    $("#span_word").text("");
    if (user) {
        findghost.hall.in(user.uid, findghost.user.displayName.get());
        $("#button_login").button('reset');
        $("#button_register").button('reset');
        $('#modal_login').modal('hide');
        $('#modal_register').modal('hide');
        $("#button_logout").show();
        $("#menu_online").hide();
        $("#chat").removeAttr('disabled');
        $("#button_chat").removeAttr('disabled');
        if (gameStatus) {
            switch (gameStatus) {
                case findghost.GAME_STATUS.ONGOING:
                    $("#modal_start").modal('hide');
                    $("#button_ready_play").hide();
                    $("#button_ready_owner").hide();
                    $("#button_cancel").hide();
                    $("#button_start").hide();
                    $("#button_white").hide();
                    $("#button_pass").hide();
                    $("#button_vote").hide();
                    $("#select_vote").hide();
                    $("#button_ready_white").hide();
                    if (gameRole) {
                        if (gameRole == findghost.GAME_ROLE.PLAYER) {
                            findghost.game.camp.alive.get(user.uid, function(alive) {
                                if (alive) {
                                    $("#button_pass").show();
                                    $("#button_vote").show();
                                    $("#select_vote").show();
                                    updateVoteSelect();
                                }
                            });
                            findghost.game.words.get(function(word) {
                                if (word) {
                                    $("#span_word").text("你的词:" + word);
                                }
                            });
                        } else if (gameRole == findghost.GAME_ROLE.WHITE) {
                            findghost.game.camp.alive.get(user.uid, function(alive) {
                                if (alive) {
                                    $("#button_white").show();
                                    $("#button_cancel").show();
                                }

                                findghost.game.words.length(function(length) {
                                    if (length) {
                                        $("#span_word").text("字数:" + length);
                                    }
                                })
                            });
                        }
                    } else {
                        $("#button_ready_white").show();
                    }

                    break;
                case findghost.GAME_STATUS.NOT_START:
                case findghost.GAME_STATUS.READY:
                    if (gameRole) {
                        $("#button_cancel").show();
                        $("#button_ready_play").hide();
                        $("#button_ready_white").hide();
                        $("#button_ready_owner").hide();
                        if (gameStatus == findghost.GAME_STATUS.READY && gameRole == findghost.GAME_ROLE.OWNER) {
                            $("#button_start").show();
                        } else {
                            $("#button_start").hide();
                        }
                    } else {
                        $("#button_ready_play").show();
                        $("#button_ready_white").show();
                        $("#button_ready_owner").show();
                        $("#button_cancel").hide();
                        $("#button_start").hide();
                    }
                    $("#button_pass").hide();
                    $("#button_vote").hide();
                    $("#select_vote").hide();
                    $("#button_white").hide();
            }
        }
    } else {
        $("#chat").attr('disabled', 'disabled');
        $("#button_chat").attr('disabled', 'disabled');
        $("#button_ready_play").hide();
        $("#button_ready_white").hide();
        $("#button_ready_owner").hide();
        $("#button_start").hide();
        $("#button_cancel").hide();
        $("#button_pass").hide();
        $("#button_vote").hide();
        $("#select_vote").hide();
        $("#button_white").hide();
        $("#button_logout").hide();
        $("#menu_online").show();
    }
};


$("#button_register").click(function() {
    var email = $("#register_email").val();
    var password = $("#register_password").val();
    var password_rp = $("#register_password_rp").val();
    if (password != password_rp) {
        alert("两次密码输入不一样");
        return;
    }
    findghost.user.register(email, password, function(user) {
        $("#button_register").button('reset');
        if (user) {
            $("#menu_update_display_name").text(findghost.user.displayName.get());
            $("#modal_register").modal('hide');
        }
    });
});


$("#menu_logout").click(function() {
    findghost.hall.out(findghost.user.uid.get(), findghost.user.displayName.get());
    findghost.user.logout();
});


$("#menu_update_display_name").click(function() {
    $("#display_name").val(findghost.user.displayName.get());
    $("#modal_update").modal('show');
});


$("#menu_register").click(function() {
    if (!findghost.user.get()) {
        $("#modal_register").modal('show');
    }
});


$("#menu_login").click(function() {
    if (!findghost.user.get()) {
        $("#modal_login").modal('show');
    }
});


$("#button_login").click(function() {
    $("#button_login").button('loading');
    var email = $("#login_email").val();
    var password = $("#login_password").val();
    findghost.user.login(email, password, function() {
        $("#button_login").button('reset');
    });
});

$("#button_update_display_name").click(function() {
    $("#button_update").button('loading');
    findghost.user.displayName.set($("#display_name").val(), function() {
        $("#button_update").button('reset');
        $("#menu_update_display_name").text(findghost.user.displayName.get());
        $('#modal_update').modal('hide');
    });
});

$("#button_chat").click(function() {
    findghost.hall.message.sendChat($("#chat").val(), $("#input_color").val(), function() {
        $("#chat").val("");
        $("#chat").focus();
    });
});

$("#button_ready_play").click(function() {
    findghost.game.role.player.ready();
});

$("#button_cancel").click(function() {
    findghost.game.out();
});

$("#button_ready_white").click(function() {
    findghost.game.role.white.ready();
});

$("#button_ready_owner").click(function() {
    $("#modal_owner").modal('show');
});

$("#button_owner_commit").click(function() {
    var manWord = $("#word_man").val();
    var ghostWord = $("#word_ghost").val();
    var error = findghost.game.words.check(manWord, ghostWord);
    if (error) {
        findghost.handleError(error);
    } else {
        findghost.game.role.owner.ready(manWord, ghostWord, function(result) {
            if (result) {
                $("#modal_owner").modal('hide');
            }
        });
    }
});

$("#button_white").click(function() {
    $("#modal_white").modal('show');
});


var playersListener = undefined;
var whitesListener = undefined;

$("#button_start").click(function() {
    findghost.game.status.get(function(gameStatus) {
        if (gameStatus && gameStatus == findghost.GAME_STATUS.READY) {
            findghost.game.role.get(undefined, function(gameRole) {
                if (gameRole && gameRole == findghost.GAME_ROLE.OWNER) {
                    findghost.game.words.get(function(words) {
                        if (words) {
                            var manWord = words.manWord;
                            var ghostWord = words.ghostWord;
                            if (manWord && ghostWord) {
                                $("#span_start_man_word").text(manWord);
                                $("#span_start_ghost_word").text(ghostWord);
                                playersListener = findghost.game.role.player.updateCallback(function(players) {
                                    var player_count = 0;
                                    $("#span_start_player_list").text("");
                                    if (players) {
                                        var users_str = "";
                                        for (uid in players) {
                                            if (player_count > 0) {
                                                users_str += "，"
                                            }
                                            users_str += players[uid].displayName;
                                            player_count += 1
                                        }
                                        $("#span_start_player_list").text(users_str);
                                    }
                                    if (player_count < 3) {
                                        $("#button_start_confirm").attr('disabled', 'disabled');
                                        $("#span_man_count").text(0);
                                        $("#span_ghost_count").text(0);
                                    } else {
                                        $("#button_start_confirm").removeAttr("disabled");
                                        var ghost_count = Math.floor(player_count * 0.4);
                                        var man_count = player_count - ghost_count;
                                        $("#span_man_count").text(man_count);
                                        $("#span_ghost_count").text(ghost_count);
                                    }
                                });
                                whitesListener = findghost.game.role.white.updateCallback(function(whites) {
                                    $("#span_start_white_list").text("");
                                    if (whites) {
                                        var white_str = "";
                                        var white_count = 0;
                                        for (uid in whites) {
                                            if (white_count > 0) {
                                                white_str += "，"
                                            }
                                            white_str += whites[uid].displayName;
                                            white_count += 1
                                        }
                                    }
                                    $("#span_start_white_list").text(white_str);
                                })
                                $("#modal_start").modal('show');
                            }
                        }
                    });
                }
            });
        }
    });
});

$("#button_start_confirm").click(function() {
    findghost.game.camp.create(function() {
        findghost.game.start(function() {});
    });
});

$("#menu_rule").click(function() {
    $("#modal_rule").modal('show');
});

$("#button_vote").click(function() {
    findghost.game.vote.set($("#select_vote").val(), $("#select_vote option:selected").text(), function() {
        findghost.game.vote.result();
    });
});


findghost.game.vote.updateCallback(function(votes) {
    $("span[id^='gamer_vote_']").text("");
    for (uid in votes) {
        var tid = votes[uid].uid;
        $("#gamer_vote_" + tid).append(
            $("<div></div>").addClass("glyphicon glyphicon-hand-left")
        );
    }
});

$("#button_white_commit").click(function() {
    $("#button_white_commit").button('loading');
    findghost.game.words.guess($("#word_white").val(), function() {
        $("#button_white_commit").button('reset');
        $('#modal_white').modal('hide');
        findghost.game.status.get(function(gameStatus) {
            findghost.game.role.get(undefined, function(gameRole) {
                formStatusSetting(findghost.user.get(), gameRole, gameStatus);
            });
        });
    })
});
