package com.bkstorm.mb;

public class Error extends Exception {

    private static final long serialVersionUID = -7593482820384181092L;
    private ErrorCode code;
    private String message;

    public Error(ErrorCode code, String message) {
        this.code = code;
        this.message = message;
    }

    public String getMessage() {
        return message;
    }

    public ErrorCode getCode() {
        return code;
    }

    public void setCode(ErrorCode code) {
        this.code = code;
    }

    public void setMessage(String message) {
        this.message = message;
    }

}