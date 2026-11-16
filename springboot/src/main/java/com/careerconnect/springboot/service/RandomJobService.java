
package com.careerconnect.springboot.service;

import java.util.List;
import java.util.Map;
import java.util.Random;

import org.springframework.stereotype.Service;

@Service
public class RandomJobService {

    public Map<String, Object> getRandomJob(
            List<Map<String, Object>> jobs) {

        if (jobs == null || jobs.isEmpty()) {
            throw new IllegalArgumentException(
                    "No jobs available"
            );
        }

        Random random = new Random();

        int randomIndex = random.nextInt(jobs.size());

        return jobs.get(randomIndex);
    }
}
