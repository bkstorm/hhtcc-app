package com.bkstorm.mb.strategies;

import java.io.File;
import java.util.Arrays;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import javax.xml.bind.JAXBContext;
import javax.xml.bind.Marshaller;

import com.bkstorm.mb.Error;
import com.bkstorm.mb.ErrorCode;
import com.bkstorm.mb.ImageUtils;
import com.bkstorm.mb.ReportOptions;
import com.bkstorm.mb.models.Template08Data;
import com.bkstorm.mb.models.Date08;

import org.apache.commons.io.FilenameUtils;

public class Template08Strategy implements Strategy<Template08Data> {

    @Override
    public Template08Data validate(ReportOptions reportOptions) throws Exception {
        Pattern directoryPattern = Pattern.compile("(\\d{2,3})_(\\d{2})\\.(\\d{2})\\.(\\d{4})");
        Template08Data templateData = new Template08Data();
        for (String directoryPath : reportOptions.selectedDirectories) {
            File directory = new File(directoryPath);
            String directoryName = directory.getName();
            Matcher matcher = directoryPattern.matcher(directoryName);
            if (matcher.matches()) {
                if (reportOptions.isImageCheckingOn) {
                    Set<String> fileNames = Arrays.asList(directory.listFiles()).stream()
                            .map(file -> FilenameUtils.getBaseName(file.getName())).collect(Collectors.toSet());
                    for (int i = 1; i <= 8; i++) {
                        if (!fileNames.contains(String.valueOf(i))) {
                            throw new Error(ErrorCode.FILE_NAME_FORMAT,
                                    String.format("Thư mục %s thiếu ảnh số %s", directoryName, i));
                        }
                    }
                }

                Date08 day = new Date08();
                day.project = reportOptions.project;
                day.company = reportOptions.company;
                day.vehicle = reportOptions.vehicle;
                day.totalTime = matcher.group(1);
                day.day = matcher.group(2);
                day.month = matcher.group(3);
                day.year = matcher.group(4);
                day.firstStep = reportOptions.steps.get(0);
                day.secondStep = reportOptions.steps.get(1);
                day.thirdStep = reportOptions.steps.get(2);
                day.fourthStep = reportOptions.steps.get(3);
                for (final File image : directory.listFiles()) {
                    String imageName = FilenameUtils.getBaseName(image.getName());
                    String imageBase64 = ImageUtils.toBase64(image);
                    switch (imageName) {
                        case "1":
                            day.firstImage = imageBase64;
                            break;
                        case "2":
                            day.secondImage = imageBase64;
                            break;
                        case "3":
                            day.thirdImage = imageBase64;
                            break;
                        case "4":
                            day.fourthImage = imageBase64;
                            break;
                        case "5":
                            day.fifthImage = imageBase64;
                            break;
                        case "6":
                            day.sixthImage = imageBase64;
                            break;
                        case "7":
                            day.seventhImage = imageBase64;
                            break;
                        case "8":
                            day.eighthImage = imageBase64;
                            break;
                    }
                }
                templateData.dates.add(day);
            } else {
                throw new Error(ErrorCode.DIRECTORY_NAME_FORMAT, String.format("Thư mục %s không đúng định dạng: %s",
                        directoryName, "Số-chuyến-lũy-kế_ngày.tháng.năm"));
            }
        }
        return templateData;
    }

    @Override
    public File createXML(ReportOptions reportOptions) throws Exception {
        Template08Data templateData = validate(reportOptions);
        JAXBContext jaxbContext = JAXBContext.newInstance(Template08Data.class);
        Marshaller marshaller = jaxbContext.createMarshaller();
        marshaller.setProperty(Marshaller.JAXB_FORMATTED_OUTPUT, Boolean.TRUE);
        File temp = File.createTempFile("template-data", ".xml");
        marshaller.marshal(templateData, temp);
        return temp;
    }
}