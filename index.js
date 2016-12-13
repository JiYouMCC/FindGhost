// init wilddog
findghost.init("findghost");

// override error handler
findghost.handleError = function(error) {
    $("#div_error").text(error);
    $("#modal_error").modal('show');
}

// clean sleeping user per 10 secs
setInterval(function() {
    findghost.hall.removeSleepUser();
}, 10000);

// heartbreak
setInterval(function() {
    var user = findghost.user.getCurrentUser();
    if (user) {
        findghost.hall.in(findghost.user.getUid(), findghost.user.getDisplayName());
        $("#menu_update_display_name").text(findghost.user.getDisplayName());
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
findghost.hall.updateUserCallback(function(snapshot) {
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
findghost.hall.updateMessageCallback(function(snapshot) {
    $("#messages").text("");
    var messages = snapshot.val();
    for (date in messages) {
        var message = messages[date].message;
        var messageType = messages[date].type;
        var dateTime = new Date(parseInt(date));
        if (messageType == findghost.MESSAGE_TYPE.SYSTEM) {
            $("#messages").append($("<div></div>").addClass("text-danger").append($("<span></span>").text(findghost.formatDate(dateTime) + " ").append($("<span></span>").text(message))));
        } else if (messageType == findghost.MESSAGE_TYPE.GAME) {
            $("#messages").append($("<div></div>").addClass("text-info").append($("<span></span>").text(findghost.formatDate(dateTime) + " ")).append($("<span></span>").text(message)));
        } else {
            var userDisplay = messages[date].displayName;
            $("#messages").append($("<div></div>").append($("<span></span>").text(findghost.formatDate(dateTime) + " ")).append($("<span></span>").text(userDisplay + "：")).append($("<span></span>").text(message)));
        }
    };
    $("#messages").scrollTop($("#messages").prop("scrollHeight"));
});

// login/logout listener
findghost.user.updateCallback(function(user) {
    findghost.game.getStatus(function(gameStatus) {
        findghost.game.getRole(function(gameRole) {
            formStatusSetting(user, gameRole, gameStatus);
        });
    });
    if (user) {
        // set game role listener
        findghost.game.updateRoleCallback(function(gameRole) {
            findghost.game.getStatus(function(gameStatus) {
                formStatusSetting(user, gameRole, gameStatus);
            });
        })
    } else {
        findghost.game.removeRoleCallback();
        findghost.game.getStatus(function(gameStatus) {
            formStatusSetting(user, undefined, gameStatus);
        });
    }
});

// gamer listener
findghost.game.updateUserCallback(function(users) {
    $("#gamer_list").text("");
    var count = 0;
    for (uid in users) {
        var displayName = users[uid].displayName;
        var role = users[uid].role
        $("#gamer_list").append($("<li></li>").addClass("list-group-item").text(displayName).append($("<span></span>").addClass("badge").text(role)));
        count += 1;
    }
    $("#gamer_count").text(count);
});

// game status listener
findghost.game.updateStatusCallback(function(gameStatus) {
    $("#span_game_status").text(gameStatus);
    var user = findghost.user.getCurrentUser();
    findghost.game.getRole(function(gameRole) {
        formStatusSetting(user, gameRole, gameStatus);
    });
});


function formStatusSetting(user, gameRole, gameStatus) {
    if (user) {
        findghost.hall.in(user.uid, findghost.user.getDisplayName());
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
                    $("#button_ready_white").hide();
                    if (gameRole) {
                        if (gameRole == findghost.GAME_ROLE.PLAYER) {
                            $("#button_pass").show();
                        } else if (gameRole == findghost.GAME_ROLE.WHITE) {
                            $("#button_white").show();
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
            $("#menu_update_display_name").text(findghost.user.getDisplayName());
            $("#modal_register").modal('hide');
        }
    });
});


$("#menu_logout").click(function() {
    findghost.hall.out(findghost.user.getUid(), findghost.user.getDisplayName());
    findghost.user.logout();
});


$("#menu_update_display_name").click(function() {
    $("#display_name").val(findghost.user.getDisplayName());
    $("#modal_update").modal('show');
});


$("#menu_register").click(function() {
    if (!findghost.user.getCurrentUser()) {
        $("#modal_register").modal('show');
    }
});


$("#menu_login").click(function() {
    if (!findghost.user.getCurrentUser()) {
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
    findghost.user.setDisplayName($("#display_name").val(), function() {
        $("#button_update").button('reset');
        $("#menu_update_display_name").text(findghost.user.getDisplayName());
        $('#modal_update').modal('hide');
    });
});

$("#button_chat").click(function() {
    findghost.hall.chat($("#chat").val(), function() {
        $("#chat").val("");
        $("#chat").focus();
    });
});

$("#button_ready_play").click(function() {
    findghost.game.readyToPlay();
});

$("#button_cancel").click(function() {
    findghost.game.outOfGame();
});

$("#button_ready_white").click(function() {
    findghost.game.readyToWhite();
});

$("#button_ready_owner").click(function() {
    $("#modal_owner").modal('show');
});

$("#button_owner_commit").click(function() {
    var manWord = $("#word_man").val();
    var ghostWord = $("#word_ghost").val();
    if (manWord && ghostWord) {
        findghost.game.readyToOwner(manWord, ghostWord, function(result) {
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
    findghost.game.getStatus(function(gameStatus) {
        if (gameStatus && gameStatus == findghost.GAME_STATUS.READY) {
            findghost.game.getRole(function(gameRole) {
                if (gameRole && gameRole == findghost.GAME_ROLE.OWNER) {
                    findghost.game.getWords(function(words) {
                        if (words) {
                            var manWord = words.manWord;
                            var ghostWord = words.ghostWord;
                            if (manWord && ghostWord) {
                                $("#span_start_man_word").text(manWord);
                                $("#span_start_ghost_word").text(ghostWord);
                                playersListener = findghost.game.updatePlayersCallback(function(players) {
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
                                whitesListener = findghost.game.updateWhitesCallback(function(whites){
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

$("#button_start_confirm").click(function(){
    findghost.game.createCamp(function(){
        findghost.game.startRecord(function(){});
    });
});