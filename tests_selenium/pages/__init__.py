# tests_selenium/pages/pdf_viewer_page.py
from selenium.webdriver.common.by import By

class PDFViewerPage:
    def __init__(self, driver):
        self.driver = driver

    def open(self, url):
        self.driver.get(url)

    def get_title(self):
        return self.driver.title

    # Dodaj inne metody np. zoom, open file itd.
