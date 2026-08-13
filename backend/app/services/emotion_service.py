from deepface import DeepFace
import numpy as np


def detect_emotion(image_path: str):
    try:
        result = DeepFace.analyze(
            img_path=image_path,
            actions=["emotion"],
            detector_backend="opencv",
            enforce_detection=False
        )

        if isinstance(result, list):
            result = result[0]

        dominant_emotion = str(result["dominant_emotion"])

        emotions = {}

        for emotion, score in result["emotion"].items():
            emotions[emotion] = float(score)

        return {
            "dominant_emotion": dominant_emotion,
            "scores": emotions
        }

    except Exception as e:
        return {
            "error": str(e)
        }