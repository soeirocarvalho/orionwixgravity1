"""
ORION Legacy Adapter - Byte-identical figure replication
Imports exact legacy figure building functions for radar charts and 3D visualizations.

GOLDEN RULE: Do not change ANY visual parameters. Preserve exact colors, camera settings, grids, fonts, etc.
The goal is byte-for-byte identical figures from the legacy platform.
"""

import sys
import os
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import logging
import math
import random
from typing import Dict, Optional, Any

# Add legacy path to sys.path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
legacy_path = os.path.join(current_dir, '../../legacy/old_orion')
if legacy_path not in sys.path:
    sys.path.insert(0, legacy_path)

logger = logging.getLogger(__name__)

# Import exact legacy color palette and helper functions
VIBRANT_COLORS = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FECA57", 
    "#FF9FF3", "#54A0FF", "#5F27CD", "#00D2D3", "#FF9F43",
    "#EE5A24", "#009432", "#0652DD", "#9980FA", "#FDA7DF",
    "#D63031", "#74B9FF", "#A29BFE", "#6C5CE7", "#FD79A8",
    "#00B894", "#E17055", "#81ECEC", "#FDCB6E", "#E84393",
    "#00CEC9", "#55A3FF", "#FF7675", "#C44569", "#F8B500",
    "#3742FA", "#2F3542", "#FF3838", "#7BED9F", "#70A1FF",
    "#5352ED", "#FF4757", "#2ED573", "#1E90FF", "#FF6348",
    "#4834D4", "#686DE0", "#30336B", "#95E1D3", "#F8B195",
    "#F67280", "#C06C84", "#6C5B7B", "#355C7D", "#2C3E50"
]

def hex_to_rgba_custom(hex_color, alpha=1.0):
    """Convert hex color to rgba string - exact from legacy version"""
    try:
        hex_color = hex_color.lstrip('#')
        if len(hex_color) == 6:
            r = int(hex_color[0:2], 16)
            g = int(hex_color[2:4], 16)
            b = int(hex_color[4:6], 16)
            return f"rgba({r},{g},{b},{alpha})"
        else:
            return f"rgba(150,150,150,{alpha})"
    except Exception:
        return f"rgba(150,150,150,{alpha})"

def generate_distinct_color(index):
    """Generate distinct colors for clusters beyond predefined palette"""
    hue = (index * 137.5) % 360  # Golden angle for better distribution
    return f"hsl({hue}, 70%, 50%)"

# Apple theme constants - exact from legacy
APPLE_THEME = {
    'text': '#ffffff',
    'text_secondary': '#8e8e93',
    'font': "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"
}

def build_trend_radar(df: pd.DataFrame, show_connections: Optional[Dict] = None, show_node_titles: Optional[Dict] = None) -> go.Figure:
    """
    Create the trend radar figure from filtered data - EXACT legacy implementation
    
    Args:
        df: DataFrame with legacy structure columns
        show_connections: Dict with 'show' key to enable connections
        show_node_titles: Dict with 'titles' key to enable node titles
        
    Returns:
        Plotly Figure with exact legacy styling
    """
    filtered_data = df.copy()
    
    # Filter for curated driving forces - exact from legacy
    curated_types = ['Megatrends', 'Trends', 'Weak Signals', 'Wildcards']
    curated_df = filtered_data[filtered_data['Driving Force'].isin(curated_types)].copy()
    
    if len(curated_df) == 0:
        # Empty radar - exact from legacy
        fig = go.Figure()
        fig.update_layout(
            plot_bgcolor='#000000',
            paper_bgcolor='#000000',
            font=dict(color=APPLE_THEME['text']),
            showlegend=False,
            margin=dict(l=20, r=20, t=20, b=150),
            height=800
        )
        fig.add_annotation(
            text="No curated driving forces found matching your search",
            xref="paper", yref="paper",
            x=0.5, y=0.5, showarrow=False,
            font=dict(size=20, color=APPLE_THEME['text_secondary'])
        )
        return fig
    
    # Get unique clusters - exact from legacy
    if 'cluster_id' not in curated_df.columns:
        # Use Cluster column if cluster_id doesn't exist
        if 'Cluster' in curated_df.columns:
            curated_df['cluster_id'] = curated_df['Cluster']
        else:
            # Assign all to cluster 0 if no cluster info
            curated_df['cluster_id'] = 0
    
    clusters = sorted(curated_df['cluster_id'].unique())
    n_clusters = len(clusters)
    
    # Cluster names mapping - exact from legacy
    cluster_names = {
        0: "AI & Automation", 1: "Healthcare Tech", 2: "Sustainability",
        3: "Financial Tech", 4: "Social Dynamics", 5: "Smart Cities",
        6: "Energy Systems", 7: "Digital Transformation", 8: "Education Innovation",
        9: "Manufacturing 4.0", 10: "Space & Defense", 11: "Food & Agriculture",
        12: "Materials Science", 13: "Quantum Computing", 14: "Biotechnology",
        15: "Cybersecurity", 16: "Transportation", 17: "Climate Action",
        18: "Governance", 19: "Future of Work", 20: "Consumer Tech",
        21: "Media Evolution", 22: "Supply Chain", 23: "Data Economy",
        24: "Health & Wellness", 25: "Urban Development", 26: "Resource Management",
        27: "Scientific Research", 28: "Risk & Resilience", 29: "Human Enhancement",
        30: "Digital Society", 31: "Environmental Tech", 32: "Infrastructure",
        33: "Global Systems", 34: "Emerging Markets", 35: "Innovation Ecosystems"
    }
    
    # Create figure
    fig = go.Figure()
    
    # Add radial lines from center to each cluster - extended for bigger radar
    angle_per_cluster = 360 / n_clusters
    for i in range(n_clusters):
        angle = i * angle_per_cluster
        angle_rad = math.radians(angle)
        fig.add_trace(go.Scatter(
            x=[0, 7.0 * math.cos(angle_rad)],
            y=[0, 7.0 * math.sin(angle_rad)],
            mode='lines',
            line=dict(color='rgba(255,255,255,0.15)', width=1),
            showlegend=False,
            hoverinfo='skip'
        ))
    
    # Add driving forces as nodes - ALL IN ONE TRACE for proper coloring
    colors = {
        'Megatrends': '#ff2d92',
        'Trends': '#007aff', 
        'Weak Signals': '#00c896',
        'Wildcards': '#ff6b35'
    }
    
    def get_ai_ratings(row):
        """Simulate AI ratings for impact and time to market - exact from legacy"""
        random.seed(hash(row['Title']) % 10000)
        
        if row['Driving Force'] == 'Megatrends':
            impact = 0.7 + random.random() * 0.3
            time_to_market = 1 + random.random() * 2
        elif row['Driving Force'] == 'Trends':
            impact = 0.5 + random.random() * 0.4
            time_to_market = 2 + random.random() * 3
        elif row['Driving Force'] == 'Weak Signals':
            impact = 0.2 + random.random() * 0.5
            time_to_market = 3 + random.random() * 5
        else:  # Wildcards
            impact = 0.1 + random.random() * 0.8
            time_to_market = 1 + random.random() * 9
        
        return {
            'impact_score': impact,
            'time_to_market': time_to_market,
            'impact_percent': int(impact * 100)
        }
    
    # Collect all nodes data
    x_coords = []
    y_coords = []
    node_colors = []
    node_sizes = []
    hover_texts = []
    node_titles = []
    node_data = []  # Store node data for connections
    
    # Process each cluster
    for cluster in clusters:
        cluster_data = curated_df[curated_df['cluster_id'] == cluster]
        
        # Calculate angle range for this cluster
        cluster_index = clusters.index(cluster)
        start_angle = cluster_index * angle_per_cluster
        end_angle = start_angle + angle_per_cluster
        
        # Add nodes for this cluster
        for idx, row in cluster_data.iterrows():
            # Random angle within cluster range
            angle = random.uniform(start_angle + 3, end_angle - 3)
            angle_rad = math.radians(angle)
            
            # Get AI ratings
            ai_ratings = get_ai_ratings(row)
            
            # Random radius distribution - increased range for bigger radar
            radius = random.uniform(0.5, 6.5)
            
            # Calculate x, y coordinates
            x = radius * math.cos(angle_rad)
            y = radius * math.sin(angle_rad)
            
            x_coords.append(x)
            y_coords.append(y)
            node_colors.append(colors.get(row['Driving Force'], '#666'))
            node_sizes.append(12)  # Increased size for better visibility
            
            # Store node title for display
            title = row['Title'][:30] + "..." if len(row['Title']) > 30 else row['Title']
            node_titles.append(title)
            
            # Store node data for connections
            node_data.append({
                'x': x, 'y': y, 'title': row['Title'], 
                'cluster': cluster, 'driving_force': row['Driving Force'],
                'tags': row.get('Tags', ''), 'description': row.get('Description', '')
            })
            
            hover_text = (
                f"<b>{row['Title']}</b><br>" +
                f"Type: {row['Driving Force']}<br>" +
                f"Cluster: {cluster_names.get(cluster, f'Cluster {cluster}')}<br>" +
                f"AI Impact Score: {ai_ratings['impact_percent']}%<br>" +
                f"Time to Market: {ai_ratings['time_to_market']:.1f} years<br>"
            )
            if pd.notna(row.get('Tags', '')):
                hover_text += f"Tags: {row.get('Tags', 'N/A')}<br>"
            hover_texts.append(hover_text)
    
    # Add connections between related nodes - only if enabled
    if show_connections and 'show' in show_connections:
        random.seed(42)  # Consistent connections
        connection_threshold = 0.3  # Similarity threshold for connections
        
        # Limit connections to prevent overcrowding
        max_connections = min(100, len(node_data) * 2)
        connections_added = 0
        
        for i in range(len(node_data)):
            if connections_added >= max_connections:
                break
            for j in range(i + 1, min(len(node_data), i + 20)):  # Limit nearby connections
                if connections_added >= max_connections:
                    break
                    
                node1, node2 = node_data[i], node_data[j]
                
                # Create connections based on shared keywords, same cluster, or related driving forces
                should_connect = False
                
                # Same cluster connections (stronger)
                if node1['cluster'] == node2['cluster']:
                    should_connect = random.random() < 0.15  # 15% chance within cluster
                
                # Cross-cluster connections based on shared keywords
                elif node1['tags'] and node2['tags']:
                    tags1 = set(str(node1['tags']).lower().split())
                    tags2 = set(str(node2['tags']).lower().split())
                    if len(tags1.intersection(tags2)) > 0:
                        should_connect = random.random() < 0.08  # 8% chance for shared tags
                
                # Related driving forces connections
                related_forces = [
                    {'Megatrends', 'Trends'},
                    {'Trends', 'Weak Signals'},
                    {'Weak Signals', 'Wildcards'}
                ]
                for force_pair in related_forces:
                    if {node1['driving_force'], node2['driving_force']} == force_pair:
                        should_connect = random.random() < 0.05  # 5% chance for related forces
                
                if should_connect:
                    # Add connection line
                    fig.add_trace(go.Scatter(
                        x=[node1['x'], node2['x']],
                        y=[node1['y'], node2['y']],
                        mode='lines',
                        line=dict(
                            color='rgba(255,255,255,0.1)',
                            width=0.5
                        ),
                        showlegend=False,
                        hoverinfo='skip'
                    ))
                    connections_added += 1
    
    # Add all nodes as single trace - conditionally show titles
    if show_node_titles and 'titles' in show_node_titles and show_node_titles['titles']:
        # Show nodes with titles
        fig.add_trace(go.Scatter(
            x=x_coords,
            y=y_coords,
            mode='markers+text',
            marker=dict(
                size=node_sizes,
                color=node_colors,
                opacity=0.8,
                line=dict(width=0, color='rgba(0,0,0,0)')  # Remove borders
            ),
            text=node_titles,
            textposition='top center',
            textfont=dict(
                size=8,
                color='rgba(255,255,255,0.8)'
            ),
            hovertext=hover_texts,
            hovertemplate="%{hovertext}<extra></extra>",
            showlegend=False
        ))
    else:
        # Show nodes without titles
        fig.add_trace(go.Scatter(
            x=x_coords,
            y=y_coords,
            mode='markers',
            marker=dict(
                size=node_sizes,
                color=node_colors,
                opacity=0.8,
                line=dict(width=0, color='rgba(0,0,0,0)')  # Remove borders
            ),
            text=hover_texts,
            hovertemplate="%{text}<extra></extra>",
            showlegend=False
        ))
    
    # Add cluster numbers with hover tooltips - EXACT legacy implementation
    for i, cluster in enumerate(clusters):
        angle = (i + 0.5) * angle_per_cluster
        angle_rad = math.radians(angle)
        x = 6.8 * math.cos(angle_rad)
        y = 6.8 * math.sin(angle_rad)
        
        cluster_name = cluster_names.get(cluster, f"Cluster {cluster}")
        
        # Add invisible scatter point for hover
        fig.add_trace(go.Scatter(
            x=[x],
            y=[y],
            mode='markers+text',
            text=[str(cluster)],
            textposition='middle center',
            textfont=dict(size=12, color=APPLE_THEME['text'], weight=600),  # Smaller font
            marker=dict(
                size=20,
                color='rgba(0,0,0,0)',  # Invisible marker
                opacity=0
            ),
            hovertemplate=f"<b>Cluster {cluster}</b><br>{cluster_name}<extra></extra>",
            showlegend=False,
            hoverinfo='text'
        ))
    
    # Update layout to match legacy style - EXACT
    fig.update_layout(
        plot_bgcolor='#000000',
        paper_bgcolor='#000000',
        showlegend=False,
        xaxis=dict(
            showgrid=False,
            showticklabels=False,
            zeroline=False,
            range=[-7.5, 7.5]
        ),
        yaxis=dict(
            showgrid=False,
            showticklabels=False,
            zeroline=False,
            range=[-7.5, 7.5],
            scaleanchor="x",
            scaleratio=1
        ),
        margin=dict(l=20, r=20, t=20, b=150),
        height=1200,
        hovermode='closest',
        dragmode='pan',
        font=dict(family=APPLE_THEME['font'], color=APPLE_THEME['text'])
    )
    
    # Add legend at bottom - EXACT from legacy
    legend_items = [
        {'color': '#ff2d92', 'label': 'Megatrends'},
        {'color': '#007aff', 'label': 'Trends'},
        {'color': '#00c896', 'label': 'Weak Signals'},
        {'color': '#ff6b35', 'label': 'Wildcards'}
    ]
    
    for i, item in enumerate(legend_items):
        fig.add_trace(go.Scatter(
            x=[None],
            y=[None],
            mode='markers',
            marker=dict(size=10, color=item['color']),
            showlegend=True,
            name=item['label']
        ))
    
    fig.update_layout(
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=-0.15,
            xanchor="center",
            x=0.5,
            font=dict(size=12),
            bgcolor='rgba(0,0,0,0)',
            bordercolor='rgba(0,0,0,0)'
        )
    )
    
    return fig


def build_scatter_3d(df: pd.DataFrame, show_titles: bool = False, show_signals: bool = True) -> go.Figure:
    """
    Build a fast 3D scatter plot using EXACT legacy logic
    
    Args:
        df: DataFrame with legacy structure columns
        show_titles: Whether to show node titles
        show_signals: Whether to include signals nodes
        
    Returns:
        Plotly Figure with exact legacy styling
    """
    filtered_data = df.copy()
    
    if filtered_data.empty:
        return go.Figure().add_annotation(text="No data available", showarrow=False)
    
    # Add z coordinate if missing
    if "tsne_z" not in filtered_data.columns:
        filtered_data["tsne_z"] = np.random.uniform(-0.5, 0.5, len(filtered_data))
    
    # Downsample for fast rendering if needed
    if len(filtered_data) > 8000:
        filtered_data = filtered_data.sample(8000, random_state=42)
        logger.info(f"Downsampled to 8000 points for fast 3D rendering")
    
    # Force type colors and sizes - exact specifications
    force_type_colors = {
        'megatrends': '#ff2d92',
        'trends': '#007aff', 
        'weak signals': '#00c896',
        'wildcards': '#ff6b35',
        'signals': '#787878'  # Gray for signals
    }
    
    force_type_sizes = {
        'megatrends': 12,
        'trends': 10,
        'weak signals': 8,
        'wildcards': 10,
        'signals': 6
    }
    
    # Individual node property calculation - force type based
    colors = []
    sizes = []
    
    for _, row in filtered_data.iterrows():
        df_value = str(row["Driving Force"]).strip().lower()
        
        # Get color and size based on force type
        color = force_type_colors.get(df_value, '#999999')
        size = force_type_sizes.get(df_value, 8)
        
        colors.append(color)
        sizes.append(size)

    fig = go.Figure()

    # EXACT 3D plotting logic from legacy - separate curated and signals
    curated_mask = filtered_data["Driving Force"].str.lower().isin(["megatrends", "trends", "weak signals", "wildcards"])
    signals_mask = filtered_data["Driving Force"].str.lower() == "signals"
    
    coords = filtered_data[["tsne_x", "tsne_y", "tsne_z"]].to_numpy() if len(filtered_data) > 0 else np.empty((0, 3))
    
    # Create separate traces for each force type to ensure proper legend and styling
    force_types = ['megatrends', 'trends', 'weak signals', 'wildcards']
    force_type_labels = {
        'megatrends': 'Megatrends',
        'trends': 'Trends',
        'weak signals': 'Weak Signals',
        'wildcards': 'Wildcards'
    }
    
    # Process each force type separately for better control
    for force_type in force_types:
        force_mask = filtered_data["Driving Force"].str.lower() == force_type
        
        if np.sum(force_mask.values) > 0:
            force_coords = coords[force_mask.values]
            force_data = filtered_data[force_mask]
            
            # Get color and size for this force type
            force_color = force_type_colors[force_type]
            force_size = force_type_sizes[force_type]
            
            # Create proper hover data and customdata for selection
            customdata = []
            hover_text = []
            for _, row in force_data.iterrows():
                title = str(row.get("Title", "")).strip()
                desc = str(row.get("Description", "")).strip()
                driving_force = str(row.get("Driving Force", "")).strip()
                cluster_id = row.get("Cluster", row.get("cluster_id", "N/A"))
                tags = str(row.get("Tags", "")).strip()
                
                # Truncate description to 20 words for tooltip
                desc_words = desc.split()[:20]
                desc_short = " ".join(desc_words) + ("..." if len(desc.split()) > 20 else "")
                
                # Create rich tooltip with improved formatting
                hover_text_rich = (
                    f"<b style='font-size:14px'>{title[:50] + '...' if len(title) > 50 else title}</b><br>" +
                    f"<span style='color:#007aff'>Type:</span> {driving_force}<br>" +
                    f"<span style='color:#007aff'>Cluster:</span> {cluster_id}<br>" +
                    f"<span style='color:#007aff'>Description:</span><br>{desc_short}"
                )
                if tags and tags != 'nan':
                    hover_text_rich += f"<br><span style='color:#007aff'>Tags:</span> {tags[:100] + '...' if len(str(tags)) > 100 else tags}"
                
                # Maintain customdata structure: [force_id, type, cluster] for client selection
                customdata.append([row.get("ID", ""), driving_force, str(cluster_id)])
                hover_text.append(hover_text_rich)
            
            fig.add_trace(go.Scatter3d(
                x=force_coords[:, 0],
                y=force_coords[:, 1], 
                z=force_coords[:, 2],
                mode="markers+text" if show_titles else "markers",
                text=[str(row.get("Title", ""))[:15] + "..." if len(str(row.get("Title", ""))) > 15 else str(row.get("Title", "")) for _, row in force_data.iterrows()] if show_titles else None,
                textposition="top center" if show_titles else None,
                textfont=dict(size=8, color="white") if show_titles else None,
                marker=dict(
                    size=force_size,
                    color=force_color,
                    opacity=0.92,
                    line=dict(width=2, color="rgba(255,255,255,0.9)")  # White borders with 2px width
                ),
                customdata=customdata,
                hovertemplate="%{hovertext}<extra></extra>",
                hovertext=hover_text,
                name=force_type_labels[force_type],
                showlegend=True,
                legendgroup=force_type
            ))
    
    # Signals nodes - maintain consistency with force type styling
    if show_signals and np.sum(signals_mask.values) > 0:
        signals_coords = coords[signals_mask.values]
        signals_data = filtered_data[signals_mask]
        
        # Get color and size for signals
        signals_color = force_type_colors['signals']
        signals_size = force_type_sizes['signals']
        
        # Create proper hover data for signals
        customdata_signals = []
        hover_text_signals = []
        for _, row in signals_data.iterrows():
            title = str(row.get("Title", "")).strip()
            desc = str(row.get("Description", "")).strip()
            driving_force = str(row.get("Driving Force", "")).strip()
            cluster_id = row.get("Cluster", row.get("cluster_id", "N/A"))
            tags = str(row.get("Tags", "")).strip()
            
            # Truncate description to 20 words for tooltip
            desc_words = desc.split()[:20]
            desc_short = " ".join(desc_words) + ("..." if len(desc.split()) > 20 else "")
            
            # Create rich tooltip with improved formatting
            hover_text_rich = (
                f"<b style='font-size:14px'>{title[:50] + '...' if len(title) > 50 else title}</b><br>" +
                f"<span style='color:#007aff'>Type:</span> {driving_force}<br>" +
                f"<span style='color:#007aff'>Cluster:</span> {cluster_id}<br>" +
                f"<span style='color:#007aff'>Description:</span><br>{desc_short}"
            )
            if tags and tags != 'nan':
                hover_text_rich += f"<br><span style='color:#007aff'>Tags:</span> {tags[:100] + '...' if len(str(tags)) > 100 else tags}"
            
            # Maintain customdata structure: [force_id, type, cluster] for client selection
            customdata_signals.append([row.get("ID", ""), driving_force, str(cluster_id)])
            hover_text_signals.append(hover_text_rich)
        
        fig.add_trace(go.Scatter3d(
            x=signals_coords[:, 0],
            y=signals_coords[:, 1],
            z=signals_coords[:, 2],
            mode="markers+text" if show_titles else "markers",
            text=[str(row.get("Title", ""))[:15] + "..." if len(str(row.get("Title", ""))) > 15 else str(row.get("Title", "")) for _, row in signals_data.iterrows()] if show_titles else None,
            textposition="top center" if show_titles else None,
            textfont=dict(size=8, color="rgba(255,255,255,0.8)") if show_titles else None,
            marker=dict(
                size=signals_size,
                color=signals_color,
                opacity=0.92,
                line=dict(width=2, color="rgba(255,255,255,0.9)")  # White borders with 2px width
            ),
            customdata=customdata_signals,
            hovertemplate="%{hovertext}<extra></extra>",
            hovertext=hover_text_signals,
            name="Signals",
            showlegend=True,
            legendgroup="signals"
        ))
    
    # EXACT 3D layout from legacy - CRITICAL: Exact camera eye positioning
    fig.update_layout(
        scene=dict(
            bgcolor="#000000",
            xaxis=dict(visible=False, showgrid=False, zeroline=False, showticklabels=False),
            yaxis=dict(visible=False, showgrid=False, zeroline=False, showticklabels=False),
            zaxis=dict(visible=False, showgrid=False, zeroline=False, showticklabels=False),
            aspectmode="cube",  # Critical for consistent node sizes
            aspectratio=dict(x=1.2, y=1.2, z=1.2),  # Exact ratios from legacy
        ),
        scene_camera=dict(eye=dict(x=1.6, y=1.6, z=1.6)),  # EXACT camera positioning from legacy
        paper_bgcolor="#000000",
        plot_bgcolor="#000000",
        font=dict(color="white", family="'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"),
        showlegend=True,  # Show legend for force types
        legend=dict(
            orientation="h",  # Horizontal legend
            yanchor="bottom",
            y=-0.1,  # Position below the chart
            xanchor="center",
            x=0.5,
            font=dict(size=12, color="white"),
            bgcolor='rgba(0,0,0,0)',  # Transparent background
            bordercolor='rgba(255,255,255,0.2)',  # Subtle border
            borderwidth=1
        ),
        margin=dict(l=0, r=0, t=0, b=50)  # Add bottom margin for legend
    )
    
    return fig