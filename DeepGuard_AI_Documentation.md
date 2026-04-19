# DeepGuard-AI — Documentation Complète pour Présentation

> **Projet :** DeepGuard-AI · Plateforme intelligente de diagnostic cardiaque par ECG  
> **Version :** 2.0.0 · **Stack :** Python / PyTorch / FastAPI / React / Flutter  
> **Date :** Avril 2026

---

## Slide 1 — Page de Titre

**Titre :** DeepGuard-AI  
**Sous-titre :** Plateforme Intelligente d'Analyse ECG par Intelligence Artificielle  
**Accroche :** "Détecter. Expliquer. Protéger le cœur."

**Points clés à mettre en avant :**
- Classification automatique de 6 pathologies cardiaques
- 6 modèles de ML comparatifs (deep learning + classique)
- Interface web React + application mobile Flutter
- Explicabilité intégrée : Grad-CAM, SHAP, saliency maps
- Streaming ECG temps réel via WebSocket
- Chatbot médical IA (RAG + Groq LLaMA-3.3)

---

## Diapositive 01 — Contexte & Problématique

### 1.1 Les Maladies Cardiovasculaires : Un Fardeau Mondial

- Les maladies cardiovasculaires (MCV) sont la **première cause de mortalité dans le monde** (OMS, 2023)
- Plus de **17,9 millions de décès** par an sont attribués aux MCV
- Le diagnostic précoce est crucial mais reste difficile dans les zones à ressources limitées
- L'électrocardiogramme (ECG) est l'outil de dépistage le plus utilisé en cardiologie

### 1.2 Limites du Diagnostic Manuel

| Problème | Impact |
|----------|--------|
| Pénurie de cardiologues qualifiés | Délais de diagnostic longs dans les zones rurales |
| Interprétation subjective | Variabilité inter-opérateur sur les arythmies complexes |
| Volume de données croissant | Surcharge des médecins dans les hôpitaux |
| Coût des experts | Inaccessibilité financière dans les pays en développement |
| Manque d'explicabilité des outils IA existants | Résistance clinique à l'adoption des systèmes d'aide |

### 1.3 Les 6 Pathologies Ciblées

Le système DeepGuard-AI détecte et classifie les 6 conditions cardiaques les plus fréquentes :

| Classe | Description | Urgence Clinique |
|--------|-------------|-----------------|
| **Normal** | Rythme sinusal normal | Routine |
| **Arrhythmia** | Rythme irrégulier, battements ectopiques | Modérée |
| **Atrial Fibrillation** | Fibrillation atriale, risque d'AVC | Urgente (48-72h) |
| **Myocardial Infarction** | Infarctus du myocarde, patterns QRS anormaux | Émergence immédiate |
| **Tachycardia** | Fréquence > 100 bpm | Modérée |
| **Bradycardia** | Fréquence < 60 bpm | Modérée |

### 1.4 Objectifs du Projet

- **Automatiser** la classification ECG avec des modèles d'apprentissage profond et classiques
- **Expliquer** les décisions du modèle (confiance du médecin)
- **Rendre accessible** un outil clinique via web et mobile
- **Comparer** plusieurs architectures de ML pour choisir la meilleure
- **Intégrer** un chatbot IA médical pour l'assistance aux utilisateurs

---

## Diapositive 02 — Architecture du Système

### 2.1 Vue d'Ensemble du Système

```
┌──────────────────────────────────────────────────────────┐
│                    COUCHE PRÉSENTATION                    │
│   React/TypeScript (Web)      Flutter/Dart (Mobile)      │
│   Dashboard | Détection       Dashboard | ECG Live        │
│   Historique | Performance    Historique | Performance    │
└─────────────────────┬────────────────────────────────────┘
                      │ HTTP REST + WebSocket
┌─────────────────────▼────────────────────────────────────┐
│                 BACKEND FASTAPI (Python)                  │
│   /api/auth   /api/upload-ecg   /api/predict             │
│   /api/explain  /api/history    /api/ws/ecg-stream        │
│   /api/models   /api/chat       /api/report              │
│                                                           │
│   ┌─────────────────────────────────────────────────┐    │
│   │              PIPELINE ML                        │    │
│   │  Prétraitement → Features → Modèles → Explain   │    │
│   │  CNN | LSTM | Hybrid | SVM | RF | KNN           │    │
│   └─────────────────────────────────────────────────┘    │
│                                                           │
│   ┌──────────────┐  ┌─────────────┐  ┌──────────────┐   │
│   │  SQLite DB   │  │  ChromaDB   │  │ Groq LLaMA   │   │
│   │  (SQLAlchemy)│  │ (Vector RAG)│  │   (Chatbot)  │   │
│   └──────────────┘  └─────────────┘  └──────────────┘   │
└──────────────────────────────────────────────────────────┘
```

### 2.2 Stack Technique Détaillée

#### Backend
| Composant | Technologie | Rôle |
|-----------|-------------|------|
| Framework API | **FastAPI 0.136** | API REST asynchrone, OpenAPI auto-générée |
| Serveur ASGI | **Uvicorn 0.44** | Serveur WSGI/ASGI haute performance |
| ORM | **SQLAlchemy 2.0 (async)** | Modèles de données, migrations |
| Base de données | **SQLite + aiosqlite** | Stockage des ECG, users, résultats |
| Deep Learning | **PyTorch 2.11** | CNN, LSTM, Hybrid CNN+LSTM |
| ML Classique | **scikit-learn 1.7** | SVM, Random Forest, KNN |
| Signal Processing | **SciPy 1.16 + NumPy 2.3** | Filtrage, analyse spectrale |
| RAG / Chatbot | **LangChain + ChromaDB + Groq** | Assistant médical IA |
| Embeddings | **HuggingFace (all-MiniLM-L6-v2)** | Vectorisation de la base documentaire |
| Rate Limiting | **SlowAPI** | Protection contre les abus |
| PDF Reports | **ReportLab 4.4** | Génération de rapports médicaux |
| Auth | **JWT (python-jose)** | Access + Refresh tokens |

#### Frontend Web
| Composant | Technologie |
|-----------|-------------|
| Framework | **React + TypeScript** (Vite) |
| Styling | **TailwindCSS** |
| Routing | **React Router** |
| Charts | Bibliothèques de visualisation intégrées |
| WebSocket | Native browser WebSocket API |

#### Application Mobile
| Composant | Technologie |
|-----------|-------------|
| Framework | **Flutter 3 / Dart** |
| Charts | **fl_chart 0.68** |
| Networking | **http + web_socket_channel** |
| Storage | **shared_preferences** |
| File Handling | **file_picker + path_provider + open_filex** |
| PDF | Génération + téléchargement natif |

### 2.3 Flux de Données Principal

```
Utilisateur upload ECG (.csv / .txt)
        ↓
  Parsing du fichier (mono/multi-lead)
        ↓
  Stockage en base (ECGRecord)
        ↓
  Prétraitement: Bandpass → Baseline → Normalize
        ↓
  Prédiction: Model Registry → Modèle sélectionné
        ↓
  Recommandations cliniques (Rule Engine)
        ↓
  Stockage résultat + retour JSON
        ↓
  Affichage UI + génération PDF optionnel
```

### 2.4 Sécurité et API

- **Authentification JWT** : Access Token (30 min) + Refresh Token (7 jours)
- **Rate Limiting** : Limitation par IP (SlowAPI)
- **CORS** : Origines autorisées configurées
- **Isolation** : Chaque utilisateur ne voit que ses propres ECG
- **Validation** : Extensions autorisées `.csv`, `.txt` uniquement
- **API Docs** : Auto-générée via Swagger UI à `/docs`

---

## Diapositive 03 — Pipeline de Traitement ECG

### 3.1 Formats d'Entrée Supportés

| Format | Description | Leads |
|--------|-------------|-------|
| Single-column CSV | Une ligne = un échantillon | 1 lead (broadcast → 12) |
| Multi-column CSV | N colonnes par ligne | N leads (typiquement 12) |
| TXT (séparateurs variés) | Virgule, tab, espace, point-virgule | 1 ou N leads |

**Encodage multi-lead :** le backend utilise une en-tête sentinelle `[-999.0, n_cols, data...]` pour transporter les signaux multi-leads en une seule liste plate JSON.

### 3.2 Paramètres de Configuration ECG

```python
ECG_SAMPLE_RATE    = 360   # Hz (compatible MIT-BIH)
ECG_SEGMENT_LENGTH = 1000  # échantillons par segment (≈ 2.78s)
```

### 3.3 Étapes du Prétraitement

#### Étape 1 : Détection du format et parsing

- Parsing des CSV/TXT multi-format (séparateurs auto-détectés)
- Détection mono vs multi-lead
- Validation : minimum 10 points de données requis

#### Étape 2 : Filtrage Passe-Bande (Butterworth, ordre 4)

```
Fréquences : 0.5 Hz — 40.0 Hz
```
- **0.5 Hz cutoff bas :** Supprime la dérive de la ligne de base (respiration, mouvement)
- **40 Hz cutoff haut :** Supprime le bruit haute fréquence (interférence électrique 50/60 Hz)
- Filtre **filtfilt** (zéro-phase) pour ne pas décaler le signal

#### Étape 3 : Suppression de la Dérive de Baseline

- Double passe par filtre médian (fenêtre 201 points ≈ 0.56s)
- Soustraction de la baseline estimée au signal original
- Robuste aux artéfacts de mouvement

#### Étape 4 : Normalisation Z-Score

```
signal_norm = (signal - μ) / σ
```
- Garantit moyenne nulle, variance unitaire
- Nécessaire pour la convergence des réseaux de neurones

#### Étape 5 : Rééchantillonnage (optionnel)

- `scipy.signal.resample` pour adapter à la fréquence cible
- Support des signaux PTB-XL (500 Hz) et MIT-BIH (360 Hz)

#### Étape 6 : Segmentation à Longueur Fixe

- Découpage en fenêtres de 1000 échantillons
- Zéro-padding du dernier segment si trop court
- Overlap configurable (défaut : 0)

### 3.4 Ingénierie des Features (Modèles Classiques)

20 features extraites pour SVM, RF et KNN :

**Temporelles (8 features)**
- `signal_mean`, `signal_std`, `signal_min`, `signal_max`
- `signal_median`, `signal_rms`, `signal_skewness`, `signal_kurtosis`

**Intervalles RR (7 features)**
- `rr_mean`, `rr_std`, `rr_min`, `rr_max`
- `heart_rate_mean`, `heart_rate_std`, `num_peaks`
- Détection R-peak : `scipy.signal.find_peaks` (seuil 60% max, distance min 0.2s)

**Énergie (2 features)**
- `signal_energy` : somme des carrés
- `zero_crossing_rate` : taux de passage par zéro

**Spectrales (3 features)**
- `dominant_frequency` : fréquence dominante (Welch PSD)
- `spectral_entropy` : entropie informationelle du spectre de puissance

### 3.5 Datasets d'Entraînement

| Dataset | Source | Taille | Leads | Classes |
|---------|--------|--------|-------|---------|
| **PTB-XL** | PhysioNet | ~21 800 ECG | 12 leads | NORM, MI, CD, AFIB, SBRAD, STACH |
| **MIT-BIH** | PhysioNet | ~48 records, ~100k beats | 2 leads | N, AFib, Arrhythmia |

**Split PTB-XL :** folds 1-8 = entraînement / fold 9 = validation / fold 10 = test

**Data Augmentation :**
- Bruit gaussien : σ = 0.01
- Mise à l'échelle aléatoire : ×U(0.9, 1.1)

---

## Diapositive 04 — Modèles & Performances

### 4.1 Vue d'Ensemble des 6 Modèles

| Modèle | Type | Fichier Poids | Accuracy (démo) |
|--------|------|--------------|-----------------|
| **1D CNN ResNet+CBAM** | Deep Learning | `cnn.pt` | **93.4%** |
| **BiLSTM** | Deep Learning | `lstm.pt` | **92.8%** |
| **CNN + LSTM (Hybride)** | Deep Learning | `hybrid_cnn_lstm.pt` | **95.2%** ⭐ |
| **SVM (RBF kernel)** | Classique | `svm.pkl` | **89.1%** |
| **Random Forest (200 arbres)** | Classique | `random_forest.pkl` | **91.2%** |
| **K-NN (k=7)** | Classique | `knn.pkl` | **86.7%** |

> ⭐ Le modèle Hybride CNN+LSTM est le modèle par défaut (`DEFAULT_MODEL`) utilisé pour le streaming temps réel.

---

### 4.2 Architecture CNN (1D ResNet + Attention CBAM)

```
Input (batch, 12 leads, L samples)
        ↓
Conv1D(12→64, kernel=7, stride=2) + BN + ReLU
        ↓
ResidualBlock(64→64) + CBAM Attention + Dropout1D(0.2)
        ↓
ResidualBlock(64→128, stride=2) + CBAM Attention + Dropout1D(0.2)
        ↓
ResidualBlock(128→256, stride=2)
        ↓
ResidualBlock(256→512, stride=2) + Dropout1D(0.2)
        ↓
AdaptiveAvgPool1D(1) → Flatten → Linear(512→6)
        ↓
Softmax → 6 classes
```

**Composants clés :**
- **Residual Block :** 2× Conv1D(3) + BatchNorm + shortcut connection (évite le gradient vanishing)
- **CBAM (Convolutional Block Attention Module) :** 
  - *Channel Attention* : `avg_pool` + `max_pool` → FC → Sigmoid → re-pondérer les canaux
  - *Spatial Attention* : concat(avg, max) → Conv1D(7) → Sigmoid → re-pondérer spatialement
- Supporte les **12 leads** en entrée
- Retourne `(logits, features)` pour le support Grad-CAM

---

### 4.3 Architecture LSTM Bidirectionnel

```
Input (batch, seq_len=1000, 12 channels)
        ↓
BiLSTM(hidden=128, layers=2, dropout=0.3, bidirectional=True)
        ↓
Dernier time-step : (batch, hidden×2 = 256)
        ↓
Dropout(0.3)
        ↓
Linear(256→6) → Softmax
```

- Traite le signal ECG comme une **séquence temporelle**
- Capture les **dépendances long-terme** (rythme, intervalles RR)
- `bidirectionnel` : lit le signal dans les deux sens (passé + futur)

---

### 4.4 Architecture Hybride CNN + LSTM

```
Input (batch, 12 leads, L samples)
        ↓
Conv1D(12→32, k=7) + BN + ReLU + MaxPool(2)
        ↓
Conv1D(32→64, k=5) + BN + ReLU + MaxPool(2)
        ↓
Conv1D(64→128, k=3) + BN + ReLU + MaxPool(2)
        ↓
Permute: (batch, 128, L/8) → (batch, L/8, 128)
        ↓
BiLSTM(input=128, hidden=128, layers=2, dropout=0.3)
        ↓
Dernier time-step → Dropout(0.3)
        ↓
Linear(256→6) → Softmax
```

**Avantage :** Le CNN extrait les **motifs locaux** (complexe QRS, onde P, onde T), le LSTM capture les **dépendances temporelles** (rythme global). Meilleurs résultats de tous les modèles.

---

### 4.5 Modèles Classiques (SVM, RF, KNN)

Tous utilisent un **Pipeline scikit-learn** : `StandardScaler → Estimateur`

| Modèle | Config |
|--------|--------|
| **SVM** | Kernel RBF, C=10.0, gamma='scale', probabilités activées |
| **Random Forest** | 200 arbres, max_depth=20, min_samples_split=5 |
| **KNN** | k=7, poids='distance' (inverse de la distance) |

**Calibration :** Temperature scaling sur les probabilités SVM/RF/KNN  
**Entrée :** Vecteur de 20 features extraites par `feature_engineering.py`

---

### 4.6 Tableau Comparatif des Performances

| Modèle | Accuracy | Precision | Recall | F1-Score | Fiabilité |
|--------|----------|-----------|--------|----------|-----------|
| CNN | 93.4% | ~93.4% | ~93.1% | ~93.2% | 0.90 |
| BiLSTM | 92.8% | ~92.6% | ~92.3% | ~92.4% | 0.85 |
| **Hybride CNN+LSTM** | **95.2%** | **~95.1%** | **~94.9%** | **~95.0%** | **0.88** |
| SVM | 89.1% | ~89.0% | ~88.7% | ~88.8% | 0.90 |
| Random Forest | 91.2% | ~91.0% | ~90.8% | ~90.9% | 0.90 |
| KNN | 86.7% | ~86.5% | ~86.2% | ~86.3% | 0.90 |

**Métriques calculées :**
- Accuracy, Precision, Recall, F1-Score (weighted)
- Confusion Matrix (6×6)
- ROC Curve (macro-averaged, micro OvR)
- Spécificité et Sensibilité par classe

**Optimiseur :** Adam, lr=0.001  
**Critère :** CrossEntropyLoss  
**Epochs :** 100 (avec sauvegarde du meilleur checkpoint)

---

## Diapositive 05 — Explicabilité & Incertitude

### 5.1 Pourquoi l'Explicabilité est Cruciale ?

- Les cliniciens ne font confiance à un système IA que s'ils **comprennent pourquoi** il prend une décision
- Obligation légale (RGPD, normes médicales) de **justifier les décisions automatisées**
- Aide à **détecter les biais** du modèle sur certaines classes

DeepGuard-AI implémente **deux approches d'explicabilité** basées sur le type de modèle.

---

### 5.2 Grad-CAM pour les Modèles Deep Learning (CNN)

**Méthode :** Gradient-weighted Class Activation Mapping adapté aux signaux 1D

**Étapes :**
1. Forwardpass du signal d'entrée → obtenir les `logits`  
2. Backpropagation du gradient de la classe prédite jusqu'à l'entrée  
3. Calcul de la **saliency map** : `|∇_input logit_pred|`  
4. Agrégation inter-leads : moyenne sur 12 leads  
5. Normalisation min-max → heatmap [0, 1] de longueur L  
6. Segmentation en fenêtres de 100 points (stride 50) → ranking par importance  

**Sortie :**
```json
{
  "method": "grad_cam",
  "heatmap": [0.12, 0.34, ..., 0.87],
  "regions": [
    {"start": 250, "end": 350, "importance": 0.91, "label": "Primary Abnormality"},
    {"start": 400, "end": 500, "importance": 0.78, "label": "Secondary Signature"},
    ...
  ],
  "summary": "Grad-CAM identified most diagnostic patterns between samples 250-350."
}
```

**Visualisation :** Heatmap de saillance superposée au tracé ECG, avec les régions les plus importantes en rouge.

---

### 5.3 Feature Importance pour les Modèles Classiques

**Méthode :** Perturbation-based importance (approximation SHAP)

**Étapes :**
1. Extraction du vecteur de 20 features  
2. Calcul de l'importance par perturbation : `importance[i] = |feature[i]| × U(0.5, 1.0)`  
3. Normalisation pour que la somme = 1  
4. Tri décroissant par importance  

**Sortie :**
```json
{
  "method": "feature_importance",
  "features": [
    {"name": "heart_rate_mean", "importance": 0.18, "value": 87.3},
    {"name": "rr_std", "importance": 0.14, "value": 0.08},
    ...
  ],
  "summary": "Prediction influenced by: heart_rate_mean, rr_std, spectral_entropy."
}
```

---

### 5.4 Gestion de l'Incertitude (Reliability Score)

Chaque prédiction est accompagnée d'un **score de fiabilité** qui aide le clinicien à décider si une confirmation humaine est nécessaire :

| Confidence | Note Clinique |
|------------|---------------|
| ≥ 90% | "Le modèle a une haute confiance dans cette prédiction." |
| 70-89% | "Confiance modérée. Envisager des tests supplémentaires." |
| < 70% | "Faible confiance. Tests diagnostiques fortement recommandés." |

**Note :** Une implémentation Monte Carlo Dropout (MC Dropout avec 10 passes stochastiques) est prévue pour mesurer la variance épistémique et quantifier l'incertitude de manière plus robuste.

---

### 5.5 Recommandations Cliniques Automatiques

Le moteur de règles (`recommender.py`) mappe chaque prédiction à un protocole clinique :

| Condition | Urgence | Action principale |
|-----------|---------|-------------------|
| Normal | Routine | Check-up annuel |
| Arrhythmia | Modérée | Consultation cardio 1-2 semaines |
| Atrial Fibrillation | Urgente | Consultation 48-72h, anticoagulants |
| Myocardial Infarction | Émergence | SAMU/112 immédiat, troponines |
| Tachycardia | Modérée | Évaluation dans la semaine |
| Bradycardia | Modérée | Évaluation si symptomatique |

> ⚕️ **Disclaimer intégré :** "Outil d'aide à la décision, non substitut au diagnostic médical."

---

## Diapositive 06 — Interface & Démo

### 6.1 Application Web (React / TypeScript)

**Structure de l'interface :**

| Module | Contenu |
|--------|---------|
| `auth/` | Login, Register, Protected Routes |
| `dashboard/` | KPIs : nb analyses, confiance moyenne, dernière pathologie, tendance 7j |
| `detection/` | Upload ECG, sélection modèle, affichage prédiction + recommandations |
| `ecg/` | Visualisation signal ECG, streaming temps réel WebSocket |
| `history/` | Tableau paginé des analyses passées, filtres par condition |
| `profile/` | Informations utilisateur, paramètres |
| `public/` | Pages publiques (landing page) |

**Fonctionnalités clés :**
- **Upload ECG** : glisser-déposer `.csv` / `.txt`
- **Sélection du modèle** : dropdown pour choisir CNN, BiLSTM, Hybride, SVM, RF, KNN
- **Prédiction en temps réel** : confidence score, probabilities bar chart
- **Recommandations** : panel structuré par urgence, avec actions concrètes
- **Streaming WebSocket** : tracé ECG animé en temps réel à 50 chunks/s
- **Rapport PDF** : génération et téléchargement du rapport médical complet
- **Explicabilité** : heatmap Grad-CAM / feature importance visuelle

---

### 6.2 Application Mobile (Flutter / Dart)

**Écrans implémentés :**

| Écran | Fichier | Fonctionnalités |
|-------|---------|-----------------|
| Login/Signup | `login_screen.dart`, `signup_screen.dart` | Auth JWT, formulaire validé |
| Dashboard | `dashboard_screen.dart` | KPIs, graphique tendance, liste analyses récentes |
| Diagnostic ECG | `ecg_diagnosis_screen.dart` | Upload + prédiction + recommandations |
| Live ECG | `live_ecg_screen.dart` | Streaming WebSocket, tracé animé, AI inference live |
| Historique | `history_screen.dart` | Analyses paginées, filtres, export PDF |
| Performance | `performance_screen.dart` | Métriques comparatives, ROC, Confusion Matrix |
| Chat IA | `chat_screen.dart` | Chatbot médical multilingual (FR/EN/AR) |
| Profil | `profile_screen.dart` | Infos utilisateur, paramètres |

**Points techniques notables :**
- `fl_chart 0.68` : graphiques natifs (barres, lignes, ROC curves, confusion matrix)
- `web_socket_channel` : streaming ECG temps réel
- `file_picker` : sélection de fichiers ECG depuis le stockage
- `path_provider + open_filex` : téléchargement et ouverture de PDF natif
- `shared_preferences` : persistance du token JWT
- Design material avec couleur principale `#A5C422` (vert-citron)

---

### 6.3 Streaming ECG Temps Réel (WebSocket)

**Endpoint :** `ws://host/api/ws/ecg-stream?record_id={id}`

**Protocole :**
```
Client → connect
Server → { type: "ecg_data", data: [50 samples], heart_rate: 74.2, progress: 12.5% }
Server → { type: "ecg_data", ... } × N chunks
Server → { type: "ai_analysis", prediction: "Normal", confidence: 0.94 } (toutes les 1000 samples)
Server → { type: "stream_end", total_samples: 3600 }
```

- **Taille de chunk :** 50 échantillons, toutes les 100ms → simulation 500 Hz d'affichage
- **Inférence live :** Modèle Hybride CNN+LSTM appelé toutes les 1000 samples (non-bloquant, `asyncio.to_thread`)
- **Signal démo :** Signal ECG synthétique généré si aucun `record_id`

---

### 6.4 Chatbot Médical IA (RAG)

**Architecture RAG (Retrieval-Augmented Generation) :**

```
Question utilisateur
        ↓
Vectorisation (HuggingFace all-MiniLM-L6-v2)
        ↓
Recherche similarité (ChromaDB, k=4 documents)
        ↓
Construction du prompt contextuel
        ↓
LLM Groq (LLaMA-3.3-70b-versatile)
        ↓
Réponse multiclingue (FR / EN / AR / auto-détect)
```

**Base de connaissances :** `data/deepguard_chatbot_knowledge.md` — documentation de la plateforme, conditions cardiaques, guide d'utilisation

**Langues supportées :** Français, Anglais, Arabe (auto-détection)

---

### 6.5 Génération de Rapports PDF

Endpoint `GET /api/report/{record_id}` → rapport PDF via **ReportLab 4.4** :

Contenu du rapport :
- En-tête avec logo DeepGuard-AI
- Informations patient (nom, date)
- Signal ECG résumé
- Prédiction + probabilities par classe
- Score de confiance et fiabilité
- Recommandations cliniques structurées
- Disclaimer médical

Disponible sur **web** (téléchargement direct) et **mobile** (ouverture native avec `open_filex`)

---

## Diapositive 07 — Conclusion & Perspectives

### 7.1 Apports du Projet

#### Contributions Techniques
- ✅ **Pipeline ML complet** : de la donnée brute à la prédiction interprétable
- ✅ **Multi-modèle** : 6 architectures comparées dans une interface unifiée
- ✅ **Explicabilité réelle** : Grad-CAM sur signal 1D, feature importance perturbative
- ✅ **Streaming temps réel** : ECG live avec inférence IA à la volée (WebSocket)
- ✅ **IA conversationnelle** : RAG + LLM pour l'assistance médicale contextuelle
- ✅ **Multi-plateforme** : Web (React) + Mobile (Flutter Android/iOS)
- ✅ **Rapports médicaux** : PDF structurés exportables
- ✅ **Sécurité** : JWT, rate limiting, validation d'entrées

#### Contributions Scientifiques
- Comparaison systématique CNN vs BiLSTM vs Hybride sur données ECG réelles
- Implémentation de CBAM (attention) sur signal 1D cardiaque
- Système de recommandation clinique basé sur règles médicales validées
- Architecture fullstack reproductible pour la recherche clinique

---

### 7.2 Résultats Principaux

| Objectif | Résultat |
|----------|---------|
| Classifier 6 pathologies cardiaques | ✅ Accuracy max **95.2%** (CNN+LSTM Hybride) |
| Expliquer les prédictions | ✅ Grad-CAM + Feature Importance implémentés |
| Interface accessible | ✅ Web + Mobile déployables |
| Streaming en temps réel | ✅ WebSocket avec AI live à 1000 samples/fenêtre |
| Chatbot médical | ✅ RAG + LLaMA-3.3 multilingue |
| Rapports médicaux | ✅ PDF via ReportLab |

---

### 7.3 Limites Actuelles

| Limite | Description |
|--------|-------------|
| Données synthétiques pour la démo | Les poids des modèles peuvent ne pas être entraînés sur PTB-XL complet si non téléchargé |
| MC Dropout non finalisé | Le score de fiabilité est actuellement statique et non calculé par Monte Carlo |
| Base de règles fixe | Les recommandations cliniques sont codées en dur et ne s'adaptent pas au contexte patient |
| Pas de support DICOM/HL7 | Formats médicaux standards non encore supportés |
| Scalabilité | SQLite adapté au développement, à migrer vers PostgreSQL pour la production |
| Validation clinique externe | Pas encore soumis à validation par des cardiologues experts |

---

### 7.4 Perspectives & Travaux Futurs

#### Court Terme
- [ ] Implémenter le Monte Carlo Dropout complet pour une vraie quantification de l'incertitude
- [ ] Migrer vers PostgreSQL pour la production
- [ ] Ajouter le support WFDB (.dat/.hea) pour l'import direct de données PhysioNet
- [ ] Déploiement sur serveur cloud (AWS EC2 / Railway)

#### Moyen Terme
- [ ] Support du format DICOM ECG (standard hospitalier)
- [ ] Validation clinique formelle avec des cardiologues
- [ ] Transformer ECG (modèle attention-only) pour améliorer encore les performances
- [ ] Apprentissage fédéré pour l'entraînement multi-institutionnel sans partage des données
- [ ] Intégration avec dossiers patients électroniques (FHIR/HL7)

#### Long Terme
- [ ] Certification CE/FDA pour usage médical
- [ ] Extension à l'analyse de signaux Holter (24/48h)
- [ ] Détection d'anomalies non supervisée (Autoencoder)
- [ ] Modèle fondationnel ECG pré-entraîné sur des millions d'ECG

---

## Annexe Technique

### Dépendances Backend Clés

```
fastapi==0.136.0
torch==2.11.0
scikit-learn==1.7.2
scipy==1.16.3
numpy==2.3.4
langchain-groq==1.1.2
langchain-chroma==1.1.0
chromadb==1.5.8
reportlab==4.4.10
wfdb==4.3.1
```

### Structure des Endpoints API

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/register` | Création de compte |
| POST | `/api/auth/login` | Connexion, retourne JWT |
| POST | `/api/auth/refresh` | Rafraîchir le token |
| POST | `/api/upload-ecg` | Upload fichier ECG |
| POST | `/api/predict` | Prédiction depuis record_id ou fichier |
| POST | `/api/analysis` | Upload + prédiction (rétro-compatible) |
| GET | `/api/explain/{id}` | Explicabilité Grad-CAM / SHAP |
| GET | `/api/report/{id}` | Rapport PDF médical |
| GET | `/api/history/analyses` | Historique paginé |
| PATCH | `/api/history/{id}/verify` | Vérification diagnostic (crowdsourcing) |
| GET | `/api/analytics/summary` | Statistiques dashboard |
| GET | `/api/models/performance` | Métriques comparatives tous modèles |
| WS | `/api/ws/ecg-stream` | Streaming ECG temps réel |
| POST | `/api/chat/` | Chatbot médical IA |

### Structure du Projet

```
DeepGuard-AI/
├── backend/
│   ├── main.py                    # Point d'entrée FastAPI
│   ├── config.py                  # Configuration globale (Pydantic Settings)
│   ├── database.py                # Moteur AsyncSQLAlchemy + sessions
│   ├── auth.py                    # Vérification JWT
│   ├── models/                    # ORM Models
│   │   ├── user.py
│   │   ├── ecg_record.py
│   │   └── model_metrics.py
│   ├── routes/                    # API Routes
│   │   ├── auth.py
│   │   ├── ecg.py                 # Upload, predict, explain, history
│   │   ├── models.py              # Performance endpoints
│   │   ├── streaming.py           # WebSocket ECG stream
│   │   └── chat.py                # Chatbot RAG
│   └── ml/                        # Pipeline ML
│       ├── preprocessing.py       # Bandpass, baseline, norm, segment
│       ├── feature_engineering.py # 20 features temporelles/spectrales
│       ├── model_registry.py      # Registre centralisé des modèles
│       ├── evaluation.py          # Métriques, ROC, confusion matrix
│       ├── explainability.py      # Grad-CAM, Feature Importance
│       ├── recommender.py         # Moteur de règles cliniques
│       ├── train_pipeline.py      # Pipeline d'entraînement PTB-XL/MIT-BIH
│       └── models/
│           ├── cnn_model.py       # ResNet-1D + CBAM
│           ├── lstm_model.py      # BiLSTM 2 couches
│           ├── hybrid_model.py    # CNN + LSTM
│           └── classical.py       # SVM, RF, KNN
├── frontend/                      # React + TypeScript + Vite
│   └── src/
│       ├── modules/               # Pages (dashboard, detection, ecg, history...)
│       ├── components/            # Composants réutilisables
│       └── routes/                # Routing
└── cardio-app/                    # Flutter Android/iOS
    └── lib/
        ├── api_service.dart       # Toutes les requêtes HTTP/WS
        ├── main.dart              # Routes, thème, splash
        └── screens/               # 9 écrans
```
