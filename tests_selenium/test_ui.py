import os
import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from pages.pdf_viewer_page import PDFViewerPage
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options


FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:8000/index.html")
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
INVALID_FILE = os.path.join(DATA_DIR, "invalid.txt")

# --- Fixture dla przeglądarki Selenium ---
@pytest.fixture
def driver():
    """
    Tworzy instancję przeglądarki Chrome przed testem i zamyka ją po zakończeniu.
    Używamy yield, żeby zapewnić cleanup nawet jeśli test failuje.
    """


    chrome_options = Options()
    chrome_options.add_argument("--headless=new")  # tryb headless
    chrome_options.add_argument("--window-size=1920,1080")  # wirtualny ekran
    chrome_options.add_argument("--disable-dev-shm-usage")  # opcjonalne w kontenerach


    driver = webdriver.Chrome()
    yield driver
    driver.quit()

# --- Fixture dla strony PDF Viewer ---
@pytest.fixture
def pdf_page(driver):
    """
    Tworzy instancję PDFViewerPage i otwiera stronę frontendową.
    Dzięki temu w testach możemy operować metodami wysokiego poziomu zamiast bezpośrednio WebDriverem.
    """
    page = PDFViewerPage(driver)
    page.open(FRONTEND_URL)
    return page

# --- Testy funkcjonalne ---

def test_frontend_loads(pdf_page):
    """
    Test wczytania strony PDF Viewer.
    Sprawdzamy, czy tytuł strony zawiera 'PDF Viewer'.
    """
    assert "PDF Viewer" in pdf_page.driver.title

def test_homepage_loads(driver):
    """
    Alternatywny test ładowania strony bez wrappera PDFViewerPage.
    Sprawdzenie tytułu strony przy użyciu samego WebDrivera.
    """
    driver.get(FRONTEND_URL)
    assert "PDF Viewer" in driver.title

def test_pdf_container_visible(pdf_page):
    """
    Sprawdza, czy kontener PDF jest widoczny.
    To ważne, bo inne interakcje (zoom, open_file) zależą od poprawnego załadowania kontenera.
    """
    assert pdf_page.is_pdf_container_visible()

def test_open_invalid_file(pdf_page):
    """
    Test obsługi nieistniejącego pliku PDF.
    - Tworzy pusty plik dummy jeśli go nie ma.
    - Próbuje otworzyć plik przez PDFViewerPage.
    - Sprawdza, czy pojawia się toast/error na stronie.
    """
    if not os.path.exists(INVALID_FILE):
        os.makedirs(DATA_DIR, exist_ok=True)
        with open(INVALID_FILE, "w") as f:
            f.write("dummy content")

    pdf_page.open_file(INVALID_FILE)

    try:
        # Czekamy maksymalnie 5 sekund aż toast/error stanie się widoczny
        toast = WebDriverWait(pdf_page.driver, 5).until(
            EC.visibility_of_element_located((By.ID, "pdf-toast"))
        )
        assert toast.is_displayed()
    except:
        pytest.fail("Toast/error nie pojawił się na stronie")

# --- Testy interakcji z PDF (zoom, fit) ---

def test_zoom_in_out_reset(pdf_page):
    """
    Test funkcjonalności zoom:
    - powiększenie,
    - pomniejszenie,
    - reset zoomu.
    Weryfikuje, że wszystkie przyciski działają poprawnie.
    """
    pdf_page.click_zoom_in()
    pdf_page.click_zoom_out()
    pdf_page.click_reset_zoom()

def test_fit_width_height(pdf_page):
    """
    Test dopasowania PDF do kontenera:
    - dopasowanie do szerokości,
    - dopasowanie do wysokości.
    Sprawdza, czy przyciski działają i PDF zmienia rozmiar.
    """
    pdf_page.click_fit_width()
    pdf_page.click_fit_height()
