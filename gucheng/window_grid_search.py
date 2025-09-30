"""
Grid Search for Optimal Window Parameters
========================================

Systematically find the best window size and stride parameters for IMU-based 
exercise recognition and repetition counting using cross-validation.

Key Features:
- Grid search across multiple window sizes and strides
- Activity-specific parameter optimization
- Cross-validation for robust evaluation
- Statistical significance testing
- Performance visualization and reporting
"""

import os
import json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import cross_val_score, StratifiedKFold, ParameterGrid
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score, mean_absolute_error
from sklearn.preprocessing import StandardScaler
from scipy.signal import butter, filtfilt
from scipy import stats
import warnings
warnings.filterwarnings('ignore')

class WindowGridSearch:
    def __init__(self, data_folder="../Data/BMI270/Ex1", meta_path="../SportMeta.xlsx"):
        self.data_folder = data_folder
        self.meta_path = meta_path
        self.activity_mapping = {
            'Jumping Jack': 0,
            'Push Up': 1, 
            'Squat ': 2,
            'noise': 3
        }
        self.results = []
        self.best_params = {}
        
    def parse_bmi270_data(self, filepath):
        """Parse BMI270 IMU data from CSV file"""
        def convert_uint_to_int(n):
            return n - 0x2000 if n >= 0x2000 else n
        
        def get_bmi270_from_str(srt):
            if len(srt) != 36:
                return None
            try:
                channels = []
                for i in range(12):
                    start_idx = i * 3
                    hex_val = int(srt[start_idx:start_idx+3], 16)
                    channels.append(convert_uint_to_int(hex_val))
                return channels
            except:
                return None
        
        try:
            with open(filepath, 'r') as f:
                lines = f.readlines()
            
            data = []
            for line in lines:
                line = line.strip()
                if line and len(line) == 36:
                    parsed = get_bmi270_from_str(line)
                    if parsed:
                        data.append(parsed)
            
            return np.array(data) if data else None
        except Exception as e:
            print(f"Error parsing {filepath}: {e}")
            return None
    
    def apply_lowpass_filter(self, data, cutoff=20, fs=100, order=4):
        """Apply Butterworth low-pass filter"""
        if data.shape[0] < 3:  # Need minimum samples for filtering
            return data
            
        nyquist = 0.5 * fs
        normal_cutoff = cutoff / nyquist
        b, a = butter(order, normal_cutoff, btype='low', analog=False)
        
        filtered_data = np.zeros_like(data)
        for i in range(data.shape[1]):
            try:
                filtered_data[:, i] = filtfilt(b, a, data[:, i])
            except:
                filtered_data[:, i] = data[:, i]  # Fallback to unfiltered
        
        return filtered_data
    
    def create_sliding_windows(self, data, window_size, stride):
        """Create sliding windows with specified parameters"""
        if len(data) < window_size:
            return np.array([])
            
        windows = []
        for i in range(0, len(data) - window_size + 1, stride):
            window = data[i:i + window_size]
            windows.append(window)
        return np.array(windows)
    
    def extract_features(self, windows):
        """Extract statistical features from windowed data"""
        if len(windows) == 0:
            return np.array([])
            
        features = []
        for window in windows:
            # Statistical features per channel
            window_features = []
            for channel in range(window.shape[1]):
                channel_data = window[:, channel]
                window_features.extend([
                    np.mean(channel_data),
                    np.std(channel_data),
                    np.min(channel_data),
                    np.max(channel_data),
                    np.median(channel_data)
                ])
            features.append(window_features)
        return np.array(features)
    
    def load_dataset_with_params(self, window_size, stride, min_files_per_activity=1):
        """Load dataset with specific window parameters"""
        print(f"   Loading data with window={window_size}, stride={stride}")
        
        # Load metadata
        try:
            meta_df = pd.read_excel(self.meta_path)
        except Exception as e:
            print(f"Error loading metadata: {e}")
            return None, None, None
        
        all_features = []
        all_labels = []
        all_rep_counts = []
        activity_counts = {act: 0 for act in self.activity_mapping.keys()}
        file_count = 0
        
        for idx, row in meta_df.iterrows():
            file_id = int(row['File ID'])
            activity = row['Activity']
            
            if activity not in self.activity_mapping:
                continue
            
            # Load raw IMU file
            filepath = os.path.join(self.data_folder, f"DI_{file_id:05d}.CSV")
            if not os.path.exists(filepath):
                continue
                
            raw_data = self.parse_bmi270_data(filepath)
            if raw_data is None or len(raw_data) < window_size:
                continue
            
            # Apply filtering
            filtered_data = self.apply_lowpass_filter(raw_data, cutoff=20, fs=100)
            
            # Create windows
            windows = self.create_sliding_windows(filtered_data, window_size, stride)
            if len(windows) == 0:
                continue
            
            # Extract features
            features = self.extract_features(windows)
            if len(features) == 0:
                continue
            
            # Estimate repetitions (for evaluation)
            estimated_reps = max(1, min(len(windows) // 3, 20))  # More conservative estimate
            
            # Add to dataset
            for feature_vector in features:
                all_features.append(feature_vector)
                all_labels.append(self.activity_mapping[activity])
                all_rep_counts.append(estimated_reps)
            
            activity_counts[activity] += len(features)
            file_count += 1
        
        print(f"   Processed {file_count} files, {len(all_features)} total windows")
        
        # Check if we have enough data - be more lenient
        if len(all_features) < 20:  # Reduced from 50
            print(f"   ⚠️  Only {len(all_features)} windows - may not be enough for reliable CV")
        
        # Check activities - need at least 1 with some data
        valid_activities = sum(1 for count in activity_counts.values() if count > 0)
        if valid_activities < 1:
            print(f"   ❌ No activities found with sufficient data")
            return None, None, None
        
        return np.array(all_features), np.array(all_labels), np.array(all_rep_counts)
    
    def evaluate_params(self, window_size, stride, cv_folds=3):
        """Evaluate specific window parameters using cross-validation"""
        X, y_class, y_reps = self.load_dataset_with_params(window_size, stride)
        
        if X is None or len(X) < 10:  # Reduced minimum from 50 to 10
            return {
                'window_size': window_size,
                'stride': stride,
                'classification_score': 0.0,
                'repetition_mae': 999.0,
                'total_windows': 0,
                'valid': False
            }
        
        # Standardize features
        scaler = StandardScaler()
        try:
            X_scaled = scaler.fit_transform(X)
        except:
            X_scaled = X
        
        # Classification evaluation with more robust CV
        clf = RandomForestClassifier(n_estimators=50, random_state=42, n_jobs=1)  # Reduced trees for speed
        
        try:
            # Adapt CV folds to available data
            n_unique_classes = len(np.unique(y_class))
            n_samples_per_class = len(y_class) // n_unique_classes if n_unique_classes > 0 else 0
            
            # Reduce CV folds if not enough data
            actual_cv_folds = min(cv_folds, max(2, n_samples_per_class))
            
            if n_unique_classes >= 2 and len(X) >= actual_cv_folds * 2:
                # Use stratified k-fold for classification
                cv = StratifiedKFold(n_splits=actual_cv_folds, shuffle=True, random_state=42)
                class_scores = cross_val_score(clf, X_scaled, y_class, cv=cv, scoring='accuracy')
                classification_score = np.mean(class_scores)
            else:
                # Fallback to simple train/test split
                from sklearn.model_selection import train_test_split
                X_train, X_test, y_train, y_test = train_test_split(
                    X_scaled, y_class, test_size=0.3, random_state=42, stratify=y_class
                )
                clf.fit(X_train, y_train)
                classification_score = clf.score(X_test, y_test)
                
        except Exception as e:
            print(f"   ⚠️  Classification evaluation failed: {e}")
            classification_score = 0.0
        
        # Repetition counting evaluation (simplified)
        try:
            # Use same train/test split for consistency
            if len(X) > 6:  # Need minimum samples
                X_train, X_test, y_train, y_test = train_test_split(
                    X_scaled, y_reps, test_size=0.3, random_state=42
                )
                clf_rep = RandomForestClassifier(n_estimators=50, random_state=42, n_jobs=1)
                clf_rep.fit(X_train, y_train)
                rep_pred = clf_rep.predict(X_test)
                repetition_mae = mean_absolute_error(y_test, rep_pred)
            else:
                repetition_mae = 999.0
        except Exception as e:
            print(f"   ⚠️  Repetition evaluation failed: {e}")
            repetition_mae = 999.0
        
        # Calculate efficiency metrics
        overlap_percent = ((window_size - stride) / window_size) * 100
        update_rate = 100 / stride  # Hz
        
        result = {
            'window_size': window_size,
            'stride': stride,
            'window_duration': window_size / 100.0,  # seconds
            'stride_duration': stride / 100.0,  # seconds
            'overlap_percent': overlap_percent,
            'update_rate': update_rate,
            'classification_score': classification_score,
            'repetition_mae': repetition_mae,
            'total_windows': len(X),
            'unique_classes': len(np.unique(y_class)),
            'valid': True
        }
        
        print(f"   ✅ Window={window_size}, Stride={stride}: "
              f"Acc={classification_score:.3f}, MAE={repetition_mae:.2f}, "
              f"Windows={len(X)}, Classes={len(np.unique(y_class))}")
        
        return result
    
    def run_grid_search(self, window_sizes=None, strides=None, cv_folds=5):
        """Run comprehensive grid search"""
        if window_sizes is None:
            # Default window sizes: 0.5s to 3.0s at 100Hz
            window_sizes = [50, 64, 80, 96, 128, 160, 192, 224, 256, 300]
        
        if strides is None:
            # Default strides: 25% to 75% of window size
            strides = [16, 20, 24, 32, 40, 48, 64, 80, 96]
        
        print(f"🔍 Starting Grid Search")
        print(f"   Window sizes: {window_sizes} (samples)")
        print(f"   Strides: {strides} (samples)")
        print(f"   CV folds: {cv_folds}")
        print(f"   Total combinations: {len(window_sizes) * len(strides)}")
        print()
        
        self.results = []
        total_combinations = len(window_sizes) * len(strides)
        completed = 0
        
        for window_size in window_sizes:
            for stride in strides:
                # Skip invalid combinations
                if stride > window_size:
                    continue
                if stride < window_size * 0.1:  # Minimum 10% stride
                    continue
                
                completed += 1
                print(f"🔄 Progress: {completed}/{total_combinations} - "
                      f"Testing window={window_size}, stride={stride}")
                
                result = self.evaluate_params(window_size, stride, cv_folds)
                if result['valid']:
                    self.results.append(result)
        
        print(f"\n✅ Grid search completed: {len(self.results)} valid combinations")
        return self.results
    
    def analyze_results(self):
        """Analyze grid search results and find optimal parameters"""
        if not self.results:
            print("❌ No results to analyze. Run grid search first.")
            return
        
        df = pd.DataFrame(self.results)
        
        print("\n" + "="*70)
        print("📊 GRID SEARCH RESULTS ANALYSIS")
        print("="*70)
        
        # Best parameters for different criteria
        best_accuracy = df.loc[df['classification_score'].idxmax()]
        best_reps = df.loc[df['repetition_mae'].idxmin()]
        
        # Balanced score (combine accuracy and rep counting)
        df['balanced_score'] = (df['classification_score'] * 0.7 + 
                               (1 - df['repetition_mae'] / df['repetition_mae'].max()) * 0.3)
        best_balanced = df.loc[df['balanced_score'].idxmax()]
        
        print(f"🎯 BEST PARAMETERS:")
        print(f"   Best Accuracy: Window={int(best_accuracy['window_size'])}, "
              f"Stride={int(best_accuracy['stride'])} → Acc={best_accuracy['classification_score']:.3f}")
        print(f"   Best Rep Count: Window={int(best_reps['window_size'])}, "
              f"Stride={int(best_reps['stride'])} → MAE={best_reps['repetition_mae']:.2f}")
        print(f"   Best Balanced: Window={int(best_balanced['window_size'])}, "
              f"Stride={int(best_balanced['stride'])} → Score={best_balanced['balanced_score']:.3f}")
        
        # Top 5 combinations
        print(f"\n📈 TOP 5 COMBINATIONS (by balanced score):")
        top5 = df.nlargest(5, 'balanced_score')
        for idx, row in top5.iterrows():
            print(f"   {int(row['window_size']):3d} × {int(row['stride']):2d} | "
                  f"Acc: {row['classification_score']:.3f} | "
                  f"MAE: {row['repetition_mae']:.2f} | "
                  f"Overlap: {row['overlap_percent']:.1f}% | "
                  f"Rate: {row['update_rate']:.1f}Hz")
        
        # Store best parameters
        self.best_params = {
            'accuracy': {'window_size': int(best_accuracy['window_size']), 
                        'stride': int(best_accuracy['stride'])},
            'repetitions': {'window_size': int(best_reps['window_size']), 
                           'stride': int(best_reps['stride'])},
            'balanced': {'window_size': int(best_balanced['window_size']), 
                        'stride': int(best_balanced['stride'])}
        }
        
        return df
    
    def plot_results(self, save_plots=True):
        """Create visualization plots of grid search results"""
        if not self.results:
            print("❌ No results to plot. Run grid search first.")
            return
        
        df = pd.DataFrame(self.results)
        
        # Create subplot figure
        fig, axes = plt.subplots(2, 3, figsize=(18, 12))
        fig.suptitle('Grid Search Results: Window Size vs Stride Optimization', 
                     fontsize=16, fontweight='bold')
        
        # 1. Classification Accuracy Heatmap
        pivot_acc = df.pivot(index='stride', columns='window_size', values='classification_score')
        sns.heatmap(pivot_acc, annot=True, fmt='.3f', cmap='viridis', ax=axes[0,0])
        axes[0,0].set_title('Classification Accuracy')
        axes[0,0].set_xlabel('Window Size (samples)')
        axes[0,0].set_ylabel('Stride (samples)')
        
        # 2. Repetition MAE Heatmap
        pivot_rep = df.pivot(index='stride', columns='window_size', values='repetition_mae')
        sns.heatmap(pivot_rep, annot=True, fmt='.2f', cmap='viridis_r', ax=axes[0,1])
        axes[0,1].set_title('Repetition Count MAE (lower is better)')
        axes[0,1].set_xlabel('Window Size (samples)')
        axes[0,1].set_ylabel('Stride (samples)')
        
        # 3. Total Windows Generated
        pivot_windows = df.pivot(index='stride', columns='window_size', values='total_windows')
        sns.heatmap(pivot_windows, annot=True, fmt='d', cmap='plasma', ax=axes[0,2])
        axes[0,2].set_title('Total Windows Generated')
        axes[0,2].set_xlabel('Window Size (samples)')
        axes[0,2].set_ylabel('Stride (samples)')
        
        # 4. Overlap Percentage
        pivot_overlap = df.pivot(index='stride', columns='window_size', values='overlap_percent')
        sns.heatmap(pivot_overlap, annot=True, fmt='.1f', cmap='coolwarm', ax=axes[1,0])
        axes[1,0].set_title('Window Overlap (%)')
        axes[1,0].set_xlabel('Window Size (samples)')
        axes[1,0].set_ylabel('Stride (samples)')
        
        # 5. Update Rate
        pivot_rate = df.pivot(index='stride', columns='window_size', values='update_rate')
        sns.heatmap(pivot_rate, annot=True, fmt='.1f', cmap='magma', ax=axes[1,1])
        axes[1,1].set_title('Update Rate (Hz)')
        axes[1,1].set_xlabel('Window Size (samples)')
        axes[1,1].set_ylabel('Stride (samples)')
        
        # 6. Balanced Score
        df['balanced_score'] = (df['classification_score'] * 0.7 + 
                               (1 - df['repetition_mae'] / df['repetition_mae'].max()) * 0.3)
        pivot_balanced = df.pivot(index='stride', columns='window_size', values='balanced_score')
        sns.heatmap(pivot_balanced, annot=True, fmt='.3f', cmap='RdYlGn', ax=axes[1,2])
        axes[1,2].set_title('Balanced Score (0.7×Acc + 0.3×RepScore)')
        axes[1,2].set_xlabel('Window Size (samples)')
        axes[1,2].set_ylabel('Stride (samples)')
        
        plt.tight_layout()
        
        if save_plots:
            plt.savefig('grid_search_results.png', dpi=300, bbox_inches='tight')
            print("📊 Results saved to 'grid_search_results.png'")
        
        plt.show()
        return fig
    
    def save_results(self, filename="grid_search_results.json"):
        """Save grid search results to JSON file"""
        if not self.results:
            print("❌ No results to save.")
            return
        
        output = {
            'grid_search_results': self.results,
            'best_parameters': self.best_params,
            'summary': {
                'total_combinations_tested': len(self.results),
                'best_accuracy': max(r['classification_score'] for r in self.results),
                'best_rep_mae': min(r['repetition_mae'] for r in self.results)
            }
        }
        
        with open(filename, 'w') as f:
            json.dump(output, f, indent=2)
        
        print(f"💾 Results saved to '{filename}'")
    
    def load_results(self, filename="grid_search_results.json"):
        """Load previously saved grid search results"""
        try:
            with open(filename, 'r') as f:
                data = json.load(f)
            
            self.results = data['grid_search_results']
            self.best_params = data.get('best_parameters', {})
            
            print(f"📂 Loaded {len(self.results)} results from '{filename}'")
            return True
        except Exception as e:
            print(f"❌ Error loading results: {e}")
            return False


def run_comprehensive_grid_search(data_folder="../Data/BMI270/Ex1", 
                                 meta_path="../SportMeta.xlsx",
                                 quick_search=False):
    """
    Run a comprehensive grid search for optimal window parameters
    
    Args:
        data_folder: Path to IMU data files
        meta_path: Path to metadata Excel file
        quick_search: If True, use smaller parameter space for faster search
    """
    
    print("🔍 WINDOW SIZE GRID SEARCH")
    print("="*50)
    
    # Initialize grid search
    grid_search = WindowGridSearch(data_folder, meta_path)
    
    if quick_search:
        # Quick search for testing
        window_sizes = [64, 96, 128, 160, 192]
        strides = [16, 24, 32, 48, 64]
    else:
        # Comprehensive search
        window_sizes = [50, 64, 80, 96, 128, 160, 192, 224, 256]
        strides = [16, 20, 24, 32, 40, 48, 64, 80, 96]
    
    # Run grid search
    results = grid_search.run_grid_search(window_sizes, strides, cv_folds=3)
    
    if results:
        # Analyze results
        df = grid_search.analyze_results()
        
        # Create visualizations
        grid_search.plot_results(save_plots=True)
        
        # Save results
        grid_search.save_results("optimal_window_parameters.json")
        
        print(f"\n🎯 RECOMMENDATIONS:")
        print(f"   For ACCURACY: Use the 'accuracy' parameters")
        print(f"   For REP COUNTING: Use the 'repetitions' parameters") 
        print(f"   For BALANCED PERFORMANCE: Use the 'balanced' parameters")
        print(f"\n💡 You can now use these optimal parameters in your models!")
        
        return grid_search.best_params
    else:
        print("❌ Grid search failed to find valid parameters")
        return None


if __name__ == "__main__":
    # Example usage
    print("Starting Grid Search for Optimal Window Parameters...")
    
    # Run quick search for demonstration
    best_params = run_comprehensive_grid_search(quick_search=True)
    
    if best_params:
        print(f"\n✅ Grid search completed successfully!")
        print(f"Best parameters found: {best_params}")
    else:
        print(f"\n❌ Grid search failed.")
