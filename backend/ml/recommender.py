"""
Rule-Based Medical Recommendation Engine
==========================================
Maps predicted cardiac conditions to clinical recommendations
with urgency levels. This is a decision-support tool, not
a substitute for professional medical advice.
"""

from __future__ import annotations

from dataclasses import dataclass

# ── Recommendation database ──────────────────────────────────────────────────

CONDITION_RECOMMENDATIONS: dict[str, dict] = {
    "Normal": {
        "urgency": "routine",
        "urgency_level": 1,
        "title": "Normal Sinus Rhythm",
        "summary": "The ECG signal appears to show a normal sinus rhythm with no detected abnormalities.",
        "recommendations": [
            "Continue regular health check-ups as recommended by your physician.",
            "Maintain a heart-healthy lifestyle with regular exercise and balanced diet.",
            "Monitor blood pressure periodically.",
            "No immediate cardiac intervention required based on this analysis.",
        ],
        "follow_up": "Routine annual cardiac screening recommended.",
    },
    "Arrhythmia": {
        "urgency": "moderate",
        "urgency_level": 2,
        "title": "Cardiac Arrhythmia Detected",
        "summary": "The ECG signal shows irregular heart rhythm patterns consistent with arrhythmia.",
        "recommendations": [
            "Consult a cardiologist for further evaluation and diagnosis.",
            "Consider a Holter monitor test for extended continuous ECG monitoring.",
            "Avoid excessive caffeine, alcohol, and stimulant intake.",
            "Monitor for symptoms: palpitations, dizziness, fainting, shortness of breath.",
            "Discuss potential need for antiarrhythmic medications with your doctor.",
        ],
        "follow_up": "Cardiology consultation recommended within 1-2 weeks.",
    },
    "Atrial Fibrillation": {
        "urgency": "urgent",
        "urgency_level": 3,
        "title": "Atrial Fibrillation (AFib) Detected",
        "summary": "The ECG signal shows patterns consistent with atrial fibrillation, characterized by irregular atrial activity.",
        "recommendations": [
            "Seek prompt cardiology evaluation — AFib increases stroke risk.",
            "Discuss anticoagulation therapy to reduce thromboembolic risk.",
            "Consider echocardiography to evaluate cardiac structure.",
            "Rate or rhythm control strategies should be discussed with your cardiologist.",
            "Monitor blood pressure regularly and manage any underlying hypertension.",
            "Reduce modifiable risk factors: obesity, alcohol, sleep apnea.",
        ],
        "follow_up": "Cardiology consultation recommended within 48-72 hours.",
    },
    "Myocardial Infarction": {
        "urgency": "urgent",
        "urgency_level": 4,
        "title": "Possible Myocardial Infarction (Heart Attack)",
        "summary": "The ECG signal shows patterns that may be consistent with myocardial infarction (MI). This requires immediate attention.",
        "recommendations": [
            "⚠️ SEEK IMMEDIATE MEDICAL ATTENTION if experiencing chest pain or discomfort.",
            "Call emergency services (SAMU/15 or 112) if symptoms are acute.",
            "Blood biomarker tests (troponin) should be performed urgently.",
            "Do not engage in physical exertion until medically cleared.",
            "Coronary angiography may be required to assess coronary artery status.",
            "Cardiac rehabilitation program will likely be recommended post-diagnosis.",
        ],
        "follow_up": "IMMEDIATE emergency department evaluation if symptomatic.",
    },
    "Tachycardia": {
        "urgency": "moderate",
        "urgency_level": 2,
        "title": "Tachycardia Detected",
        "summary": "The ECG signal shows an elevated heart rate (>100 bpm) consistent with tachycardia.",
        "recommendations": [
            "Consult a physician to determine the type (sinus, supraventricular, ventricular).",
            "Rule out underlying causes: fever, anxiety, dehydration, anemia, thyroid disorders.",
            "Practice vagal maneuvers if experiencing supraventricular tachycardia.",
            "Avoid stimulants (caffeine, nicotine, certain medications).",
            "Consider an electrophysiology study if episodes are recurrent.",
        ],
        "follow_up": "Medical evaluation recommended within 1 week.",
    },
    "Bradycardia": {
        "urgency": "moderate",
        "urgency_level": 2,
        "title": "Bradycardia Detected",
        "summary": "The ECG signal shows a slower than normal heart rate (<60 bpm) consistent with bradycardia.",
        "recommendations": [
            "Evaluate if bradycardia is physiological (e.g., athletes) or pathological.",
            "Monitor for symptoms: fatigue, dizziness, syncope, exercise intolerance.",
            "Review current medications — beta-blockers and calcium channel blockers can cause bradycardia.",
            "Consult a cardiologist if symptomatic.",
            "Pacemaker implantation may be considered for symptomatic cases.",
        ],
        "follow_up": "Cardiology evaluation recommended within 1-2 weeks if symptomatic.",
    },
}

DISCLAIMER = (
    "⚕️ DISCLAIMER: This is an AI-generated recommendation for educational and "
    "research purposes only. It is NOT a medical diagnosis. Always consult a "
    "qualified healthcare professional for medical advice and treatment decisions."
)


def get_recommendations(prediction: str, confidence: float) -> dict:
    """
    Generate recommendations based on the predicted cardiac condition.

    Args:
        prediction: Predicted class label (e.g., "Arrhythmia").
        confidence: Model confidence score (0-1).

    Returns:
        Structured recommendation dict with urgency, recommendations,
        follow-up, and confidence assessment.
    """
    rec = CONDITION_RECOMMENDATIONS.get(prediction)
    if rec is None:
        return {
            "urgency": "unknown",
            "urgency_level": 0,
            "title": f"Unknown Condition: {prediction}",
            "summary": "The predicted condition is not in the recommendation database.",
            "recommendations": ["Consult a cardiologist for further evaluation."],
            "follow_up": "Medical consultation recommended.",
            "confidence_note": "",
            "disclaimer": DISCLAIMER,
        }

    # Add confidence assessment
    if confidence >= 0.9:
        confidence_note = "The model has high confidence in this prediction."
    elif confidence >= 0.7:
        confidence_note = "The model has moderate confidence. Consider additional tests for confirmation."
    else:
        confidence_note = (
            "The model has low confidence in this prediction. "
            "Further diagnostic tests are strongly recommended."
        )

    return {
        **rec,
        "confidence_note": confidence_note,
        "confidence": round(confidence, 4),
        "disclaimer": DISCLAIMER,
    }
