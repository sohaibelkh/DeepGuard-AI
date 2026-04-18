"""
Medical PDF Report Generator
============================
Creates professional medical reports for ECG analysis results.
"""

from __future__ import annotations

import json
from datetime import datetime
from io import BytesIO
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image

def generate_medical_report(user_name: str, record_data: dict) -> BytesIO:
    """Generate a medical PDF report for an ECG record."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    header_style = ParagraphStyle(
        'HeaderStyle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor("#0f172a"), # slate-900
        alignment=1, # Center
        spaceAfter=20
    )
    
    section_title_style = ParagraphStyle(
        'SectionTitle',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor("#0284c7"), # sky-600
        spaceBefore=12,
        spaceAfter=6,
        borderPadding=2,
        borderWidth=0,
        borderColor=colors.white
    )
    
    label_style = ParagraphStyle(
        'LabelStyle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor("#64748b"), # slate-500
        bold=True
    )
    
    value_style = ParagraphStyle(
        'ValueStyle',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.HexColor("#1e293b") # slate-800
    )

    elements = []

    # 1. Header
    elements.append(Paragraph("DeepGuard AI - Medical Report", header_style))
    elements.append(Paragraph(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M')}", styles['Normal']))
    elements.append(Spacer(1, 0.3 * inch))

    # 2. Patient Information
    elements.append(Paragraph("Patient & Session Information", section_title_style))
    
    patient_data = [
        [Paragraph("Patient Name:", label_style), Paragraph(user_name, value_style)],
        [Paragraph("Record ID:", label_style), Paragraph(str(record_data.get('id')), value_style)],
        [Paragraph("Date of Analysis:", label_style), Paragraph(record_data.get('created_at', ''), value_style)],
        [Paragraph("Original Filename:", label_style), Paragraph(record_data.get('file_name', ''), value_style)]
    ]
    
    t = Table(patient_data, colWidths=[1.5 * inch, 4 * inch])
    t.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 0.2 * inch))

    # 3. Diagnostic Results
    elements.append(Paragraph("Diagnostic Summary", section_title_style))
    
    prediction = record_data.get('prediction', 'Unknown')
    confidence = record_data.get('confidence', 0)
    reliability = record_data.get('reliability_score', 0)
    
    # Determine result color based on prediction
    diag_color = colors.HexColor("#16a34a") # emerald-600 (Normal)
    if prediction != "Normal":
        diag_color = colors.HexColor("#dc2626") # red-600
        
    diag_summary_style = ParagraphStyle(
        'DiagSummary',
        parent=styles['Normal'],
        fontSize=16,
        textColor=diag_color,
        bold=True,
        alignment=1,
        borderWidth=1,
        borderColor=diag_color,
        borderRadius=5,
        borderPadding=10
    )
    
    elements.append(Paragraph(f"PRIMARY DIAGNOSIS: {prediction.upper()}", diag_summary_style))
    elements.append(Spacer(1, 0.1 * inch))
    
    results_data = [
        [Paragraph("Confidence Level:", label_style), Paragraph(f"{confidence*100:.1f}%", value_style)],
        [Paragraph("Data Reliability:", label_style), Paragraph(f"{reliability*100:.1f}%", value_style)],
        [Paragraph("Model Used:", label_style), Paragraph(record_data.get('model_used', 'N/A'), value_style)]
    ]
    
    t_res = Table(results_data, colWidths=[1.5 * inch, 4 * inch])
    t_res.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(t_res)
    elements.append(Spacer(1, 0.2 * inch))

    # 4. Detailed Probabilities (if available)
    if record_data.get('class_probabilities'):
        elements.append(Paragraph("Class Probabilities", section_title_style))
        try:
            probs = json.loads(record_data['class_probabilities'])
            prob_data = [[Paragraph("Diagnosis Class", label_style), Paragraph("Probability", label_style)]]
            for cls, val in probs.items():
                prob_data.append([Paragraph(cls, value_style), Paragraph(f"{val*100:.1f}%", value_style)])
            
            t_prob = Table(prob_data, colWidths=[3 * inch, 2.5 * inch])
            t_prob.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f8fafc")),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ]))
            elements.append(t_prob)
        except:
            pass
        elements.append(Spacer(1, 0.2 * inch))

    # 5. Recommendations
    if record_data.get('recommendations'):
        elements.append(Paragraph("AI Assistant Recommendations", section_title_style))
        try:
            recs = json.loads(record_data['recommendations'])
            if isinstance(recs, list):
                for rec in recs:
                    elements.append(Paragraph(f"• {rec}", value_style))
            else:
                elements.append(Paragraph(str(recs), value_style))
        except:
            elements.append(Paragraph(str(record_data['recommendations']), value_style))
            
    elements.append(Spacer(1, 0.5 * inch))
    
    # 6. Disclaimer
    disclaimer_style = ParagraphStyle(
        'Disclaimer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.gray,
        italic=True,
        alignment=1
    )
    elements.append(Paragraph(
        "DISCLAIMER: This report is generated by an Artificial Intelligence system. "
        "It is intended for clinical decision support only and does not constitute a final medical diagnosis. "
        "Please consult with a qualified cardiologist for definitive interpretation.",
        disclaimer_style
    ))

    doc.build(elements)
    buffer.seek(0)
    return buffer
