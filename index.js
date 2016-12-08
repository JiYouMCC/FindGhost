findghost.init();
setInterval(function() {
    findghost.hall.removeSleepUser();
}, 10000);
setInterval(function() {
    var user = findghost.user.getCurrentUser();
    if (user) {
        findghost.hall.in(findghost.user.getUid(), findghost.user.getDisplayName());
        $("#menu_update_display_name").text(findghost.user.getDisplayName());
    }
}, 1000);
$(window).resize(function() {
    $("#left_pannel").height(window.innerHeight - 94);
    $("#messages").height(window.innerHeight - 265);
});
$(window).load(function() {
    $(window).resize();
});
$("#chat").keydown(function(event) {
    if (event.keyCode == 13) {
        $("#button_chat").click();
    }
});
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
findghost.hall.updateMessageCallback(function(snapshot) {
    $("#messages").text("");
    var messages = snapshot.val();
    for (date in messages) {
        var message = messages[date].message;
        var messageType = messages[date].type;
        var dateTime = new Date(parseInt(date));
        if (messageType == findghost.MESSAGE_TYPE.SYSTEM) {
            $("#messages").append(
                $("<div></div>").addClass("text-danger").append(
                    $("<span></span>").text(findghost.formatDate(dateTime) + " ").append(
                        $("<span></span>").text(message)
                    )
                )
            );
        } else if (messageType == findghost.MESSAGE_TYPE.GAME) {
            $("#messages").append(
                $("<div></div>").addClass("text-info").append(
                    $("<span></span>").text(findghost.formatDate(dateTime) + " ")).append(
                    $("<span></span>").text(message)
                )
            );
        } else {
            var userDisplay = messages[date].displayName;
            $("#messages").append(
                $("<div></div>").append(
                    $("<span></span>").text(findghost.formatDate(dateTime) + " ")
                ).append(
                    $("<span></span>").text(userDisplay + "：")
                ).append(
                    $("<span></span>").text(message)
                )
            );
        }
    };
    $("#messages").scrollTop($("#messages").prop("scrollHeight"));
});
findghost.user.updateCallback(function() {
    var user = findghost.user.getCurrentUser();
    findghost.game.getStatus(function(gameStatus) {
        formStatusSetting(user, undefined, gameStatus);
    });

});
findghost.game.updateUserCallback(function(users) {
    $("#gamer_list").text("");
    var count = 0;
    for (uid in users) {
        var displayName = users[uid].displayName;
        var role = users[uid].role
        $("#gamer_list").append(
            $("<li></li>").addClass("list-group-item").text(displayName).append(
                $("<span></span>").addClass("badge").text(role)
            )
        );
        count += 1;
    }

    $("#gamer_count").text(count);
});
findghost.game.updateStatusCallback(function(status) {
    $("#span_game_status").text(status);
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
                    break;
                case findghost.GAME_STATUS.NOT_START:
                case findghost.GAME_STATUS.READY:
                    if (gameRole) {
                        $("#button_cancel").removeAttr('disabled');
                    } else {
                        $("#button_ready_play").removeAttr('disabled');
                        $("#button_ready_white").removeAttr('disabled');
                    }
            }
        }
    } else {
        $("#chat").attr('disabled', 'disabled');
        $("#button_chat").attr('disabled', 'disabled');
        $("#button_ready_play").attr('disabled', 'disabled');
        $("#button_ready_white").attr('disabled', 'disabled');
        $("#button_ready_owner").attr('disabled', 'disabled');
        $("#button_cancel").attr('disabled', 'disabled');
        $("#button_pass").attr('disabled', 'disabled');
        $("#button_white").attr('disabled', 'disabled');
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
        $("#menu_update_display_name").text(findghost.user.getDisplayName());
        $("#modal_register").modal('hide');
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
    findghost.user.login(email, password);
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
    //findghost.game.readyToOwner("1", "2");
});
$("#button_white").click(function() {
    $("#modal_white").modal('show');
    //findghost.game.readyToOwner("1", "2");
});