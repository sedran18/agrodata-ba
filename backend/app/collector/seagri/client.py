import requests
from requests.adapters import HTTPAdapter
from urllib3.util import Retry
import logging

logger = logging.getLogger(__name__)

BASE_URL = 'https://www.ba.gov.br/seagri/cotacao'
MAX_ATTEMPTS = 3
STATUS_FORCE_LIST = [408, 429, 500, 502, 503, 504]
TIMEOUT = 30

retries  = Retry(
    total=MAX_ATTEMPTS,
    status_forcelist=STATUS_FORCE_LIST,
    allowed_methods=["GET"],
    backoff_factor=1,
    respect_retry_after_header=True,
)

session = requests.Session()

session.mount('https://', HTTPAdapter(max_retries=retries))
session.mount('http://', HTTPAdapter(max_retries=retries))

HEADERS = {
    "User-Agent": "AgroDataBA/1.0",
    "Accept": "text/html,application/xhtml+xml",
}

session.headers.update(HEADERS)

def fetch_page(params: dict) -> str:
    res = session.get(
        BASE_URL, 
        timeout=TIMEOUT, 
        params=params
    )
    
    res.raise_for_status()
    return res.text
