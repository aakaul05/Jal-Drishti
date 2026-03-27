#!/usr/bin/env python3
"""
Maharashtra Map Generator
Creates a styled Maharashtra map for the Jal-Drishti application
"""

import matplotlib.pyplot as plt
import geopandas as gpd
import numpy as np
from matplotlib.patches import Polygon
import matplotlib.patches as mpatches

def generate_maharashtra_map():
    """Generate a styled Maharashtra map matching the UI design"""
    
    # 1. Load a public GeoJSON containing Indian states
    try:
        url = "https://raw.githubusercontent.com/Subhash9325/GeoJson-Data-of-Indian-States/master/Indian_States"
        india_gdf = gpd.read_file(url)
        
        # 2. Filter the map to only show the actual shape of Maharashtra
        maharashtra = india_gdf[india_gdf['NAME_1'] == 'Maharashtra']
        
        if maharashtra.empty:
            print("Maharashtra data not found, using fallback shape...")
            create_fallback_map()
            return
            
    except Exception as e:
        print(f"Error loading GeoJSON data: {e}")
        print("Using fallback map generation...")
        create_fallback_map()
        return

    # 3. Set up the dark theme background to match the UI
    fig, ax = plt.subplots(figsize=(4, 3), facecolor='#111520')
    ax.set_facecolor('#111520')

    # 4. Plot Maharashtra with the neon UI styling
    maharashtra.plot(
        ax=ax,
        color='#0c3a3c',      # Dark teal fill
        edgecolor='#00f0ff',  # Glowing cyan border
        linewidth=2.5
    )

    # 5. Add the custom cyan marker and text (centered roughly on Maharashtra)
    # Get the centroid of Maharashtra for better positioning
    centroid = maharashtra.geometry.centroid.iloc[0]
    center_lon, center_lat = centroid.x, centroid.y
    
    plt.plot(center_lon, center_lat, marker='o', color='#00f0ff', markersize=6)
    plt.text(center_lon, center_lat - 0.5, 'MAHARASHTRA', 
             color='#00f0ff', fontsize=10, fontweight='bold', 
             ha='center', va='top')

    # 6. Add the top-left "LOCATION" header
    plt.title('LOCATION', color='#5a6b8c', fontsize=14, 
              loc='left', pad=15, fontweight='bold')

    # 7. Remove the axis lines and coordinates for a clean UI look
    ax.axis('off')
    
    # 8. Set the plot limits to focus on Maharashtra
    bounds = maharashtra.total_bounds
    ax.set_xlim(bounds[0] - 1, bounds[2] + 1)
    ax.set_ylim(bounds[1] - 1, bounds[3] + 1)

    # 9. Save the final image
    plt.savefig('maharashtra_actual_ui_map.png', 
                bbox_inches='tight', 
                facecolor=fig.get_facecolor(), 
                dpi=300,
                pad_inches=0.1)
    
    print("✅ Maharashtra map successfully generated!")
    print("📁 Saved as: maharashtra_actual_ui_map.png")
    
    plt.close()

def create_fallback_map():
    """Create a fallback Maharashtra map using matplotlib shapes"""
    
    # Set up the dark theme background
    fig, ax = plt.subplots(figsize=(4, 3), facecolor='#111520')
    ax.set_facecolor('#111520')

    # Create a simplified Maharashtra shape using polygon coordinates
    # These coordinates roughly represent Maharashtra's shape
    maharashtra_coords = [
        [72.5, 21.0],   # Northwest corner
        [76.0, 20.5],   # Northeast corner  
        [77.5, 19.5],   # East
        [77.0, 18.0],   # Southeast
        [75.5, 17.5],   # South
        [74.0, 16.0],   # Southwest
        [72.0, 17.5],   # West
        [71.5, 19.0],   # Northwest
        [72.5, 21.0]    # Close the polygon
    ]

    # Create and plot the polygon
    maharashtra_poly = Polygon(maharashtra_coords, 
                               facecolor='#0c3a3c', 
                               edgecolor='#00f0ff', 
                               linewidth=2.5)
    ax.add_patch(maharashtra_poly)

    # Add location marker at approximate center
    center_lon, center_lat = 74.5, 19.0
    plt.plot(center_lon, center_lat, marker='o', color='#00f0ff', markersize=6)
    plt.text(center_lon, center_lat - 0.3, 'MAHARASHTRA', 
             color='#00f0ff', fontsize=10, fontweight='bold', 
             ha='center', va='top')

    # Add the LOCATION header
    plt.title('LOCATION', color='#5a6b8c', fontsize=14, 
              loc='left', pad=15, fontweight='bold')

    # Remove axes for clean look
    ax.axis('off')
    
    # Set appropriate limits
    ax.set_xlim(70, 79)
    ax.set_ylim(15, 22)

    # Save the map
    plt.savefig('maharashtra_fallback_map.png', 
                bbox_inches='tight', 
                facecolor=fig.get_facecolor(), 
                dpi=300,
                pad_inches=0.1)
    
    print("✅ Fallback Maharashtra map successfully generated!")
    print("📁 Saved as: maharashtra_fallback_map.png")
    
    plt.close()

if __name__ == "__main__":
    print("🗺️  Generating Maharashtra Map for Jal-Drishti App...")
    print("=" * 50)
    
    generate_maharashtra_map()
    
    print("\n🎉 Map generation complete!")
    print("💡 Use the generated map image in your React application")
