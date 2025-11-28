#!/usr/bin/env python3
"""
Fixed cluster mapping for ORION system
Contains the 36 reference cluster names (IDs 0-35)
"""

# Fixed cluster names mapping (IDs 0-35)
CLUSTER_NAMES = {
    0: "AI & Automation",
    1: "Healthcare Tech", 
    2: "Sustainability",
    3: "Financial Tech",
    4: "Social Dynamics",
    5: "Smart Cities",
    6: "Energy Systems",
    7: "Digital Transformation",
    8: "Education Innovation",
    9: "Manufacturing 4.0",
    10: "Space & Defense",
    11: "Food & Agriculture",
    12: "Materials Science",
    13: "Quantum Computing",
    14: "Biotechnology",
    15: "Cybersecurity",
    16: "Transportation",
    17: "Climate Action",
    18: "Governance",
    19: "Future of Work",
    20: "Consumer Tech",
    21: "Media Evolution",
    22: "Supply Chain",
    23: "Data Economy",
    24: "Health & Wellness",
    25: "Urban Development",
    26: "Resource Management",
    27: "Scientific Research",
    28: "Risk & Resilience",
    29: "Human Enhancement",
    30: "Digital Society",
    31: "Environmental Tech",
    32: "Infrastructure",
    33: "Global Systems",
    34: "Emerging Markets",
    35: "Innovation Ecosystems"
}

def get_cluster_name(cluster_id: int) -> str:
    """
    Get cluster name by ID, with fallback for unknown IDs
    
    Args:
        cluster_id: Cluster ID (0-35)
        
    Returns:
        str: Cluster name or fallback
    """
    return CLUSTER_NAMES.get(cluster_id, f"Cluster {cluster_id}")

def get_all_cluster_names() -> dict:
    """
    Get all cluster names mapping
    
    Returns:
        dict: Complete cluster ID to name mapping
    """
    return CLUSTER_NAMES.copy()

def validate_cluster_id(cluster_id: int) -> bool:
    """
    Check if cluster ID is valid (0-35)
    
    Args:
        cluster_id: Cluster ID to validate
        
    Returns:
        bool: True if valid, False otherwise
    """
    return cluster_id in CLUSTER_NAMES