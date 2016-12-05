var REGISTER_ERROR_MESSAGE = {
    "auth/weak-password":"密码太简单了",
    "auth/email-already-in-use":"这个邮箱地址已经注册过了",
    "auth/invalid-email":"邮箱地址不合法",
    "auth/operation-not-allowed":"目前邮箱地址注册已禁用"
}

function register(name, email, password) {
    firebase.auth().createUserWithEmailAndPassword(email, password).then(function(userData) {
        return {status: true};
    }).catch(function(error) {
        var errorCode = error.code;
        return {status: false, error: REGISTER_ERROR_MESSAGE[errorCode]};
    });
}

function signout() {
    if (firebase.auth().currentUser) {
        firebase.auth().signOut();
    }
}

function signin(email, password) {
    signout();
    firebase.auth().signInWithEmailAndPassword(email, password).then(function(userData) {
        return {status: true};
    }).catch(function(error) {
        var errorCode = error.code;
        var errorMessage = error.message;
        return {status: false, error: errorMessage};
    });
}