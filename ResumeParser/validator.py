"""Validation helpers for parsed resume JSON."""

from __future__ import annotations

from typing import Any


REQUIRED_ROOT_FIELDS = ("source_type", "source_file", "company", "role", "skills")
REQUIRED_SKILL_FIELDS = ("skill_name", "category_code", "evidence", "confidence")
VALID_CATEGORY_CODES = {
    "COD",
    "DSA",
    "OOD",
    "APTI",
    "COMM",
    "AI",
    "CLOUD",
    "SQL",
    "SWE",
    "SYSD",
    "NETW",
    "OS",
    "OTHER",
}
VALID_CONFIDENCE_VALUES = {"high", "medium", "low"}


class ValidationError(ValueError):
    """Raised when parsed resume JSON fails schema validation."""


def _require_string(value: Any, field_name: str) -> str:
    if not isinstance(value, str):
        raise ValidationError(f"Field '{field_name}' must be a string.")
    return value


def _require_nonempty_string(value: Any, field_name: str) -> str:
    string_value = _require_string(value, field_name)
    if not string_value.strip():
        raise ValidationError(f"Field '{field_name}' must be a non-empty string.")
    return string_value


def _require_list(value: Any, field_name: str) -> list[Any]:
    if not isinstance(value, list):
        raise ValidationError(f"Field '{field_name}' must be a list.")
    return value


def validate_resume_json(payload: dict[str, Any]) -> dict[str, Any]:
    """Validate the parsed resume JSON structure.

    Args:
        payload: Parsed JSON object from the LLM.

    Returns:
        The validated payload for downstream use.

    Raises:
        ValidationError: If required fields are missing or malformed.
    """
    if not isinstance(payload, dict):
        raise ValidationError("Parsed resume output must be a JSON object.")

    for field in REQUIRED_ROOT_FIELDS:
        if field not in payload:
            raise ValidationError(f"Missing required root field: '{field}'.")

    source_type = _require_nonempty_string(payload["source_type"], "source_type")
    if source_type != "resume":
        raise ValidationError("Field 'source_type' must be exactly 'resume'.")

    _require_nonempty_string(payload["source_file"], "source_file")
    _require_string(payload["company"], "company")
    _require_string(payload["role"], "role")

    skills = _require_list(payload["skills"], "skills")
    for index, skill in enumerate(skills):
        if not isinstance(skill, dict):
            raise ValidationError(f"Skill at index {index} must be an object.")

        for field in REQUIRED_SKILL_FIELDS:
            if field not in skill:
                raise ValidationError(f"Skill at index {index} is missing field '{field}'.")

        skill_name = _require_string(skill["skill_name"], f"skills[{index}].skill_name")
        category_code = _require_string(skill["category_code"], f"skills[{index}].category_code")
        evidence = _require_string(skill["evidence"], f"skills[{index}].evidence")
        confidence = _require_string(skill["confidence"], f"skills[{index}].confidence")

        if not skill_name.strip():
            raise ValidationError(f"Skill at index {index} must include a non-empty skill_name.")
        if category_code not in VALID_CATEGORY_CODES:
            raise ValidationError(
                f"Skill at index {index} has invalid category_code '{category_code}'."
            )
        if not evidence.strip():
            raise ValidationError(f"Skill at index {index} must include a non-empty evidence field.")
        if confidence not in VALID_CONFIDENCE_VALUES:
            raise ValidationError(
                f"Skill at index {index} has invalid confidence '{confidence}'."
            )

    return payload
