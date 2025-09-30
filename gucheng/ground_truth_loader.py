"""
Ground Truth Data Loader for Enhanced Ear Sensor System
=======================================================

This module loads manually annotated ground truth data with precise repetition counts
and optimal windowing parameters determined from actual exercise patterns.

Key Features:
- Loads manually annotated repetition boundaries
- Uses activity-specific optimal window sizes and strides
- Provides precise rep counts instead of estimates
- Supports both training and validation splits
- Maintains data quality and consistency checks
"""

import os
import json
import pickle
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from scipy.signal import butter, filtfilt

class GroundTruthDataLoader:
    def __init__(self, annotations_file="ground_truth_annotations.json", 
                 data_folder="../Data/BMI270/Ex1"):
        self.annotations_file = annotations_file
        self.data_folder = data_folder
        self.annotations = {}
        self.activity_mapping = {
            'Jumping Jack': 0,
            'Push Up': 1, 
            'Squat ': 2,
            'noise': 3
        }
        
        self.load_annotations()
        self.calculate_optimal_parameters()
    
    def load_annotations(self):
        """Load manually created annotations"""
        if not os.path.exists(self.annotations_file):
            raise FileNotFoundError(f"Annotations file not found: {self.annotations_file}")
        
        try:
            with open(self.annotations_file, 'r') as f:
                self.annotations = json.load(f)
            print(f"✅ Loaded {len(self.annotations)} manually annotated files")
        except Exception as e:
            raise Exception(f"Error loading annotations: {e}")
    
    def calculate_optimal_parameters(self):
        """Calculate optimal windowing parameters per activity"""
        self.activity_params = {}
        
        for annotation in self.annotations.values():
            activity = annotation['activity']
            if activity not in self.activity_params:
                self.activity_params[activity] = {
                    'rep_durations': [],
                    'window_sizes': [],
                    'strides': []
                }
            
            self.activity_params[activity]['rep_durations'].extend(annotation['rep_durations'])
            self.activity_params[activity]['window_sizes'].append(annotation['optimal_window_size'])
            self.activity_params[activity]['strides'].append(annotation['optimal_stride'])
        
        # Calculate final parameters per activity
        for activity, params in self.activity_params.items():
            avg_rep_duration = np.mean(params['rep_durations'])
            avg_window_size = int(np.mean(params['window_sizes']))
            avg_stride = int(np.mean(params['strides']))
            
            self.activity_params[activity]['final_window_size'] = avg_window_size
            self.activity_params[activity]['final_stride'] = avg_stride
            self.activity_params[activity]['avg_rep_duration'] = avg_rep_duration
            
            print(f"📊 {activity}: {avg_rep_duration:.2f}s reps → "
                  f"window={avg_window_size}, stride={avg_stride}")
    
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
        nyquist = 0.5 * fs
        normal_cutoff = cutoff / nyquist
        b, a = butter(order, normal_cutoff, btype='low', analog=False)
        
        filtered_data = np.zeros_like(data)
        for i in range(data.shape[1]):
            filtered_data[:, i] = filtfilt(b, a, data[:, i])
        
        return filtered_data
    
    def create_sliding_windows(self, data, window_size, stride):
        """Create sliding windows with specified parameters"""
        windows = []
        for i in range(0, len(data) - window_size + 1, stride):
            window = data[i:i + window_size]
            windows.append(window)
        return np.array(windows)
    
    def load_ground_truth_dataset(self, use_activity_specific_windows=True, 
                                  global_window_size=128, global_stride=32):
        """
        Load complete ground truth dataset with precise annotations
        
        Args:
            use_activity_specific_windows: Use optimal windows per activity
            global_window_size: Global window size if not using activity-specific
            global_stride: Global stride if not using activity-specific
        
        Returns:
            X_raw: Raw windowed data (n_windows, window_size, 12_channels)
            y_exercise: Exercise labels (encoded)
            y_reps: Precise repetition counts
            metadata: Additional information
        """
        all_windows = []
        all_exercise_labels = []
        all_rep_counts = []
        all_metadata = []
        
        print(f"\n🔄 Loading Ground Truth Dataset...")
        print(f"   Activity-specific windows: {use_activity_specific_windows}")
        
        for file_key, annotation in self.annotations.items():
            file_id = annotation['file_id']
            activity = annotation['activity']
            num_reps = annotation['num_reps']
            participant = annotation['participant']
            
            # Load raw data
            filepath = os.path.join(self.data_folder, f"DI_{file_id:05d}.CSV")
            if not os.path.exists(filepath):
                print(f"⚠️  Skipping {file_id}: File not found")
                continue
            
            raw_data = self.parse_bmi270_data(filepath)
            if raw_data is None or len(raw_data) < 64:
                print(f"⚠️  Skipping {file_id}: Invalid data")
                continue
            
            # Apply filtering
            filtered_data = self.apply_lowpass_filter(raw_data, cutoff=20, fs=100)
            
            # Determine windowing parameters
            if use_activity_specific_windows and activity in self.activity_params:
                window_size = self.activity_params[activity]['final_window_size']
                stride = self.activity_params[activity]['final_stride']
            else:
                window_size = global_window_size
                stride = global_stride
            
            # Create windows
            windows = self.create_sliding_windows(filtered_data, window_size, stride)
            
            # Add to dataset
            for window in windows:
                all_windows.append(window)
                all_exercise_labels.append(self.activity_mapping[activity])
                all_rep_counts.append(num_reps)
                all_metadata.append({
                    'file_id': file_id,
                    'activity': activity,
                    'participant': participant,
                    'window_size': window_size,
                    'stride': stride,
                    'total_reps': num_reps
                })
            
            print(f"✅ File {file_id:05d}: {activity} → {len(windows)} windows (reps: {num_reps})")
        
        # Convert to arrays
        X_raw = np.array(all_windows)
        y_exercise = np.array(all_exercise_labels)
        y_reps = np.array(all_rep_counts)
        
        print(f"\n📊 Ground Truth Dataset Loaded:")
        print(f"   • Total windows: {len(X_raw)}")
        print(f"   • Window shape: {X_raw[0].shape if len(X_raw) > 0 else 'N/A'}")
        print(f"   • Exercise classes: {len(set(y_exercise))}")
        print(f"   • Rep count range: {y_reps.min()}-{y_reps.max()}")
        
        # Activity breakdown
        unique_activities, counts = np.unique(y_exercise, return_counts=True)
        activity_names = [k for k, v in self.activity_mapping.items() if v in unique_activities]
        for name, count in zip(activity_names, counts):
            print(f"   • {name}: {count} windows")
        
        return X_raw, y_exercise, y_reps, all_metadata
    
    def create_train_test_split(self, test_size=0.2, random_state=42, stratify_by='participant'):
        """Create train/test split with proper stratification"""
        X_raw, y_exercise, y_reps, metadata = self.load_ground_truth_dataset()
        
        if stratify_by == 'participant':
            # Group by participant to ensure same participant isn't in both train/test
            participants = [m['participant'] for m in metadata]
            unique_participants = list(set(participants))
            
            # Split participants
            train_participants, test_participants = train_test_split(
                unique_participants, test_size=test_size, random_state=random_state
            )
            
            # Create masks
            train_mask = [m['participant'] in train_participants for m in metadata]
            test_mask = [m['participant'] in test_participants for m in metadata]
            
            X_train = X_raw[train_mask]
            X_test = X_raw[test_mask]
            y_exercise_train = y_exercise[train_mask]
            y_exercise_test = y_exercise[test_mask]
            y_reps_train = y_reps[train_mask]
            y_reps_test = y_reps[test_mask]
            
        else:
            # Standard stratified split by exercise type
            X_train, X_test, y_exercise_train, y_exercise_test, y_reps_train, y_reps_test = train_test_split(
                X_raw, y_exercise, y_reps, test_size=test_size, random_state=random_state, 
                stratify=y_exercise
            )
        
        print(f"\n📊 Train/Test Split ({stratify_by} stratification):")
        print(f"   • Training: {len(X_train)} windows")
        print(f"   • Testing: {len(X_test)} windows")
        
        if stratify_by == 'participant':
            print(f"   • Train participants: {train_participants}")
            print(f"   • Test participants: {test_participants}")
        
        return (X_train, X_test, y_exercise_train, y_exercise_test, 
                y_reps_train, y_reps_test)
    
    def get_data_statistics(self):
        """Get comprehensive statistics about the ground truth dataset"""
        stats = {
            'total_files': len(self.annotations),
            'total_reps': sum(ann['num_reps'] for ann in self.annotations.values()),
            'activities': {},
            'participants': {},
            'rep_duration_stats': {},
            'windowing_recommendations': self.activity_params
        }
        
        # Per-activity statistics
        for annotation in self.annotations.values():
            activity = annotation['activity']
            participant = annotation['participant']
            
            if activity not in stats['activities']:
                stats['activities'][activity] = {
                    'files': 0, 'total_reps': 0, 'rep_durations': []
                }
            if participant not in stats['participants']:
                stats['participants'][participant] = {
                    'files': 0, 'activities': set()
                }
            
            stats['activities'][activity]['files'] += 1
            stats['activities'][activity]['total_reps'] += annotation['num_reps']
            stats['activities'][activity]['rep_durations'].extend(annotation['rep_durations'])
            
            stats['participants'][participant]['files'] += 1
            stats['participants'][participant]['activities'].add(activity)
        
        # Calculate summary statistics
        for activity, data in stats['activities'].items():
            durations = data['rep_durations']
            if durations:
                stats['rep_duration_stats'][activity] = {
                    'mean': np.mean(durations),
                    'std': np.std(durations),
                    'min': np.min(durations),
                    'max': np.max(durations),
                    'count': len(durations)
                }
        
        # Convert sets to lists for JSON serialization
        for participant_data in stats['participants'].values():
            participant_data['activities'] = list(participant_data['activities'])
        
        return stats
    
    def print_dataset_summary(self):
        """Print comprehensive dataset summary"""
        stats = self.get_data_statistics()
        
        print("\n" + "="*70)
        print("📊 GROUND TRUTH DATASET SUMMARY")
        print("="*70)
        
        print(f"📁 Total Files: {stats['total_files']}")
        print(f"🏃 Total Repetitions: {stats['total_reps']}")
        
        print(f"\n🎯 Activity Breakdown:")
        for activity, data in stats['activities'].items():
            print(f"   {activity}:")
            print(f"      Files: {data['files']}")
            print(f"      Reps: {data['total_reps']}")
            if activity in stats['rep_duration_stats']:
                duration_stats = stats['rep_duration_stats'][activity]
                print(f"      Avg Duration: {duration_stats['mean']:.2f}s ± {duration_stats['std']:.2f}s")
                print(f"      Range: {duration_stats['min']:.2f}s - {duration_stats['max']:.2f}s")
        
        print(f"\n👥 Participant Breakdown:")
        for participant, data in stats['participants'].items():
            activities_str = ', '.join(data['activities'])
            print(f"   {participant}: {data['files']} files ({activities_str})")
        
        print(f"\n🎛️  Optimal Windowing Parameters:")
        for activity, params in self.activity_params.items():
            if 'final_window_size' in params:
                window_size = params['final_window_size']
                stride = params['final_stride']
                overlap_pct = ((window_size - stride) / window_size * 100)
                update_rate = 100 / stride
                print(f"   {activity}:")
                print(f"      Window: {window_size} samples ({window_size/100:.2f}s)")
                print(f"      Stride: {stride} samples ({stride/100:.2f}s)")
                print(f"      Overlap: {overlap_pct:.1f}%")
                print(f"      Update Rate: {update_rate:.1f} Hz")


def load_ground_truth_data(annotations_file="ground_truth_annotations.json",
                          data_folder="../Data/BMI270/Ex1",
                          use_activity_specific_windows=True,
                          use_grid_search_params=False,
                          grid_search_config="balanced",
                          test_size=0.2,
                          random_state=42):
    """
    Convenience function to load ground truth data for training
    
    Args:
        annotations_file: Path to manual annotations JSON file
        data_folder: Path to IMU data folder
        use_activity_specific_windows: Use activity-specific optimal windows
        use_grid_search_params: Use grid search optimal parameters
        grid_search_config: Which grid search config to use ('accuracy', 'repetitions', 'balanced')
        test_size: Fraction for test split
        random_state: Random seed
    
    Returns:
        Tuple of (X_train, X_test, y_exercise_train, y_exercise_test, 
                 y_reps_train, y_reps_test, loader)
    """
    loader = GroundTruthDataLoader(annotations_file, data_folder)
    
    # Check if we should use grid search parameters
    if use_grid_search_params:
        grid_search_file = "optimal_model_configs.json"
        if os.path.exists(grid_search_file):
            try:
                import json
                with open(grid_search_file, 'r') as f:
                    configs = json.load(f)
                
                config_key = f"{grid_search_config}_config"
                if config_key in configs:
                    optimal_config = configs[config_key]
                    optimal_window = optimal_config['window_size']
                    optimal_stride = optimal_config['stride']
                    
                    print(f"🎯 Using Grid Search Optimal Parameters:")
                    print(f"   Config: {grid_search_config.upper()}")
                    print(f"   Window: {optimal_config['window_duration_sec']:.2f}s ({optimal_window} samples)")
                    print(f"   Stride: {optimal_config['stride_duration_sec']:.2f}s ({optimal_stride} samples)")
                    print(f"   Overlap: {optimal_config['overlap_percent']:.1f}%")
                    print(f"   Update Rate: {optimal_config['update_rate_hz']:.1f} Hz")
                    print(f"   Description: {optimal_config['description']}")
                    print()
                    
                    # Override loader's parameters with grid search results
                    loader.grid_search_params = {
                        'window_size': optimal_window,
                        'stride': optimal_stride
                    }
                    use_activity_specific_windows = False  # Use grid search params instead
                else:
                    print(f"⚠️  Grid search config '{config_key}' not found. Using default parameters.")
                    use_grid_search_params = False
            except Exception as e:
                print(f"⚠️  Error loading grid search parameters: {e}")
                print("   Falling back to default parameters.")
                use_grid_search_params = False
        else:
            print(f"⚠️  Grid search results file '{grid_search_file}' not found.")
            print("   Run window_grid_search_notebook.ipynb first to generate optimal parameters.")
            use_grid_search_params = False
    
    # Modify the loader to use grid search params if available
    if use_grid_search_params and hasattr(loader, 'grid_search_params'):
        original_load = loader.load_ground_truth_dataset
        
        def load_with_grid_search_params(*args, **kwargs):
            kwargs['use_activity_specific_windows'] = False
            kwargs['global_window_size'] = loader.grid_search_params['window_size']
            kwargs['global_stride'] = loader.grid_search_params['stride']
            return original_load(*args, **kwargs)
        
        loader.load_ground_truth_dataset = load_with_grid_search_params
    
    loader.print_dataset_summary()
    
    return (*loader.create_train_test_split(test_size, random_state), loader)


def load_optimal_parameters(config_type="balanced"):
    """
    Load optimal parameters from grid search results
    
    Args:
        config_type: Type of configuration ('accuracy', 'repetitions', 'balanced')
    
    Returns:
        Dict with optimal parameters or None if not found
    """
    config_file = "optimal_model_configs.json"
    if not os.path.exists(config_file):
        print(f"❌ Grid search results not found: {config_file}")
        print("   Run window_grid_search_notebook.ipynb first to generate optimal parameters.")
        return None
    
    try:
        import json
        with open(config_file, 'r') as f:
            configs = json.load(f)
        
        config_key = f"{config_type}_config"
        if config_key in configs:
            return configs[config_key]
        else:
            print(f"❌ Configuration '{config_type}' not found in {config_file}")
            print(f"   Available configurations: {list(configs.keys())}")
            return None
    except Exception as e:
        print(f"❌ Error loading optimal parameters: {e}")
        return None


if __name__ == "__main__":
    # Example usage
    print("Ground Truth Data Loader")
    print("="*40)
    
    try:
        # Load data
        (X_train, X_test, y_exercise_train, y_exercise_test, 
         y_reps_train, y_reps_test, loader) = load_ground_truth_data()
        
        print(f"\n✅ Successfully loaded ground truth data!")
        print(f"   Training shape: {X_train.shape}")
        print(f"   Testing shape: {X_test.shape}")
        
    except FileNotFoundError:
        print("\n❌ No ground truth annotations found.")
        print("   Please run the manual annotation tool first to create annotations.")
    except Exception as e:
        print(f"\n❌ Error loading data: {e}")
