package com.learnnow.learningprogress;

import com.learnnow.learningprogress.dto.response.DashboardResponse;
import com.learnnow.learningprogress.service.DashboardService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("local")
public class DashboardIntegrationTest {

    @Autowired
    private DashboardService dashboardService;

    @Test
    public void testBuildDashboard() {
        try {
            DashboardResponse response = dashboardService.buildDashboard("SYSTEM");
            System.out.println("Dashboard Response: " + response);
        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }
    }
}
