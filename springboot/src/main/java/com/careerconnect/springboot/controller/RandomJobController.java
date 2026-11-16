
package com.careerconnect.springboot.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.careerconnect.springboot.service.RandomJobService;

@RestController
@RequestMapping("/api/random-jobs")
@CrossOrigin(origins = "http://localhost:5173")
public class RandomJobController {

    private final RandomJobService service;

    public RandomJobController(RandomJobService service) {
        this.service = service;
    }

    @PostMapping
    public Map<String, Object> getRandomJob(
            @RequestBody Map<String, Object> request) {

        Object jobsObject = request.get("jobs");

        if (!(jobsObject instanceof List<?> jobsList)) {
            throw new IllegalArgumentException(
                    "Jobs must be provided as a list"
            );
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

        Map<String, Object> randomJob =
                service.getRandomJob(jobs);

        Map<String, Object> response =
                new HashMap<>();

        response.put("success", true);
        response.put("job", randomJob);

        return response;
    }
}
