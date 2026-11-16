
package com.careerconnect.springboot.controller;

import com.careerconnect.springboot.service.RecommendationService;

import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recommendations")
@CrossOrigin(origins = "http://localhost:5173")
public class RecommendationController {

    private final RecommendationService service;

    public RecommendationController(
            RecommendationService service) {
        this.service = service;
    }

    @PostMapping
    public Map<String, Object> recommend(
            @RequestBody Map<String, Object> request) {

        Object skillsObject = request.get("studentSkills");
        Object jobsObject = request.get("jobs");

        if (!(skillsObject instanceof List<?> skillsList)) {
            throw new IllegalArgumentException(
                    "Student skills must be provided as a list"
            );
        }

        if (!(jobsObject instanceof List<?> jobsList)) {
            throw new IllegalArgumentException(
                    "Jobs must be provided as a list"
            );
        }

        List<String> studentSkills = new ArrayList<>();

        for (Object skill : skillsList) {

            if (!(skill instanceof String)) {
                throw new IllegalArgumentException(
                        "Each student skill must be a string"
                );
            }

            studentSkills.add((String) skill);
        }

        List<Map<String, Object>> jobs = new ArrayList<>();

        for (Object item : jobsList) {

            if (!(item instanceof Map<?, ?> jobMap)) {
                throw new IllegalArgumentException(
                        "Each job must be an object"
                );
            }

            Map<String, Object> job =
                    new HashMap<>();

            for (Map.Entry<?, ?> entry : jobMap.entrySet()) {

                if (!(entry.getKey() instanceof String)) {
                    throw new IllegalArgumentException(
                            "Job keys must be strings"
                    );
                }

                job.put(
                        (String) entry.getKey(),
                        entry.getValue()
                );
            }

            jobs.add(job);
        }

        List<Map<String, Object>> results =
                service.recommend(studentSkills, jobs);

        Map<String, Object> response =
                new HashMap<>();

        response.put("success", true);
        response.put("recommendations", results);

        return response;
    }
}
