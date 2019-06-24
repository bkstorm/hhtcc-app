package com.bkstorm.mb;

import java.io.File;
import java.io.FileInputStream;
import org.docx4j.Docx4J;
import org.docx4j.openpackaging.packages.WordprocessingMLPackage;

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
/**
 *
 * @author hoangnv
 */
public class DocxProcesser {

    public static File createDocx(File inputXML, File inputDOCX, File outputDOCX) throws Exception {
        WordprocessingMLPackage wordMLPackage = Docx4J.load(inputDOCX);
        FileInputStream xmlStream = new FileInputStream(inputXML);
        Docx4J.bind(wordMLPackage, xmlStream, Docx4J.FLAG_NONE);

        Docx4J.save(wordMLPackage, outputDOCX, Docx4J.FLAG_NONE);
        System.out.println("Saved: " + outputDOCX.getAbsolutePath());
        return new File(outputDOCX.getAbsolutePath());
    }
}
