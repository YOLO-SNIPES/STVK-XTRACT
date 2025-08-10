import re
from playwright.sync_api import sync_playwright, Page, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Navigate to the login page
        page.goto("http://localhost:5000/login")

        # Sign up
        page.click("text=Don't have an account? Sign Up")
        page.fill('input[id="signup-username"]', "testuser")
        page.fill('input[id="signup-password"]', "password123")
        page.click("text=Sign Up")

        # Go back to login page
        page.click("text=Already have an account? Login")

        # Login with the new user
        page.fill('input[id="login-username"]', "testuser")
        page.fill('input[id="login-password"]', "password123")
        page.click("text=Login")

        # Manually navigate to home and check for login
        page.goto("http://localhost:5000/")
        expect(page.locator("button:has-text('Logout')")).to_be_visible()

        # Upload audio file
        with page.expect_file_chooser() as fc_info:
            page.click('label[for="audioFile"]')
        file_chooser = fc_info.value
        file_chooser.set_files("test.wav")

        # Wait for processing to complete
        expect(page.locator("p:has-text('STATUS: COMPLETED')")).to_be_visible(timeout=60000)

        # Verify that the stems are displayed
        samples_display = page.locator(".cyber-card:has-text('SEPARATED TRACKS')")
        expect(samples_display).to_be_visible()

        # Check for at least one audio player
        expect(samples_display.locator("audio")).to_have_count(4)

        # Take a screenshot
        page.screenshot(path="jules-scratch/verification/verification.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
