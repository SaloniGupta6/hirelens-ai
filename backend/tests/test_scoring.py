import re


import unittest

from app.services.scoring_service import (
    calculate_experience_match,
    calculate_skill_match,
    calculate_education_match,
    score_candidate,
)


class TestHireLensScoring(unittest.TestCase):

    def test_software_development_experience_matches(self):
        jd = "We need software development experience."
        candidate_experience = [
            {
                "role": "Full Stack Developer Intern",
                "company": "Tata Steel",
                "year": "2025",
                "description": "Developed a full-stack web application using React and Flask.",
            }
        ]

        result = calculate_experience_match(jd, candidate_experience)

        self.assertIn("software development", result["matched_terms"])
        self.assertGreater(result["score"], 0)

    def test_unrelated_experience_does_not_match_software_development(self):
        jd = "We need software development experience."
        candidate_experience = [
            {
                "role": "Social Volunteer Intern",
                "company": "NGO",
                "year": "2024",
                "description": "Collaborated on community initiatives and social activities.",
            }
        ]

        result = calculate_experience_match(jd, candidate_experience)

        self.assertNotIn("software development", result["matched_terms"])
        self.assertEqual(result["score"], 0)

    def test_internship_keyword_matches_internship_requirement(self):
        jd = "Candidates must have internship experience."
        candidate_experience = [
            {
                "role": "Full Stack Developer Intern",
                "company": "Tata Steel",
                "year": "2025",
                "description": "Developed APIs and web applications.",
            }
        ]

        result = calculate_experience_match(jd, candidate_experience)

        self.assertIn("internship", result["matched_terms"])
        self.assertEqual(result["score"], 100)

    def test_empty_experience_returns_zero_when_experience_required(self):
        jd = "Candidates need software development experience."

        result = calculate_experience_match(jd, [])

        self.assertEqual(result["score"], 0)
        self.assertEqual(result["matched_terms"], [])
        self.assertGreater(len(result["missing_terms"]), 0)

    def test_no_experience_requirement_returns_none(self):
        jd = "We are looking for a Python and React developer."
        candidate_experience = []

        result = calculate_experience_match(jd, candidate_experience)

        self.assertIsNone(result["score"])
        self.assertEqual(result["matched_terms"], [])
        self.assertEqual(result["missing_terms"], [])

    def test_skill_matching_remains_correct(self):
        result = calculate_skill_match(
            ["python", "react", "java"],
            ["python", "react"],
        )

        self.assertEqual(result["score"], 66.67)
        self.assertEqual(result["matched_skills"], ["python", "react.js"])
        self.assertEqual(result["missing_skills"], ["java"])

class TestExperienceDuration(unittest.TestCase):

    def test_full_year_range_is_detected(self):
        from app.services.scoring_service import parse_experience_duration

        result = parse_experience_duration("2023-2025")

        self.assertIsNotNone(result)
        self.assertGreaterEqual(result, 24)

    def test_month_range_is_detected(self):
        from app.services.scoring_service import parse_experience_duration

        result = parse_experience_duration("Jan 2024 - Dec 2024")

        self.assertIsNotNone(result)
        self.assertGreaterEqual(result, 11)

    def test_year_only_duration_is_unknown(self):
        from app.services.scoring_service import parse_experience_duration

        result = parse_experience_duration("2025")

        self.assertIsNone(result)

    def test_present_range_is_supported(self):
        from app.services.scoring_service import parse_experience_duration

        result = parse_experience_duration("Jan 2025 - Present")

        self.assertIsNotNone(result)
        self.assertGreater(result, 0)

    def test_missing_dates_return_unknown(self):
        from app.services.scoring_service import parse_experience_duration

        result = parse_experience_duration(None)

        self.assertIsNone(result)

    def test_reversed_year_range_is_rejected(self):
        from app.services.scoring_service import parse_experience_duration

        result = parse_experience_duration("2025-2022")

        self.assertIsNone(result)

    def test_reversed_month_range_is_rejected(self):
        from app.services.scoring_service import parse_experience_duration

        result = parse_experience_duration("Dec 2024 - Jan 2024")

        self.assertIsNone(result)

    def test_invalid_month_names_return_unknown(self):
        from app.services.scoring_service import parse_experience_duration

        result = parse_experience_duration("Foo 2024 - Bar 2025")

        self.assertIsNone(result)


if __name__ == "__main__":
    unittest.main()