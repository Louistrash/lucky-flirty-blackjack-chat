"""Usage:

from app.env import Mode, mode

if mode == Mode.PROD:
    print("Running in deployed service")
else:
    print("Running in development workspace")
"""

import os
from enum import Enum


class Mode(Enum):
    DEV = "dev"
    PROD = "prod"


# Use environment variable instead of databutton
mode = Mode.PROD if os.environ.get("ENVIRONMENT") == "production" else Mode.DEV

__all__ = [
    "Mode",
    "mode",
]
