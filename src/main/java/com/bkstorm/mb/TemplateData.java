/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.bkstorm.mb;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlElementWrapper;
import javax.xml.bind.annotation.XmlRootElement;

/**
 *
 * @author hoangnv
 */
@XmlRootElement
@XmlAccessorType(XmlAccessType.FIELD)
public class TemplateData implements Serializable {

    private static final long serialVersionUID = 948615844163379356L;
    @XmlElementWrapper(name = "dates")
    @XmlElement(name = "date")
    List<Date> dates;

    public TemplateData() {
        this.dates = new ArrayList<Date>();
    }
}

@XmlRootElement
@XmlAccessorType(XmlAccessType.FIELD)
class Date {

    String project;
    String company;
    String vehicle;
    String day;
    String month;
    String year;
    String totalTime;
    String firstStep;
    String secondStep;
    String thirdStep;
    String fourthStep;
    String firstImage;
    String secondImage;
    String thirdImage;
    String fourthImage;
    String fifthImage;
    String sixthImage;
    String seventhImage;
    String eighthImage;
}
