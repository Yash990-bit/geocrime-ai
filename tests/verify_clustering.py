
import sys
import os
import numpy as np

# Add src to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../src')))

from models.clustering_model import HotspotClusteringModel

def test_dbscan():
    print("\n--- Testing DBSCAN ---")
    data = np.array([
        [12.9716, 77.5946, 0.5], # Bangalore center
        [12.9717, 77.5947, 0.6],
        [12.9715, 77.5945, 0.4],
        [12.9000, 77.5000, 0.1], # Outlier
        [13.0000, 77.6000, 0.8], # Another cluster
        [13.0001, 77.6001, 0.9]
    ])
    
    model = HotspotClusteringModel(algorithm="dbscan", params={"eps": 0.01, "min_samples": 2})
    labels = model.fit_predict(data[:, :2])
    print(f"Labels: {labels}")
    # Expect clusters and at least one outlier (-1)
    assert -1 in labels
    assert len(set(labels)) > 1

def test_kmeans():
    print("\n--- Testing KMeans ---")
    data = np.array([
        [12.9716, 77.5946, 1.0], 
        [12.9717, 77.5947, 1.0],
        [12.9000, 77.5000, 10.0], # High density outlier
        [13.0000, 77.6000, 1.0],
        [13.0001, 77.6001, 1.0]
    ])
    
    # Test without density
    print("KMeans without density:")
    model = HotspotClusteringModel(algorithm="kmeans", params={"n_clusters": 2})
    labels = model.fit_predict(data[:, :2])
    print(f"Labels: {labels}")
    assert len(set(labels)) == 2
    
    # Test with density weighting
    print("KMeans with density weighting:")
    labels_weighted = model.fit_predict(data)
    print(f"Weighted Labels: {labels_weighted}")
    assert len(set(labels_weighted)) == 2

def test_save_load():
    print("\n--- Testing Save/Load ---")
    data = np.random.rand(10, 2)
    model = HotspotClusteringModel(algorithm="kmeans", params={"n_clusters": 3}, model_path="models/test_model.joblib")
    labels_orig = model.fit_predict(data)
    model.save()
    
    new_model = HotspotClusteringModel(model_path="models/test_model.joblib")
    new_model.load()
    assert new_model.algorithm == "kmeans"
    assert new_model.params["n_clusters"] == 3
    print("Save/Load success")

if __name__ == "__main__":
    try:
        test_dbscan()
        test_kmeans()
        test_save_load()
        print("\nAll clustering tests passed!")
    except Exception as e:
        print(f"\nTest failed: {e}")
        sys.exit(1)
