import numpy as np
import pandas as pd
import pickle
from flask import Flask, request, jsonify, render_template
import os
from sklearn.linear_model import LogisticRegression

# --- Dummy Model Training/Loading (Ensures a valid model.pkl exists) ---
MODEL_PATH = 'model.pkl'

if not os.path.exists(MODEL_PATH):
    print("Training a dummy model...")
    # Creating a simple dummy dataset for all 13 features:
    data_size = 500
    np.random.seed(42)
    
    data = {
        'age': np.random.randint(29, 77, size=data_size),
        'sex': np.random.randint(0, 2, size=data_size), 
        'cp': np.random.randint(0, 4, size=data_size), 
        'trestbps': np.random.randint(90, 200, size=data_size), 
        'chol': np.random.randint(126, 564, size=data_size), 
        'fbs': np.random.randint(0, 2, size=data_size), 
        'restecg': np.random.randint(0, 3, size=data_size), # NEW: Rest ECG
        'thalach': np.random.random_integers(71, 202, size=data_size), 
        'exang': np.random.randint(0, 2, size=data_size), 
        'oldpeak': np.random.uniform(0.0, 6.2, size=data_size), 
        'slope': np.random.randint(0, 3, size=data_size), # NEW: Slope
        'ca': np.random.randint(0, 4, size=data_size), 
        'thal': np.random.randint(1, 4, size=data_size), 
        'target': np.random.randint(0, 2, size=data_size) 
    }
    
    df = pd.DataFrame(data)
    X = df.drop('target', axis=1)
    y = df['target']
    
    model = LogisticRegression(solver='liblinear', random_state=42)
    model.fit(X, y)
    
    with open(MODEL_PATH, 'wb') as file:
        pickle.dump(model, file)
    print("Dummy model trained and saved as 'model.pkl'")

# --- Application Setup ---

app = Flask(__name__)

# Load the trained model
try:
    with open(MODEL_PATH, 'rb') as file:
        model = pickle.load(file)
    print("Model loaded successfully.")
except Exception as e:
    # This error should now be fixed by the dummy model training above
    print(f"Error loading model: {e}") 

@app.route('/')
def home():
    """Serves the main HTML page."""
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    """Handles the prediction request from the frontend."""
    try:
        data = request.get_json(force=True)
        
        # NOTE: The order and keys MUST MATCH the model's training data.
        # This list uses the keys from the COMPLETE index.html form.
        features = [
            data['age'], data['sex'], data['cp'], data['trestbps'], data['chol'], 
            data['fbs'], data['restecg'], data['thalach'], data['exang'], 
            data['oldpeak'], data['slope'], data['ca'], data['thal']
        ]
        
        final_features = np.array(features).reshape(1, -1)
        
        # Get the probability of having heart disease (class 1)
        probability = model.predict_proba(final_features)[0][1] * 100
        result_percent = round(probability, 2)
        
        return jsonify({
            'success': True,
            'prediction_percentage': result_percent
        })
    
    except Exception as e:
        print(f"Prediction Error: {e}")
        # Return a 500 error if prediction fails
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    # Running the app locally
    app.run(debug=True, host='0.0.0.0', port=5000)