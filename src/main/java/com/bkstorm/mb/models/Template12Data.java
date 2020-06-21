/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.bkstorm.mb.models;

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
@XmlRootElement(name = "templateData")
@XmlAccessorType(XmlAccessType.FIELD)
public class Template12Data implements Serializable {

    private static final long serialVersionUID = 948615844163379356L;
    @XmlElementWrapper(name = "dates")
    @XmlElement(name = "date")
    public List<Date12> dates;

    public Template12Data() {
        this.dates = new ArrayList<Date12>();
    }
}
