# 🔍 Model Interpretability Quick Reference

## 7 Analysis Cells - At a Glance

| Cell | Output | What It Shows | Key Question |
|------|--------|---------------|--------------|
| **1. Layer Extractor** 🔧 | - | Prepares infrastructure | Are layers accessible? |
| **2. Conv Features** 🎨 | `conv_feature_maps_analysis.png` | Feature evolution through network | Are Conv layers learning? |
| **3. Attention** 🎯 | `attention_temporal_importance.png` | Temporal focus regions | Where does model look? |
| **4. Sensor Importance** 📡 | `sensor_channel_importance.png` | Which sensors matter | Can we remove sensors? |
| **5. Embeddings** 🌌 | `embedding_space_visualization.png` | Exercise separation | Are exercises distinguishable? |
| **6. Layer Stats** 📈 | `layer_activation_statistics.png` | Layer health metrics | Are layers working properly? |
| **7. Filter Specialization** 🎯 | `exercise_specific_filters.png` | Filter exercise preference | Are filters specialized? |

---

## 🚨 Red Flags to Watch For

### 🎨 Conv Feature Maps
- ❌ All maps look like random noise → Poor training
- ❌ Later layers same as early layers → Not learning hierarchy
- ❌ All zeros or all ones → Dead/saturated layers

### 🎯 Attention Patterns
- ❌ Flat/uniform attention → Not using attention mechanism
- ❌ Random spikes → Attention not converged
- ❌ Only at window edges → Boundary artifacts

### 📡 Sensor Importance
- ❌ Positive importance score → Sensor adds noise, REMOVE IT
- ❌ All sensors near zero → Model ignoring inputs
- ❌ Huge left/right imbalance → Check sensor placement

### 🌌 Embedding Space
- ❌ Silhouette score < 0.2 → Poor separation
- ❌ Davies-Bouldin > 2.0 → Bad clustering
- ❌ Overlapping exercise clusters → Increase embedding_dim

### 📈 Layer Activation Stats
- ❌ Mean activation near 0 → Dead layer
- ❌ Mean activation > 1.0 → Saturated layer
- ❌ Sparsity > 95% → Dead neurons
- ❌ Sparsity < 10% → Over-active

### 🎯 Filter Specialization
- ❌ All filters general (< 0.3) → Underfitting
- ❌ All filters specialized (> 0.8) → Overfitting
- ❌ Some exercises have no filters → Poor performance

---

## ✅ Healthy Model Indicators

### Good Conv Feature Maps
```
Early layers → Simple patterns (edges, peaks)
Middle layers → Motion primitives (rhythm, acceleration)
Late layers → Abstract, exercise-specific features
```

### Good Attention
```
Peaks at:
  • Movement transitions (start/end of rep)
  • Peak acceleration moments
  • Exercise-discriminative events
```

### Good Sensor Importance
```
Left Ear: -0.03 to -0.08 (important)
Right Ear: -0.02 to -0.07 (important)
Accelerometer: -0.04 to -0.09 (critical)
Gyroscope: -0.02 to -0.06 (useful)
```

### Good Embedding Space
```
Silhouette score: > 0.5 (excellent) or > 0.3 (good)
Davies-Bouldin: < 1.0 (excellent) or < 1.5 (good)
Clusters: Separated, compact, clear boundaries
```

### Good Layer Stats
```
Early layers: Medium activation, low sparsity (40-60%)
Middle layers: Medium activation, medium sparsity (50-70%)
Late layers: Lower activation, high sparsity (60-80%)
```

### Good Filter Specialization
```
30-40% highly specialized (> 0.7)
30-40% moderately specialized (0.4-0.7)
20-30% general purpose (< 0.4)
Each exercise has 3-5 dedicated filters
```

---

## 🛠️ Quick Fixes

| Problem | Solution |
|---------|----------|
| **Underfitting** | ↑ embedding_dim, ↑ layers, ↓ dropout, ↓ L2_reg, train longer |
| **Overfitting** | ↑ dropout, ↑ L2_reg, ↑ augmentation, early stopping |
| **Dead layers** | ↓ dropout, check learning rate, check initialization |
| **Saturated layers** | Add batch norm, ↓ learning rate |
| **Poor attention** | Adjust num_heads, key_dim, dropout |
| **Redundant sensors** | Remove low-importance channels |
| **Poor embeddings** | ↑ embedding_dim, ↑ contrastive loss weight |
| **Filters too general** | ↑ capacity, train longer, ↓ regularization |
| **Filters too specialized** | ↑ dropout, ↑ L2_reg, ↑ augmentation |

---

## 📊 Metrics Interpretation

### Silhouette Score
```
> 0.7   Excellent separation ★★★★★
0.5-0.7 Good separation ★★★★
0.3-0.5 Moderate separation ★★★
0.1-0.3 Weak separation ★★
< 0.1   Poor separation ★
```

### Davies-Bouldin Index (Lower is Better)
```
< 0.5   Excellent ★★★★★
0.5-1.0 Good ★★★★
1.0-1.5 Moderate ★★★
1.5-2.0 Weak ★★
> 2.0   Poor ★
```

### Layer Sparsity (Context-Dependent)
```
Early layers: 20-50% is ideal
Middle layers: 40-70% is ideal
Late layers: 60-80% is ideal

Too low (< 10%): All neurons firing (bad)
Too high (> 95%): Most neurons dead (bad)
```

### Filter Specialization Score
```
> 0.8   Highly specialized (exercise-specific)
0.5-0.8 Moderately specialized (shared patterns)
< 0.5   General purpose (common features)

Good balance: Mix of all three types
```

---

## 🎯 Diagnosis Flowchart

```
Start: Model not performing well
    ↓
Check Cell 6 (Layer Stats)
    ↓
Dead/Saturated layers? 
    → YES: Fix layer health first
    → NO: Continue
    ↓
Check Cell 2 (Conv Features)
    ↓
Features evolving?
    → NO: Increase capacity
    → YES: Continue
    ↓
Check Cell 5 (Embeddings)
    ↓
Clusters separated?
    → NO: Increase embedding_dim
    → YES: Continue
    ↓
Check Cell 7 (Filter Specialization)
    ↓
All general?
    → YES: Train longer, increase capacity
All specialized?
    → YES: Add regularization
Good balance?
    → YES: Issue may be in data or task heads
```

---

## 💾 Save These Files

After running all cells, you'll have:
1. `conv_feature_maps_analysis.png`
2. `attention_temporal_importance.png`
3. `sensor_channel_importance.png`
4. `embedding_space_visualization.png`
5. `layer_activation_statistics.png`
6. `exercise_specific_filters.png`

**Keep these for:**
- Model comparison (before/after changes)
- Debugging sessions
- Documentation
- Presentations
- Paper figures

---

## 🚀 Typical Workflow

1. **Train model** (run training cells)
2. **Run Cell 1** (extract layers)
3. **Run Cells 2-7** (generate all analyses)
4. **Review all plots** (look for red flags)
5. **Identify issues** (use this quick reference)
6. **Apply fixes** (adjust hyperparameters)
7. **Repeat** (iterate until satisfied)

---

## 📞 When to Use Each Cell

| Situation | Use Cells |
|-----------|-----------|
| **First time training** | All (1-7) |
| **After architecture change** | All (1-7) |
| **After data preprocessing change** | 2, 4, 6 |
| **After hyperparameter tuning** | 6, 7 |
| **Debugging poor accuracy** | 5, 7 |
| **Checking sensor placement** | 4 |
| **Understanding predictions** | 2, 3, 5 |
| **Optimizing efficiency** | 4, 6, 7 |

---

## 🎓 Remember

**Good model = Interpretable model**

These tools help you:
- ✅ Understand what model learns
- ✅ Debug issues faster
- ✅ Improve systematically
- ✅ Trust predictions
- ✅ Explain to stakeholders

**Not just accuracy—UNDERSTANDING!** 🧠

---

*For detailed explanations, see MODEL_INTERPRETABILITY_GUIDE.md*
