findghost.init();

findghost.hall.updateUserCallback(function(snapshot) {
    findghost.hall.removeSleepUser();
    $("#user_list").text("");
    var users = snapshot.val();
    for (uid in users) {
        var displayName = users[uid].displayName;
        $("#user_list").append(
            $("<li></li>").addClass("list-group-item").text(displayName));
    }
});

findghost.hall.updateMessageCallback(function(snapshot) {
    $("#messages").text("");
    var messages = snapshot.val();
    for (date in messages) {
        var message = messages[date].message;
        var userDisplay = messages[date].displayName;
        var dateTime = new Date(parseInt(date));
        $("#messages").append($("<div></div>").append(
            $("<span></span>").text(("0" + dateTime.getHours()).slice(-2) + ":" + ("0" + dateTime.getMinutes()).slice(-2) + ":" + ("0" + dateTime.getSeconds()).slice(-2) + " ")
        ).append(
            $("<span></span>").text(userDisplay + ":")
        ).append(
            $("<span></span>").text(message)
        ))
    };
    $("#messages").scrollTop($("#messages").prop("scrollHeight"));
});

findghost.user.updateCallback(function(user) {
    if (user) {
        findghost.hall.in(findghost.user.getUid(), findghost.user.getDisplayName());
    }
})

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
    findghost.hall.out(findghost.user.getUid());
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
    findghost.hall.chat($("#chat").val(), function(){
        $("#chat").val("");
        $("#chat").focus();
    });
});