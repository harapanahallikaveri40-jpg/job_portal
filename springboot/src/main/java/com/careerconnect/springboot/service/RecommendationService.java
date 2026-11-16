package com.careerconnect.springboot.service;

import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class RecommendationService {
    public List<Map<String, Object>> recommend(
            List<String> studentSkills,
            List<Map<String, Object>> jobs) {

        Set<String> skills = new HashSet<>();

        for (String skill : studentSkills) {
            if (skill != null) {
                skills.add(skill.trim().toLowerCase());
            }
        }

        List<Map<String, Object>> results = new ArrayList<>();

        for (Map<String, Object> job : jobs) {

            Object value = job.get("skills");

            if (!(value instanceof List<?>)) {
                continue;
            }

            List<?> jobSkills = (List<?>) value;

            if (jobSkills.isEmpty()) {
                continue;
            }

            int matched = 0;

            for (Object skill : jobSkills) {
                if (skill != null &&
                    skills.contains(skill.toString().trim().toLowerCase())) {
                    matched++;
                }
            }

            double percentage =
                    (matched * 100.0) / jobSkills.size();

            Map<String, Object> result = new HashMap<>(job);

            result.put("matchPercentage", Math.round(percentage));

            results.add(result);
        }

        results.sort((a, b) ->
            Double.compare(
                ((Number) b.get("matchPercentage")).doubleValue(),
                ((Number) a.get("matchPercentage")).doubleValue()
            )
        );

        return results;
    }
}
