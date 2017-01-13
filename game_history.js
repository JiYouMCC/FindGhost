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
    $("#history_messages").height(window.innerHeight - 265);
});
$(window).load(function() {
    $(window).resize();
});

$("#list-container").empty();
findghost.gameHistory.list(null);