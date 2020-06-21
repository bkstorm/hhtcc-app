package com.bkstorm.mb;

import com.bkstorm.mb.strategies.Strategy;
import com.bkstorm.mb.strategies.StrategyFactory;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import java.io.File;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
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
            Strategy strategy = StrategyFactory.getStrategy(reportOptions.templateType);
            File inputXML = strategy.createXML(reportOptions);
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
            resp.getWriter()
                    .print(gson.toJson(new Error(ErrorCode.UNKNOWN, ex.getStackTrace().toString() + ex.toString())));
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
}
