import os
from selenium.webdriver.common.by import By

class PDFViewerPage:
    def __init__(self, driver):
        self.driver = driver
        # Elementy strony
        self.pdf_container = (By.ID, "pdf-container")
        self.file_input = (By.ID, "file-input")
        self.zoom_in = (By.ID, "zoom-in")
        self.zoom_out = (By.ID, "zoom-out")
        self.reset_zoom = (By.ID, "reset-zoom")
        self.fit_width = (By.ID, "fit-width")
        self.fit_height = (By.ID, "fit-height")

    def open(self, url):
        self.driver.get(url)

    def is_pdf_container_visible(self):
        return self.driver.find_element(*self.pdf_container).is_displayed()

    def open_file(self, file_path):
        file_input_el = self.driver.find_element(*self.file_input)
        file_input_el.send_keys(file_path)

    def click_zoom_in(self):
        self.driver.find_element(*self.zoom_in).click()

    def click_zoom_out(self):
        self.driver.find_element(*self.zoom_out).click()

    def click_reset_zoom(self):
        self.driver.find_element(*self.reset_zoom).click()

    def click_fit_width(self):
        self.driver.find_element(*self.fit_width).click()

    def click_fit_height(self):
        self.driver.find_element(*self.fit_height).click()
