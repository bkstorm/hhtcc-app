package com.bkstorm.mb.strategies;

import java.io.File;

import com.bkstorm.mb.ReportOptions;

public interface Strategy<T> {
    public T validate(ReportOptions reportOptions) throws Exception;

    public File createXML(ReportOptions reportOptions) throws Exception;
}