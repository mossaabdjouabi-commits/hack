import os
import requests
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib

def download_zenodo(record_id: str, out_dir: str = "data_zenodo"):
    api_url = f"https://zenodo.org/api/records/{record_id}/files"
    resp = requests.get(api_url)
    resp.raise_for_status()
    files = resp.json()
    os.makedirs(out_dir, exist_ok=True)
    downloaded = []
    for f in files:
        fname = f['key']
        url = f['links']['self']  # or maybe 'download' link depending on metadata
        print("Downloading", fname)
        r = requests.get(url)
        r.raise_for_status()
        local_path = os.path.join(out_dir, fname)
        with open(local_path, "wb") as out:
            out.write(r.content)
        downloaded.append(local_path)
    return downloaded

def load_data_file(file_path: str):
    # try various loaders depending on file extension
    if file_path.endswith(".csv"):
        return pd.read_csv(file_path)
    elif file_path.endswith((".xls", ".xlsx")):
        return pd.read_excel(file_path)
    # add more formats if needed
    else:
        raise ValueError(f"Unsupported file type: {file_path}")

def get_dataset(record_id: str):
    try:
        files = download_zenodo(record_id)
        # For simplicity assume first valid CSV/Excel is our data
        for f in files:
            try:
                df = load_data_file(f)
                print("Loaded data from", f)
                return df
            except Exception as e:
                print("Could not load", f, "-", e)
        raise ValueError("No suitable data file found")
    except Exception as e:
        print("Failed to download or load real data:", e)
        print("Using synthetic fallback data")
        np.random.seed(42)
        n = 1000
        df = pd.DataFrame({
            'Perenniality': np.random.choice([0, 1], n, p=[0.4, 0.6]),
            'Woodiness': np.random.choice([0, 1], n, p=[0.7, 0.3]),
            'Genome_size': np.random.uniform(1, 15, n),
            'Pollination_wind': np.random.choice([0, 1], n, p=[0.6, 0.4]),
            'Pollination_insect': np.random.choice([0, 1], n, p=[0.5, 0.5]),
            'Pollination_self': np.random.choice([0, 1], n, p=[0.7, 0.3]),
            'Drought_tolerance': np.random.uniform(0, 1, n),
            'Salinity_tolerance': np.random.uniform(0, 1, n),
            'Disease_resistance': np.random.uniform(0, 1, n),
            'hybridization_success': np.random.choice([0, 1], n, p=[0.35, 0.65])
        })
        return df

def preprocess(df: pd.DataFrame):
    df = df.copy()
    # Basic cleaning
    df = df.drop_duplicates()
    # Optionally: deal with missing values
    # df = df.fillna(method='ffill').fillna(method='bfill')  # or dropna
    df = df.dropna()
    # If there are categorical columns not numeric already, encode them:
    for col in df.select_dtypes(include=["object", "category"]).columns:
        df[col] = df[col].astype('category').cat.codes
    return df

def main():
    df = get_dataset("4920064")
    print("Initial data:", df.shape)
    df_clean = preprocess(df)
    print("After cleaning:", df_clean.shape)
    
    if 'hybridization_success' not in df_clean.columns:
        raise ValueError("Target column 'hybridization_success' not found!")

    X = df_clean.drop('hybridization_success', axis=1)
    y = df_clean['hybridization_success']

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1)

    # Optionally: cross-validation
    cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring='accuracy')
    print("CV accuracy: %.2f ± %.2f" % (cv_scores.mean(), cv_scores.std()))

    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)

    print("Test accuracy:", accuracy_score(y_test, y_pred))
    print("Classification report:")
    print(classification_report(y_test, y_pred))

    # Save
    df_clean.to_csv('hybridization_clean_data.csv', index=False)
    joblib.dump(model, 'hybridization_model.pkl')
    print("Clean data & model saved.")

if __name__ == "__main__":
    main()

