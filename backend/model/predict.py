import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error
import warnings
warnings.filterwarnings("ignore")

SEASONS = ["Jan", "May", "Aug", "Nov"]
YEARS   = list(range(2014, 2025))

def get_col(year, season):
    return f"{year}_{season}"

# ─────────────────────────────────────────────
# LOAD DATA
# ─────────────────────────────────────────────
def load_data(filepath):
    raw = pd.read_csv(filepath, encoding="latin1", header=None)

    year_row   = raw.iloc[1].tolist()
    season_row = raw.iloc[2].tolist()

    col_names = []
    current_year = None

    for i, (yr, seas) in enumerate(zip(year_row, season_row)):
        if i == 0:
            col_names.append("District")
        elif i == 1:
            col_names.append("Block")
        elif i == 2:
            col_names.append("Village")
        else:
            if pd.notna(yr):
                current_year = str(int(float(yr)))
            season = str(seas) if pd.notna(seas) else "?"
            col_names.append(f"{current_year}_{season}")

    df = raw.iloc[3:].copy()
    df.columns = col_names
    df = df[df["District"].notna()]
    df = df.reset_index(drop=True)

    for col in df.columns[3:]:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    print(f"✅ Data loaded: {len(df)} villages")
    return df

# ─────────────────────────────────────────────
# FEATURE ENGINEERING
# ─────────────────────────────────────────────
def build_features_for_season(df, season):
    season_idx = SEASONS.index(season)
    prev_season = SEASONS[season_idx - 1]

    X_train, y_train = [], []
    X_pred, actuals, indices = [], [], []

    for idx, row in df.iterrows():
        season_vals = {yr: row.get(get_col(yr, season)) for yr in YEARS}

        # TRAIN
        for t in range(2017, 2024):
            v1, v2, v3 = season_vals.get(t-1), season_vals.get(t-2), season_vals.get(t-3)
            vt = season_vals.get(t)

            if any(pd.isna(x) for x in [v1, v2, v3, vt]):
                continue

            lag_col = get_col(t-1, prev_season) if season_idx == 0 else get_col(t, prev_season)
            lag_val = row.get(lag_col, np.nan)

            rolling = np.mean([v1, v2, v3])
            trend = v1 - v3

            X_train.append([t, v1, v2, v3, rolling, trend,
                            lag_val if not pd.isna(lag_val) else rolling])
            y_train.append(vt)

        # PREDICT 2024
        v1, v2, v3 = season_vals.get(2023), season_vals.get(2022), season_vals.get(2021)

        if any(pd.isna(x) for x in [v1, v2, v3]):
            X_pred.append(None)
            actuals.append(np.nan)
            indices.append(idx)
            continue

        lag_col = get_col(2023, prev_season) if season_idx == 0 else get_col(2024, prev_season)
        lag_val = row.get(lag_col, np.nan)

        rolling = np.mean([v1, v2, v3])
        trend = v1 - v3

        X_pred.append([2024, v1, v2, v3, rolling, trend,
                       lag_val if not pd.isna(lag_val) else rolling])
        actuals.append(season_vals.get(2024))
        indices.append(idx)

    return np.array(X_train), np.array(y_train), X_pred, actuals, indices

# ─────────────────────────────────────────────
# TRAIN + PREDICT
# ─────────────────────────────────────────────
def train_and_predict(df):
    results = []

    for season in SEASONS:
        print(f"\n🔹 Training for {season}")

        X_train, y_train, X_pred_list, actual_list, idx_list = build_features_for_season(df, season)

        if len(X_train) < 10:
            continue

        model = RandomForestRegressor(
            n_estimators=80,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=3,
            n_jobs=-1,
            random_state=42
        )

        model.fit(X_train, y_train)

        print(f"MAE: {mean_absolute_error(y_train, model.predict(X_train)):.3f}")

        # FILTER VALID
        valid = [(i, f, a) for i, f, a in zip(idx_list, X_pred_list, actual_list) if f is not None]

        if not valid:
            continue

        idxs, feats, actuals = zip(*valid)
        feats = np.array(feats)

        # 2024 prediction
        preds_2024 = model.predict(feats)

        # 2025 features
        feats_2025 = []
        for f, p2024 in zip(feats, preds_2024):
            _, v1, v2, v3, _, _, lag = f

            new_v1 = p2024
            new_v2 = v1
            new_v3 = v2

            rolling = np.mean([new_v1, new_v2, new_v3])
            trend = new_v1 - new_v3

            feats_2025.append([2025, new_v1, new_v2, new_v3, rolling, trend, lag])

        preds_2025 = model.predict(np.array(feats_2025))

        # STORE RESULTS
        for df_idx, p2024, p2025, actual in zip(idxs, preds_2024, preds_2025, actuals):
            row = df.loc[df_idx]

            diff = (actual - p2024) if not pd.isna(actual) else np.nan

            results.append({
                "District": row["District"],
                "Block": row["Block"],
                "Village": row["Village"],
                "Season": season,
                "Actual_2024": round(actual, 3) if not pd.isna(actual) else np.nan,
                "Predicted_2024": round(p2024, 3),
                "Predicted_2025": round(p2025, 3),
                "Difference": round(diff, 3) if not pd.isna(diff) else np.nan,
                "Abs_Difference": round(abs(diff), 3) if not pd.isna(diff) else np.nan,
            })

    return pd.DataFrame(results)

# ─────────────────────────────────────────────
# RISK
# ─────────────────────────────────────────────
def assign_risk(row):
    depth = row.get("Avg_Predicted_2025", row.get("Predicted_2025", np.nan))
    err = row.get("Avg_Abs_Difference", row.get("Abs_Difference", np.nan))

    if pd.isna(depth): d = 0
    elif depth <= 5: d = 0
    elif depth <= 10: d = 1
    elif depth <= 15: d = 2
    else: d = 3

    if pd.isna(err): e = 0
    elif err <= 2: e = 0
    elif err <= 5: e = 1
    elif err <= 8: e = 2
    else: e = 3

    return ["SAFE", "MODERATE", "HIGH", "CRITICAL"][max(d, e)]

# ─────────────────────────────────────────────
# AGGREGATION
# ─────────────────────────────────────────────
def aggregate_village(df, results):
    agg = (results
           .groupby(["District", "Block", "Village"])
           .agg(
               Avg_Actual_2024=("Actual_2024", "mean"),
               Avg_Predicted_2024=("Predicted_2024", "mean"),
               Avg_Predicted_2025=("Predicted_2025", "mean"),
               Avg_Difference=("Difference", "mean"),
               Avg_Abs_Difference=("Abs_Difference", "mean"),
           )
           .reset_index()
           .round(3))

    agg["Risk_Level"] = agg.apply(assign_risk, axis=1)

    combined = df.merge(agg, on=["District", "Block", "Village"], how="left")

    return combined, agg

# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────
def main():
    df = load_data("Groundwater_Cleaned_Final.csv")

    results = train_and_predict(df)
    results["Risk_Level"] = results.apply(assign_risk, axis=1)

    combined, village = aggregate_village(df, results)

    results.to_csv("predictions_by_season.csv", index=False)
    combined.to_csv("village_risk_summary.csv", index=False)

    print("\n✅ DONE — 2024 + 2025 Predictions Added")
    print("Files saved:")
    print(" - predictions_by_season.csv")
    print(" - village_risk_summary.csv")

if __name__ == "__main__":
    main()