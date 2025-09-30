#!/usr/bin/env python3
"""
Manual Annotation Tool for IMU Exercise Data
============================================

This tool provides an interactive interface for manually annotating exercise repetitions
in IMU data to create accurate ground truth labels for training.

Features:
- Interactive visualization of IMU signals
- Manual rep boundary marking
- Automatic rep counting validation
- Export annotated data for training
- Quality metrics and validation
"""

import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.widgets import Button, Slider, SpanSelector
import json
from datetime import datetime
from scipy.signal import butter, filtfilt, find_peaks
import pickle

class IMUAnnotationTool:
    def __init__(self, data_folder="../Data/BMI270/Ex1", meta_path="../SportMeta.xlsx"):
        self.data_folder = data_folder
        self.meta_path = meta_path
        self.current_file_idx = 0
        self.annotations = {}
        self.rep_boundaries = []
        self.current_data = None
        self.current_metadata = None
        self.fig = None
        self.axes = None
        
        # Load metadata
        self.load_metadata()
        
        # Initialize annotation storage
        self.annotation_file = "manual_annotations.json"
        self.load_existing_annotations()
        
    def load_metadata(self):
        """Load exercise metadata"""
        try:
            self.meta_df = pd.read_excel(self.meta_path)
            print(f"Loaded metadata: {len(self.meta_df)} files")
            print(f"Activities: {self.meta_df['activity'].value_counts()}")
        except Exception as e:
            print(f"Error loading metadata: {e}")
            self.meta_df = pd.DataFrame()
    
    def load_existing_annotations(self):
        """Load existing annotations if available"""
        if os.path.exists(self.annotation_file):
            try:
                with open(self.annotation_file, 'r') as f:
                    self.annotations = json.load(f)
                print(f"Loaded {len(self.annotations)} existing annotations")
            except Exception as e:
                print(f"Error loading annotations: {e}")
                self.annotations = {}
    
    def save_annotations(self):
        """Save annotations to JSON file"""
        try:
            with open(self.annotation_file, 'w') as f:
                json.dump(self.annotations, f, indent=2)
            print(f"Saved annotations for {len(self.annotations)} files")
        except Exception as e:
            print(f"Error saving annotations: {e}")
    
    def parse_bmi270_data(self, filepath):
        """Parse BMI270 IMU data from CSV file"""
        def convert_uint_to_int(n):
            return n - 0x2000 if n >= 0x2000 else n
        
        def get_bmi270_from_str(srt):
            if len(srt) != 36:
                return None
            try:
                # Parse 12 channels of IMU data
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
            
            if len(data) == 0:
                return None
                
            return np.array(data)
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
    
    def load_file(self, file_idx):
        """Load and display specific file for annotation"""
        if file_idx >= len(self.meta_df):
            print("No more files to annotate")
            return False
        
        row = self.meta_df.iloc[file_idx]
        file_id = row['file_id']
        activity = row['activity']
        participant = row['pid']
        
        filepath = os.path.join(self.data_folder, f"DI_{file_id:05d}.CSV")
        
        if not os.path.exists(filepath):
            print(f"File not found: {filepath}")
            return False
        
        # Load and process data
        raw_data = self.parse_bmi270_data(filepath)
        if raw_data is None:
            print(f"Failed to parse: {filepath}")
            return False
        
        # Apply filtering
        filtered_data = self.apply_lowpass_filter(raw_data, cutoff=20, fs=100)
        
        self.current_data = filtered_data
        self.current_metadata = {
            'file_id': file_id,
            'activity': activity,
            'participant': participant,
            'filepath': filepath,
            'duration_seconds': len(filtered_data) / 100.0
        }
        
        # Load existing annotations if available
        file_key = str(file_id)
        if file_key in self.annotations:
            self.rep_boundaries = self.annotations[file_key]['rep_boundaries']
        else:
            self.rep_boundaries = []
        
        print(f"\nLoaded File {file_id}: {activity} by {participant}")
        print(f"Duration: {self.current_metadata['duration_seconds']:.1f}s, Samples: {len(filtered_data)}")
        
        return True
    
    def create_visualization(self):
        """Create interactive visualization for annotation"""
        if self.current_data is None:
            return
        
        # Close existing figure
        if self.fig is not None:
            plt.close(self.fig)
        
        # Create figure
        self.fig, self.axes = plt.subplots(4, 3, figsize=(20, 12))
        self.fig.suptitle(f"File {self.current_metadata['file_id']}: {self.current_metadata['activity']} "
                         f"by {self.current_metadata['participant']}", fontsize=16)
        
        # Time axis
        time_axis = np.arange(len(self.current_data)) / 100.0  # Convert to seconds
        
        # Channel names
        channel_names = [
            'AccXL', 'AccYL', 'AccZL', 'GyroXL', 'GyroYL', 'GyroZL',
            'AccXR', 'AccYR', 'AccZR', 'GyroXR', 'GyroYR', 'GyroZR'
        ]
        
        # Plot each channel
        for i in range(12):
            row = i // 3
            col = i % 3
            ax = self.axes[row, col]
            
            # Plot signal
            ax.plot(time_axis, self.current_data[:, i], 'b-', linewidth=1, alpha=0.7)
            ax.set_title(f'{channel_names[i]}', fontsize=12, fontweight='bold')
            ax.set_xlabel('Time (s)')
            ax.set_ylabel('Amplitude')
            ax.grid(True, alpha=0.3)
            
            # Plot existing rep boundaries
            for boundary in self.rep_boundaries:
                ax.axvline(x=boundary/100.0, color='red', linestyle='--', linewidth=2, alpha=0.7)
        
        # Add control buttons
        self.add_control_buttons()
        
        # Enable interactive span selection on primary acceleration channel (AccYL - channel 1)
        self.setup_span_selector()
        
        plt.tight_layout()
        plt.show()
    
    def add_control_buttons(self):
        """Add control buttons for annotation"""
        # Button positions
        button_height = 0.04
        button_width = 0.1
        
        # Next file button
        ax_next = plt.axes([0.85, 0.02, button_width, button_height])
        self.btn_next = Button(ax_next, 'Next File')
        self.btn_next.on_clicked(self.next_file)
        
        # Previous file button
        ax_prev = plt.axes([0.73, 0.02, button_width, button_height])
        self.btn_prev = Button(ax_prev, 'Prev File')
        self.btn_prev.on_clicked(self.prev_file)
        
        # Save annotations button
        ax_save = plt.axes([0.61, 0.02, button_width, button_height])
        self.btn_save = Button(ax_save, 'Save')
        self.btn_save.on_clicked(self.save_current_annotation)
        
        # Clear boundaries button
        ax_clear = plt.axes([0.49, 0.02, button_width, button_height])
        self.btn_clear = Button(ax_clear, 'Clear')
        self.btn_clear.on_clicked(self.clear_boundaries)
        
        # Auto-detect button
        ax_auto = plt.axes([0.37, 0.02, button_width, button_height])
        self.btn_auto = Button(ax_auto, 'Auto-detect')
        self.btn_auto.on_clicked(self.auto_detect_reps)
        
        # Export button
        ax_export = plt.axes([0.25, 0.02, button_width, button_height])
        self.btn_export = Button(ax_export, 'Export')
        self.btn_export.on_clicked(self.export_annotations)
    
    def setup_span_selector(self):
        """Setup span selector for marking repetitions"""
        # Use AccYL (channel 1) as primary for rep detection
        self.span_selector = SpanSelector(
            self.axes[0, 1],  # AccYL subplot
            self.on_span_select,
            'horizontal',
            useblit=True,
            props=dict(alpha=0.3, facecolor='green'),
            interactive=True
        )
    
    def on_span_select(self, xmin, xmax):
        """Handle span selection for marking rep boundaries"""
        # Convert time back to sample indices
        start_sample = int(xmin * 100)
        end_sample = int(xmax * 100)
        
        # Add both boundaries
        self.rep_boundaries.extend([start_sample, end_sample])
        self.rep_boundaries = sorted(list(set(self.rep_boundaries)))  # Remove duplicates and sort
        
        # Update visualization
        self.update_visualization()
        
        print(f"Added rep boundary: {start_sample}-{end_sample} samples ({xmin:.2f}-{xmax:.2f}s)")
    
    def update_visualization(self):
        """Update visualization with current rep boundaries"""
        # Clear existing boundary lines
        for ax in self.axes.flat:
            for line in ax.lines[1:]:  # Keep original signal, remove boundary lines
                line.remove()
        
        # Redraw boundaries
        for boundary in self.rep_boundaries:
            for ax in self.axes.flat:
                ax.axvline(x=boundary/100.0, color='red', linestyle='--', linewidth=2, alpha=0.7)
        
        # Update rep count display
        num_reps = max(0, len(self.rep_boundaries) - 1) if len(self.rep_boundaries) > 1 else 0
        self.fig.suptitle(f"File {self.current_metadata['file_id']}: {self.current_metadata['activity']} "
                         f"by {self.current_metadata['participant']} | Reps: {num_reps}", fontsize=16)
        
        plt.draw()
    
    def auto_detect_reps(self, event):
        """Auto-detect repetitions using peak detection"""
        if self.current_data is None:
            return
        
        # Use AccYL (channel 1) for peak detection
        signal = self.current_data[:, 1]
        
        # Find peaks with prominence-based detection
        prominence_threshold = np.std(signal) * 2
        peaks, properties = find_peaks(signal, prominence=prominence_threshold, distance=50)
        
        # Convert peaks to boundaries (start and end of each rep)
        self.rep_boundaries = []
        for i, peak in enumerate(peaks):
            # Add start boundary (halfway to previous peak or beginning)
            if i == 0:
                start = 0
            else:
                start = (peaks[i-1] + peak) // 2
            
            # Add end boundary (halfway to next peak or end)
            if i == len(peaks) - 1:
                end = len(signal) - 1
            else:
                end = (peak + peaks[i+1]) // 2
            
            self.rep_boundaries.extend([start, end])
        
        self.rep_boundaries = sorted(list(set(self.rep_boundaries)))
        self.update_visualization()
        
        print(f"Auto-detected {len(peaks)} repetitions")
    
    def clear_boundaries(self, event):
        """Clear all rep boundaries"""
        self.rep_boundaries = []
        self.update_visualization()
        print("Cleared all boundaries")
    
    def save_current_annotation(self, event):
        """Save current file annotation"""
        if self.current_metadata is None:
            return
        
        file_key = str(self.current_metadata['file_id'])
        
        # Calculate rep count and durations
        num_reps = max(0, len(self.rep_boundaries) - 1) if len(self.rep_boundaries) > 1 else 0
        rep_durations = []
        
        if len(self.rep_boundaries) >= 2:
            for i in range(0, len(self.rep_boundaries)-1, 2):
                if i+1 < len(self.rep_boundaries):
                    duration = (self.rep_boundaries[i+1] - self.rep_boundaries[i]) / 100.0
                    rep_durations.append(duration)
        
        self.annotations[file_key] = {
            'file_id': self.current_metadata['file_id'],
            'activity': self.current_metadata['activity'],
            'participant': self.current_metadata['participant'],
            'rep_boundaries': self.rep_boundaries,
            'num_reps': num_reps,
            'rep_durations': rep_durations,
            'avg_rep_duration': np.mean(rep_durations) if rep_durations else 0,
            'annotation_timestamp': datetime.now().isoformat(),
            'total_duration': self.current_metadata['duration_seconds']
        }
        
        self.save_annotations()
        print(f"Saved annotation: {num_reps} reps, avg duration: {np.mean(rep_durations) if rep_durations else 0:.2f}s")
    
    def next_file(self, event):
        """Move to next file"""
        self.save_current_annotation(event)
        self.current_file_idx += 1
        if self.load_file(self.current_file_idx):
            self.create_visualization()
        else:
            print("Reached end of files")
    
    def prev_file(self, event):
        """Move to previous file"""
        self.save_current_annotation(event)
        self.current_file_idx = max(0, self.current_file_idx - 1)
        if self.load_file(self.current_file_idx):
            self.create_visualization()
    
    def export_annotations(self, event):
        """Export annotations for training"""
        if not self.annotations:
            print("No annotations to export")
            return
        
        # Create training dataset with precise rep counts
        training_data = []
        
        for file_key, annotation in self.annotations.items():
            file_id = annotation['file_id']
            activity = annotation['activity']
            num_reps = annotation['num_reps']
            boundaries = annotation['rep_boundaries']
            
            # Load file data
            filepath = os.path.join(self.data_folder, f"DI_{file_id:05d}.CSV")
            raw_data = self.parse_bmi270_data(filepath)
            if raw_data is None:
                continue
            
            filtered_data = self.apply_lowpass_filter(raw_data, cutoff=20, fs=100)
            
            # Create windows based on optimal parameters determined from annotation
            optimal_window_size, optimal_stride = self.determine_optimal_windowing(annotation)
            
            # Generate training samples
            windows = self.create_sliding_windows(filtered_data, optimal_window_size, optimal_stride)
            
            for window in windows:
                training_data.append({
                    'window': window,
                    'exercise_label': activity,
                    'rep_count': num_reps,
                    'file_id': file_id,
                    'window_size': optimal_window_size,
                    'stride': optimal_stride
                })
        
        # Save training dataset
        with open('annotated_training_data.pkl', 'wb') as f:
            pickle.dump(training_data, f)
        
        # Create summary report
        self.create_annotation_report()
        
        print(f"Exported {len(training_data)} training samples from {len(self.annotations)} annotated files")
    
    def determine_optimal_windowing(self, annotation):
        """Determine optimal window size and stride based on rep durations"""
        rep_durations = annotation['rep_durations']
        
        if not rep_durations:
            return 128, 32  # Default values
        
        avg_rep_duration = np.mean(rep_durations)
        
        # Window size should capture 1-2 reps
        optimal_window_size = min(max(64, int(avg_rep_duration * 100 * 1.5)), 256)
        
        # Stride should be 1/4 of window size for good overlap
        optimal_stride = optimal_window_size // 4
        
        return optimal_window_size, optimal_stride
    
    def create_sliding_windows(self, data, window_size, stride):
        """Create sliding windows with specified parameters"""
        windows = []
        for i in range(0, len(data) - window_size + 1, stride):
            window = data[i:i + window_size]
            windows.append(window)
        return np.array(windows)
    
    def create_annotation_report(self):
        """Create comprehensive annotation report"""
        if not self.annotations:
            return
        
        report = {
            'summary': {
                'total_files': len(self.annotations),
                'total_reps': sum(ann['num_reps'] for ann in self.annotations.values()),
                'activities': {}
            },
            'per_activity_stats': {},
            'per_participant_stats': {},
            'windowing_recommendations': {}
        }
        
        # Activity statistics
        for annotation in self.annotations.values():
            activity = annotation['activity']
            if activity not in report['per_activity_stats']:
                report['per_activity_stats'][activity] = {
                    'files': 0,
                    'total_reps': 0,
                    'rep_durations': [],
                    'avg_rep_duration': 0,
                    'recommended_window_size': 0,
                    'recommended_stride': 0
                }
            
            stats = report['per_activity_stats'][activity]
            stats['files'] += 1
            stats['total_reps'] += annotation['num_reps']
            stats['rep_durations'].extend(annotation['rep_durations'])
        
        # Calculate averages and recommendations
        for activity, stats in report['per_activity_stats'].items():
            if stats['rep_durations']:
                stats['avg_rep_duration'] = np.mean(stats['rep_durations'])
                stats['std_rep_duration'] = np.std(stats['rep_durations'])
                
                # Windowing recommendations
                avg_duration = stats['avg_rep_duration']
                recommended_window = min(max(64, int(avg_duration * 100 * 1.5)), 256)
                recommended_stride = recommended_window // 4
                
                stats['recommended_window_size'] = recommended_window
                stats['recommended_stride'] = recommended_stride
                
                report['windowing_recommendations'][activity] = {
                    'window_size': recommended_window,
                    'stride': recommended_stride,
                    'coverage_seconds': recommended_window / 100.0,
                    'update_rate_hz': 100 / recommended_stride
                }
        
        # Save report
        with open('annotation_report.json', 'w') as f:
            json.dump(report, f, indent=2)
        
        # Print summary
        print("\n" + "="*60)
        print("ANNOTATION REPORT SUMMARY")
        print("="*60)
        print(f"Total Files: {report['summary']['total_files']}")
        print(f"Total Reps: {sum(ann['num_reps'] for ann in self.annotations.values())}")
        
        print("\nPer-Activity Statistics:")
        for activity, stats in report['per_activity_stats'].items():
            print(f"  {activity}:")
            print(f"    Files: {stats['files']}")
            print(f"    Reps: {stats['total_reps']}")
            print(f"    Avg Rep Duration: {stats['avg_rep_duration']:.2f}s")
            print(f"    Recommended Window: {stats['recommended_window_size']} samples ({stats['recommended_window_size']/100:.2f}s)")
            print(f"    Recommended Stride: {stats['recommended_stride']} samples ({stats['recommended_stride']/100:.2f}s)")
    
    def start_annotation(self, start_idx=0):
        """Start the annotation process"""
        self.current_file_idx = start_idx
        if self.load_file(self.current_file_idx):
            self.create_visualization()
            print("\nAnnotation Instructions:")
            print("1. Click and drag on AccYL plot to mark rep boundaries")
            print("2. Use 'Auto-detect' for initial detection")
            print("3. 'Clear' to remove all boundaries")
            print("4. 'Save' to save current annotation")
            print("5. 'Next File'/'Prev File' to navigate")
            print("6. 'Export' when done to create training dataset")
        else:
            print("Failed to load first file")

def main():
    """Main function to run the annotation tool"""
    print("IMU Exercise Annotation Tool")
    print("="*40)
    
    # Initialize tool
    tool = IMUAnnotationTool()
    
    # Start annotation process
    tool.start_annotation()
    
    return tool

if __name__ == "__main__":
    annotation_tool = main()
