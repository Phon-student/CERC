#!/usr/bin/env python3
"""
Quick Grid Search Example
========================

This script demonstrates how to run a quick grid search to find optimal
window parameters for your IMU data.

Usage:
    python quick_grid_search_example.py
"""

import os
from window_grid_search import run_comprehensive_grid_search

def main():
    print("🚀 Quick Grid Search for Optimal Window Parameters")
    print("="*60)
    print()
    
    # Check if data exists
    data_folder = "Data/BMI270/Ex1"
    meta_path = "SportMeta.xlsx"
    
    if not os.path.exists(data_folder):
        print(f"❌ Data folder not found: {data_folder}")
        print("   Please ensure your IMU data is in the correct location")
        return
    
    if not os.path.exists(meta_path):
        print(f"❌ Metadata file not found: {meta_path}")
        print("   Please ensure SportMeta.xlsx is in the current directory")
        return
    
    print(f"✅ Data folder found: {data_folder}")
    print(f"✅ Metadata file found: {meta_path}")
    print()
    
    # Run quick grid search
    print("🔍 Running Quick Grid Search (this may take 2-3 minutes)...")
    print("   Testing window sizes: 64, 96, 128, 160, 192 samples")
    print("   Testing strides: 16, 24, 32, 48, 64 samples")
    print()
    
    try:
        best_params = run_comprehensive_grid_search(
            data_folder=data_folder,
            meta_path=meta_path,
            quick_search=True
        )
        
        if best_params:
            print("\n" + "="*60)
            print("🎯 OPTIMAL PARAMETERS FOUND!")
            print("="*60)
            
            for criteria, params in best_params.items():
                window_sec = params['window_size'] / 100
                stride_sec = params['stride'] / 100
                overlap = ((params['window_size'] - params['stride']) / params['window_size']) * 100
                update_rate = 100 / params['stride']
                
                print(f"\n📊 {criteria.upper()} OPTIMIZATION:")
                print(f"   Window Size: {params['window_size']} samples ({window_sec:.2f}s)")
                print(f"   Stride: {params['stride']} samples ({stride_sec:.2f}s)")
                print(f"   Overlap: {overlap:.1f}%")
                print(f"   Update Rate: {update_rate:.1f} Hz")
            
            print(f"\n💾 Results saved to:")
            print(f"   📊 grid_search_results.png - Visualization")
            print(f"   📈 grid_search_insights.png - Additional analysis")
            print(f"   💾 optimal_window_parameters.json - Raw results")
            print(f"   🎯 optimal_model_configs.json - Ready-to-use configs")
            
            print(f"\n💡 RECOMMENDATIONS:")
            print(f"   1. For BEST ACCURACY: Use 'accuracy' parameters")
            print(f"   2. For BEST REP COUNTING: Use 'repetitions' parameters")
            print(f"   3. For BALANCED PERFORMANCE: Use 'balanced' parameters (recommended)")
            
            print(f"\n🔗 NEXT STEPS:")
            print(f"   1. Open window_grid_search_notebook.ipynb for detailed analysis")
            print(f"   2. Use optimal parameters in your Enhanced Ear Sensor System")
            print(f"   3. Compare performance against current 128/32 parameters")
            
            # Show comparison with current parameters
            balanced = best_params['balanced']
            current_window, current_stride = 128, 32
            current_overlap = ((current_window - current_stride) / current_window) * 100
            optimal_overlap = ((balanced['window_size'] - balanced['stride']) / balanced['window_size']) * 100
            
            print(f"\n📈 COMPARISON WITH CURRENT PARAMETERS:")
            print(f"   Current (128/32):  {current_window/100:.2f}s window, {current_stride/100:.2f}s stride, {current_overlap:.1f}% overlap")
            print(f"   Optimal (balanced): {balanced['window_size']/100:.2f}s window, {balanced['stride']/100:.2f}s stride, {optimal_overlap:.1f}% overlap")
            
            if balanced['window_size'] != current_window or balanced['stride'] != current_stride:
                print(f"   🎯 Grid search found DIFFERENT optimal parameters!")
                print(f"   📈 Expected performance improvement with optimal parameters")
            else:
                print(f"   ✅ Your current parameters are already optimal!")
        
        else:
            print("\n❌ Grid search failed to find optimal parameters")
            print("   This might be due to insufficient data or data quality issues")
    
    except Exception as e:
        print(f"\n❌ Error during grid search: {e}")
        print("   Please check your data files and try again")

if __name__ == "__main__":
    main()
