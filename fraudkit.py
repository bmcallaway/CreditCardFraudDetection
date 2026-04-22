import pandas as pd
from pandas import DataFrame
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import precision_score, recall_score, f1_score, classification_report, confusion_matrix

c = [0.01, 0.1, 1, 10, 100]
class FraudDetectionModel:
    def __init__(self, file_path: str = "card_transdata.csv"):
        df = pd.read_csv(file_path)
        self.X = df.drop("fraud", axis=1)
        y = df["fraud"]

        self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(
            self.X,
            y,
            test_size=.2,
            random_state=42
        )
        self.model = LogisticRegression(C=c[1],max_iter=1000, class_weight="balanced")
        self.model.fit(self.X_train, self.y_train)

    def fraud_values(self, df: DataFrame) -> DataFrame:
        fraud_prob = self.model.predict_proba(df)[:,1]
        df["fraud"] = fraud_prob
        filtered_df = df[df["fraud"] >= 0]

        return filtered_df

    def test(self):
        fraud_prob = self.model.predict_proba(self.X_test)[:,1]
        fraud_prob = (fraud_prob > .45).astype(int)
        print(classification_report(self.y_test, fraud_prob))

        probs = self.model.predict_proba(self.X_test)[:,1]
        fraud_probs = probs[self.y_test == 1]
        legit_probs = probs[self.y_test == 0]

        print("Fraud probs sample:", fraud_probs[:10])
        print("Legit probs sample:", legit_probs[:10])



