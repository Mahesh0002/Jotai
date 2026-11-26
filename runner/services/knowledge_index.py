import json
import logging
import os
import time
from pathlib import Path
from typing import List, Dict, Any, Optional

import numpy as np

from runner.config import settings
from runner.api_client import api_client
from runner.llm_provider import get_llm_provider

logger = logging.getLogger(__name__)

STATE_DIR = Path("runner/state")
STATE_DIR.mkdir(parents=True, exist_ok=True)
INDEX_PATH = STATE_DIR / "knowledge_index.npz"
HASHES_PATH = STATE_DIR / "note_hashes.json"


class KnowledgeIndex:
    def __init__(self):
        self.note_ids: List[str] = []
        self.matrix: Optional[np.ndarray] = None
        self.hashes: Dict[str, str] = {}
        self._loaded = False

    def load(self) -> bool:
        """Load index from disk if exists"""
        if INDEX_PATH.exists() and HASHES_PATH.exists():
            try:
                data = np.load(INDEX_PATH)
                self.matrix = data["matrix"]
                self.note_ids = data["note_ids"].tolist()
                with open(HASHES_PATH, "r") as f:
                    self.hashes = json.load(f)
                self._loaded = True
                logger.info(f"Loaded knowledge index: {len(self.note_ids)} notes")
                return True
            except Exception as e:
                logger.warning(f"Failed to load knowledge index: {e}")
        return False

    def save(self) -> None:
        """Save index to disk"""
        if self.matrix is not None:
            np.savez_compressed(INDEX_PATH, matrix=self.matrix, note_ids=np.array(self.note_ids))
            with open(HASHES_PATH, "w") as f:
                json.dump(self.hashes, f)
            logger.info(f"Saved knowledge index: {len(self.note_ids)} notes")

    def compute_hash(self, title: str, content: str) -> str:
        """Compute a simple hash for change detection"""
        import hashlib
        content_str = f"{title}\n{content}"[:2000]
        return hashlib.md5(content_str.encode()).hexdigest()

    async def rebuild(self, force: bool = False) -> int:
        """Rebuild the index from all notes via Node API"""
        logger.info("Building knowledge index...")
        notes = api_client.get_notes()
        if not notes:
            logger.info("No notes to index")
            return 0

        provider = get_llm_provider()
        new_matrix = []
        new_ids = []
        new_hashes = {}
        skipped = 0

        for note in notes:
            note_id = note.get("id")
            title = note.get("title", "")
            content = note.get("content", "")
            note_hash = self.compute_hash(title, content)

            if not force and note_id in self.hashes and self.hashes[note_id] == note_hash:
                # Unchanged, reuse existing embedding
                idx = self.note_ids.index(note_id) if note_id in self.note_ids else -1
                if idx >= 0 and self.matrix is not None:
                    new_matrix.append(self.matrix[idx])
                    new_ids.append(note_id)
                    new_hashes[note_id] = note_hash
                    skipped += 1
                continue

            # Compute new embedding
            text = f"{title}\n{content}"[:2000]
            try:
                embedding = provider.embed(text)
                if embedding:
                    # L2 normalize
                    vec = np.array(embedding, dtype=np.float32)
                    norm = np.linalg.norm(vec)
                    if norm > 0:
                        vec = vec / norm
                    new_matrix.append(vec)
                    new_ids.append(note_id)
                    new_hashes[note_id] = note_hash
            except Exception as e:
                logger.warning(f"Failed to embed note {note_id}: {e}")

        if new_matrix:
            self.matrix = np.vstack(new_matrix)
            self.note_ids = new_ids
            self.hashes = new_hashes
            self.save()
            self._loaded = True
            logger.info(f"Knowledge index rebuilt: {len(new_ids)} notes ({skipped} skipped)")
        else:
            self.matrix = None
            self.note_ids = []
            self.hashes = {}
            self._loaded = False
            logger.info("Knowledge index empty")

        return len(new_ids)

    def search(self, query: str, top_k: int = 8, min_score: float = None) -> List[Dict[str, Any]]:
        """Search notes by semantic similarity"""
        if not self._loaded or self.matrix is None or len(self.note_ids) == 0:
            return []

        if min_score is None:
            min_score = settings.MIN_EMBEDDING_SCORE

        try:
            provider = get_llm_provider()
            query_embedding = provider.embed(query)
            if not query_embedding:
                return []

            query_vec = np.array(query_embedding, dtype=np.float32)
            norm = np.linalg.norm(query_vec)
            if norm > 0:
                query_vec = query_vec / norm

            # Cosine similarity
            scores = self.matrix @ query_vec

            # Get top-k above threshold
            top_indices = np.argsort(scores)[::-1][:top_k]
            results = []
            for idx in top_indices:
                score = float(scores[idx])
                if score >= min_score:
                    note_id = self.note_ids[idx]
                    # Get note details from API (or we could cache them)
                    note = api_client.get_note(note_id)
                    if note:
                        # Create excerpt around best match (simplified)
                        content = note.get("content", "")
                        excerpt = content[:300] + ("..." if len(content) > 300 else "")
                        results.append({
                            "id": note_id,
                            "title": note.get("title", "Untitled"),
                            "excerpt": excerpt,
                            "score": score,
                            "source": "vector",
                        })

            return results
        except Exception as e:
            logger.error(f"Knowledge index search error: {e}")
            return []


knowledge_index = KnowledgeIndex()