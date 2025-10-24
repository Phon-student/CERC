# 🔍 Model Interpretability Guide

## Overview

This guide explains the **7 interpretability analysis cells** added to the notebook. These cells help you understand **what each block of the model is interested in** and provide actionable insights for model improvement.

---

## 🎯 What Can We Learn?

### Questions These Analyses Answer:

1. **What patterns do convolutional layers detect?**
   - Do early layers focus on high-frequency noise or meaningful features?
   - Do later layers capture exercise-specific patterns?
   - Which layers are most important?

2. **What does attention focus on?**
   - Which timesteps are most important for predictions?
   - Does attention focus on movement transitions or peak moments?
   - Are attention patterns consistent across exercises?

3. **Which sensors matter most?**
   - Are left and right ear sensors equally important?
   - Are accelerometers or gyroscopes more critical?
   - Can we remove any sensors without losing accuracy?

4. **How well does the model separate exercises?**
   - Are exercise embeddings well-clustered?
   - Do similar exercises get confused?
   - Is the embedding space quality good?

5. **Are layers healthy and efficient?**
   - Are any layers saturated (all neurons firing)?
   - Are any layers dead (no neurons firing)?
   - Is sparsity appropriate for each layer?

6. **Which filters are exercise-specific?**
   - Do some filters specialize on specific exercises?
   - Are there general-purpose filters?
   - Is there good balance between specialized and general filters?

---

## 📊 The 7 Analysis Cells

### Cell 1: Intermediate Layer Output Extractor 🔧

**What it does:**
- Creates a model that outputs activations from all intermediate layers
- Prepares infrastructure for visualization

**What to look for:**
- Number of analyzable layers found
- Layer names extracted successfully

**Troubleshooting:**
- If no layers found: Model may not be trained yet
- If extraction fails: Check model architecture compatibility

---

### Cell 2: Convolutional Feature Map Visualization 🎨

**Output:** `conv_feature_maps_analysis.png`

**What it shows:**
- Original input signal (12 channels, color-coded by ear)
- Feature maps from each Conv1D layer
- Evolution of representations through the network

**How to interpret:**

```
Input Signal → Conv1 → Conv2 → Conv3 → ... → Output

Early Layers (Conv1-2):
   ✅ Should show: Simple patterns (peaks, edges, slopes)
   ❌ Red flag: Random noise, no structure

Middle Layers (Conv3-4):
   ✅ Should show: Motion primitives (acceleration patterns, rhythm)
   ❌ Red flag: Too similar to input (not learning)

Later Layers (Conv5-6):
   ✅ Should show: Exercise-specific patterns, abstract features
   ❌ Red flag: All zeros (dead layer) or all same (oversaturation)
```

**Visual cues:**
- **Bright regions** = High activation (layer finds this pattern interesting)
- **Dark regions** = Low activation (pattern not relevant)
- **Horizontal stripes** = Temporal patterns (good!)
- **Vertical stripes** = Channel-specific features
- **Diagonal patterns** = Tempo-spatial features (best!)

**Action items:**
- If early layers show noise → Improve input filtering
- If later layers too similar to early → Add more layers or attention
- If all layers similar → Model underfitting, increase capacity

---

### Cell 3: Attention Weight Visualization 🎯

**Output:** `attention_temporal_importance.png`

**What it shows:**
- Temporal importance scores (which timesteps model focuses on)
- Comparison with original signal magnitude
- Peak attention regions marked with red X

**How to interpret:**

```
High Attention Stems:
   ✅ At movement transitions (start/end of rep)
   ✅ At peak acceleration moments
   ✅ At exercise-discriminative events
   
   ❌ Random distribution (not learning useful patterns)
   ❌ All equal (not using attention mechanism)
   ❌ Only on edges (over-focusing on window boundaries)
```

**What good attention looks like:**
- **Squats**: Attention peaks at bottom of squat (direction change)
- **Bicep curls**: Attention at contraction peaks
- **Jumping jacks**: Attention at jump takeoff/landing
- **Lateral raises**: Attention at arm extension peaks

**Action items:**
- Random attention → Increase attention dropout or reduce num_heads
- Over-focused attention → Decrease attention dropout
- Edge-focused attention → Improve window tapering (Tukey window)

---

### Cell 4: Sensor Channel Importance Analysis 📡

**Output:** `sensor_channel_importance.png`

**What it shows:**
- Permutation importance for each of 12 IMU channels
- Grouped importance (left/right ear, accel/gyro)
- Accuracy drop when each channel is shuffled

**How to interpret:**

```
Importance Score (Accuracy Drop):
   Large Negative (e.g., -0.05): CRITICAL sensor
   Small Negative (e.g., -0.01): USEFUL sensor
   Near Zero (±0.001): REDUNDANT sensor
   Positive (e.g., +0.01): HARMFUL sensor (noise!)
```

**Example insights:**
```
Left Ear More Important:
   → Dominant hand motions better captured by left ear
   → Right ear may have placement issues

Gyroscope More Important:
   → Rotation patterns more discriminative than acceleration
   → Consider gyro-only model for efficiency

R_Acc_X has positive score:
   → This sensor adds noise, consider removing
   → May be a mounting/calibration issue
```

**Action items:**
- Positive importance → Remove that sensor (it's harmful!)
- Very low importance → Consider removing for efficiency
- One ear dominates → Check sensor placement symmetry
- All low importance → Model not using input well (check architecture)

---

### Cell 5: Embedding Space Visualization 🌌

**Output:** `embedding_space_visualization.png`

**What it shows:**
- 2D projections (PCA and t-SNE) of 64D embedding space
- Exercise clusters (colored by class)
- Quality score/category overlays
- Silhouette score and Davies-Bouldin index

**How to interpret:**

```
Good Embedding Space:
   ✅ Well-separated clusters per exercise
   ✅ Tight, compact clusters (low intra-class variance)
   ✅ Large gaps between clusters (high inter-class variance)
   ✅ Silhouette score > 0.5
   ✅ Davies-Bouldin index < 1.0

Poor Embedding Space:
   ❌ Overlapping clusters (exercises confused)
   ❌ Scattered points (high intra-class variance)
   ❌ No clear structure
   ❌ Silhouette score < 0.2
   ❌ Davies-Bouldin index > 2.0
```

**Quality coloring insights:**
- Good form samples cluster together → Model captures quality
- Poor form scattered → Quality labeling may be noisy
- Quality gradient within exercise cluster → Good quality discrimination

**Action items:**
- Overlapping clusters → Increase embedding_dim or add more layers
- Scattered clusters → Add more regularization (L2, dropout)
- Poor quality separation → Adjust quality label generation
- Low silhouette score → Increase contrastive/triplet loss weight

---

### Cell 6: Layer-wise Activation Statistics 📈

**Output:** `layer_activation_statistics.png`

**What it shows:**
- Mean activation magnitude per layer
- Sparsity (fraction near zero) per layer
- Activation variability (std dev) per layer
- Activation range through network

**How to interpret:**

```
Healthy Activation Patterns:
   
   Early Layers:
      • Mean activation: Medium-High (0.1-0.5)
      • Sparsity: Low-Medium (20-50%)
      • Interpretation: Detecting many low-level features
   
   Middle Layers:
      • Mean activation: Medium (0.05-0.2)
      • Sparsity: Medium (40-60%)
      • Interpretation: Selective feature combination
   
   Late Layers:
      • Mean activation: Low-Medium (0.02-0.1)
      • Sparsity: High (60-80%)
      • Interpretation: Highly selective, abstract features

Problematic Patterns:
   
   Dead Layer (Bad):
      • Mean activation near 0
      • Sparsity > 95%
      • Action: Reduce dropout, adjust learning rate
   
   Saturated Layer (Bad):
      • Mean activation very high (>1.0)
      • Sparsity very low (<10%)
      • Action: Add batch norm, reduce learning rate
   
   All Layers Similar (Bad):
      • No progression through network
      • Action: Increase model capacity
```

**Action items:**
- Dead layer → Check gradients, reduce regularization
- Saturated layer → Add batch normalization
- Low sparsity everywhere → Add more dropout
- High sparsity everywhere → Model may be too regularized

---

### Cell 7: Exercise-Specific Filter Responses 🎯

**Output:** `exercise_specific_filters.png`

**What it shows:**
- Heatmap: Which filters respond to which exercises
- Top-k most responsive filters per exercise
- Filter specialization scores (exercise-specific vs general)

**How to interpret:**

```
Filter Specialization Spectrum:

Highly Specialized Filter (Score > 0.7):
   • Responds strongly to ONE exercise type
   • Critical for discriminating that exercise
   • Example: Filter 23 → Only activates for squats
   
Moderately Specialized (Score 0.4-0.7):
   • Responds to 2-3 related exercises
   • Captures shared patterns
   • Example: Filter 45 → Activates for jumping exercises
   
General Purpose Filter (Score < 0.4):
   • Responds similarly to all exercises
   • Captures common motion patterns
   • Example: Filter 12 → Activates for all movement

Optimal Balance:
   ✅ 30-40% highly specialized
   ✅ 30-40% moderately specialized  
   ✅ 20-30% general purpose
```

**What to look for:**

**Good model:**
```
✅ Mix of specialized and general filters
✅ Each exercise has 3-5 dedicated filters
✅ Some filters shared between similar exercises
✅ Specialization increases in later layers
```

**Bad model:**
```
❌ All filters general (score < 0.3) → Underfitting
❌ All filters specialized (score > 0.8) → Overfitting
❌ Some exercises have no dedicated filters → Poor performance
❌ Random specialization pattern → Not converged
```

**Action items:**
- All filters too general → Increase model capacity, train longer
- All filters too specialized → Add dropout, increase L2 regularization
- Unbalanced (some exercises dominate) → Adjust class weights
- No clear pattern → Model not converged, train longer

---

## 🎓 Interpretation Workflow

### Step 1: Check Layer Health (Cell 6)
```
Question: Are layers functioning properly?

Look at: Layer activation statistics
- Dead layers? → Adjust learning rate, reduce dropout
- Saturated layers? → Add batch norm, check gradients
- Good progression? → ✅ Continue to next step
```

### Step 2: Understand Feature Extraction (Cell 2)
```
Question: Are Conv layers learning useful features?

Look at: Feature map visualizations
- Early layers show structure? → ✅ Good
- Later layers show abstract patterns? → ✅ Good
- All layers similar? → ❌ Increase capacity
- Random noise? → ❌ Improve data preprocessing
```

### Step 3: Check Attention Mechanism (Cell 3)
```
Question: Is attention focusing on the right things?

Look at: Attention importance plots
- Peaks at movement transitions? → ✅ Good
- Random distribution? → ❌ Attention not working
- All equal? → ❌ Not using attention
- Only at edges? → ❌ Window boundary artifact
```

### Step 4: Evaluate Input Features (Cell 4)
```
Question: Are all sensors needed?

Look at: Channel importance analysis
- Any negative importance? → ✅ Keep those sensors
- Any positive importance? → ❌ Remove those sensors
- All near zero? → ❌ Model not using inputs
- Big imbalance left/right? → ⚠️ Check sensor placement
```

### Step 5: Assess Discrimination Ability (Cell 5)
```
Question: Can model separate exercises well?

Look at: Embedding space visualization
- Clear, separated clusters? → ✅ Excellent
- Silhouette score > 0.5? → ✅ Good separation
- Overlapping clusters? → ❌ Increase embedding_dim
- Scattered points? → ❌ Add regularization
```

### Step 6: Analyze Filter Specialization (Cell 7)
```
Question: Do filters specialize appropriately?

Look at: Filter specialization analysis
- Mix of specialized/general? → ✅ Balanced
- All general (< 0.3)? → ❌ Underfitting
- All specialized (> 0.8)? → ❌ Overfitting
- Each exercise has dedicated filters? → ✅ Good
```

---

## 🛠️ Common Issues and Solutions

### Issue 1: Poor Exercise Classification Accuracy

**Diagnosis workflow:**
1. Check Cell 5 (Embeddings): Are clusters separated?
   - No → Increase embedding_dim, add layers
   - Yes → Problem is in classification head

2. Check Cell 7 (Filters): Do exercises have dedicated filters?
   - No → Train longer, increase capacity
   - Yes → Problem may be in data

3. Check Cell 4 (Sensors): Are important sensors used?
   - No → Check input preprocessing
   - Yes → Continue investigation

4. Check Cell 2 (Features): Do later layers show patterns?
   - No → Add more Conv blocks
   - Yes → Problem is in task heads

---

### Issue 2: Model Not Learning (Loss Plateaus)

**Diagnosis workflow:**
1. Check Cell 6 (Layer Stats): Any dead layers?
   - Yes → Reduce dropout, adjust learning rate
   - No → Continue

2. Check Cell 2 (Features): Are features evolving?
   - No → Increase learning rate, check gradients
   - Yes → Continue

3. Check Cell 7 (Filters): Are filters specializing?
   - No → Train longer, reduce regularization
   - Yes → Loss plateau may be optimal

---

### Issue 3: Model Overfitting

**Diagnosis workflow:**
1. Check Cell 7 (Filters): All filters too specialized?
   - Yes → Increase dropout, add L2 reg
   - No → Continue

2. Check Cell 6 (Layer Stats): Very high sparsity?
   - Yes → Model too selective, add augmentation
   - No → Continue

3. Check Cell 5 (Embeddings): Very tight, separated clusters?
   - Yes → Good! Not overfitting on embeddings
   - No → May be overfitting on classification head

---

### Issue 4: One Exercise Performing Poorly

**Diagnosis workflow:**
1. Check Cell 7 (Filters): Does this exercise have dedicated filters?
   - No → Check class balance, adjust loss weights
   - Yes → Continue

2. Check Cell 5 (Embeddings): Is this cluster overlapping others?
   - Yes → Exercise may be too similar to another
   - No → Continue

3. Check Cell 3 (Attention): Does attention pattern make sense?
   - No → May be data quality issue
   - Yes → Check training data for this class

---

## 📈 Using Insights for Model Improvement

### Scenario 1: Model Underfitting

**Symptoms:**
- Low train and validation accuracy
- All filters are general (Cell 7)
- Poor cluster separation (Cell 5)
- Features don't evolve much (Cell 2)

**Solutions:**
```python
# Increase model capacity
embedding_dim = 128  # Was 64
num_attention_heads = 8  # Was 4

# Add more Conv blocks
# (Modify create_backbone_regularized)

# Reduce regularization
dropout = 0.2  # Was 0.3-0.4
l2_reg = 0.0001  # Was 0.001

# Train longer
epochs = 200  # Was 100
```

---

### Scenario 2: Model Overfitting

**Symptoms:**
- High train accuracy, low validation accuracy
- All filters highly specialized (Cell 7)
- Very tight clusters (Cell 5)
- High layer sparsity (Cell 6)

**Solutions:**
```python
# Increase regularization
dropout = 0.5  # Was 0.3
l2_reg = 0.01  # Was 0.001

# Add more augmentation
augmentation_factor = 3  # Was 2

# Use early stopping
EarlyStopping(patience=20)  # Was 50

# Reduce model capacity (if severe)
embedding_dim = 32  # Was 64
```

---

### Scenario 3: Attention Not Working

**Symptoms:**
- Random attention patterns (Cell 3)
- Attention doesn't improve accuracy
- No clear focus on discriminative regions

**Solutions:**
```python
# Adjust attention configuration
num_heads = 4  # Try 2, 4, or 8
key_dim = 16  # Try 8, 16, or 32
attention_dropout = 0.2  # Try 0.1-0.3

# Or remove attention if not helping
# Replace with GlobalAveragePooling
```

---

### Scenario 4: Sensor Redundancy

**Symptoms:**
- Many sensors have near-zero importance (Cell 4)
- Left and right ear very imbalanced
- Some sensors have positive importance (harmful)

**Solutions:**
```python
# Option 1: Remove redundant sensors
important_channels = [0, 1, 2, 3, 6, 7]  # Keep only important ones
X_filtered = X[:, :, important_channels]

# Option 2: Use only one ear
X_left = X[:, :, :6]   # Left ear only
X_right = X[:, :, 6:]  # Right ear only

# Option 3: Use only one sensor type
X_accel = X[:, :, [0,1,2,6,7,8]]   # Accelerometers only
X_gyro = X[:, :, [3,4,5,9,10,11]]  # Gyroscopes only
```

---

## 💡 Best Practices

### 1. Run Interpretability After Every Major Change
- After adjusting hyperparameters
- After adding new data
- After changing architecture
- After modifying preprocessing

### 2. Compare Before/After
- Save all plots with timestamps
- Track metrics in a spreadsheet
- Document what changed and why

### 3. Look for Consistency
- Do all analyses agree on issues?
- Are insights consistent across exercises?
- Do multiple runs show same patterns?

### 4. Prioritize Actionable Insights
- Focus on clear, fixable issues first
- Don't over-optimize based on single metric
- Balance multiple objectives (accuracy, efficiency, interpretability)

### 5. Trust the Data
- If sensors show low importance, believe it
- If embeddings overlap, exercises may be too similar
- If attention is random, mechanism may not be needed

---

## 📚 Further Reading

### Recommended Papers:
1. **Grad-CAM**: "Grad-CAM: Visual Explanations from Deep Networks" (Selvaraju et al., 2017)
2. **LIME**: "Why Should I Trust You?" (Ribeiro et al., 2016)
3. **Attention Mechanisms**: "Attention Is All You Need" (Vaswani et al., 2017)
4. **Filter Visualization**: "Visualizing and Understanding Convolutional Networks" (Zeiler & Fergus, 2014)

### Tools:
- **TensorBoard**: For real-time activation visualization
- **Netron**: For model architecture visualization
- **What-If Tool**: For interactive model exploration

---

## 🎯 Summary

These 7 interpretability cells transform your model from a "black box" into an **understandable, debuggable, and improvable system**.

**Use them to:**
- ✅ Understand what each layer learns
- ✅ Identify and fix model issues
- ✅ Optimize model architecture
- ✅ Explain predictions to stakeholders
- ✅ Guide feature engineering
- ✅ Validate model behavior

**Remember:** Good models are not just accurate—they're **interpretable, debuggable, and trustworthy**! 🚀

---

*For questions or issues, refer to the notebook cells or consult the ARCHITECTURE_GUIDE.md*
