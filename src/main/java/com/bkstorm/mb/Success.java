package com.bkstorm.mb;

public class Success {
    private int code;
    private String url;
    private String filePath;

    public Success(int code, String url, String filePath) {
        this.setCode(code);
        this.setUrl(url);
        this.setFilePath(filePath);
    }

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }

    public int getCode() {
        return code;
    }

    public void setCode(int code) {
        this.code = code;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }
}