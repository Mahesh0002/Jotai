import logging
import sys
from urllib.parse import urlparse

from runner.config import settings

logger = logging.getLogger(__name__)


def assert_egress_guard() -> bool:
    """Assert that all configured endpoints are local (loopback/LAN).
    Exits with code 1 if strict mode is enabled but non-local endpoints are configured.
    """
    if settings.PRIVACY_MODE != "strict":
        logger.info("PRIVACY MODE: permissive (external endpoints allowed)")
        return True

    violations = []

    # Check Ollama host
    try:
        parsed = urlparse(settings.OLLAMA_HOST)
        hostname = parsed.hostname or ""
        is_local = hostname in ("localhost", "127.0.0.1", "::1") or hostname.startswith("192.168.") or hostname.startswith("10.") or hostname.startswith("172.16.")
        if not is_local:
            violations.append(f"OLLAMA_HOST points to non-local host: {hostname}")
    except Exception as e:
        violations.append(f"Invalid OLLAMA_HOST: {e}")

    if violations:
        logger.error("EGRESS GUARD VIOLATIONS:")
        for v in violations:
            logger.error(f"  - {v}")
        logger.error("Set PRIVACY_MODE=permissive or fix endpoint configurations.")
        sys.exit(1)

    logger.info("EGRESS OK: all endpoints local")
    return True