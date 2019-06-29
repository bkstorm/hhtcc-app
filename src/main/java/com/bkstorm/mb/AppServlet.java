package com.bkstorm.mb;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import java.io.File;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Set;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.xml.bind.JAXBContext;
import javax.xml.bind.Marshaller;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.io.IOUtils;

@WebServlet(urlPatterns = "/docx", name = "AppServlet", loadOnStartup = 1, asyncSupported = true)
public class AppServlet extends HttpServlet {

    private static final long serialVersionUID = 3927272179953247281L;

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setStatus(200);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        GsonBuilder builder = new GsonBuilder();
        Gson gson = builder.create();
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        try {
            String bodyJSON = IOUtils.toString(req.getReader());
            ReportOptions reportOptions = gson.fromJson(bodyJSON, ReportOptions.class);
            setAccessControlHeaders(resp);
            File inputXML = createXML(reportOptions);
            File inputDOCX = new File(reportOptions.templateFilePath);
            File tempDOCX = File.createTempFile("OUT", ".docx");
            File outputDOCX = DocxProcesser.createDocx(inputXML, inputDOCX, tempDOCX);
            resp.setStatus(200);
            resp.getWriter().print(gson.toJson(new Success(200,
                    String.format("%s://%s:%s/docx/%s", req.getScheme(), req.getServerName(), req.getServerPort(),
                            URLEncoder.encode(outputDOCX.getName(), StandardCharsets.UTF_8.toString())),
                    outputDOCX.getAbsolutePath())));
        } catch (Error ex) {
            Logger.getLogger(AppServlet.class.getName()).log(Level.SEVERE, null, ex);
            resp.setStatus(400);
            resp.getWriter().print(gson.toJson(ex));
        } catch (Exception ex) {
            Logger.getLogger(AppServlet.class.getName()).log(Level.SEVERE, null, ex);
            resp.setStatus(500);
            resp.getWriter().print(gson.toJson(new Error(ErrorCode.UNKNOWN, ex.getMessage())));
        }
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setAccessControlHeaders(resp);
        resp.setStatus(HttpServletResponse.SC_OK);
    }

    private void setAccessControlHeaders(HttpServletResponse resp) {
        resp.setHeader("Access-Control-Allow-Origin", "http://localhost:4200");
        resp.setHeader("Access-Control-Allow-Methods", "POST");
        resp.setHeader("Access-Control-Allow-Headers", "content-type");
    }

    private File createXML(ReportOptions reportOptions) throws Exception {
        TemplateData templateData = validate(reportOptions);
        JAXBContext jaxbContext = JAXBContext.newInstance(TemplateData.class);
        Marshaller marshaller = jaxbContext.createMarshaller();
        marshaller.setProperty(Marshaller.JAXB_FORMATTED_OUTPUT, Boolean.TRUE);
        File temp = File.createTempFile("template-data", ".xml");
        marshaller.marshal(templateData, temp);
        return temp;
    }

    private TemplateData validate(ReportOptions reportOptions) throws Exception {
        Pattern directoryPattern = Pattern.compile("(\\d{2})_(\\d{2})\\.(\\d{2})\\.(\\d{4})");
        TemplateData templateData = new TemplateData();
        for (String directoryPath : reportOptions.selectedDirectories) {
            File directory = new File(directoryPath);
            String directoryName = directory.getName();
            Matcher matcher = directoryPattern.matcher(directoryName);
            if (matcher.matches()) {
                Set<String> fileNames = Arrays.asList(directory.listFiles()).stream()
                        .map(file -> FilenameUtils.getBaseName(file.getName())).collect(Collectors.toSet());
                for (int i = 1; i <= 8; i++) {
                    if (!fileNames.contains(String.valueOf(i))) {
                        throw new Error(ErrorCode.FILE_NAME_FORMAT,
                                String.format("Thư mục %s thiếu ảnh số %s", directoryName, i));
                    }
                }

                Date day = new Date();
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

}
