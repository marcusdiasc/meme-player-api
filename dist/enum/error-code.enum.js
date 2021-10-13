"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorCode = void 0;
var ErrorCode;
(function (ErrorCode) {
    ErrorCode[ErrorCode["INTERNAL_ERROR"] = 0] = "INTERNAL_ERROR";
    ErrorCode[ErrorCode["USERNAME_EXISTS"] = 1] = "USERNAME_EXISTS";
    ErrorCode[ErrorCode["EMAIL_EXISTS"] = 2] = "EMAIL_EXISTS";
    ErrorCode[ErrorCode["PASSWORD_DIFFERENT"] = 3] = "PASSWORD_DIFFERENT";
    ErrorCode[ErrorCode["INVALID_USERNAME"] = 4] = "INVALID_USERNAME";
    ErrorCode[ErrorCode["INVALID_PASSWORD"] = 5] = "INVALID_PASSWORD";
    ErrorCode[ErrorCode["INVALID_FILE_DURATION"] = 6] = "INVALID_FILE_DURATION";
    ErrorCode[ErrorCode["INVALID_FILE_EXTENSION"] = 7] = "INVALID_FILE_EXTENSION";
    ErrorCode[ErrorCode["MEME_DOENST_EXISTS"] = 8] = "MEME_DOENST_EXISTS";
    ErrorCode[ErrorCode["MEME_ALREADY_LIKED"] = 9] = "MEME_ALREADY_LIKED";
    ErrorCode[ErrorCode["MEME_ALREADY_UNLIKED"] = 10] = "MEME_ALREADY_UNLIKED";
    ErrorCode[ErrorCode["ACTION_NOT_ALLOWED"] = 11] = "ACTION_NOT_ALLOWED";
    ErrorCode[ErrorCode["EMPTY_TITLE"] = 11] = "EMPTY_TITLE";
    ErrorCode[ErrorCode["ALREADY_CREATED"] = 12] = "ALREADY_CREATED";
    ErrorCode[ErrorCode["SPACE_NOT_ALLOWED"] = 13] = "SPACE_NOT_ALLOWED";
})(ErrorCode = exports.ErrorCode || (exports.ErrorCode = {}));
//# sourceMappingURL=error-code.enum.js.map