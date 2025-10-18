from selenium.webdriver.common.by import By
from pages.base_page import BasePage

class TestPanelPage(BasePage):
    PANEL = (By.ID, "test-panel")
    TAB_BUTTONS = (By.CSS_SELECTOR, ".tab-btn")
    TEST_STATUS = (By.ID, "test-status")
    TEST_CODE = (By.ID, "test-code")
    RERUN_BTN = (By.ID, "rerun-test")

    def is_panel_visible(self):
        return self.find(self.PANEL).is_displayed()

    def switch_tab(self, tab_name):
        for btn in self.find_all(self.TAB_BUTTONS):
            if tab_name.lower() in btn.get_attribute("title").lower():
                btn.click()
                break

    def get_test_status_text(self):
        return self.find(self.TEST_STATUS).text

    def get_test_code_text(self):
        return self.find(self.TEST_CODE).text

    def click_rerun_test(self):
        self.find(self.RERUN_BTN).click()
