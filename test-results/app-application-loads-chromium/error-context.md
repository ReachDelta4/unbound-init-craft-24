# Test info

- Name: application loads
- Location: D:\Delta IV\Sofwares\meeting-mojo-ui-1\tests\app.spec.ts:3:1

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toHaveTitle(expected)

Locator: locator(':root')
Expected pattern: /Meeting Mojo/
Received string:  "Invisible AI Meeting Assistant"
Call log:
  - expect.toHaveTitle with timeout 5000ms
  - waiting for locator(':root')
    8 × locator resolved to <html lang="en" class="dark">…</html>
      - unexpected value "Invisible AI Meeting Assistant"

    at D:\Delta IV\Sofwares\meeting-mojo-ui-1\tests\app.spec.ts:7:22
```

# Page snapshot

```yaml
- region "Notifications (F8)":
  - list
- button "Sign In to Continue"
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | test('application loads', async ({ page }) => {
   4 |   await page.goto('/');
   5 |   
   6 |   // Check if the page title is correct
>  7 |   await expect(page).toHaveTitle(/Meeting Mojo/);
     |                      ^ Error: Timed out 5000ms waiting for expect(locator).toHaveTitle(expected)
   8 |   
   9 |   // Check if the page has loaded by verifying a key element is present
  10 |   await expect(page.locator('body')).toBeVisible();
  11 | }); 
```