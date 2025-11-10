from __future__ import annotations

from datetime import datetime

from airflow import DAG
from airflow.operators.bash import BashOperator

with DAG(
    dag_id="nflfastr_download",
    start_date=datetime(2024, 1, 1),
    schedule_interval="@monthly",
    catchup=False,
    tags=["data", "nfl"],
) as dag:
    download_task = BashOperator(
        task_id="download_play_by_play",
        bash_command="cd /opt/airflow/repo && npm run data:nflfastr:download -- --season 2023 --season 2022 --out data/nflfastR",
    )
