import { test, expect } from "@playwright/test";

const MOCK_RESULT = {
  score: 85,
  verdict: "PROBABLY AI",
  autopsy: [
    "Suspiciously perfect grammar throughout",
    "Uses transition words like a textbook",
    "Zero typos is a red flag",
  ],
  tell: "Furthermore, it is important to note that",
  roast: "This text has the personality of a microwave manual",
};

// Enough text to pass the 50-char minimum
const SAMPLE_TEXT =
  "This is a sample text that is long enough to pass the fifty character minimum validation requirement for the analyze endpoint.";

test.describe("WasThatAI E2E Tests", () => {
  // 1. Landing page loads with title and textarea
  test("landing page loads with title and textarea", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("WasThatAI?");
    await expect(page.locator("textarea")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Analyze" })
    ).toBeVisible();
  });

  // 2. Button disabled when textarea is empty
  test("analyze button is disabled when textarea is empty", async ({
    page,
  }) => {
    await page.goto("/");
    const btn = page.getByRole("button", { name: "Analyze" });
    await expect(btn).toBeDisabled();
  });

  // 3. Button disabled when text is under 50 chars
  test("analyze button is disabled when text is under 50 chars", async ({
    page,
  }) => {
    await page.goto("/");
    await page.locator("textarea").fill("Short text under fifty chars.");
    const btn = page.getByRole("button", { name: "Analyze" });
    await expect(btn).toBeDisabled();
  });

  // 4. Char counter updates on typing
  test("char counter updates as user types", async ({ page }) => {
    await page.goto("/");
    const textarea = page.locator("textarea");
    const counter = page.locator("text=/\\d+\\/5000/");

    // Initially 0
    await expect(counter).toContainText("0/5000");

    // Type some text and verify counter updates
    await textarea.fill("Hello world");
    await expect(counter).toContainText("11/5000");

    // Type more
    await textarea.fill("Hello world, this is a test!");
    await expect(counter).toContainText("28/5000");
  });

  // 5. Successful analysis flow with mocked API
  test("successful analysis shows result card", async ({ page }) => {
    await page.route("**/api/analyze", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_RESULT),
      })
    );

    await page.goto("/");
    await page.locator("textarea").fill(SAMPLE_TEXT);

    const btn = page.getByRole("button", { name: "Analyze" });
    await expect(btn).toBeEnabled();
    await btn.click();

    // Wait for result card to appear
    await expect(page.getByText("PROBABLY AI")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("%")).toBeVisible();

    // Check autopsy section
    await expect(page.getByText("Personality Autopsy")).toBeVisible();
    await expect(
      page.getByText("Suspiciously perfect grammar throughout")
    ).toBeVisible();
    await expect(
      page.getByText("Uses transition words like a textbook")
    ).toBeVisible();
    await expect(page.getByText("Zero typos is a red flag")).toBeVisible();

    // Check the tell
    await expect(page.getByText("The Tell")).toBeVisible();
    await expect(
      page.getByText("Furthermore, it is important to note that")
    ).toBeVisible();
  });

  // 6. Error handling - server 500
  test("displays error message on server error", async ({ page }) => {
    await page.route("**/api/analyze", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Something went wrong. Please try again." }),
      })
    );

    await page.goto("/");
    await page.locator("textarea").fill(SAMPLE_TEXT);
    await page.getByRole("button", { name: "Analyze" }).click();

    await expect(
      page.getByText("Something went wrong. Please try again.")
    ).toBeVisible({ timeout: 10000 });
  });

  // 7. Rate limit 429 handling
  test("displays rate limit error on 429", async ({ page }) => {
    await page.route("**/api/analyze", (route) =>
      route.fulfill({
        status: 429,
        contentType: "application/json",
        body: JSON.stringify({
          error: "Rate limit exceeded. Try again in a minute.",
        }),
      })
    );

    await page.goto("/");
    await page.locator("textarea").fill(SAMPLE_TEXT);
    await page.getByRole("button", { name: "Analyze" }).click();

    await expect(
      page.getByText("Rate limit exceeded. Try again in a minute.")
    ).toBeVisible({ timeout: 10000 });
  });

  // 8. Footer is present
  test("footer displays disclaimer text", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByText("Built for vibes, not accuracy")
    ).toBeVisible();
  });

  // 9. OG meta tags are present
  test("page has correct OG meta tags", async ({ page }) => {
    await page.goto("/");

    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveAttribute("content", "WasThatAI?");

    const ogDescription = page.locator('meta[property="og:description"]');
    await expect(ogDescription).toHaveAttribute(
      "content",
      "Paste any text. Get the brutal truth about whether it was written by a human or an AI."
    );

    const ogType = page.locator('meta[property="og:type"]');
    await expect(ogType).toHaveAttribute("content", "website");
  });

  // 10. Mobile responsive - viewport test
  test("layout is responsive on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X
    await page.goto("/");

    // Title and core elements should still be visible
    await expect(page.locator("h1")).toContainText("WasThatAI?");
    await expect(page.locator("textarea")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Analyze" })
    ).toBeVisible();

    // Textarea should be full width (within viewport)
    const textareaBox = await page.locator("textarea").boundingBox();
    expect(textareaBox).toBeTruthy();
    expect(textareaBox!.width).toBeGreaterThan(300);
    expect(textareaBox!.width).toBeLessThanOrEqual(375);

    // Footer still visible
    await expect(
      page.getByText("Built for vibes, not accuracy")
    ).toBeVisible();
  });
});
