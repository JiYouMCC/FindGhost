$('[data-toggle="tooltip"]').tooltip();
// init wilddog
findghost.db.init("wilddog", {
    authDomain: "findghost.wilddog.com",
    syncURL: "https://findghost.wilddogio.com"
});

// override error handler
findghost.handleError = function(error) {
    $("#div_error").text(error);
    $("#modal_error").modal('show');
}

// chat windows height setting
$(window).resize(function() {
    $("#left_pannel").height(window.innerHeight - 94);
    $("#messages").height(window.innerHeight - 265);
});

$(window).load(function() {
    $(window).resize();
});

findghost.history.list(function(historirs) {
    $("#history_list").text("");
    for (h in historirs) {
        var history = historirs[h];
        var manWord = history["manWord"];
        var ghostWord = history["ghostWord"];
        var date = new Date(parseInt(h));
        var men = history["men"];
        var ghosts = history["ghosts"];
        var winner = history["winner"];
        var ownerInfo = history["owner"];
        var content = date.getFullYear() + "/" + (date.getMonth() + 1) + "/" + date.getDate() + " " + findghost.formatDate(date);
        $("#history_list").append(
            $("<a></a>").attr("history_id", h).attr("href", "#")
            .addClass('list-group-item')
            .text(content).append(
                $("<span></span>").addClass("label label-primary").text(manWord)
            )
            .append(
                $("<span></span>").addClass("label label-danger").text(ghostWord)
            )
        );
    }

});

$("#history_list").on("click", "a", function(event) {
    var h = $(this).attr("history_id");
    findghost.history.read(h, function(messages) {
        $("#messages").text("");
        for (mid in messages) {
            var messageInfo = messages[mid];
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
        }
    });
});