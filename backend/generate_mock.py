import torch
import sys
import os

# Add backend to path to import CNNModel
sys.path.append(os.path.abspath("."))
from ml.models.cnn_model import ECG_CNN
from config import settings

def generate_mock_weights():
    # Ensure weights directory exists
    os.makedirs(settings.MODEL_WEIGHTS_DIR, exist_ok=True)
    
    # Initialize the model with the correct architecture (12-lead, 6 classes)
    model = ECG_CNN(num_classes=len(settings.ECG_CLASSES), in_channels=12)
    
    # Path defined in CNNModel.save()
    save_path = os.path.join(settings.MODEL_WEIGHTS_DIR, "cnn.pt")
    
    # Save the randomly initialized state dict
    torch.save(model.state_dict(), save_path)
    print(f"Mock weights generated at: {save_path}")

if __name__ == "__main__":
    generate_mock_weights()
