#!/usr/bin/env python3
"""
MemPalace `mine` entry: extend bundled SKIP_DIRS before CLI runs.

Upstream miner skips .next/dist but not Nuxt/Vite outputs (.nuxt, .output), so
those were being indexed when mining the repo root.
"""
from __future__ import annotations

import mempalace.miner as miner

miner.SKIP_DIRS = miner.SKIP_DIRS | {
    ".nuxt",
    ".output",
    ".turbo",
    ".cache",
    "out",
}

from mempalace.cli import main  # noqa: E402

if __name__ == "__main__":
    main()
